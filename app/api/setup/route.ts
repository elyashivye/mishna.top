import { NextResponse } from "next/server";
import { runSchemaSetup, runSefariaImport, getSetupStatus } from "@/lib/services/setup-service";

/**
 * הקמה חד-פעמית של מסד הנתונים בפרודקשן — נפתח כלינק בדפדפן (לא דורש גישה
 * מרוחקת למסד; רץ על השרת עם משתני הסביבה שכבר מוגדרים שם).
 *   https://mishna.top/api/setup?secret=<SETUP_SECRET>              — הכל (סכמה + תוכן)
 *   https://mishna.top/api/setup?secret=<SETUP_SECRET>&step=schema  — רק טבלאות (מהיר)
 *   https://mishna.top/api/setup?secret=<SETUP_SECRET>&step=mishnayot — רק ייבוא תוכן (איטי, כמה דקות)
 *   https://mishna.top/api/setup?secret=<SETUP_SECRET>&step=status  — בדיקת מצב בלבד, לא משנה כלום
 * כל הפעולות אידמפוטנטיות — אפשר להריץ שוב בבטחה אם משהו נכשל באמצע.
 */

function htmlPage(title: string, bodyHtml: string, ok: boolean): NextResponse {
  const html = `<!doctype html>
<html lang="he" dir="rtl"><head><meta charset="utf-8"><title>${title}</title>
<style>
  body { font-family: system-ui, sans-serif; background: #faf6ef; color: #1f2937; padding: 2rem; max-width: 640px; margin: 0 auto; line-height: 1.7; }
  .card { background: #fff; border-radius: 16px; padding: 1.75rem; box-shadow: 0 2px 12px rgba(0,0,0,.06); }
  h1 { font-size: 1.25rem; color: ${ok ? "#166534" : "#991b1b"}; }
  code { background: #f3f4f6; padding: .15em .4em; border-radius: 4px; }
  ul { padding-inline-start: 1.25rem; }
  a { color: #b8860b; }
</style></head>
<body><div class="card">${bodyHtml}</div></body></html>`;
  return new NextResponse(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const secret = url.searchParams.get("secret");
  const step = url.searchParams.get("step") ?? "all";

  if (!process.env.SETUP_SECRET || secret !== process.env.SETUP_SECRET) {
    const serverLen = process.env.SETUP_SECRET?.length ?? 0;
    const sentLen = secret?.length ?? 0;
    return htmlPage(
      "שגיאת הרשאה",
      `<h1>גישה נדחתה</h1><p>סוד ההקמה שגוי או חסר.</p>
       <p style="color:#6b7280;font-size:.85em">
         אבחון (לא חושף את הערכים עצמם):<br>
         SETUP_SECRET מוגדר בשרת: ${serverLen > 0 ? `כן (${serverLen} תווים)` : "לא / ריק"}<br>
         סוד שהתקבל בקישור: ${sentLen > 0 ? `כן (${sentLen} תווים)` : "לא נשלח"}
       </p>`,
      false
    );
  }

  try {
    if (step === "status") {
      const status = await getSetupStatus();
      return htmlPage(
        "מצב המערכת",
        `<h1>מצב המערכת</h1><ul>
          <li>מסד מאותחל: ${status.initialized ? "כן" : "לא — " + (status.error ?? "")}</li>
          <li>משתמשים: ${status.users}</li>
          <li>מסכתות: ${status.tractates}</li>
          <li>משניות: ${status.mishnayot}</li>
          <li>עמודי לימוד: ${status.studyPages}</li>
        </ul>`,
        status.initialized
      );
    }

    if (step === "schema") {
      await runSchemaSetup();
      return htmlPage(
        "ההקמה הצליחה",
        `<h1>הטבלאות נוצרו בהצלחה ✅</h1>
         <p>עכשיו הריצו את ייבוא התוכן (לוקח כמה דקות):</p>
         <p><a href="/api/setup?secret=${encodeURIComponent(secret)}&step=mishnayot">${url.origin}/api/setup?secret=***&amp;step=mishnayot</a></p>`,
        true
      );
    }

    if (step === "mishnayot") {
      const result = await runSefariaImport();
      return htmlPage(
        "הייבוא הצליח",
        `<h1>תוכן המשניות יובא בהצלחה ✅</h1>
         <p>${result.tractates} מסכתות, ${result.mishnayot} משניות.</p>
         <p>המערכת מוכנה לשימוש: <a href="/register">${url.origin}/register</a></p>`,
        true
      );
    }

    // step === "all"
    await runSchemaSetup();
    const result = await runSefariaImport();
    return htmlPage(
      "ההקמה הושלמה",
      `<h1>ההקמה הושלמה בהצלחה ✅</h1>
       <p>הטבלאות נוצרו, ו-${result.tractates} מסכתות (${result.mishnayot} משניות) יובאו.</p>
       <p>המערכת מוכנה לשימוש: <a href="/register">${url.origin}/register</a></p>
       <p style="color:#6b7280;font-size:.85em">מומלץ כעת למחוק את משתנה הסביבה <code>SETUP_SECRET</code> בהוסטינגר.</p>`,
      true
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return htmlPage(
      "ההקמה נכשלה",
      `<h1>שגיאה בהקמה</h1><p><code>${message}</code></p><p>בדקו את פרטי ה-DB_* במשתני הסביבה, ונסו שוב (הפעולה בטוחה להרצה חוזרת).</p>`,
      false
    );
  }
}
