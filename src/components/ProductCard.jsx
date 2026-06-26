import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { fmt } from '../data/catalog.js';

export default function ProductCard({ p, onAdd, fly, onOpen }) {
  const orbRef = useRef(null);
  // show the real image; if its file is missing, fall back to the emoji
  const [imgOk, setImgOk] = useState(true);
  const out = p.stock != null && p.stock <= 0;
  const low = p.stock != null && p.stock > 0 && p.stock <= 5;

  return (
    <motion.article
      whileHover={{ y: -6 }}
      transition={{ type: 'spring', stiffness: 300, damping: 22 }}
      onClick={() => onOpen?.(p)}
      role="button"
      className="group relative flex cursor-pointer flex-col overflow-hidden rounded-3xl bg-cream p-4 shadow-soft ring-1 ring-brand-900/5 hover:shadow-card dark:bg-night-800 dark:ring-white/10"
    >
      {p.badge && (
        <span className="absolute right-3 top-3 z-10 rounded-full bg-brand-800 px-2.5 py-1 font-body text-[11px] font-bold text-cream dark:bg-brand-600">
          {p.badge}
        </span>
      )}

      {/* dark tile in dark mode; product sits on an opaque light "plate" so white-bg images stay visible */}
      <div className="relative grid place-items-center rounded-2xl bg-gradient-to-b from-beige/60 to-white py-5 dark:from-night-700 dark:to-night-900">
        <div
          ref={orbRef}
          className={`relative grid h-28 w-28 place-items-center overflow-hidden rounded-full text-5xl sm:h-32 sm:w-32 ${out ? 'opacity-45 grayscale' : ''}`}
          style={{
            background: `radial-gradient(70% 70% at 35% 30%, #ffffff 0%, #ffffff 62%, #ece5d8 100%)`,
            boxShadow: `inset 0 -10px 24px -14px ${p.tint}55, 0 14px 30px -18px ${p.tint}66`,
          }}
        >
          {p.image && imgOk ? (
            <img
              src={p.image}
              alt={p.name}
              loading="lazy"
              onError={() => setImgOk(false)}
              className="h-full w-full object-contain p-2 mix-blend-multiply"
            />
          ) : (
            <span style={{ filter: 'drop-shadow(0 6px 8px rgba(0,0,0,.18))' }}>{p.emoji}</span>
          )}
        </div>

        {out && (
          <span className="absolute right-2 top-2 rounded-full bg-red-600 px-2.5 py-1 text-[11px] font-bold text-white">نفد</span>
        )}

        {/* quick-add: always tappable on mobile, slides up on hover on desktop */}
        <motion.button
          whileTap={{ scale: out ? 1 : 0.9 }}
          disabled={out}
          onClick={(e) => {
            e.stopPropagation();
            if (out) return;
            fly(orbRef.current);
            onAdd(p);
          }}
          aria-label={'أضف ' + p.name}
          className={`absolute bottom-2 right-2 grid h-11 w-11 translate-y-3 place-items-center rounded-full text-cream shadow-seal transition-all duration-300 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100 ${
            out ? 'cursor-not-allowed bg-ink/30 opacity-100' : 'bg-copper opacity-100 hover:bg-copper-dark'
          }`}
        >
          <Plus className="h-5 w-5" />
        </motion.button>
      </div>

      <div className="mt-3 flex flex-1 flex-col">
        <span className="font-body text-[11px] text-copper dark:text-copper-light">{p.tag}</span>
        <h3 className="mt-0.5 font-display text-[17px] font-bold leading-tight text-ink dark:text-cream">{p.name}</h3>
        <div className="mt-2 flex items-baseline gap-1.5">
          <span className="font-display text-xl font-black text-brand-800 dark:text-brand-400">{fmt(p.price)}</span>
          {p.oldPrice && (
            <span className="font-body text-xs font-bold text-ink/35 line-through dark:text-cream/35">{fmt(p.oldPrice)}</span>
          )}
          <span className="text-xs font-bold text-ink/45 dark:text-cream/45">د.ع / {p.unit}</span>
        </div>
        {low && (
          <span className="mt-1.5 inline-flex w-fit items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-bold text-amber-700 dark:text-amber-300">
            🔥 بقي {p.stock}
          </span>
        )}
      </div>
    </motion.article>
  );
}
