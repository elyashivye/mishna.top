"use server";

import { redirect } from "next/navigation";
import { registerUser } from "@/lib/auth";
import { safeNextUrl } from "@/lib/url";

export async function registerAction(formData: FormData): Promise<void> {
  const name = String(formData.get("name") ?? "");
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const passwordConfirm = String(formData.get("password_confirm") ?? "");
  const next = safeNextUrl(String(formData.get("next") ?? ""));

  const qs = (error: string) =>
    `/register?next=${encodeURIComponent(next)}&error=${encodeURIComponent(error)}&name=${encodeURIComponent(name)}&email=${encodeURIComponent(email)}`;

  if (password !== passwordConfirm) {
    redirect(qs("הסיסמאות אינן תואמות."));
  }

  const result = await registerUser(name, email, password);
  if (!result.ok) {
    redirect(qs(result.error));
  }
  redirect(next);
}
