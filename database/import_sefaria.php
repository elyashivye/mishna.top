<?php
/**
 * סקריפט CLI חד-פעמי: מייבא את טקסט 63 מסכתות המשנה (עברית עם ניקוד)
 * מ-Sefaria-Export (Google Cloud Storage, ציבורי, ללא צורך במפתח API) אל בסיס הנתונים.
 * לוחות הלימוד האישיים (member_schedule) נבנים בזמן ריצה per-page, לא כאן.
 *
 * הרצה: php database/import_sefaria.php
 */

require __DIR__ . '/../app/db.php';

$tractates = require __DIR__ . '/tractates_data.php';

function fetchJson(string $url): array
{
    $encodedUrl = str_replace(' ', '%20', $url);
    $context = stream_context_create(['http' => ['timeout' => 60]]);
    $raw = @file_get_contents($encodedUrl, false, $context);
    if ($raw === false) {
        throw new RuntimeException("נכשל בשליפת: $encodedUrl");
    }
    $data = json_decode($raw, true);
    if (!is_array($data) || !isset($data['text'])) {
        throw new RuntimeException("תגובה לא תקינה מ: $encodedUrl");
    }
    return $data;
}

$pdo = db();
$pdo->beginTransaction();

$insertTractate = $pdo->prepare(
    'INSERT INTO tractates (seder, seder_he, name_he, slug, chapter_count, mishna_count, sort_order)
     VALUES (:seder, :seder_he, :name_he, :slug, :chapter_count, :mishna_count, :sort_order)
     ON DUPLICATE KEY UPDATE seder=VALUES(seder), seder_he=VALUES(seder_he), name_he=VALUES(name_he),
       chapter_count=VALUES(chapter_count), mishna_count=VALUES(mishna_count), sort_order=VALUES(sort_order)'
);
$insertMishna = $pdo->prepare(
    'INSERT INTO mishnayot (tractate_id, chapter, mishna_num, text_he, sefaria_ref, sort_order)
     VALUES (:tractate_id, :chapter, :mishna_num, :text_he, :sefaria_ref, :sort_order)
     ON DUPLICATE KEY UPDATE text_he=VALUES(text_he), sort_order=VALUES(sort_order)'
);

$globalSortOrder = 1;
$totalMishnayot = 0;

foreach ($tractates as $t) {
    echo "מייבא: {$t['name_he']} ({$t['title_en']})... ";
    $data = fetchJson(buildUrl($t));
    $chapters = $data['text'];
    $chapterCount = count($chapters);
    $mishnaCount = 0;
    foreach ($chapters as $ch) {
        $mishnaCount += count($ch);
    }

    $insertTractate->execute([
        ':seder' => $t['seder'],
        ':seder_he' => $t['seder_he'],
        ':name_he' => $t['name_he'],
        ':slug' => $t['slug'],
        ':chapter_count' => $chapterCount,
        ':mishna_count' => $mishnaCount,
        ':sort_order' => $t['sort_order'],
    ]);
    $tractateId = (int) $pdo->lastInsertId();
    if ($tractateId === 0) {
        $tractateId = (int) $pdo->query(
            "SELECT id FROM tractates WHERE slug = " . $pdo->quote($t['slug'])
        )->fetchColumn();
    }

    foreach ($chapters as $chapterIndex => $mishnayotInChapter) {
        foreach ($mishnayotInChapter as $mishnaIndex => $text) {
            $chapterNum = $chapterIndex + 1;
            $mishnaNum = $mishnaIndex + 1;
            $ref = "{$t['title_en']}.{$chapterNum}.{$mishnaNum}";
            $insertMishna->execute([
                ':tractate_id' => $tractateId,
                ':chapter' => $chapterNum,
                ':mishna_num' => $mishnaNum,
                ':text_he' => trim((string) $text),
                ':sefaria_ref' => $ref,
                ':sort_order' => $globalSortOrder,
            ]);
            $globalSortOrder++;
            $totalMishnayot++;
        }
    }
    echo "{$chapterCount} פרקים, {$mishnaCount} משניות\n";
}

$pdo->commit();
echo "הושלם: {$totalMishnayot} משניות יובאו ב-" . count($tractates) . " מסכתות.\n";

function buildUrl(array $t): string
{
    return 'https://storage.googleapis.com/sefaria-export/json/Mishnah/Seder '
        . ucfirst($t['seder']) . '/' . $t['sefaria_title'] . '/Hebrew/merged.json';
}
