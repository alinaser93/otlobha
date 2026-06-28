import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, X, Loader2, MessageSquare, Check } from 'lucide-react';
import { productRate, productMyRating, productRatingsList } from '../lib/products.js';

function relTime(iso) {
  if (!iso) return '';
  const d = new Date(iso).getTime();
  const diff = Math.max(0, Date.now() - d);
  const day = 86400000;
  if (diff < day) return 'اليوم';
  if (diff < 2 * day) return 'أمس';
  const days = Math.floor(diff / day);
  if (days < 30) return `قبل ${days} يوم`;
  const months = Math.floor(days / 30);
  if (months < 12) return `قبل ${months} شهر`;
  return `قبل ${Math.floor(months / 12)} سنة`;
}

/* ── Rating modal: pick stars + write a comment (registered customers only) ── */
export function ProductRatingModal({ product, account, onClose, onRated }) {
  const [stars, setStars] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    let alive = true;
    if (!account?.id) { setLoading(false); return; }
    productMyRating(account.id, product.id).then((r) => {
      if (!alive) return;
      if (r?.ok && r.rating) { setStars(r.rating.stars || 0); setComment(r.rating.comment || ''); }
      setLoading(false);
    });
    return () => { alive = false; };
  }, [account, product.id]);

  async function submit() {
    if (!stars) { setErr('اختر عدد النجوم أولاً'); return; }
    setBusy(true); setErr('');
    const r = await productRate(account.id, product.id, stars, comment.trim());
    setBusy(false);
    if (r?.ok) {
      setDone(true);
      onRated?.({ rating: Number(r.rating) || 0, ratingCount: r.rating_count || 0 });
      setTimeout(() => onClose?.(), 900);
    } else {
      setErr(r?.error === 'unauthorized' ? 'سجّل الدخول لتقييم المنتج' : 'تعذّر إرسال التقييم، حاول مجدداً');
    }
  }

  const shown = hover || stars;

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose} dir="rtl"
        className="fixed inset-0 z-[120] flex items-center justify-center bg-ink/50 p-4 backdrop-blur-sm">
        <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-md rounded-3xl bg-cream p-6 shadow-card dark:bg-night-800">
          <button onClick={onClose} className="absolute left-4 top-4 grid h-8 w-8 place-items-center rounded-full bg-ink/10 text-ink hover:bg-ink/20 dark:bg-white/10 dark:text-cream">
            <X className="h-4 w-4" />
          </button>

          {done ? (
            <div className="flex flex-col items-center py-8 text-center">
              <div className="grid h-16 w-16 place-items-center rounded-full bg-green-500/15 text-green-600 dark:text-green-300">
                <Check className="h-8 w-8" />
              </div>
              <p className="mt-4 font-display text-xl font-black text-ink dark:text-cream">شكراً لتقييمك! 🌟</p>
              <p className="mt-1 font-body text-sm text-ink/50 dark:text-cream/50">رأيك يساعد بقية الزبائن</p>
            </div>
          ) : (
            <>
              <h3 className="font-display text-xl font-black text-ink dark:text-cream">قيّم {product.name}</h3>
              <p className="mt-1 font-body text-sm text-ink/50 dark:text-cream/50">شلون كان المنتج؟</p>

              {loading ? (
                <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-copper" /></div>
              ) : (
                <>
                  <div className="mt-5 flex justify-center gap-2" onMouseLeave={() => setHover(0)}>
                    {[1, 2, 3, 4, 5].map((i) => (
                      <button key={i} onMouseEnter={() => setHover(i)} onClick={() => setStars(i)}
                        className="transition active:scale-90">
                        <Star className={`h-10 w-10 ${i <= shown ? 'fill-amber-400 text-amber-400' : 'text-ink/20 dark:text-cream/20'}`} />
                      </button>
                    ))}
                  </div>
                  <p className="mt-2 text-center font-body text-sm font-bold text-amber-600 dark:text-amber-300">
                    {['', 'سيئ', 'مقبول', 'جيد', 'جيد جداً', 'ممتاز'][shown]}
                  </p>

                  <textarea rows={3} value={comment} onChange={(e) => setComment(e.target.value)}
                    placeholder="اكتب رأيك (اختياري)…"
                    className="mt-4 w-full rounded-xl border border-ink/10 bg-beige px-3 py-2.5 text-sm outline-none focus:border-copper dark:border-white/10 dark:bg-night-900 dark:text-cream" />

                  {err && <div className="mt-2 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-300">{err}</div>}

                  <button onClick={submit} disabled={busy}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-copper py-3 font-display font-bold text-cream hover:bg-copper-dark disabled:opacity-60">
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Star className="h-4 w-4 fill-cream" />} إرسال التقييم
                  </button>
                </>
              )}
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/* ── Reviews list (public) ── */
export function ProductReviews({ productId, refreshKey = 0 }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    productRatingsList(productId, 20).then((r) => {
      if (!alive) return;
      setReviews(Array.isArray(r?.reviews) ? r.reviews : []);
      setLoading(false);
    });
    return () => { alive = false; };
  }, [productId, refreshKey]);

  if (loading) return null;
  if (!reviews.length) return null;

  const shown = expanded ? reviews : reviews.slice(0, 3);

  return (
    <div className="mt-4 rounded-2xl bg-beige/40 p-4 dark:bg-white/5">
      <div className="mb-3 flex items-center gap-2">
        <MessageSquare className="h-4 w-4 text-copper" />
        <h4 className="font-display text-base font-black text-ink dark:text-cream">آراء الزبائن ({reviews.length})</h4>
      </div>
      <div className="space-y-2.5">
        {shown.map((rv, i) => (
          <div key={i} className="rounded-xl bg-cream p-3 dark:bg-night-800">
            <div className="flex items-center justify-between">
              <span className="font-display text-sm font-bold text-ink dark:text-cream">{rv.name}</span>
              <span className="font-body text-[11px] text-ink/40 dark:text-cream/40">{relTime(rv.at)}</span>
            </div>
            <div className="mt-1 flex gap-0.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} className={`h-3.5 w-3.5 ${s <= rv.stars ? 'fill-amber-400 text-amber-400' : 'text-ink/15 dark:text-cream/15'}`} />
              ))}
            </div>
            {rv.comment && <p className="mt-1.5 font-body text-sm leading-relaxed text-ink/70 dark:text-cream/70">{rv.comment}</p>}
          </div>
        ))}
      </div>
      {reviews.length > 3 && (
        <button onClick={() => setExpanded((v) => !v)}
          className="mt-3 w-full rounded-xl bg-ink/5 py-2 font-body text-sm font-bold text-ink/60 hover:bg-ink/10 dark:bg-white/5 dark:text-cream/60">
          {expanded ? 'عرض أقل' : `عرض كل الآراء (${reviews.length})`}
        </button>
      )}
    </div>
  );
}
