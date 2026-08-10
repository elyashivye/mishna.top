import Link from "next/link";
import type { CurrentTractateProgress } from "@/lib/study-pages";
import { gematriyaNum } from "@/lib/hebrew-date";
import { Icon } from "./Icon";

export function ChapterNavigator({ data }: { data: CurrentTractateProgress }) {
  const { tractate, currentChapter, chapters } = data;
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="font-semibold text-navy text-sm">
          פרק {gematriyaNum(currentChapter)} מתוך {gematriyaNum(tractate.chapter_count)}
        </p>
        <Link href={`/tractate/${tractate.slug}`} className="text-xs text-gold-dark hover:underline">
          למסכת המלאה
        </Link>
      </div>
      <div className="flex flex-wrap gap-2">
        {chapters.map((c) => {
          const done = c.learned >= c.total;
          const isCurrent = c.chapter === currentChapter;
          return (
            <Link
              key={c.chapter}
              href={`/tractate/${tractate.slug}#chapter-${c.chapter}`}
              title={`פרק ${gematriyaNum(c.chapter)}: ${c.learned}/${c.total}`}
              className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold transition ${
                done
                  ? "bg-navy text-white"
                  : isCurrent
                    ? "bg-gold text-white ring-2 ring-gold-light"
                    : "bg-cream-dark text-ink/60 hover:bg-cream-dark/70"
              }`}
            >
              {done ? <Icon name="check" className="w-4 h-4" /> : c.chapter}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
