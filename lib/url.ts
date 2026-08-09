/** מוגן מפני open-redirect: מאפשר רק נתיבים יחסיים שמתחילים ב-/ (לא //evil.com). */
export function safeNextUrl(next: string | null | undefined, fallback = "/pages"): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return fallback;
  }
  return next;
}

/**
 * בונה URL מוחלט לשימוש ב-redirect מתוך Route Handler, מועדף לפי APP_URL
 * ולא לפי origin הבקשה הנכנסת — כי מאחורי reverse proxy (כמו בהוסטינגר)
 * ה-origin של הבקשה עלול לשקף את הכתובת הפנימית שהשרת מאזין עליה
 * (למשל http://0.0.0.0:3000) במקום הדומיין הציבורי.
 */
export function absoluteUrl(path: string, requestUrl: string): URL {
  const base = process.env.APP_URL || new URL(requestUrl).origin;
  return new URL(path, base);
}
