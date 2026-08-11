"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Icon } from "./Icon";

const NAV_ITEMS = [
  { label: "דף הבית", href: "/page", icon: "home" },
  { label: "המשנה היומית", href: "/daily", icon: "sun" },
  { label: "המסכתות שלי", href: "/tractates", icon: "book" },
  { label: "סדר לימוד", href: "/schedule", icon: "list" },
  { label: "הישגים", href: "/achievements", icon: "trophy" },
  { label: "לוח זמנים", href: "/calendar", icon: "calendar" },
  { label: "העמודים שלי", href: "/pages", icon: "heart" },
  { label: "הגדרות", href: "/settings", icon: "gear" },
] as const;

// תפריט תחתון (מובייל בלבד): גישה מהירה + "עוד" שפותח את שאר הפריטים.
const MOBILE_TABS = [
  { label: "בית", href: "/page", icon: "home" },
  { label: "קבוצה", href: "/tractates", icon: "users" },
  { label: "דו״ח", href: "/schedule", icon: "chart" },
] as const;

export interface ShellPage {
  id: number;
  name_he: string;
  dtype: "neshama" | "refuah";
}

export interface ShellUser {
  id: number;
  name: string;
}

function MemorialLeaf({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M49 42 Q30 26 14 10" stroke="#8aab73" strokeWidth="1.5" opacity="0.55" />
      <ellipse cx="39" cy="25" rx="7.5" ry="3.2" fill="#7f9c6c" opacity="0.55" transform="rotate(-35 39 25)" />
      <ellipse cx="27" cy="16" rx="6.5" ry="2.8" fill="#8aab73" opacity="0.5" transform="rotate(-42 27 16)" />
      <ellipse cx="17" cy="9" rx="5.5" ry="2.4" fill="#96b880" opacity="0.45" transform="rotate(-48 17 9)" />
      <rect x="44" y="42" width="10" height="42" rx="2.2" fill="#f3ead9" />
      <ellipse cx="49" cy="39" rx="4.2" ry="7.5" fill="#e8c988" />
      <ellipse cx="49" cy="37" rx="2.3" ry="4.3" fill="#fff6df" />
    </svg>
  );
}

