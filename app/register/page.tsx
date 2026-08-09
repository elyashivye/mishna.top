import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { safeNextUrl } from "@/lib/url";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";
import { registerAction } from "./actions";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string; name?: string; email?: string }>;
}) {
  const params = await searchParams;
  const next = safeNextUrl(params.next);

  if (await currentUser()) {
    redirect(next);
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-3">
          <div className="text-3xl mb-1">📖</div>
          <h1 className="text-xl font-bold text-navy">משנה של נשמה</h1>
          <p className="text-ink/60 text-xs mt-0.5">לומדים. זוכרים. מעלים נשמה.</p>
        </div>
        <div className="card">
          <h2 className="text-base font-bold text-navy mb-3">יצירת חשבון חדש</h2>
          {params.error && (
            <div className="mb-3 rounded-lg bg-red-50 text-red-700 text-sm px-4 py-2.5">{params.error}</div>
          )}
          <form action={registerAction} className="space-y-3">
            <input type="hidden" name="next" value={next} />
            <div>
              <label className="block text-xs text-ink/70 mb-0.5">שם מלא</label>
              <input
                type="text"
                name="name"
                required
                maxLength={100}
                defaultValue={params.name ?? ""}
                className="w-full rounded-lg border border-gray-200 px-3.5 py-2 focus:outline-none focus:ring-2 focus:ring-gold"
              />
            </div>
            <div>
              <label className="block text-xs text-ink/70 mb-0.5">אימייל</label>
              <input
                type="email"
                name="email"
                required
                defaultValue={params.email ?? ""}
                className="w-full rounded-lg border border-gray-200 px-3.5 py-2 focus:outline-none focus:ring-2 focus:ring-gold"
              />
            </div>
            <div>
              <label className="block text-xs text-ink/70 mb-0.5">סיסמה</label>
              <input
                type="password"
                name="password"
                required
                minLength={6}
                className="w-full rounded-lg border border-gray-200 px-3.5 py-2 focus:outline-none focus:ring-2 focus:ring-gold"
              />
            </div>
            <div>
              <label className="block text-xs text-ink/70 mb-0.5">אימות סיסמה</label>
              <input
                type="password"
                name="password_confirm"
                required
                minLength={6}
                className="w-full rounded-lg border border-gray-200 px-3.5 py-2 focus:outline-none focus:ring-2 focus:ring-gold"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-navy text-white rounded-lg py-2.5 font-semibold hover:bg-navy-light transition"
            >
              הרשמה
            </button>
          </form>
          <GoogleSignInButton next={next} mode="register" />
          <p className="text-center text-sm text-ink/60 mt-3">
            כבר יש לך חשבון?{" "}
            <Link href={`/login?next=${encodeURIComponent(next)}`} className="text-gold-dark font-semibold hover:underline">
              התחברות
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
