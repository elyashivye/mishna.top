import Link from "next/link";
import { requireLogin } from "@/lib/auth";
import { requireCurrentPage } from "@/lib/current-page";
import { isMishnaCompletedByUser } from "@/lib/progress";
import { getMemberTodayMishna, getMemberScheduleUpcoming } from "@/lib/study-pages";
import { Icon } from "@/components/Icon";
import { CompleteTodayButton } from "@/components/CompleteTodayButton";
import { ListenShareButtons } from "@/components/ListenShareButtons";
import { formatDisplayDate, gematriyaNum } from "@/lib/hebrew-date";

export default async function DailyPage() {
  const user = await requireLogin();
  const page = await requireCurrentPage(user.id);

  const today = await getMemberTodayMishna(page.id, user.id);
  const todayCompleted = today ? await isMishnaCompletedByUser(user.id, today.id) : false;
  const upcoming = await getMemberScheduleUpcoming(page.id, user.id, 7);

  return (
    <div className="mt-4">
      <h1 className="font-bold text-navy text-xl flex items-center gap-2 mb-6">
        <Icon name="sun" className="w-6 h-6 text-gold" /> המשנה היומית שלי
      </h1>

      {today ? (
        <div className="grid md:grid-cols-3 gap-5">
          <CompleteTodayButton mishnaId={today.id} initialCompleted={todayCompleted} />
          <div className="md:col-span-2 card">
            <div className="flex items-center justify-between mb-3">
              <p className="font-semibold text-navy">
                מסכת {today.tractate_name} — פרק {gematriyaNum(today.chapter)}, משנה {gematriyaNum(today.mishna_num)}
              </p>
              <Link href={`/tractate/${today.tractate_slug}`} className="text-xs text-gold-dark hover:underline">
                למסכת המלאה
              </Link>
            </div>
            <p className="text-ink/80 leading-loose text-[17px]">{today.text_he}</p>
            <ListenShareButtons text={today.text_he ?? ""} shareUrl="/daily" />
          </div>
        </div>
      ) : (
        <div className="card text-center text-ink/60">
          {page.mode === "group" ? (
            <>
              עדיין לא תפסתם מסכת בעמוד הזה.{" "}
              <Link href="/tractates" className="text-gold-dark hover:underline">
                לכו ללוח תפיסת המסכתות
              </Link>
              .
            </>
          ) : (
            "לא נמצאה משנה יומית להיום."
          )}
        </div>
      )}

      {upcoming.length > 0 && (
        <div className="mt-6">
          <h2 className="font-bold text-navy text-lg mb-3">הימים הקרובים</h2>
          <div className="card !p-0 overflow-hidden divide-y divide-gray-100">
            {upcoming.map((row, i) => (
              <div key={i} className="flex items-center justify-between px-6 py-3 text-sm">
                <span className="text-ink/50">{formatDisplayDate(row.study_date, user.date_display)}</span>
                <span className="text-navy font-medium">
                  מסכת {row.tractate_name} — פרק {gematriyaNum(row.chapter)}, משנה {gematriyaNum(row.mishna_num)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
