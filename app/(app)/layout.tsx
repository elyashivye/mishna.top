import { requireLogin } from "@/lib/auth";
import { getUserStudyPages } from "@/lib/study-pages";
import { getCurrentPageId } from "@/lib/current-page";
import { AppShell } from "@/components/AppShell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireLogin();
  const pages = await getUserStudyPages(user.id);
  const sessionPageId = await getCurrentPageId();
  // אם אין current page בסשן, requireCurrentPage() בדפים עצמם נופל אוטומטית
  // לעמוד הראשון בלי לשמור זאת בסשן — כאן רק לתצוגה, כדי שבורר העמודים בסרגל
  // הצד יתאים למה שבפועל מוצג.
  const currentPageId = pages.some((p) => p.id === sessionPageId) ? sessionPageId : (pages[0]?.id ?? null);

  return (
    <AppShell
      user={{ id: user.id, name: user.name }}
      pages={pages.map((p) => ({ id: p.id, name_he: p.name_he, dtype: p.dtype }))}
      currentPageId={currentPageId}
    >
      {children}
    </AppShell>
  );
}
