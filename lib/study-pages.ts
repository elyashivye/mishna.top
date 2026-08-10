import "server-only";
import type { ResultSetHeader } from "mysql2/promise";
import { query, queryOne, execute, db } from "./db";
import { gregorianToHebrewParts, findNextHebrewAnniversary, formatHebrewDayMonth } from "./hebrew-date";
import type {
  DedicationType,
  PageStats,
  StudyPage,
  StudyPageMode,
  StudyPagePace,
  StudyPageWithRole,
} from "./types";

/* ===================== יצירה וקריאה של עמודי לימוד ===================== */

function addYears(date: Date, years: number): Date {
  const d = new Date(date);
  d.setFullYear(d.getFullYear() + years);
  return d;
}

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function computeTargetEndDate(pace: StudyPagePace, startDate: string, customDate?: string | null): string {
  const start = new Date(startDate);
  if (pace === "six_years") return toDateStr(addYears(start, 6));
  if (pace === "custom") return customDate || toDateStr(addYears(start, 1));
  return toDateStr(addYears(start, 1));
}

const INVITE_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // בלי תווים דומים (0/O, 1/I)

export async function generateInviteCode(): Promise<string> {
  let code: string;
  let exists: unknown;
  do {
    code = Array.from({ length: 8 }, () => INVITE_CODE_CHARS[Math.floor(Math.random() * INVITE_CODE_CHARS.length)]).join("");
    exists = await queryOne("SELECT 1 FROM study_pages WHERE invite_code = ?", [code]);
  } while (exists);
  return code;
}

export interface DedicationDateInput {
  dateInputMode: "gregorian" | "hebrew" | "";
  passingDateGregorian?: string;
  passingHebrewMonth?: string;
  passingHebrewDay?: string | number;
}

interface ResolvedDateFields {
  passing_date_gregorian: string | null;
  passing_hebrew_month: string | null;
  passing_hebrew_day: number | null;
}

export function resolveDedicationDateFields(data: DedicationDateInput): ResolvedDateFields {
  if (data.dateInputMode === "gregorian" && data.passingDateGregorian) {
    const date = new Date(data.passingDateGregorian);
    const parts = gregorianToHebrewParts(date);
    return {
      passing_date_gregorian: toDateStr(date),
      passing_hebrew_month: parts.monthName,
      passing_hebrew_day: parts.day,
    };
  }
  if (data.dateInputMode === "hebrew" && data.passingHebrewMonth && data.passingHebrewDay) {
    return {
      passing_date_gregorian: null,
      passing_hebrew_month: data.passingHebrewMonth,
      passing_hebrew_day: Number(data.passingHebrewDay),
    };
  }
  return { passing_date_gregorian: null, passing_hebrew_month: null, passing_hebrew_day: null };
}

export interface CreateStudyPageInput extends DedicationDateInput {
  nameHe: string;
  dtype: DedicationType;
  notes?: string;
  mode: StudyPageMode;
  pace: StudyPagePace;
  customEndDate?: string | null;
}

