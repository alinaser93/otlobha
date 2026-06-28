import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Loader2, X, PartyPopper } from 'lucide-react';
import { orderRatingStatus, rateOrderDriver, rateOrderProduct, rateOrderStore } from '../lib/orders.js';

/*
  OrderRating — shown AFTER delivery (the private order link proves purchase,
  and only within the rating window). Rates the driver, each store, each product.
  Two presentations share the same rows:
   • <OrderRating/>  — inline card on the order page / orders list.
   • <RatingSheet/>  — a prominent sheet that pops up automatically on delivery.
*/

// A single 1–5 star row. Products submit on tap; driver/store add an optional comment.
export function StarRow({ label, sublabel, rated, ratedStars = 0, onSubmit, withComment = false }) {
  const [stars, setStars] = useState(ratedStars);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(!!rated);

  if (done) {
    return (
      <div className="flex items-center justify-between gap-2 rounded-2xl bg-beige/40 px-3.5 py-2.5 dark:bg-white/5">
        <span className="truncate font-display text-sm font-bold text-ink dark:text-cream">{label}</span>
        <div className="flex shrink-0 gap-0.5">
          {[1, 2, 3, 4, 5].map((n) => (
            <Star key={n} className={`h-4 w-4 ${n <= (stars || ratedStars) ? 'fill-amber-400 text-amber-400' : 'text-ink/15 dark:text-cream/15'}`} />
          ))}
        </div>
      </div>
    );
  }

  async function submit(selected) {
    const s = selected || stars;
    if (!s || busy) return;
    setBusy(true);
    const r = await onSubmit(s, comment);
    setBusy(false);
    if (r?.ok) { setStars(s); setDone(true); }
  }

  return (
    <div className="rounded-2xl bg-beige/40 px-3.5 py-3 dark:bg-white/5">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate font-display text-sm font-bold text-ink dark:text-cream">{label}</div>
          {sublabel && <div className="text-[11px] text-ink/45 dark:text-cream/45">{sublabel}</div>}
        </div>
        <div className="flex shrink-0 gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} type="button" disabled={busy}
              onClick={() => { setStars(n); if (!withComment) submit(n); }}
              className="transition active:scale-90">
              <Star className={`h-7 w-7 ${n <= stars ? 'fill-amber-400 text-amber-400' : 'text-ink/20 dark:text-cream/20'}`} />
            </button>
          ))}
        </div>
      </div>
      {withComment && stars > 0 && (
        <div className="mt-2.5">
          <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={2} placeholder="تعليق (اختياري)…"
            className="w-full rounded-xl border border-ink/10 bg-cream px-3 py-2 text-sm outline-none focus:border-copper dark:border-white/10 dark:bg-night-900 dark:text-cream" />
          <button type="button" onClick={() => submit()} disabled={busy}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-copper py-2.5 font-display text-sm font-bold text-cream hover:bg-copper-dark disabled:opacity-50">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Star className="h-4 w-4" />} إرسال
          </button>
        </div>
      )}
    </div>
  );
}

// Shared body: the driver + stores + products rows.
function RatingRows({ status, orderId, driverName }) {
  const driver = status.driver || {};
  const products = status.products || [];
  const stores = status.stores || [];
  return (
    <div className="space-y-2.5">
      {driver.has && (
        <StarRow label={`المندوب: ${driverName || 'مندوب التوصيل'}`} rated={driver.rated} withComment
          onSubmit={(s, c) => rateOrderDriver(orderId, s, c)} />
      )}
      {stores.map((s) => (
        <StarRow key={s.id} label={`المتجر: ${s.name}`} sublabel="تجربة الطلب والخدمة" rated={s.rated} withComment
          onSubmit={(st, c) => rateOrderStore(orderId, s.id, st, c)} />
      ))}
      {products.length > 0 && (
        <>
          <div className="pt-1.5 text-xs font-bold text-ink/55 dark:text-cream/55">قيّم المنتجات</div>
          {products.map((p) => (
            <StarRow key={p.id} label={p.name} rated={p.rated}
              onSubmit={(st) => rateOrderProduct(orderId, p.id, st, null)} />
          ))}
        </>
      )}
    </div>
  );
}

