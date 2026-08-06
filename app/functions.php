<?php
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/icons.php';
require_once __DIR__ . '/hebrew_date.php';

function h(?string $s): string
{
    return htmlspecialchars((string) $s, ENT_QUOTES, 'UTF-8');
}

/** מוגן מפני open-redirect: מאפשר רק נתיבים יחסיים שמתחילים ב-/ (לא //evil.com). */
function safeNextUrl(?string $next, string $default = '/pages.php'): string
{
    if (!$next || !str_starts_with($next, '/') || str_starts_with($next, '//')) {
        return $default;
    }
    return $next;
}

/* ===================== התקדמות אישית (גלובלית, לא תלויה בעמוד) ===================== */

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
    $stmt = $pdo->prepare('INSERT IGNORE INTO user_progress (user_id, mishna_id) VALUES (:u, :m)');
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
    $stmt = db()->prepare(
        'SELECT COUNT(*) FROM tractates t
         WHERE t.mishna_count > 0 AND t.mishna_count = (
             SELECT COUNT(*) FROM user_progress up JOIN mishnayot m ON m.id = up.mishna_id
             WHERE m.tractate_id = t.id AND up.user_id = :u
         )'
    );
    $stmt->execute([':u' => $userId]);
    return (int) $stmt->fetchColumn();
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

/* ===================== עמודי לימוד (study pages / קבוצות / הקדשות) ===================== */

function computeTargetEndDate(string $pace, string $startDate, ?string $customDate): string
{
    $start = new DateTime($startDate);
    return match ($pace) {
        'six_years' => (clone $start)->modify('+6 years')->format('Y-m-d'),
        'custom' => $customDate ?: (clone $start)->modify('+1 year')->format('Y-m-d'),
        default => (clone $start)->modify('+1 year')->format('Y-m-d'),
    };
}

function generateInviteCode(): string
{
    $chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // בלי תווים דומים (0/O, 1/I)
    $pdo = db();
    do {
        $code = '';
        for ($i = 0; $i < 8; $i++) {
            $code .= $chars[random_int(0, strlen($chars) - 1)];
        }
        $stmt = $pdo->prepare('SELECT 1 FROM study_pages WHERE invite_code = :c');
        $stmt->execute([':c' => $code]);
    } while ($stmt->fetchColumn());
    return $code;
}

/**
 * גוזר את שדות התאריך העברי לשמירה מתוך קלט הטופס. שני מצבי קלט אפשריים:
 * 'gregorian' (תאריך לועזי מדויק, ממנו נגזר התאריך העברי המקביל) או
 * 'hebrew' (יום+חודש עברי ישירות, ללא תאריך לועזי ידוע).
 */
function resolveDedicationDateFields(array $data): array
{
    $mode = $data['date_input_mode'] ?? '';
    if ($mode === 'gregorian' && !empty($data['passing_date_gregorian'])) {
        $date = new DateTime($data['passing_date_gregorian']);
        $parts = isHebrewCalendarAvailable() ? gregorianToHebrewParts($date) : null;
        return [
            'passing_date_gregorian' => $date->format('Y-m-d'),
            'passing_hebrew_month' => $parts['month_name'] ?? null,
            'passing_hebrew_day' => $parts['day'] ?? null,
        ];
    }
    if ($mode === 'hebrew' && !empty($data['passing_hebrew_month']) && !empty($data['passing_hebrew_day'])) {
        return [
            'passing_date_gregorian' => null,
            'passing_hebrew_month' => $data['passing_hebrew_month'],
            'passing_hebrew_day' => (int) $data['passing_hebrew_day'],
        ];
    }
    return ['passing_date_gregorian' => null, 'passing_hebrew_month' => null, 'passing_hebrew_day' => null];
}

