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
    } elseif (($_POST['password'] ?? '') !== ($_POST['password_confirm'] ?? '')) {
        $error = 'הסיסמאות אינן תואמות.';
    } else {
        $result = registerUser($_POST['name'] ?? '', $_POST['email'] ?? '', $_POST['password'] ?? '');
        if ($result['ok']) {
            header('Location: /dashboard.php');
            exit;
        }
        $error = $result['error'];
    }
}
$pageTitle = 'הרשמה — משנה של נשמה';
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
        <p class="text-ink/60 text-sm mt-1">לומדים. זוכרים. מעלים נשמה.</p>
    </div>
    <div class="card">
        <h2 class="text-lg font-bold text-navy mb-4">יצירת חשבון חדש</h2>
        <?php if ($error): ?>
            <div class="mb-4 rounded-lg bg-red-50 text-red-700 text-sm px-4 py-3"><?= h($error) ?></div>
        <?php endif; ?>
        <form method="post" class="space-y-4">
            <?= csrfField() ?>
            <div>
                <label class="block text-sm text-ink/70 mb-1">שם מלא</label>
                <input type="text" name="name" required maxlength="100" value="<?= h($_POST['name'] ?? '') ?>"
                       class="w-full rounded-lg border border-gray-200 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-gold">
            </div>
            <div>
                <label class="block text-sm text-ink/70 mb-1">אימייל</label>
                <input type="email" name="email" required value="<?= h($_POST['email'] ?? '') ?>"
                       class="w-full rounded-lg border border-gray-200 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-gold">
            </div>
            <div>
                <label class="block text-sm text-ink/70 mb-1">סיסמה</label>
                <input type="password" name="password" required minlength="6"
                       class="w-full rounded-lg border border-gray-200 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-gold">
            </div>
            <div>
                <label class="block text-sm text-ink/70 mb-1">אימות סיסמה</label>
                <input type="password" name="password_confirm" required minlength="6"
                       class="w-full rounded-lg border border-gray-200 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-gold">
            </div>
            <button type="submit" class="w-full bg-navy text-white rounded-lg py-3 font-semibold hover:bg-navy-light transition">
                הרשמה
            </button>
        </form>
        <p class="text-center text-sm text-ink/60 mt-4">
            כבר יש לך חשבון? <a href="/login.php" class="text-gold-dark font-semibold hover:underline">התחברות</a>
        </p>
    </div>
</div>
</body>
</html>
