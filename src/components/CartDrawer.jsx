import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingCart, Gift } from 'lucide-react';
import { fmt } from '../data/catalog.js';

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
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-brand-950/60"
          />

          {/* RTL end = left edge */}
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 260, damping: 30 }}
            className="absolute inset-y-0 left-0 flex w-[88%] max-w-md flex-col bg-cream shadow-card"
          >
            <div className="flex items-center justify-between border-b border-brand-900/10 px-5 py-4">
              <h3 className="font-display text-xl font-extrabold text-ink">سلة التسوّق</h3>
              <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full bg-beige text-ink" aria-label="إغلاق">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              {items.length === 0 ? (
                <div className="grid h-full place-items-center text-center">
                  <div>
                    <div className="mx-auto mb-3 grid h-16 w-16 place-items-center rounded-full bg-beige text-brand-700">
                      <ShoppingCart className="h-7 w-7" />
                    </div>
                    <p className="font-body text-ink/60">سلتك فارغة — ابدأ بإضافة طازج اليوم</p>
                  </div>
                </div>
              ) : (
                items.map((it) => (
                  <div key={it.key} className="mb-3 flex items-center gap-3 rounded-2xl bg-white p-3 ring-1 ring-brand-900/5">
                    <div className="grid h-12 w-12 place-items-center rounded-xl bg-beige text-2xl">{it.emoji}</div>
                    <div className="flex-1">
                      <div className="font-display text-[15px] font-bold text-ink">{it.name}</div>
                      <div className="font-body text-xs text-ink/50">×{it.qty}</div>
                    </div>
                    <div className="font-display font-black text-brand-800">{fmt(it.price * it.qty)} د.ع</div>
                  </div>
                ))
              )}
            </div>

            <div className="border-t border-brand-900/10 bg-white px-5 py-4">
              <button
                onClick={onRefer}
                className="mb-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-800/10 py-2.5 font-body text-sm font-bold text-brand-800 hover:bg-brand-800/15"
              >
                <Gift className="h-4 w-4" /> اربح 5,000 د.ع — شارك الرابط
              </button>
              <div className="mb-3 flex items-center justify-between font-display">
                <span className="text-ink/60">المجموع</span>
                <span className="text-2xl font-black text-brand-800">
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
