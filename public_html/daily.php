<?php
require __DIR__ . '/../app/auth.php';
require __DIR__ . '/../app/functions.php';

$user = requireLogin();
$userId = (int) $user['id'];
$page = requireCurrentPage($userId);
$pageId = (int) $page['id'];

$date = $_GET['date'] ?? date('Y-m-d');
if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
    $date = date('Y-m-d');
}

$mishna = getMemberTodayMishna($pageId, $userId, $date);
$isCompleted = $mishna ? isMishnaCompletedByUser($userId, (int) $mishna['id']) : false;

$prevDate = (new DateTime($date))->modify('-1 day')->format('Y-m-d');
$nextDate = (new DateTime($date))->modify('+1 day')->format('Y-m-d');
$isToday = $date === date('Y-m-d');

$pageTitle = 'המשנה היומית — משנה של נשמה';
include __DIR__ . '/../app/partials/page_start.php';
?>

<div class="mt-4 max-w-3xl mx-auto">
    <div class="flex items-center justify-between mb-4">
        <a href="?date=<?= h($nextDate) ?>" class="btn-pill bg-white shadow-card text-navy">
            <?= icon('chevron-end', 'w-4 h-4') ?> יום הבא
        </a>
        <div class="text-center">
            <h1 class="font-bold text-navy text-xl flex items-center gap-2 justify-center"><?= icon('sun', 'w-6 h-6 text-gold') ?> המשנה היומית</h1>
            <p class="text-ink/50 text-sm mt-1"><?= $isToday ? 'היום' : h($date) ?> · <?= h($page['name_he']) ?></p>
        </div>
        <a href="?date=<?= h($prevDate) ?>" class="btn-pill bg-white shadow-card text-navy">
            יום קודם <?= icon('chevron-start', 'w-4 h-4') ?>
        </a>
    </div>

    <?php if ($mishna): ?>
        <div class="card">
            <div class="flex items-center justify-between mb-4">
                <a href="/tractate.php?slug=<?= h($mishna['tractate_slug']) ?>" class="text-gold-dark font-semibold hover:underline">
                    מסכת <?= h($mishna['tractate_name']) ?>
                </a>
                <span class="text-ink/50 text-sm">פרק <?= (int) $mishna['chapter'] ?>, משנה <?= (int) $mishna['mishna_num'] ?></span>
            </div>
            <p id="daily-mishna-text" class="text-ink/85 leading-loose text-xl font-medium"><?= h($mishna['text_he']) ?></p>

            <div class="flex flex-wrap items-center gap-3 mt-6">
                <button type="button" class="btn-pill bg-cream-dark text-navy hover:bg-gold/30"
                        onclick="speakText(document.getElementById('daily-mishna-text').innerText, this)">
                    <?= icon('volume', 'w-4 h-4') ?> שמע
                </button>
                <button type="button" class="btn-pill bg-cream-dark text-navy hover:bg-gold/30"
                        onclick="shareMishna('משנה של נשמה', document.getElementById('daily-mishna-text').innerText, window.location.href)">
                    <?= icon('share', 'w-4 h-4') ?> שתף
                </button>
                <button id="complete-btn" data-mishna-id="<?= (int) $mishna['id'] ?>" data-csrf="<?= h(csrfToken()) ?>"
                        class="btn-pill mr-auto <?= $isCompleted ? 'bg-gold text-white' : 'bg-navy text-white hover:bg-navy-light' ?>">
                    <?= icon('check', 'w-4 h-4') ?>
                    <span id="complete-btn-label"><?= $isCompleted ? 'סומן כנלמד' : 'סמנו כנלמד' ?></span>
                </button>
            </div>
        </div>
    <?php else: ?>
        <div class="card text-center text-ink/60">
            עדיין לא תפסתם מסכת בעמוד הזה.
            <a href="/tractates.php" class="text-gold-dark hover:underline">לכו ללוח תפיסת המסכתות</a>.
        </div>
    <?php endif; ?>
</div>

<script>
document.getElementById('complete-btn')?.addEventListener('click', function () {
    toggleMishnaComplete(this.dataset.mishnaId, this.dataset.csrf, (data) => {
        if (!data.ok) return;
        const btn = document.getElementById('complete-btn');
        const label = document.getElementById('complete-btn-label');
        if (data.completed) {
            btn.classList.add('bg-gold', 'text-white');
            btn.classList.remove('bg-navy', 'hover:bg-navy-light');
            label.textContent = 'סומן כנלמד';
        } else {
            btn.classList.remove('bg-gold', 'text-white');
            btn.classList.add('bg-navy', 'hover:bg-navy-light');
            label.textContent = 'סמנו כנלמד';
        }
    });
});
</script>

<?php include __DIR__ . '/../app/partials/page_end.php'; ?>
