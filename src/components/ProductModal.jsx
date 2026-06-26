import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Minus, ShoppingCart, Sparkles } from 'lucide-react';
import { fmt } from '../data/catalog.js';

/*
  ProductModal — tap a product to see a rich, animated detail sheet.
  Closes on backdrop tap, the X, Escape, or the phone's back button
  (we push one history entry on open and pop it on close).
*/
export default function ProductModal({ product, onClose, onAdd }) {
  const open = !!product;
  const [qty, setQty] = useState(1);
  const [imgOk, setImgOk] = useState(true);

  useEffect(() => {
    if (open) { setQty(1); setImgOk(true); }
  }, [open, product?.id]);

  // back-button / history handling — every close path goes through history.back()
  useEffect(() => {
    if (!open) return;
    window.history.pushState({ pdModal: true }, '');
    const onPop = () => onClose?.();
    const onKey = (e) => { if (e.key === 'Escape') goBack(); };
    window.addEventListener('popstate', onPop);
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('popstate', onPop);
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
    // eslint-disable-next-line
  }, [open]);

  function goBack() {
    if (window.history.state && window.history.state.pdModal) window.history.back();
    else onClose?.();
  }

  function add() {
    for (let i = 0; i < qty; i++) onAdd?.(product);
    goBack();
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={goBack}
          className="fixed inset-0 z-[95] flex items-end justify-center bg-ink/50 backdrop-blur-sm sm:items-center"
          dir="rtl"
        >
          <motion.div
            initial={{ y: '100%', opacity: 0.6, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="relative max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-[2rem] bg-cream pb-28 shadow-card dark:bg-night-800 sm:rounded-[2rem]"
          >
            {/* grab handle (mobile) */}
            <div className="sticky top-0 z-10 flex justify-center bg-gradient-to-b from-cream to-transparent pt-3 dark:from-night-800 sm:hidden">
              <span className="h-1.5 w-12 rounded-full bg-ink/15 dark:bg-white/15" />
            </div>

            <button
              onClick={goBack}
              aria-label="إغلاق"
              className="absolute left-4 top-4 z-20 grid h-9 w-9 place-items-center rounded-full bg-ink/10 text-ink backdrop-blur hover:bg-ink/20 dark:bg-white/10 dark:text-cream"
            >
              <X className="h-5 w-5" />
            </button>

            {/* hero image */}
            <div className="relative grid place-items-center px-6 pt-4">
              {product.badge && (
                <span className="absolute right-6 top-4 z-10 rounded-full bg-brand-800 px-3 py-1 font-body text-xs font-bold text-cream dark:bg-brand-600">
                  {product.badge}
                </span>
              )}
              <div
                className="grid h-52 w-52 place-items-center overflow-hidden rounded-full text-8xl"
                style={{
                  background: 'radial-gradient(70% 70% at 35% 30%, #ffffff 0%, #ffffff 62%, #ece5d8 100%)',
                  boxShadow: `inset 0 -14px 32px -16px ${product.tint || '#9A5318'}55, 0 22px 44px -22px ${product.tint || '#9A5318'}66`,
                }}
              >
                {product.image && imgOk ? (
                  <img
                    src={product.image}
                    alt={product.name}
                    onError={() => setImgOk(false)}
                    className="h-full w-full object-contain p-3 mix-blend-multiply"
                  />
                ) : (
                  <span style={{ filter: 'drop-shadow(0 8px 10px rgba(0,0,0,.18))' }}>{product.emoji}</span>
                )}
              </div>
            </div>

            {/* info */}
            <div className="px-6 pt-5">
              <span className="font-body text-xs font-bold text-copper dark:text-copper-light">{product.tag}</span>
              <h2 className="mt-1 font-display text-2xl font-black leading-tight text-ink dark:text-cream">{product.name}</h2>

              <div className="mt-3 flex items-baseline gap-1">
                <span className="font-display text-3xl font-black text-brand-800 dark:text-brand-400">{fmt(product.price)}</span>
                <span className="font-body text-sm font-bold text-ink/45 dark:text-cream/45">د.ع / {product.unit}</span>
              </div>

              {/* description (selling copy) */}
              <div className="mt-5">
                <div className="mb-1.5 font-display text-base font-extrabold text-ink dark:text-cream">الوصف</div>
                {product.description ? (
                  <p className="font-body text-[15px] leading-loose text-ink/75 dark:text-cream/75">{product.description}</p>
                ) : (
                  <p className="font-body text-sm leading-relaxed text-ink/45 dark:text-cream/45">منتج طازج ومختار بعناية من «اطلبها». أضِفه لسلتك واطلبه الآن.</p>
                )}
              </div>
            </div>

            {/* sticky action bar */}
            <div className="absolute inset-x-0 bottom-0 flex items-center gap-3 border-t border-ink/10 bg-cream/95 p-4 backdrop-blur dark:border-white/10 dark:bg-night-800/95">
              <div className="flex items-center gap-1 rounded-2xl bg-ink/5 p-1 dark:bg-white/10">
                <button onClick={() => setQty((q) => q + 1)} className="grid h-9 w-9 place-items-center rounded-xl bg-copper text-cream hover:bg-copper-dark" aria-label="زيادة">
                  <Plus className="h-4 w-4" />
                </button>
                <span className="w-8 text-center font-display text-lg font-black text-ink dark:text-cream">{qty}</span>
                <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="grid h-9 w-9 place-items-center rounded-xl bg-ink/10 text-ink hover:bg-ink/20 dark:bg-white/10 dark:text-cream" aria-label="إنقاص">
                  <Minus className="h-4 w-4" />
                </button>
              </div>
              <button
                onClick={add}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-copper py-3.5 font-display text-lg font-bold text-cream shadow-seal transition hover:bg-copper-dark active:scale-[0.98]"
              >
                <ShoppingCart className="h-5 w-5" /> أضف للسلة · {fmt(product.price * qty)} د.ع
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
