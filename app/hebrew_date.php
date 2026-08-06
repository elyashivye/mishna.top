<?php
/**
 * המרה בין תאריך לועזי לעברי, תצוגה בעברית, ואיתור התרחשות הבאה של תאריך עברי
 * חוזר (יארצייט). מבוסס על תוסף ה-calendar המובנה של PHP (jdtojewish/jewishtojd),
 * שמותקן כברירת מחדל כמעט בכל שרתי PHP (כולל הוסטינגר). ראו isHebrewCalendarAvailable().
 *
 * הערה: המספור המספרי הפנימי של jdtojewish() לחודשים משתנה בין שנים מעוברות
 * לרגילות, ולכן איננו מסתמכים עליו ישירות — אנחנו משתמשים בשם החודש
 * (jdmonthname עם מצב 4) כמפתח יציב ובלתי-תלוי-שנה לאחסון ולחיפוש חוזר.
 */

// שמות המפתח (באנגלית) חייבים להתאים בדיוק למחרוזות שמחזירה jdmonthname($jd, 4)
// של PHP (נבדק ידנית) — הם שונים מהתעתיק ה"רגיל" (Tishri לא Tishrei, Heshvan לא Cheshvan).
const HEBREW_MONTH_NAMES_HE = [
    'Tishri' => 'תשרי',
    'Heshvan' => 'חשוון',
    'Kislev' => 'כסלו',
    'Tevet' => 'טבת',
    'Shevat' => 'שבט',
    'Adar' => 'אדר',
    'Adar I' => 'אדר א׳',
    'Adar II' => 'אדר ב׳',
    'Nisan' => 'ניסן',
    'Iyyar' => 'אייר',
    'Sivan' => 'סיוון',
    'Tammuz' => 'תמוז',
    'Av' => 'אב',
    'Elul' => 'אלול',
];

/** סדר "דתי" (מתשרי) לתצוגה בטפסים — לא סדר האחסון הפנימי של PHP. */
const HEBREW_MONTH_ORDER = [
    'Tishri', 'Heshvan', 'Kislev', 'Tevet', 'Shevat',
    'Adar', 'Adar I', 'Adar II',
    'Nisan', 'Iyyar', 'Sivan', 'Tammuz', 'Av', 'Elul',
];

const HEBREW_DAY_GEMATRIA = [
    1 => 'א', 2 => 'ב', 3 => 'ג', 4 => 'ד', 5 => 'ה', 6 => 'ו', 7 => 'ז', 8 => 'ח', 9 => 'ט',
    10 => 'י', 11 => 'יא', 12 => 'יב', 13 => 'יג', 14 => 'יד', 15 => 'טו', 16 => 'טז',
    17 => 'יז', 18 => 'יח', 19 => 'יט', 20 => 'כ', 21 => 'כא', 22 => 'כב', 23 => 'כג',
    24 => 'כד', 25 => 'כה', 26 => 'כו', 27 => 'כז', 28 => 'כח', 29 => 'כט', 30 => 'ל',
];

function isHebrewCalendarAvailable(): bool
{
    return extension_loaded('calendar') && function_exists('jdtojewish') && function_exists('jewishtojd');
}

function hebrewDayGematria(int $day): string
{
    $g = HEBREW_DAY_GEMATRIA[$day] ?? (string) $day;
    if (mb_strlen($g) === 1) {
        return $g . '׳'; // גרש (single quote) לאות בודדת, לדוגמה א׳
    }
    return mb_substr($g, 0, -1) . '״' . mb_substr($g, -1); // גרשיים (double quote) לפני האות האחרונה
}

/** שם החודש העברי (מזוהה ע"י PHP באמצעות jdmonthname, יציב בין שנים). */
function hebrewMonthNameFromJd(int $jd): string
{
    return jdmonthname($jd, 4);
}

/** ['month_name'=>string באנגלית (מפתח יציב), 'day'=>int, 'year'=>int] */
function gregorianToHebrewParts(DateTimeInterface $date): array
{
    $jd = cal_to_jd(CAL_GREGORIAN, (int) $date->format('n'), (int) $date->format('j'), (int) $date->format('Y'));
    $raw = jdtojewish($jd);
    [, $day, $year] = array_map('intval', explode('/', $raw));
    return [
        'month_name' => hebrewMonthNameFromJd($jd),
        'day' => $day,
        'year' => $year,
    ];
}

/** תצוגה מלאה בעברית (יום+חודש+שנה) לתאריך לועזי נתון, למשל כ"ג אב תשפ"ו. */
function formatHebrewDateFull(DateTimeInterface $date): string
{
    $jd = cal_to_jd(CAL_GREGORIAN, (int) $date->format('n'), (int) $date->format('j'), (int) $date->format('Y'));
    $formatted = jdtojewish($jd, true, CAL_JEWISH_ADD_GERESHAYIM);
    $utf8 = iconv('ISO-8859-8', 'UTF-8', $formatted);
    // PHP מחזיר גרש/גרשיים כגרשיים ASCII רגילים ('/") — מנרמלים לתווי הפיסוק העבריים הנכונים.
    return str_replace(['"', "'"], ['״', '׳'], $utf8);
}

