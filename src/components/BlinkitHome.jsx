import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Mic, User, ChevronLeft, Clock, Plus, Minus, ChevronDown, Wallet,
  Home as HomeIcon, RotateCcw, LayoutGrid, ShoppingCart,
} from 'lucide-react';
import { TABS, CATEGORIES, PRODUCTS, bestsellerCats, iqd } from '../data/blinkitCatalog.js';
import { fetchStoreCatalog } from '../lib/products.js';
import { getHomeLayout } from '../lib/storefront.js';

/* ════════════════════════════════════════════════════════════════
   «اطلبها» — رئيسية بنمط Blinkit:
   هيدر متقلّص (تبويبات + خلفية صورة/فيديو) → بانر ترحيب → الأكثر مبيعاً
   (كولاج) → تسوّق حسب القسم (شبكة ٤ أعمدة بأيقونات الأقسام).
   • مع ?real=1 : يقرأ الكتالوج + تخطيط الواجهة (تبويبات/بانرات/إعدادات) من الأدمن.
   ════════════════════════════════════════════════════════════════ */

const DELIVERY = 10;
const BG_TILE = '#F8F1C3';

const normProduct = (p) => ({
  ...p,
  old: p.old ?? p.oldPrice ?? null,
  cat: p.cat ?? p.tag ?? null,
  mins: p.mins ?? 13,
  rating: p.rating || 4.5,
  ratingCount: p.ratingCount || 0,
  image: p.image || null,
});

