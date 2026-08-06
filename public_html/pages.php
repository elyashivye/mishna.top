<?php
require __DIR__ . '/../app/auth.php';
require __DIR__ . '/../app/functions.php';

$user = requireLogin();
$userId = (int) $user['id'];

$pages = getUserStudyPages($userId);

$pageTitle = 'העמודים שלי — משנה של נשמה';
include __DIR__ . '/../app/partials/page_start.php';
?>

<div class="mt-4">
    <div class="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 class="font-bold text-navy text-xl flex items-center gap-2"><?= icon('heart', 'w-6 h-6 text-gold') ?> העמודים שלי</h1>
        <a href="/page_create.php" class="btn-pill bg-navy text-white hover:bg-navy-light"><?= icon('plus', 'w-4 h-4') ?> יצירת עמוד לימוד חדש</a>
    </div>

    <?php if (!$pages): ?>
        <div class="card text-center">
            <div class="text-gold mb-3"><?= icon('candle', 'w-10 h-10 mx-auto') ?></div>
            <p class="font-bold text-navy text-lg mb-2">עדיין אין לכם עמוד לימוד</p>
            <p class="text-ink/60 text-sm mb-5 max-w-md mx-auto">
                פתחו עמוד לימוד לעילוי נשמה או לרפואה — ללימוד אישי של כל הש"ס בקצב שתבחרו,
                או כקבוצה שמחלקת ביניכם את המסכתות.
            </p>
            <a href="/page_create.php" class="btn-pill bg-gold text-white hover:bg-gold-dark inline-flex"><?= icon('plus', 'w-4 h-4') ?> יצירת עמוד לימוד</a>
        </div>
    <?php endif; ?>

    <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <?php foreach ($pages as $p): ?>
            <a href="/page.php?id=<?= (int) $p['id'] ?>" class="card hover:shadow-card-lg transition flex flex-col">
                <div class="flex items-start justify-between mb-3">
                    <span class="text-gold"><?= icon('candle', 'w-7 h-7') ?></span>
                    <span class="text-xs rounded-full px-2.5 py-1 <?= $p['mode'] === 'group' ? 'bg-navy/10 text-navy' : 'bg-gold/15 text-gold-dark' ?>">
                        <?= $p['mode'] === 'group' ? 'קבוצתי · ' . (int) $p['member_count'] . ' חברים' : 'אישי' ?>
                    </span>
                </div>
                <p class="text-ink/50 text-xs mb-1"><?= $p['dtype'] === 'refuah' ? 'לרפואת' : 'לעילוי נשמת' ?></p>
                <p class="font-bold text-navy text-lg leading-snug mb-3"><?= h($p['name_he']) ?></p>
                <div class="mt-auto">
                    <div class="w-full bg-cream-dark rounded-full h-2 overflow-hidden">
                        <div class="bg-gold h-2 rounded-full" style="width: <?= (float) $p['stats']['percent'] ?>%"></div>
                    </div>
                    <p class="text-xs text-ink/50 mt-1.5"><?= (int) $p['stats']['learned'] ?>/<?= (int) $p['stats']['total'] ?> משניות · <?= (int) $p['stats']['percent'] ?>%</p>
                </div>
            </a>
        <?php endforeach; ?>
    </div>
</div>

<?php include __DIR__ . '/../app/partials/page_end.php'; ?>
