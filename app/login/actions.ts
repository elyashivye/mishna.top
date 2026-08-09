"use server";

import { redirect } from "next/navigation";
import { attemptLogin } from "@/lib/auth";
import { safeNextUrl } from "@/lib/url";

export async function loginAction(formData: FormData): Promise<void> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const next = safeNextUrl(String(formData.get("next") ?? ""));

  const result = await attemptLogin(email, password);
  if (!result.ok) {
    redirect(`/login?next=${encodeURIComponent(next)}&error=${encodeURIComponent(result.error)}&email=${encodeURIComponent(email)}`);
  }
  redirect(next);
}