function createStudyPage(int $ownerUserId, array $data): int
{
    $pdo = db();
    $startDate = date('Y-m-d');
    $targetEndDate = computeTargetEndDate($data['pace'], $startDate, $data['custom_end_date'] ?? null);
    $mode = ($data['mode'] ?? 'solo') === 'group' ? 'group' : 'solo';
    $inviteCode = $mode === 'group' ? generateInviteCode() : null;
    $dateFields = resolveDedicationDateFields($data);

    $pdo->beginTransaction();
    $stmt = $pdo->prepare(
        'INSERT INTO study_pages (owner_user_id, name_he, passing_date_gregorian, passing_hebrew_month, passing_hebrew_day, dtype, notes, mode, pace, start_date, target_end_date, invite_code)
         VALUES (:owner, :name, :dategreg, :hemonth, :heday, :type, :notes, :mode, :pace, :start, :end, :code)'
    );
    $stmt->execute([
        ':owner' => $ownerUserId,
        ':name' => $data['name_he'],
        ':dategreg' => $dateFields['passing_date_gregorian'],
        ':hemonth' => $dateFields['passing_hebrew_month'],
        ':heday' => $dateFields['passing_hebrew_day'],
        ':type' => in_array($data['dtype'] ?? '', ['neshama', 'refuah'], true) ? $data['dtype'] : 'neshama',
        ':notes' => $data['notes'] ?: null,
        ':mode' => $mode,
        ':pace' => in_array($data['pace'] ?? '', ['year', 'six_years', 'custom'], true) ? $data['pace'] : 'year',
        ':start' => $startDate,
        ':end' => $targetEndDate,
        ':code' => $inviteCode,
    ]);
    $pageId = (int) $pdo->lastInsertId();

    $pdo->prepare('INSERT INTO study_page_members (study_page_id, user_id, role) VALUES (:p, :u, "owner")')
        ->execute([':p' => $pageId, ':u' => $ownerUserId]);

    if ($mode === 'solo') {
        $tractateIds = $pdo->query('SELECT id FROM tractates')->fetchAll(PDO::FETCH_COLUMN);
        $claimStmt = $pdo->prepare('INSERT IGNORE INTO tractate_claims (study_page_id, tractate_id, user_id) VALUES (:p, :t, :u)');
        foreach ($tractateIds as $tid) {
            $claimStmt->execute([':p' => $pageId, ':t' => $tid, ':u' => $ownerUserId]);
        }
    }

    $pdo->commit();

    if ($mode === 'solo') {
        generateMemberSchedule($pageId, $ownerUserId);
    }

    return $pageId;
}

/**
 * מחזיר מידע תצוגה על תאריך ההקדשה: מחרוזת עברית, תאריך לועזי (אם ידוע),
 * והיארצייט/אזכרה הבאה (אם יש חודש+יום עברי שמורים). null אם אין תאריך כלל.
 */
function getDedicationDateDisplay(array $page): ?array
{
    $month = $page['passing_hebrew_month'] ?? null;
    $day = $page['passing_hebrew_day'] ?? null;
    if (!$month || !$day) {
        return null;
    }
    $hebrewDisplay = formatHebrewDayMonth($month, (int) $day);
    $nextOccurrence = isHebrewCalendarAvailable() ? findNextHebrewAnniversary($month, (int) $day) : null;
    $daysUntil = $nextOccurrence ? (int) (new DateTime('today'))->diff($nextOccurrence)->days : null;

    return [
        'hebrew_display' => $hebrewDisplay,
        'gregorian_display' => $page['passing_date_gregorian'] ?? null,
        'next_occurrence' => $nextOccurrence,
        'days_until' => $daysUntil,
    ];
}

function getStudyPage(int $id): ?array
{
    $stmt = db()->prepare('SELECT * FROM study_pages WHERE id = :id');
    $stmt->execute([':id' => $id]);
    return $stmt->fetch() ?: null;
}

function getStudyPageByInviteCode(string $code): ?array
{
    $stmt = db()->prepare('SELECT * FROM study_pages WHERE invite_code = :c');
    $stmt->execute([':c' => $code]);
    return $stmt->fetch() ?: null;
}

function isPageMember(int $studyPageId, int $userId): bool
{
    $stmt = db()->prepare('SELECT 1 FROM study_page_members WHERE study_page_id = :p AND user_id = :u');
    $stmt->execute([':p' => $studyPageId, ':u' => $userId]);
    return (bool) $stmt->fetchColumn();
}

function joinStudyPage(int $studyPageId, int $userId): array
{
    if (isPageMember($studyPageId, $userId)) {
        return ['ok' => true];
    }
    $stmt = db()->prepare('INSERT INTO study_page_members (study_page_id, user_id, role) VALUES (:p, :u, "member")');
    $stmt->execute([':p' => $studyPageId, ':u' => $userId]);
    return ['ok' => true];
}

function getUserStudyPages(int $userId): array
{
    $stmt = db()->prepare(
        'SELECT sp.*, spm.role,
                (SELECT COUNT(*) FROM study_page_members m2 WHERE m2.study_page_id = sp.id) AS member_count
         FROM study_pages sp
         JOIN study_page_members spm ON spm.study_page_id = sp.id
         WHERE spm.user_id = :u
         ORDER BY sp.created_at DESC'
    );
    $stmt->execute([':u' => $userId]);
    $pages = $stmt->fetchAll();
    foreach ($pages as &$p) {
        $p['stats'] = getPageStats((int) $p['id'], $userId);
    }
    return $pages;
}

