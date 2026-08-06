<?php
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/icons.php';

function h(?string $s): string
{
    return htmlspecialchars((string) $s, ENT_QUOTES, 'UTF-8');
}

function getTodayMishna(?string $date = null): ?array
{
    $date = $date ?? date('Y-m-d');
    $pdo = db();
    $stmt = $pdo->prepare(
        'SELECT dc.study_date, m.*, t.name_he AS tractate_name, t.slug AS tractate_slug
         FROM daily_cycle dc
         JOIN mishnayot m ON m.id = dc.mishna_id
         JOIN tractates t ON t.id = m.tractate_id
         WHERE dc.study_date = :d'
    );
    $stmt->execute([':d' => $date]);
    $row = $stmt->fetch();
    if ($row) {
        return $row;
    }
    // נפילה חזרה: אם התאריך מחוץ לטווח המחזור, קח את היום הקרוב ביותר שקיים.
    $stmt = $pdo->prepare(
        'SELECT dc.study_date, m.*, t.name_he AS tractate_name, t.slug AS tractate_slug
         FROM daily_cycle dc
         JOIN mishnayot m ON m.id = dc.mishna_id
         JOIN tractates t ON t.id = m.tractate_id
         ORDER BY ABS(DATEDIFF(dc.study_date, :d)) ASC
         LIMIT 1'
    );
    $stmt->execute([':d' => $date]);
    $row = $stmt->fetch();
    return $row ?: null;
}

function isMishnaCompletedByUser(int $userId, int $mishnaId): bool
{
    $stmt = db()->prepare('SELECT 1 FROM user_progress WHERE user_id = :u AND mishna_id = :m');
    $stmt->execute([':u' => $userId, ':m' => $mishnaId]);
    return (bool) $stmt->fetchColumn();
}

function bumpStreakIfNeeded(int $userId): void
{
    $pdo = db();
    $stmt = $pdo->prepare('SELECT streak_count, longest_streak, last_study_date FROM users WHERE id = :id');
    $stmt->execute([':id' => $userId]);
    $user = $stmt->fetch();
    if (!$user) {
        return;
    }
    $today = new DateTime(date('Y-m-d'));
    $last = $user['last_study_date'] ? new DateTime($user['last_study_date']) : null;

    if ($last !== null && $last->format('Y-m-d') === $today->format('Y-m-d')) {
        return; // כבר נספר היום
    }

    $isConsecutive = false;
    if ($last !== null) {
        $yesterday = (clone $today)->modify('-1 day');
        $isConsecutive = $last->format('Y-m-d') === $yesterday->format('Y-m-d');
    }

    $newStreak = $isConsecutive ? ((int) $user['streak_count'] + 1) : 1;
    $newLongest = max((int) $user['longest_streak'], $newStreak);

    $update = $pdo->prepare(
        'UPDATE users SET streak_count = :s, longest_streak = :l, last_study_date = :d WHERE id = :id'
    );
    $update->execute([
        ':s' => $newStreak,
        ':l' => $newLongest,
        ':d' => $today->format('Y-m-d'),
        ':id' => $userId,
    ]);
}

function markMishnaComplete(int $userId, int $mishnaId): void
{
    $pdo = db();
    $stmt = $pdo->prepare(
        'INSERT IGNORE INTO user_progress (user_id, mishna_id) VALUES (:u, :m)'
    );
    $stmt->execute([':u' => $userId, ':m' => $mishnaId]);
    if ($stmt->rowCount() > 0) {
        bumpStreakIfNeeded($userId);
        checkAndAwardAchievements($userId);
    }
}

function unmarkMishnaComplete(int $userId, int $mishnaId): void
{
    $stmt = db()->prepare('DELETE FROM user_progress WHERE user_id = :u AND mishna_id = :m');
    $stmt->execute([':u' => $userId, ':m' => $mishnaId]);
}

function getUserStats(int $userId): array
{
    $pdo = db();
    $total = (int) $pdo->query('SELECT COUNT(*) FROM mishnayot')->fetchColumn();
    $stmt = $pdo->prepare('SELECT COUNT(*) FROM user_progress WHERE user_id = :u');
    $stmt->execute([':u' => $userId]);
    $learned = (int) $stmt->fetchColumn();

    $stmt = $pdo->prepare('SELECT streak_count, longest_streak FROM users WHERE id = :id');
    $stmt->execute([':id' => $userId]);
    $user = $stmt->fetch();

    return [
        'total_mishnayot' => $total,
        'learned' => $learned,
        'percent' => $total > 0 ? round(($learned / $total) * 100) : 0,
        'streak' => (int) ($user['streak_count'] ?? 0),
        'longest_streak' => (int) ($user['longest_streak'] ?? 0),
    ];
}

function getTractateProgress(int $userId): array
{
    $stmt = db()->prepare(
        'SELECT t.id, t.seder, t.seder_he, t.name_he, t.slug, t.mishna_count,
                COUNT(up.id) AS learned
         FROM tractates t
         LEFT JOIN mishnayot m ON m.tractate_id = t.id
         LEFT JOIN user_progress up ON up.mishna_id = m.id AND up.user_id = :u
         GROUP BY t.id
         ORDER BY t.sort_order ASC'
    );
    $stmt->execute([':u' => $userId]);
    return $stmt->fetchAll();
}

