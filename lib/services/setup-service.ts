import fs from "fs";
import path from "path";
import mysql from "mysql2/promise";
import { db, queryOne, execute } from "@/lib/db";
import { TRACTATES_DATA, type TractateSeed } from "@/database/tractates-data";

/**
 * לוגיקת ההקמה החד-פעמית של מסד הנתונים בפרודקשן — מופעלת דרך /api/setup
 * (קישור מוגן ב-SETUP_SECRET שנפתח פעם אחת בדפדפן, ולא דרך גישה ישירה למסד
 * מבחוץ). כל הפעולות אידמפוטנטיות — הרצה חוזרת בטוחה.
 */

function dbConnectionConfig() {
  return {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT ?? 3306),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    charset: "utf8mb4_unicode_ci" as const,
  };
}

async function columnExists(table: string, column: string): Promise<boolean> {
  const row = await queryOne<{ c: number }>(
    `SELECT COUNT(*) AS c FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [table, column]
  );
  return (row?.c ?? 0) > 0;
}

/** מיגרציות אידמפוטנטיות למסדים שכבר קיימים מלפני תמיכת Google Sign-In / תצוגת תאריך. */
async function runSchemaMigrations(): Promise<void> {
  if (!(await columnExists("users", "google_id"))) {
    await execute("ALTER TABLE users ADD COLUMN google_id VARCHAR(64) NULL UNIQUE AFTER email");
  }
  const row = await queryOne<{ IS_NULLABLE: string }>(
    `SELECT IS_NULLABLE FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'password_hash'`
  );
  if (row?.IS_NULLABLE === "NO") {
    await execute("ALTER TABLE users MODIFY password_hash VARCHAR(255) NULL");
  }
  if (!(await columnExists("users", "date_display"))) {
    await execute(
      "ALTER TABLE users ADD COLUMN date_display ENUM('hebrew','both') NOT NULL DEFAULT 'both' AFTER google_id"
    );
  }
  if (!(await columnExists("mishnayot", "bartenura_he"))) {
    await execute("ALTER TABLE mishnayot ADD COLUMN bartenura_he MEDIUMTEXT NULL AFTER text_he");
  }
}

/** יוצר את כל הטבלאות (CREATE TABLE IF NOT EXISTS — בטוח על מסד קיים) ומריץ מיגרציות. */
export async function runSchemaSetup(): Promise<void> {
  const schemaPath = path.join(process.cwd(), "database", "schema.sql");
  const sql = fs.readFileSync(schemaPath, "utf-8");

  const conn = await mysql.createConnection({ ...dbConnectionConfig(), multipleStatements: true });
  try {
    await conn.query(sql);
  } finally {
    await conn.end();
  }

  await runSchemaMigrations();
}

export interface SefariaImportResult {
  tractates: number;
  mishnayot: number;
}

function buildSefariaUrl(t: TractateSeed): string {
  const seder = t.seder.charAt(0).toUpperCase() + t.seder.slice(1);
  const path = `json/Mishnah/Seder ${seder}/${t.sefaria_title}/Hebrew/merged.json`;
  return `https://storage.googleapis.com/sefaria-export/${encodeURI(path)}`;
}

interface SefariaResponse {
  title: string;
  text: string[][];
}

/** בפירוש ברטנורא כל משנה ממופה למערך של קטעי "דיבור המתחיל" (לא מחרוזת בודדת). */
interface BartenuraSefariaResponse {
  title: string;
  text: string[][][];
}

async function fetchSefariaJson<T extends { text: unknown }>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`נכשל בשליפת ${url}: HTTP ${res.status}`);
  const data = (await res.json()) as T;
  if (!data?.text) throw new Error(`תגובה לא תקינה מ: ${url}`);
  return data;
}

/** מייבא/מעדכן את 63 המסכתות ואת כל טקסט המשניות מ-Sefaria-Export. אידמפוטנטי. */
export async function runSefariaImport(onProgress?: (message: string) => void): Promise<SefariaImportResult> {
  const pool = db();
  let globalSortOrder = 1;
  let totalMishnayot = 0;

  for (const t of TRACTATES_DATA) {
    onProgress?.(`מייבא: ${t.name_he} (${t.title_en})...`);
    const data = await fetchSefariaJson<SefariaResponse>(buildSefariaUrl(t));
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
  }

  return { tractates: TRACTATES_DATA.length, mishnayot: totalMishnayot };
}

export interface BartenuraImportResult {
  tractates: number;
  mishnayot: number;
}

function buildBartenuraUrl(t: TractateSeed): string {
  const seder = t.seder.charAt(0).toUpperCase() + t.seder.slice(1);
  const path = `json/Mishnah/Rishonim on Mishnah/Bartenura/Seder ${seder}/Bartenura on ${t.sefaria_title}/Hebrew/merged.json`;
  return `https://storage.googleapis.com/sefaria-export/${encodeURI(path)}`;
}

