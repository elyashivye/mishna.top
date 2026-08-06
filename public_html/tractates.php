<?php
require __DIR__ . '/../app/auth.php';
require __DIR__ . '/../app/functions.php';

$user = requireLogin();
$userId = (int) $user['id'];

$tractates = getTractateProgress($userId);
$grouped = [];
foreach ($tractates as $t) {
    $grouped[$t['seder_he']][] = $t;
}

$pageTitle = 'המסכתות שלי — משנה של נשמה';
include __DIR__ . '/../app/partials/page_start.php';
?>

<div class="mt-4">
    <h1 class="font-bold text-navy text-xl mb-5 flex items-center gap-2"><?= icon('book', 'w-6 h-6 text-gold') ?> המסכתות שלי</h1>

    <?php foreach ($grouped as $sederHe => $items): ?>
        <div class="mb-8">
            <h2 class="text-sm font-bold text-gold-dark tracking-wide mb-3">סדר <?= h($sederHe) ?></h2>
            <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <?php foreach ($items as $t): ?>
                    <?php $pct = $t['mishna_count'] > 0 ? round(($t['learned'] / $t['mishna_count']) * 100) : 0; ?>
                    <a href="/tractate.php?slug=<?= h($t['slug']) ?>" class="card flex items-center gap-4 hover:shadow-card-lg transition">
                        <div class="progress-ring w-14 h-14 flex-shrink-0" style="--pct: <?= (float) $pct ?>;">
                            <div class="progress-ring-inner w-10 h-10 flex items-center justify-center text-[11px] font-bold text-navy">
                                <?= (int) $t['learned'] ?>/<?= (int) $t['mishna_count'] ?>
                            </div>
                        </div>
                        <div>
                            <p class="font-semibold text-navy">מסכת <?= h($t['name_he']) ?></p>
                            <p class="text-xs text-ink/50 mt-0.5"><?= $pct ?>% הושלם</p>
                        </div>
                    </a>
                <?php endforeach; ?>
            </div>
        </div>
    <?php endforeach; ?>
</div>

<?php include __DIR__ . '/../app/partials/page_end.php'; ?>
