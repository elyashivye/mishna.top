import { isGoogleAuthConfigured } from "@/lib/services/google-oauth";

export function GoogleSignInButton({ next, mode = "login" }: { next: string; mode?: "login" | "register" }) {
  if (!isGoogleAuthConfigured()) return null;

  return (
    <>
      <div className="flex items-center gap-3 my-3">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-xs text-ink/40">או</span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>
      <a
        href={`/auth/google?next=${encodeURIComponent(next)}`}
        className="w-full flex items-center justify-center gap-2.5 rounded-lg border border-gray-200 py-2 font-medium text-ink/80 hover:bg-cream transition"
      >
        <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
          <path
            fill="#4285F4"
            d="M23.52 12.27c0-.85-.08-1.66-.22-2.44H12v4.62h6.46c-.28 1.5-1.13 2.78-2.41 3.63v3.02h3.9c2.28-2.1 3.57-5.2 3.57-8.83z"
          />
          <path
            fill="#34A853"
            d="M12 24c3.24 0 5.96-1.07 7.95-2.9l-3.9-3.02c-1.08.73-2.46 1.16-4.05 1.16-3.11 0-5.75-2.1-6.69-4.92H1.28v3.11C3.26 21.3 7.31 24 12 24z"
          />
          <path fill="#FBBC05" d="M5.31 14.32A7.2 7.2 0 0 1 4.91 12c0-.8.14-1.58.4-2.32V6.57H1.28A11.98 11.98 0 0 0 0 12c0 1.93.46 3.76 1.28 5.43z" />
          <path
            fill="#EA4335"
            d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.45-3.45C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.28 6.57l4.03 3.11C6.25 6.86 8.89 4.75 12 4.75z"
          />
        </svg>
        {mode === "register" ? "הרשמה באמצעות Google" : "התחברות עם Google"}
      </a>
    </>
  );
}
