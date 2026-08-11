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
}

export interface ShellUser {
  id: number;
  name: string;
}

export interface FooterQuote {
  text: string;
  source: string;
}

export function AppShell({
  user,
  pages,
  currentPageId,
  quote,
  children,
}: {
  user: ShellUser;
  pages: ShellPage[];
  currentPageId: number | null;
  quote: FooterQuote;
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
              <span className="font-medium text-sm hidden sm:inline">שלום {user.name}</span>
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

        <footer className="hidden md:block px-4 md:px-10 py-8 mt-6">
          <div className="flex items-center justify-center gap-3 text-center flex-wrap">
            <span className="text-gold">
              <Icon name="heart" className="w-5 h-5" />
            </span>
            <p className="text-ink/70 text-sm">
              <span className="font-semibold text-navy">&quot;{quote.text}&quot;</span>
              <span className="text-ink/50"> — {quote.source}</span>
            </p>
          </div>
        </footer>
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
