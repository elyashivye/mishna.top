import Link from "next/link";
import { requireLogin } from "@/lib/auth";
import { getUserStats, isMishnaCompletedByUser } from "@/lib/progress";
import {
  getPageStats,
  getMemberTodayMishna,
  getMyClaimedTractatesWithProgress,
  getPageMembers,
  getPageGroupStats,
  getDedicationDateDisplay,
} from "@/lib/study-pages";
import { requireCurrentPage } from "@/lib/current-page";
import { Icon } from "@/components/Icon";
import { CompleteTodayButton } from "@/components/CompleteTodayButton";
import { ListenShareButtons } from "@/components/ListenShareButtons";
import { CopyInviteButton } from "@/components/CopyInviteButton";
import { formatDisplayDate, formatHebrewDateFull, gematriyaNum } from "@/lib/hebrew-date";

export default async function PageDashboard() {
  const user = await requireLogin();
  const page = await requireCurrentPage(user.id);
  const pageId = page.id;
  const showGregorian = user.date_display === "both";

  const userStats = await getUserStats(user.id);
  const pageStats = await getPageStats(pageId, user.id);
  const dedicationDate = getDedicationDateDisplay(page);
  const today = await getMemberTodayMishna(pageId, user.id);
  const todayCompleted = today ? await isMishnaCompletedByUser(user.id, today.id) : false;
  const myTractates = await getMyClaimedTractatesWithProgress(pageId, user.id);
  const members = page.mode === "group" ? await getPageMembers(pageId) : [];
  const groupStats = page.mode === "group" ? await getPageGroupStats(pageId) : null;

  const inviteLink = page.invite_code
    ? `${process.env.APP_URL ?? ""}/join?code=${page.invite_code}`
    : null;

  return (
    <div className="mt-4">
      <div className="grid md:grid-cols-3 gap-5">
        {/* כרטיס הקדשה */}
        <div className="card flex flex-col items-center justify-center text-center">
          <div className="text-gold mb-2">
            <Icon name="candle" className="w-9 h-9" />
          </div>
          <p className="text-ink/60 text-sm mb-1">{page.dtype === "refuah" ? "לרפואת" : "לעילוי נשמת"}</p>
          <p className="font-bold text-navy text-lg leading-snug">{page.name_he}</p>
          {dedicationDate && (
            <>
              <p className="text-ink/50 text-sm mt-1">
                {dedicationDate.hebrew_display}
                {showGregorian && dedicationDate.gregorian_display && (
                  <span className="text-ink/35"> ({dedicationDate.gregorian_display})</span>
                )}
              </p>
              {dedicationDate.days_until !== null && dedicationDate.next_occurrence && (
                <p
                  className={`text-xs mt-1 ${
                    dedicationDate.days_until <= 7 ? "text-gold-dark font-semibold" : "text-ink/40"
                  }`}
                >
                  {page.dtype === "refuah" ? "האזכרה הבאה" : "היארצייט הבא"} בעוד{" "}
                  {dedicationDate.days_until === 0 ? "היום" : `${dedicationDate.days_until} ימים`} (
                  {formatHebrewDateFull(dedicationDate.next_occurrence)}
                  {showGregorian && ` · ${dedicationDate.next_occurrence.toISOString().slice(0, 10)}`})
                </p>
              )}
            </>
          )}
          {page.dtype === "neshama" && <p className="text-ink/40 text-xs mt-2">ת.נ.צ.ב.ה</p>}
          <p className="text-xs text-ink/40 mt-3">
            {page.mode === "group" ? `עמוד קבוצתי · ${members.length} חברים` : "עמוד לימוד אישי"} · יעד לסיום:{" "}
            {formatDisplayDate(page.target_end_date, user.date_display)}
          </p>
        </div>

        {/* באנר גיבור */}
        <div className="md:col-span-2 card relative overflow-hidden flex items-center">
          <div className="absolute inset-0 bg-gradient-to-l from-navy via-navy-light to-gold/70 opacity-90" />
          <div
            className="absolute inset-0"
            style={{ backgroundImage: "radial-gradient(circle at 85% 30%, rgba(255,255,255,0.25), transparent 55%)" }}
          />
          <div className="relative z-10 text-white px-2 py-4">
            <p className="text-xs tracking-widest text-white/70 mb-2">בע&quot;ה</p>
            <h1 className="text-2xl md:text-3xl font-extrabold leading-tight">
              לימוד משנה
              <br />
              לעילוי נשמת
            </h1>
            <p className="text-white/85 text-sm mt-3 max-w-md leading-relaxed">
              הלימוד תורה לעילוי נשמת הנפטר ממשיך להאיר לו את נחת רוח בעולם העליון.
            </p>
          </div>
          <div className="hidden md:flex relative z-10 me-4 ms-auto text-6xl opacity-90">🕯️📖</div>
        </div>
      </div>

      {/* שורת סטטיסטיקות */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5">
        <div className="card flex items-center gap-3">
          <span className="text-gold">
            <Icon name="flame" className="w-8 h-8" />
          </span>
          <div>
            <div className="text-2xl font-extrabold text-navy">{userStats.streak}</div>
            <div className="text-xs text-ink/60">רצף ימים</div>
          </div>
        </div>
        <div className="card flex items-center gap-3">
          <span className="text-gold">
            <Icon name="book" className="w-8 h-8" />
          </span>
          <div>
            <div className="text-2xl font-extrabold text-navy">{pageStats.learned}</div>
            <div className="text-xs text-ink/60">משניות נלמדו בעמוד זה</div>
          </div>
        </div>
        <div className="card flex items-center gap-3">
          <div className="progress-ring w-12 h-12" style={{ "--pct": pageStats.percent } as React.CSSProperties}>
            <div className="progress-ring-inner w-9 h-9 flex items-center justify-center text-xs font-bold text-navy">
              {pageStats.percent}%
            </div>
          </div>
          <div>
            <div className="text-xs text-ink/60">ההתקדמות שלי בעמוד</div>
          </div>
        </div>
        <Link href="/daily" className="card flex items-center gap-3 hover:shadow-card-lg transition">
          <span className="text-gold">
            <Icon name="calendar" className="w-8 h-8" />
          </span>
          <div>
            <div className="font-bold text-navy text-sm">היום</div>
            <div className="text-xs text-ink/60">משנה יומית</div>
          </div>
        </Link>
      </div>

      <div className="grid md:grid-cols-3 gap-5 mt-5">
        {today ? (
          <CompleteTodayButton mishnaId={today.id} initialCompleted={todayCompleted} />
        ) : (
          <div className="card flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center bg-cream-dark text-ink/40">
              <Icon name="check" className="w-8 h-8" />
            </div>
            <p className="font-bold text-navy mt-3">סמנו כשסיימתם ללמוד היום</p>
            <p className="text-ink/50 text-xs mt-1">היום</p>
          </div>
        )}

        <div className="md:col-span-2 card">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-navy text-lg flex items-center gap-2">
              <Icon name="sun" className="w-5 h-5 text-gold" /> המשנה היומית שלי
            </h2>
            {today && (
              <Link href={`/tractate/${today.tractate_slug}`} className="text-xs text-gold-dark hover:underline">
                מסכת {today.tractate_name}
              </Link>
            )}
          </div>
          {today ? (
            <>
              <p className="font-semibold text-navy mb-2">
                מסכת {today.tractate_name} — פרק {gematriyaNum(today.chapter)}, משנה {gematriyaNum(today.mishna_num)}
              </p>
              <p className="text-ink/80 leading-loose text-[17px]">{today.text_he}</p>
              <ListenShareButtons text={today.text_he ?? ""} shareUrl="/daily" />
            </>
          ) : page.mode === "group" ? (
            <p className="text-ink/60">
              עדיין לא תפסתם מסכת בעמוד הזה.{" "}
              <Link href="/tractates" className="text-gold-dark hover:underline">
                לכו ללוח תפיסת המסכתות
              </Link>
              .
            </p>
          ) : (
            <p className="text-ink/60">לא נמצאה משנה יומית להיום.</p>
          )}
        </div>
      </div>

      {page.mode === "group" && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <h2 className="font-bold text-navy text-lg">חברי הקבוצה</h2>
            <div className="flex items-center gap-2">
              <span className="text-xs text-ink/50">
                התקדמות קבוצתית כוללת: {groupStats?.learned}/{groupStats?.total} ({groupStats?.percent}%)
              </span>
              <Link href="/tractates" className="btn-pill bg-cream-dark text-navy text-xs">
                לוח תפיסת מסכתות
              </Link>
            </div>
          </div>
          <div className="card !p-0 overflow-hidden divide-y divide-gray-100">
            {members.map((m) => (
              <div key={m.user_id} className="flex items-center justify-between px-6 py-3">
                <div>
                  <p className="font-semibold text-navy text-sm">
                    {m.name} {m.role === "owner" && <span className="text-xs text-gold-dark">(יוזם)</span>}
                  </p>
                  <p className="text-xs text-ink/50 mt-0.5">
                    {m.claimed_tractates.length > 0 ? m.claimed_tractates.join(", ") : "טרם תפס מסכת"}
                  </p>
                </div>
                <span className="text-xs text-ink/60">
                  {m.stats.learned}/{m.stats.total}
                </span>
              </div>
            ))}
          </div>
          {inviteLink && (
            <div className="card mt-4 flex items-center justify-between flex-wrap gap-3">
              <div>
                <p className="text-sm font-semibold text-navy">הזמנת חברים נוספים</p>
                <p className="text-xs text-ink/50 mt-0.5">שתפו את הקישור כדי שאחרים יוכלו להצטרף ולתפוס מסכת</p>
              </div>
              <CopyInviteButton link={inviteLink} />
            </div>
          )}
        </div>
      )}

      <div className="mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-navy text-lg">המסכתות שתפסתי בעמוד זה</h2>
          {page.mode === "group" && (
            <Link href="/tractates" className="text-xs text-gold-dark hover:underline">
              לתפוס עוד מסכתות
            </Link>
          )}
        </div>
        {myTractates.length === 0 ? (
          <div className="card text-center text-ink/60">
            עדיין לא תפסתם מסכת.{" "}
            <Link href="/tractates" className="text-gold-dark hover:underline">
              לכו ללוח תפיסת המסכתות
            </Link>
            .
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-2 scroll-smooth" style={{ scrollSnapType: "x proximity" }}>
            {myTractates.map((t) => {
              const pct = t.mishna_count > 0 ? Math.round((t.learned / t.mishna_count) * 100) : 0;
              return (
                <Link
                  key={t.id}
                  href={`/tractate/${t.slug}`}
                  className="card min-w-[140px] flex-shrink-0 flex flex-col items-center text-center hover:shadow-card-lg transition"
                  style={{ scrollSnapAlign: "start" }}
                >
                  <p className="font-semibold text-navy text-sm mb-3">מסכת {t.name_he}</p>
                  <div className="progress-ring w-16 h-16" style={{ "--pct": pct } as React.CSSProperties}>
                    <div className="progress-ring-inner w-12 h-12 flex items-center justify-center text-xs font-bold text-navy">
                      {t.learned}/{t.mishna_count}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
