import { NextResponse } from "next/server";
import { runReminderJob } from "@/lib/services/reminder-service";

/**
 * מופעל פעם ביום דרך Hostinger Cron Jobs:
 *   curl -s -H "x-cron-secret: $CRON_SECRET" "https://mishna.top/api/cron/send-reminders"
 * dry_run=1 מדפיס למי היה נשלח בלי לשלוח בפועל ובלי קרדנציאלים אמיתיים ל-Meta/SMTP.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const secret = request.headers.get("x-cron-secret") ?? url.searchParams.get("secret");

  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dryRun = url.searchParams.get("dry_run") === "1";
  const result = await runReminderJob(dryRun);
  return NextResponse.json(result);
}
