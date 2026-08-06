<?php
$navItems = require __DIR__ . '/nav_items.php';
$currentFile = basename($_SERVER['SCRIPT_NAME']);
$aliasMap = ['tractate.php' => 'tractates.php', 'dashboard.php' => 'page.php'];
$currentFile = $aliasMap[$currentFile] ?? $currentFile;

$sidebarPages = isset($userId) ? getUserStudyPages($userId) : [];
$sidebarCurrentId = getCurrentPageId();
?>
<aside id="sidebar" class="fixed inset-y-0 right-0 z-40 w-72 bg-navy text-white flex flex-col transform translate-x-full md:translate-x-0 transition-transform duration-200">
    <div class="flex items-center gap-3 px-6 py-7">
        <div class="w-11 h-11 rounded-xl bg-gold/20 flex items-center justify-center text-2xl">📖</div>
        <div>
            <div class="font-bold text-lg leading-tight">משנה של נשמה</div>
            <div class="text-xs text-white/60 leading-tight">לומדים. זוכרים. מעלים נשמה.</div>
        </div>
        <button id="sidebar-close" class="md:hidden mr-auto text-white/70 hover:text-white" aria-label="סגור תפריט">✕</button>
    </div>

    <?php if ($sidebarPages): ?>
        <div class="px-4 mb-3 relative" id="page-switcher-wrap">
            <button id="page-switcher-btn" class="w-full flex items-center justify-between gap-2 bg-white/10 hover:bg-white/15 rounded-xl px-4 py-3 text-sm transition">
                <span class="truncate">
                    <?php
                    $activePage = null;
                    foreach ($sidebarPages as $sp) {
                        if ((int) $sp['id'] === $sidebarCurrentId) { $activePage = $sp; break; }
                    }
                    ?>
                    <?= $activePage ? h($activePage['name_he']) : 'בחירת עמוד לימוד' ?>
                </span>
                <?= icon('chevron-start', 'w-4 h-4 -rotate-90 flex-shrink-0') ?>
            </button>
            <div id="page-switcher-menu" class="hidden absolute inset-x-4 mt-1 bg-white rounded-xl shadow-card-lg py-2 z-30 max-h-72 overflow-y-auto">
                <?php foreach ($sidebarPages as $sp): ?>
                    <a href="/page.php?id=<?= (int) $sp['id'] ?>" class="block px-4 py-2 text-sm text-ink hover:bg-cream <?= (int) $sp['id'] === $sidebarCurrentId ? 'font-bold text-navy' : '' ?>">
                        <?= h($sp['name_he']) ?>
                    </a>
                <?php endforeach; ?>
                <div class="border-t border-gray-100 mt-1 pt-1">
                    <a href="/page_create.php" class="flex items-center gap-1.5 px-4 py-2 text-sm text-gold-dark hover:bg-cream"><?= icon('plus', 'w-4 h-4') ?> עמוד לימוד חדש</a>
                </div>
            </div>
        </div>
    <?php endif; ?>

    <nav class="flex-1 overflow-y-auto px-4 space-y-1">
        <?php foreach ($navItems as $item): ?>
            <a href="<?= h($item['href']) ?>" class="nav-link <?= $currentFile === $item['file'] ? 'active' : '' ?>">
                <span class="flex items-center gap-3">
                    <?= icon($item['icon'], 'w-5 h-5') ?>
                    <?= h($item['label']) ?>
                </span>
            </a>
        <?php endforeach; ?>
    </nav>

    <div class="p-4">
        <a href="/page_create.php" class="block rounded-2xl bg-white/10 hover:bg-white/15 transition p-4 text-center">
            <div class="text-gold mb-1"><?= icon('heart', 'w-6 h-6 mx-auto') ?></div>
            <p class="text-sm leading-relaxed text-white/90">
                אפשר לפתוח עמוד לימוד לעילוי נשמת או לרפואת יקירכם בלחיצה
                <span class="text-gold font-semibold underline">כאן</span>
            </p>
        </a>
    </div>
</aside>
<div id="sidebar-backdrop" class="fixed inset-0 bg-black/40 z-30 hidden md:hidden"></div>
