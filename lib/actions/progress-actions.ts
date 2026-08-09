"use server";

import { requireLogin } from "@/lib/auth";
import { query } from "@/lib/db";
import {
  isMishnaCompletedByUser,
  markMishnaComplete,
  unmarkMishnaComplete,
  getUserStats,
} from "@/lib/progress";
import type { UserStats } from "@/lib/types";

export async function toggleMishnaAction(
  mishnaId: number
): Promise<{ ok: true; completed: boolean; stats: UserStats } | { ok: false; error: string }> {
  const user = await requireLogin();

  if (!mishnaId || mishnaId <= 0) {
    return { ok: false, error: "משנה לא תקינה" };
  }

  const wasCompleted = await isMishnaCompletedByUser(user.id, mishnaId);
  if (wasCompleted) {
    await unmarkMishnaComplete(user.id, mishnaId);
  } else {
    await markMishnaComplete(user.id, mishnaId);
  }

  const stats = await getUserStats(user.id);
  return { ok: true, completed: !wasCompleted, stats };
}

/**
 * מסמן/מבטל סימון של פרק שלם בבת אחת: אם כל המשניות בפרק כבר סומנו — מבטל
 * את כולן, אחרת מסמן את כל מה שעוד לא סומן.
 */
export async function toggleChapterAction(
  mishnaIds: number[]
): Promise<{ ok: true; completed: boolean; stats: UserStats } | { ok: false; error: string }> {
  const user = await requireLogin();

  const ids = mishnaIds.filter((id) => Number.isInteger(id) && id > 0);
  if (ids.length === 0) {
    return { ok: false, error: "אין משניות בפרק זה" };
  }

  const completedRows = await query<{ mishna_id: number }>(
    `SELECT mishna_id FROM user_progress WHERE user_id = ? AND mishna_id IN (${ids.map(() => "?").join(",")})`,
    [user.id, ...ids]
  );
  const allCompleted = completedRows.length === ids.length;

  if (allCompleted) {
    for (const id of ids) await unmarkMishnaComplete(user.id, id);
  } else {
    for (const id of ids) await markMishnaComplete(user.id, id);
  }

  const stats = await getUserStats(user.id);
  return { ok: true, completed: !allCompleted, stats };
}
