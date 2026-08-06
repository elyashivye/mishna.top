<?php
require __DIR__ . '/../app/auth.php';
require __DIR__ . '/../app/functions.php';

$user = requireLogin();
$userId = (int) $user['id'];

if (isset($_GET['id'])) {
    $requestedId = (int) $_GET['id'];
    if (!isPageMember($requestedId, $userId)) {
        header('Location: /pages.php');
        exit;
    }
    setCurrentPageId($requestedId);
    header('Location: /page.php');
    exit;
}

$page = requireCurrentPage($userId);
$pageId = (int) $page['id'];

$userStats = getUserStats($userId); // רצף ימים גלובלי
$pageStats = getPageStats($pageId, $userId);
$dedicationDate = getDedicationDateDisplay($page);
$today = getMemberTodayMishna($pageId, $userId);
$todayCompleted = $today ? isMishnaCompletedByUser($userId, (int) $today['id']) : false;
$myTractates = getMyClaimedTractatesWithProgress($pageId, $userId);
$members = $page['mode'] === 'group' ? getPageMembers($pageId) : [];
$groupStats = $page['mode'] === 'group' ? getPageGroupStats($pageId) : null;

$pageTitle = h($page['name_he']) . ' — משנה של נשמה';
include __DIR__ . '/../app/partials/page_start.php';
?>

<div class="grid md:grid-cols-3 gap-5 mt-4">
    <!-- כרטיס הקדשה -->
    <div class="card flex flex-col items-center justify-center text-center">
        <div class="text-gold mb-2"><?= icon('candle', 'w-9 h-9') ?></div>
        <p class="text-ink/60 text-sm mb-1"><?= $page['dtype'] === 'refuah' ? 'לרפואת' : 'לעילוי נשמת' ?></p>
        <p class="font-bold text-navy text-lg leading-snug"><?= h($page['name_he']) ?></p>
        <?php if ($dedicationDate): ?>
            <p class="text-ink/50 text-sm mt-1">
                <?= h($dedicationDate['hebrew_display']) ?>
                <?php if ($dedicationDate['gregorian_display']): ?>
                    <span class="text-ink/35">(<?= h($dedicationDate['gregorian_display']) ?>)</span>
                <?php endif; ?>
            </p>
            <?php if ($dedicationDate['days_until'] !== null): ?>
                <p class="text-xs mt-1 <?= $dedicationDate['days_until'] <= 7 ? 'text-gold-dark font-semibold' : 'text-ink/40' ?>">
                    <?= $page['dtype'] === 'refuah' ? 'האזכרה הבאה' : 'היארצייט הבא' ?> בעוד
                    <?= $dedicationDate['days_until'] === 0 ? 'היום' : (int) $dedicationDate['days_until'] . ' ימים' ?>
                    (<?= h($dedicationDate['next_occurrence']->format('Y-m-d')) ?>)
                </p>
            <?php endif; ?>
        <?php endif; ?>
        <?php if ($page['dtype'] === 'neshama'): ?>
            <p class="text-ink/40 text-xs mt-2">ת.נ.צ.ב.ה</p>
        <?php endif; ?>
        <p class="text-xs text-ink/40 mt-3">
            <?= $page['mode'] === 'group' ? 'עמוד קבוצתי · ' . count($members) . ' חברים' : 'עמוד לימוד אישי' ?>
            · יעד לסיום: <?= h($page['target_end_date']) ?>
        </p>
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
            <div id="stat-streak" class="text-2xl font-extrabold text-navy"><?= (int) $userStats['streak'] ?></div>
            <div class="text-xs text-ink/60">רצף ימים</div>
        </div>
    </div>
    <div class="card flex items-center gap-3">
        <span class="text-gold"><?= icon('book', 'w-8 h-8') ?></span>
        <div>
            <div id="stat-learned" class="text-2xl font-extrabold text-navy"><?= (int) $pageStats['learned'] ?></div>
            <div class="text-xs text-ink/60">משניות נלמדו בעמוד זה</div>
        </div>
    </div>
    <div class="card flex items-center gap-3">
        <div id="stat-percent-ring" class="progress-ring w-12 h-12" style="--pct: <?= (float) $pageStats['percent'] ?>;">
            <div id="stat-percent" class="progress-ring-inner w-9 h-9 flex items-center justify-center text-xs font-bold text-navy"><?= (int) $pageStats['percent'] ?>%</div>
        </div>
        <div>
            <div class="text-xs text-ink/60">ההתקדמות שלי בעמוד</div>
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
            <h2 class="font-bold text-navy text-lg flex items-center gap-2"><?= icon('sun', 'w-5 h-5 text-gold') ?> המשנה היומית שלי</h2>
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
        <?php elseif ($page['mode'] === 'group'): ?>
            <p class="text-ink/60">עדיין לא תפסתם מסכת בעמוד הזה. <a href="/tractates.php" class="text-gold-dark hover:underline">לכו ללוח תפיסת המסכתות</a>.</p>
        <?php else: ?>
            <p class="text-ink/60">לא נמצאה משנה יומית להיום.</p>
        <?php endif; ?>
    </div>