/** התקדמות המשתמש הנוכחי בעמוד: רק מתוך המסכתות שהוא עצמו תפס בעמוד הזה. */
function getPageStats(int $studyPageId, int $userId): array
{
    $pdo = db();
    $stmt = $pdo->prepare(
        'SELECT COUNT(m.id) FROM mishnayot m
         JOIN tractate_claims tc ON tc.tractate_id = m.tractate_id
         WHERE tc.study_page_id = :p AND tc.user_id = :u'
    );
    $stmt->execute([':p' => $studyPageId, ':u' => $userId]);
    $total = (int) $stmt->fetchColumn();

    $stmt2 = $pdo->prepare(
        'SELECT COUNT(*) FROM user_progress up
         JOIN mishnayot m ON m.id = up.mishna_id
         JOIN tractate_claims tc ON tc.tractate_id = m.tractate_id AND tc.study_page_id = :p AND tc.user_id = :u2
         WHERE up.user_id = :u'
    );
    $stmt2->execute([':p' => $studyPageId, ':u' => $userId, ':u2' => $userId]);
    $learned = (int) $stmt2->fetchColumn();

    return [
        'total' => $total,
        'learned' => $learned,
        'percent' => $total > 0 ? round(($learned / $total) * 100) : 0,
    ];
}

/** התקדמות מצטברת של כל הקבוצה בעמוד (סכום כל החברים, כל אחד מול מה שהוא תפס). */
function getPageGroupStats(int $studyPageId): array
{
    $pdo = db();
    $stmt = $pdo->prepare(
        'SELECT COUNT(m.id) FROM mishnayot m
         JOIN tractate_claims tc ON tc.tractate_id = m.tractate_id
         WHERE tc.study_page_id = :p'
    );
    $stmt->execute([':p' => $studyPageId]);
    $total = (int) $stmt->fetchColumn();

    $stmt2 = $pdo->prepare(
        'SELECT COUNT(*) FROM user_progress up
         JOIN mishnayot m ON m.id = up.mishna_id
         JOIN tractate_claims tc ON tc.tractate_id = m.tractate_id AND tc.study_page_id = :p AND tc.user_id = up.user_id'
    );
    $stmt2->execute([':p' => $studyPageId]);
    $learned = (int) $stmt2->fetchColumn();

    return [
        'total' => $total,
        'learned' => $learned,
        'percent' => $total > 0 ? round(($learned / $total) * 100) : 0,
    ];
}

function getPageMembers(int $studyPageId): array
{
    $pdo = db();
    $stmt = $pdo->prepare(
        "SELECT spm.user_id, spm.role, spm.joined_at, u.name
         FROM study_page_members spm JOIN users u ON u.id = spm.user_id
         WHERE spm.study_page_id = :p
         ORDER BY (spm.role = 'owner') DESC, spm.joined_at ASC"
    );
    $stmt->execute([':p' => $studyPageId]);
    $members = $stmt->fetchAll();
    foreach ($members as &$m) {
        $m['stats'] = getPageStats($studyPageId, (int) $m['user_id']);
        $claimStmt = $pdo->prepare(
            'SELECT t.name_he FROM tractate_claims tc JOIN tractates t ON t.id = tc.tractate_id
             WHERE tc.study_page_id = :p AND tc.user_id = :u ORDER BY t.sort_order'
        );
        $claimStmt->execute([':p' => $studyPageId, ':u' => $m['user_id']]);
        $m['claimed_tractates'] = $claimStmt->fetchAll(PDO::FETCH_COLUMN);
    }
    return $members;
}

function getMyClaimedTractatesWithProgress(int $studyPageId, int $userId): array
{
    $stmt = db()->prepare(
        'SELECT t.*, COUNT(up.id) AS learned
         FROM tractate_claims tc
         JOIN tractates t ON t.id = tc.tractate_id
         LEFT JOIN mishnayot m ON m.tractate_id = t.id
         LEFT JOIN user_progress up ON up.mishna_id = m.id AND up.user_id = :u
         WHERE tc.study_page_id = :p AND tc.user_id = :u2
         GROUP BY t.id
         ORDER BY t.sort_order'
    );
    $stmt->execute([':p' => $studyPageId, ':u' => $userId, ':u2' => $userId]);
    return $stmt->fetchAll();
}

