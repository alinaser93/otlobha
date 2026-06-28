import { useEffect, useState } from 'react';
import { Star, Trash2, Loader2 } from 'lucide-react';

/*
  ReviewsModeration — a reusable list of reviews with a delete button on each.
  Used by both the admin page and the merchant page (store + driver reviews).
    load()      → Promise<{ ok, reviews: [] }>
    remove(id)  → Promise<{ ok }>
  Each review item shows: primary name, optional secondary label, stars, comment.
*/
export default function ReviewsModeration({
  load, remove, idKey = 'id', primaryKey = 'name', secondaryKey = null,
  emptyText = 'لا توجد تقييمات بعد',
}) {
  const [reviews, setReviews] = useState(null);
  const [busy, setBusy] = useState(null);

  useEffect(() => {
    let alive = true;
    load().then((r) => { if (alive) setReviews(r?.ok && Array.isArray(r.reviews) ? r.reviews : []); });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function del(id) {
    if (typeof window !== 'undefined' && !window.confirm('حذف هذا التقييم نهائياً؟')) return;
    setBusy(id);
    const r = await remove(id);
    setBusy(null);
    if (r?.ok) setReviews((rs) => rs.filter((x) => x[idKey] !== id));
  }

  if (reviews === null) {
    return <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-copper" /></div>;
  }
  if (!reviews.length) {
    return <p className="py-4 text-center text-sm text-ink/40 dark:text-cream/40">{emptyText}</p>;
  }

  return (
    <div className="space-y-2.5">
      {reviews.map((r) => (
        <div key={r[idKey]} className="rounded-2xl bg-beige/40 p-3 dark:bg-white/5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2">
                <span className="font-display text-sm font-bold text-ink dark:text-cream">{r[primaryKey]}</span>
                {secondaryKey && r[secondaryKey] && (
                  <span className="text-[11px] text-ink/45 dark:text-cream/45">• {r[secondaryKey]}</span>
                )}
              </div>
              <div className="mt-1 flex gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className={`h-3.5 w-3.5 ${s <= r.stars ? 'fill-amber-400 text-amber-400' : 'text-ink/15 dark:text-cream/15'}`} />
                ))}
              </div>
              {r.comment && <p className="mt-1.5 break-words text-sm text-ink/70 dark:text-cream/70">{r.comment}</p>}
            </div>
            <button type="button" onClick={() => del(r[idKey])} disabled={busy === r[idKey]}
              aria-label="حذف التقييم"
              className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-red-500/10 text-red-600 transition hover:bg-red-500/20 disabled:opacity-50 dark:text-red-300">
              {busy === r[idKey] ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
