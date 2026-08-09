"use server";

import { redirect } from "next/navigation";
import { requireLogin } from "@/lib/auth";
import { createStudyPage, getStudyPage } from "@/lib/study-pages";
import { setCurrentPageId } from "@/lib/current-page";

export async function createPageAction(formData: FormData): Promise<void> {
  const user = await requireLogin();

  const nameHe = String(formData.get("name_he") ?? "").trim();
  const pace = String(formData.get("pace") ?? "year") as "year" | "six_years" | "custom";
  const customEndDate = String(formData.get("custom_end_date") ?? "").trim();
  const dateInputMode = String(formData.get("date_input_mode") ?? "") as "" | "gregorian" | "hebrew";

  const qs = (error: string) => `/page-create?error=${encodeURIComponent(error)}`;

  if (!nameHe) {
    redirect(qs("נא להזין שם."));
  }
  if (pace === "custom" && !/^\d{4}-\d{2}-\d{2}$/.test(customEndDate)) {
    redirect(qs("נא לבחור תאריך יעד תקין לסיום."));
  }

  const pageId = await createStudyPage(user.id, {
    nameHe,
    dtype: String(formData.get("dtype") ?? "neshama") === "refuah" ? "refuah" : "neshama",
    notes: String(formData.get("notes") ?? "").trim(),
    mode: String(formData.get("mode") ?? "solo") === "group" ? "group" : "solo",
    pace,
    customEndDate: customEndDate || null,
    dateInputMode,
    passingDateGregorian: String(formData.get("passing_date_gregorian") ?? ""),
    passingHebrewMonth: String(formData.get("passing_hebrew_month") ?? ""),
    passingHebrewDay: String(formData.get("passing_hebrew_day") ?? ""),
  });

  await setCurrentPageId(pageId);
  const page = await getStudyPage(pageId);
  redirect(page?.mode === "group" ? "/tractates" : "/page");
}
