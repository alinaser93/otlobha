import { useState } from 'react';
import { motion } from 'framer-motion';
import { Star, Heart } from 'lucide-react';
import { fadeUp, viewportOnce } from '../lib/motion.js';

const CAT_EMOJI = {
  بقالة: '🛒', مخبز: '🥖', مطعم: '🍽️', خضار: '🥬',
  فواكه: '🍎', حلويات: '🍰', لحوم: '🥩', مشروبات: '🥤', ألبان: '🧀',
};
const CAT_GRAD = {
  بقالة: 'from-emerald-500 to-teal-700', مخبز: 'from-amber-500 to-orange-700',
  مطعم: 'from-rose-500 to-red-700', خضار: 'from-lime-500 to-green-700',
  فواكه: 'from-pink-500 to-rose-700', حلويات: 'from-fuchsia-500 to-purple-700',
  لحوم: 'from-red-500 to-rose-800', مشروبات: 'from-sky-500 to-blue-700', ألبان: 'from-cyan-400 to-sky-600',
};
const emojiFor = (c) => CAT_EMOJI[c] || '🏪';
const gradFor = (c) => CAT_GRAD[c] || 'from-brand-600 to-brand-900';

export function useFollows() {
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

export function Stars({ value = 0, className = 'h-3.5 w-3.5' }) {
  const full = Math.round(value);
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={`${className} ${i <= full ? 'fill-amber-400 text-amber-400' : 'text-white/30'}`} />
      ))}
    </span>
  );
}

function StoreCard({ s, active, onSelect, followed, onFollow, index }) {
  return (
    <motion.button
      variants={fadeUp}
      custom={index % 3}
      initial="hidden"
      whileInView="show"
      viewport={viewportOnce}
      whileHover={{ y: -6 }}
      transition={{ type: 'spring', stiffness: 300, damping: 22 }}
      onClick={() => onSelect?.(active ? null : s.id)}
      className={`group relative flex flex-col overflow-hidden rounded-3xl bg-cream text-right shadow-soft ring-1 transition dark:bg-night-800 ${
        active ? 'ring-2 ring-copper' : 'ring-brand-900/5 hover:shadow-card dark:ring-white/10'
      }`}
    >
      {/* cover */}
      <div className="relative h-28 w-full overflow-hidden">
        {s.cover ? (
          <img src={s.cover} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        ) : (
          <div className={`relative h-full w-full bg-gradient-to-br ${gradFor(s.category)}`}>
            <span className="absolute inset-0 grid place-items-center text-5xl opacity-30">{emojiFor(s.category)}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />

        <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-black/35 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur">
          {emojiFor(s.category)} {s.category}
        </span>
        {s.featured && (
          <span className="absolute right-3 top-11 rounded-full bg-copper px-2 py-0.5 text-[10px] font-bold text-cream shadow-seal">مميّز ⭐</span>
        )}

        <span
          role="button"
          onClick={(e) => { e.stopPropagation(); onFollow?.(s.id); }}
          className={`absolute left-3 top-3 grid h-9 w-9 place-items-center rounded-full backdrop-blur transition ${
            followed ? 'bg-red-500 text-white' : 'bg-black/35 text-white hover:bg-black/50'
          }`}
          title={followed ? 'إلغاء المتابعة' : 'متابعة'}
        >
          <Heart className={`h-4 w-4 ${followed ? 'fill-white' : ''}`} />
        </span>

        <span className="absolute bottom-2 left-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-0.5 text-[11px] font-black text-ink shadow">
          <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> {(s.rating || 0).toFixed(1)}
          {s.ratingCount > 0 && <span className="font-bold text-ink/40">({s.ratingCount})</span>}
        </span>
      </div>

      {/* body */}
      <div className="relative flex flex-1 items-start gap-3 px-4 pb-4 pt-0">
        <span className="-mt-7 grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-2xl bg-white text-3xl shadow-card ring-2 ring-cream dark:ring-night-800">
          {s.logo
            ? <img src={s.logo} alt={s.name} className="h-full w-full object-contain p-1 mix-blend-multiply" />
            : <span>{emojiFor(s.category)}</span>}
        </span>
        <div className="min-w-0 flex-1 pt-2.5">
          <h3 className="truncate font-display text-lg font-black text-ink dark:text-cream">{s.name}</h3>
          {s.tagline
            ? <p className="mt-0.5 truncate font-body text-xs text-ink/50 dark:text-cream/50">{s.tagline}</p>
            : <p className="mt-0.5 truncate font-body text-xs text-ink/40 dark:text-cream/40">متجر في سوق السماوة</p>}
        </div>
      </div>

      {active && (
        <span className="absolute bottom-3 right-3 inline-flex items-center gap-1 rounded-full bg-copper px-2.5 py-0.5 text-[10px] font-bold text-cream">تتصفّحه الآن ✓</span>
      )}
    </motion.button>
  );
}

export default function StoresSection({ stores = [], activeStore = null, onSelect }) {
  const [follows, toggleFollow] = useFollows();
  if (!stores.length) return null;

  return (
    <section id="stores" className="bg-gradient-to-b from-beige/60 to-cream py-14 dark:from-night-900 dark:to-night sm:py-20">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={viewportOnce}
          className="flex items-end justify-between gap-4">
          <div>
            <span className="font-body text-sm font-bold tracking-widest text-copper dark:text-copper-light">سوق السماوة 🏙️</span>
            <h2 className="mt-2 font-display text-3xl font-black text-ink dark:text-cream sm:text-4xl">متاجر تختارها أنت</h2>
            <p className="mt-1 font-body text-sm text-ink/50 dark:text-cream/50">اختر متجرك وتسوّق من أفضل محلّات مدينتك</p>
          </div>
          {activeStore && (
            <button onClick={() => onSelect?.(null)}
              className="shrink-0 rounded-full bg-brand-800 px-4 py-2 font-body text-sm font-bold text-cream shadow-soft transition hover:bg-brand-700 dark:bg-brand-600">
              كل المتاجر
            </button>
          )}
        </motion.div>

        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {stores.map((s, i) => (
            <StoreCard key={s.id} s={s} index={i} active={activeStore === s.id} onSelect={onSelect}
              followed={follows.includes(s.id)} onFollow={toggleFollow} />
          ))}
        </div>
      </div>
    </section>
  );
}