function getPageTractatesWithClaimStatus(int $studyPageId, int $currentUserId): array
{
    $stmt = db()->prepare(
        'SELECT t.*, tc.user_id AS claimed_by_id, u.name AS claimed_by_name
         FROM tractates t
         LEFT JOIN tractate_claims tc ON tc.tractate_id = t.id AND tc.study_page_id = :p
         LEFT JOIN users u ON u.id = tc.user_id
         ORDER BY t.sort_order ASC'
    );
    $stmt->execute([':p' => $studyPageId]);
    $rows = $stmt->fetchAll();
    foreach ($rows as &$r) {
        $r['is_mine'] = $r['claimed_by_id'] !== null && (int) $r['claimed_by_id'] === $currentUserId;
    }
    return $rows;
}

function claimTractate(int $studyPageId, int $userId, int $tractateId): array
{
    $pdo = db();
    try {
        $stmt = $pdo->prepare('INSERT INTO tractate_claims (study_page_id, tractate_id, user_id) VALUES (:p, :t, :u)');
        $stmt->execute([':p' => $studyPageId, ':t' => $tractateId, ':u' => $userId]);
    } catch (PDOException $e) {
        if ((string) $e->getCode() === '23000') {
            return ['ok' => false, 'error' => 'מסכת זו כבר נתפסה על ידי מישהו אחר.'];
        }
        throw $e;
    }
    generateMemberSchedule($studyPageId, $userId);
    return ['ok' => true];
}

function unclaimTractate(int $studyPageId, int $userId, int $tractateId): void
{
    $stmt = db()->prepare('DELETE FROM tractate_claims WHERE study_page_id = :p AND tractate_id = :t AND user_id = :u');
    $stmt->execute([':p' => $studyPageId, ':t' => $tractateId, ':u' => $userId]);
    generateMemberSchedule($studyPageId, $userId);
}

/**
 * בונה מחדש את לוח הלימוד האישי (מהיום קדימה בלבד — לא נוגע בעבר) של חבר בעמוד,
 * מתוך המשניות שטרם נלמדו במסכתות שתפס, פרושות שווה בשווה עד target_end_date.
 */
function generateMemberSchedule(int $studyPageId, int $userId): void
{
    $pdo = db();
    $page = getStudyPage($studyPageId);
    if (!$page) {
        return;
    }
    $today = date('Y-m-d');

    $pdo->prepare('DELETE FROM member_schedule WHERE study_page_id = :p AND user_id = :u AND study_date >= :d')
        ->execute([':p' => $studyPageId, ':u' => $userId, ':d' => $today]);

    $stmt = $pdo->prepare(
        'SELECT m.id FROM mishnayot m
         JOIN tractate_claims tc ON tc.tractate_id = m.tractate_id AND tc.study_page_id = :p AND tc.user_id = :u
         LEFT JOIN user_progress up ON up.mishna_id = m.id AND up.user_id = :u2
         WHERE up.id IS NULL
         ORDER BY m.sort_order ASC'
    );
    $stmt->execute([':p' => $studyPageId, ':u' => $userId, ':u2' => $userId]);
    $remaining = $stmt->fetchAll(PDO::FETCH_COLUMN);
    $total = count($remaining);
    if ($total === 0) {
        return;
    }

    $endDateStr = max($page['target_end_date'], $today);
    $startDate = new DateTime($today);
    $endDate = new DateTime($endDateStr);
    $numDays = (int) $startDate->diff($endDate)->days + 1;
    if ($numDays < 1) {
        $numDays = 1;
    }

    $insert = $pdo->prepare(
        'INSERT IGNORE INTO member_schedule (study_page_id, user_id, study_date, mishna_id) VALUES (:p, :u, :d, :m)'
    );

    // פיזור פרופורציונלי אחיד (cumulative-boundary): עובד נכון גם כשיש הרבה יותר
    // ימים ממשניות (למשל מסכת קטנה על פני 6 שנים) וגם כשיש הרבה יותר משניות מימים —
    // בניגוד לחלוקת ceil() פשוטה, לא "דוחס" את כל התוכן לימים הראשונים.
    $idx = 0;
    $date = clone $startDate;
    for ($day = 0; $day < $numDays; $day++) {
        $cumulativeBefore = intdiv($day * $total, $numDays);
        $cumulativeAfter = intdiv(($day + 1) * $total, $numDays);
        $countToday = $cumulativeAfter - $cumulativeBefore;
        for ($j = 0; $j < $countToday && $idx < $total; $j++) {
            $insert->execute([
                ':p' => $studyPageId, ':u' => $userId,
                ':d' => $date->format('Y-m-d'), ':m' => $remaining[$idx],
            ]);
            $idx++;
        }
        $date->modify('+1 day');
    }
}

