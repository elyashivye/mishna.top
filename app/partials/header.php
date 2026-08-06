<?php
/** @var array $user */
$initial = mb_substr($user['name'], 0, 1);
?>
<header class="flex items-center justify-between px-4 md:px-10 py-5">
    <button id="sidebar-open" class="md:hidden text-navy" aria-label="פתח תפריט">
        <?= icon('list', 'w-7 h-7') ?>
    </button>

    <div class="relative" id="user-menu-wrap">
        <button id="user-menu-btn" class="flex items-center gap-2 text-navy hover:opacity-80">
            <span class="w-9 h-9 rounded-full bg-navy text-white flex items-center justify-center text-sm font-bold">
                <?= h($initial) ?>
            </span>
            <span class="font-medium text-sm hidden sm:inline">שלום <?= h($user['name']) ?></span>
            <?= icon('chevron-start', 'w-4 h-4 -rotate-90') ?>
        </button>
        <div id="user-menu" class="hidden absolute start-0 mt-2 w-48 bg-white rounded-xl shadow-card-lg py-2 z-20">
            <a href="/settings.php" class="flex items-center gap-2 px-4 py-2 text-sm text-ink hover:bg-cream"><?= icon('gear', 'w-4 h-4') ?> הגדרות</a>
            <a href="/logout.php" class="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-cream"><?= icon('logout', 'w-4 h-4') ?> התנתקות</a>
        </div>
    </div>
</header>
