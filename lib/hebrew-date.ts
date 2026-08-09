import { HDate, gematriya } from "@hebcal/core";

/**
 * המרה בין תאריך לועזי לעברי, תצוגה בעברית, ואיתור התרחשות הבאה של תאריך עברי
 * חוזר (יארצייט) — מבוסס על @hebcal/core, ספרייה ייעודית ומתוחזקת ללוח השנה
 * העברי (בניגוד לגרסה קודמת שהתבססה על תוסף ה-calendar המובנה של PHP, שהתגלה
 * כלא אמין לגבי אורך חודש אדר בשנה רגילה). getMonthName() של הספרייה כבר מנרמל
 * אוטומטית "אדר" מול אדר א׳/אדר ב׳ בהתאם לשנה מעוברת/רגילה של היעד.
 */

// שמות המפתח (מ-HDate.getMonthName()) -> תצוגה בעברית.
const HEBREW_MONTH_NAMES_HE: Record<string, string> = {
  Nisan: "ניסן",
  Iyyar: "אייר",
  Sivan: "סיוון",
  Tamuz: "תמוז",
  Av: "אב",
  Elul: "אלול",
  Tishrei: "תשרי",
  Cheshvan: "חשוון",
  Kislev: "כסלו",
  Tevet: "טבת",
  "Sh'vat": "שבט",
  Adar: "אדר",
  "Adar I": "אדר א׳",
  "Adar II": "אדר ב׳",
};

/** סדר "דתי" (מתשרי) לתצוגה בטפסים. */
export const HEBREW_MONTH_ORDER = [
  "Tishrei", "Cheshvan", "Kislev", "Tevet", "Sh'vat",
  "Adar", "Adar I", "Adar II",
  "Nisan", "Iyyar", "Sivan", "Tamuz", "Av", "Elul",
] as const;

export function hebrewMonthNameHe(monthName: string): string {
  return HEBREW_MONTH_NAMES_HE[monthName] ?? monthName;
}

export interface HebrewDateParts {
  monthName: string;
  day: number;
  year: number;
}

export function gregorianToHebrewParts(date: Date): HebrewDateParts {
  const h = new HDate(date);
  return { monthName: h.getMonthName(), day: h.getDate(), year: h.getFullYear() };
}

/** תצוגה מלאה בעברית (יום+חודש+שנה), למשל כ"ג אב תשפ"ו. */
export function formatHebrewDateFull(date: Date): string {
  return new HDate(date).renderGematriya(false);
}

/** תצוגת יום+חודש בלבד (ללא שנה) — לשימוש חוזר (יארצייט). */
export function formatHebrewDayMonth(monthName: string, day: number): string {
  return `${gematriya(day)} ${hebrewMonthNameHe(monthName)}`;
}

/**
 * מוצא את התאריך הלועזי הקרוב ביותר (מהיום ואילך) שבו חל התאריך העברי הנתון
 * (יום+חודש, ללא תלות בשנה) — שימושי לחישוב "היארצייט הבא". מטפל אוטומטית
 * בנרמול אדר א׳/אדר ב׳ (דרך HDate) ובחיתוך יום שלא קיים בחודש קצר (כ"ט/ל').
 */
export function findNextHebrewAnniversary(
  monthName: string,
  day: number,
  from: Date = new Date()
): Date | null {
  const fromDate = new Date(from);
  fromDate.setHours(0, 0, 0, 0);
  const currentHebrewYear = new HDate(fromDate).getFullYear();

  for (const hy of [currentHebrewYear, currentHebrewYear + 1]) {
    let monthNum: number;
    try {
      monthNum = new HDate(1, monthName, hy).getMonth();
    } catch {
      continue;
    }
    const maxDay = HDate.daysInMonth(monthNum, hy);
    const useDay = Math.min(day, maxDay);
    const candidate = new HDate(useDay, monthNum, hy).greg();
    candidate.setHours(0, 0, 0, 0);
    if (candidate >= fromDate) {
      return candidate;
    }
  }
  return null;
}

export function todayHebrewDateDisplay(): string {
  return formatHebrewDateFull(new Date());
}

export function daysBetween(a: Date, b: Date): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  const start = new Date(a);
  start.setHours(0, 0, 0, 0);
  const end = new Date(b);
  end.setHours(0, 0, 0, 0);
  return Math.round((end.getTime() - start.getTime()) / msPerDay);
}

/** גימטריה למספר "רגיל" (פרק/משנה) — לא קשור ליום בחודש, אבל אותה שיטת תצוגה. */
export function gematriyaNum(n: number): string {
  return gematriya(n);
}

/** פרסור בטוח של תאריך "YYYY-MM-DD" ממסד הנתונים (ללא הזזת אזור זמן). */
export function parseDbDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export type DateDisplayMode = "hebrew" | "both";

/**
 * מציג תאריך "YYYY-MM-DD" ממסד הנתונים לפי העדפת המשתמש: עברי בלבד, או עברי + לועזי.
 */
export function formatDisplayDate(dateStr: string, mode: DateDisplayMode): string {
  const hebrew = formatHebrewDateFull(parseDbDate(dateStr));
  return mode === "both" ? `${hebrew} (${dateStr})` : hebrew;
}

/** חודש עברי + שנה בלבד (ללא יום) — לכותרות קיבוץ. */
export function formatHebrewMonthYear(date: Date): string {
  const parts = gregorianToHebrewParts(date);
  return `${hebrewMonthNameHe(parts.monthName)} ${gematriya(parts.year)}`;
}
