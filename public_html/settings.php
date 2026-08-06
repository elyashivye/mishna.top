<?php
require __DIR__ . '/../app/auth.php';
require __DIR__ . '/../app/functions.php';

$user = requireLogin();
$userId = (int) $user['id'];
$pdo = db();

$error = null;
$success = null;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!verifyCsrf()) {
        $error = 'הבקשה פגה, נסו שוב.';
    } else {
        $action = $_POST['action'] ?? '';

        if ($action === 'update_profile') {
            $name = trim($_POST['name'] ?? '');
            if ($name === '' || mb_strlen($name) > 100) {
                $error = 'נא להזין שם תקין.';
            } else {
                $pdo->prepare('UPDATE users SET name = :name WHERE id = :id')->execute([':name' => $name, ':id' => $userId]);
                $user['name'] = $name;
                $success = 'הפרופיל עודכן בהצלחה.';
            }
        } elseif ($action === 'change_password') {
            $current = $_POST['current_password'] ?? '';
            $new = $_POST['new_password'] ?? '';
            $confirm = $_POST['new_password_confirm'] ?? '';
            if (!password_verify($current, $user['password_hash'])) {
                $error = 'הסיסמה הנוכחית שגויה.';
            } elseif (mb_strlen($new) < 6) {
                $error = 'הסיסמה החדשה חייבת להכיל לפחות 6 תווים.';
            } elseif ($new !== $confirm) {
                $error = 'הסיסמאות החדשות אינן תואמות.';
            } else {
                $pdo->prepare('UPDATE users SET password_hash = :h WHERE id = :id')
                    ->execute([':h' => password_hash($new, PASSWORD_DEFAULT), ':id' => $userId]);
                $success = 'הסיסמה עודכנה בהצלחה.';
            }
        }
    }
}

$pageTitle = 'הגדרות — משנה של נשמה';
include __DIR__ . '/../app/partials/page_start.php';
?>

<div class="mt-4 max-w-xl">
    <h1 class="font-bold text-navy text-xl mb-6 flex items-center gap-2"><?= icon('gear', 'w-6 h-6 text-gold') ?> הגדרות</h1>

    <?php if ($error): ?>
        <div class="mb-4 rounded-lg bg-red-50 text-red-700 text-sm px-4 py-3"><?= h($error) ?></div>
    <?php endif; ?>
    <?php if ($success): ?>
        <div class="mb-4 rounded-lg bg-green-50 text-green-700 text-sm px-4 py-3"><?= h($success) ?></div>
    <?php endif; ?>

    <a href="/notifications.php" class="card mb-6 flex items-center justify-between hover:shadow-card-lg transition">
        <span class="font-bold text-navy flex items-center gap-2"><?= icon('mail', 'w-5 h-5 text-gold') ?> תזכורות (WhatsApp / מייל)</span>
        <?= icon('chevron-start', 'w-4 h-4 -rotate-180 text-ink/40') ?>
    </a>

    <div class="card mb-6">
        <h2 class="font-bold text-navy mb-4 flex items-center gap-2"><?= icon('user', 'w-5 h-5') ?> פרופיל</h2>
        <form method="post" class="space-y-4">
            <?= csrfField() ?>
            <input type="hidden" name="action" value="update_profile">
            <div>
                <label class="block text-sm text-ink/70 mb-1">שם מלא</label>
                <input type="text" name="name" required maxlength="100" value="<?= h($user['name']) ?>"
                       class="w-full rounded-lg border border-gray-200 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-gold">
            </div>
            <div>
                <label class="block text-sm text-ink/70 mb-1">אימייל</label>
                <input type="email" value="<?= h($user['email']) ?>" disabled
                       class="w-full rounded-lg border border-gray-200 px-4 py-2.5 bg-gray-50 text-ink/50">
            </div>
            <button type="submit" class="bg-navy text-white rounded-lg px-6 py-2.5 font-semibold hover:bg-navy-light transition">
                שמירה
            </button>
        </form>
    </div>

    <div class="card">
        <h2 class="font-bold text-navy mb-4 flex items-center gap-2"><?= icon('lock', 'w-5 h-5') ?> שינוי סיסמה</h2>
        <form method="post" class="space-y-4">
            <?= csrfField() ?>
            <input type="hidden" name="action" value="change_password">
            <div>
                <label class="block text-sm text-ink/70 mb-1">סיסמה נוכחית</label>
                <input type="password" name="current_password" required
                       class="w-full rounded-lg border border-gray-200 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-gold">
            </div>
            <div>
                <label class="block text-sm text-ink/70 mb-1">סיסמה חדשה</label>
                <input type="password" name="new_password" required minlength="6"
                       class="w-full rounded-lg border border-gray-200 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-gold">
            </div>
            <div>
                <label class="block text-sm text-ink/70 mb-1">אימות סיסמה חדשה</label>
                <input type="password" name="new_password_confirm" required minlength="6"
                       class="w-full rounded-lg border border-gray-200 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-gold">
            </div>
            <button type="submit" class="bg-navy text-white rounded-lg px-6 py-2.5 font-semibold hover:bg-navy-light transition">
                עדכון סיסמה
            </button>
        </form>
    </div>
</div>

<?php include __DIR__ . '/../app/partials/page_end.php'; ?>