/** תצוגת יום+חודש בלבד (ללא שנה), משם חודש יציב ויום — לשימוש חוזר (יארצייט). */
function formatHebrewDayMonth(string $monthName, int $day): string
{
    $monthHe = HEBREW_MONTH_NAMES_HE[$monthName] ?? $monthName;
    return hebrewDayGematria($day) . ' ' . $monthHe;
}

function isHebrewLeapYear(int $hebrewYear): bool
{
    // שנה מעוברת בלוח העברי: כלל ה-19 שנה (מחזור מטון), שנים 3,6,8,11,14,17,0(19) במחזור.
    $pos = $hebrewYear % 19;
    return in_array($pos, [0, 3, 6, 8, 11, 14, 17], true);
}

/**
 * מוצא, עבור שנה עברית נתונה, את המספר הפנימי (1-13) של jewishtojd() שמתאים
 * לשם החודש המבוקש — תוך נרמול "אדר" הכללי מול אדר א׳/אדר ב׳ בהתאם לשנה
 * מעוברת/רגילה (מנהג נפוץ: אדר של שנה רגילה משויך לאדר ב׳ בשנה מעוברת).
 */
function findMonthNumberInHebrewYear(string $monthName, int $hebrewYear): ?int
{
    $leap = isHebrewLeapYear($hebrewYear);
    $target = $monthName;
    if (!$leap) {
        if ($monthName === 'Adar I' || $monthName === 'Adar II') {
            $target = 'Adar';
        }
    } else {
        if ($monthName === 'Adar') {
            $target = 'Adar II'; // מנהג נפוץ; ראו הערה ב-README לגבי מנהגים חלופיים.
        }
    }

    for ($m = 1; $m <= 13; $m++) {
        try {
            $jd = jewishtojd($m, 1, $hebrewYear);
        } catch (\ValueError $e) {
            continue;
        }
        if (hebrewMonthNameFromJd($jd) === $target) {
            return $m;
        }
    }
    return null;
}

/**
 * מספר הימים בחודש עברי נתון. cal_days_in_month(CAL_JEWISH, ...) של PHP אינו
 * אמין עבור חודש 6 (אדר/אדר א׳) — במקום זאת בודקים אם יום 30 עדיין נופל
 * באותו חודש (לפי שם) או שכבר "גלש" לחודש הבא, ומכאן 30 או 29 ימים.
 */
function hebrewMonthLength(int $monthNum, int $hebrewYear): int
{
    $jd1 = jewishtojd($monthNum, 1, $hebrewYear);
    $jd30 = jewishtojd($monthNum, 30, $hebrewYear);
    return hebrewMonthNameFromJd($jd1) === hebrewMonthNameFromJd($jd30) ? 30 : 29;
}

/**
 * מוצא את התאריך הלועזי הקרוב ביותר (מהיום ואילך) שבו חל התאריך העברי הנתון
 * (יום+חודש, ללא תלות בשנה) — שימושי לחישוב "היארצייט הבא".
 */
function findNextHebrewAnniversary(string $monthName, int $day, ?DateTimeInterface $from = null): ?DateTime
{
    if (!isHebrewCalendarAvailable()) {
        return null;
    }
    $from = $from ? DateTime::createFromInterface($from) : new DateTime('today');
    $from->setTime(0, 0, 0);

    $currentHebrewYear = gregorianToHebrewParts($from)['year'];

    foreach ([$currentHebrewYear, $currentHebrewYear + 1] as $hy) {
        $monthNum = findMonthNumberInHebrewYear($monthName, $hy);
        if ($monthNum === null) {
            continue;
        }
        $daysInMonth = hebrewMonthLength($monthNum, $hy);
        $useDay = min($day, $daysInMonth);
        $jd = jewishtojd($monthNum, $useDay, $hy);
        $gregorian = new DateTime(jdToGregorianDate($jd));
        if ($gregorian >= $from) {
            return $gregorian;
        }
    }
    return null;
}

/** jdtogregorian() מחזיר מחרוזת "m/d/Y" — עוזר קטן להמרה ל-DateTime תקין. */
function jdToGregorianDate(int $jd): string
{
    [$m, $d, $y] = explode('/', jdtogregorian($jd));
    return sprintf('%04d-%02d-%02d', (int) $y, (int) $m, (int) $d);
}

function todayHebrewDateDisplay(): string
{
    if (!isHebrewCalendarAvailable()) {
        return '';
    }
    return formatHebrewDateFull(new DateTime('today'));
}
