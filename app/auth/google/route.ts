import { NextResponse } from "next/server";
import crypto from "crypto";
import { buildGoogleAuthUrl, isGoogleAuthConfigured } from "@/lib/services/google-oauth";
import { safeNextUrl, absoluteUrl } from "@/lib/url";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const next = safeNextUrl(url.searchParams.get("next"));

  if (!isGoogleAuthConfigured()) {
    return NextResponse.redirect(
      absoluteUrl(`/login?error=${encodeURIComponent("התחברות עם Google אינה מוגדרת עדיין.")}`, request.url)
    );
  }

  const csrfToken = crypto.randomBytes(24).toString("hex");
  const state = `${csrfToken}.${encodeURIComponent(next)}`;

  const response = NextResponse.redirect(buildGoogleAuthUrl(state));
  response.cookies.set("google_oauth_state", csrfToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });
  return response;
}
