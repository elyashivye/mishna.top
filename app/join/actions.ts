"use server";

import { redirect } from "next/navigation";
import { requireLogin } from "@/lib/auth";
import { getStudyPageByInviteCode, joinStudyPage } from "@/lib/study-pages";
import { setCurrentPageId } from "@/lib/current-page";

export async function joinAction(formData: FormData): Promise<void> {
  const user = await requireLogin();
  const code = String(formData.get("code") ?? "").toUpperCase().trim();
  const page = await getStudyPageByInviteCode(code);
  if (!page) {
    redirect(`/join?code=${encodeURIComponent(code)}`);
  }
  await joinStudyPage(page.id, user.id);
  await setCurrentPageId(page.id);
  redirect("/tractates");
}
