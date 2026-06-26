import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingCart, Gift, MessageCircle, Truck, PartyPopper, Plus, Minus, Trash2, Package, ChevronLeft } from 'lucide-react';
import { fmt } from '../data/catalog.js';
import { SETTINGS, calcDelivery } from '../config.js';

// status labels for the mini order tracker
const CART_ORDER_STATUS = {
  new: { label: 'طلبك قيد المراجعة', step: 1 },
  preparing: { label: 'يُحضّر طلبك الآن', step: 2 },
  delivering: { label: 'مندوبك في الطريق إليك', step: 3 },
  done: { label: 'تم توصيل طلبك', step: 4 },
};

// cart line thumbnail: real product image (white bg melts via multiply), emoji fallback.
function CartThumb({ image, emoji }) {
  const [ok, setOk] = useState(true);
  if (image && ok) {
    return (
      <img
        src={image}
        alt=""
        loading="lazy"
        onError={() => setOk(false)}
        className="h-full w-full object-contain p-1 mix-blend-multiply"
      />
    );
  }
  return <span>{emoji}</span>;
}

// motivational progress toward free delivery — nudges the customer to add more
function FreeDeliveryBar({ total, storeCount }) {
  const threshold = SETTINGS.free_delivery_over;
  if (!threshold || threshold <= 0) return null;
  const reached = total >= threshold;
  const pct = Math.max(0, Math.min(100, Math.round((total / threshold) * 100)));
  const remaining = Math.max(0, threshold - total);
  const fee = calcDelivery(total, storeCount);

  return (
    <div className={`mb-3 rounded-2xl p-3 ring-1 backdrop-blur-md ${reached ? 'bg-green-500/15 ring-green-500/30' : 'bg-copper/10 ring-copper/25'}`}>
      <div className="mb-1.5 flex items-center gap-1.5 text-sm font-bold">
        {reached ? (
          <span className="flex items-center gap-1.5 text-green-700 dark:text-green-300">
            <PartyPopper className="h-4 w-4" /> رائع! حصلت على توصيل مجاني 🎉
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-copper-dark dark:text-copper-light">
            <Truck className="h-4 w-4" /> باقي <span className="font-black">{fmt(remaining)}</span> د.ع للتوصيل المجاني
          </span>
        )}
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-ink/10 dark:bg-white/10">
        <motion.div
          className={`h-full rounded-full ${reached ? 'bg-green-500' : 'bg-gradient-to-l from-copper to-copper-light'}`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ type: 'spring', stiffness: 120, damping: 20 }}
        />
      </div>
      {!reached && (
        <p className="mt-1.5 text-[11px] text-ink/50 dark:text-cream/50">
          التوصيل الآن: <span className="font-bold">{fmt(fee)} د.ع</span>
          {storeCount > 1 && <span> ({storeCount} متاجر)</span>}
        </p>
      )}
    </div>
  );
}

// a tiny tappable tracker for the customer's most recent active order
function MiniOrderTracker({ order }) {
  if (!order) return null;
  const st = CART_ORDER_STATUS[order.status] || CART_ORDER_STATUS.new;
  const pct = Math.round((st.step / 4) * 100);
  return (
    <a href={`/order/${order.id}`}
      className="mb-3 block rounded-2xl bg-brand-800/10 p-3 ring-1 ring-brand-800/15 backdrop-blur-md transition hover:bg-brand-800/15 dark:bg-brand-500/10 dark:ring-white/10">
      <div className="flex items-center gap-2">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-800 text-cream"><Truck className="h-4 w-4" /></span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-[13px] font-black text-brand-800 dark:text-brand-300">{st.label}</p>
          <p className="text-[10px] text-ink/50 dark:text-cream/50">طلب #{order.order_no} · تتبّع الآن</p>
        </div>
        <ChevronLeft className="h-4 w-4 shrink-0 text-brand-800/60 dark:text-brand-300/60" />
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-brand-800/15 dark:bg-white/10">
        <div className="h-full rounded-full bg-brand-700 transition-all dark:bg-brand-400" style={{ width: `${pct}%` }} />
      </div>
    </a>
  );
}

