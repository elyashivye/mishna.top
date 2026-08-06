<?php
require __DIR__ . '/../app/auth.php';
require __DIR__ . '/../app/functions.php';
require __DIR__ . '/../app/services/whatsapp_service.php';
require __DIR__ . '/../app/services/email_service.php';

$user = requireLogin();
$userId = (int) $user['id'];

$success = null;
$error = null;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!verifyCsrf()) {
        $error = 'הבקשה פגה, נסו שוב.';
    } else {
        $phone = trim($_POST['phone_e164'] ?? '');
        if (!empty($_POST['whatsapp_enabled']) && !preg_match('/^\+?[0-9]{9,15}$/', $phone)) {
            $error = 'מספר טלפון לא תקין. יש להזין בפורמט בינלאומי, לדוגמה: +972501234567';
        } else {
            saveNotificationPreferences($userId, [
                'whatsapp_enabled' => !empty($_POST['whatsapp_enabled']),
                'phone_e164' => $phone,
                'email_enabled' => !empty($_POST['email_enabled']),
                'frequency' => $_POST['frequency'] ?? 'off',
            ]);
            $success = 'ההעדפות נשמרו בהצלחה.';
        }
    }
}

$prefs = getNotificationPreferences($userId);

$pageTitle = 'תזכורות — משנה של נשמה';
include __DIR__ . '/../app/partials/page_start.php';
?>

<div class="mt-4 max-w-xl">
    <h1 class="font-bold text-navy text-xl mb-1 flex items-center gap-2"><?= icon('mail', 'w-6 h-6 text-gold') ?> תזכורות</h1>
    <p class="text-ink/60 text-sm mb-6">בחרו איך ומתי תרצו שנזכיר לכם ללמוד.</p>

    <?php if ($error): ?>
        <div class="mb-4 rounded-lg bg-red-50 text-red-700 text-sm px-4 py-3"><?= h($error) ?></div>
    <?php endif; ?>
    <?php if ($success): ?>
        <div class="mb-4 rounded-lg bg-green-50 text-green-700 text-sm px-4 py-3"><?= h($success) ?></div>
    <?php endif; ?>

    <form method="post" class="card space-y-6">
        <?= csrfField() ?>

        <div>
            <label class="flex items-center justify-between">
                <span class="font-semibold text-navy flex items-center gap-2"><?= icon('share', 'w-5 h-5') ?> תזכורת WhatsApp</span>
                <input type="checkbox" name="whatsapp_enabled" value="1" <?= $prefs['whatsapp_enabled'] ? 'checked' : '' ?> class="w-5 h-5">
            </label>
            <?php if (!isWhatsAppConfigured()): ?>
                <p class="text-xs text-amber-600 mt-1">שירות ה-WhatsApp טרם הוגדר באתר על ידי המפעיל — ההעדפה תישמר אך הודעות לא יישלחו עד שיוגדר.</p>
            <?php endif; ?>
            <input type="tel" name="phone_e164" placeholder="+972501234567" value="<?= h($prefs['phone_e164'] ?? '') ?>"
                   class="mt-2 w-full rounded-lg border border-gray-200 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-gold">
        </div>

        <div class="border-t border-gray-100 pt-5">
            <label class="flex items-center justify-between">
                <span class="font-semibold text-navy flex items-center gap-2"><?= icon('mail', 'w-5 h-5') ?> תזכורת במייל</span>
                <input type="checkbox" name="email_enabled" value="1" <?= $prefs['email_enabled'] ? 'checked' : '' ?> class="w-5 h-5">
            </label>
            <p class="text-xs text-ink/50 mt-1">יישלח לכתובת <?= h($user['email']) ?></p>
        </div>

        <div class="border-t border-gray-100 pt-5">
            <span class="font-semibold text-navy block mb-3">תדירות</span>
            <div class="space-y-2">
                <label class="flex items-center gap-2 text-sm">
                    <input type="radio" name="frequency" value="off" <?= $prefs['frequency'] === 'off' ? 'checked' : '' ?>> כבוי
                </label>
                <label class="flex items-center gap-2 text-sm">
                    <input type="radio" name="frequency" value="daily_if_behind" <?= $prefs['frequency'] === 'daily_if_behind' ? 'checked' : '' ?>>
                    יומי — רק אם לא עדכנתי היום
                </label>
                <label class="flex items-center gap-2 text-sm">
                    <input type="radio" name="frequency" value="weekly_summary" <?= $prefs['frequency'] === 'weekly_summary' ? 'checked' : '' ?>>
                    סיכום שבועי קבוע
                </label>
            </div>
        </div>

        <button type="submit" class="w-full bg-navy text-white rounded-lg py-3 font-semibold hover:bg-navy-light transition">
            שמירת העדפות
        </button>
    </form>
</div>

<?php include __DIR__ . '/../app/partials/page_end.php'; ?>