/* ───────────────────────── الهيدر (تبويبات + خلفية + تقلّص) ───────────────────────── */
const HINTS = ['طماطم', 'حليب', 'رز عنبر', 'شوكولا', 'دجاج', 'عصير'];
function Header({ tabs, tab, setTab, theme, collapsed, count, deliveryMinutes, media, fade }) {
  const [hint, setHint] = useState(0);
  useEffect(() => { const t = setInterval(() => setHint((x) => (x + 1) % HINTS.length), 2200); return () => clearInterval(t); }, []);
  const hasMedia = media && (media.image || media.video);
  return (
    <header className="sticky top-0 z-40 transition-[background-color,box-shadow] duration-300" style={{ background: collapsed ? '#ffffff' : theme, boxShadow: collapsed ? '0 8px 20px -14px rgba(0,0,0,0.35)' : 'none' }}>
      {hasMedia && !collapsed && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden" style={{ opacity: 1 - fade }}>
          {media.video ? <video src={media.video} className="h-full w-full object-cover" autoPlay loop muted playsInline /> : <img src={media.image} alt="" className="h-full w-full object-cover" />}
          <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, rgba(255,255,255,${media.overlay ?? 0.18}), rgba(255,255,255,0) 55%)` }} />
        </div>
      )}
      <motion.div initial={false} animate={{ height: collapsed ? 0 : 'auto', opacity: collapsed ? 0 : 1 }} transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }} className="relative overflow-hidden">
        <div className="flex items-start justify-between gap-2 px-4 pt-3">
          <div className="min-w-0">
            <span className="font-body text-[12px] font-bold text-blink-ink/70">🛒 اطلبها · توصيل</span>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-[26px] font-black leading-none text-blink-ink">خلال {deliveryMinutes} دقيقة</h1>
              <span className="rounded-full bg-blink-ink px-1.5 py-0.5 font-display text-[10px] font-black text-blink-yellow">24/7</span>
            </div>
            <button className="mt-1 flex items-center gap-1 text-blink-ink/85">
              <span className="font-body text-[13px] font-black">المنزل</span>
              <span className="truncate font-body text-[13px]">· السماوة، الحي الشرقي</span>
              <ChevronDown className="h-4 w-4 shrink-0" />
            </button>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button className="grid h-9 w-9 place-items-center rounded-full bg-white/55 text-blink-green ring-1 ring-black/5" aria-label="المحفظة"><Wallet className="h-5 w-5" /></button>
            <button className="grid h-9 w-9 place-items-center rounded-full bg-white/55 text-blink-ink ring-1 ring-black/5" aria-label="حسابي"><User className="h-5 w-5" /></button>
          </div>
        </div>
      </motion.div>

      <div className="relative flex items-center gap-2 px-4 pt-2.5">
        <AnimatePresence initial={false}>
          {collapsed && count > 0 && (
            <motion.button initial={{ width: 0, opacity: 0 }} animate={{ width: 40, opacity: 1 }} exit={{ width: 0, opacity: 0 }} transition={{ duration: 0.22 }} className="relative grid h-10 shrink-0 place-items-center overflow-hidden rounded-full bg-blink-green text-white" aria-label="السلّة">
              <ShoppingCart className="h-5 w-5" />
              <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-[16px] place-items-center rounded-full bg-blink-ink px-1 text-[9px] font-black ring-2 ring-white">{count}</span>
            </motion.button>
          )}
        </AnimatePresence>
        <div className="flex w-full items-center gap-2.5 rounded-xl bg-white px-3.5 py-3 shadow-sm ring-1 ring-black/10">
          <Search className="h-5 w-5 shrink-0 text-blink-ink/60" />
          <span className="flex-1 truncate font-body text-[14px] text-blink-sub">
            ابحث عن «
            <AnimatePresence mode="wait">
              <motion.span key={hint} initial={{ y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -8, opacity: 0 }} transition={{ duration: 0.25 }} className="inline-block font-bold text-blink-ink/70">{HINTS[hint]}</motion.span>
            </AnimatePresence>
            » والمزيد
          </span>
          <Mic className="h-5 w-5 shrink-0 text-blink-ink/60" />
        </div>
      </div>

      {/* تبويبات الأقسام */}
      <div className="relative mt-1 flex gap-5 overflow-x-auto px-4 pb-1.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className="flex shrink-0 flex-col items-center gap-0.5 pb-1">
            {t.iconImage ? <img src={t.iconImage} alt="" className="h-[22px] w-[22px] object-contain" /> : <span className="text-[20px]">{t.icon}</span>}
            <span className={`font-body text-[12px] font-bold ${tab === t.id ? 'text-blink-ink' : 'text-blink-ink/55'}`}>{t.label}</span>
            <span className={`h-0.5 w-6 rounded-full ${tab === t.id ? 'bg-blink-ink' : 'bg-transparent'}`} />
          </button>
        ))}
      </div>
    </header>
  );
}

/* ───────────────────────── بانر الترحيب (بخلفية صورة/فيديو) ───────────────────────── */
function WelcomeBanner({ theme, banner, deliveryMinutes, welcome, media }) {
  const title = banner?.title || welcome?.title || 'أهلاً بك في اطلبها 👋';
  const subtitle = banner?.subtitle || welcome?.subtitle || 'اطلب الآن واستمتع بتوصيل مجاني داخل السماوة';
  const img = banner?.image || media?.image || null;
  const vid = !banner?.image && media?.video ? media.video : null;
  const hasMedia = !!(img || vid);
  return (
    <div className="px-4 pt-3">
      <div className="relative overflow-hidden rounded-2xl px-5 py-4" style={{ background: hasMedia ? undefined : `linear-gradient(110deg, ${banner?.theme || theme}, #ffffff)`, minHeight: hasMedia ? 120 : undefined }}>
        {vid ? <video src={vid} className="absolute inset-0 h-full w-full object-cover" autoPlay loop muted playsInline />
          : img ? <img src={img} alt="" className="absolute inset-0 h-full w-full object-cover" /> : null}
        {hasMedia && <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, rgba(255,255,255,${(media?.overlay ?? 0.18) + 0.05}), rgba(255,255,255,0))` }} />}
        <div className="relative">
          <p className="font-display text-[19px] font-black leading-tight text-blink-ink">{title}</p>
          <p className="mt-1 font-body text-[13px] font-bold text-blink-ink/75">{subtitle}</p>
          <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-blink-ink px-3 py-1.5 font-display text-[12px] font-black text-blink-yellow"><Clock className="h-3.5 w-3.5" /> {banner?.cta_label || `خلال ${deliveryMinutes} دقيقة`}</span>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────── الأكثر مبيعاً (كولاج) ───────────────────────── */
function CollageTile({ cat, prods }) {
  const slots = [prods[0], prods[1], prods[2]];
  return (
    <button className="flex w-[130px] shrink-0 flex-col text-right">
      <div className="grid grid-cols-2 gap-1.5 rounded-2xl p-1.5" style={{ background: BG_TILE }}>
        {slots.map((p, i) => (
          <span key={i} className="grid aspect-square place-items-center overflow-hidden rounded-xl bg-white text-2xl">
            {p ? (p.image ? <img src={p.image} alt="" loading="lazy" className="h-full w-full object-contain p-1 mix-blend-multiply" /> : p.emoji) : null}
          </span>
        ))}
        <span className="grid aspect-square place-items-center rounded-xl bg-white font-display text-[14px] font-black text-blink-ink/70">+{cat.count}</span>
      </div>
      <span className="mt-1.5 line-clamp-2 font-body text-[12.5px] font-black leading-tight text-blink-ink">{cat.name}</span>
      <span className="font-body text-[11px] text-blink-sub">{cat.count} منتج</span>
    </button>
  );
}
function BestSellers({ cats, prods }) {
  if (!cats.length) return null;
  return (
    <section className="px-4 pt-4">
      <h2 className="mb-3 font-display text-[18px] font-black text-blink-ink">الأكثر مبيعاً</h2>
      <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {cats.map((c) => <CollageTile key={c.id} cat={c} prods={prods.filter((p) => p.cat === c.id)} />)}
      </div>
    </section>
  );
}

/* ───────────────────────── تسوّق حسب القسم ───────────────────────── */
function ShopByCategory({ cats }) {
  if (!cats.length) return null;
  return (
    <section className="px-4 pb-4 pt-7">
      <h2 className="mb-3 font-display text-[18px] font-black text-blink-ink">تسوّق حسب القسم</h2>
      <div className="grid grid-cols-4 gap-x-2.5 gap-y-4">
        {cats.map((c) => (
          <button key={c.id} className="flex flex-col items-center gap-1.5">
            <span className="grid aspect-square w-full place-items-center overflow-hidden rounded-2xl p-1.5 ring-1 ring-black/5" style={{ background: BG_TILE }}>
              {c.image ? <img src={c.image} alt={c.name} loading="lazy" className="h-full w-full object-contain" /> : <span className="text-[34px]">{c.emoji}</span>}
            </span>
            <span className="line-clamp-2 text-center font-body text-[11px] font-bold leading-tight text-blink-ink/85">{c.name}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

/* ───────────────────────── شريط التنقّل السفلي + شريط السلّة ───────────────────────── */
function BottomNav() {
  const items = [
    { icon: HomeIcon, label: 'الرئيسية', active: true },
    { icon: RotateCcw, label: 'اطلب مجدداً' },
    { icon: LayoutGrid, label: 'الأقسام' },
    { icon: User, label: 'حسابي' },
  ];
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t border-blink-line bg-white px-2 pb-1.5 pt-2">
      {items.map((it) => (
        <button key={it.label} className={`flex flex-col items-center gap-0.5 ${it.active ? 'text-blink-ink' : 'text-blink-sub'}`}>
          <it.icon className={`h-5 w-5 ${it.active ? 'text-amber-500' : ''}`} />
          <span className="font-body text-[10.5px] font-bold">{it.label}</span>
          {it.active && <span className="h-0.5 w-5 rounded-full bg-blink-ink" />}
        </button>
      ))}
    </nav>
  );
}
function CartBar({ count, total }) {
  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.div initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }} transition={{ type: 'spring', stiffness: 380, damping: 32 }} className="fixed bottom-[60px] left-1/2 z-40 w-[calc(100%-1.5rem)] max-w-md -translate-x-1/2">
          <button className="flex w-full items-center justify-between rounded-xl bg-blink-green px-4 py-2.5 text-white shadow-lg active:scale-[0.99]">
            <span className="flex items-center gap-2.5"><span className="grid h-9 w-9 place-items-center rounded-lg bg-white/15"><ShoppingCart className="h-5 w-5" /></span><span className="text-right leading-tight"><span className="block font-display text-[14px] font-black">{count} منتج</span><span className="block font-body text-[11px] text-white/85">{iqd(total)} د.ع</span></span></span>
            <span className="flex items-center gap-0.5 font-display text-[14px] font-black">عرض السلّة <ChevronLeft className="h-5 w-5" /></span>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ════════════════════════════════ الصفحة ════════════════════════════════ */
export default function BlinkitHome() {
  const [tab, setTab] = useState('all');
  const [items] = useState([]);
  const [collapsed, setCollapsed] = useState(false);
  const [fade, setFade] = useState(0);
  const [real, setReal] = useState(null);
  const [layout, setLayout] = useState(null);

  useEffect(() => {
    let on = true;
    try {
      const want = new URLSearchParams(window.location.search).get('real');
      if (want === '1' || want === 'true') {
        fetchStoreCatalog().then((res) => { if (on && res && Array.isArray(res.products) && res.products.length) setReal(res); });
        getHomeLayout().then((res) => { if (on && res && !res.error) setLayout(res); });
      }
    } catch { /* ignore */ }
    return () => { on = false; };
  }, []);

  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => { const y = window.scrollY; setCollapsed(y > 56); setFade(Math.min(1, y / 120)); ticking = false; });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const total = items.reduce((s, i) => s + i.price * i.qty, 0);
  const count = items.reduce((s, i) => s + i.qty, 0);

  // تبويبات / لون / إعدادات / بانر / خلفية (يتحكّم بها الأدمن في الوضع الحقيقي)
  const tabsList = (real && layout?.tabs?.length)
    ? layout.tabs.map((t) => ({ id: t.key, label: t.label, icon: t.icon || '🛒', iconImage: t.icon_image || null, theme: t.theme || '#FBCB25' }))
    : TABS;
  const theme = tabsList.find((t) => t.id === tab)?.theme || '#FBCB25';
  const cfg = (real && layout?.config) || null;
  const deliveryMinutes = cfg?.delivery_minutes || DELIVERY;
  const welcome = cfg ? { title: cfg.welcome_title, subtitle: cfg.welcome_subtitle } : null;
  const banner = (real && layout?.banners?.length) ? (layout.banners.find((b) => b.tab === tab) || layout.banners.find((b) => b.tab === 'all') || null) : null;
  const override = useMemo(() => {
    try { const p = new URLSearchParams(window.location.search); const img = p.get('hero'); const vid = p.get('herovid'); if (img || vid) return { image: img || null, video: vid || null, overlay: 0.18 }; } catch { /* ignore */ }
    return null;
  }, []);
  const media = override || (cfg && (cfg.header_image || cfg.header_video) ? { image: cfg.header_image || null, video: cfg.header_video || null, overlay: cfg.header_overlay ?? 0.18 } : null);

  // البيانات (الحقيقية عند توفّرها، وإلا التجريبية بالأقسام الـ٢٠)
  const { cats, bestCats, prods } = useMemo(() => {
    if (real) {
      const products = real.products.map(normProduct);
      const counts = {};
      products.forEach((p) => { if (p.cat) counts[p.cat] = (counts[p.cat] || 0) + 1; });
      const rcats = (real.categories || []).filter((c) => c.name && c.name !== 'الكل').map((c) => ({ id: c.name, name: c.name, image: c.image, emoji: c.emoji || '🛒' }));
      const best = rcats.map((c) => ({ ...c, count: counts[c.id] || 0 })).filter((c) => c.count > 0).sort((a, b) => b.count - a.count).slice(0, 8);
      return { cats: rcats, bestCats: best, prods: products };
    }
    return { cats: CATEGORIES, bestCats: bestsellerCats(), prods: PRODUCTS.map(normProduct) };
  }, [real]);

  return (
    <div className="min-h-screen bg-white pb-28 font-body" dir="rtl">
      <Header tabs={tabsList} tab={tab} setTab={setTab} theme={theme} collapsed={collapsed} count={count} deliveryMinutes={deliveryMinutes} media={media} fade={fade} />
      <AnimatePresence mode="wait">
        <motion.main key={tab} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}>
          <WelcomeBanner theme={theme} banner={banner} welcome={welcome} deliveryMinutes={deliveryMinutes} media={media} />
          <BestSellers cats={bestCats} prods={prods} />
          <ShopByCategory cats={cats} />
        </motion.main>
      </AnimatePresence>
      <CartBar count={count} total={total} />
      <BottomNav />
    </div>
  );
}
