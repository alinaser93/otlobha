import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';

/* ── Promo banners — tied to real Otlobha features.
      Pure CSS gradients (no image files), so nothing can break or 404. ── */
const SLIDES = [
  {
    id: 'delivery',
    kicker: 'عرض اليوم',
    title: 'توصيل مجاني داخل السماوة',
    sub: 'اطلب الحين ووصلك لباب بيتك بأسرع وقت.',
    cta: 'تسوّق الآن',
    action: 'shop',
    emoji: '🛵',
    grad: 'linear-gradient(115deg,#06271B 0%,#0F5132 52%,#1C7A4D 100%)',
    glow: 'rgba(70,176,127,0.55)',
  },
  {
    id: 'bundles',
    kicker: 'وفّر أكثر',
    title: 'باقات وصفة كاملة بسعر أوفر',
    sub: 'كل مكوّنات الطبخة بمكان واحد — اختار وخلّي الباقي علينا.',
    cta: 'شوف الباقات',
    action: 'bundles',
    emoji: '🧺',
    grad: 'linear-gradient(115deg,#7A3B12 0%,#BE6E2A 54%,#DD9050 100%)',
    glow: 'rgba(221,144,80,0.5)',
  },
  {
    id: 'rewards',
    kicker: 'هديّة إلك',
    title: 'اربح 5,000 دينار هديّة',
    sub: 'ادعُ صديقك للتطبيق ويصير عندكم الاثنين رصيد تتسوّقون بيه.',
    cta: 'اربح الحين',
    action: 'rewards',
    emoji: '🎁',
    grad: 'linear-gradient(115deg,#7A5B0E 0%,#C9A14A 55%,#E6C878 100%)',
    glow: 'rgba(201,161,74,0.5)',
  },
  {
    id: 'stores',
    kicker: 'سوق مدينتك',
    title: 'متاجر السماوة بمكان واحد',
    sub: 'بقالة، مخابز، حلويات، خضار وأكثر — كلها بتطبيق واحد.',
    cta: 'تصفّح المتاجر',
    action: 'stores',
    emoji: '🏙️',
    grad: 'linear-gradient(115deg,#06271B 0%,#15613D 58%,#2A9466 100%)',
    glow: 'rgba(42,148,102,0.5)',
  },
];

const variants = {
  enter: (dir) => ({ x: dir > 0 ? '100%' : '-100%', opacity: 0.4, scale: 0.96 }),
  center: { x: 0, opacity: 1, scale: 1 },
  exit: (dir) => ({ x: dir > 0 ? '-100%' : '100%', opacity: 0.4, scale: 0.96 }),
};
const swipePower = (offset, velocity) => Math.abs(offset) * velocity;

export default function PromoCarousel({ onAction }) {
  const n = SLIDES.length;
  const [[page, dir], setPage] = useState([0, 0]);
  const [paused, setPaused] = useState(false);
  const idx = ((page % n) + n) % n;
  const slide = SLIDES[idx];

  const reduce = useMemo(() => {
    try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; }
  }, []);

  const paginate = (d) => setPage(([p]) => [p + d, d]);
  const goTo = (i) => setPage(([p]) => [i, i > ((p % n) + n) % n ? 1 : -1]);

  // auto-advance (pauses on hover / drag, and respects reduced-motion)
  useEffect(() => {
    if (paused || reduce) return;
    const t = setInterval(() => setPage(([p]) => [p + 1, 1]), 5200);
    return () => clearInterval(t);
  }, [paused, reduce]);

  return (
    <section id="offers" className="bg-beige pb-2 pt-6 dark:bg-night sm:pt-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-8">
        <div
          className="group relative h-[210px] overflow-hidden rounded-[1.75rem] shadow-card sm:h-[250px]"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <AnimatePresence initial={false} custom={dir}>
            <motion.div
              key={page}
              custom={dir}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ x: { type: 'spring', stiffness: 320, damping: 34 }, opacity: { duration: 0.25 }, scale: { duration: 0.35 } }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.18}
              onDragStart={() => setPaused(true)}
              onDragEnd={(e, { offset, velocity }) => {
                const power = swipePower(offset.x, velocity.x);
                if (power < -8000 || offset.x < -90) paginate(1);
                else if (power > 8000 || offset.x > 90) paginate(-1);
                setPaused(false);
              }}
              className="absolute inset-0 cursor-grab touch-pan-y select-none active:cursor-grabbing"
              style={{ background: slide.grad }}
            >
              {/* decorative glows */}
              <span className="pointer-events-none absolute -right-10 -top-12 h-44 w-44 rounded-full blur-2xl" style={{ background: slide.glow }} />
              <span className="pointer-events-none absolute -bottom-16 left-1/3 h-40 w-40 rounded-full bg-white/10 blur-2xl" />

              {/* giant emoji — RTL end (left) */}
              <motion.span
                key={slide.id + '-emoji'}
                initial={{ scale: 0.6, opacity: 0, rotate: -8 }}
                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.1 }}
                className="pointer-events-none absolute bottom-2 left-3 text-[7rem] leading-none drop-shadow-2xl sm:bottom-1 sm:left-8 sm:text-[9.5rem]"
                aria-hidden
              >
                {slide.emoji}
              </motion.span>

              {/* copy — RTL start (right) */}
              <div className="relative flex h-full max-w-[68%] flex-col justify-center px-6 text-right sm:max-w-[60%] sm:px-12">
                <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 font-body text-[11px] font-bold text-white/95 backdrop-blur sm:text-xs">
                  <span className="h-1.5 w-1.5 animate-floaty rounded-full bg-white" />
                  {slide.kicker}
                </span>
                <h3 className="mt-2.5 font-display text-xl font-black leading-tight text-white drop-shadow sm:mt-3 sm:text-[2rem]">
                  {slide.title}
                </h3>
                <p className="mt-1.5 hidden font-body text-sm leading-relaxed text-white/85 sm:block">
                  {slide.sub}
                </p>
                <button
                  onClick={() => onAction?.(slide.action)}
                  className="mt-3.5 inline-flex w-fit items-center gap-1.5 rounded-full bg-white px-5 py-2.5 font-display text-sm font-bold text-ink shadow-lg transition hover:gap-3 hover:bg-cream sm:mt-5 sm:px-6 sm:py-3 sm:text-base"
                >
                  {slide.cta}
                  <ArrowLeft className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* desktop arrows (mobile uses swipe) */}
          <button
            onClick={() => paginate(1)}
            aria-label="التالي"
            className="absolute right-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-black/25 text-white opacity-0 backdrop-blur transition hover:bg-black/40 group-hover:opacity-100 lg:grid"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <button
            onClick={() => paginate(-1)}
            aria-label="السابق"
            className="absolute left-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-black/25 text-white opacity-0 backdrop-blur transition hover:bg-black/40 group-hover:opacity-100 lg:grid"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          {/* dots */}
          <div className="absolute bottom-3.5 right-6 flex items-center gap-1.5 sm:right-12">
            {SLIDES.map((s, i) => (
              <button
                key={s.id}
                onClick={() => goTo(i)}
                aria-label={`عرض ${i + 1}`}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === idx ? 'w-6 bg-white' : 'w-1.5 bg-white/45 hover:bg-white/70'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
