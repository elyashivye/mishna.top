<?php
require __DIR__ . '/../app/auth.php';
require __DIR__ . '/../app/functions.php';

$user = requireLogin();
$userId = (int) $user['id'];

$stats = getUserStats($userId);
$today = getTodayMishna();
$todayCompleted = $today ? isMishnaCompletedByUser($userId, (int) $today['id']) : false;
$dedication = getPrimaryDedication($userId);
$tractateProgress = getTractateProgress($userId);

$pageTitle = 'דף הבית — משנה של נשמה';
include __DIR__ . '/../app/partials/page_start.php';
?>

<div class="grid md:grid-cols-3 gap-5 mt-4">
    <!-- כרטיס הקדשה -->
    <div class="card flex flex-col items-center justify-center text-center">
        <div class="text-gold mb-2"><?= icon('candle', 'w-9 h-9') ?></div>
        <?php if ($dedication): ?>
            <p class="text-ink/60 text-sm mb-1"><?= $dedication['dtype'] === 'refuah' ? 'לרפואת' : 'לעילוי נשמת' ?></p>
            <p class="font-bold text-navy text-lg leading-snug"><?= h($dedication['name_he']) ?></p>
            <?php if ($dedication['passing_date_he']): ?>
                <p class="text-ink/50 text-sm mt-1"><?= h($dedication['passing_date_he']) ?></p>
            <?php endif; ?>
            <?php if ($dedication['dtype'] === 'neshama'): ?>
                <p class="text-ink/40 text-xs mt-2">ת.נ.צ.ב.ה</p>
            <?php endif; ?>
        <?php else: ?>
            <p class="font-bold text-navy mb-1">עדיין לא הוספתם הקדשה</p>
            <p class="text-ink/60 text-sm mb-3">הקדישו את הלימוד שלכם לעילוי נשמה או לרפואת יקיריכם</p>
            <a href="/dedications.php" class="btn-pill bg-gold text-white hover:bg-gold-dark"><?= icon('plus', 'w-4 h-4') ?> הוספת הקדשה</a>
        <?php endif; ?>
    </div>

    <!-- באנר גיבור -->
    <div class="md:col-span-2 card relative overflow-hidden flex items-center">
        <div class="absolute inset-0 bg-gradient-to-l from-navy via-navy-light to-gold/70 opacity-90"></div>
        <div class="absolute inset-0" style="background-image: radial-gradient(circle at 85% 30%, rgba(255,255,255,0.25), transparent 55%);"></div>
        <div class="relative z-10 text-white px-2 py-4">
            <p class="text-xs tracking-widest text-white/70 mb-2">בע"ה</p>
            <h1 class="text-2xl md:text-3xl font-extrabold leading-tight">לימוד משנה<br>לעילוי נשמת</h1>
            <p class="text-white/85 text-sm mt-3 max-w-md leading-relaxed">
                הלימוד תורה לעילוי נשמת הנפטר ממשיך להאיר לו את נחת רוח בעולם העליון.
            </p>
        </div>
        <div class="hidden md:flex relative z-10 me-4 ms-auto text-6xl opacity-90">🕯️📖</div>
    </div>
</div>

<!-- שורת סטטיסטיקות -->
<div class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5">
    <div class="card flex items-center gap-3">
        <span class="text-gold"><?= icon('flame', 'w-8 h-8') ?></span>
        <div>
            <div id="stat-streak" class="text-2xl font-extrabold text-navy"><?= (int) $stats['streak'] ?></div>
            <div class="text-xs text-ink/60">רצף ימים</div>
        </div>
    </div>
    <div class="card flex items-center gap-3">
        <span class="text-gold"><?= icon('book', 'w-8 h-8') ?></span>
        <div>
            <div id="stat-learned" class="text-2xl font-extrabold text-navy"><?= (int) $stats['learned'] ?></div>
            <div class="text-xs text-ink/60">משניות נלמדו</div>
        </div>
    </div>
    <div class="card flex items-center gap-3">
        <div id="stat-percent-ring" class="progress-ring w-12 h-12" style="--pct: <?= (float) $stats['percent'] ?>;">
            <div id="stat-percent" class="progress-ring-inner w-9 h-9 flex items-center justify-center text-xs font-bold text-navy"><?= (int) $stats['percent'] ?>%</div>
        </div>
        <div>
            <div class="text-xs text-ink/60">התקדמות כללית</div>
        </div>
    </div>
    <a href="/daily.php" class="card flex items-center gap-3 hover:shadow-card-lg transition">
        <span class="text-gold"><?= icon('calendar', 'w-8 h-8') ?></span>
        <div>
            <div class="font-bold text-navy text-sm">היום</div>
            <div class="text-xs text-ink/60">משנה יומית</div>
        </div>
    </a>
</div>

