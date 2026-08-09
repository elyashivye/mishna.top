import "server-only";
import { redirect } from "next/navigation";
import { getSession } from "./auth";
import { getStudyPage, getUserStudyPages, isPageMember } from "./study-pages";
import type { StudyPage } from "./types";

export async function getCurrentPageId(): Promise<number | null> {
  const session = await getSession();
  return session.currentPageId ?? null;
}

export async function setCurrentPageId(id: number): Promise<void> {
  const session = await getSession();
  session.currentPageId = id;
  await session.save();
}

/**
 * מחזיר את עמוד הלימוד הפעיל של המשתמש בסשן, או בוחר אוטומטית/מפנה ל-/pages אם אין.
 * הערה: כשאין current page בסשן, הבחירה האוטומטית של העמוד הראשון *אינה* נשמרת
 * לסשן כאן (Next.js אוסר כתיבת עוגיות בזמן רינדור של Server Component — רק
 * מ-Server Actions/Route Handlers) — היא רק ברירת מחדל לתצוגה החוזרת הזו.
 * הקביעה בפועל בסשן קורית דרך /switch-page (Route Handler) או Server Actions.
 */
export async function requireCurrentPage(userId: number): Promise<StudyPage> {
  const pageId = await getCurrentPageId();
  if (pageId) {
    const page = await getStudyPage(pageId);
    if (page && (await isPageMember(pageId, userId))) {
      return page;
    }
  }
  const pages = await getUserStudyPages(userId);
  if (pages.length > 0) {
    return pages[0];
  }
  redirect("/pages");
}
