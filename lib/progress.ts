import "server-only";
import { query, queryOne, execute } from "./db";
import type { Achievement, BartenuraSegment, Mishna, Tractate, UserStats } from "./types";

export async function isMishnaCompletedByUser(userId: number, mishnaId: number): Promise<boolean> {
  const row = await queryOne(
    "SELECT 1 FROM user_progress WHERE user_id = ? AND mishna_id = ?",
    [userId, mishnaId]
  );
  return row !== null;
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function bumpStreakIfNeeded(userId: number): Promise<void> {
  const user = await queryOne<{ streak_count: number; longest_streak: number; last_study_date: string | null }>(
    "SELECT streak_count, longest_streak, last_study_date FROM users WHERE id = ?",
    [userId]
  );
  if (!user) return;

  const today = todayStr();
  if (user.last_study_date === today) {
    return; // כבר נספר היום
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);

  const isConsecutive = user.last_study_date === yesterdayStr;
  const newStreak = isConsecutive ? user.streak_count + 1 : 1;
  const newLongest = Math.max(user.longest_streak, newStreak);

  await execute(
    "UPDATE users SET streak_count = ?, longest_streak = ?, last_study_date = ? WHERE id = ?",
    [newStreak, newLongest, today, userId]
  );
}

export async function markMishnaComplete(userId: number, mishnaId: number): Promise<void> {
  const result = await execute(
    "INSERT IGNORE INTO user_progress (user_id, mishna_id) VALUES (?, ?)",
    [userId, mishnaId]
  );
  if (result.affectedRows > 0) {
    await bumpStreakIfNeeded(userId);
    await checkAndAwardAchievements(userId);
  }
}

export async function unmarkMishnaComplete(userId: number, mishnaId: number): Promise<void> {
  await execute("DELETE FROM user_progress WHERE user_id = ? AND mishna_id = ?", [userId, mishnaId]);
}

export async function getUserStats(userId: number): Promise<UserStats> {
  const totalRow = await queryOne<{ c: number }>("SELECT COUNT(*) AS c FROM mishnayot");
  const learnedRow = await queryOne<{ c: number }>(
    "SELECT COUNT(*) AS c FROM user_progress WHERE user_id = ?",
    [userId]
  );
  const user = await queryOne<{ streak_count: number; longest_streak: number }>(
    "SELECT streak_count, longest_streak FROM users WHERE id = ?",
    [userId]
  );

  const total = totalRow?.c ?? 0;
  const learned = learnedRow?.c ?? 0;

  return {
    total_mishnayot: total,
    learned,
    percent: total > 0 ? Math.round((learned / total) * 100) : 0,
    streak: user?.streak_count ?? 0,
    longest_streak: user?.longest_streak ?? 0,
  };
}

export async function tractateCompletedCount(userId: number): Promise<number> {
  const row = await queryOne<{ c: number }>(
    `SELECT COUNT(*) AS c FROM tractates t
     WHERE t.mishna_count > 0 AND t.mishna_count = (
       SELECT COUNT(*) FROM user_progress up JOIN mishnayot m ON m.id = up.mishna_id
       WHERE m.tractate_id = t.id AND up.user_id = ?
     )`,
    [userId]
  );
  return row?.c ?? 0;
}

export async function checkAndAwardAchievements(userId: number): Promise<void> {
  const stats = await getUserStats(userId);

  const earnedCodes = await query<{ code: string }>(
    `SELECT a.code FROM user_achievements ua JOIN achievements a ON a.id = ua.achievement_id WHERE ua.user_id = ?`,
    [userId]
  );
  const already = new Set(earnedCodes.map((r) => r.code));

  const achievements = await query<Achievement>("SELECT * FROM achievements");
  const toAward: number[] = [];

  let completedTractates: number | null = null;

  for (const a of achievements) {
    if (already.has(a.code)) continue;
    let earned = false;
    if (a.criteria_type === "streak") {
      earned = stats.streak >= a.criteria_value;
    } else if (a.criteria_type === "total_mishnayot") {
      earned = stats.learned >= a.criteria_value;
    } else if (a.criteria_type === "tractate_complete") {
      completedTractates ??= await tractateCompletedCount(userId);
      earned = completedTractates >= a.criteria_value;
    }
    if (earned) toAward.push(a.id);
  }

  for (const achievementId of toAward) {
    await execute(
      "INSERT IGNORE INTO user_achievements (user_id, achievement_id) VALUES (?, ?)",
      [userId, achievementId]
    );
  }
}

export interface AchievementWithStatus extends Achievement {
  earned: boolean;
  earned_at: string | null;
  progress_value: number;
}

export async function getUserAchievements(userId: number): Promise<AchievementWithStatus[]> {
  const achievements = await query<Achievement>("SELECT * FROM achievements ORDER BY sort_order ASC");
  const earnedRows = await query<{ achievement_id: number; earned_at: string }>(
    "SELECT achievement_id, earned_at FROM user_achievements WHERE user_id = ?",
    [userId]
  );
  const earnedMap = new Map(earnedRows.map((r) => [r.achievement_id, r.earned_at]));

  const stats = await getUserStats(userId);
  let completedTractates: number | null = null;

  const result: AchievementWithStatus[] = [];
  for (const a of achievements) {
    let progressValue = 0;
    if (a.criteria_type === "streak") progressValue = stats.streak;
    else if (a.criteria_type === "total_mishnayot") progressValue = stats.learned;
    else if (a.criteria_type === "tractate_complete") {
      completedTractates ??= await tractateCompletedCount(userId);
      progressValue = completedTractates;
    }
    result.push({
      ...a,
      earned: earnedMap.has(a.id),
      earned_at: earnedMap.get(a.id) ?? null,
      progress_value: progressValue,
    });
  }
  return result;
}

export async function getTractateBySlug(slug: string): Promise<Tractate | null> {
  return queryOne<Tractate>("SELECT * FROM tractates WHERE slug = ?", [slug]);
}

export interface MishnaWithProgress extends Mishna {
  progress_id: number | null;
}

export async function getMishnayotForTractate(tractateId: number, userId: number): Promise<MishnaWithProgress[]> {
  return query<MishnaWithProgress>(
    `SELECT m.*, up.id AS progress_id
     FROM mishnayot m
     LEFT JOIN user_progress up ON up.mishna_id = m.id AND up.user_id = ?
     WHERE m.tractate_id = ?
     ORDER BY m.chapter ASC, m.mishna_num ASC`,
    [userId, tractateId]
  );
}

/** מפרק את bartenura_he (JSON של {lemma, body}[] שנשמר בזמן הייבוא) לתצוגה. */
export function parseBartenuraSegments(json: string | null): BartenuraSegment[] | null {
  if (!json) return null;
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? (parsed as BartenuraSegment[]) : null;
  } catch {
    return null;
  }
}

export async function getUserStudyDaysInMonth(userId: number, yearMonth: string): Promise<string[]> {
  const rows = await query<{ d: string }>(
    `SELECT DISTINCT DATE(completed_at) AS d FROM user_progress
     WHERE user_id = ? AND DATE_FORMAT(completed_at, '%Y-%m') = ?`,
    [userId, yearMonth]
  );
  return rows.map((r) => r.d);
}
