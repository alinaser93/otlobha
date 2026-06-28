import { LayoutGrid } from 'lucide-react';

// خلفيات ناعمة من عائلة هوية المتجر (تتناوب لإضافة حيوية بدون خروج عن الهوية)
const TINTS = ['bg-beige', 'bg-copper/15', 'bg-brand-400/15', 'bg-copper-light/20'];

/* شبكة «سوّق حسب القسم» — مربّعات كبيرة مثل ممرّات السوبرماركت.
   النقر يفلتر المنتجات وينزل لها (نفس سلوك pickCategory). */
export default function CategoryGrid({ categories = [], onPick }) {
  const cats = (categories || [])
    .map((c) => (typeof c === 'string' ? { name: c, image: null, emoji: null } : c))
    .filter((c) => c && c.name && c.name !== 'الكل');
  if (!cats.length) return null;

  return (
    <section className="bg-beige pt-6 dark:bg-night">
      <div className="mx-auto max-w-7xl px-4 sm:px-8">
        <div className="mb-4 flex items-center gap-2">
          <LayoutGrid className="h-5 w-5 text-copper" />
          <h2 className="font-display text-xl font-black text-ink dark:text-cream">سوّق حسب القسم</h2>
        </div>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {cats.map((c, i) => (
            <button
              key={c.name}
              onClick={() => onPick?.(c.name)}
              className="group flex flex-col items-center gap-2 focus:outline-none"
            >
              <div
                className={`grid aspect-square w-full place-items-center overflow-hidden rounded-2xl ${TINTS[i % TINTS.length]} p-2 ring-1 ring-ink/5 transition group-hover:-translate-y-0.5 group-hover:ring-copper/40 group-active:scale-95 dark:bg-white/5 dark:ring-white/10`}
              >
                {c.image ? (
                  <img src={c.image} alt={c.name} className="h-full w-full object-contain drop-shadow-sm" loading="lazy" />
                ) : (
                  <span className="text-4xl sm:text-5xl">{c.emoji || '🛒'}</span>
                )}
              </div>
              <span className="line-clamp-2 text-center font-display text-[13px] font-bold leading-tight text-ink/80 dark:text-cream/80">
                {c.name}
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
