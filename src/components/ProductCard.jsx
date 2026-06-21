import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { fmt } from '../data/catalog.js';

export default function ProductCard({ p, onAdd, fly }) {
  const orbRef = useRef(null);
  // show the real image; if its file is missing, fall back to the emoji
  const [imgOk, setImgOk] = useState(true);

  return (
    <motion.article
      whileHover={{ y: -6 }}
      transition={{ type: 'spring', stiffness: 300, damping: 22 }}
      className="group relative flex flex-col overflow-hidden rounded-3xl bg-white p-4 shadow-soft ring-1 ring-brand-900/5 hover:shadow-card"
    >
      {p.badge && (
        <span className="absolute right-3 top-3 z-10 rounded-full bg-brand-800 px-2.5 py-1 font-body text-[11px] font-bold text-cream">
          {p.badge}
        </span>
      )}

      <div className="relative grid place-items-center rounded-2xl bg-gradient-to-b from-beige/60 to-white py-5">
        {/* Soft circular tile — perfect backdrop for transparent product images.
            The image shows when its file exists in /public/images; otherwise
            the emoji shows automatically (so no broken-image icons). */}
        <div
          ref={orbRef}
          className="relative grid h-28 w-28 place-items-center rounded-full text-5xl sm:h-32 sm:w-32"
          style={{
            background: `radial-gradient(70% 70% at 35% 30%, #ffffff 0%, #fff 40%, ${p.tint}14 100%)`,
            boxShadow: `inset 0 -10px 24px -14px ${p.tint}55, 0 14px 30px -18px ${p.tint}66`,
          }}
        >
          {p.image && imgOk ? (
            <img
              src={p.image}
              alt={p.name}
              loading="lazy"
              onError={() => setImgOk(false)}
              /* mix-blend-multiply makes a white/light image background melt into
                 the tile — no need to edit the original images. p-2 keeps the
                 product from touching the edge; object-contain keeps proportions. */
              className="h-full w-full object-contain p-2 mix-blend-multiply"
            />
          ) : (
            <span style={{ filter: 'drop-shadow(0 6px 8px rgba(0,0,0,.18))' }}>{p.emoji}</span>
          )}
        </div>

        {/* quick-add: always tappable on mobile, slides up on hover on desktop */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => {
            fly(orbRef.current);
            onAdd(p);
          }}
          aria-label={'أضف ' + p.name}
          className="absolute bottom-2 right-2 grid h-11 w-11 translate-y-3 place-items-center rounded-full bg-copper text-cream opacity-100 shadow-seal transition-all duration-300 hover:bg-copper-dark md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100"
        >
          <Plus className="h-5 w-5" />
        </motion.button>
      </div>

      <div className="mt-3 flex flex-1 flex-col">
        <span className="font-body text-[11px] text-copper">{p.tag}</span>
        <h3 className="mt-0.5 font-display text-[17px] font-bold leading-tight text-ink">{p.name}</h3>
        <div className="mt-2 font-display text-xl font-black text-brand-800">
          {fmt(p.price)} <span className="text-xs font-bold text-ink/45">د.ع / {p.unit}</span>
        </div>
      </div>
    </motion.article>
  );
}
