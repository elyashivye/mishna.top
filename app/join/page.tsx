import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { getStudyPageByInviteCode } from "@/lib/study-pages";
import { getDedicationDateDisplay } from "@/lib/study-pages";
import { Icon } from "@/components/Icon";
import { formatDisplayDate } from "@/lib/hebrew-date";
import { joinAction } from "./actions";

export default async function JoinPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const params = await searchParams;
  const code = (params.code ?? "").toUpperCase().trim();

  const user = await currentUser();
  if (!user) {
    const next = encodeURIComponent(`/join?code=${code}`);
    redirect(`/register?next=${next}`);
  }

  const page = code ? await getStudyPageByInviteCode(code) : null;
  const dedicationDate = page ? getDedicationDateDisplay(page) : null;

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {!page ? (
          <div className="card text-center">
            <p className="font-bold text-navy text-lg mb-2">קוד הזמנה לא נמצא</p>
            <p className="text-ink/60 text-sm mb-5">בדקו שהקישור שקיבלתם מלא ותקין.</p>
            <form method="get" className="flex gap-2">
              <input
                type="text"
                name="code"
                placeholder="קוד הזמנה"
                defaultValue={code}
                className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-center tracking-widest"
              />
              <button type="submit" className="btn-pill bg-navy text-white">
                חיפוש
              </button>
            </form>
          </div>
        ) : (
          <div className="card text-center">
            <div className="text-gold mb-3">
              <Icon name="candle" className="w-10 h-10 mx-auto" />
            </div>
            <p className="text-ink/50 text-sm mb-1">{page.dtype === "refuah" ? "לרפואת" : "לעילוי נשמת"}</p>
            <p className="font-bold text-navy text-xl mb-1">{page.name_he}</p>
            {dedicationDate && <p className="text-ink/50 text-sm mb-4">{dedicationDate.hebrew_display}</p>}
            <p className="text-ink/60 text-sm mb-6">
              הצטרפו לעמוד הלימוד הקבוצתי הזה, ובחרו מסכת פנויה ללימוד לפי הקצב שנקבע (יעד:{" "}
              {formatDisplayDate(page.target_end_date, user.date_display)}).
            </p>
            <form action={joinAction}>
              <input type="hidden" name="code" value={code} />
              <button type="submit" className="btn-pill bg-gold text-white hover:bg-gold-dark w-full justify-center">
                <Icon name="plus" className="w-4 h-4" /> הצטרפות לעמוד
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