function stripHtmlTags(text: string): string {
  return text
    .replace(/<\/?[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .trim();
}

/**
 * כל "דיבור המתחיל" בברטנורא מגיע מ-Sefaria כ-<b>לֶמָּה</b>. גוף ההסבר.
 * מפרק לזוג {lemma, body} כדי לאפשר הדגשת הלמה והפרדת פסקאות בתצוגה,
 * בלי להזדקק ל-dangerouslySetInnerHTML על טקסט חיצוני.
 */
function parseBartenuraSegment(raw: string): { lemma: string | null; body: string } {
  const match = raw.match(/^<b>([\s\S]*?)<\/b>\.?\s*/);
  if (match) {
    const lemma = stripHtmlTags(match[1]).replace(/\.$/, "");
    const body = stripHtmlTags(raw.slice(match[0].length));
    return { lemma: lemma || null, body };
  }
  return { lemma: null, body: stripHtmlTags(raw) };
}

/**
 * מייבא/מעדכן את פירוש ר' עובדיה מברטנורא (רישונים, פומבי-דומיין — נפטר ~1515)
 * על כל 63 המסכתות, מ-Sefaria-Export. אידמפוטנטי; מתאים מסכתות/פרקים/משניות
 * לפי (tractate slug, chapter, mishna_num) שכבר קיימים מ-runSefariaImport.
 */
export async function runBartenuraImport(onProgress?: (message: string) => void): Promise<BartenuraImportResult> {
  const pool = db();
  let totalMishnayot = 0;

  for (const t of TRACTATES_DATA) {
    onProgress?.(`מייבא פירוש ברטנורא: ${t.name_he} (${t.title_en})...`);

    const [idRows] = await pool.query("SELECT id FROM tractates WHERE slug = ?", [t.slug]);
    const tractateRow = (idRows as { id: number }[])[0];
    if (!tractateRow) continue; // המסכתה עצמה עוד לא יובאה — יש להריץ קודם את runSefariaImport
    const tractateId = tractateRow.id;

    let data: BartenuraSefariaResponse;
    try {
      data = await fetchSefariaJson<BartenuraSefariaResponse>(buildBartenuraUrl(t));
    } catch {
      continue; // לא כל המסכתות/מהדורות זהות; דילוג על מסכת בודדת לא אמור לקרות בפועל (וידאנו 63/63)
    }
    const chapters = data.text;

    for (let chapterIndex = 0; chapterIndex < chapters.length; chapterIndex++) {
      const mishnayotInChapter = chapters[chapterIndex];
      for (let mishnaIndex = 0; mishnaIndex < mishnayotInChapter.length; mishnaIndex++) {
        const chapterNum = chapterIndex + 1;
        const mishnaNum = mishnaIndex + 1;
        const rawSegments = mishnayotInChapter[mishnaIndex];
        if (!rawSegments || rawSegments.length === 0) continue;
        const segments = rawSegments.map(parseBartenuraSegment).filter((s) => s.body);
        if (segments.length === 0) continue;

        await pool.query(
          `UPDATE mishnayot SET bartenura_he = ? WHERE tractate_id = ? AND chapter = ? AND mishna_num = ?`,
          [JSON.stringify(segments), tractateId, chapterNum, mishnaNum]
        );
        totalMishnayot++;
      }
    }
  }

  return { tractates: TRACTATES_DATA.length, mishnayot: totalMishnayot };
}

export interface SetupStatus {
  initialized: boolean;
  users: number;
  tractates: number;
  mishnayot: number;
  bartenura: number;
  studyPages: number;
  error?: string;
}

export async function getSetupStatus(): Promise<SetupStatus> {
  try {
    const [u, t, m, b, p] = await Promise.all([
      queryOne<{ c: number }>("SELECT COUNT(*) AS c FROM users"),
      queryOne<{ c: number }>("SELECT COUNT(*) AS c FROM tractates"),
      queryOne<{ c: number }>("SELECT COUNT(*) AS c FROM mishnayot"),
      queryOne<{ c: number }>("SELECT COUNT(*) AS c FROM mishnayot WHERE bartenura_he IS NOT NULL"),
      queryOne<{ c: number }>("SELECT COUNT(*) AS c FROM study_pages"),
    ]);
    return {
      initialized: true,
      users: u?.c ?? 0,
      tractates: t?.c ?? 0,
      mishnayot: m?.c ?? 0,
      bartenura: b?.c ?? 0,
      studyPages: p?.c ?? 0,
    };
  } catch (err) {
    return {
      initialized: false,
      users: 0,
      tractates: 0,
      mishnayot: 0,
      bartenura: 0,
      studyPages: 0,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
