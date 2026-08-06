<?php
require __DIR__ . '/../app/auth.php';
require __DIR__ . '/../app/functions.php';

$user = requireLogin();
$userId = (int) $user['id'];

$month = $_GET['month'] ?? date('Y-m');
if (!preg_match('/^\d{4}-\d{2}$/', $month)) {
    $month = date('Y-m');
}
$firstOfMonth = new DateTime($month . '-01');
$daysInMonth = (int) $firstOfMonth->format('t');
$startWeekday = (int) $firstOfMonth->format('w'); // 0=ראשון
$prevMonth = (clone $firstOfMonth)->modify('-1 month')->format('Y-m');
$nextMonth = (clone $firstOfMonth)->modify('+1 month')->format('Y-m');

$studyDays = getUserStudyDaysInMonth($userId, $month);
$today = date('Y-m-d');

$hebrewMonthNames = [
    1 => 'ינואר', 2 => 'פברואר', 3 => 'מרץ', 4 => 'אפריל', 5 => 'מאי', 6 => 'יוני',
    7 => 'יולי', 8 => 'אוגוסט', 9 => 'ספטמבר', 10 => 'אוקטובר', 11 => 'נובמבר', 12 => 'דצמבר',
];
$monthLabel = $hebrewMonthNames[(int) $firstOfMonth->format('n')] . ' ' . $firstOfMonth->format('Y');

$myPages = getUserStudyPages($userId);

$yahrzeitDatesInMonth = [];
if (isHebrewCalendarAvailable()) {
    foreach ($myPages as $p) {
        if (!$p['passing_hebrew_month'] || !$p['passing_hebrew_day']) {
            continue;
        }
        $occ = findNextHebrewAnniversary($p['passing_hebrew_month'], (int) $p['passing_hebrew_day'], $firstOfMonth);
        if ($occ && $occ->format('Y-m') === $month) {
            $yahrzeitDatesInMonth[$occ->format('Y-m-d')][] = $p['name_he'];
        }
    }
}

$pageTitle = 'לוח זמנים — משנה של נשמה';
include __DIR__ . '/../app/partials/page_start.php';
?>

<div class="mt-4">
    <h1 class="font-bold text-navy text-xl mb-1 flex items-center gap-2"><?= icon('calendar', 'w-6 h-6 text-gold') ?> לוח זמנים</h1>
    <?php if (isHebrewCalendarAvailable()): ?>
        <p class="text-ink/50 text-sm mb-6">היום: <?= h(todayHebrewDateDisplay()) ?></p>
    <?php else: ?>
        <div class="mb-6"></div>
    <?php endif; ?>

    <div class="card">
        <div class="flex items-center justify-between mb-5">
            <a href="?month=<?= h($nextMonth) ?>" class="btn-pill bg-cream-dark text-navy"><?= icon('chevron-end', 'w-4 h-4') ?></a>
            <h2 class="font-bold text-navy"><?= h($monthLabel) ?></h2>
            <a href="?month=<?= h($prevMonth) ?>" class="btn-pill bg-cream-dark text-navy"><?= icon('chevron-start', 'w-4 h-4') ?></a>
        </div>

        <div class="grid grid-cols-7 gap-1.5 text-center text-xs text-ink/50 mb-2">
            <div>א</div><div>ב</div><div>ג</div><div>ד</div><div>ה</div><div>ו</div><div>ש</div>
        </div>
        <div class="grid grid-cols-7 gap-1.5">
            <?php for ($i = 0; $i < $startWeekday; $i++): ?>
                <div></div>
            <?php endfor; ?>
            <?php for ($day = 1; $day <= $daysInMonth; $day++): ?>
                <?php
                $dateStr = $month . '-' . str_pad((string) $day, 2, '0', STR_PAD_LEFT);
                $studied = in_array($dateStr, $studyDays, true);
                $isToday = $dateStr === $today;
                $yahrzeitNames = $yahrzeitDatesInMonth[$dateStr] ?? null;
                ?>
                <div class="aspect-square rounded-lg flex items-center justify-center text-sm relative
                            <?= $studied ? 'bg-gold text-white font-bold' : 'bg-cream-dark text-ink/70' ?>
                            <?= $isToday ? 'ring-2 ring-navy' : '' ?>"
                     <?= $yahrzeitNames ? 'title="יארצייט: ' . h(implode(', ', $yahrzeitNames)) . '"' : '' ?>>
                    <?= $day ?>
                    <?php if ($yahrzeitNames): ?>
                        <span class="absolute -top-1.5 -start-1.5 text-gold-dark"><?= icon('candle', 'w-4 h-4') ?></span>
                    <?php endif; ?>
                </div>
            <?php endfor; ?>
        </div>
        <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink/50 mt-4">
            <span><span class="w-3 h-3 rounded bg-gold inline-block align-middle ms-1"></span> יום לימוד</span>
            <span><span class="w-3 h-3 rounded ring-2 ring-navy inline-block align-middle ms-1"></span> היום</span>
            <span><?= icon('candle', 'w-3.5 h-3.5 text-gold-dark inline align-middle ms-1') ?> יארצייט</span>
        </div>
    </div>

    <?php if ($myPages): ?>
        <div class="mt-8">
            <h2 class="font-bold text-navy mb-3">עמודי הלימוד שלי</h2>
            <div class="card !p-0 overflow-hidden divide-y divide-gray-100">
                <?php foreach ($myPages as $p): ?>
                    <?php $dd = getDedicationDateDisplay($p); ?>
                    <a href="/page.php?id=<?= (int) $p['id'] ?>" class="flex items-center justify-between px-6 py-3 hover:bg-cream transition">
                        <span class="text-sm font-medium text-navy"><?= h($p['name_he']) ?></span>
                        <span class="text-sm text-ink/60">
                            <?= $dd ? h($dd['hebrew_display']) : 'יעד: ' . h($p['target_end_date']) ?>
                        </span>
                    </a>
                <?php endforeach; ?>
            </div>
        </div>
    <?php endif; ?>
</div>

<?php include __DIR__ . '/../app/partials/page_end.php'; ?>
