<?php
require __DIR__ . '/../app/auth.php';
require __DIR__ . '/../app/functions.php';

$user = requireLogin();
$userId = (int) $user['id'];
$page = requireCurrentPage($userId);

$slug = $_GET['slug'] ?? '';
$tractate = getTractateBySlug($slug);
if (!$tractate) {
    header('Location: /tractates.php');
    exit;
}

$mishnayot = getMishnayotForTractate((int) $tractate['id'], $userId);
$byChapter = [];
$learnedCount = 0;
foreach ($mishnayot as $m) {
    $byChapter[(int) $m['chapter']][] = $m;
    if ($m['progress_id']) {
        $learnedCount++;
    }
}
$pct = $tractate['mishna_count'] > 0 ? round(($learnedCount / $tractate['mishna_count']) * 100) : 0;

$pageTitle = 'מסכת ' . $tractate['name_he'] . ' — משנה של נשמה';
include __DIR__ . '/../app/partials/page_start.php';
?>

<div class="mt-4">
    <a href="/tractates.php" class="inline-flex items-center gap-1 text-ink/60 hover:text-navy text-sm mb-4">
        <?= icon('chevron-end', 'w-4 h-4') ?> <?= $page['mode'] === 'group' ? 'חזרה ללוח תפיסת המסכתות' : 'חזרה למסכתות שלי' ?>
    </a>

    <div class="card flex items-center gap-5 mb-6">
        <div class="progress-ring w-20 h-20 flex-shrink-0" style="--pct: <?= (float) $pct ?>;">
            <div class="progress-ring-inner w-14 h-14 flex items-center justify-center text-sm font-bold text-navy"><?= $pct ?>%</div>
        </div>
        <div>
            <h1 class="font-bold text-navy text-2xl">מסכת <?= h($tractate['name_he']) ?></h1>
            <p class="text-ink/50 text-sm mt-1">סדר <?= h($tractate['seder_he']) ?> · <?= (int) $tractate['chapter_count'] ?> פרקים · <?= (int) $learnedCount ?>/<?= (int) $tractate['mishna_count'] ?> משניות נלמדו</p>
        </div>
    </div>

    <div class="space-y-3">
        <?php foreach ($byChapter as $chapterNum => $items): ?>
            <details class="card !p-0 overflow-hidden" <?= $chapterNum === 1 ? 'open' : '' ?>>
                <summary class="cursor-pointer select-none px-6 py-4 font-semibold text-navy flex items-center justify-between">
                    <span>פרק <?= (int) $chapterNum ?></span>
                    <span class="text-xs text-ink/40 font-normal"><?= count($items) ?> משניות</span>
                </summary>
                <div class="border-t border-gray-100 divide-y divide-gray-100">
                    <?php foreach ($items as $m): ?>
                        <div class="flex items-start gap-3 px-6 py-4">
                            <button type="button"
                                    class="mishna-toggle mt-1 w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition <?= $m['progress_id'] ? 'bg-gold border-gold text-white' : 'border-gray-300 text-transparent hover:border-gold' ?>"
                                    data-mishna-id="<?= (int) $m['id'] ?>" data-csrf="<?= h(csrfToken()) ?>">
                                <?= icon('check', 'w-3.5 h-3.5') ?>
                            </button>
                            <div>
                                <p class="text-xs text-ink/40 mb-1">משנה <?= (int) $m['mishna_num'] ?></p>
                                <p class="text-ink/80 leading-loose"><?= h($m['text_he']) ?></p>
                            </div>
                        </div>
                    <?php endforeach; ?>
                </div>
            </details>
        <?php endforeach; ?>
    </div>
</div>

<script>
document.querySelectorAll('.mishna-toggle').forEach((btn) => {
    btn.addEventListener('click', () => {
        toggleMishnaComplete(btn.dataset.mishnaId, btn.dataset.csrf, (data) => {
            if (!data.ok) return;
            if (data.completed) {
                btn.classList.add('bg-gold', 'border-gold', 'text-white');
                btn.classList.remove('border-gray-300', 'text-transparent');
            } else {
                btn.classList.remove('bg-gold', 'border-gold', 'text-white');
                btn.classList.add('border-gray-300', 'text-transparent');
            }
        });
    });
});
</script>

<?php include __DIR__ . '/../app/partials/page_end.php'; ?>
