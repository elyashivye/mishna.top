import "server-only";
import nodemailer from "nodemailer";

/** ריק (SMTP_HOST/SMTP_USER/SMTP_PASSWORD לא מוגדרים) = מיילים כבויים בשקט. */

export interface EmailSendResult {
  ok: boolean;
  error?: string;
}

let cachedTransporter: nodemailer.Transporter | null | undefined;

export function isEmailConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD);
}

function getTransporter(): nodemailer.Transporter | null {
  if (cachedTransporter !== undefined) return cachedTransporter;
  if (!isEmailConfigured()) {
    cachedTransporter = null;
    return cachedTransporter;
  }
  const port = Number(process.env.SMTP_PORT) || 587;
  cachedTransporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
  });
  return cachedTransporter;
}

export async function sendReminderEmail(
  to: string,
  subject: string,
  html: string,
  text: string
): Promise<EmailSendResult> {
  const transporter = getTransporter();
  if (!transporter) {
    return { ok: false, error: "מייל אינו מוגדר (חסרים SMTP_HOST/SMTP_USER/SMTP_PASSWORD)." };
  }
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || "no-reply@mishna.top",
      to,
      subject,
      text,
      html,
    });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
