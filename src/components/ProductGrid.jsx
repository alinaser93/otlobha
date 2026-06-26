import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { fadeUp, viewportOnce } from '../lib/motion.js';
import ProductCard from './ProductCard.jsx';
import ProductModal from './ProductModal.jsx';

// products + categories now come from the live catalog (App fetches them from
// the database, falling back to the bundled catalog). Shapes are unchanged.
export default function ProductGrid({ products = [], categories = ['الكل'], onAdd, fly, openProductId = null, initialCat = null }) {
  const [cat, setCat] = useState('الكل');
  const [selected, setSelected] = useState(null);
  const didDeepLink = useRef(false);
  // categories may be plain strings (fallback) or objects { name, image, emoji }
  const cats = (categories || []).map((c) => (typeof c === 'string' ? { name: c, image: null, emoji: null } : c));
  const list = cat === 'الكل' ? products : products.filter((p) => p.tag === cat);

  // open a shared product / category once the live catalog has loaded
  useEffect(() => {
    if (didDeepLink.current) return;
    if (openProductId && products.length) {
      const found = products.find((p) => String(p.id) === String(openProductId));
      if (found) {
        setSelected(found);
        didDeepLink.current = true;
        setTimeout(() => document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' }), 60);
      }
    } else if (initialCat && cats.some((c) => c.name === initialCat)) {
      setCat(initialCat);
      didDeepLink.current = true;
      setTimeout(() => document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' }), 60);
    }
    // eslint-disable-next-line
  }, [openProductId, initialCat, products]);

  return (
    <section id="products" className="bg-cream py-16 dark:bg-night sm:py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          className="flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-end"
        >
          <div>
            <span className="font-body text-sm font-bold tracking-widest text-copper dark:text-copper-light">مختار لك اليوم</span>
            <h2 className="mt-2 font-display text-4xl font-black text-ink dark:text-cream sm:text-5xl">الأكثر طلباً</h2>
          </div>

          <div className="flex flex-wrap gap-2">
            {cats.map((c) => {
              const active = cat === c.name;
              const thumb = c.image || c.emoji;
              return (
                <button
                  key={c.name}
                  onClick={() => setCat(c.name)}
                  className={`flex items-center gap-2 rounded-full py-1.5 pe-2 ps-4 font-body text-sm font-bold transition ${
                    active
                      ? 'bg-brand-800 text-cream shadow-soft dark:bg-brand-600'
                      : 'bg-cream text-ink/70 ring-1 ring-brand-900/10 hover:bg-beige dark:bg-white/10 dark:text-cream/70 dark:ring-white/10 dark:hover:bg-white/20'
                  }`}
                >
                  <span>{c.name}</span>
                  {thumb && (
                    <span className="grid h-7 w-7 shrink-0 place-items-center overflow-hidden rounded-full bg-white text-base ring-1 ring-black/5">
                      {c.image ? (
                        <img src={c.image} alt="" className="h-full w-full object-contain p-0.5 mix-blend-multiply" />
                      ) : (
                        <span>{c.emoji}</span>
                      )}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </motion.div>

        {list.length === 0 ? (
          <div className="mt-12 rounded-3xl border border-dashed border-ink/15 py-16 text-center font-body text-ink/40 dark:border-white/15 dark:text-cream/40">
            لا توجد منتجات في هذا القسم حالياً.
          </div>
        ) : (
          <motion.div layout className="mt-9 grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
            {list.map((p, i) => (
              <motion.div
                key={p.id}
                layout
                variants={fadeUp}
                custom={i % 4}
                initial="hidden"
                whileInView="show"
                viewport={viewportOnce}
              >
                <ProductCard p={p} onAdd={onAdd} fly={fly} onOpen={setSelected} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      <ProductModal product={selected} onClose={() => setSelected(null)} onAdd={onAdd} />
    </section>
  );
}
