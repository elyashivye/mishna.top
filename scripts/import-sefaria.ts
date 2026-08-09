/**
 * סקריפט CLI חד-פעמי: מייבא את טקסט 63 מסכתות המשנה (עברית עם ניקוד)
 * מ-Sefaria-Export (Google Cloud Storage, ציבורי, ללא צורך במפתח API) אל בסיס הנתונים.
 * לוחות הלימוד האישיים (member_schedule) נבנים בזמן ריצה per-page, לא כאן.
 *
 * הרצה: node --env-file=.env.local --import tsx scripts/import-sefaria.ts
 */
import { db } from "../lib/db";
import { runSefariaImport } from "../lib/services/setup-service";

async function main() {
  const result = await runSefariaImport((message) => process.stdout.write(message + "\n"));
  console.log(`הושלם: ${result.mishnayot} משניות יובאו ב-${result.tractates} מסכתות.`);
  await db().end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
