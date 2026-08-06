<?php
/**
 * סקריפט CLI יומי לשליחת תזכורות (WhatsApp + מייל) לפי העדפות המשתמשים.
 * מיועד להרצה פעם ביום דרך Cron Jobs בהוסטינגר (ראו README).
 *
 * הרצה: php cron/send_reminders.php [--dry-run]
 *
 * --dry-run: מדפיס למי הייתה נשלחת תזכורת ובאיזה ערוץ, בלי לשלוח בפועל ובלי לרשום
 *            ל-notification_log. שימושי לבדיקה כשאין עדיין חשבון Meta מוגדר.
 */

require __DIR__ . '/../app/db.php';
require __DIR__ . '/../app/functions.php';
require __DIR__ . '/../app/services/whatsapp_service.php';
require __DIR__ . '/../app/services/email_service.php';

$dryRun = in_array('--dry-run', $argv, true);
$today = date('Y-m-d');
$isSunday = date('w') === '0'; // יום לתזכורת שבועית

$pdo = db();
$stmt = $pdo->query(
    "SELECT np.*, u.name, u.email, u.last_study_date
     FROM notification_preferences np
     JOIN users u ON u.id = np.user_id
     WHERE np.frequency != 'off' AND (np.whatsapp_enabled = 1 OR np.email_enabled = 1)"
);
$candidates = $stmt->fetchAll();

echo '[' . $today . '] נמצאו ' . count($candidates) . " משתמשים עם תזכורות פעילות.\n";

foreach ($candidates as $pref) {
    $userId = (int) $pref['user_id'];

    if ($pref['frequency'] === 'weekly_summary' && !$isSunday) {
        continue;
    }
    if ($pref['frequency'] === 'daily_if_behind' && $pref['last_study_date'] === $today) {
        continue; // כבר למד היום
    }

    $pages = getUserStudyPages($userId);
    if (!$pages) {
        continue;
    }

    if ($pref['frequency'] === 'weekly_summary') {
        $totalLearned = array_sum(array_column(array_column($pages, 'stats'), 'learned'));
        $totalMishnayot = array_sum(array_column(array_column($pages, 'stats'), 'total'));
        $subject = 'הסיכום השבועי שלכם — משנה של נשמה';
        $bodyText = "השבוע למדתם {$totalLearned} מתוך {$totalMishnayot} משניות בעמודי הלימוד שלכם. כל הכבוד, המשיכו כך!";
    } else {
        $stats = getUserStats($userId);
        $subject = 'תזכורת ללימוד היום — משנה של נשמה';
        $bodyText = "שלום {$pref['name']}, עדיין לא סימנתם שלמדתם היום. רצף הימים הנוכחי שלכם: {$stats['streak']} ימים — אל תפסידו אותו!";
    }

    foreach (['whatsapp', 'email'] as $channel) {
        $enabled = $channel === 'whatsapp' ? (bool) $pref['whatsapp_enabled'] : (bool) $pref['email_enabled'];
        if (!$enabled) {
            continue;
        }
        if ($channel === 'whatsapp' && empty($pref['phone_e164'])) {
            continue;
        }

        $already = $pdo->prepare(
            "SELECT 1 FROM notification_log WHERE user_id = :u AND channel = :c AND DATE(sent_at) = :d"
        );
        $already->execute([':u' => $userId, ':c' => $channel, ':d' => $today]);
        if ($already->fetchColumn()) {
            continue;
        }

        if ($dryRun) {
            echo "  [DRY-RUN] {$channel} -> {$pref['name']} ({$pref['user_id']}): {$bodyText}\n";
            continue;
        }

        if ($channel === 'whatsapp') {
            $result = sendWhatsAppTemplate($pref['phone_e164'], [$pref['name'], $bodyText]);
        } else {
            $result = sendReminderEmail($pref['email'], $subject, nl2br(htmlspecialchars($bodyText)));
        }

        $log = $pdo->prepare(
            'INSERT INTO notification_log (user_id, channel, status, message_preview) VALUES (:u, :c, :s, :m)'
        );
        $log->execute([
            ':u' => $userId,
            ':c' => $channel,
            ':s' => $result['ok'] ? 'sent' : 'error: ' . substr((string) ($result['error'] ?? ''), 0, 200),
            ':m' => mb_substr($bodyText, 0, 250),
        ]);

        echo "  {$channel} -> {$pref['name']}: " . ($result['ok'] ? 'נשלח' : 'שגיאה — ' . $result['error']) . "\n";
    }
}

echo "הושלם.\n";
