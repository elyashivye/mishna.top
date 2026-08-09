import { notFound } from "next/navigation";
import { requireLogin } from "@/lib/auth";
import { requireCurrentPage } from "@/lib/current-page";
import { getTractateBySlug, getMishnayotForTractate } from "@/lib/progress";
import { getTractateClaim } from "@/lib/study-pages";
import { Icon } from "@/components/Icon";
import { MishnaChecklist } from "@/components/MishnaChecklist";
import { ClaimTractateButton } from "@/components/ClaimTractateButton";

export default async function TractatePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await requireLogin();
  const page = await requireCurrentPage(user.id);

  const tractate = await getTractateBySlug(slug);
  if (!tractate) notFound();

  const claim = await getTractateClaim(page.id, tractate.id);

  const mishnayot = await getMishnayotForTractate(tractate.id, user.id);
  const learned = mishnayot.filter((m) => m.progress_id !== null).length;
  const percent = mishnayot.length > 0 ? Math.round((learned / mishnayot.length) * 100) : 0;

  const isMine = claim?.user_id === user.id;
  const isClaimed = claim !== null;
  const readOnly = page.mode === "group" && !isMine;

  return (
    <div className="mt-4">
      <div className="card mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-ink/50 text-xs mb-1">{tractate.seder_he}</p>
          <h1 className="font-bold text-navy text-xl flex items-center gap-2">
            <Icon name="book" className="w-6 h-6 text-gold" /> מסכת {tractate.name_he}
          </h1>
          <p className="text-ink/50 text-xs mt-1">
            {tractate.chapter_count} פרקים · {tractate.mishna_count} משניות · {learned}/{mishnayot.length} נלמדו (
            {percent}%)
          </p>
        </div>

        {page.mode === "group" && (
          <div>
            {!isClaimed ? (
              <ClaimTractateButton tractateId={tractate.id} />
            ) : isMine ? (
              <span className="btn-pill bg-gold/20 text-gold-dark">שלי</span>
            ) : (
              <span className="btn-pill bg-cream-dark text-ink/50">
                <Icon name="lock" className="w-4 h-4" /> תפוסה ע&quot;י {claim!.name}
              </span>
            )}
          </div>
        )}
      </div>

      {readOnly && (
        <p className="text-ink/50 text-sm mb-4">
          {isClaimed
            ? "המסכת הזו תפוסה על ידי חבר אחר בעמוד — אפשר לצפות בטקסט אך לא לסמן התקדמות."
            : "יש לתפוס את המסכת קודם כדי לסמן בה התקדמות."}
        </p>
      )}

      <MishnaChecklist mishnayot={mishnayot} readOnly={readOnly} />
    </div>
  );
}
