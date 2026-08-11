"use server";

import { redirect } from "next/navigation";
import { requireLogin } from "@/lib/auth";
import { execute } from "@/lib/db";

export async function saveDateDisplayAction(formData: FormData): Promise<void> {
  const user = await requireLogin();
  const value = String(formData.get("date_display") ?? "both");
  const dateDisplay = value === "hebrew" ? "hebrew" : "both";

  await execute("UPDATE users SET date_display = ? WHERE id = ?", [dateDisplay, user.id]);

  redirect("/settings?saved=1");
}

export async function saveDisplayNameAction(formData: FormData): Promise<void> {
  const user = await requireLogin();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) redirect("/settings");

  await execute("UPDATE users SET name = ? WHERE id = ?", [name, user.id]);

  redirect("/settings?saved=1");
}
