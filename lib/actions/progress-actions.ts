"use server";

import { requireLogin } from "@/lib/auth";
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
