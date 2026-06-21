import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Truck, Leaf, ShieldCheck, Gift, Check } from 'lucide-react';

import Header from './components/Header.jsx';
import Hero from './components/Hero.jsx';
import BundleSection from './components/BundleSection.jsx';
import ProductGrid from './components/ProductGrid.jsx';
import Footer from './components/Footer.jsx';
import ReferralModal from './components/ReferralModal.jsx';
import CartDrawer from './components/CartDrawer.jsx';
import { useFlyToCart, fadeUp, viewportOnce } from './lib/motion.js';

/* ════════════════════════════════════════════════════════════════
   ADD-TO-CART RAINBOW BURST  (Gemini-style)
   A fast rainbow shockwave + sparkle bubbles that spread across the
   whole screen from the tap point, then vanish. Pure delight → buy more.
   ════════════════════════════════════════════════════════════════ */
const RAINBOW = ['#ff4d4d', '#ff9f1c', '#ffe44d', '#34d399', '#22d3ee', '#6366f1', '#a855f7', '#ec4899'];

function Burst({ burst }) {
  // scale a small base element up until it covers the entire viewport
  const cover = useMemo(
    () => (Math.hypot(window.innerWidth, window.innerHeight) * 2) / 200,
    [],
  );
  const bubbles = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => {
        const ang = (i / 14) * Math.PI * 2 + Math.random() * 0.6;
        const dist = 110 + Math.random() * 200;
        return {
          x: Math.cos(ang) * dist,
          y: Math.sin(ang) * dist,
          c: RAINBOW[i % RAINBOW.length],
          s: 8 + Math.random() * 16,
          d: 0.55 + Math.random() * 0.4,
        };
      }),
    [],
  );

  const at = { position: 'fixed', left: burst.x, top: burst.y };

  return (
    <>
      {/* expanding rainbow ring (the shockwave) */}
      <motion.div
        initial={{ scale: 0, opacity: 0.95 }}
        animate={{ scale: cover, opacity: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        style={{
          ...at,
          width: 200,
          height: 200,
          marginLeft: -100,
          marginTop: -100,
          borderRadius: '9999px',
          filter: 'blur(5px)',
          background:
            'radial-gradient(circle, transparent 54%, rgba(255,77,77,.7) 60%, rgba(255,159,28,.7) 65%, rgba(255,228,77,.7) 70%, rgba(52,211,153,.7) 75%, rgba(34,211,238,.7) 80%, rgba(99,102,241,.7) 85%, rgba(168,85,247,.7) 90%, transparent 95%)',
        }}
      />
      {/* soft white core flash */}
      <motion.div
        initial={{ scale: 0, opacity: 0.7 }}
        animate={{ scale: cover * 0.55, opacity: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        style={{
          ...at,
          width: 160,
          height: 160,
          marginLeft: -80,
          marginTop: -80,
          borderRadius: '9999px',
          mixBlendMode: 'screen',
          background: 'radial-gradient(circle, #ffffff 0%, rgba(255,255,255,0) 70%)',
        }}
      />
      {/* sparkle bubbles flying outward */}
      {bubbles.map((b, i) => (
        <motion.span
          key={i}
          initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
          animate={{ x: b.x, y: b.y, scale: 0.2, opacity: 0 }}
          transition={{ duration: b.d, ease: 'easeOut' }}
          style={{
            ...at,
            width: b.s,
            height: b.s,
            marginLeft: -b.s / 2,
            marginTop: -b.s / 2,
            borderRadius: '9999px',
            background: b.c,
            boxShadow: `0 0 14px ${b.c}`,
          }}
        />
      ))}
    </>
  );
}

function AddToCartFx({ burst }) {
  return (
    <div className="pointer-events-none fixed inset-0 z-[120] overflow-hidden">
      <AnimatePresence>{burst && <Burst key={burst.id} burst={burst} />}</AnimatePresence>
    </div>
  );
}

/* ── slim promo bar ── */
function TopBar() {
  return (
    <div className="bg-brand-950 font-body text-[12px] text-cream/85 sm:text-[13px]">
      <div className="mx-auto flex max-w-7xl items-center justify-center gap-2 px-4 py-2 text-center">
        <Truck className="h-4 w-4 shrink-0 text-copper-light" />
        <span>
          توصيل <b className="font-bold text-copper-light">مجاني</b> للطلبات فوق ٢٥٬٠٠٠ دينار — ونصل خلال ساعتين داخل بغداد
        </span>
      </div>
    </div>
  );
}

/* ── freshness promise band (brand storytelling) ── */
const PROMISE = [
  { icon: Leaf, t: 'من المزرعة العراقية', d: 'نتعامل مباشرة مع الفلاح المحلي — بلا وسطاء، وبأطيب موسم.' },
  { icon: Truck, t: 'يصلك وهو طازج', d: 'سلسلة تبريد وتوصيل سريع تحفظ النكهة من السوق إلى مطبخك.' },
  { icon: ShieldCheck, t: 'جودة أو ترجيع', d: 'لو ما عجبك أي منتج، نرجّع فلوسك بلا أسئلة. وعد اطلبها.' },
];

function FreshnessPromise() {
  return (
    <section className="bg-brand-900 py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid gap-8 sm:grid-cols-3">
          {PROMISE.map(({ icon: I, t, d }, k) => (
            <motion.div
              key={t}
              variants={fadeUp}
              custom={k}
              initial="hidden"
              whileInView="show"
              viewport={viewportOnce}
              className="text-center sm:text-right"
            >
              <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-copper/15 text-copper-light sm:mx-0">
                <I className="h-7 w-7" />
              </div>
              <h3 className="font-display text-2xl font-extrabold text-cream">{t}</h3>
              <p className="mt-2 font-body leading-relaxed text-cream/70">{d}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function App() {
  const [items, setItems] = useState([]);
  const [bump, setBump] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [refOpen, setRefOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [burst, setBurst] = useState(null);
  const { cartRef, fly } = useFlyToCart();

  // remember the last tap position so the burst starts exactly there
  const pointer = useRef({ x: 0, y: 0 });
  useEffect(() => {
    const onDown = (e) => (pointer.current = { x: e.clientX, y: e.clientY });
    window.addEventListener('pointerdown', onDown, true);
    return () => window.removeEventListener('pointerdown', onDown, true);
  }, []);

  const total = items.reduce((s, i) => s + i.price * i.qty, 0);
  const count = items.reduce((s, i) => s + i.qty, 0);

  const addItem = useCallback((p) => {
    setItems((prev) => {
      const found = prev.find((i) => i.key === p.id);
      if (found) return prev.map((i) => (i.key === p.id ? { ...i, qty: i.qty + 1 } : i));
      // bundles carry an `emojis` array; products carry a single `emoji`
      const image = p.emojis ? (p.images?.[0] ?? p.image) : p.image;
      return [...prev, { key: p.id, name: p.name, price: p.price, emoji: p.emojis ? '🧺' : p.emoji, image, qty: 1 }];
    });
    setBump(true);
    setTimeout(() => setBump(false), 520);
    setToast(p.name);
    setTimeout(() => setToast(null), 1800);
    // fire the rainbow burst from the tap point
    setBurst({ id: Date.now() + Math.random(), x: pointer.current.x || window.innerWidth / 2, y: pointer.current.y || 120 });
  }, []);

  // clean up the burst element after it finishes
  useEffect(() => {
    if (!burst) return;
    const t = setTimeout(() => setBurst(null), 1000);
    return () => clearTimeout(t);
  }, [burst]);

  // auto-open the referral once after a short browse
  useEffect(() => {
    const t = setTimeout(() => setRefOpen(true), 16000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="min-h-screen bg-beige">
      <TopBar />
      <Header cartCount={count} bump={bump} cartRef={cartRef} onCart={() => setCartOpen(true)} />

      <main>
        <Hero onShop={() => document.getElementById('bundles')?.scrollIntoView({ behavior: 'smooth' })} />
        <BundleSection onAdd={addItem} fly={fly} />
        <ProductGrid onAdd={addItem} fly={fly} />
        <FreshnessPromise />
      </main>

      <Footer />

      {/* floating referral trigger — RTL end / bottom-left */}
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => setRefOpen(true)}
        className="fixed bottom-5 left-5 z-[60] flex items-center gap-2 rounded-full bg-copper px-4 py-3 font-display text-sm font-bold text-cream shadow-seal hover:bg-copper-dark"
      >
        <Gift className="h-5 w-5" />
        <span className="hidden sm:inline">اربح 5,000 د.ع</span>
      </motion.button>

      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        items={items}
        total={total}
        onRefer={() => {
          setCartOpen(false);
          setRefOpen(true);
        }}
      />
      <ReferralModal open={refOpen} onClose={() => setRefOpen(false)} />

      {/* rainbow burst layer */}
      <AddToCartFx burst={burst} />

      {/* add-to-cart toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            className="fixed bottom-5 right-5 z-[75]"
          >
            <div className="flex items-center gap-2 rounded-2xl bg-brand-900 px-4 py-3 text-cream shadow-card">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-brand-700">
                <Check className="h-4 w-4" />
              </span>
              <span className="font-body text-sm">
                أُضيف <b className="font-bold">{toast}</b> إلى السلة
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
