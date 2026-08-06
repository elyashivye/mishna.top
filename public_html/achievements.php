<?php
require __DIR__ . '/../app/auth.php';
require __DIR__ . '/../app/functions.php';

$user = requireLogin();
$userId = (int) $user['id'];

checkAndAwardAchievements($userId);

$stmt = db()->prepare(
    'SELECT a.*, ua.earned_at
     FROM achievements a
     LEFT JOIN user_achievements ua ON ua.achievement_id = a.id AND ua.user_id = :u
     ORDER BY a.sort_order ASC'
);
$stmt->execute([':u' => $userId]);
$achievements = $stmt->fetchAll();
$earnedCount = count(array_filter($achievements, fn($a) => $a['earned_at'] !== null));

$pageTitle = 'הישגים — משנה של נשמה';
include __DIR__ . '/../app/partials/page_start.php';
?>

<div class="mt-4">
    <h1 class="font-bold text-navy text-xl mb-1 flex items-center gap-2"><?= icon('trophy', 'w-6 h-6 text-gold') ?> הישגים</h1>
    <p class="text-ink/60 text-sm mb-6">קיבלתם <?= $earnedCount ?> מתוך <?= count($achievements) ?> תגים</p>

    <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <?php foreach ($achievements as $a): ?>
            <?php $earned = $a['earned_at'] !== null; ?>
            <div class="card flex items-center gap-4 <?= $earned ? '' : 'opacity-50' ?>">
                <div class="w-14 h-14 rounded-full flex items-center justify-center text-2xl flex-shrink-0 <?= $earned ? 'bg-gold/20' : 'bg-gray-100' ?>">
                    <?= h($a['icon']) ?>
                </div>
                <div>
                    <p class="font-bold text-navy"><?= h($a['name_he']) ?></p>
                    <p class="text-xs text-ink/60 mt-0.5"><?= h($a['description']) ?></p>
                    <?php if ($earned): ?>
                        <p class="text-xs text-gold-dark mt-1">הושג ב-<?= h(substr($a['earned_at'], 0, 10)) ?></p>
                    <?php endif; ?>
                </div>
            </div>
        <?php endforeach; ?>
    </div>
</div>

<?php include __DIR__ . '/../app/partials/page_end.php'; ?>
