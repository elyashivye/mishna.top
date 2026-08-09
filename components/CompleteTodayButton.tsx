"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Icon } from "./Icon";
import { toggleMishnaAction } from "@/lib/actions/progress-actions";

export function CompleteTodayButton({
  mishnaId,
  initialCompleted,
}: {
  mishnaId: number;
  initialCompleted: boolean;
}) {
  const [completed, setCompleted] = useState(initialCompleted);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleClick() {
    if (!mishnaId) return;
    startTransition(async () => {
      const result = await toggleMishnaAction(mishnaId);
      if (result.ok) {
        setCompleted(result.completed);
        router.refresh();
      }
    });
  }

  return (
    <div className="card flex flex-col items-center justify-center text-center">
      <button
        onClick={handleClick}
        disabled={pending}
        data-testid="complete-today-btn"
        className={`w-16 h-16 rounded-full flex items-center justify-center transition ${
          completed ? "bg-gold text-white" : "bg-cream-dark text-ink/40 hover:text-gold"
        }`}
      >
        <Icon name="check" className="w-8 h-8" />
      </button>
      <p className="font-bold text-navy mt-3">{completed ? "סיימתי ללמוד היום" : "סמנו כשסיימתם ללמוד היום"}</p>
      <p className="text-ink/50 text-xs mt-1">היום</p>
    </div>
  );
}
