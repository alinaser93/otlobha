import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingCart, Gift } from 'lucide-react';
import { fmt } from '../data/catalog.js';

// cart line thumbnail: real product image (white bg melts via multiply), emoji fallback.
// the tile stays light in both themes so the product is always visible.
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

export default function CartDrawer({ open, onClose, items, total, onRefer }) {
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
            className="absolute inset-y-0 left-0 flex w-[88%] max-w-md flex-col border-l border-white/30 bg-cream/25 shadow-card ring-1 ring-inset ring-white/20 backdrop-blur-md backdrop-saturate-150 dark:border-white/10 dark:bg-night-900/30 dark:ring-white/10"
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
                items.map((it) => (
                  <div
                    key={it.key}
                    className="mb-3 flex items-center gap-3 rounded-2xl bg-white/30 p-3 ring-1 ring-white/40 backdrop-blur-sm dark:bg-white/[0.06] dark:ring-white/10"
                  >
                    <div className="grid h-12 w-12 place-items-center overflow-hidden rounded-xl bg-white/80 text-2xl ring-1 ring-white/50">
                      <CartThumb image={it.image} emoji={it.emoji} />
                    </div>
                    <div className="flex-1">
                      <div className="font-display text-[15px] font-bold text-ink dark:text-cream">{it.name}</div>
                      <div className="font-body text-xs text-ink/50 dark:text-cream/50">×{it.qty}</div>
                    </div>
                    <div className="font-display font-black text-brand-800 dark:text-brand-400">{fmt(it.price * it.qty)} د.ع</div>
                  </div>
                ))
              )}
            </div>

            <div className="relative border-t border-white/30 bg-white/15 px-5 py-4 backdrop-blur-md dark:border-white/10 dark:bg-white/[0.04]">
              <button
                onClick={onRefer}
                className="mb-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-800/15 py-2.5 font-body text-sm font-bold text-brand-800 ring-1 ring-white/40 backdrop-blur-md hover:bg-brand-800/25 dark:bg-brand-500/15 dark:text-brand-300 dark:ring-white/10 dark:hover:bg-brand-500/25"
              >
                <Gift className="h-4 w-4" /> اربح 5,000 د.ع — شارك الرابط
              </button>
              <div className="mb-3 flex items-center justify-between font-display">
                <span className="text-ink/70 dark:text-cream/70">المجموع</span>
                <span className="text-2xl font-black text-brand-800 dark:text-brand-400">
                  {fmt(total)} <span className="text-sm">د.ع</span>
                </span>
              </div>
              <button className="w-full rounded-2xl bg-copper py-4 font-display text-lg font-bold text-cream shadow-seal transition hover:bg-copper-dark active:scale-[.99]">
                إتمام الطلب
              </button>
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
