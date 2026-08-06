<?php
require __DIR__ . '/../app/auth.php';
require __DIR__ . '/../app/functions.php';

$user = requireLogin();
$userId = (int) $user['id'];
$pdo = db();

$error = null;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!verifyCsrf()) {
        $error = 'הבקשה פגה, נסו שוב.';
    } else {
        $action = $_POST['action'] ?? '';

        if ($action === 'create') {
            $nameHe = trim($_POST['name_he'] ?? '');
            if ($nameHe === '') {
                $error = 'נא להזין שם.';
            } else {
                $isPrimary = isset($_POST['is_primary']) ? 1 : 0;
                if ($isPrimary) {
                    $pdo->prepare('UPDATE dedications SET is_primary = 0 WHERE user_id = :u')->execute([':u' => $userId]);
                }
                $stmt = $pdo->prepare(
                    'INSERT INTO dedications (user_id, name_he, passing_date_he, dtype, notes, is_primary)
                     VALUES (:u, :name, :date, :type, :notes, :primary)'
                );
                $stmt->execute([
                    ':u' => $userId,
                    ':name' => $nameHe,
                    ':date' => trim($_POST['passing_date_he'] ?? '') ?: null,
                    ':type' => in_array($_POST['dtype'] ?? '', ['neshama', 'refuah'], true) ? $_POST['dtype'] : 'neshama',
                    ':notes' => trim($_POST['notes'] ?? '') ?: null,
                    ':primary' => $isPrimary,
                ]);
            }
        } elseif ($action === 'delete') {
            $id = (int) ($_POST['id'] ?? 0);
            $stmt = $pdo->prepare('DELETE FROM dedications WHERE id = :id AND user_id = :u');
            $stmt->execute([':id' => $id, ':u' => $userId]);
        } elseif ($action === 'set_primary') {
            $id = (int) ($_POST['id'] ?? 0);
            $pdo->prepare('UPDATE dedications SET is_primary = 0 WHERE user_id = :u')->execute([':u' => $userId]);
            $pdo->prepare('UPDATE dedications SET is_primary = 1 WHERE id = :id AND user_id = :u')->execute([':id' => $id, ':u' => $userId]);
        }

        if (!$error) {
            header('Location: /dedications.php');
            exit;
        }
    }
}

$dedications = getUserDedications($userId);

$pageTitle = 'הקדשות — משנה של נשמה';
include __DIR__ . '/../app/partials/page_start.php';
?>

<div class="mt-4 grid lg:grid-cols-3 gap-6">
    <div class="lg:col-span-2">
        <h1 class="font-bold text-navy text-xl mb-1 flex items-center gap-2"><?= icon('heart', 'w-6 h-6 text-gold') ?> הקדשות</h1>
        <p class="text-ink/60 text-sm mb-6">הקדישו את הלימוד שלכם לעילוי נשמת יקיריכם או לרפואתם. ההקדשה הראשית תוצג בדף הבית.</p>

        <?php if (!$dedications): ?>
            <div class="card text-center text-ink/60">עדיין אין הקדשות. הוסיפו את הראשונה בטופס שמימין.</div>
        <?php endif; ?>

        <div class="space-y-3">
            <?php foreach ($dedications as $d): ?>
                <div class="card flex items-center justify-between gap-4">
                    <div class="flex items-center gap-3">
                        <span class="text-gold"><?= icon($d['dtype'] === 'refuah' ? 'heart' : 'candle', 'w-6 h-6') ?></span>
                        <div>
                            <p class="font-bold text-navy"><?= h($d['name_he']) ?>
                                <?php if ($d['is_primary']): ?><span class="text-xs bg-gold/20 text-gold-dark rounded-full px-2 py-0.5 ms-2">ראשית</span><?php endif; ?>
                            </p>
                            <p class="text-xs text-ink/50 mt-0.5">
                                <?= $d['dtype'] === 'refuah' ? 'לרפואה' : 'לעילוי נשמה' ?>
                                <?= $d['passing_date_he'] ? ' · ' . h($d['passing_date_he']) : '' ?>
                            </p>
                            <?php if ($d['notes']): ?><p class="text-xs text-ink/50 mt-0.5"><?= h($d['notes']) ?></p><?php endif; ?>
                        </div>
                    </div>
                    <div class="flex items-center gap-2">
                        <?php if (!$d['is_primary']): ?>
                            <form method="post">
                                <?= csrfField() ?>
                                <input type="hidden" name="action" value="set_primary">
                                <input type="hidden" name="id" value="<?= (int) $d['id'] ?>">
                                <button type="submit" class="text-xs text-gold-dark hover:underline">הפוך לראשית</button>
                            </form>
                        <?php endif; ?>
                        <form method="post" onsubmit="return confirm('למחוק הקדשה זו?');">
                            <?= csrfField() ?>
                            <input type="hidden" name="action" value="delete">
                            <input type="hidden" name="id" value="<?= (int) $d['id'] ?>">
                            <button type="submit" class="text-ink/40 hover:text-red-600"><?= icon('trash', 'w-4 h-4') ?></button>
                        </form>
                    </div>
                </div>
            <?php endforeach; ?>
        </div>
    </div>

    <div>
        <div class="card">
            <h2 class="font-bold text-navy mb-4">הוספת הקדשה</h2>
            <?php if ($error): ?>
                <div class="mb-4 rounded-lg bg-red-50 text-red-700 text-sm px-4 py-3"><?= h($error) ?></div>
            <?php endif; ?>
            <form method="post" class="space-y-4">
                <?= csrfField() ?>
                <input type="hidden" name="action" value="create">
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
                    <label class="block text-sm text-ink/70 mb-1">תאריך פטירה / לידה (עברי, אופציונלי)</label>
                    <input type="text" name="passing_date_he" maxlength="60" placeholder="לדוגמה: י״ד שבט תשע״ט"
                           class="w-full rounded-lg border border-gray-200 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-gold">
                </div>
                <div>
                    <label class="block text-sm text-ink/70 mb-1">הערה (אופציונלי)</label>
                    <input type="text" name="notes" maxlength="255"
                           class="w-full rounded-lg border border-gray-200 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-gold">
                </div>
                <label class="flex items-center gap-2 text-sm"><input type="checkbox" name="is_primary"> הצג כהקדשה ראשית בדף הבית</label>
                <button type="submit" class="w-full bg-navy text-white rounded-lg py-3 font-semibold hover:bg-navy-light transition">
                    שמירת הקדשה
                </button>
            </form>
        </div>
    </div>
</div>

<?php include __DIR__ . '/../app/partials/page_end.php'; ?>
