/**
 * סקריפט CLI חד-פעמי: מייבא את פירוש ר' עובדיה מברטנורא (פומבי-דומיין) על כל
 * 63 המסכתות מ-Sefaria-Export. דורש שהמסכתות/משניות כבר יובאו קודם
 * (scripts/import-sefaria.ts) — משייך את הפירוש לפי (tractate, chapter, mishna_num).
 *
 * הרצה: node --env-file=.env.local --import tsx scripts/import-bartenura.ts
 */
import { db } from "../lib/db";
import { runBartenuraImport } from "../lib/services/setup-service";

async function main() {
  const result = await runBartenuraImport((message) => process.stdout.write(message + "\n"));
  console.log(`הושלם: פירוש ברטנורא יובא ל-${result.mishnayot} משניות ב-${result.tractates} מסכתות.`);
  await db().end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
