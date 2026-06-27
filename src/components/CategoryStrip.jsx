import { motion } from 'framer-motion';
import { LayoutGrid } from 'lucide-react';

/* Sticky horizontal category bar (Talabat / Noon style).
   - normalises categories (strings OR {name,image,emoji}) and always
     guarantees an "الكل" tile up front so "show all" is always reachable.
   - controlled: parent owns the active category + handles the tap. */
export default function CategoryStrip({ categories = [], active = 'الكل', onPick }) {
  const norm = (categories || [])
    .map((c) => (typeof c === 'string' ? { name: c, image: null, emoji: null } : c))
    .filter((c) => c && c.name && c.name !== 'الكل');
  const cats = [{ name: 'الكل', image: null, emoji: null, all: true }, ...norm];

  return (
    <div className="sticky top-[58px] z-40 border-b border-ink/5 bg-cream/90 backdrop-blur-md dark:border-white/10 dark:bg-night/90 sm:top-[64px]">
      <div className="mx-auto max-w-7xl overflow-x-auto no-scrollbar px-4 sm:px-8">
        <div className="flex items-start gap-2.5 py-3 sm:gap-4">
          {cats.map((c, i) => {
            const isOn = active === c.name;
            return (
              <motion.button
                key={c.name}
                onClick={() => onPick?.(c.name)}
                whileTap={{ scale: 0.92 }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.035, 0.3) }}
                className="group flex w-[64px] shrink-0 flex-col items-center gap-1.5 sm:w-[76px]"
                aria-pressed={isOn}
              >
                <span
                  className={`grid h-14 w-14 place-items-center overflow-hidden rounded-2xl text-2xl transition-all duration-200 sm:h-16 sm:w-16 ${
                    isOn
                      ? 'bg-brand-800 text-cream shadow-seal ring-2 ring-copper dark:bg-brand-600'
                      : 'bg-white text-ink ring-1 ring-ink/10 group-hover:-translate-y-0.5 group-hover:ring-copper/40 dark:bg-night-800 dark:text-cream dark:ring-white/10'
                  }`}
                >
                  {c.all ? (
                    <LayoutGrid className={`h-6 w-6 ${isOn ? 'text-cream' : 'text-copper'}`} />
                  ) : c.image ? (
                    <img src={c.image} alt="" className="h-full w-full object-contain p-1.5 mix-blend-multiply" />
                  ) : (
                    <span>{c.emoji || '🛒'}</span>
                  )}
                </span>
                <span
                  className={`max-w-full truncate font-body text-[11px] font-bold leading-tight sm:text-xs ${
                    isOn ? 'text-copper dark:text-copper-light' : 'text-ink/70 dark:text-cream/70'
                  }`}
                >
                  {c.name}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
