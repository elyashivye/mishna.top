<?php
require __DIR__ . '/../app/auth.php';
require __DIR__ . '/../app/functions.php';

$user = requireLogin();
$userId = (int) $user['id'];
$page = requireCurrentPage($userId);
$pageId = (int) $page['id'];

$error = null;

if ($_SERVER['REQUEST_METHOD'] === 'POST' && $page['mode'] === 'group') {
    if (!verifyCsrf()) {
        $error = 'הבקשה פגה, נסו שוב.';
    } else {
        $action = $_POST['action'] ?? '';
        $tractateId = (int) ($_POST['tractate_id'] ?? 0);
        if ($action === 'claim') {
            $result = claimTractate($pageId, $userId, $tractateId);
            if (!$result['ok']) {
                $error = $result['error'];
            }
        } elseif ($action === 'release') {
            unclaimTractate($pageId, $userId, $tractateId);
        }
        if (!$error) {
            header('Location: /tractates.php');
            exit;
        }
    }
}

$tractates = getPageTractatesWithClaimStatus($pageId, $userId);
$myProgress = [];
foreach (getMyClaimedTractatesWithProgress($pageId, $userId) as $t) {
    $myProgress[(int) $t['id']] = $t['learned'];
}
$grouped = [];
foreach ($tractates as $t) {
    $grouped[$t['seder_he']][] = $t;
}

$pageTitle = ($page['mode'] === 'group' ? 'לוח תפיסת מסכתות' : 'המסכתות שלי') . ' — משנה של נשמה';
include __DIR__ . '/../app/partials/page_start.php';
?>

<div class="mt-4">
    <h1 class="font-bold text-navy text-xl mb-1 flex items-center gap-2">
        <?= icon('book', 'w-6 h-6 text-gold') ?> <?= $page['mode'] === 'group' ? 'לוח תפיסת מסכתות' : 'המסכתות שלי' ?>
    </h1>
    <p class="text-ink/60 text-sm mb-5">
        עמוד: <?= h($page['name_he']) ?>
        <?php if ($page['mode'] === 'group'): ?> · כל מסכת ניתנת לתפיסה בלעדית ע"י חבר אחד בקבוצה<?php endif; ?>
    </p>

    <?php if ($error): ?>
        <div class="mb-4 rounded-lg bg-red-50 text-red-700 text-sm px-4 py-3"><?= h($error) ?></div>
    <?php endif; ?>

    <?php foreach ($grouped as $sederHe => $items): ?>
        <div class="mb-8">
            <h2 class="text-sm font-bold text-gold-dark tracking-wide mb-3">סדר <?= h($sederHe) ?></h2>
            <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <?php foreach ($items as $t): ?>
                    <?php
                    $isMine = $t['is_mine'];
                    $isTaken = $t['claimed_by_id'] !== null;
                    $learned = $isMine ? ($myProgress[(int) $t['id']] ?? 0) : 0;
                    $pct = $isMine && $t['mishna_count'] > 0 ? round(($learned / $t['mishna_count']) * 100) : 0;
                    ?>
                    <?php if ($isMine): ?>
                        <a href="/tractate.php?slug=<?= h($t['slug']) ?>" class="card flex items-center gap-4 hover:shadow-card-lg transition">
                            <div class="progress-ring w-14 h-14 flex-shrink-0" style="--pct: <?= (float) $pct ?>;">
                                <div class="progress-ring-inner w-10 h-10 flex items-center justify-center text-[11px] font-bold text-navy">
                                    <?= (int) $learned ?>/<?= (int) $t['mishna_count'] ?>
                                </div>
                            </div>
                            <div>
                                <p class="font-semibold text-navy">מסכת <?= h($t['name_he']) ?></p>
                                <p class="text-xs text-ink/50 mt-0.5"><?= $pct ?>% הושלם</p>
                            </div>
                        </a>
                    <?php elseif ($isTaken): ?>
                        <div class="card flex items-center gap-4 opacity-60">
                            <div class="w-14 h-14 rounded-full bg-cream-dark flex items-center justify-center flex-shrink-0 text-ink/30">
                                <?= icon('lock', 'w-6 h-6') ?>
                            </div>
                            <div>
                                <p class="font-semibold text-navy">מסכת <?= h($t['name_he']) ?></p>
                                <p class="text-xs text-ink/50 mt-0.5">תפוסה ע"י <?= h($t['claimed_by_name']) ?></p>
                            </div>
                        </div>
                    <?php else: ?>
                        <form method="post" class="card flex items-center gap-4 border-2 border-dashed border-gold/40">
                            <?= csrfField() ?>
                            <input type="hidden" name="action" value="claim">
                            <input type="hidden" name="tractate_id" value="<?= (int) $t['id'] ?>">
                            <div class="w-14 h-14 rounded-full bg-gold/10 flex items-center justify-center flex-shrink-0 text-gold">
                                <?= icon('plus', 'w-6 h-6') ?>
                            </div>
                            <div class="flex-1">
                                <p class="font-semibold text-navy">מסכת <?= h($t['name_he']) ?></p>
                                <p class="text-xs text-ink/50 mt-0.5"><?= (int) $t['mishna_count'] ?> משניות · פנויה</p>
                            </div>
                            <button type="submit" class="btn-pill bg-gold text-white hover:bg-gold-dark text-xs flex-shrink-0">תפיסה</button>
                        </form>
                    <?php endif; ?>
                <?php endforeach; ?>
            </div>
        </div>
    <?php endforeach; ?>
</div>

<?php include __DIR__ . '/../app/partials/page_end.php'; ?>
