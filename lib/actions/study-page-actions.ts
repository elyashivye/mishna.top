"use server";

import { requireLogin } from "@/lib/auth";
import { requireCurrentPage } from "@/lib/current-page";
import { claimTractate, unclaimTractate } from "@/lib/study-pages";

export async function claimTractateAction(
  tractateId: number
): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await requireLogin();
  const page = await requireCurrentPage(user.id);
  if (page.mode !== "group") {
    return { ok: false, error: "לא ניתן לתפוס מסכת בעמוד אישי." };
  }
  return claimTractate(page.id, user.id, tractateId);
}

export async function unclaimTractateAction(tractateId: number): Promise<{ ok: true }> {
  const user = await requireLogin();
  const page = await requireCurrentPage(user.id);
  if (page.mode === "group") {
    await unclaimTractate(page.id, user.id, tractateId);
  }
  return { ok: true };
}
