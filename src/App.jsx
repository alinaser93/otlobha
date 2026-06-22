import { useCallback, useEffect, useState } from 'react';
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

/* ── slim promo bar ── */
function TopBar() {
  return (
    <div className="bg-brand-950 font-body text-[12px] text-cream/85 dark:bg-black sm:text-[13px]">
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
    <section className="bg-brand-900 py-16 dark:bg-night-800 sm:py-20">
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
  const { cartRef, fly } = useFlyToCart();

  // ── theme (dark / light) ──
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'));
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', dark);
    try {
      localStorage.setItem('otlobha-theme', dark ? 'dark' : 'light');
    } catch (e) {}
  }, [dark]);

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
  }, []);

  // auto-open the referral once after a short browse
  useEffect(() => {
    const t = setTimeout(() => setRefOpen(true), 16000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="min-h-screen bg-beige dark:bg-night">
      <TopBar />
      <Header
        cartCount={count}
        bump={bump}
        cartRef={cartRef}
        onCart={() => setCartOpen(true)}
        dark={dark}
        onToggleTheme={() => setDark((d) => !d)}
      />

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

      {/* add-to-cart toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            className="fixed bottom-5 right-5 z-[75]"
          >
            <div className="flex items-center gap-2 rounded-2xl bg-brand-900 px-4 py-3 text-cream shadow-card dark:bg-night-700 dark:ring-1 dark:ring-white/10">
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
