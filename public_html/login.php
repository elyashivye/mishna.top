<?php
require __DIR__ . '/../app/auth.php';
require __DIR__ . '/../app/functions.php';

if (currentUser()) {
    header('Location: /dashboard.php');
    exit;
}

$error = null;
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!verifyCsrf()) {
        $error = 'הבקשה פגה, נסו שוב.';
    } else {
        $result = attemptLogin($_POST['email'] ?? '', $_POST['password'] ?? '');
        if ($result['ok']) {
            header('Location: /dashboard.php');
            exit;
        }
        $error = $result['error'];
    }
}
$pageTitle = 'התחברות — משנה של נשמה';
?>
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
<?php include __DIR__ . '/../app/partials/head.php'; ?>
</head>
<body class="bg-cream min-h-screen flex items-center justify-center px-4">
<div class="w-full max-w-md">
    <div class="text-center mb-6">
        <div class="text-4xl mb-2">📖</div>
        <h1 class="text-2xl font-bold text-navy">משנה של נשמה</h1>
        <p class="text-ink/60 text-sm mt-1">לימוד משנה לעילוי נשמת</p>
    </div>
    <div class="card">
        <h2 class="text-lg font-bold text-navy mb-4">התחברות</h2>
        <?php if ($error): ?>
            <div class="mb-4 rounded-lg bg-red-50 text-red-700 text-sm px-4 py-3"><?= h($error) ?></div>
        <?php endif; ?>
        <form method="post" class="space-y-4">
            <?= csrfField() ?>
            <div>
                <label class="block text-sm text-ink/70 mb-1">אימייל</label>
                <input type="email" name="email" required value="<?= h($_POST['email'] ?? '') ?>"
                       class="w-full rounded-lg border border-gray-200 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-gold">
            </div>
            <div>
                <label class="block text-sm text-ink/70 mb-1">סיסמה</label>
                <input type="password" name="password" required
                       class="w-full rounded-lg border border-gray-200 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-gold">
            </div>
            <button type="submit" class="w-full bg-navy text-white rounded-lg py-3 font-semibold hover:bg-navy-light transition">
                התחברות
            </button>
        </form>
        <p class="text-center text-sm text-ink/60 mt-4">
            עדיין אין לך חשבון? <a href="/register.php" class="text-gold-dark font-semibold hover:underline">הרשמה</a>
        </p>
    </div>
</div>
</body>
</html>
