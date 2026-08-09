"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "./Icon";
import { claimTractateAction } from "@/lib/actions/study-page-actions";

export function ClaimTractateButton({ tractateId }: { tractateId: number }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function handleClick() {
    setError(null);
    startTransition(async () => {
      const result = await claimTractateAction(tractateId);
      if (!result.ok) setError(result.error);
      else router.refresh();
    });
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className="btn-pill bg-navy text-white hover:bg-navy-light"
      >
        <Icon name="plus" className="w-4 h-4" /> תפיסת מסכת
      </button>
      {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
    </div>
  );
}
