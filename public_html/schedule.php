<?php
require __DIR__ . '/../app/auth.php';
require __DIR__ . '/../app/functions.php';

$user = requireLogin();

$pdo = db();
$cycleStart = $pdo->query('SELECT MIN(study_date) FROM daily_cycle')->fetchColumn();
$cycleEnd = $pdo->query('SELECT MAX(study_date) FROM daily_cycle')->fetchColumn();
$totalDays = (int) $pdo->query('SELECT COUNT(*) FROM daily_cycle')->fetchColumn();

$today = date('Y-m-d');
$stmtElapsed = $pdo->prepare('SELECT COUNT(*) FROM daily_cycle WHERE study_date <= :today');
$stmtElapsed->execute([':today' => $today]);
$daysElapsed = (int) $stmtElapsed->fetchColumn();

$stmt = $pdo->prepare(
    'SELECT dc.study_date, m.chapter, m.mishna_num, t.name_he AS tractate_name, t.slug
     FROM daily_cycle dc
     JOIN mishnayot m ON m.id = dc.mishna_id
     JOIN tractates t ON t.id = m.tractate_id
     WHERE dc.study_date >= :today
     ORDER BY dc.study_date ASC
     LIMIT 14'
);
$stmt->execute([':today' => $today]);
$upcoming = $stmt->fetchAll();

$pageTitle = 'סדר לימוד — משנה של נשמה';
include __DIR__ . '/../app/partials/page_start.php';
?>

<div class="mt-4">
    <h1 class="font-bold text-navy text-xl mb-1 flex items-center gap-2"><?= icon('list', 'w-6 h-6 text-gold') ?> סדר לימוד</h1>
    <p class="text-ink/60 text-sm mb-6">מחזור "משנה יומית" גלובלי — לומדים משנה אחת ביום, ומסיימים את כל הש"ס יחד, לפי סדר המסכתות המסורתי.</p>

    <div class="grid sm:grid-cols-3 gap-4 mb-8">
        <div class="card text-center">
            <div class="text-2xl font-extrabold text-navy"><?= (int) $totalDays ?></div>
            <div class="text-xs text-ink/60 mt-1">ימי לימוד בכל המחזור</div>
        </div>
        <div class="card text-center">
            <div class="text-2xl font-extrabold text-navy"><?= (int) $daysElapsed ?></div>
            <div class="text-xs text-ink/60 mt-1">היום ה־<?= (int) $daysElapsed ?> במחזור</div>
        </div>
        <div class="card text-center">
            <div class="text-sm font-bold text-navy"><?= h($cycleStart) ?> — <?= h($cycleEnd) ?></div>
            <div class="text-xs text-ink/60 mt-1">טווח המחזור הנוכחי</div>
        </div>
    </div>

    <h2 class="font-bold text-navy mb-3">14 הימים הקרובים</h2>
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
</div>

<?php include __DIR__ . '/../app/partials/page_end.php'; ?>
