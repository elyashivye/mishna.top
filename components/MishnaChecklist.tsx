"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "./Icon";
import { toggleMishnaAction, toggleChapterAction } from "@/lib/actions/progress-actions";
import type { BartenuraSegment } from "@/lib/types";

export interface ChecklistMishna {
  id: number;
  chapter: number;
  chapterHe: string;
  mishna_num: number;
  mishnaNumHe: string;
  text_he: string | null;
  bartenura: BartenuraSegment[] | null;
  progress_id: number | null;
}

export function MishnaChecklist({ mishnayot, readOnly }: { mishnayot: ChecklistMishna[]; readOnly: boolean }) {
  const [completed, setCompleted] = useState<Set<number>>(
    () => new Set(mishnayot.filter((m) => m.progress_id !== null).map((m) => m.id))
  );
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [pendingChapter, setPendingChapter] = useState<number | null>(null);
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

  function handleToggleChapter(chapter: number, items: ChecklistMishna[]) {
    if (readOnly) return;
    setPendingChapter(chapter);
    startTransition(async () => {
      const ids = items.map((m) => m.id);
      const result = await toggleChapterAction(ids);
      if (result.ok) {
        setCompleted((prev) => {
          const next = new Set(prev);
          for (const id of ids) {
            if (result.completed) next.add(id);
            else next.delete(id);
          }
          return next;
        });
        router.refresh();
      }
      setPendingChapter(null);
    });
  }

  function toggleExpanded(id: number) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="space-y-6">
      {chapters.map(([chapter, items]) => {
        const allDone = items.every((m) => completed.has(m.id));
        return (
          <div key={chapter}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-navy text-sm">פרק {items[0].chapterHe}</h3>
              {!readOnly && (
                <button
                  type="button"
                  disabled={pendingChapter === chapter}
                  onClick={() => handleToggleChapter(chapter, items)}
                  className="text-xs text-gold-dark hover:underline disabled:opacity-50"
                >
                  {allDone ? "בטל סימון הפרק" : "סמן פרק שלם כנלמד"}
                </button>
              )}
            </div>
            <div className="card !p-0 overflow-hidden divide-y divide-gray-100">
              {items.map((m) => {
                const isDone = completed.has(m.id);
                const isExpanded = expanded.has(m.id);
                return (
                  <div key={m.id} className="px-5 py-4">
                    <div className="flex items-start gap-3">
                      <button
                        type="button"
                        disabled={readOnly || pendingId === m.id}
                        onClick={() => handleToggle(m.id)}
                        className={`mt-0.5 flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition ${
                          isDone ? "bg-gold text-white" : "bg-cream-dark text-ink/30"
                        } ${readOnly ? "cursor-default" : "cursor-pointer"}`}
                      >
                        <Icon name="check" className="w-3.5 h-3.5" />
                      </button>
                      <div
                        className={`flex-1 ${readOnly ? "" : "cursor-pointer"}`}
                        onClick={() => handleToggle(m.id)}
                      >
                        <span className="block text-xs text-ink/50 mb-1">משנה {m.mishnaNumHe}</span>
                        <span className={`block text-[15px] leading-loose ${isDone ? "text-ink/50" : "text-ink/85"}`}>
                          {m.text_he}
                        </span>
                      </div>
                    </div>
                    {m.bartenura && m.bartenura.length > 0 && (
                      <div className="ms-9 mt-2">
                        <button
                          type="button"
                          onClick={() => toggleExpanded(m.id)}
                          className="text-xs text-gold-dark hover:underline"
                        >
                          {isExpanded ? "הסתרת פירוש ברטנורא" : "הצגת פירוש ברטנורא"}
                        </button>
                        {isExpanded && (
                          <div className="mt-2 text-sm text-ink/70 leading-relaxed bg-cream rounded-lg p-3 border border-cream-dark space-y-2">
                            {m.bartenura.map((seg, i) => (
                              <p key={i}>
                                {seg.lemma && <b className="text-navy">{seg.lemma}. </b>}
                                {seg.body}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
