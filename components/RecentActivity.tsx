import type { ActivityItem } from "@/lib/study-pages";
import { gematriyaNum } from "@/lib/hebrew-date";
import { Icon } from "./Icon";

function timeAgoHe(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "עכשיו";
  if (minutes < 60) return `לפני ${minutes} דק׳`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `לפני ${hours} שע׳`;
  const days = Math.floor(hours / 24);
  return `לפני ${days} ימים`;
}

export function RecentActivity({ items }: { items: ActivityItem[] }) {
  if (items.length === 0) {
    return <p className="text-ink/50 text-sm py-4 text-center">עדיין אין פעילות להצגה.</p>;
  }
  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-3">
          <span className="w-8 h-8 rounded-full bg-gold-light text-gold-dark flex items-center justify-center flex-shrink-0">
            <Icon name="check" className="w-4 h-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm text-ink/85 truncate">
              מסכת {item.tractateName} — פרק {gematriyaNum(item.chapter)}, משנה {gematriyaNum(item.mishnaNum)}
            </p>
          </div>
          <span className="text-xs text-ink/40 flex-shrink-0">{timeAgoHe(item.completedAt)}</span>
        </div>
      ))}
    </div>
  );
}
