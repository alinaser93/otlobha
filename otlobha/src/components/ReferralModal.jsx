import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, Copy, Check, X, Wallet } from 'lucide-react';

const LINK = 'otlobha.iq/r/AHMED-5K';

export default function ReferralModal({ open, onClose }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (open) {
      setCopied(false);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const copy = () => {
    try {
      navigator.clipboard.writeText('https://' + LINK);
    } catch (e) {
      /* clipboard unavailable */
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[80] grid place-items-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-brand-950/70 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', stiffness: 260, damping: 22 }}
            className="relative w-full max-w-md overflow-hidden rounded-[30px] bg-cream shadow-card"
          >
            {/* emerald cap */}
            <div className="relative overflow-hidden bg-gradient-to-br from-brand-800 to-brand-950 px-7 pb-12 pt-9 text-center">
              <button
                onClick={onClose}
                className="absolute left-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-cream/15 text-cream hover:bg-cream/25"
                aria-label="إغلاق"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="mx-auto grid h-20 w-20 animate-floaty place-items-center rounded-3xl bg-copper text-cream shadow-seal">
                <Gift className="h-10 w-10" />
              </div>
              <h3 className="mt-5 font-display text-3xl font-black text-cream">شارك… وتربح أنت وعائلتك</h3>
            </div>

            <div className="-mt-6 rounded-t-[30px] bg-cream px-7 pb-8 pt-6 text-center">
              <p className="font-body text-lg leading-relaxed text-ink/80">
                شارك الرابط مع عائلتك — يحصلون على خصم <b className="text-copper">10%</b> على أول طلب،
                وتحصل أنت على <b className="text-copper">5,000 دينار</b> رصيداً في محفظتك!
              </p>

              <div className="mt-6 flex items-center gap-2 rounded-2xl border border-dashed border-brand-800/30 bg-white p-2 pr-4">
                <span dir="ltr" className="flex-1 truncate text-right font-body text-sm text-ink/70">
                  https://{LINK}
                </span>
                <button
                  onClick={copy}
                  className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 font-display text-sm font-bold text-cream transition ${
                    copied ? 'bg-brand-700' : 'bg-copper hover:bg-copper-dark'
                  }`}
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4" /> تم النسخ
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" /> نسخ الرابط
                    </>
                  )}
                </button>
              </div>

              <div className="mt-5 flex items-center justify-center gap-2 font-body text-xs text-ink/50">
                <Wallet className="h-4 w-4 text-brand-700" /> الرصيد يُضاف تلقائياً عند أول طلب لصديقك
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