function checkAndAwardAchievements(int $userId): void
{
    $pdo = db();
    $stats = getUserStats($userId);

    $earnedCodes = $pdo->prepare(
        'SELECT a.code FROM user_achievements ua JOIN achievements a ON a.id = ua.achievement_id WHERE ua.user_id = :u'
    );
    $earnedCodes->execute([':u' => $userId]);
    $already = $earnedCodes->fetchAll(PDO::FETCH_COLUMN);

    $achievements = $pdo->query('SELECT * FROM achievements')->fetchAll();
    $toAward = [];

    foreach ($achievements as $a) {
        if (in_array($a['code'], $already, true)) {
            continue;
        }
        $earned = match ($a['criteria_type']) {
            'streak' => $stats['streak'] >= (int) $a['criteria_value'],
            'total_mishnayot' => $stats['learned'] >= (int) $a['criteria_value'],
            'tractate_complete' => tractateCompletedCount($userId) >= (int) $a['criteria_value'],
            default => false,
        };
        if ($earned) {
            $toAward[] = $a['id'];
        }
    }

    if ($toAward) {
        $insert = $pdo->prepare('INSERT IGNORE INTO user_achievements (user_id, achievement_id) VALUES (:u, :a)');
        foreach ($toAward as $achievementId) {
            $insert->execute([':u' => $userId, ':a' => $achievementId]);
        }
    }
}

function tractateCompletedCount(int $userId): int
{
    $rows = getTractateProgress($userId);
    $count = 0;
    foreach ($rows as $r) {
        if ((int) $r['mishna_count'] > 0 && (int) $r['learned'] >= (int) $r['mishna_count']) {
            $count++;
        }
    }
    return $count;
}

function getTractateBySlug(string $slug): ?array
{
    $stmt = db()->prepare('SELECT * FROM tractates WHERE slug = :slug');
    $stmt->execute([':slug' => $slug]);
    return $stmt->fetch() ?: null;
}

function getMishnayotForTractate(int $tractateId, int $userId): array
{
    $stmt = db()->prepare(
        'SELECT m.*, up.id AS progress_id
         FROM mishnayot m
         LEFT JOIN user_progress up ON up.mishna_id = m.id AND up.user_id = :u
         WHERE m.tractate_id = :t
         ORDER BY m.chapter ASC, m.mishna_num ASC'
    );
    $stmt->execute([':u' => $userId, ':t' => $tractateId]);
    return $stmt->fetchAll();
}

function getUserStudyDaysInMonth(int $userId, string $yearMonth): array
{
    $stmt = db()->prepare(
        "SELECT DISTINCT DATE(completed_at) AS d FROM user_progress
         WHERE user_id = :u AND DATE_FORMAT(completed_at, '%Y-%m') = :ym"
    );
    $stmt->execute([':u' => $userId, ':ym' => $yearMonth]);
    return $stmt->fetchAll(PDO::FETCH_COLUMN);
}

function getUserDedications(int $userId): array
{
    $stmt = db()->prepare('SELECT * FROM dedications WHERE user_id = :u ORDER BY is_primary DESC, created_at ASC');
    $stmt->execute([':u' => $userId]);
    return $stmt->fetchAll();
}

function getPrimaryDedication(int $userId): ?array
{
    $stmt = db()->prepare(
        'SELECT * FROM dedications WHERE user_id = :u ORDER BY is_primary DESC, created_at ASC LIMIT 1'
    );
    $stmt->execute([':u' => $userId]);
    return $stmt->fetch() ?: null;
}

const FOOTER_QUOTES = [
    ['text' => 'גדול תלמוד שמביא לידי מעשה', 'source' => 'משנה, מסכת קידושין פרק א'],
    ['text' => 'הוי מתלמידיו של אהרן, אוהב שלום ורודף שלום, אוהב את הבריות ומקרבן לתורה', 'source' => 'משנה, מסכת אבות פרק א'],
    ['text' => 'אם אין אני לי מי לי, וכשאני לעצמי מה אני, ואם לא עכשיו אימתי', 'source' => 'משנה, מסכת אבות פרק א'],
    ['text' => 'איזהו חכם? הלומד מכל אדם', 'source' => 'משנה, מסכת אבות פרק ד'],
    ['text' => 'לא עליך המלאכה לגמור, ולא אתה בן חורין להיבטל ממנה', 'source' => 'משנה, מסכת אבות פרק ב'],
    ['text' => 'על שלושה דברים העולם עומד: על התורה, ועל העבודה, ועל גמילות חסדים', 'source' => 'משנה, מסכת אבות פרק א'],
    ['text' => 'עשה לך רב, וקנה לך חבר, והוי דן את כל האדם לכף זכות', 'source' => 'משנה, מסכת אבות פרק א'],
];

function randomFooterQuote(): array
{
    return FOOTER_QUOTES[array_rand(FOOTER_QUOTES)];
}
