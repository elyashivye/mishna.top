import "server-only";
import { queryOne, execute } from "./db";
import type { NotificationPreferences } from "./types";

export async function getNotificationPreferences(userId: number): Promise<NotificationPreferences> {
  const row = await queryOne<NotificationPreferences>(
    "SELECT * FROM notification_preferences WHERE user_id = ?",
    [userId]
  );
  return (
    row ?? {
      user_id: userId,
      whatsapp_enabled: 0,
      phone_e164: "",
      email_enabled: 0,
      frequency: "off",
    }
  );
}

export interface SaveNotificationPreferencesInput {
  whatsapp_enabled: boolean;
  phone_e164: string;
  email_enabled: boolean;
  frequency: "off" | "daily_if_behind" | "weekly_summary";
}

export async function saveNotificationPreferences(
  userId: number,
  data: SaveNotificationPreferencesInput
): Promise<void> {
  await execute(
    `INSERT INTO notification_preferences (user_id, whatsapp_enabled, phone_e164, email_enabled, frequency)
     VALUES (?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE whatsapp_enabled=VALUES(whatsapp_enabled), phone_e164=VALUES(phone_e164),
       email_enabled=VALUES(email_enabled), frequency=VALUES(frequency)`,
    [
      userId,
      data.whatsapp_enabled ? 1 : 0,
      data.phone_e164.trim() || null,
      data.email_enabled ? 1 : 0,
      ["off", "daily_if_behind", "weekly_summary"].includes(data.frequency) ? data.frequency : "off",
    ]
  );
}
