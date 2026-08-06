<?php
require __DIR__ . '/../app/auth.php';
require __DIR__ . '/../app/functions.php';

$user = requireLogin();
$userId = (int) $user['id'];

$error = null;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!verifyCsrf()) {
        $error = 'הבקשה פגה, נסו שוב.';
    } else {
        $nameHe = trim($_POST['name_he'] ?? '');
        $pace = $_POST['pace'] ?? 'year';
        $customEndDate = trim($_POST['custom_end_date'] ?? '');
        $dateMode = $_POST['date_input_mode'] ?? '';
        $gregDate = trim($_POST['passing_date_gregorian'] ?? '');
        $heMonth = $_POST['passing_hebrew_month'] ?? '';
        $heDay = $_POST['passing_hebrew_day'] ?? '';

        if ($nameHe === '') {
            $error = 'נא להזין שם.';
        } elseif ($pace === 'custom' && !preg_match('/^\d{4}-\d{2}-\d{2}$/', $customEndDate)) {
            $error = 'נא לבחור תאריך יעד תקין לסיום.';
        } elseif ($dateMode === 'gregorian' && $gregDate !== '' && !preg_match('/^\d{4}-\d{2}-\d{2}$/', $gregDate)) {
            $error = 'תאריך לא תקין.';
        } elseif ($dateMode === 'hebrew' && $heMonth !== '' && !array_key_exists($heMonth, HEBREW_MONTH_NAMES_HE)) {
            $error = 'חודש עברי לא תקין.';
        } else {
            $pageId = createStudyPage($userId, [
                'name_he' => $nameHe,
                'date_input_mode' => $dateMode,
                'passing_date_gregorian' => $gregDate,
                'passing_hebrew_month' => $heMonth,
                'passing_hebrew_day' => $heDay,
                'dtype' => $_POST['dtype'] ?? 'neshama',
                'notes' => trim($_POST['notes'] ?? ''),
                'mode' => $_POST['mode'] ?? 'solo',
                'pace' => $pace,
                'custom_end_date' => $customEndDate ?: null,
            ]);
            setCurrentPageId($pageId);
            $page = getStudyPage($pageId);
            header('Location: ' . ($page['mode'] === 'group' ? '/tractates.php' : '/page.php'));
            exit;
        }
    }
}

$pageTitle = 'יצירת עמוד לימוד — משנה של נשמה';
include __DIR__ . '/../app/partials/page_start.php';
?>

