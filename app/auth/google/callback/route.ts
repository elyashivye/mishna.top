import { NextResponse } from "next/server";
import { exchangeGoogleCode, fetchGoogleUserInfo, isGoogleAuthConfigured } from "@/lib/services/google-oauth";
import { findOrCreateGoogleUser } from "@/lib/auth";
import { safeNextUrl } from "@/lib/url";

function loginError(request: Request, message: string): NextResponse {
  return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(message)}`, request.url));
}

export async function GET(request: Request) {
  const url = new URL(request.url);

  if (!isGoogleAuthConfigured()) {
    return loginError(request, "התחברות עם Google אינה מוגדרת עדיין.");
  }

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state") ?? "";
  const oauthError = url.searchParams.get("error");
  if (oauthError) {
    return loginError(request, "ההתחברות עם Google בוטלה.");
  }
  if (!code) {
    return loginError(request, "קוד אימות מ-Google חסר.");
  }

  const [csrfFromState, encodedNext] = state.split(".");
  const cookieToken = request.headers
    .get("cookie")
    ?.split("; ")
    .find((c) => c.startsWith("google_oauth_state="))
    ?.split("=")[1];

  if (!csrfFromState || !cookieToken || csrfFromState !== cookieToken) {
    return loginError(request, "פג תוקף בקשת ההתחברות, נסו שוב.");
  }
  const next = safeNextUrl(encodedNext ? decodeURIComponent(encodedNext) : null);

  try {
    const tokens = await exchangeGoogleCode(code);
    const profile = await fetchGoogleUserInfo(tokens.access_token);

    if (!profile.email) {
      return loginError(request, "לא התקבלה כתובת אימייל מ-Google.");
    }

    await findOrCreateGoogleUser({ googleId: profile.sub, email: profile.email, name: profile.name || profile.email });

    const response = NextResponse.redirect(new URL(next, request.url));
    response.cookies.delete("google_oauth_state");
    return response;
  } catch (err) {
    return loginError(request, err instanceof Error ? err.message : "ההתחברות עם Google נכשלה.");
  }
}
