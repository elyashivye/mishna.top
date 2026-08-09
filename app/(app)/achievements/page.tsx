import { requireLogin } from "@/lib/auth";
import { getUserAchievements } from "@/lib/progress";
import { Icon } from "@/components/Icon";
import { formatDisplayDate } from "@/lib/hebrew-date";

export default async function AchievementsPage() {
  const user = await requireLogin();
  const achievements = await getUserAchievements(user.id);
  const earnedCount = achievements.filter((a) => a.earned).length;

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="font-bold text-navy text-xl flex items-center gap-2">
          <Icon name="trophy" className="w-6 h-6 text-gold" /> הישגים
        </h1>
        <span className="text-sm text-ink/50">
          {earnedCount}/{achievements.length} הושגו
        </span>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {achievements.map((a) => {
          const percent = Math.min(100, Math.round((a.progress_value / a.criteria_value) * 100));
          return (
            <div
              key={a.id}
              className={`card flex flex-col items-center text-center ${a.earned ? "" : "opacity-60"}`}
            >
              <div className={`text-4xl mb-2 ${a.earned ? "" : "grayscale"}`}>{a.icon}</div>
              <p className="font-bold text-navy text-sm mb-1">{a.name_he}</p>
              <p className="text-xs text-ink/50 mb-3">{a.description}</p>
              {a.earned ? (
                <span className="text-xs text-gold-dark font-semibold">
                  הושג {a.earned_at ? `· ${formatDisplayDate(a.earned_at.slice(0, 10), user.date_display)}` : ""}
                </span>
              ) : (
                <div className="w-full">
                  <div className="w-full bg-cream-dark rounded-full h-1.5 overflow-hidden">
                    <div className="bg-gold h-1.5 rounded-full" style={{ width: `${percent}%` }} />
                  </div>
                  <p className="text-[11px] text-ink/40 mt-1">
                    {Math.min(a.progress_value, a.criteria_value)}/{a.criteria_value}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
