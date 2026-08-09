import { requireLogin } from "@/lib/auth";
import { requireCurrentPage } from "@/lib/current-page";
import { getPageTractatesWithClaimStatus, getPageGroupStats } from "@/lib/study-pages";
import { Icon } from "@/components/Icon";
import { TractateSearchGrid } from "@/components/TractateSearchGrid";

export default async function TractatesPage() {
  const user = await requireLogin();
  const page = await requireCurrentPage(user.id);
  const tractates = await getPageTractatesWithClaimStatus(page.id, user.id);
  const groupStats = page.mode === "group" ? await getPageGroupStats(page.id) : null;

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-2 flex-wrap gap-3">
        <h1 className="font-bold text-navy text-xl flex items-center gap-2">
          <Icon name="book" className="w-6 h-6 text-gold" />
          {page.mode === "group" ? "לוח תפיסת מסכתות" : "המסכתות שלי"}
        </h1>
        {groupStats && (
          <span className="text-xs text-ink/50">
            התקדמות קבוצתית כוללת: {groupStats.learned}/{groupStats.total} ({groupStats.percent}%)
          </span>
        )}
      </div>
      {page.mode === "group" && (
        <p className="text-ink/60 text-sm mb-6">
          כל מסכת ניתנת לתפיסה על ידי חבר אחד בלבד. לחצו על &quot;תפיסת מסכת&quot; כדי להתחיל ללמוד אותה — לוח
          הלימוד האישי שלכם יתעדכן אוטומטית.
        </p>
      )}

      <TractateSearchGrid tractates={tractates} mode={page.mode} />
    </div>
  );
}
