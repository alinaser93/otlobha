import ShareButton from './ShareButton.jsx';
import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Star, X, Sparkles, Check } from 'lucide-react';
import { BUNDLES, fmt } from '../data/catalog.js';
import { fadeUp, viewportOnce } from '../lib/motion.js';

// seasonal tag → emoji
const SEASON_EMOJI = { 'رمضان': '🌙', 'عيد': '🎉', 'الصيف': '☀️', 'الشتاء': '❄️', 'العودة للمدارس': '🎒', 'عاشوراء': '🖤' };
function seasonEmoji(s) { return SEASON_EMOJI[s] || '✨'; }

// one ingredient bubble: real product image, emoji fallback
function BundleOrb({ image, emoji }) {
  const [ok, setOk] = useState(true);
  if (image && ok) {
    return <img src={image} alt="" loading="lazy" onError={() => setOk(false)} className="h-full w-full object-contain p-1 mix-blend-multiply" />;
  }
  return <span>{emoji}</span>;
}

function BundleCard({ b, onAdd, fly, onOpen, topSeller }) {
  const plateRef = useRef(null);
  const save = b.old ? b.old - b.price : 0;

  return (
    <motion.article
      whileHover={{ y: -6, scale: 1.04 }}
      whileTap={{ scale: 1.03 }}
      transition={{ type: 'spring', stiffness: 320, damping: 22 }}
      onClick={() => onOpen?.(b)}
      className="group relative flex w-[74vw] max-w-[300px] shrink-0 cursor-pointer snap-center flex-col overflow-hidden rounded-[28px] bg-cream shadow-card ring-1 ring-brand-900/5 hover:z-20 focus-within:z-20 active:z-20 dark:bg-night-800 dark:ring-white/10 md:w-auto md:max-w-none"
    >
      {/* badges over the plate */}
      <div className="pointer-events-none absolute right-3 top-3 z-20 flex flex-col items-end gap-1.5">
        {topSeller && (
          <span className="rounded-full bg-copper px-2.5 py-1 font-display text-[11px] font-bold text-cream shadow">🔥 الأكثر مبيعاً</span>
        )}
        {b.season && (
          <span className="rounded-full bg-cream/90 px-2.5 py-1 font-display text-[11px] font-bold text-ink shadow dark:bg-night-900/90 dark:text-cream">{seasonEmoji(b.season)} {b.season}</span>
        )}
      </div>

      <div className="relative overflow-hidden px-6 pb-5 pt-7" style={{ background: `linear-gradient(150deg, ${b.accent} 0%, #06271B 130%)` }}>
        <span className="pointer-events-none absolute -inset-y-4 -right-1/3 w-1/3 -skew-x-12 bg-white/10 blur-md transition-transform duration-700 group-hover:translate-x-[-260%]" />
        <div className="relative flex items-center justify-between">
          <span className="rounded-full bg-cream/15 px-3 py-1 font-body text-xs text-cream/90 backdrop-blur">{b.kicker}</span>
          {save > 0 && <span className="rounded-full bg-copper px-3 py-1 font-display text-xs font-bold text-cream shadow">وفّر {fmt(save)} د.ع</span>}
        </div>
        <div ref={plateRef} className="relative mx-auto mt-4 flex h-36 items-end justify-center">
          {b.emojis.map((e, i) => {
            const mid = (b.emojis.length - 1) / 2;
            const off = i - mid;
            return (
              <div key={i}
                className="grid h-20 w-20 place-items-center overflow-hidden rounded-full bg-cream text-3xl shadow-soft transition-transform duration-300 group-hover:-translate-y-1"
                style={{ marginInline: '-12px', transform: `translateY(${Math.abs(off) * 10}px)`, zIndex: 10 - Math.abs(off), filter: 'drop-shadow(0 8px 10px rgba(0,0,0,.18))' }}>
                <BundleOrb image={b.images?.[i]} emoji={e} />
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-6">
        <h3 className="font-display text-2xl font-extrabold text-ink dark:text-cream">{b.name}</h3>
        <p className="mt-2 line-clamp-2 font-body text-sm leading-relaxed text-ink/60 dark:text-cream/60">{b.desc}</p>

        <div className="mt-4 flex flex-wrap gap-1.5">
          {b.items.slice(0, 4).map((it, i) => (
            <span key={i} className="rounded-full bg-beige px-2.5 py-1 font-body text-xs text-brand-800 dark:bg-white/10 dark:text-brand-300">{it}</span>
          ))}
          {b.items.length > 4 && <span className="rounded-full bg-beige px-2.5 py-1 font-body text-xs font-bold text-copper dark:bg-white/10 dark:text-copper-light">+{b.items.length - 4}</span>}
        </div>

        <div className="mt-6 flex items-end justify-between">
          <div>
            {b.old && <div className="font-body text-sm text-ink/40 line-through dark:text-cream/40">{fmt(b.old)} د.ع</div>}
            <div className="font-display text-3xl font-black text-brand-800 dark:text-brand-400">{fmt(b.price)} <span className="text-base font-bold text-ink/50 dark:text-cream/50">د.ع</span></div>
          </div>
          <span className="rounded-full bg-brand-800/10 px-2.5 py-1 text-[11px] font-bold text-brand-700 dark:bg-white/10 dark:text-brand-300">التفاصيل ←</span>
        </div>

        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={(e) => { e.stopPropagation(); fly(plateRef.current?.children[Math.floor(b.emojis.length / 2)]); onAdd(b); }}
          className="mt-5 inline-flex items-center justify-center gap-2 rounded-2xl bg-copper py-3.5 font-display text-lg font-bold text-cream shadow-seal hover:bg-copper-dark"
        >
          <Plus className="h-5 w-5" /> أضف الباقة للسلة
        </motion.button>
      </div>
    </motion.article>
  );
}

// full-details modal (also used by the merchant "معاينة")
export function BundleDetailModal({ b, onAdd, onClose }) {
  if (!b) return null;
  const save = b.old ? b.old - b.price : 0;
  const discPct = b.old && b.old > 0 ? Math.round((save / b.old) * 100) : 0;
  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0, backdropFilter: 'blur(0px)' }} animate={{ opacity: 1, backdropFilter: 'blur(6px)' }} exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
        transition={{ duration: 0.28 }}
        className="fixed inset-0 z-[120] flex items-end justify-center bg-black/60 sm:items-center" onClick={onClose}>
        <motion.div initial={{ y: '55%', opacity: 0, scale: 0.92 }} animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: '100%', opacity: 0, scale: 0.96, transition: { duration: 0.25, ease: [0.4, 0, 1, 1] } }}
          transition={{ type: 'spring', damping: 26, stiffness: 340, mass: 0.9 }}
          className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-cream dark:bg-night-800 sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
          {/* hero */}
          <div className="relative overflow-hidden px-6 pb-6 pt-6" style={{ background: `linear-gradient(150deg, ${b.accent} 0%, #06271B 130%)` }}>
            <button onClick={onClose} className="absolute left-4 top-4 z-10 grid h-9 w-9 place-items-center rounded-full bg-black/20 text-cream backdrop-blur hover:bg-black/30"><X className="h-5 w-5" /></button>
            <div className="absolute right-4 top-4 z-10">
              <ShareButton variant="icon" path={`/b/${b.id}`} title={`${b.name} · اطلبها`}
                text={`${b.name} — باقة جاهزة بسعر موفّر في اطلبها 🛒`}
                className="grid h-9 w-9 place-items-center rounded-full bg-black/20 text-cream backdrop-blur transition hover:bg-black/30" />
            </div>
            <div className="flex flex-wrap items-center justify-center gap-1.5">
              {b.season && <span className="rounded-full bg-cream/90 px-3 py-1 font-display text-xs font-bold text-ink dark:bg-night-900/90 dark:text-cream">{seasonEmoji(b.season)} {b.season}</span>}
              {save > 0 && <span className="rounded-full bg-copper px-3 py-1 font-display text-xs font-bold text-cream shadow">وفّر {fmt(save)} د.ع ({discPct}%)</span>}
            </div>
            <motion.div initial={{ scale: 0.6, opacity: 0, y: 14 }} animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ type: 'spring', damping: 15, stiffness: 220, delay: 0.12 }}
              className="mx-auto mt-4 flex h-28 items-end justify-center">
              {b.emojis.map((e, i) => {
                const mid = (b.emojis.length - 1) / 2; const off = i - mid;
                return (
                  <div key={i} className="grid h-16 w-16 place-items-center overflow-hidden rounded-full bg-cream text-2xl shadow-soft"
                    style={{ marginInline: '-8px', transform: `translateY(${Math.abs(off) * 8}px)`, zIndex: 10 - Math.abs(off) }}>
                    <BundleOrb image={b.images?.[i]} emoji={e} />
                  </div>
                );
              })}
            </motion.div>
          </div>

          {/* body */}
          <div className="p-5">
            <h3 className="font-display text-2xl font-black text-ink dark:text-cream">{b.name}</h3>
            {b.kicker && <p className="mt-0.5 font-body text-sm font-bold text-copper dark:text-copper-light">{b.kicker}</p>}
            {b.desc && <p className="mt-2 font-body text-sm leading-relaxed text-ink/65 dark:text-cream/65">{b.desc}</p>}

            {/* ingredients list */}
            <div className="mt-4">
              <p className="mb-2 font-display text-sm font-black text-ink dark:text-cream">المكوّنات ({b.items.length})</p>
              <div className="space-y-1.5">
                {b.items.map((it, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-xl bg-beige/60 p-2 dark:bg-night-900/60">
                    <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-lg bg-white text-xl ring-1 ring-ink/10 dark:ring-white/10">
                      <BundleOrb image={b.images?.[i]} emoji={b.emojis?.[i]} />
                    </span>
                    <span className="flex items-center gap-1.5 font-body text-sm text-ink/80 dark:text-cream/80">
                      <Check className="h-4 w-4 text-green-600 dark:text-green-400" /> {it}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* price + add */}
            <div className="mt-5 flex items-end justify-between">
              <div>
                {b.old && <div className="font-body text-sm text-ink/40 line-through dark:text-cream/40">{fmt(b.old)} د.ع</div>}
                <div className="font-display text-3xl font-black text-brand-800 dark:text-brand-400">{fmt(b.price)} <span className="text-base font-bold text-ink/50 dark:text-cream/50">د.ع</span></div>
              </div>
              <div className="flex items-center gap-0.5 text-gold">
                {Array.from({ length: 5 }).map((_, i) => <Star key={i} className="h-4 w-4" fill="currentColor" />)}
              </div>
            </div>

            {onAdd && (
              <motion.button whileTap={{ scale: 0.98 }} onClick={() => { onAdd(b); onClose(); }}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-copper py-3.5 font-display text-lg font-bold text-cream shadow-seal hover:bg-copper-dark">
                <Plus className="h-5 w-5" /> أضف الباقة للسلة
              </motion.button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default function BundleSection({ bundles = BUNDLES, onAdd, fly, title, subtitle, kicker }) {
  const [openBundle, setOpenBundle] = useState(null);
  if (!bundles || bundles.length === 0) return null;
  return (
    <section id="bundles" className="relative bg-beige py-16 dark:bg-night-900 sm:py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={viewportOnce} className="mb-10 text-center sm:mb-14">
          <span className="font-body text-sm font-bold tracking-widest text-copper dark:text-copper-light">{kicker || 'وفّر أكثر · اطبخ أطيب'}</span>
          <h2 className="mt-2 font-display text-4xl font-black text-ink dark:text-cream sm:text-5xl">{title || 'باقات ذكية'}</h2>
          <p className="mx-auto mt-3 max-w-xl font-body text-ink/60 dark:text-cream/60">{subtitle || 'مكوّنات وصفة كاملة في سلة واحدة — مختارة بعناية، وبسعر أوفر من شرائها مفردة.'}</p>
        </motion.div>

        <div className="-mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto overflow-y-hidden px-5 py-4 no-scrollbar md:mx-auto md:max-w-6xl md:grid md:grid-cols-3 md:gap-4 md:overflow-visible md:px-0 md:py-0">
          {bundles.map((b, i) => (
            <motion.div key={b.id} variants={fadeUp} custom={i} initial="hidden" whileInView="show" viewport={viewportOnce} className="flex">
              <BundleCard b={b} onAdd={onAdd} fly={fly} onOpen={setOpenBundle} topSeller={i === 0 && (b.sold || 0) > 0} />
            </motion.div>
          ))}
        </div>
        <p className="mt-3 text-center font-body text-xs text-ink/40 dark:text-cream/40 md:hidden">اسحب لرؤية باقات أكثر ←</p>
      </div>

      {openBundle && <BundleDetailModal b={openBundle} onAdd={onAdd} onClose={() => setOpenBundle(null)} />}
    </section>
  );
}