export function AppShell({
  user,
  pages,
  currentPageId,
  children,
}: {
  user: ShellUser;
  pages: ShellPage[];
  currentPageId: number | null;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [pageSwitcherOpen, setPageSwitcherOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  const activePage = pages.find((p) => p.id === currentPageId);
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");
  const moreNavItems = NAV_ITEMS.filter((item) => item.href !== "/page");

  return (
    <div className="min-h-screen">
      {/* סיידבר — דסקטופ בלבד */}
      <aside className="hidden md:flex fixed inset-y-0 right-0 z-40 w-72 bg-cream-dark/60 border-s border-cream-dark flex-col">
        <div className="flex items-center gap-3 px-6 py-7">
          <div className="w-11 h-11 rounded-xl bg-navy/10 flex items-center justify-center text-2xl">📖</div>
          <div>
            <div className="font-bold text-lg leading-tight text-navy">משנה של נשמה</div>
            <div className="text-xs text-ink/50 leading-tight">לומדים. זוכרים. מעלים נשמה.</div>
          </div>
        </div>

        {pages.length > 0 && (
          <div className="px-4 mb-3 relative">
            <button
              className="w-full flex items-center justify-between gap-2 bg-white hover:bg-white/80 rounded-xl px-4 py-3 text-sm transition shadow-card"
              onClick={() => setPageSwitcherOpen((v) => !v)}
            >
              <span className="truncate text-navy font-medium">
                {activePage ? activePage.name_he : "בחירת עמוד לימוד"}
              </span>
              <Icon name="chevron-start" className="w-4 h-4 -rotate-90 flex-shrink-0 text-navy/60" />
            </button>
            {pageSwitcherOpen && (
              <div className="absolute inset-x-4 mt-1 bg-white rounded-xl shadow-card-lg py-2 z-30 max-h-72 overflow-y-auto">
                {pages.map((p) => (
                  <Link
                    key={p.id}
                    href={`/switch-page?id=${p.id}`}
                    className={`block px-4 py-2 text-sm text-ink hover:bg-cream ${p.id === currentPageId ? "font-bold text-navy" : ""}`}
                  >
                    {p.name_he}
                  </Link>
                ))}
                <div className="border-t border-gray-100 mt-1 pt-1">
                  <Link href="/page-create" className="flex items-center gap-1.5 px-4 py-2 text-sm text-gold-dark hover:bg-cream">
                    <Icon name="plus" className="w-4 h-4" /> עמוד לימוד חדש
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

        <nav className="flex-1 overflow-y-auto px-4 space-y-1">
          {NAV_ITEMS.map((item) => (
            <Link key={item.href} href={item.href} className={`nav-link ${isActive(item.href) ? "active" : ""}`}>
              <span className="flex items-center gap-3">
                <Icon name={item.icon} className="w-5 h-5" />
                {item.label}
              </span>
            </Link>
          ))}
        </nav>

        <div className="p-4">
          <Link href="/page-create" className="block rounded-2xl bg-navy/8 hover:bg-navy/12 transition p-4 text-center">
            <div className="text-navy mb-1">
              <Icon name="heart" className="w-6 h-6 mx-auto" />
            </div>
            <p className="text-sm leading-relaxed text-navy/80">
              הזמן חברים
              <br />
              נלמד יחד, נזכה יחד
            </p>
          </Link>
        </div>
      </aside>

      <div className="md:ms-72 min-h-screen flex flex-col pb-20 md:pb-0">
        <header className="flex items-center px-4 md:px-10 py-5">
          <div className="relative">
            <button
              className="flex items-center gap-2 text-navy hover:opacity-80"
              onClick={() => setUserMenuOpen((v) => !v)}
            >
              <span className="w-9 h-9 rounded-full bg-navy text-white flex items-center justify-center text-sm font-bold">
                {user.name.slice(0, 1)}
              </span>
              <span className="font-medium text-sm hidden sm:inline">שלום, {user.name}</span>
              <Icon name="chevron-start" className="w-4 h-4 -rotate-90" />
            </button>
            {userMenuOpen && (
              <div className="absolute start-0 mt-2 w-48 bg-white rounded-xl shadow-card-lg py-2 z-20">
                <Link href="/settings" className="flex items-center gap-2 px-4 py-2 text-sm text-ink hover:bg-cream">
                  <Icon name="gear" className="w-4 h-4" /> הגדרות
                </Link>
                <Link href="/logout" className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-cream">
                  <Icon name="logout" className="w-4 h-4" /> התנתקות
                </Link>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 px-4 md:px-10 pb-6 max-w-[1400px] w-full mx-auto">{children}</main>

        {activePage && (
          <footer className="mt-8 px-4 md:px-10">
            <div className="relative overflow-hidden rounded-2xl bg-navy-dark py-8 px-6 md:px-16 flex items-center justify-center gap-4 md:gap-10">
              <MemorialLeaf className="hidden sm:block w-16 h-16 md:w-20 md:h-20 flex-shrink-0 -scale-x-100" />
              <div className="text-center">
                <p className="text-cream/60 text-xs md:text-sm tracking-wide mb-1.5">
                  {activePage.dtype === "refuah" ? "לרפואת" : "לעילוי נשמת"}
                </p>
                <p className="text-gold font-bold text-xl md:text-3xl leading-snug">{activePage.name_he}</p>
                {activePage.dtype !== "refuah" && (
                  <p className="text-cream/45 text-xs tracking-[0.2em] mt-2">ת.נ.צ.ב.ה</p>
                )}
              </div>
              <MemorialLeaf className="hidden sm:block w-16 h-16 md:w-20 md:h-20 flex-shrink-0" />
            </div>
          </footer>
        )}
      </div>

      {/* תפריט תחתון — מובייל בלבד */}
      <nav className="md:hidden fixed inset-x-0 bottom-0 z-40 bg-white border-t border-cream-dark px-2 pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center justify-between">
          {MOBILE_TABS.slice(0, 2).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-xs ${
                isActive(item.href) ? "text-navy font-semibold" : "text-ink/50"
              }`}
            >
              <Icon name={item.icon} className="w-5 h-5" />
              {item.label}
            </Link>
          ))}

          <div className="flex-1 flex justify-center">
            <Link
              href="/daily"
              className="-mt-6 w-14 h-14 rounded-full bg-navy text-white flex items-center justify-center shadow-card-lg border-4 border-cream"
              aria-label="עדכון לימוד"
            >
              <Icon name="plus" className="w-6 h-6" />
            </Link>
          </div>

          {MOBILE_TABS.slice(2).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-xs ${
                isActive(item.href) ? "text-navy font-semibold" : "text-ink/50"
              }`}
            >
              <Icon name={item.icon} className="w-5 h-5" />
              {item.label}
            </Link>
          ))}

          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            className="flex-1 flex flex-col items-center gap-0.5 py-2.5 text-xs text-ink/50"
          >
            <Icon name="list" className="w-5 h-5" />
            עוד
          </button>
        </div>
      </nav>

      {/* מגירת "עוד" — מובייל בלבד */}
      {moreOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMoreOpen(false)} />
          <div className="absolute inset-x-0 bottom-0 bg-white rounded-t-2xl p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] max-h-[75vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-navy">עוד</h2>
              <button type="button" onClick={() => setMoreOpen(false)} className="text-ink/50 hover:text-ink">
                <Icon name="close" className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-1">
              {moreNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMoreOpen(false)}
                  className={`nav-link ${isActive(item.href) ? "active" : ""}`}
                >
                  <span className="flex items-center gap-3">
                    <Icon name={item.icon} className="w-5 h-5" />
                    {item.label}
                  </span>
                </Link>
              ))}
              <Link
                href="/logout"
                onClick={() => setMoreOpen(false)}
                className="nav-link text-red-600"
              >
                <span className="flex items-center gap-3">
                  <Icon name="logout" className="w-5 h-5" />
                  התנתקות
                </span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
