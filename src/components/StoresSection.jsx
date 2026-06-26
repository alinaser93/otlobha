import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Star, Heart, Store as StoreIcon, Check } from 'lucide-react';
import { fadeUp, viewportOnce } from '../lib/motion.js';

const CAT_EMOJI = {
  بقالة: '🛒', مخبز: '🥖', مطعم: '🍽️', خضار: '🥬',
  فواكه: '🍎', حلويات: '🍰', لحوم: '🥩', مشروبات: '🥤', ألبان: '🧀',
};
const emojiFor = (c) => CAT_EMOJI[c] || '🏪';

function useFollows() {
  const [ids, setIds] = useState(() => {
    try { return JSON.parse(localStorage.getItem('otlobha-follows') || '[]'); } catch { return []; }
  });
  const toggle = (id) => {
    setIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      try { localStorage.setItem('otlobha-follows', JSON.stringify(next)); } catch {}
      return next;
    });
  };
  return [ids, toggle];
}

function Stars({ value = 0 }) {
  const full = Math.round(value);
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={`h-3.5 w-3.5 ${i <= full ? 'fill-amber-400 text-amber-400' : 'text-ink/20 dark:text-cream/20'}`} />
      ))}
    </span>
  );
}

export default function StoresSection({ stores = [], activeStore = null, onSelect }) {
  const [follows, toggleFollow] = useFollows();
  if (!stores.length) return null;

  return (
    <section id="stores" className="bg-beige/40 py-14 dark:bg-night-900/40 sm:py-20">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={viewportOnce}
          className="flex items-end justify-between gap-4">
          <div>
            <span className="font-body text-sm font-bold tracking-widest text-copper dark:text-copper-light">سوق السماوة</span>
            <h2 className="mt-2 font-display text-3xl font-black text-ink dark:text-cream sm:text-4xl">تسوّق من متاجرك المفضّلة</h2>
          </div>
          {activeStore && (
            <button onClick={() => onSelect?.(null)}
              className="shrink-0 rounded-full bg-cream px-4 py-2 font-body text-sm font-bold text-ink/70 ring-1 ring-brand-900/10 hover:bg-white dark:bg-white/10 dark:text-cream/70 dark:ring-white/10">
              كل المتاجر
            </button>
          )}
        </motion.div>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stores.map((s, i) => {
            const active = activeStore === s.id;
            const followed = follows.includes(s.id);
            return (
              <motion.button
                key={s.id}
                variants={fadeUp}
                custom={i % 3}
                initial="hidden"
                whileInView="show"
                viewport={viewportOnce}
                whileHover={{ y: -4 }}
                onClick={() => onSelect?.(active ? null : s.id)}
                className={`group relative flex items-center gap-4 overflow-hidden rounded-3xl p-4 text-right ring-1 transition ${
                  active
                    ? 'bg-brand-50 ring-2 ring-copper dark:bg-night-700'
                    : 'bg-cream ring-brand-900/5 hover:shadow-card dark:bg-night-800 dark:ring-white/10'
                }`}
              >
                {/* logo */}
                <span className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-2xl bg-white text-4xl ring-1 ring-ink/5 dark:ring-white/10">
                  {s.logo
                    ? <img src={s.logo} alt={s.name} className="h-full w-full object-contain p-1.5 mix-blend-multiply" />
                    : <span>{emojiFor(s.category)}</span>}
                </span>

                {/* info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate font-display text-lg font-black text-ink dark:text-cream">{s.name}</h3>
                    {s.featured && <span className="rounded-full bg-copper/15 px-2 py-0.5 text-[10px] font-bold text-copper-dark dark:text-copper-light">مميّز</span>}
                  </div>
                  <span className="mt-0.5 inline-flex items-center gap-1 rounded-full bg-ink/5 px-2 py-0.5 text-[11px] font-bold text-ink/55 dark:bg-white/10 dark:text-cream/60">
                    {emojiFor(s.category)} {s.category}
                  </span>
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <Stars value={s.rating} />
                    <span className="font-body text-xs font-bold text-ink/60 dark:text-cream/60">{(s.rating || 0).toFixed(1)}</span>
                    {s.ratingCount > 0 && <span className="font-body text-[11px] text-ink/35 dark:text-cream/35">({s.ratingCount})</span>}
                  </div>
                  {s.tagline && <p className="mt-1 truncate font-body text-xs text-ink/45 dark:text-cream/45">{s.tagline}</p>}
                </div>

                {/* follow */}
                <span
                  role="button"
                  onClick={(e) => { e.stopPropagation(); toggleFollow(s.id); }}
                  className={`absolute left-3 top-3 grid h-8 w-8 place-items-center rounded-full transition ${
                    followed ? 'bg-red-500/15 text-red-500' : 'bg-ink/5 text-ink/40 hover:bg-ink/10 dark:bg-white/10 dark:text-cream/40'
                  }`}
                  title={followed ? 'إلغاء المتابعة' : 'متابعة'}
                >
                  <Heart className={`h-4 w-4 ${followed ? 'fill-red-500' : ''}`} />
                </span>

                {active && (
                  <span className="absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-full bg-copper px-2 py-0.5 text-[10px] font-bold text-cream">
                    <Check className="h-3 w-3" /> تتصفّحه الآن
                  </span>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
