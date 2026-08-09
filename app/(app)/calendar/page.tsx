import Link from "next/link";
import { requireLogin } from "@/lib/auth";
import { requireCurrentPage } from "@/lib/current-page";
import { getUserStudyDaysInMonth } from "@/lib/progress";
import { gregorianToHebrewParts, hebrewMonthNameHe } from "@/lib/hebrew-date";
import { Icon } from "@/components/Icon";

const WEEKDAYS_HE = ["א", "ב", "ג", "ד", "ה", "ו", "ש"];

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const user = await requireLogin();
  const page = await requireCurrentPage(user.id);

  const params = await searchParams;
  const now = new Date();
  const [yearStr, monthStr] = (params.month ?? `${now.getFullYear()}-${pad(now.getMonth() + 1)}`).split("-");
  const year = Number(yearStr) || now.getFullYear();
  const month = Number(monthStr) || now.getMonth() + 1; // 1-12

  const firstOfMonth = new Date(year, month - 1, 1);
  const daysInMonth = new Date(year, month, 0).getDate();
  const leadingBlank = firstOfMonth.getDay(); // 0=Sunday

  const studyDays = new Set(await getUserStudyDaysInMonth(user.id, `${year}-${pad(month)}`));
  const todayStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

  const prevDate = new Date(year, month - 2, 1);
  const nextDate = new Date(year, month, 1);
  const prevMonthParam = `${prevDate.getFullYear()}-${pad(prevDate.getMonth() + 1)}`;
  const nextMonthParam = `${nextDate.getFullYear()}-${pad(nextDate.getMonth() + 1)}`;

  const cells: { day: number; dateStr: string; hebrew: string; isToday: boolean; isYahrzeit: boolean }[] = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month - 1, d);
    const dateStr = `${year}-${pad(month)}-${pad(d)}`;
    const hebrewParts = gregorianToHebrewParts(date);
    const isYahrzeit =
      page.passing_hebrew_month !== null &&
      page.passing_hebrew_day !== null &&
      hebrewParts.monthName === page.passing_hebrew_month &&
      hebrewParts.day === page.passing_hebrew_day;
    cells.push({
      day: d,
      dateStr,
      hebrew: `${hebrewParts.day} ${hebrewMonthNameHe(hebrewParts.monthName)}`,
      isToday: dateStr === todayStr,
      isYahrzeit,
    });
  }

  const monthLabel = firstOfMonth.toLocaleDateString("he-IL", { month: "long", year: "numeric" });

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="font-bold text-navy text-xl flex items-center gap-2">
          <Icon name="calendar" className="w-6 h-6 text-gold" /> לוח זמנים
        </h1>
        <div className="flex items-center gap-3">
          <Link href={`/calendar?month=${prevMonthParam}`} className="btn-pill bg-cream-dark text-navy">
            <Icon name="chevron-start" className="w-4 h-4 rotate-180" /> חודש קודם
          </Link>
          <span className="font-semibold text-navy">{monthLabel}</span>
          <Link href={`/calendar?month=${nextMonthParam}`} className="btn-pill bg-cream-dark text-navy">
            חודש הבא <Icon name="chevron-start" className="w-4 h-4" />
          </Link>
        </div>
      </div>

      <div className="card">
        <div className="grid grid-cols-7 gap-2 mb-2 text-center text-xs font-semibold text-ink/50">
          {WEEKDAYS_HE.map((w) => (
            <div key={w}>{w}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: leadingBlank }).map((_, i) => (
            <div key={`b${i}`} />
          ))}
          {cells.map((c) => {
            const studied = studyDays.has(c.dateStr);
            return (
              <div
                key={c.dateStr}
                className={`rounded-xl p-2 text-center border ${
                  c.isToday
                    ? "border-gold bg-gold/10"
                    : c.isYahrzeit
                      ? "border-navy/30 bg-navy/5"
                      : "border-transparent"
                }`}
              >
                <div className={`text-sm font-semibold ${c.isToday ? "text-gold-dark" : "text-navy"}`}>{c.day}</div>
                <div className="text-[10px] text-ink/40 leading-tight">{c.hebrew}</div>
                <div className="flex items-center justify-center gap-1 mt-1 h-4">
                  {studied && <Icon name="check" className="w-3 h-3 text-gold" />}
                  {c.isYahrzeit && <Icon name="candle" className="w-3 h-3 text-navy" />}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-6 mt-4 text-xs text-ink/50">
        <span className="flex items-center gap-1.5">
          <Icon name="check" className="w-3.5 h-3.5 text-gold" /> יום לימוד
        </span>
        <span className="flex items-center gap-1.5">
          <Icon name="candle" className="w-3.5 h-3.5 text-navy" /> יארצייט / אזכרה
        </span>
      </div>
    </div>
  );
}
