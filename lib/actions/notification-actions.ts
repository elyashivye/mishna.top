"use server";

import { redirect } from "next/navigation";
import { requireLogin } from "@/lib/auth";
import { saveNotificationPreferences } from "@/lib/notifications";

export async function saveNotificationPreferencesAction(formData: FormData): Promise<void> {
  const user = await requireLogin();

  await saveNotificationPreferences(user.id, {
    whatsapp_enabled: formData.get("whatsapp_enabled") === "on",
    phone_e164: String(formData.get("phone_e164") ?? ""),
    email_enabled: formData.get("email_enabled") === "on",
    frequency: String(formData.get("frequency") ?? "off") as "off" | "daily_if_behind" | "weekly_summary",
  });

  redirect("/settings?saved=1");
}
