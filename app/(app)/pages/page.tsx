import Link from "next/link";
import { requireLogin } from "@/lib/auth";
import { getUserStudyPages } from "@/lib/study-pages";
import { Icon } from "@/components/Icon";

export default async function PagesPage() {
  const user = await requireLogin();
  const pages = await getUserStudyPages(user.id);

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="font-bold text-navy text-xl flex items-center gap-2">
          <Icon name="heart" className="w-6 h-6 text-gold" /> העמודים שלי
        </h1>
        <Link href="/page-create" className="btn-pill bg-navy text-white hover:bg-navy-light">
          <Icon name="plus" className="w-4 h-4" /> יצירת עמוד לימוד חדש
        </Link>
      </div>

      {pages.length === 0 && (
        <div className="card text-center">
          <div className="text-gold mb-3">
            <Icon name="candle" className="w-10 h-10 mx-auto" />
          </div>
          <p className="font-bold text-navy text-lg mb-2">עדיין אין לכם עמוד לימוד</p>
          <p className="text-ink/60 text-sm mb-5 max-w-md mx-auto">
            פתחו עמוד לימוד לעילוי נשמה או לרפואה — ללימוד אישי של כל הש&quot;ס בקצב שתבחרו, או כקבוצה
            שמחלקת ביניכם את המסכתות.
          </p>
          <Link href="/page-create" className="btn-pill bg-gold text-white hover:bg-gold-dark inline-flex">
            <Icon name="plus" className="w-4 h-4" /> יצירת עמוד לימוד
          </Link>
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {pages.map((p) => (
          <Link
            key={p.id}
            href={`/switch-page?id=${p.id}`}
            className="card hover:shadow-card-lg transition flex flex-col"
          >
            <div className="flex items-start justify-between mb-3">
              <span className="text-gold">
                <Icon name="candle" className="w-7 h-7" />
              </span>
              <span
                className={`text-xs rounded-full px-2.5 py-1 ${
                  p.mode === "group" ? "bg-navy/10 text-navy" : "bg-gold/15 text-gold-dark"
                }`}
              >
                {p.mode === "group" ? `קבוצתי · ${p.member_count} חברים` : "אישי"}
              </span>
            </div>
            <p className="text-ink/50 text-xs mb-1">{p.dtype === "refuah" ? "לרפואת" : "לעילוי נשמת"}</p>
            <p className="font-bold text-navy text-lg leading-snug mb-3">{p.name_he}</p>
            <div className="mt-auto">
              <div className="w-full bg-cream-dark rounded-full h-2 overflow-hidden">
                <div className="bg-gold h-2 rounded-full" style={{ width: `${p.stats.percent}%` }} />
              </div>
              <p className="text-xs text-ink/50 mt-1.5">
                {p.stats.learned}/{p.stats.total} משניות · {p.stats.percent}%
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
