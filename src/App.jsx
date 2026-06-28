import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Truck, Leaf, ShieldCheck, Check, Search, Sparkles } from 'lucide-react';

import Header from './components/Header.jsx';
import PromoCarousel from './components/PromoCarousel.jsx';
import BundleSection, { BundleDetailModal } from './components/BundleSection.jsx';
import ProductGrid from './components/ProductGrid.jsx';
import StoresSection from './components/StoresSection.jsx';
import Footer from './components/Footer.jsx';
import CategoryGrid from './components/CategoryGrid.jsx';
import ProductRail from './components/ProductRail.jsx';
import CartBar from './components/CartBar.jsx';
import CartDrawer from './components/CartDrawer.jsx';
import CheckoutModal from './components/CheckoutModal.jsx';
import AuthModal from './components/AuthModal.jsx';
import AccountDrawer from './components/AccountDrawer.jsx';
import SearchModal from './components/SearchModal.jsx';
import { useAuth } from './lib/auth.jsx';
import { listMyOrders } from './lib/orders.js';
import { useFlyToCart, fadeUp, viewportOnce, useBackClose } from './lib/motion.js';
import { PRODUCTS, BUNDLES, CATEGORIES } from './data/catalog.js';
import { fetchStoreCatalog, storeMyFollows, storeToggleFollow, getSettings } from './lib/products.js';
import { SETTINGS, applySettings, withMarkup } from './config.js';

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
  const [items, setItems] = useState(() => {
    try { const raw = localStorage.getItem('otlobha-cart'); return raw ? JSON.parse(raw) : []; } catch { return []; }
  });
  // keep the cart across reloads
  useEffect(() => {
    try { localStorage.setItem('otlobha-cart', JSON.stringify(items)); } catch { /* ignore quota */ }
  }, [items]);
  const [myActiveOrder, setMyActiveOrder] = useState(null);
  const [products, setProducts] = useState(PRODUCTS);
  const [categories, setCategories] = useState(CATEGORIES);
  const [subcategories, setSubcategories] = useState([]);
  const [bundles, setBundles] = useState(BUNDLES);
  const [stores, setStores] = useState([]);
  const [activeStore, setActiveStore] = useState(null);
  const [cat, setCat] = useState('الكل');
  const [followIds, setFollowIds] = useState([]);
  const [bump, setBump] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const { cartRef, fly } = useFlyToCart();
  const { account } = useAuth();

  // load the customer's most recent active order for the cart mini-tracker
  useEffect(() => {
    if (!account?.id) { setMyActiveOrder(null); return; }
    let alive = true;
    listMyOrders(account.id).then((res) => {
      if (!alive || !res?.ok) return;
      const active = (res.orders || []).filter((o) => o.status !== 'done' && o.status !== 'cancelled');
      setMyActiveOrder(active[0] || null);
    });
    return () => { alive = false; };
  }, [account?.id, cartOpen]);

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
      m = path.match(/^\/b\/([^/?#]+)/);
      if (m) return { type: 'bundle', id: decodeURIComponent(m[1]) };
      if (sp.get('b')) return { type: 'bundle', id: sp.get('b') };
    } catch (e) {}
    return null;
  }, []);

  // load the live catalog (products + categories) from the database. Falls back
  // to the bundled catalog if Supabase is off or the request fails, so the
  // store always renders instantly and never goes blank.
  const [, setSettingsTick] = useState(0);
  useEffect(() => {
    let alive = true;
    getSettings().then((s) => { if (alive && s) { applySettings(s); setSettingsTick((t) => t + 1); } });
    fetchStoreCatalog().then((res) => {
      if (!alive || !res) return;
      if (Array.isArray(res.products) && res.products.length) setProducts(res.products);
      if (Array.isArray(res.categories) && res.categories.length) setCategories(res.categories);
      if (Array.isArray(res.subcategories)) setSubcategories(res.subcategories);
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

  // if arriving via a bundle share link (/b/{id}), open that bundle's details once loaded
  const [deepBundle, setDeepBundle] = useState(null);
  useEffect(() => {
    if (deepLink?.type === 'bundle' && bundles.length) {
      const b = bundles.find((x) => String(x.id) === String(deepLink.id));
      if (b) setDeepBundle(b);
    }
    // eslint-disable-next-line
  }, [bundles]);

  // sync the customer's followed stores from their account (cross-device)
  useEffect(() => {
    if (!account?.id) { setFollowIds([]); return; }
    let alive = true;
    storeMyFollows(account.id).then((r) => {
      if (alive && r?.ok && Array.isArray(r.store_ids)) setFollowIds(r.store_ids);
    });
    return () => { alive = false; };
  }, [account]);

  const toggleFollow = useCallback(async (storeId) => {
    if (!account?.id) { setAuthOpen(true); return; }
    const wasFollowing = followIds.includes(storeId);
    setFollowIds((prev) => (wasFollowing ? prev.filter((x) => x !== storeId) : [...prev, storeId])); // optimistic
    const r = await storeToggleFollow(account.id, storeId);
    if (r?.ok) {
      setFollowIds((prev) => {
        const has = prev.includes(storeId);
        if (r.following && !has) return [...prev, storeId];
        if (!r.following && has) return prev.filter((x) => x !== storeId);
        return prev;
      });
      setStores((prev) => prev.map((s) => (s.id === storeId ? { ...s, followersCount: r.followers } : s)));
    } else {
      setFollowIds((prev) => (wasFollowing ? [...prev, storeId] : prev.filter((x) => x !== storeId))); // revert
    }
  }, [account, followIds]);

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

  const addItem = useCallback((p, qty = 1) => {
    const n = Math.max(1, qty | 0);
    setItems((prev) => {
      const found = prev.find((i) => i.key === p.id);
      if (found) return prev.map((i) => (i.key === p.id ? { ...i, qty: i.qty + n } : i));
      // bundles carry an `emojis` array; products carry a single `emoji`
      const image = p.emojis ? (p.images?.[0] ?? p.image) : p.image;
      return [...prev, { key: p.id, name: p.name, price: p.price, base: p.basePrice ?? p.price, mk: p.markupPct ?? 0, emoji: p.emojis ? '🧺' : p.emoji, image, qty: n, storeId: p.storeId ?? null }];
    });
    setBump(true);
    setTimeout(() => setBump(false), 520);
    setToast(p.name);
    setTimeout(() => setToast(null), 1800);
  }, []);

  // cart line controls
  const incItem = useCallback((key) => {
    setItems((prev) => prev.map((i) => (i.key === key ? { ...i, qty: i.qty + 1 } : i)));
  }, []);
  const decItem = useCallback((key) => {
    setItems((prev) => prev.flatMap((i) => {
      if (i.key !== key) return [i];
      return i.qty <= 1 ? [] : [{ ...i, qty: i.qty - 1 }];
    }));
  }, []);
  const removeItem = useCallback((key) => {
    setItems((prev) => prev.filter((i) => i.key !== key));
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
            next.push({ key: prod.id, name: prod.name, price: prod.price, base: prod.basePrice ?? prod.price, mk: prod.markupPct ?? 0, emoji: prod.emojis ? '🧺' : prod.emoji, image, qty });
          }
        } else {
          // product no longer in the catalog — keep it from the saved order data
          const k = 'past-' + oi.name;
          const idx = next.findIndex((i) => i.key === k);
          if (idx >= 0) next[idx] = { ...next[idx], qty: next[idx].qty + qty };
          else { const b = Number(oi.price) || 0; const m = Number(oi.mk) || 0; next.push({ key: k, name: oi.name, price: withMarkup(b, m), base: b, mk: m, emoji: '🛒', image: null, qty }); }
        }
      }
      return next;
    });
    setAccountOpen(false);
    setCartOpen(true);
  }, [products, bundles]);

  // homepage shows the 5 best-selling bundles across Otlobha; a store page shows that store's bundles
  const shownBundles = useMemo(() => {
    if (activeStore) return bundles.filter((b) => b.storeId === activeStore);
    return [...bundles].sort((a, b) => (b.sold || 0) - (a.sold || 0)).slice(0, 5);
  }, [bundles, activeStore]);
  const bundleHeading = activeStore
    ? { kicker: 'باقات المتجر', title: 'باقات مختارة', subtitle: 'وفّر أكثر مع باقات هذا المتجر — مكوّنات كاملة بسعر مميّز.' }
    : { kicker: 'الأكثر طلباً · وفّر أكثر', title: 'أفضل ٥ باقات في اطلبها', subtitle: 'الباقات الأكثر مبيعاً — مكوّنات وصفة كاملة بسعر أوفر من شرائها مفردة.' };

  // 🆕 Blinkit-style rails (homepage only): top sellers + today's deals
  const bestSellers = useMemo(
    () => [...products].filter((p) => (p.stock == null || p.stock > 0)).sort((a, b) => (b.sold || 0) - (a.sold || 0)).slice(0, 12),
    [products]
  );
  const deals = useMemo(
    () => products.filter((p) => p.oldPrice && (p.stock == null || p.stock > 0)).slice(0, 12),
    [products]
  );

  // entering / leaving a store resets the product filter so we never land on an empty category
  useEffect(() => { setCat('الكل'); }, [activeStore]);

  // smooth-scroll to the products grid, accounting for the sticky header + category strip
  const scrollToProducts = useCallback(() => {
    const el = document.getElementById('products');
    if (!el) return;
    const y = el.getBoundingClientRect().top + window.scrollY - 120;
    window.scrollTo({ top: y, behavior: 'smooth' });
  }, []);

  // sticky-strip tap: pick a category on the homepage, then glide down to the grid
  const pickCategory = useCallback((name) => {
    setActiveStore(null);
    setCat(name);
    setTimeout(scrollToProducts, 60);
  }, [scrollToProducts]);

  // promo-carousel CTA router
  const onPromo = useCallback((action) => {
    if (action === 'rewards') { openAccount(); return; }
    const id = action === 'bundles' ? 'bundles' : action === 'stores' ? 'stores' : 'products';
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  }, [openAccount]);


  return (
    <div className="min-h-screen bg-beige dark:bg-night">
      <TopBar />
      <Header
        cartCount={count}
        bump={bump}
        cartRef={cartRef}
        onCart={() => setCartOpen(true)}
        onAccount={openAccount}
        onSearch={() => setSearchOpen(true)}
        dark={dark}
        onToggleTheme={() => setDark((d) => !d)}
      />

      <main>
        {/* prominent search entry (opens the smart search + AI assistant) */}
        <div className="bg-beige pt-5 dark:bg-night">
          <div className="mx-auto max-w-7xl px-4 sm:px-8">
            <button
              onClick={() => setSearchOpen(true)}
              className="flex w-full items-center gap-3 rounded-2xl bg-white px-4 py-3.5 text-right shadow-soft ring-1 ring-ink/10 transition hover:ring-copper/40 dark:bg-night-800 dark:ring-white/10"
            >
              <Search className="h-5 w-5 shrink-0 text-copper" />
              <span className="flex-1 font-body text-[15px] text-ink/45 dark:text-cream/45">دور على منتج، متجر، أو اكتب وصفة…</span>
              <span className="hidden items-center gap-1 rounded-full bg-brand-800/10 px-2.5 py-1 font-body text-[11px] font-bold text-brand-800 dark:bg-white/10 dark:text-cream sm:flex">
                <Sparkles className="h-3.5 w-3.5" /> مساعد ذكي
              </span>
            </button>
            {/* value strip — يوصّل القيمة من أول نظرة */}
            <div className="mt-2.5 flex items-center justify-center gap-4 font-body text-[11.5px] font-bold text-ink/55 dark:text-cream/55 sm:gap-7">
              <span className="flex items-center gap-1">🚚 توصيل سريع</span>
              <span className="flex items-center gap-1">💵 دفع عند الاستلام</span>
              <span className="flex items-center gap-1">⭐ تقييمات حقيقية</span>
            </div>
          </div>
        </div>

        <PromoCarousel onAction={onPromo} />
        {!activeStore && (
          <CategoryGrid categories={categories} onPick={pickCategory} />
        )}
        {!activeStore && (
          <ProductRail
            kicker="🔥 الأكثر طلباً في السماوة"
            title="الأكثر مبيعاً"
            products={bestSellers}
            onAdd={addItem}
            fly={fly}
            onSeeAll={() => pickCategory('الكل')}
            account={account}
            onRequireLogin={() => setAuthOpen(true)}
          />
        )}
        <StoresSection
          stores={stores}
          activeStore={activeStore}
          followIds={followIds}
          onToggleFollow={toggleFollow}
          onSelect={(id) => {
            setActiveStore(id);
            if (id) setTimeout(() => document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' }), 60);
          }}
        />
        {!activeStore && (
          <ProductRail
            kicker="💸 وفّر اليوم"
            title="عروض وخصومات"
            products={deals}
            onAdd={addItem}
            fly={fly}
            onSeeAll={() => pickCategory('الكل')}
            account={account}
            onRequireLogin={() => setAuthOpen(true)}
          />
        )}
        <BundleSection bundles={shownBundles} onAdd={addItem} fly={fly} title={bundleHeading.title} subtitle={bundleHeading.subtitle} kicker={bundleHeading.kicker} />
        <ProductGrid
          products={products}
          categories={categories}
          subcategories={subcategories}
          onAdd={addItem}
          fly={fly}
          cat={cat}
          onCat={setCat}
          hideChips={!activeStore}
          openProductId={deepLink?.type === 'product' ? deepLink.id : null}
          initialCat={deepLink?.type === 'category' ? deepLink.name : null}
          storeFilter={activeStore}
          store={activeStore ? (stores.find((s) => s.id === activeStore) || null) : null}
          onClearStore={() => setActiveStore(null)}
          account={account}
          onRequireLogin={() => setAuthOpen(true)}
          followIds={followIds}
          onToggleFollow={toggleFollow}
        />
        <FreshnessPromise />
      </main>

      <Footer />
      {/* مساحة أسفل الصفحة حتى شريط السلّة العائم ما يغطّي آخر محتوى */}
      {count > 0 && <div aria-hidden="true" className="h-24" />}

      {/* sticky cart bar — أقوى محفّز شراء (يظهر لمّا تكون السلّة مليانة) */}
      <CartBar count={count} total={total} freeOver={SETTINGS.free_delivery_over} onOpen={() => setCartOpen(true)} />

      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        items={items}
        total={total}
        onInc={incItem}
        onDec={decItem}
        onRemove={removeItem}
        lastOrder={myActiveOrder}
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
      <SearchModal
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        products={products}
        stores={stores}
        categories={categories}
        bundles={bundles}
        onAddProduct={addItem}
        onSelectStore={(id) => { setSearchOpen(false); setActiveStore(id); setTimeout(scrollToProducts, 80); }}
        onPickCategory={(name) => { setSearchOpen(false); pickCategory(name); }}
        onOpenBundle={(b) => { setSearchOpen(false); setDeepBundle(b); }}
      />
      {deepBundle && <BundleDetailModal b={deepBundle} onAdd={addItem} onClose={() => setDeepBundle(null)} />}

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
