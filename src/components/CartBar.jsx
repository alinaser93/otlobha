import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, ChevronLeft } from 'lucide-react';

const fmt = (n) => Number(n || 0).toLocaleString('en-US');

/* شريط سلّة عائم ثابت بالأسفل — يظهر فقط لمّا تكون السلّة فيها منتجات.
   يحمل: عدد المنتجات + المجموع + شريط تقدّم «أضف X ليصير التوصيل مجاني».
   هذا أقوى محفّز شراء (الزبون يشوف سلّته دائماً ويزيد ليوصل للمجاني). */
export default function CartBar({ count = 0, total = 0, freeOver = 0, onOpen }) {
  const remaining = freeOver > 0 ? Math.max(0, freeOver - total) : 0;
  const reached = freeOver > 0 && total >= freeOver;
  const pct = freeOver > 0 ? Math.min(100, Math.round((total / freeOver) * 100)) : 0;

  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.div
          initial={{ y: 90, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 90, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 380, damping: 32 }}
          className="fixed bottom-5 left-1/2 z-[55] w-[calc(100%-1.5rem)] max-w-md -translate-x-1/2"
        >
          <button
            onClick={onOpen}
            className="w-full overflow-hidden rounded-2xl bg-brand-800 text-cream shadow-seal ring-1 ring-black/10 transition active:scale-[0.99] dark:bg-brand-900 dark:ring-white/10"
          >
            {freeOver > 0 && (
              <div className="px-4 pt-2.5">
                <div className="flex items-center justify-between font-body text-[11px] font-bold">
                  <span className="flex items-center gap-1">
                    {reached ? '🎉 توصيلك مجاني!' : <>أضِف <b className="text-copper-light">{fmt(remaining)} د.ع</b> ليصير توصيلك مجاني</>}
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-cream/20">
                  <div className="h-full rounded-full bg-copper transition-all duration-500" style={{ width: `${reached ? 100 : pct}%` }} />
                </div>
              </div>
            )}
            <div className="flex items-center justify-between px-4 py-3">
              <span className="flex items-center gap-2.5">
                <span className="relative grid h-9 w-9 place-items-center rounded-xl bg-cream/15">
                  <ShoppingCart className="h-5 w-5" />
                  <span className="absolute -right-1.5 -top-1.5 grid h-5 min-w-[20px] place-items-center rounded-full bg-copper px-1 font-body text-[11px] font-black">
                    {count}
                  </span>
                </span>
                <span className="text-right leading-tight">
                  <span className="block font-display text-base font-black">{fmt(total)} د.ع</span>
                  <span className="block font-body text-[11px] text-cream/70">{count} منتج بالسلّة</span>
                </span>
              </span>
              <span className="flex items-center gap-0.5 font-display text-sm font-black">
                عرض السلّة <ChevronLeft className="h-5 w-5" />
              </span>
            </div>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
