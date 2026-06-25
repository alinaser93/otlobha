import { motion } from 'framer-motion';
import { Zap, Truck, Leaf, Wallet, ShieldCheck } from 'lucide-react';

const TRUST = [
  { icon: Truck, t: 'توصيل بساعتين' },
  { icon: Leaf, t: 'طازج كل يوم' },
  { icon: Wallet, t: 'دفع عند الاستلام' },
  { icon: ShieldCheck, t: 'جودة مضمونة' },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
};
const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.2, 0.7, 0.2, 1] } },
};

export default function Hero({ onShop }) {
  return (
    <section className="relative -mt-[64px] flex min-h-[100svh] items-center overflow-hidden pt-[64px]">
      {/* VIDEO LAYER */}
      <div className="absolute inset-0">
        {/* fallback sits BEHIND — shows only if the video is missing or fails */}
        <div className="hero-fallback droplets absolute inset-0 animate-drift" />
        {/* your cinematic clip — covers the fallback once it plays */}
        <video
          className="absolute inset-0 h-full w-full object-cover"
          src="/media/hero-droplets.mp4"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
        />
        {/* readability overlays */}
        <div className="absolute inset-0 bg-gradient-to-l from-brand-950/85 via-brand-950/55 to-brand-950/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-950 via-transparent to-brand-950/40" />
      </div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="relative mx-auto w-full max-w-7xl px-5 sm:px-8"
      >
        <div className="max-w-2xl">
          <motion.span
            variants={item}
            className="inline-flex items-center gap-2 rounded-full border border-copper-light/40 bg-brand-950/40 px-4 py-1.5 font-body text-sm text-copper-light backdrop-blur"
          >
            <span className="h-2 w-2 animate-floaty rounded-full bg-copper-light" />
            طازج يومياً من السوق العراقي
          </motion.span>

          <motion.h1
            variants={item}
            className="mt-6 font-display text-[2.7rem] font-black leading-[1.12] text-cream sm:text-6xl lg:text-[4.4rem]"
          >
            طازة من قلب العراق
            <span className="block text-copper-light">إلى باب بيتك</span>
          </motion.h1>

          <motion.p variants={item} className="mt-5 max-w-xl font-body text-lg leading-relaxed text-cream/85 sm:text-xl">
            خضار وفواكه تُقطف اليوم، وأجود المنتجات العراقية الأصيلة — مع توصيل سريع يحفظ نكهتها كأنك اخترتها بيدك.
          </motion.p>

          <motion.div variants={item} className="mt-9 flex flex-wrap items-center gap-3.5">
            <motion.button
              onClick={onShop}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="inline-flex items-center gap-2 rounded-full bg-copper px-8 py-4 font-display text-lg font-bold text-cream shadow-seal hover:bg-copper-dark"
            >
              تسوّق الآن
              <Zap className="h-5 w-5" fill="currentColor" />
            </motion.button>
            <a
              href="#bundles"
              className="inline-flex items-center gap-2 rounded-full border border-cream/35 bg-cream/5 px-7 py-4 font-display text-lg font-semibold text-cream backdrop-blur transition hover:bg-cream/15"
            >
              اكتشف الباقات الذكية
            </a>
          </motion.div>

          <motion.div variants={item} className="mt-12 grid max-w-xl grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
            {TRUST.map(({ icon: I, t }) => (
              <div key={t} className="flex items-center gap-2 font-body text-sm text-cream/85">
                <I className="h-5 w-5 text-copper-light" />
                {t}
              </div>
            ))}
          </motion.div>
        </div>
      </motion.div>

      {/* scroll cue */}
      <div className="absolute inset-x-0 bottom-5 flex justify-center">
        <div className="h-9 w-5 rounded-full border-2 border-cream/40 p-1">
          <div className="mx-auto h-2 w-1 animate-floaty rounded-full bg-cream/70" />
        </div>
      </div>
    </section>
  );
}