export async function createStudyPage(ownerUserId: number, data: CreateStudyPageInput): Promise<number> {
  const startDate = toDateStr(new Date());
  const targetEndDate = computeTargetEndDate(data.pace, startDate, data.customEndDate);
  const mode: StudyPageMode = data.mode === "group" ? "group" : "solo";
  const inviteCode = mode === "group" ? await generateInviteCode() : null;
  const dateFields = resolveDedicationDateFields(data);

  const conn = await db().getConnection();
  let pageId: number;
  try {
    await conn.beginTransaction();

    const [result] = await conn.query(
      `INSERT INTO study_pages
        (owner_user_id, name_he, passing_date_gregorian, passing_hebrew_month, passing_hebrew_day, dtype, notes, mode, pace, start_date, target_end_date, invite_code)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        ownerUserId,
        data.nameHe,
        dateFields.passing_date_gregorian,
        dateFields.passing_hebrew_month,
        dateFields.passing_hebrew_day,
        data.dtype === "refuah" ? "refuah" : "neshama",
        data.notes || null,
        mode,
        ["year", "six_years", "custom"].includes(data.pace) ? data.pace : "year",
        startDate,
        targetEndDate,
        inviteCode,
      ]
    );
    pageId = (result as ResultSetHeader).insertId;

    await conn.query(
      `INSERT INTO study_page_members (study_page_id, user_id, role) VALUES (?, ?, 'owner')`,
      [pageId, ownerUserId]
    );

    if (mode === "solo") {
      const [tractateRows] = await conn.query("SELECT id FROM tractates");
      for (const t of tractateRows as { id: number }[]) {
        await conn.query(
          "INSERT IGNORE INTO tractate_claims (study_page_id, tractate_id, user_id) VALUES (?, ?, ?)",
          [pageId, t.id, ownerUserId]
        );
      }
    }

    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }

  if (mode === "solo") {
    await generateMemberSchedule(pageId, ownerUserId);
  }

  return pageId;
}

export async function getStudyPage(id: number): Promise<StudyPage | null> {
  return queryOne<StudyPage>("SELECT * FROM study_pages WHERE id = ?", [id]);
}

export async function getStudyPageByInviteCode(code: string): Promise<StudyPage | null> {
  return queryOne<StudyPage>("SELECT * FROM study_pages WHERE invite_code = ?", [code]);
}

export async function isPageMember(studyPageId: number, userId: number): Promise<boolean> {
  const row = await queryOne(
    "SELECT 1 FROM study_page_members WHERE study_page_id = ? AND user_id = ?",
    [studyPageId, userId]
  );
  return row !== null;
}

export async function joinStudyPage(studyPageId: number, userId: number): Promise<void> {
  if (await isPageMember(studyPageId, userId)) return;
  await execute(
    "INSERT INTO study_page_members (study_page_id, user_id, role) VALUES (?, ?, 'member')",
    [studyPageId, userId]
  );
}

export async function getUserStudyPages(userId: number): Promise<(StudyPageWithRole & { stats: PageStats })[]> {
  const pages = await query<StudyPageWithRole>(
    `SELECT sp.*, spm.role,
            (SELECT COUNT(*) FROM study_page_members m2 WHERE m2.study_page_id = sp.id) AS member_count
     FROM study_pages sp
     JOIN study_page_members spm ON spm.study_page_id = sp.id
     WHERE spm.user_id = ?
     ORDER BY sp.created_at DESC`,
    [userId]
  );
  const withStats = await Promise.all(
    pages.map(async (p) => ({ ...p, stats: await getPageStats(p.id, userId) }))
  );
  return withStats;
}

/** התקדמות המשתמש הנוכחי בעמוד: רק מתוך המסכתות שהוא עצמו תפס בעמוד הזה. */
export async function getPageStats(studyPageId: number, userId: number): Promise<PageStats> {
  const totalRow = await queryOne<{ c: number }>(
    `SELECT COUNT(m.id) AS c FROM mishnayot m
     JOIN tractate_claims tc ON tc.tractate_id = m.tractate_id
     WHERE tc.study_page_id = ? AND tc.user_id = ?`,
    [studyPageId, userId]
  );
  const learnedRow = await queryOne<{ c: number }>(
    `SELECT COUNT(*) AS c FROM user_progress up
     JOIN mishnayot m ON m.id = up.mishna_id
     JOIN tractate_claims tc ON tc.tractate_id = m.tractate_id AND tc.study_page_id = ? AND tc.user_id = ?
     WHERE up.user_id = ?`,
    [studyPageId, userId, userId]
  );
  const total = totalRow?.c ?? 0;
  const learned = learnedRow?.c ?? 0;
  return { total, learned, percent: total > 0 ? Math.round((learned / total) * 100) : 0 };
}

/** התקדמות מצטברת של כל הקבוצה בעמוד. */
export async function getPageGroupStats(studyPageId: number): Promise<PageStats> {
  const totalRow = await queryOne<{ c: number }>(
    `SELECT COUNT(m.id) AS c FROM mishnayot m
     JOIN tractate_claims tc ON tc.tractate_id = m.tractate_id
     WHERE tc.study_page_id = ?`,
    [studyPageId]
  );
  const learnedRow = await queryOne<{ c: number }>(
    `SELECT COUNT(*) AS c FROM user_progress up
     JOIN mishnayot m ON m.id = up.mishna_id
     JOIN tractate_claims tc ON tc.tractate_id = m.tractate_id AND tc.study_page_id = ? AND tc.user_id = up.user_id`,
    [studyPageId]
  );
  const total = totalRow?.c ?? 0;
  const learned = learnedRow?.c ?? 0;
  return { total, learned, percent: total > 0 ? Math.round((learned / total) * 100) : 0 };
}

export interface PageMember {
  user_id: number;
  role: "owner" | "member";
  joined_at: string;
  name: string;
  stats: PageStats;
  claimed_tractates: string[];
}

export async function getPageMembers(studyPageId: number): Promise<PageMember[]> {
  const members = await query<Omit<PageMember, "stats" | "claimed_tractates">>(
    `SELECT spm.user_id, spm.role, spm.joined_at, u.name
     FROM study_page_members spm JOIN users u ON u.id = spm.user_id
     WHERE spm.study_page_id = ?
     ORDER BY (spm.role = 'owner') DESC, spm.joined_at ASC`,
    [studyPageId]
  );
  return Promise.all(
    members.map(async (m) => {
      const stats = await getPageStats(studyPageId, m.user_id);
      const claimRows = await query<{ name_he: string }>(
        `SELECT t.name_he FROM tractate_claims tc JOIN tractates t ON t.id = tc.tractate_id
         WHERE tc.study_page_id = ? AND tc.user_id = ? ORDER BY t.sort_order`,
        [studyPageId, m.user_id]
      );
      return { ...m, stats, claimed_tractates: claimRows.map((r) => r.name_he) };
    })
  );
}

export interface ClaimedTractateProgress {
  id: number;
  seder: string;
  seder_he: string;
  name_he: string;
  slug: string;
  chapter_count: number;
  mishna_count: number;
  sort_order: number;
  learned: number;
}

export async function getMyClaimedTractatesWithProgress(
  studyPageId: number,
  userId: number
): Promise<ClaimedTractateProgress[]> {
  return query<ClaimedTractateProgress>(
    `SELECT t.*, COUNT(up.id) AS learned
     FROM tractate_claims tc
     JOIN tractates t ON t.id = tc.tractate_id
     LEFT JOIN mishnayot m ON m.tractate_id = t.id
     LEFT JOIN user_progress up ON up.mishna_id = m.id AND up.user_id = ?
     WHERE tc.study_page_id = ? AND tc.user_id = ?
     GROUP BY t.id
     ORDER BY t.sort_order`,
    [userId, studyPageId, userId]
  );
}

export interface TractateClaimStatus {
  id: number;
  seder: string;
  seder_he: string;
  name_he: string;
  slug: string;
  chapter_count: number;
  mishna_count: number;
  sort_order: number;
  claimed_by_id: number | null;
  claimed_by_name: string | null;
  is_mine: boolean;
}

export async function getPageTractatesWithClaimStatus(
  studyPageId: number,
  currentUserId: number
): Promise<TractateClaimStatus[]> {
  const rows = await query<Omit<TractateClaimStatus, "is_mine">>(
    `SELECT t.*, tc.user_id AS claimed_by_id, u.name AS claimed_by_name
     FROM tractates t
     LEFT JOIN tractate_claims tc ON tc.tractate_id = t.id AND tc.study_page_id = ?
     LEFT JOIN users u ON u.id = tc.user_id
     ORDER BY t.sort_order ASC`,
    [studyPageId]
  );
  return rows.map((r) => ({ ...r, is_mine: r.claimed_by_id === currentUserId }));
}

export interface TractateClaimOwner {
  user_id: number;
  name: string;
}

export async function getTractateClaim(studyPageId: number, tractateId: number): Promise<TractateClaimOwner | null> {
  return queryOne<TractateClaimOwner>(
    `SELECT tc.user_id, u.name FROM tractate_claims tc JOIN users u ON u.id = tc.user_id
     WHERE tc.study_page_id = ? AND tc.tractate_id = ?`,
    [studyPageId, tractateId]
  );
}

export async function claimTractate(
  studyPageId: number,
  userId: number,
  tractateId: number
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await execute(
      "INSERT INTO tractate_claims (study_page_id, tractate_id, user_id) VALUES (?, ?, ?)",
      [studyPageId, tractateId, userId]
    );
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code;
    if (code === "ER_DUP_ENTRY") {
      return { ok: false, error: "מסכת זו כבר נתפסה על ידי מישהו אחר." };
    }
    throw err;
  }
  await generateMemberSchedule(studyPageId, userId);
  return { ok: true };
}

export async function unclaimTractate(studyPageId: number, userId: number, tractateId: number): Promise<void> {
  await execute(
    "DELETE FROM tractate_claims WHERE study_page_id = ? AND tractate_id = ? AND user_id = ?",
    [studyPageId, tractateId, userId]
  );
  await generateMemberSchedule(studyPageId, userId);
}

/**
 * בונה מחדש את לוח הלימוד האישי (מהיום קדימה בלבד) של חבר בעמוד, מתוך המשניות
 * שטרם נלמדו במסכתות שתפס, פרושות בפיזור פרופורציוני-אחיד (cumulative-boundary)
 * עד target_end_date — כך שתוכן מועט (מסכת אחת) על פני טווח ארוך (6 שנים) לא
 * "נדחס" לימים הראשונים.
 */
export async function generateMemberSchedule(studyPageId: number, userId: number): Promise<void> {
  const page = await getStudyPage(studyPageId);
  if (!page) return;

  const today = toDateStr(new Date());

  await execute(
    "DELETE FROM member_schedule WHERE study_page_id = ? AND user_id = ? AND study_date >= ?",
    [studyPageId, userId, today]
  );

  const remaining = await query<{ id: number }>(
    `SELECT m.id FROM mishnayot m
     JOIN tractate_claims tc ON tc.tractate_id = m.tractate_id AND tc.study_page_id = ? AND tc.user_id = ?
     LEFT JOIN user_progress up ON up.mishna_id = m.id AND up.user_id = ?
     WHERE up.id IS NULL
     ORDER BY m.sort_order ASC`,
    [studyPageId, userId, userId]
  );
  const total = remaining.length;
  if (total === 0) return;

  const endDateStr = page.target_end_date > today ? page.target_end_date : today;
  const startDate = new Date(today);
  const endDate = new Date(endDateStr);
  const numDays = Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / 86400000) + 1);

  const rows: [number, number, string, number][] = [];
  let idx = 0;
  const date = new Date(startDate);
  for (let day = 0; day < numDays; day++) {
    const cumulativeBefore = Math.floor((day * total) / numDays);
    const cumulativeAfter = Math.floor(((day + 1) * total) / numDays);
    const countToday = cumulativeAfter - cumulativeBefore;
    for (let j = 0; j < countToday && idx < total; j++) {
      rows.push([studyPageId, userId, toDateStr(date), remaining[idx].id]);
      idx++;
    }
    date.setDate(date.getDate() + 1);
  }

  if (rows.length > 0) {
    await db().query(
      "INSERT IGNORE INTO member_schedule (study_page_id, user_id, study_date, mishna_id) VALUES ?",
      [rows]
    );
  }
}

export interface MemberMishnaRow {
  study_date: string;
  id: number;
  chapter: number;
  mishna_num: number;
  text_he: string | null;
  tractate_name: string;
  tractate_slug: string;
}

export async function getMemberTodayMishna(
  studyPageId: number,
  userId: number,
  date?: string
): Promise<MemberMishnaRow | null> {
  const d = date ?? toDateStr(new Date());
  const exact = await queryOne<MemberMishnaRow>(
    `SELECT ms.study_date, m.id, m.chapter, m.mishna_num, m.text_he,
            t.name_he AS tractate_name, t.slug AS tractate_slug
     FROM member_schedule ms
     JOIN mishnayot m ON m.id = ms.mishna_id
     JOIN tractates t ON t.id = m.tractate_id
     WHERE ms.study_page_id = ? AND ms.user_id = ? AND ms.study_date = ?`,
    [studyPageId, userId, d]
  );
  if (exact) return exact;

  return queryOne<MemberMishnaRow>(
    `SELECT ms.study_date, m.id, m.chapter, m.mishna_num, m.text_he,
            t.name_he AS tractate_name, t.slug AS tractate_slug
     FROM member_schedule ms
     JOIN mishnayot m ON m.id = ms.mishna_id
     JOIN tractates t ON t.id = m.tractate_id
     WHERE ms.study_page_id = ? AND ms.user_id = ?
     ORDER BY ABS(DATEDIFF(ms.study_date, ?)) ASC
     LIMIT 1`,
    [studyPageId, userId, d]
  );
}

export interface ScheduleRow {
  study_date: string;
  chapter: number;
  mishna_num: number;
  tractate_name: string;
  slug: string;
}

export async function getMemberScheduleUpcoming(studyPageId: number, userId: number, limit = 14): Promise<ScheduleRow[]> {
  return query<ScheduleRow>(
    `SELECT ms.study_date, m.chapter, m.mishna_num, t.name_he AS tractate_name, t.slug
     FROM member_schedule ms
     JOIN mishnayot m ON m.id = ms.mishna_id
     JOIN tractates t ON t.id = m.tractate_id
     WHERE ms.study_page_id = ? AND ms.user_id = ? AND ms.study_date >= ?
     ORDER BY ms.study_date ASC
     LIMIT ?`,
    [studyPageId, userId, toDateStr(new Date()), limit]
  );
}

export interface TodayProgress {
  learned: number;
  total: number;
}

/** כמה מתוך המשניות שמתוזמנות להיום (יכול להיות יותר מאחת) כבר סומנו. */
export async function getMemberTodayProgress(studyPageId: number, userId: number): Promise<TodayProgress> {
  const today = toDateStr(new Date());
  const rows = await query<{ progress_id: number | null }>(
    `SELECT up.id AS progress_id
     FROM member_schedule ms
     LEFT JOIN user_progress up ON up.mishna_id = ms.mishna_id AND up.user_id = ?
     WHERE ms.study_page_id = ? AND ms.user_id = ? AND ms.study_date = ?`,
    [userId, studyPageId, userId, today]
  );
  return { total: rows.length, learned: rows.filter((r) => r.progress_id !== null).length };
}

export interface ProgressPoint {
  date: string;
  percent: number;
}

/** סדרת נקודות של % התקדמות מצטבר בעמוד לאורך זמן, מהיום הראשון שנלמד ועד היום. */
export async function getProgressHistory(
  studyPageId: number,
  userId: number,
  maxPoints = 12
): Promise<ProgressPoint[]> {
  const totalRow = await queryOne<{ c: number }>(
    `SELECT COUNT(m.id) AS c FROM mishnayot m
     JOIN tractate_claims tc ON tc.tractate_id = m.tractate_id
     WHERE tc.study_page_id = ? AND tc.user_id = ?`,
    [studyPageId, userId]
  );
  const total = totalRow?.c ?? 0;
  if (total === 0) return [];

  const rows = await query<{ d: string; c: number }>(
    `SELECT DATE(up.completed_at) AS d, COUNT(*) AS c
     FROM user_progress up
     JOIN mishnayot m ON m.id = up.mishna_id
     JOIN tractate_claims tc ON tc.tractate_id = m.tractate_id AND tc.study_page_id = ? AND tc.user_id = ?
     WHERE up.user_id = ?
     GROUP BY DATE(up.completed_at)
     ORDER BY d ASC`,
    [studyPageId, userId, userId]
  );
  if (rows.length === 0) return [];

  const dailyMap = new Map(rows.map((r) => [r.d, r.c]));
  const firstDate = new Date(rows[0].d);
  const today = new Date(toDateStr(new Date()));
  const totalDays = Math.max(1, Math.round((today.getTime() - firstDate.getTime()) / 86400000) + 1);
  const step = Math.max(1, Math.ceil(totalDays / maxPoints));

  const points: ProgressPoint[] = [];
  let cumulative = 0;
  const cursor = new Date(firstDate);
  for (let dayIndex = 0; cursor <= today; dayIndex++) {
    const key = toDateStr(cursor);
    cumulative += dailyMap.get(key) ?? 0;
    if (dayIndex % step === 0 || cursor.getTime() === today.getTime()) {
      points.push({ date: key, percent: Math.round((cumulative / total) * 100) });
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return points;
}

export interface ChapterProgress {
  chapter: number;
  learned: number;
  total: number;
}

export interface CurrentTractateProgress {
  tractate: { id: number; name_he: string; slug: string; chapter_count: number };
  currentChapter: number;
  chapters: ChapterProgress[];
}

/** המסכת ה"נוכחית" (הראשונה שנתפסה ועדיין לא הושלמה) + פילוח התקדמות לפי פרק. */
export async function getCurrentTractateProgress(
  studyPageId: number,
  userId: number
): Promise<CurrentTractateProgress | null> {
  const tractates = await query<{
    id: number;
    name_he: string;
    slug: string;
    chapter_count: number;
    mishna_count: number;
  }>(
    `SELECT t.id, t.name_he, t.slug, t.chapter_count, t.mishna_count
     FROM tractate_claims tc JOIN tractates t ON t.id = tc.tractate_id
     WHERE tc.study_page_id = ? AND tc.user_id = ?
     ORDER BY t.sort_order`,
    [studyPageId, userId]
  );

  for (const t of tractates) {
    const chapterRows = await query<{ chapter: number; total: number; learned: number }>(
      `SELECT m.chapter, COUNT(*) AS total, SUM(up.id IS NOT NULL) AS learned
       FROM mishnayot m LEFT JOIN user_progress up ON up.mishna_id = m.id AND up.user_id = ?
       WHERE m.tractate_id = ?
       GROUP BY m.chapter ORDER BY m.chapter`,
      [userId, t.id]
    );
    const totalLearned = chapterRows.reduce((sum, c) => sum + Number(c.learned), 0);
    if (totalLearned >= t.mishna_count) continue; // המסכת הזו הושלמה — הבאה בתור

    const currentChapterRow = chapterRows.find((c) => Number(c.learned) < c.total) ?? chapterRows[chapterRows.length - 1];
    return {
      tractate: { id: t.id, name_he: t.name_he, slug: t.slug, chapter_count: t.chapter_count },
      currentChapter: currentChapterRow?.chapter ?? 1,
      chapters: chapterRows.map((c) => ({ chapter: c.chapter, learned: Number(c.learned), total: c.total })),
    };
  }
  return null;
}

export interface ActivityItem {
  tractateName: string;
  chapter: number;
  mishnaNum: number;
  completedAt: string;
}

/** המשניות האחרונות שהמשתמש סימן כנלמדו בעמוד הזה. */
export async function getRecentActivity(studyPageId: number, userId: number, limit = 5): Promise<ActivityItem[]> {
  const rows = await query<{ tractate_name: string; chapter: number; mishna_num: number; completed_at: string }>(
    `SELECT t.name_he AS tractate_name, m.chapter, m.mishna_num, up.completed_at
     FROM user_progress up
     JOIN mishnayot m ON m.id = up.mishna_id
     JOIN tractates t ON t.id = m.tractate_id
     JOIN tractate_claims tc ON tc.tractate_id = m.tractate_id AND tc.study_page_id = ? AND tc.user_id = ?
     WHERE up.user_id = ?
     ORDER BY up.completed_at DESC
     LIMIT ?`,
    [studyPageId, userId, userId, limit]
  );
  return rows.map((r) => ({
    tractateName: r.tractate_name,
    chapter: r.chapter,
    mishnaNum: r.mishna_num,
    completedAt: r.completed_at,
  }));
}

/* ===================== תצוגת תאריך ההקדשה ===================== */

export interface DedicationDateDisplay {
  hebrew_display: string;
  gregorian_display: string | null;
  next_occurrence: Date | null;
  days_until: number | null;
}

export function getDedicationDateDisplay(page: StudyPage): DedicationDateDisplay | null {
  const month = page.passing_hebrew_month;
  const day = page.passing_hebrew_day;
  if (!month || !day) return null;

  const hebrewDisplay = formatHebrewDayMonth(month, day);
  const nextOccurrence = findNextHebrewAnniversary(month, day);
  const daysUntil =
    nextOccurrence !== null
      ? Math.round((nextOccurrence.getTime() - new Date(new Date().toDateString()).getTime()) / 86400000)
      : null;

  return {
    hebrew_display: hebrewDisplay,
    gregorian_display: page.passing_date_gregorian,
    next_occurrence: nextOccurrence,
    days_until: daysUntil,
  };
}
