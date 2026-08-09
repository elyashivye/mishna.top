import { Icon } from "@/components/Icon";
import { DateModeFields } from "@/components/DateModeFields";
import { PaceFields } from "@/components/PaceFields";
import { createPageAction } from "./actions";

export default async function PageCreatePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="mt-4 max-w-2xl mx-auto">
      <h1 className="font-bold text-navy text-xl mb-1 flex items-center gap-2">
        <Icon name="plus" className="w-6 h-6 text-gold" /> יצירת עמוד לימוד
      </h1>
      <p className="text-ink/60 text-sm mb-6">פתחו עמוד לימוד לעילוי נשמה או לרפואה — לבד או כקבוצה שמתחלקת במסכתות.</p>

      {params.error && (
        <div className="mb-4 rounded-lg bg-red-50 text-red-700 text-sm px-4 py-3">{params.error}</div>
      )}

      <form action={createPageAction} className="card space-y-6">
        <div>
          <h2 className="font-bold text-navy mb-3">פרטי ההקדשה</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-ink/70 mb-1">סוג ההקדשה</label>
              <div className="flex gap-3">
                <label className="flex items-center gap-1.5 text-sm">
                  <input type="radio" name="dtype" value="neshama" defaultChecked /> לעילוי נשמה
                </label>
                <label className="flex items-center gap-1.5 text-sm">
                  <input type="radio" name="dtype" value="refuah" /> לרפואה
                </label>
              </div>
            </div>
            <div>
              <label className="block text-sm text-ink/70 mb-1">שם (לדוגמה: ר&apos; משה בן יצחק ז&quot;ל)</label>
              <input
                type="text"
                name="name_he"
                required
                maxLength={150}
                className="w-full rounded-lg border border-gray-200 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-gold"
              />
            </div>
            <DateModeFields />
            <div>
              <label className="block text-sm text-ink/70 mb-1">הערה (אופציונלי)</label>
              <input
                type="text"
                name="notes"
                maxLength={255}
                className="w-full rounded-lg border border-gray-200 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-gold"
              />
            </div>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-5">
          <h2 className="font-bold text-navy mb-3">אופן הלימוד</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <label className="border-2 rounded-xl p-4 cursor-pointer has-[:checked]:border-gold has-[:checked]:bg-gold/5 border-gray-200">
              <input type="radio" name="mode" value="solo" defaultChecked className="ms-2" />
              <span className="font-semibold text-navy">לימוד אישי</span>
              <p className="text-xs text-ink/60 mt-1">אתם לומדים לבד את כל הש&quot;ס בקצב שתבחרו.</p>
            </label>
            <label className="border-2 rounded-xl p-4 cursor-pointer has-[:checked]:border-gold has-[:checked]:bg-gold/5 border-gray-200">
              <input type="radio" name="mode" value="group" className="ms-2" />
              <span className="font-semibold text-navy">קבוצתי</span>
              <p className="text-xs text-ink/60 mt-1">מזמינים אחרים להצטרף ולתפוס מסכתות פנויות.</p>
            </label>
          </div>
        </div>

        <PaceFields />

        <button
          type="submit"
          className="w-full bg-navy text-white rounded-lg py-3 font-semibold hover:bg-navy-light transition"
        >
          יצירת עמוד הלימוד
        </button>
      </form>
    </div>
  );
}