function hasContent(s) {
  if (!s?.ok || !s.delivered || !s.within_window) return false;
  return !!(s.driver?.has || (s.products || []).length || (s.stores || []).length);
}

function anyUnrated(s) {
  if (!hasContent(s)) return false;
  const d = s.driver?.has && !s.driver.rated;
  const st = (s.stores || []).some((x) => !x.rated);
  const pr = (s.products || []).some((x) => !x.rated);
  return d || st || pr;
}

// Inline card (order page + orders list).
export default function OrderRating({ orderId, driverName, compact = false }) {
  const [status, setStatus] = useState(null);

  useEffect(() => {
    let alive = true;
    if (!orderId) return;
    orderRatingStatus(orderId).then((r) => { if (alive && r?.ok) setStatus(r); });
    return () => { alive = false; };
  }, [orderId]);

  if (!hasContent(status)) return null;

  return (
    <div className={compact
      ? 'rounded-2xl bg-cream/70 p-3 ring-1 ring-ink/5 dark:bg-night-900/40 dark:ring-white/5'
      : 'rounded-3xl bg-cream p-5 shadow-card dark:bg-night-800'}>
      <div className="mb-1 flex items-center gap-2">
        <Star className={compact ? 'h-4 w-4 fill-amber-400 text-amber-400' : 'h-5 w-5 fill-amber-400 text-amber-400'} />
        <h3 className={compact
          ? 'font-display text-sm font-extrabold text-ink dark:text-cream'
          : 'font-display text-lg font-extrabold text-ink dark:text-cream'}>قيّم طلبك</h3>
      </div>
      <p className="mb-3 text-[11px] text-ink/50 dark:text-cream/50">رأيك يساعد بقية الزبائن — التقييم متاح لأنك استلمت هذا الطلب 🌟</p>
      <RatingRows status={status} orderId={orderId} driverName={driverName} />
    </div>
  );
}

// Auto-popup sheet — slides up once on delivery so the customer can't miss it.
export function RatingSheet({ orderId, driverName }) {
  const [status, setStatus] = useState(null);
  const [open, setOpen] = useState(false);
  const dismissKey = `otlobha:ratePrompt:${orderId}`;

  useEffect(() => {
    let alive = true;
    if (!orderId) return;
    orderRatingStatus(orderId).then((r) => {
      if (!alive || !r?.ok) return;
      setStatus(r);
      let dismissed = false;
      try { dismissed = !!localStorage.getItem(dismissKey); } catch {}
      if (anyUnrated(r) && !dismissed) setOpen(true);
    });
    return () => { alive = false; };
  }, [orderId]);

  function close() {
    try { localStorage.setItem(dismissKey, '1'); } catch {}
    setOpen(false);
  }

  return (
    <AnimatePresence>
      {open && status && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={close} dir="rtl"
          className="fixed inset-0 z-[130] flex items-end justify-center bg-ink/50 backdrop-blur-sm sm:items-center">
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-cream p-5 shadow-seal dark:bg-night-800 sm:rounded-3xl">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-copper/15 text-copper-dark dark:text-copper-light">
                  <PartyPopper className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-black leading-tight text-ink dark:text-cream">وصل طلبك! 🎉</h3>
                  <p className="text-xs text-ink/55 dark:text-cream/55">قيّم تجربتك — يساعد الكل</p>
                </div>
              </div>
              <button type="button" onClick={close} aria-label="إغلاق"
                className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-ink/5 text-ink/60 transition hover:bg-ink/10 dark:bg-white/10 dark:text-cream/60">
                <X className="h-4 w-4" />
              </button>
            </div>

            <RatingRows status={status} orderId={orderId} driverName={driverName} />

            <button type="button" onClick={close}
              className="mt-4 w-full rounded-xl bg-ink/5 py-3 font-display text-sm font-bold text-ink/60 transition hover:bg-ink/10 dark:bg-white/5 dark:text-cream/60">
              تم
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
