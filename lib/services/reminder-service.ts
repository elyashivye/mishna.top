import "server-only";
import { query, queryOne, execute } from "@/lib/db";
import { getUserStats } from "@/lib/progress";
import { getUserStudyPages } from "@/lib/study-pages";
import { sendWhatsAppReminder } from "./whatsapp-service";
import { sendReminderEmail } from "./email-service";

/**
 * מנוע התזכורות היומי — מופעל דרך /api/cron/send-reminders (Hostinger Cron Jobs).
 * "יומי אם לא עדכנתי" נבדק מול users.last_study_date; "סיכום שבועי" נשלח פעם
 * בשבוע (יום ראשון). notification_log מונע שליחה כפולה באותו יום לאותו ערוץ.
 */

interface ReminderCandidate {
  user_id: number;
  name: string;
  email: string;
  last_study_date: string | null;
  whatsapp_enabled: number;
  phone_e164: string | null;
  email_enabled: number;
  frequency: "off" | "daily_if_behind" | "weekly_summary";
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

async function alreadySentToday(userId: number, channel: "whatsapp" | "email"): Promise<boolean> {
  const row = await queryOne(
    "SELECT 1 FROM notification_log WHERE user_id = ? AND channel = ? AND DATE(sent_at) = ?",
    [userId, channel, todayStr()]
  );
  return row !== null;
}

async function logSent(userId: number, channel: "whatsapp" | "email", status: string, preview: string): Promise<void> {
  await execute("INSERT INTO notification_log (user_id, channel, status, message_preview) VALUES (?, ?, ?, ?)", [
    userId,
    channel,
    status,
    preview.slice(0, 255),
  ]);
}

export interface ReminderRunResult {
  candidates: number;
  sentWhatsapp: number;
  sentEmail: number;
  skipped: number;
  errors: string[];
  dryRunLog: string[];
}

export async function runReminderJob(dryRun: boolean): Promise<ReminderRunResult> {
  const result: ReminderRunResult = {
    candidates: 0,
    sentWhatsapp: 0,
    sentEmail: 0,
    skipped: 0,
    errors: [],
    dryRunLog: [],
  };

  const isSunday = new Date().getDay() === 0;
  const today = todayStr();

  const candidates = await query<ReminderCandidate>(
    `SELECT u.id AS user_id, u.name, u.email, u.last_study_date,
            np.whatsapp_enabled, np.phone_e164, np.email_enabled, np.frequency
     FROM notification_preferences np
     JOIN users u ON u.id = np.user_id
     WHERE np.frequency != 'off' AND (np.whatsapp_enabled = 1 OR np.email_enabled = 1)`
  );

  for (const c of candidates) {
    result.candidates++;

    if (c.frequency === "daily_if_behind" && c.last_study_date === today) {
      result.skipped++;
      continue;
    }
    if (c.frequency === "weekly_summary" && !isSunday) {
      result.skipped++;
      continue;
    }

    const stats = await getUserStats(c.user_id);
    const pages = await getUserStudyPages(c.user_id);
    const pageNames = pages.map((p) => p.name_he).join(", ") || "—";

    const message =
      c.frequency === "weekly_summary"
        ? `שלום ${c.name}, סיכום שבועי: למדתם ${stats.learned} מתוך ${stats.total_mishnayot} משניות (${stats.percent}%), רצף נוכחי ${stats.streak} ימים. עמודי הלימוד שלכם: ${pageNames}.`
        : `שלום ${c.name}, עדיין לא סימנתם לימוד היום. אל תפספסו את הרצף שלכם (${stats.streak} ימים)! עמודי הלימוד שלכם: ${pageNames}.`;

    if (c.whatsapp_enabled && c.phone_e164) {
      if (dryRun) {
        result.dryRunLog.push(`[WHATSAPP DRY-RUN] -> ${c.phone_e164} (${c.name}): ${message}`);
      } else if (!(await alreadySentToday(c.user_id, "whatsapp"))) {
        const sendResult = await sendWhatsAppReminder(c.phone_e164, [c.name, String(stats.streak)]);
        await logSent(c.user_id, "whatsapp", sendResult.ok ? "sent" : `error: ${sendResult.error}`, message);
        if (sendResult.ok) result.sentWhatsapp++;
        else result.errors.push(`whatsapp user ${c.user_id}: ${sendResult.error}`);
      }
    }

    if (c.email_enabled) {
      if (dryRun) {
        result.dryRunLog.push(`[EMAIL DRY-RUN] -> ${c.email} (${c.name}): ${message}`);
      } else if (!(await alreadySentToday(c.user_id, "email"))) {
        const subject =
          c.frequency === "weekly_summary" ? "הסיכום השבועי שלכם — משנה של נשמה" : "תזכורת ללימוד היום — משנה של נשמה";
        const sendResult = await sendReminderEmail(c.email, subject, `<p>${message}</p>`, message);
        await logSent(c.user_id, "email", sendResult.ok ? "sent" : `error: ${sendResult.error}`, message);
        if (sendResult.ok) result.sentEmail++;
        else result.errors.push(`email user ${c.user_id}: ${sendResult.error}`);
      }
    }
  }

  return result;
}
