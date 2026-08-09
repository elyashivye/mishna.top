"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Icon } from "./Icon";
import { TractateClaimCard } from "./TractateClaimCard";
import type { TractateClaimStatus } from "@/lib/study-pages";

export function TractateSearchGrid({
  tractates,
  mode,
}: {
  tractates: TractateClaimStatus[];
  mode: "solo" | "group";
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim();
    if (!q) return tractates;
    return tractates.filter((t) => t.name_he.includes(q) || t.seder_he.includes(q));
  }, [tractates, query]);

  return (
    <div>
      <div className="relative mb-5 max-w-sm">
        <Icon name="search" className="w-4 h-4 absolute top-1/2 -translate-y-1/2 start-3.5 text-ink/35" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="חיפוש מסכת..."
          className="w-full rounded-lg border border-gray-200 ps-10 pe-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="card text-center text-ink/60">לא נמצאה מסכת בשם &quot;{query}&quot;.</div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {mode === "solo"
            ? filtered.map((t) => (
                <Link
                  key={t.id}
                  href={`/tractate/${t.slug}`}
                  className="card flex items-center justify-between hover:shadow-card-lg transition"
                >
                  <div>
                    <p className="font-semibold text-navy text-sm">מסכת {t.name_he}</p>
                    <p className="text-xs text-ink/50 mt-0.5">
                      {t.chapter_count} פרקים · {t.mishna_count} משניות
                    </p>
                  </div>
                  <Icon name="chevron-start" className="w-4 h-4 text-ink/30 -rotate-90" />
                </Link>
              ))
            : filtered.map((t) => <TractateClaimCard key={t.id} tractate={t} />)}
        </div>
      )}
    </div>
  );
}