<div class="mt-4 max-w-2xl mx-auto">
    <h1 class="font-bold text-navy text-xl mb-1 flex items-center gap-2"><?= icon('plus', 'w-6 h-6 text-gold') ?> יצירת עמוד לימוד</h1>
    <p class="text-ink/60 text-sm mb-6">פתחו עמוד לימוד לעילוי נשמה או לרפואה — לבד או כקבוצה שמתחלקת במסכתות.</p>

    <?php if ($error): ?>
        <div class="mb-4 rounded-lg bg-red-50 text-red-700 text-sm px-4 py-3"><?= h($error) ?></div>
    <?php endif; ?>

    <form method="post" class="card space-y-6">
        <?= csrfField() ?>

        <div>
            <h2 class="font-bold text-navy mb-3">פרטי ההקדשה</h2>
            <div class="space-y-4">
                <div>
                    <label class="block text-sm text-ink/70 mb-1">סוג ההקדשה</label>
                    <div class="flex gap-3">
                        <label class="flex items-center gap-1.5 text-sm"><input type="radio" name="dtype" value="neshama" checked> לעילוי נשמה</label>
                        <label class="flex items-center gap-1.5 text-sm"><input type="radio" name="dtype" value="refuah"> לרפואה</label>
                    </div>
                </div>
                <div>
                    <label class="block text-sm text-ink/70 mb-1">שם (לדוגמה: ר' משה בן יצחק ז"ל)</label>
                    <input type="text" name="name_he" required maxlength="150"
                           class="w-full rounded-lg border border-gray-200 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-gold">
                </div>
                <div>
                    <label class="block text-sm text-ink/70 mb-2">תאריך פטירה (אופציונלי)</label>
                    <div class="flex gap-3 mb-3">
                        <label class="flex items-center gap-1.5 text-sm">
                            <input type="radio" name="date_input_mode" value="" checked onchange="toggleDateMode()"> ללא תאריך
                        </label>
                        <label class="flex items-center gap-1.5 text-sm">
                            <input type="radio" name="date_input_mode" value="gregorian" onchange="toggleDateMode()"> יש לי תאריך לועזי
                        </label>
                        <label class="flex items-center gap-1.5 text-sm">
                            <input type="radio" name="date_input_mode" value="hebrew" onchange="toggleDateMode()"> יש לי רק תאריך עברי
                        </label>
                    </div>
                    <div id="date-mode-gregorian" class="hidden">
                        <input type="date" name="passing_date_gregorian"
                               class="rounded-lg border border-gray-200 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-gold">
                        <p class="text-xs text-ink/50 mt-1">התאריך העברי המקביל יחושב אוטומטית ויוצג בעמוד.</p>
                    </div>
                    <div id="date-mode-hebrew" class="hidden flex gap-2 items-center">
                        <select name="passing_hebrew_day" class="rounded-lg border border-gray-200 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-gold">
                            <option value="">יום</option>
                            <?php for ($d = 1; $d <= 30; $d++): ?>
                                <option value="<?= $d ?>"><?= h(hebrewDayGematria($d)) ?> (<?= $d ?>)</option>
                            <?php endfor; ?>
                        </select>
                        <select name="passing_hebrew_month" class="rounded-lg border border-gray-200 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-gold">
                            <option value="">חודש</option>
                            <?php foreach (HEBREW_MONTH_ORDER as $mn): ?>
                                <option value="<?= h($mn) ?>"><?= h(HEBREW_MONTH_NAMES_HE[$mn]) ?></option>
                            <?php endforeach; ?>
                        </select>
                    </div>
                </div>
                <div>
                    <label class="block text-sm text-ink/70 mb-1">הערה (אופציונלי)</label>
                    <input type="text" name="notes" maxlength="255"
                           class="w-full rounded-lg border border-gray-200 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-gold">
                </div>
            </div>
        </div>

        <div class="border-t border-gray-100 pt-5">
            <h2 class="font-bold text-navy mb-3">אופן הלימוד</h2>
            <div class="grid sm:grid-cols-2 gap-3">
                <label class="border-2 rounded-xl p-4 cursor-pointer has-[:checked]:border-gold has-[:checked]:bg-gold/5 border-gray-200">
                    <input type="radio" name="mode" value="solo" checked class="ms-2">
                    <span class="font-semibold text-navy">לימוד אישי</span>
                    <p class="text-xs text-ink/60 mt-1">אתם לומדים לבד את כל הש"ס בקצב שתבחרו.</p>
                </label>
                <label class="border-2 rounded-xl p-4 cursor-pointer has-[:checked]:border-gold has-[:checked]:bg-gold/5 border-gray-200">
                    <input type="radio" name="mode" value="group" class="ms-2">
                    <span class="font-semibold text-navy">קבוצתי</span>
                    <p class="text-xs text-ink/60 mt-1">מזמינים אחרים להצטרף ולתפוס מסכתות פנויות.</p>
                </label>
            </div>
        </div>

        <div class="border-t border-gray-100 pt-5">
            <h2 class="font-bold text-navy mb-3">קצב לסיום הש"ס</h2>
            <div class="grid sm:grid-cols-3 gap-3">
                <label class="border-2 rounded-xl p-3 text-center cursor-pointer has-[:checked]:border-gold has-[:checked]:bg-gold/5 border-gray-200">
                    <input type="radio" name="pace" value="year" checked> <span class="font-semibold text-navy text-sm block mt-1">שנה</span>
                </label>
                <label class="border-2 rounded-xl p-3 text-center cursor-pointer has-[:checked]:border-gold has-[:checked]:bg-gold/5 border-gray-200">
                    <input type="radio" name="pace" value="six_years"> <span class="font-semibold text-navy text-sm block mt-1">6 שנים</span>
                </label>
                <label class="border-2 rounded-xl p-3 text-center cursor-pointer has-[:checked]:border-gold has-[:checked]:bg-gold/5 border-gray-200">
                    <input type="radio" name="pace" value="custom"> <span class="font-semibold text-navy text-sm block mt-1">מותאם אישית</span>
                </label>
            </div>
            <div class="mt-3">
                <label class="block text-sm text-ink/70 mb-1">תאריך יעד לסיום (רק אם נבחר "מותאם אישית")</label>
                <input type="date" name="custom_end_date" class="rounded-lg border border-gray-200 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-gold">
            </div>
        </div>

        <button type="submit" class="w-full bg-navy text-white rounded-lg py-3 font-semibold hover:bg-navy-light transition">
            יצירת עמוד הלימוד
        </button>
    </form>
</div>

<script>
function toggleDateMode() {
    const mode = document.querySelector('input[name="date_input_mode"]:checked').value;
    document.getElementById('date-mode-gregorian').classList.toggle('hidden', mode !== 'gregorian');
    document.getElementById('date-mode-hebrew').classList.toggle('hidden', mode !== 'hebrew');
}
</script>

<?php include __DIR__ . '/../app/partials/page_end.php'; ?>
