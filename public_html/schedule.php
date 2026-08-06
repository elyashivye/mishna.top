<?php
require __DIR__ . '/../app/auth.php';
require __DIR__ . '/../app/functions.php';

$user = requireLogin();
$userId = (int) $user['id'];
$page = requireCurrentPage($userId);
$pageId = (int) $page['id'];

$pdo = db();
$stmt = $pdo->prepare('SELECT MIN(study_date) AS min_d, MAX(study_date) AS max_d, COUNT(*) AS total FROM member_schedule WHERE study_page_id = :p AND user_id = :u');
$stmt->execute([':p' => $pageId, ':u' => $userId]);
$range = $stmt->fetch();

$today = date('Y-m-d');
$stmt2 = $pdo->prepare('SELECT COUNT(*) FROM member_schedule WHERE study_page_id = :p AND user_id = :u AND study_date <= :today');
$stmt2->execute([':p' => $pageId, ':u' => $userId, ':today' => $today]);
$daysElapsed = (int) $stmt2->fetchColumn();

$upcoming = getMemberScheduleUpcoming($pageId, $userId, 14);
$pageStats = getPageStats($pageId, $userId);

$pageTitle = 'סדר לימוד — משנה של נשמה';
include __DIR__ . '/../app/partials/page_start.php';
?>

<div class="mt-4">
    <h1 class="font-bold text-navy text-xl mb-1 flex items-center gap-2"><?= icon('list', 'w-6 h-6 text-gold') ?> סדר הלימוד שלי</h1>
    <p class="text-ink/60 text-sm mb-6">
        הלוח האישי שלכם בעמוד "<?= h($page['name_he']) ?>" — המשניות שתפסתם, פרושות עד ליעד
        <?= h($page['target_end_date']) ?>.
    </p>

    <?php if (!$range['total']): ?>
        <div class="card text-center text-ink/60">עדיין אין לכם לוח לימוד — תפסו מסכת כדי שיבנה אוטומטית. <a href="/tractates.php" class="text-gold-dark hover:underline">ללוח תפיסת המסכתות</a>.</div>
    <?php else: ?>
        <div class="grid sm:grid-cols-3 gap-4 mb-8">
            <div class="card text-center">
                <div class="text-2xl font-extrabold text-navy"><?= (int) $range['total'] ?></div>
                <div class="text-xs text-ink/60 mt-1">משניות בלוח שלי</div>
            </div>
            <div class="card text-center">
                <div class="text-2xl font-extrabold text-navy"><?= (int) $pageStats['learned'] ?>/<?= (int) $pageStats['total'] ?></div>
                <div class="text-xs text-ink/60 mt-1">הושלמו (<?= (int) $pageStats['percent'] ?>%)</div>
            </div>
            <div class="card text-center">
                <div class="text-sm font-bold text-navy"><?= h($range['min_d']) ?> — <?= h($range['max_d']) ?></div>
                <div class="text-xs text-ink/60 mt-1">טווח הלוח שלי</div>
            </div>
        </div>

        <h2 class="font-bold text-navy mb-3">הימים הקרובים</h2>
        <div class="card !p-0 overflow-hidden">
            <div class="divide-y divide-gray-100">
                <?php foreach ($upcoming as $row): ?>
                    <a href="/daily.php?date=<?= h($row['study_date']) ?>" class="flex items-center justify-between px-6 py-3 hover:bg-cream transition">
                        <span class="text-sm font-medium text-navy"><?= h($row['study_date']) ?><?= $row['study_date'] === $today ? ' (היום)' : '' ?></span>
                        <span class="text-sm text-ink/60">מסכת <?= h($row['tractate_name']) ?> — פרק <?= (int) $row['chapter'] ?>, משנה <?= (int) $row['mishna_num'] ?></span>
                    </a>
                <?php endforeach; ?>
            </div>
        </div>
    <?php endif; ?>
</div>

<?php include __DIR__ . '/../app/partials/page_end.php'; ?>
