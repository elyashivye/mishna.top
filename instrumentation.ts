/**
 * רץ פעם אחת כשתהליך ה-Node.js עולה (לא בכל בקשה) — Next.js instrumentation hook.
 * מדפיס ללוגים רק אורך של סודות (לא את הערכים עצמם), כדי לאבחן אם דיפלוי/ריסטארט
 * בפועל טוען משתני סביבה מעודכנים, או שאותו תהליך ישן עדיין רץ.
 * ניתן להסיר את הקובץ הזה לגמרי אחרי שהאבחון בהוסטינגר יסתיים.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    console.log(
      `[boot ${new Date().toISOString()}] SETUP_SECRET len=${process.env.SETUP_SECRET?.length ?? 0}, ` +
        `CRON_SECRET len=${process.env.CRON_SECRET?.length ?? 0}, ` +
        `DB_HOST=${process.env.DB_HOST ?? "(unset)"}, DB_NAME=${process.env.DB_NAME ?? "(unset)"}`
    );
  }
}
