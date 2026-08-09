"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "./Icon";
import { claimTractateAction, unclaimTractateAction } from "@/lib/actions/study-page-actions";
import type { TractateClaimStatus } from "@/lib/study-pages";

export function TractateClaimCard({ tractate }: { tractate: TractateClaimStatus }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const claimed = tractate.claimed_by_id !== null;

  function handleClaim() {
    setError(null);
    startTransition(async () => {
      const result = await claimTractateAction(tractate.id);
      if (!result.ok) {
        setError(result.error);
      } else {
        router.refresh();
      }
    });
  }

  function handleUnclaim() {
    setError(null);
    startTransition(async () => {
      await unclaimTractateAction(tractate.id);
      router.refresh();
    });
  }

  return (
    <div className="card flex flex-col">
      <div className="flex items-start justify-between mb-2">
        <p className="font-semibold text-navy">מסכת {tractate.name_he}</p>
        <span className="text-xs text-ink/40">{tractate.seder_he}</span>
      </div>
      <p className="text-xs text-ink/50 mb-4">{tractate.chapter_count} פרקים · {tractate.mishna_count} משניות</p>

      <div className="mt-auto">
        {claimed ? (
          tractate.is_mine ? (
            <div className="flex items-center gap-2">
              <Link href={`/tractate/${tractate.slug}`} className="btn-pill bg-gold text-white flex-1 justify-center">
                שלי — למסכת
              </Link>
              <button
                type="button"
                onClick={handleUnclaim}
                disabled={pending}
                className="text-xs text-red-500 hover:underline px-2"
                title="שחרור המסכת"
              >
                שחרור
              </button>
            </div>
          ) : (
            <div className="btn-pill bg-cream-dark text-ink/50 justify-center cursor-not-allowed">
              <Icon name="lock" className="w-4 h-4" /> תפוסה ע&quot;י {tractate.claimed_by_name}
            </div>
          )
        ) : (
          <button
            type="button"
            onClick={handleClaim}
            disabled={pending}
            className="btn-pill bg-navy text-white hover:bg-navy-light w-full justify-center"
          >
            <Icon name="plus" className="w-4 h-4" /> תפיסת מסכת
          </button>
        )}
        {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
      </div>
    </div>
  );
}
