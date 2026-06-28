import { useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import ProductCard from './ProductCard.jsx';
import ProductModal from './ProductModal.jsx';

/* صف منتجات أفقي قابل للتمرير — توقيع واجهة Blinkit.
   يعيد استعمال ProductCard (فيه أصلاً الندرة والشارات والإضافة)،
   وله نافذة منتج خاصة حتى لا يلمس شبكة المنتجات الموجودة. */
export default function ProductRail({
  title, kicker, products = [], onAdd, fly, onSeeAll,
  account = null, onRequireLogin,
}) {
  const [selected, setSelected] = useState(null);
  if (!products.length) return null;

  return (
    <section className="bg-beige pt-6 dark:bg-night">
      <div className="mx-auto max-w-7xl px-4 sm:px-8">
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            {kicker && <span className="font-body text-[12px] font-bold text-copper dark:text-copper-light">{kicker}</span>}
            <h2 className="font-display text-xl font-black leading-tight text-ink dark:text-cream">{title}</h2>
          </div>
          {onSeeAll && (
            <button onClick={onSeeAll} className="flex shrink-0 items-center gap-0.5 font-display text-sm font-bold text-brand-700 transition hover:text-copper dark:text-brand-300">
              شوف الكل <ChevronLeft className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 sm:-mx-8 sm:px-8 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {products.map((p) => (
            <div key={p.id} className="w-[150px] shrink-0 snap-start sm:w-[185px]">
              <ProductCard p={p} onAdd={onAdd} fly={fly} onOpen={setSelected} />
            </div>
          ))}
        </div>
      </div>

      <ProductModal
        product={selected}
        onClose={() => setSelected(null)}
        onAdd={onAdd}
        account={account}
        onRequireLogin={onRequireLogin}
      />
    </section>
  );
}
