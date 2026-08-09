/**
 * סקריפט CLI חד-פעמי: מייבא את טקסט 63 מסכתות המשנה (עברית עם ניקוד)
 * מ-Sefaria-Export (Google Cloud Storage, ציבורי, ללא צורך במפתח API) אל בסיס הנתונים.
 * לוחות הלימוד האישיים (member_schedule) נבנים בזמן ריצה per-page, לא כאן.
 *
 * הרצה: node --env-file=.env.local --import tsx scripts/import-sefaria.ts
 */
import { db } from "../lib/db";
import { TRACTATES_DATA, type TractateSeed } from "../database/tractates-data";

interface SefariaResponse {
  title: string;
  text: string[][];
}

function buildUrl(t: TractateSeed): string {
  const seder = t.seder.charAt(0).toUpperCase() + t.seder.slice(1);
  const path = `json/Mishnah/Seder ${seder}/${t.sefaria_title}/Hebrew/merged.json`;
  return `https://storage.googleapis.com/sefaria-export/${encodeURI(path)}`;
}

async function fetchJson(url: string): Promise<SefariaResponse> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`נכשל בשליפת ${url}: HTTP ${res.status}`);
  }
  const data = (await res.json()) as SefariaResponse;
  if (!data?.text) {
    throw new Error(`תגובה לא תקינה מ: ${url}`);
  }
  return data;
}

async function main() {
  const pool = db();
  let globalSortOrder = 1;
  let totalMishnayot = 0;

  for (const t of TRACTATES_DATA) {
    process.stdout.write(`מייבא: ${t.name_he} (${t.title_en})... `);
    const data = await fetchJson(buildUrl(t));
    const chapters = data.text;
    const chapterCount = chapters.length;
    const mishnaCount = chapters.reduce((sum, ch) => sum + ch.length, 0);

    await pool.query(
      `INSERT INTO tractates (seder, seder_he, name_he, slug, chapter_count, mishna_count, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE seder=VALUES(seder), seder_he=VALUES(seder_he), name_he=VALUES(name_he),
         chapter_count=VALUES(chapter_count), mishna_count=VALUES(mishna_count), sort_order=VALUES(sort_order)`,
      [t.seder, t.seder_he, t.name_he, t.slug, chapterCount, mishnaCount, t.sort_order]
    );
    const [idRows] = await pool.query("SELECT id FROM tractates WHERE slug = ?", [t.slug]);
    const tractateId = (idRows as { id: number }[])[0].id;

    for (let chapterIndex = 0; chapterIndex < chapters.length; chapterIndex++) {
      const mishnayotInChapter = chapters[chapterIndex];
      for (let mishnaIndex = 0; mishnaIndex < mishnayotInChapter.length; mishnaIndex++) {
        const chapterNum = chapterIndex + 1;
        const mishnaNum = mishnaIndex + 1;
        const ref = `${t.title_en}.${chapterNum}.${mishnaNum}`;
        const text = mishnayotInChapter[mishnaIndex]?.trim() ?? "";

        await pool.query(
          `INSERT INTO mishnayot (tractate_id, chapter, mishna_num, text_he, sefaria_ref, sort_order)
           VALUES (?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE text_he=VALUES(text_he), sort_order=VALUES(sort_order)`,
          [tractateId, chapterNum, mishnaNum, text, ref, globalSortOrder]
        );
        globalSortOrder++;
        totalMishnayot++;
      }
    }
    console.log(`${chapterCount} פרקים, ${mishnaCount} משניות`);
  }

  console.log(`הושלם: ${totalMishnayot} משניות יובאו ב-${TRACTATES_DATA.length} מסכתות.`);
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
