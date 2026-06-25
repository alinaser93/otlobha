import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Star } from 'lucide-react';
import { BUNDLES, fmt } from '../data/catalog.js';
import { fadeUp, viewportOnce } from '../lib/motion.js';

// one ingredient bubble: shows the real product image, falls back to emoji
function BundleOrb({ image, emoji }) {
  const [ok, setOk] = useState(true);
  if (image && ok) {
    return (
      <img
        src={image}
        alt=""
        loading="lazy"
        onError={() => setOk(false)}
        className="h-full w-full object-contain p-1 mix-blend-multiply"
      />
    );
  }
  return <span>{emoji}</span>;
}

function BundleCard({ b, onAdd, fly }) {
  const plateRef = useRef(null);
  const save = b.old ? b.old - b.price : 0;

  return (
    <motion.article
      whileHover={{ y: -6, scale: 1.04 }}
      whileTap={{ scale: 1.03 }}
      transition={{ type: 'spring', stiffness: 320, damping: 22 }}
      className="group relative flex w-[74vw] max-w-[300px] shrink-0 snap-center flex-col overflow-hidden rounded-[28px] bg-cream shadow-card ring-1 ring-brand-900/5 hover:z-20 focus-within:z-20 active:z-20 dark:bg-night-800 dark:ring-white/10 md:w-auto md:max-w-none"
    >
      {/* top: composed plate (already a dark emerald/copper gradient) */}
      <div
        className="relative overflow-hidden px-6 pb-5 pt-7"
        style={{ background: `linear-gradient(150deg, ${b.accent} 0%, #06271B 130%)` }}
      >
        <span className="pointer-events-none absolute -inset-y-4 -right-1/3 w-1/3 -skew-x-12 bg-white/10 blur-md transition-transform duration-700 group-hover:translate-x-[-260%]" />

        <div className="relative flex items-center justify-between">
          <span className="rounded-full bg-cream/15 px-3 py-1 font-body text-xs text-cream/90 backdrop-blur">{b.kicker}</span>
          {save > 0 && (
            <span className="rounded-full bg-copper px-3 py-1 font-display text-xs font-bold text-cream shadow">
              وفّر {fmt(save)} د.ع
            </span>
          )}
        </div>

        {/* ingredient bubbles use the real product images (kept light so they stay visible) */}
        <div ref={plateRef} className="relative mx-auto mt-4 flex h-36 items-end justify-center">
          {b.emojis.map((e, i) => {
            const mid = (b.emojis.length - 1) / 2;
            const off = i - mid;
            return (
              <div
                key={i}
                className="grid h-20 w-20 place-items-center overflow-hidden rounded-full bg-cream text-3xl shadow-soft transition-transform duration-300 group-hover:-translate-y-1"
                style={{
                  marginInline: '-12px',
                  transform: `translateY(${Math.abs(off) * 10}px)`,
                  zIndex: 10 - Math.abs(off),
                  filter: 'drop-shadow(0 8px 10px rgba(0,0,0,.18))',
                }}
              >
                <BundleOrb image={b.images?.[i]} emoji={e} />
              </div>
            );
          })}
        </div>
      </div>

      {/* body */}
      <div className="flex flex-1 flex-col p-6">
        <h3 className="font-display text-2xl font-extrabold text-ink dark:text-cream">{b.name}</h3>
        <p className="mt-2 font-body text-sm leading-relaxed text-ink/60 dark:text-cream/60">{b.desc}</p>

        <div className="mt-4 flex flex-wrap gap-1.5">
          {b.items.map((it) => (
            <span key={it} className="rounded-full bg-beige px-2.5 py-1 font-body text-xs text-brand-800 dark:bg-white/10 dark:text-brand-300">
              {it}
            </span>
          ))}
        </div>

        <div className="mt-6 flex items-end justify-between">
          <div>
            {b.old && <div className="font-body text-sm text-ink/40 line-through dark:text-cream/40">{fmt(b.old)} د.ع</div>}
            <div className="font-display text-3xl font-black text-brand-800 dark:text-brand-400">
              {fmt(b.price)} <span className="text-base font-bold text-ink/50 dark:text-cream/50">د.ع</span>
            </div>
          </div>
          <div className="flex items-center gap-0.5 text-gold">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className="h-3.5 w-3.5" fill="currentColor" />
            ))}
          </div>
        </div>

        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            fly(plateRef.current?.children[Math.floor(b.emojis.length / 2)]);
            onAdd(b);
          }}
          className="mt-5 inline-flex items-center justify-center gap-2 rounded-2xl bg-copper py-3.5 font-display text-lg font-bold text-cream shadow-seal hover:bg-copper-dark"
        >
          <Plus className="h-5 w-5" /> أضف الباقة للسلة
        </motion.button>
      </div>
    </motion.article>
  );
}

export default function BundleSection({ onAdd, fly }) {
  return (
    <section id="bundles" className="relative bg-beige py-16 dark:bg-night-900 sm:py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          className="mb-10 text-center sm:mb-14"
        >
          <span className="font-body text-sm font-bold tracking-widest text-copper dark:text-copper-light">وفّر أكثر · اطبخ أطيب</span>
          <h2 className="mt-2 font-display text-4xl font-black text-ink dark:text-cream sm:text-5xl">باقات ذكية</h2>
          <p className="mx-auto mt-3 max-w-xl font-body text-ink/60 dark:text-cream/60">
            مكوّنات وصفة كاملة في سلة واحدة — مختارة بعناية، وبسعر أوفر من شرائها مفردة.
          </p>
        </motion.div>

        <div className="-mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto overflow-y-hidden px-5 py-4 no-scrollbar md:mx-auto md:max-w-5xl md:grid md:grid-cols-3 md:gap-4 md:overflow-x-visible md:overflow-y-visible md:px-0 md:py-0">
          {BUNDLES.map((b, i) => (
            <motion.div
              key={b.id}
              variants={fadeUp}
              custom={i}
              initial="hidden"
              whileInView="show"
              viewport={viewportOnce}
              className="flex"
            >
              <BundleCard b={b} onAdd={onAdd} fly={fly} />
            </motion.div>
          ))}
        </div>
        <p className="mt-3 text-center font-body text-xs text-ink/40 dark:text-cream/40 md:hidden">اسحب لرؤية باقات أكثر ←</p>
      </div>
    </section>
  );
}
