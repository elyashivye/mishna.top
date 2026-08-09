"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "./Icon";
import { toggleMishnaAction } from "@/lib/actions/progress-actions";

export interface ChecklistMishna {
  id: number;
  chapter: number;
  chapterHe: string;
  mishna_num: number;
  mishnaNumHe: string;
  text_he: string | null;
  progress_id: number | null;
}

export function MishnaChecklist({ mishnayot, readOnly }: { mishnayot: ChecklistMishna[]; readOnly: boolean }) {
  const [completed, setCompleted] = useState<Set<number>>(
    () => new Set(mishnayot.filter((m) => m.progress_id !== null).map((m) => m.id))
  );
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [, startTransition] = useTransition();
  const router = useRouter();

  const chapters = useMemo(() => {
    const map = new Map<number, ChecklistMishna[]>();
    for (const m of mishnayot) {
      if (!map.has(m.chapter)) map.set(m.chapter, []);
      map.get(m.chapter)!.push(m);
    }
    return Array.from(map.entries()).sort((a, b) => a[0] - b[0]);
  }, [mishnayot]);

  function handleToggle(id: number) {
    if (readOnly) return;
    setPendingId(id);
    startTransition(async () => {
      const result = await toggleMishnaAction(id);
      if (result.ok) {
        setCompleted((prev) => {
          const next = new Set(prev);
          if (result.completed) next.add(id);
          else next.delete(id);
          return next;
        });
        router.refresh();
      }
      setPendingId(null);
    });
  }

  return (
    <div className="space-y-6">
      {chapters.map(([chapter, items]) => (
        <div key={chapter}>
          <h3 className="font-bold text-navy text-sm mb-2">פרק {items[0].chapterHe}</h3>
          <div className="card !p-0 overflow-hidden divide-y divide-gray-100">
            {items.map((m) => {
              const isDone = completed.has(m.id);
              return (
                <button
                  key={m.id}
                  type="button"
                  disabled={readOnly || pendingId === m.id}
                  onClick={() => handleToggle(m.id)}
                  className={`w-full flex items-start gap-3 px-5 py-4 text-start transition ${
                    readOnly ? "cursor-default" : "hover:bg-cream"
                  }`}
                >
                  <span
                    className={`mt-0.5 flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                      isDone ? "bg-gold text-white" : "bg-cream-dark text-ink/30"
                    }`}
                  >
                    <Icon name="check" className="w-3.5 h-3.5" />
                  </span>
                  <span>
                    <span className="block text-xs text-ink/50 mb-1">משנה {m.mishnaNumHe}</span>
                    <span className={`block text-[15px] leading-loose ${isDone ? "text-ink/50" : "text-ink/85"}`}>
                      {m.text_he}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