<div class="grid md:grid-cols-3 gap-5 mt-5">
    <!-- סיימתי ללמוד היום -->
    <div class="card flex flex-col items-center justify-center text-center">
        <button id="complete-today-btn"
                data-mishna-id="<?= (int) ($today['id'] ?? 0) ?>"
                data-csrf="<?= h(csrfToken()) ?>"
                class="w-16 h-16 rounded-full flex items-center justify-center transition <?= $todayCompleted ? 'bg-gold text-white' : 'bg-cream-dark text-ink/40 hover:text-gold' ?>">
            <?= icon('check', 'w-8 h-8') ?>
        </button>
        <p id="complete-today-label" class="font-bold text-navy mt-3"><?= $todayCompleted ? 'סיימתי ללמוד היום' : 'סמנו כשסיימתם ללמוד היום' ?></p>
        <p class="text-ink/50 text-xs mt-1">היום</p>
    </div>

    <!-- כרטיס המשנה היומית -->
    <div class="md:col-span-2 card">
        <div class="flex items-center justify-between mb-3">
            <h2 class="font-bold text-navy text-lg flex items-center gap-2"><?= icon('sun', 'w-5 h-5 text-gold') ?> המשנה היומית</h2>
            <?php if ($today): ?>
                <a href="/tractate.php?slug=<?= h($today['tractate_slug']) ?>" class="text-xs text-gold-dark hover:underline">מסכת <?= h($today['tractate_name']) ?></a>
            <?php endif; ?>
        </div>
        <?php if ($today): ?>
            <p class="font-semibold text-navy mb-2">מסכת <?= h($today['tractate_name']) ?> — פרק <?= (int) $today['chapter'] ?>, משנה <?= (int) $today['mishna_num'] ?></p>
            <p id="daily-mishna-text" class="text-ink/80 leading-loose text-[17px]"><?= h($today['text_he']) ?></p>
            <div class="flex items-center gap-3 mt-4">
                <button type="button" class="btn-pill bg-cream-dark text-navy hover:bg-gold/30"
                        onclick="speakText(document.getElementById('daily-mishna-text').innerText, this)">
                    <?= icon('volume', 'w-4 h-4') ?> שמע
                </button>
                <button type="button" class="btn-pill bg-cream-dark text-navy hover:bg-gold/30"
                        onclick="shareMishna('משנה של נשמה', document.getElementById('daily-mishna-text').innerText, window.location.origin + '/daily.php')">
                    <?= icon('share', 'w-4 h-4') ?> שתף
                </button>
            </div>
        <?php else: ?>
            <p class="text-ink/60">לא נמצאה משנה יומית להיום.</p>
        <?php endif; ?>
    </div>
</div>

<!-- קרוסלת התקדמות במסכתות -->
<div class="mt-6">
    <div class="flex items-center justify-between mb-3">
        <h2 class="font-bold text-navy text-lg">התקדמות במסכתות</h2>
        <div class="flex gap-2">
            <button id="carousel-prev" class="w-8 h-8 rounded-full bg-white shadow-card flex items-center justify-center text-navy"><?= icon('chevron-start', 'w-4 h-4') ?></button>
            <button id="carousel-next" class="w-8 h-8 rounded-full bg-white shadow-card flex items-center justify-center text-navy"><?= icon('chevron-end', 'w-4 h-4') ?></button>
        </div>
    </div>
    <div id="tractate-carousel" class="flex gap-4 overflow-x-auto pb-2 scroll-smooth" style="scroll-snap-type: x proximity;">
        <?php foreach ($tractateProgress as $t): ?>
            <?php $pct = $t['mishna_count'] > 0 ? round(($t['learned'] / $t['mishna_count']) * 100) : 0; ?>
            <a href="/tractate.php?slug=<?= h($t['slug']) ?>"
               class="card min-w-[140px] flex-shrink-0 flex flex-col items-center text-center hover:shadow-card-lg transition" style="scroll-snap-align: start;">
                <p class="font-semibold text-navy text-sm mb-3">מסכת <?= h($t['name_he']) ?></p>
                <div class="progress-ring w-16 h-16" style="--pct: <?= (float) $pct ?>;">
                    <div class="progress-ring-inner w-12 h-12 flex items-center justify-center text-xs font-bold text-navy">
                        <?= (int) $t['learned'] ?>/<?= (int) $t['mishna_count'] ?>
                    </div>
                </div>
            </a>
        <?php endforeach; ?>
    </div>
</div>

<script>
document.getElementById('carousel-next')?.addEventListener('click', () => {
    document.getElementById('tractate-carousel').scrollBy({ left: -240, behavior: 'smooth' });
});
document.getElementById('carousel-prev')?.addEventListener('click', () => {
    document.getElementById('tractate-carousel').scrollBy({ left: 240, behavior: 'smooth' });
});

document.getElementById('complete-today-btn')?.addEventListener('click', function () {
    const mishnaId = this.dataset.mishnaId;
    if (!mishnaId || mishnaId === '0') return;
    toggleMishnaComplete(mishnaId, this.dataset.csrf, (data) => {
        if (!data.ok) return;
        const btn = document.getElementById('complete-today-btn');
        const label = document.getElementById('complete-today-label');
        if (data.completed) {
            btn.classList.add('bg-gold', 'text-white');
            btn.classList.remove('bg-cream-dark', 'text-ink/40');
            label.textContent = 'סיימתי ללמוד היום';
        } else {
            btn.classList.remove('bg-gold', 'text-white');
            btn.classList.add('bg-cream-dark', 'text-ink/40');
            label.textContent = 'סמנו כשסיימתם ללמוד היום';
        }
        document.getElementById('stat-streak').textContent = data.stats.streak;
        document.getElementById('stat-learned').textContent = data.stats.learned;
        document.getElementById('stat-percent').textContent = data.stats.percent + '%';
        document.getElementById('stat-percent-ring').style.setProperty('--pct', data.stats.percent);
    });
});
</script>

<?php include __DIR__ . '/../app/partials/page_end.php'; ?>
