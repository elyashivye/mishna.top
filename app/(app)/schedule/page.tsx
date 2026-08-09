import { requireLogin } from "@/lib/auth";
import { requireCurrentPage } from "@/lib/current-page";
import { getMemberScheduleUpcoming } from "@/lib/study-pages";
import { Icon } from "@/components/Icon";
import { formatDisplayDate, formatHebrewMonthYear, gematriyaNum, parseDbDate } from "@/lib/hebrew-date";

export default async function SchedulePage() {
  const user = await requireLogin();
  const page = await requireCurrentPage(user.id);
  const upcoming = await getMemberScheduleUpcoming(page.id, user.id, 90);

  const today = new Date().toISOString().slice(0, 10);
  const byMonth = new Map<string, typeof upcoming>();
  for (const row of upcoming) {
    const key = row.study_date.slice(0, 7);
    if (!byMonth.has(key)) byMonth.set(key, []);
    byMonth.get(key)!.push(row);
  }

  return (
    <div className="mt-4">
      <h1 className="font-bold text-navy text-xl flex items-center gap-2 mb-2">
        <Icon name="list" className="w-6 h-6 text-gold" /> סדר הלימוד שלי
      </h1>
      <p className="text-ink/60 text-sm mb-6">
        לוח הלימוד האישי שלכם בעמוד &quot;{page.name_he}&quot;, בנוי מתוך המסכתות שתפסתם ופרוש עד ליעד{" "}
        {formatDisplayDate(page.target_end_date, user.date_display)}.
      </p>

      {upcoming.length === 0 ? (
        <div className="card text-center text-ink/60">אין עדיין לוח לימוד — תפסו מסכת כדי להתחיל.</div>
      ) : (
        Array.from(byMonth.entries()).map(([month, rows]) => (
          <div key={month} className="mb-6">
            <h2 className="font-bold text-navy text-sm mb-2">
              {formatHebrewMonthYear(parseDbDate(`${month}-01`))}
              {user.date_display === "both" && <span className="text-ink/40 font-normal"> · {month}</span>}
            </h2>
            <div className="card !p-0 overflow-hidden divide-y divide-gray-100">
              {rows.map((row, i) => (
                <div
                  key={i}
                  className={`flex items-center justify-between px-6 py-3 text-sm ${
                    row.study_date === today ? "bg-gold/10" : ""
                  }`}
                >
                  <span className={row.study_date === today ? "font-bold text-gold-dark" : "text-ink/50"}>
                    {formatDisplayDate(row.study_date, user.date_display)}
                    {row.study_date === today && " (היום)"}
                  </span>
                  <span className="text-navy font-medium">
                    מסכת {row.tractate_name} — פרק {gematriyaNum(row.chapter)}, משנה {gematriyaNum(row.mishna_num)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