</div>

<?php if ($page['mode'] === 'group'): ?>
<!-- קבוצה -->
<div class="mt-6">
    <div class="flex items-center justify-between mb-3 flex-wrap gap-2">
        <h2 class="font-bold text-navy text-lg">חברי הקבוצה</h2>
        <div class="flex items-center gap-2">
            <span class="text-xs text-ink/50">התקדמות קבוצתית כוללת: <?= (int) $groupStats['learned'] ?>/<?= (int) $groupStats['total'] ?> (<?= (int) $groupStats['percent'] ?>%)</span>
            <a href="/tractates.php" class="btn-pill bg-cream-dark text-navy text-xs">לוח תפיסת מסכתות</a>
        </div>
    </div>
    <div class="card !p-0 overflow-hidden divide-y divide-gray-100">
        <?php foreach ($members as $m): ?>
            <div class="flex items-center justify-between px-6 py-3">
                <div>
                    <p class="font-semibold text-navy text-sm"><?= h($m['name']) ?> <?= $m['role'] === 'owner' ? '<span class="text-xs text-gold-dark">(יוזם)</span>' : '' ?></p>
                    <p class="text-xs text-ink/50 mt-0.5"><?= $m['claimed_tractates'] ? h(implode(', ', $m['claimed_tractates'])) : 'טרם תפס מסכת' ?></p>
                </div>
                <span class="text-xs text-ink/60"><?= (int) $m['stats']['learned'] ?>/<?= (int) $m['stats']['total'] ?></span>
            </div>
        <?php endforeach; ?>
    </div>
    <?php if ($page['invite_code']): ?>
        <div class="card mt-4 flex items-center justify-between flex-wrap gap-3">
            <div>
                <p class="text-sm font-semibold text-navy">הזמנת חברים נוספים</p>
                <p class="text-xs text-ink/50 mt-0.5">שתפו את הקישור כדי שאחרים יוכלו להצטרף ולתפוס מסכת</p>
            </div>
            <button type="button" id="copy-invite" data-link="<?= h((($_SERVER['HTTPS'] ?? '') === 'on' ? 'https' : 'http') . '://' . $_SERVER['HTTP_HOST'] . '/join.php?code=' . $page['invite_code']) ?>"
                    class="btn-pill bg-navy text-white"><?= icon('share', 'w-4 h-4') ?> העתקת קישור הזמנה</button>
        </div>
    <?php endif; ?>
</div>
<?php endif; ?>

<!-- קרוסלת התקדמות במסכתות שתפסתי -->
<div class="mt-6">
    <div class="flex items-center justify-between mb-3">
        <h2 class="font-bold text-navy text-lg">המסכתות שתפסתי בעמוד זה</h2>
        <?php if ($page['mode'] === 'group'): ?>
            <a href="/tractates.php" class="text-xs text-gold-dark hover:underline">לתפוס עוד מסכתות</a>
        <?php endif; ?>
    </div>
    <?php if (!$myTractates): ?>
        <div class="card text-center text-ink/60">עדיין לא תפסתם מסכת. <a href="/tractates.php" class="text-gold-dark hover:underline">לכו ללוח תפיסת המסכתות</a>.</div>
    <?php else: ?>
        <div id="tractate-carousel" class="flex gap-4 overflow-x-auto pb-2 scroll-smooth" style="scroll-snap-type: x proximity;">
            <?php foreach ($myTractates as $t): ?>
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
    <?php endif; ?>
</div>

<script>
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
        location.reload();
    });
});

document.getElementById('copy-invite')?.addEventListener('click', async function () {
    try {
        await navigator.clipboard.writeText(this.dataset.link);
        this.textContent = 'הקישור הועתק!';
    } catch (e) {
        prompt('העתיקו את הקישור:', this.dataset.link);
    }
});
</script>

<?php include __DIR__ . '/../app/partials/page_end.php'; ?>
