import ShareButton from './ShareButton.jsx';
import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ShoppingBasket } from 'lucide-react';
import { fadeUp, viewportOnce } from '../lib/motion.js';
import ProductCard from './ProductCard.jsx';
import ProductModal from './ProductModal.jsx';
import StoreHeader from './StoreHeader.jsx';
import { StoreReviews } from './StoreRating.jsx';

// products + categories now come from the live catalog (App fetches them from
// the database, falling back to the bundled catalog). Shapes are unchanged.
export default function ProductGrid({ products = [], categories = ['الكل'], onAdd, fly, openProductId = null, initialCat = null, storeFilter = null, store = null, onClearStore, account = null, onRequireLogin, followIds = [], onToggleFollow, cat: catProp, onCat, hideChips = false }) {
  // category can be controlled by the parent (sticky strip) or kept locally
  const [catLocal, setCatLocal] = useState('الكل');
  const cat = catProp !== undefined ? catProp : catLocal;
  const setCat = onCat || setCatLocal;
  const [selected, setSelected] = useState(null);
  const [ratingOverride, setRatingOverride] = useState(null);
  const [reviewsKey, setReviewsKey] = useState(0);
  const didDeepLink = useRef(false);
  // categories may be plain strings (fallback) or objects { name, image, emoji }
  const globalCats = (categories || []).map((c) => (typeof c === 'string' ? { name: c, image: null, emoji: null } : c));
  const byStore = storeFilter ? products.filter((p) => p.storeId === storeFilter) : products;
  // when browsing a store, build the category chips from that store's own products
  // (so any category the merchant added shows up), ordered by the global list first
  const cats = (() => {
    if (!storeFilter) return globalCats;
    const present = Array.from(new Set(byStore.map((p) => (p.tag || '').trim()).filter(Boolean)));
    const order = new Map(globalCats.map((c, i) => [c.name, i]));
    present.sort((a, b) => (order.has(a) ? order.get(a) : 999) - (order.has(b) ? order.get(b) : 999));
    const meta = new Map(globalCats.map((c) => [c.name, c]));
    return [{ name: 'الكل', image: null, emoji: null }, ...present.map((n) => meta.get(n) || { name: n, image: null, emoji: null })];
  })();
  const list = cat === 'الكل' ? byStore : byStore.filter((p) => p.tag === cat);

  // reset live rating override when switching stores
  useEffect(() => { setRatingOverride(null); }, [store?.id]);

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
        {store && (
          <div className="mb-9">
            <StoreHeader
              store={ratingOverride ? { ...store, rating: ratingOverride.rating, ratingCount: ratingOverride.ratingCount } : store}
              count={byStore.length}
              onBack={onClearStore}
              account={account}
              onRequireLogin={onRequireLogin}
              onRated={(r) => { setRatingOverride(r); setReviewsKey((k) => k + 1); }}
              followIds={followIds}
              onToggleFollow={onToggleFollow}
            />
            <StoreReviews storeId={store.id} refreshKey={reviewsKey} />
          </div>
        )}

        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          className="flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-end"
        >
          {!store && (
            <div>
              <span className="font-body text-sm font-bold tracking-widest text-copper dark:text-copper-light">{cat === 'الكل' ? 'مختار لك اليوم' : 'تصفّح القسم'}</span>
              <h2 className="mt-2 font-display text-4xl font-black text-ink dark:text-cream sm:text-5xl">{cat === 'الكل' ? 'الأكثر طلباً' : cat}</h2>
            </div>
          )}
          {store && (
            <h3 className="font-display text-2xl font-black text-ink dark:text-cream">تصفّح حسب القسم</h3>
          )}

          {!hideChips && (
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
                      ? 'bg-brand-800 text-cream shadow-soft ring-1 ring-brand-800 dark:bg-brand-600 dark:ring-brand-600'
                      : 'bg-white text-ink ring-1 ring-ink/10 hover:bg-beige hover:ring-copper/40 dark:bg-night-800 dark:text-cream/80 dark:ring-white/10 dark:hover:bg-night-700'
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
          )}
          {cat !== 'الكل' && (
            <div className="mt-2 flex items-center gap-1.5">
              <ShareButton variant="ghost" path={`/c/${cat}`} title={`${cat} — اطلبها`}
                text={`شوف قسم ${cat} في اطلبها 🛒`} label={`شارك قسم «${cat}»`} />
            </div>
          )}
        </motion.div>

        {list.length === 0 ? (
          <div className="mt-10 flex flex-col items-center justify-center rounded-[2rem] border border-dashed border-ink/15 bg-beige/30 py-16 text-center dark:border-white/15 dark:bg-white/5">
            <div className="grid h-16 w-16 place-items-center rounded-2xl bg-copper/10 text-copper">
              <ShoppingBasket className="h-8 w-8" />
            </div>
            <p className="mt-4 font-display text-lg font-bold text-ink/70 dark:text-cream/70">
              {store ? 'لا توجد منتجات في هذا القسم بعد' : 'لا توجد منتجات في هذا القسم حالياً'}
            </p>
            <p className="mt-1 font-body text-sm text-ink/45 dark:text-cream/45">
              {cat !== 'الكل' ? 'جرّب قسماً آخر من الأعلى 👆' : 'تابعنا — نضيف منتجات جديدة قريباً 🌿'}
            </p>
            {cat !== 'الكل' && (
              <button onClick={() => setCat('الكل')}
                className="mt-4 rounded-full bg-copper px-5 py-2 font-body text-sm font-bold text-cream hover:bg-copper-dark">
                عرض كل الأقسام
              </button>
            )}
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

      <ProductModal product={selected} onClose={() => setSelected(null)} onAdd={onAdd} account={account} onRequireLogin={onRequireLogin} />
    </section>
  );
}
