<?php
require __DIR__ . '/../app/auth.php';
require __DIR__ . '/../app/functions.php';

$code = strtoupper(trim($_GET['code'] ?? $_POST['code'] ?? ''));

if (!currentUser()) {
    $next = urlencode('/join.php?code=' . $code);
    header("Location: /register.php?next={$next}");
    exit;
}
$user = currentUser();
$userId = (int) $user['id'];

$page = $code !== '' ? getStudyPageByInviteCode($code) : null;

if ($_SERVER['REQUEST_METHOD'] === 'POST' && $page && verifyCsrf()) {
    joinStudyPage((int) $page['id'], $userId);
    setCurrentPageId((int) $page['id']);
    header('Location: /tractates.php');
    exit;
}

$pageTitle = 'הצטרפות לעמוד לימוד — משנה של נשמה';
include __DIR__ . '/../app/partials/page_start.php';
?>

<div class="mt-10 max-w-md mx-auto">
    <?php if (!$page): ?>
        <div class="card text-center">
            <p class="font-bold text-navy text-lg mb-2">קוד הזמנה לא נמצא</p>
            <p class="text-ink/60 text-sm mb-5">בדקו שהקישור שקיבלתם מלא ותקין.</p>
            <form method="get" class="flex gap-2">
                <input type="text" name="code" placeholder="קוד הזמנה" value="<?= h($code) ?>"
                       class="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-center tracking-widest">
                <button type="submit" class="btn-pill bg-navy text-white">חיפוש</button>
            </form>
        </div>
    <?php else: ?>
        <div class="card text-center">
            <div class="text-gold mb-3"><?= icon('candle', 'w-10 h-10 mx-auto') ?></div>
            <p class="text-ink/50 text-sm mb-1"><?= $page['dtype'] === 'refuah' ? 'לרפואת' : 'לעילוי נשמת' ?></p>
            <p class="font-bold text-navy text-xl mb-4"><?= h($page['name_he']) ?></p>
            <p class="text-ink/60 text-sm mb-6">
                הצטרפו לעמוד הלימוד הקבוצתי הזה, ובחרו מסכת פנויה ללימוד לפי הקצב שנקבע
                (יעד: <?= h($page['target_end_date']) ?>).
            </p>
            <form method="post">
                <?= csrfField() ?>
                <input type="hidden" name="code" value="<?= h($code) ?>">
                <button type="submit" class="btn-pill bg-gold text-white hover:bg-gold-dark w-full justify-center">
                    <?= icon('plus', 'w-4 h-4') ?> הצטרפות לעמוד
                </button>
            </form>
        </div>
    <?php endif; ?>
</div>

<?php include __DIR__ . '/../app/partials/page_end.php'; ?>