function getMemberTodayMishna(int $studyPageId, int $userId, ?string $date = null): ?array
{
    $date = $date ?? date('Y-m-d');
    $pdo = db();
    $stmt = $pdo->prepare(
        'SELECT ms.study_date, m.*, t.name_he AS tractate_name, t.slug AS tractate_slug
         FROM member_schedule ms
         JOIN mishnayot m ON m.id = ms.mishna_id
         JOIN tractates t ON t.id = m.tractate_id
         WHERE ms.study_page_id = :p AND ms.user_id = :u AND ms.study_date = :d'
    );
    $stmt->execute([':p' => $studyPageId, ':u' => $userId, ':d' => $date]);
    $row = $stmt->fetch();
    if ($row) {
        return $row;
    }
    $stmt2 = $pdo->prepare(
        'SELECT ms.study_date, m.*, t.name_he AS tractate_name, t.slug AS tractate_slug
         FROM member_schedule ms
         JOIN mishnayot m ON m.id = ms.mishna_id
         JOIN tractates t ON t.id = m.tractate_id
         WHERE ms.study_page_id = :p AND ms.user_id = :u
         ORDER BY ABS(DATEDIFF(ms.study_date, :d)) ASC
         LIMIT 1'
    );
    $stmt2->execute([':p' => $studyPageId, ':u' => $userId, ':d' => $date]);
    return $stmt2->fetch() ?: null;
}

function getMemberScheduleUpcoming(int $studyPageId, int $userId, int $limit = 14): array
{
    $stmt = db()->prepare(
        'SELECT ms.study_date, m.chapter, m.mishna_num, t.name_he AS tractate_name, t.slug
         FROM member_schedule ms
         JOIN mishnayot m ON m.id = ms.mishna_id
         JOIN tractates t ON t.id = m.tractate_id
         WHERE ms.study_page_id = :p AND ms.user_id = :u AND ms.study_date >= :today
         ORDER BY ms.study_date ASC
         LIMIT ' . (int) $limit
    );
    $stmt->execute([':p' => $studyPageId, ':u' => $userId, ':today' => date('Y-m-d')]);
    return $stmt->fetchAll();
}

/* ===================== עמוד "נוכחי" בסשן (ניווט בין עמודי לימוד) ===================== */

function getCurrentPageId(): ?int
{
    return isset($_SESSION['current_page_id']) ? (int) $_SESSION['current_page_id'] : null;
}

function setCurrentPageId(int $id): void
{
    $_SESSION['current_page_id'] = $id;
}

/** מחזיר את עמוד הלימוד הפעיל של המשתמש בסשן, או בוחר אוטומטית/מפנה ל-pages.php אם אין. */
function requireCurrentPage(int $userId): array
{
    $pageId = getCurrentPageId();
    if ($pageId) {
        $page = getStudyPage($pageId);
        if ($page && isPageMember($pageId, $userId)) {
            return $page;
        }
    }
    $pages = getUserStudyPages($userId);
    if ($pages) {
        setCurrentPageId((int) $pages[0]['id']);
        return $pages[0];
    }
    header('Location: /pages.php');
    exit;
}

/* ===================== העדפות תזכורות ===================== */

function getNotificationPreferences(int $userId): array
{
    $stmt = db()->prepare('SELECT * FROM notification_preferences WHERE user_id = :u');
    $stmt->execute([':u' => $userId]);
    $row = $stmt->fetch();
    return $row ?: [
        'user_id' => $userId,
        'whatsapp_enabled' => 0,
        'phone_e164' => '',
        'email_enabled' => 0,
        'frequency' => 'off',
    ];
}

function saveNotificationPreferences(int $userId, array $data): void
{
    $stmt = db()->prepare(
        'INSERT INTO notification_preferences (user_id, whatsapp_enabled, phone_e164, email_enabled, frequency)
         VALUES (:u, :wa, :phone, :em, :freq)
         ON DUPLICATE KEY UPDATE whatsapp_enabled=VALUES(whatsapp_enabled), phone_e164=VALUES(phone_e164),
           email_enabled=VALUES(email_enabled), frequency=VALUES(frequency)'
    );
    $stmt->execute([
        ':u' => $userId,
        ':wa' => !empty($data['whatsapp_enabled']) ? 1 : 0,
        ':phone' => trim($data['phone_e164'] ?? '') ?: null,
        ':em' => !empty($data['email_enabled']) ? 1 : 0,
        ':freq' => in_array($data['frequency'] ?? '', ['off', 'daily_if_behind', 'weekly_summary'], true) ? $data['frequency'] : 'off',
    ]);
}
