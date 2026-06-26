import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Truck, Leaf, ShieldCheck, Gift, Check, MessageCircle } from 'lucide-react';

import Header from './components/Header.jsx';
import Hero from './components/Hero.jsx';
import BundleSection from './components/BundleSection.jsx';
import ProductGrid from './components/ProductGrid.jsx';
import StoresSection from './components/StoresSection.jsx';
import Footer from './components/Footer.jsx';
import CartDrawer from './components/CartDrawer.jsx';
import CheckoutModal from './components/CheckoutModal.jsx';
import AuthModal from './components/AuthModal.jsx';
import AccountDrawer from './components/AccountDrawer.jsx';
import { useAuth } from './lib/auth.jsx';
import { useFlyToCart, fadeUp, viewportOnce, useBackClose } from './lib/motion.js';
import { PRODUCTS, BUNDLES, CATEGORIES } from './data/catalog.js';
import { fetchStoreCatalog } from './lib/products.js';
import { WHATSAPP_NUMBER } from './config.js';

/* ── slim promo bar ── */
function TopBar() {
  return (
    <div className="bg-brand-950 font-body text-[12px] text-cream/85 dark:bg-black sm:text-[13px]">
      <div className="mx-auto flex max-w-7xl items-center justify-center gap-2 px-4 py-2 text-center">
        <Truck className="h-4 w-4 shrink-0 text-copper-light" />
        <span>
          توصيل <b className="font-bold text-copper-light">مجاني</b> داخل السماوة — ونصل بأسرع وقت إلى باب بيتك
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
  const [products, setProducts] = useState(PRODUCTS);
  const [categories, setCategories] = useState(CATEGORIES);
  const [bundles, setBundles] = useState(BUNDLES);
  const [stores, setStores] = useState([]);
  const [activeStore, setActiveStore] = useState(null);
  const [bump, setBump] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const { cartRef, fly } = useFlyToCart();
  const { account } = useAuth();

  // open account if signed in, otherwise prompt sign-in
  const openAccount = useCallback(() => {
    if (account) setAccountOpen(true);
    else setAuthOpen(true);
  }, [account]);

  // one shared Back-button handler for every overlay (drawer/modal).
  // because it watches "is anything open", switching cart→checkout keeps it
  // open the whole time, so no history churn closes the next overlay.
  const anyOverlayOpen = cartOpen || checkoutOpen || authOpen || accountOpen;
  const closeAllOverlays = useCallback(() => {
    setCartOpen(false);
    setCheckoutOpen(false);
    setAuthOpen(false);
    setAccountOpen(false);
  }, []);
  useBackClose(anyOverlayOpen, closeAllOverlays);

  // capture a referral code from the share link (?ref=CODE) for signup
  useEffect(() => {
    try {
      const ref = new URLSearchParams(window.location.search).get('ref');
      if (ref) localStorage.setItem('otlobha-ref', ref.toUpperCase());
    } catch (e) {}
  }, []);

  // share-link target: /p/{id} opens a product · /c/{name} filters a category
  const deepLink = useMemo(() => {
    try {
      const path = window.location.pathname;
      const sp = new URLSearchParams(window.location.search);
      let m = path.match(/^\/p\/([^/?#]+)/);
      if (m) return { type: 'product', id: decodeURIComponent(m[1]) };
      if (sp.get('p')) return { type: 'product', id: sp.get('p') };
      m = path.match(/^\/c\/([^/?#]+)/);
      if (m) return { type: 'category', name: decodeURIComponent(m[1]) };
      if (sp.get('c')) return { type: 'category', name: sp.get('c') };
      m = path.match(/^\/s\/([^/?#]+)/);
      if (m) return { type: 'store', name: decodeURIComponent(m[1]) };
      if (sp.get('s')) return { type: 'store', name: sp.get('s') };
    } catch (e) {}
    return null;
  }, []);

  // load the live catalog (products + categories) from the database. Falls back
  // to the bundled catalog if Supabase is off or the request fails, so the
  // store always renders instantly and never goes blank.
  useEffect(() => {
    let alive = true;
    fetchStoreCatalog().then((res) => {
      if (!alive || !res) return;
      if (Array.isArray(res.products) && res.products.length) setProducts(res.products);
      if (Array.isArray(res.categories) && res.categories.length) setCategories(res.categories);
      if (Array.isArray(res.bundles) && res.bundles.length) setBundles(res.bundles);
      if (Array.isArray(res.stores)) setStores(res.stores);    });
    return () => {
      alive = false;
    };
  }, []);

  // if arriving via a store share link (/s/{name}), open that store once loaded
  useEffect(() => {
    if (deepLink?.type === 'store' && stores.length) {
      const s = stores.find((x) => x.name === deepLink.name);
      if (s) {
        setActiveStore(s.id);
        setTimeout(() => document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' }), 80);
      }
    }
    // eslint-disable-next-line
  }, [stores]);

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

  // (removed the intrusive auto-popup; rewards now live in the account panel)

  // "أعد الطلب" — re-add a past order's items to the cart (matched by name to
  // the live catalog so they carry the right id/image), then open the cart.
  const reorder = useCallback((orderItems) => {
    if (!Array.isArray(orderItems) || orderItems.length === 0) return;
    const catalog = [...products, ...bundles];
    setItems((prev) => {
      const next = [...prev];
      for (const oi of orderItems) {
        const qty = Math.max(1, Number(oi.qty) || 1);
        const prod = catalog.find((p) => p.name === oi.name);
        if (prod) {
          const idx = next.findIndex((i) => i.key === prod.id);
          if (idx >= 0) {
            next[idx] = { ...next[idx], qty: next[idx].qty + qty };
          } else {
            const image = prod.emojis ? (prod.images?.[0] ?? prod.image) : prod.image;
            next.push({ key: prod.id, name: prod.name, price: prod.price, emoji: prod.emojis ? '🧺' : prod.emoji, image, qty });
          }
        } else {
          // product no longer in the catalog — keep it from the saved order data
          const k = 'past-' + oi.name;
          const idx = next.findIndex((i) => i.key === k);
          if (idx >= 0) next[idx] = { ...next[idx], qty: next[idx].qty + qty };
          else next.push({ key: k, name: oi.name, price: Number(oi.price) || 0, emoji: '🛒', image: null, qty });
        }
      }
      return next;
    });
    setAccountOpen(false);
    setCartOpen(true);
  }, [products, bundles]);

  return (
    <div className="min-h-screen bg-beige dark:bg-night">
      <TopBar />
      <Header
        cartCount={count}
        bump={bump}
        cartRef={cartRef}
        onCart={() => setCartOpen(true)}
        onAccount={openAccount}
        dark={dark}
        onToggleTheme={() => setDark((d) => !d)}
      />

      <main>
        <Hero onShop={() => document.getElementById('stores')?.scrollIntoView({ behavior: 'smooth' })} />
        <StoresSection
          stores={stores}
          activeStore={activeStore}
          onSelect={(id) => {
            setActiveStore(id);
            if (id) setTimeout(() => document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' }), 60);
          }}
        />
        <BundleSection bundles={bundles} onAdd={addItem} fly={fly} />
        <ProductGrid
          products={products}
          categories={categories}
          onAdd={addItem}
          fly={fly}
          openProductId={deepLink?.type === 'product' ? deepLink.id : null}
          initialCat={deepLink?.type === 'category' ? deepLink.name : null}
          storeFilter={activeStore}
          storeName={activeStore ? (stores.find((s) => s.id === activeStore)?.name || '') : ''}
        />
        <FreshnessPromise />
      </main>

      <Footer />

      {/* floating rewards trigger — RTL end / bottom-left */}
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={openAccount}
        className="fixed bottom-5 left-5 z-[60] flex items-center gap-2 rounded-full bg-copper px-4 py-3 font-display text-sm font-bold text-cream shadow-seal hover:bg-copper-dark"
      >
        <Gift className="h-5 w-5" />
        <span className="hidden sm:inline">{account ? 'محفظتي' : 'اربح 5,000 د.ع'}</span>
      </motion.button>

      {/* floating WhatsApp customer-service button — bottom-right */}
      <motion.a
        href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('مرحباً، لديّ استفسار 🙏')}`}
        target="_blank"
        rel="noreferrer"
        whileTap={{ scale: 0.92 }}
        whileHover={{ scale: 1.06 }}
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.6, type: 'spring' }}
        className="fixed bottom-5 right-5 z-[60] grid h-14 w-14 place-items-center rounded-full bg-[#25D366] text-white shadow-seal hover:bg-[#1ebe5d]"
        aria-label="تواصل معنا عبر واتساب"
        title="خدمة العملاء — واتساب"
      >
        <MessageCircle className="h-7 w-7" />
      </motion.a>

      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        items={items}
        total={total}
        onRefer={() => {
          setCartOpen(false);
          openAccount();
        }}
        onCheckout={() => {
          if (items.length === 0) return;
          setCartOpen(false);
          setCheckoutOpen(true);
        }}
      />
      <CheckoutModal
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        items={items}
        total={total}
        profile={account}
      />
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
      <AccountDrawer open={accountOpen} onClose={() => setAccountOpen(false)} onReorder={reorder} />

      {/* add-to-cart toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            className="fixed bottom-24 right-5 z-[75]"
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