// a cart line with a reliable +/- stepper and a SAFE native-touch swipe
// (swipe right = +1 with a celebratory cue, swipe left = -1). No framer-motion
// drag here on purpose — it left a stuck touch-state that froze the page on mobile.
function CartRow({ it, onInc, onDec, onRemove }) {
  const [dx, setDx] = useState(0);          // live swipe offset
  const [flash, setFlash] = useState(null); // 'inc' | 'dec' brief feedback
  const start = useRef(null);
  const THRESH = 55;

  function onTouchStart(e) { start.current = e.touches[0].clientX; }
  function onTouchMove(e) {
    if (start.current == null) return;
    const delta = e.touches[0].clientX - start.current;
    // a little resistance so it feels elastic
    setDx(Math.max(-100, Math.min(100, delta * 0.7)));
  }
  function onTouchEnd() {
    if (dx >= THRESH) { onInc(it.key); ping('inc'); }
    else if (dx <= -THRESH) { onDec(it.key); ping('dec'); }
    setDx(0);
    start.current = null;
  }
  function ping(kind) { setFlash(kind); setTimeout(() => setFlash(null), 450); }

  const showInc = dx > 12;   // swiping right reveals the green "add" hint
  const showDec = dx < -12;  // swiping left reveals the amber "less" hint

  return (
    <div className="relative mb-3 select-none overflow-hidden rounded-2xl">
      {/* swipe hints behind the row */}
      <div className="absolute inset-0 flex items-center justify-between rounded-2xl px-5">
        <span className={`flex items-center gap-1 font-display text-sm font-black text-green-600 transition-opacity ${showInc ? 'opacity-100' : 'opacity-0'}`}><Plus className="h-5 w-5" /> زيادة</span>
        <span className={`flex items-center gap-1 font-display text-sm font-black text-amber-600 transition-opacity ${showDec ? 'opacity-100' : 'opacity-0'}`}>إنقاص <Minus className="h-5 w-5" /></span>
      </div>

      <div
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onTouchCancel={() => { setDx(0); start.current = null; }}
        style={{ transform: `translateX(${dx}px)`, transition: start.current == null ? 'transform .2s ease' : 'none' }}
        className={`relative flex items-center gap-3 rounded-2xl bg-white/45 p-3 ring-1 backdrop-blur-sm dark:bg-white/[0.08] dark:ring-white/10 ${flash === 'inc' ? 'ring-2 ring-green-400' : flash === 'dec' ? 'ring-2 ring-amber-400' : 'ring-white/40'}`}
      >
        <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-xl bg-white/80 text-2xl ring-1 ring-white/50">
          <CartThumb image={it.image} emoji={it.emoji} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate font-display text-[15px] font-bold text-ink dark:text-cream">{it.name}</div>
          <div className="font-display text-sm font-black text-brand-800 dark:text-brand-400">{fmt(it.price * it.qty)} د.ع</div>
        </div>
        {/* stepper */}
        <div className="flex shrink-0 items-center gap-1 rounded-full bg-white/70 p-1 ring-1 ring-white/60 dark:bg-night-900/60 dark:ring-white/10">
          {it.qty <= 1 ? (
            <button onClick={() => onRemove(it.key)} aria-label="حذف"
              className="grid h-7 w-7 place-items-center rounded-full bg-red-500/10 text-red-500 transition hover:bg-red-500/20 active:scale-90">
              <Trash2 className="h-4 w-4" />
            </button>
          ) : (
            <button onClick={() => onDec(it.key)} aria-label="إنقاص"
              className="grid h-7 w-7 place-items-center rounded-full bg-ink/5 text-ink/70 transition hover:bg-ink/10 active:scale-90 dark:bg-white/10 dark:text-cream/70">
              <Minus className="h-4 w-4" />
            </button>
          )}
          <span className={`min-w-6 text-center font-display text-sm font-black text-ink transition-transform dark:text-cream ${flash === 'inc' ? 'scale-150 text-green-600' : ''}`}>{it.qty}</span>
          <button onClick={() => { onInc(it.key); ping('inc'); }} aria-label="زيادة"
            className="grid h-7 w-7 place-items-center rounded-full bg-copper text-cream transition hover:bg-copper-dark active:scale-90">
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CartDrawer({ open, onClose, items, total, onRefer, onCheckout, onInc, onDec, onRemove, lastOrder }) {
  const storeCount = Math.max(1, new Set((items || []).map((it) => it.storeId).filter(Boolean)).size || 1);
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[70]">
          {/* light, slightly-blurred scrim so the page shows through the glass */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-ink/10 backdrop-blur-[1px] dark:bg-black/35"
          />

          {/* RTL end = left edge — Apple-style frosted glass panel */}
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 260, damping: 30 }}
            className="absolute inset-y-0 left-0 flex w-[88%] max-w-md flex-col border-l border-white/30 bg-cream/15 shadow-card ring-1 ring-inset ring-white/20 backdrop-blur-xl backdrop-saturate-150 dark:border-white/10 dark:bg-night-900/20 dark:ring-white/10"
          >
            {/* subtle top sheen for the liquid-glass feel */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/20 to-transparent dark:from-white/[0.06]" />

            <div className="relative flex items-center justify-between border-b border-white/30 px-5 py-4 dark:border-white/10">
              <h3 className="font-display text-xl font-extrabold text-ink dark:text-cream">سلة التسوّق</h3>
              <button
                onClick={onClose}
                className="grid h-9 w-9 place-items-center rounded-full bg-white/50 text-ink ring-1 ring-white/50 backdrop-blur-md hover:bg-white/70 dark:bg-white/10 dark:text-cream dark:ring-white/10 dark:hover:bg-white/20"
                aria-label="إغلاق"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="relative flex-1 overflow-y-auto px-5 py-4">
              <MiniOrderTracker order={lastOrder} />
              {items.length === 0 ? (
                <div className="grid h-full place-items-center text-center">
                  <div>
                    <div className="mx-auto mb-3 grid h-16 w-16 place-items-center rounded-full bg-white/50 text-brand-700 ring-1 ring-white/50 backdrop-blur-md dark:bg-white/10 dark:text-brand-400 dark:ring-white/10">
                      <ShoppingCart className="h-7 w-7" />
                    </div>
                    <p className="font-body text-ink/70 dark:text-cream/60">سلتك فارغة — ابدأ بإضافة طازج اليوم</p>
                  </div>
                </div>
              ) : (
                <>
                  {items.map((it) => (
                    <CartRow key={it.key} it={it} onInc={onInc} onDec={onDec} onRemove={onRemove} />
                  ))}
                  <p className="mt-1 text-center font-body text-[11px] text-ink/40 dark:text-cream/40">اسحب المنتج يميناً للزيادة · يساراً للإنقاص 👆</p>
                </>
              )}
            </div>

            <div className="relative border-t border-white/30 bg-white/15 px-5 py-4 backdrop-blur-md dark:border-white/10 dark:bg-white/[0.04]">
              <button
                onClick={onRefer}
                className="mb-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-800/15 py-2.5 font-body text-sm font-bold text-brand-800 ring-1 ring-white/40 backdrop-blur-md hover:bg-brand-800/25 dark:bg-brand-500/15 dark:text-brand-300 dark:ring-white/10 dark:hover:bg-brand-500/25"
              >
                <Gift className="h-4 w-4" /> اربح 5,000 د.ع — شارك الرابط
              </button>
              {items.length > 0 && <FreeDeliveryBar total={total} storeCount={storeCount} />}
              <div className="mb-3 flex items-center justify-between font-display">
                <span className="text-ink/70 dark:text-cream/70">المجموع</span>
                <span className="text-2xl font-black text-brand-800 dark:text-brand-400">
                  {fmt(total)} <span className="text-sm">د.ع</span>
                </span>
              </div>
              <button
                disabled={items.length === 0}
                onClick={onCheckout}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-copper py-4 font-display text-lg font-bold text-cream shadow-seal transition hover:bg-copper-dark active:scale-[.99] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <MessageCircle className="h-5 w-5" /> إتمام الطلب
              </button>
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
