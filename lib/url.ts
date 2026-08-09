/** מוגן מפני open-redirect: מאפשר רק נתיבים יחסיים שמתחילים ב-/ (לא //evil.com). */
export function safeNextUrl(next: string | null | undefined, fallback = "/pages"): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return fallback;
  }
  return next;
}
