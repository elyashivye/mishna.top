<?php
$navItems = require __DIR__ . '/nav_items.php';
$currentFile = basename($_SERVER['SCRIPT_NAME']);
$aliasMap = ['tractate.php' => 'tractates.php'];
$currentFile = $aliasMap[$currentFile] ?? $currentFile;
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
        <a href="/dedications.php" class="block rounded-2xl bg-white/10 hover:bg-white/15 transition p-4 text-center">
            <div class="text-gold mb-1"><?= icon('heart', 'w-6 h-6 mx-auto') ?></div>
            <p class="text-sm leading-relaxed text-white/90">
                אפשר להקדיש לימוד לעילוי נשמת או לרפואת יקירכם בלחיצה
                <span class="text-gold font-semibold underline">כאן</span>
            </p>
        </a>
    </div>
</aside>
<div id="sidebar-backdrop" class="fixed inset-0 bg-black/40 z-30 hidden md:hidden"></div>
