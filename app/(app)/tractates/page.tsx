import Link from "next/link";
import { requireLogin } from "@/lib/auth";
import { requireCurrentPage } from "@/lib/current-page";
import { getPageTractatesWithClaimStatus, getPageGroupStats } from "@/lib/study-pages";
import { Icon } from "@/components/Icon";
import { TractateClaimCard } from "@/components/TractateClaimCard";

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

      {page.mode === "solo" ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tractates.map((t) => (
            <Link
              key={t.id}
              href={`/tractate/${t.slug}`}
              className="card flex items-center justify-between hover:shadow-card-lg transition"
            >
              <div>
                <p className="font-semibold text-navy text-sm">מסכת {t.name_he}</p>
                <p className="text-xs text-ink/50 mt-0.5">
                  {t.chapter_count} פרקים · {t.mishna_count} משניות
                </p>
              </div>
              <Icon name="chevron-start" className="w-4 h-4 text-ink/30 -rotate-90" />
            </Link>
          ))}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tractates.map((t) => (
            <TractateClaimCard key={t.id} tractate={t} />
          ))}
        </div>
      )}
    </div>
  );
}
