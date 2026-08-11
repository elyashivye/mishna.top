import { requireLogin } from "@/lib/auth";
import { getNotificationPreferences } from "@/lib/notifications";
import { Icon } from "@/components/Icon";
import { saveNotificationPreferencesAction } from "@/lib/actions/notification-actions";
import { saveDateDisplayAction, saveDisplayNameAction } from "@/lib/actions/settings-actions";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const user = await requireLogin();
  const prefs = await getNotificationPreferences(user.id);
  const { saved } = await searchParams;

  return (
    <div className="mt-4 max-w-2xl">
      <h1 className="font-bold text-navy text-xl flex items-center gap-2 mb-6">
        <Icon name="gear" className="w-6 h-6 text-gold" /> הגדרות
      </h1>

      {saved === "1" && (
        <div className="rounded-lg bg-gold/10 text-gold-dark text-sm px-4 py-2.5 mb-6">ההעדפות נשמרו בהצלחה.</div>
      )}

      <div className="card mb-6">
        <h2 className="font-bold text-navy mb-3">פרטי חשבון</h2>
        <form action={saveDisplayNameAction} className="mb-4">
          <label className="block text-xs text-ink/50 mb-1">שם מוצג</label>
          <div className="flex gap-2">
            <input
              type="text"
              name="name"
              defaultValue={user.name}
              required
              className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm"
            />
            <button type="submit" className="btn-pill bg-navy text-white hover:bg-navy-light">
              שמירה
            </button>
          </div>
        </form>
        <p className="text-sm text-ink/70">
          <span className="text-ink/50">אימייל: </span>
          {user.email}
        </p>
      </div>

      <div className="card mb-6">
        <h2 className="font-bold text-navy mb-1">תצוגת תאריכים</h2>
        <p className="text-ink/50 text-xs mb-4">
          איך להציג תאריכים במערכת (לוח לימוד, יעדי סיום וכו&apos;) — תאריך עברי תמיד מוצג; אפשר להוסיף לצידו גם
          תאריך לועזי.
        </p>

        <form action={saveDateDisplayAction} className="space-y-3">
          {[
            { value: "hebrew", label: "עברי בלבד" },
            { value: "both", label: "עברי + לועזי" },
          ].map((opt) => (
            <label key={opt.value} className="flex items-center gap-2.5 text-sm text-ink/70">
              <input
                type="radio"
                name="date_display"
                value={opt.value}
                defaultChecked={user.date_display === opt.value}
                className="w-4 h-4"
              />
              {opt.label}
            </label>
          ))}
          <button type="submit" className="btn-pill bg-navy text-white hover:bg-navy-light">
            שמירה
          </button>
        </form>
      </div>

      <div className="card">
        <h2 className="font-bold text-navy mb-1">העדפות תזכורות</h2>
        <p className="text-ink/50 text-xs mb-4">
          קבלו תזכורת ב-WhatsApp ו/או במייל כדי לא לפספס יום לימוד.
        </p>

        <form action={saveNotificationPreferencesAction} className="space-y-5">
          <label className="flex items-center gap-3 has-[:checked]:text-navy text-ink/70">
            <input
              type="checkbox"
              name="whatsapp_enabled"
              defaultChecked={!!prefs.whatsapp_enabled}
              className="w-4 h-4"
            />
            <span className="font-medium">תזכורות ב-WhatsApp</span>
          </label>
          <div>
            <label className="block text-xs text-ink/50 mb-1">מספר טלפון (בפורמט בינלאומי, לדוגמה 972501234567+)</label>
            <input
              type="text"
              name="phone_e164"
              defaultValue={prefs.phone_e164 ?? ""}
              placeholder="+972501234567"
              className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm"
              dir="ltr"
            />
          </div>

          <label className="flex items-center gap-3 text-ink/70">
            <input type="checkbox" name="email_enabled" defaultChecked={!!prefs.email_enabled} className="w-4 h-4" />
            <span className="font-medium">תזכורות במייל ({user.email})</span>
          </label>

          <div>
            <label className="block text-xs text-ink/50 mb-2">תדירות התזכורות</label>
            <div className="space-y-2">
              {[
                { value: "off", label: "כבוי" },
                { value: "daily_if_behind", label: "יומי — רק אם לא עדכנתי היום" },
                { value: "weekly_summary", label: "סיכום שבועי" },
              ].map((opt) => (
                <label key={opt.value} className="flex items-center gap-2.5 text-sm text-ink/70">
                  <input
                    type="radio"
                    name="frequency"
                    value={opt.value}
                    defaultChecked={prefs.frequency === opt.value}
                    className="w-4 h-4"
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>

          <button type="submit" className="btn-pill bg-navy text-white hover:bg-navy-light">
            שמירת העדפות
          </button>
        </form>
      </div>
    </div>
  );
}
