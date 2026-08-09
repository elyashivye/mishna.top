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
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">📖</div>
          <h1 className="text-2xl font-bold text-navy">משנה של נשמה</h1>
          <p className="text-ink/60 text-sm mt-1">לומדים. זוכרים. מעלים נשמה.</p>
        </div>
        <div className="card">
          <h2 className="text-lg font-bold text-navy mb-4">יצירת חשבון חדש</h2>
          {params.error && (
            <div className="mb-4 rounded-lg bg-red-50 text-red-700 text-sm px-4 py-3">{params.error}</div>
          )}
          <form action={registerAction} className="space-y-4">
            <input type="hidden" name="next" value={next} />
            <div>
              <label className="block text-sm text-ink/70 mb-1">שם מלא</label>
              <input
                type="text"
                name="name"
                required
                maxLength={100}
                defaultValue={params.name ?? ""}
                className="w-full rounded-lg border border-gray-200 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-gold"
              />
            </div>
            <div>
              <label className="block text-sm text-ink/70 mb-1">אימייל</label>
              <input
                type="email"
                name="email"
                required
                defaultValue={params.email ?? ""}
                className="w-full rounded-lg border border-gray-200 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-gold"
              />
            </div>
            <div>
              <label className="block text-sm text-ink/70 mb-1">סיסמה</label>
              <input
                type="password"
                name="password"
                required
                minLength={6}
                className="w-full rounded-lg border border-gray-200 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-gold"
              />
            </div>
            <div>
              <label className="block text-sm text-ink/70 mb-1">אימות סיסמה</label>
              <input
                type="password"
                name="password_confirm"
                required
                minLength={6}
                className="w-full rounded-lg border border-gray-200 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-gold"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-navy text-white rounded-lg py-3 font-semibold hover:bg-navy-light transition"
            >
              הרשמה
            </button>
          </form>
          <GoogleSignInButton next={next} />
          <p className="text-center text-sm text-ink/60 mt-4">
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
