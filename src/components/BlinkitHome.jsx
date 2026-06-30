import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Mic, User, ChevronLeft, Clock, Plus, Minus, Heart, Star,
  Home as HomeIcon, RotateCcw, LayoutGrid, ShoppingCart,
} from 'lucide-react';
import { CATEGORIES, PRODUCTS, bestsellerCats, iqd } from '../data/blinkitCatalog.js';
import { fetchStoreCatalog } from '../lib/products.js';
import { getHomeLayout } from '../lib/storefront.js';

/* ════════════════════════════════════════════════════════════════
   «اطلبها» — رئيسية مطابقة لبنية الكود المصدري (Blinkit clone):
   هيدر أصفر متقلّص (وقت توصيل + ترحيب + بحث) → الأكثر مبيعاً (كولاج)
   → تسوّق حسب القسم (شبكة ٤ أعمدة بأيقونات الأقسام).
   • مع ?real=1 : يقرأ كتالوجك الحقيقي (يتحكّم به الأدمن).
   ════════════════════════════════════════════════════════════════ */

const DELIVERY = 10;
const BG_TILE = '#F8F1C3'; // خلفية بلاطات الأقسام (bg_category في المصدر)

const normProduct = (p) => ({
  ...p,
  old: p.old ?? p.oldPrice ?? null,
  cat: p.cat ?? p.tag ?? null,
  mins: p.mins ?? 13,
  rating: p.rating || 4.5,
  ratingCount: p.ratingCount || 0,
  image: p.image || null,
});

/* ───────────────────────── زر الإضافة ↔ العدّاد (لصفحة الفئة/المنتج) ───────────────────────── */
function AddBtn({ qty, onAdd, onInc, onDec }) {
  if (qty <= 0) {
    return (
      <button onClick={(e) => { e.stopPropagation(); onAdd(); }}
        className="rounded-lg border border-blink-green bg-blink-mint px-4 py-1.5 font-display text-[13px] font-black uppercase text-blink-green shadow-sm transition active:scale-95">
        إضافة
      </button>
    );
  }
  return (
    <div className="flex h-8 w-[72px] items-center justify-between overflow-hidden rounded-lg bg-blink-green font-display font-black text-white">
      <button onClick={(e) => { e.stopPropagation(); onDec(); }} className="grid h-full w-7 place-items-center active:bg-blink-greenDk" aria-label="إنقاص"><Minus className="h-4 w-4" /></button>
      <motion.span key={qty} initial={{ scale: 0.6 }} animate={{ scale: 1 }} className="text-[14px]">{qty}</motion.span>
      <button onClick={(e) => { e.stopPropagation(); onInc(); }} className="grid h-full w-7 place-items-center active:bg-blink-greenDk" aria-label="زيادة"><Plus className="h-4 w-4" /></button>
    </div>
  );
}

/* ───────────────────────── الهيدر (متقلّص عند النزول — كالمصدر) ───────────────────────── */
const HINTS = ['طماطم', 'حليب', 'رز عنبر', 'شوكولا', 'دجاج', 'عصير'];
function Header({ collapsed, count, deliveryMinutes, welcomeText }) {
  const [hint, setHint] = useState(0);
  useEffect(() => { const t = setInterval(() => setHint((x) => (x + 1) % HINTS.length), 2200); return () => clearInterval(t); }, []);
  return (
    <header className="sticky top-0 z-40 bg-blink-yellow transition-shadow duration-300" style={{ boxShadow: collapsed ? '0 8px 20px -14px rgba(0,0,0,0.35)' : 'none' }}>
      <motion.div initial={false} animate={{ height: collapsed ? 0 : 'auto', opacity: collapsed ? 0 : 1 }} transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }} className="overflow-hidden">
        <div className="flex items-start justify-between gap-2 px-4 pt-3">
          <div className="min-w-0">
            <span className="font-body text-[12px] font-bold text-blink-ink/70">🛒 اطلبها · توصيل</span>
            <h1 className="font-display text-[26px] font-black leading-none text-blink-ink">خلال {deliveryMinutes} دقيقة</h1>
            <p className="mt-1.5 font-body text-[13px] font-black text-blink-ink/85">{welcomeText}</p>
          </div>
          <button className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/55 text-blink-ink ring-1 ring-black/5" aria-label="حسابي"><User className="h-5 w-5" /></button>
        </div>
      </motion.div>

      <div className="relative flex items-center gap-2 px-4 pb-2.5 pt-2.5">
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
    </header>
  );
}

/* ───────────────────────── بلاطة كولاج (BestSellers) ───────────────────────── */
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

/* ───────────────────────── تسوّق حسب القسم (٤ أعمدة بالأيقونات) ───────────────────────── */
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

/* ───────────────────────── شريط التنقّل السفلي ───────────────────────── */
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

/* ───────────────────────── شريط السلّة العائم ───────────────────────── */
function CartBar({ count, total }) {
  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.div initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }} transition={{ type: 'spring', stiffness: 380, damping: 32 }} className="fixed bottom-[60px] left-1/2 z-40 w-[calc(100%-1.5rem)] max-w-md -translate-x-1/2">
          <button className="flex w-full items-center justify-between rounded-xl bg-blink-green px-4 py-2.5 text-white shadow-lg active:scale-[0.99]">
            <span className="flex items-center gap-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-white/15"><ShoppingCart className="h-5 w-5" /></span>
              <span className="text-right leading-tight">
                <span className="block font-display text-[14px] font-black">{count} منتج</span>
                <span className="block font-body text-[11px] text-white/85">{iqd(total)} د.ع</span>
              </span>
            </span>
            <span className="flex items-center gap-0.5 font-display text-[14px] font-black">عرض السلّة <ChevronLeft className="h-5 w-5" /></span>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ════════════════════════════════ الصفحة ════════════════════════════════ */
export default function BlinkitHome() {
  const [items] = useState([]);
  const [collapsed, setCollapsed] = useState(false);
  const [real, setReal] = useState(null);
  const [cfg, setCfg] = useState(null);

  useEffect(() => {
    let on = true;
    try {
      const want = new URLSearchParams(window.location.search).get('real');
      if (want === '1' || want === 'true') {
        fetchStoreCatalog().then((res) => { if (on && res && Array.isArray(res.products) && res.products.length) setReal(res); });
        getHomeLayout().then((res) => { if (on && res && res.config) setCfg(res.config); });
      }
    } catch { /* ignore */ }
    return () => { on = false; };
  }, []);

  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => { setCollapsed(window.scrollY > 56); ticking = false; });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const total = items.reduce((s, i) => s + i.price * i.qty, 0);
  const count = items.reduce((s, i) => s + i.qty, 0);
  const deliveryMinutes = cfg?.delivery_minutes || DELIVERY;
  const welcomeText = cfg?.welcome_title || 'أهلاً بك في اطلبها 👋';

  // البيانات: الحقيقية عند توفّرها، وإلا التجريبية المطابقة للمصدر
  const { cats, bestCats, prods } = useMemo(() => {
    if (real) {
      const products = real.products.map(normProduct);
      const counts = {};
      products.forEach((p) => { if (p.cat) counts[p.cat] = (counts[p.cat] || 0) + 1; });
      const rcats = (real.categories || [])
        .filter((c) => c.name && c.name !== 'الكل')
        .map((c) => ({ id: c.name, name: c.name, image: c.image, emoji: c.emoji || '🛒' }));
      const best = rcats.map((c) => ({ ...c, count: counts[c.id] || 0 })).filter((c) => c.count > 0).sort((a, b) => b.count - a.count).slice(0, 8);
      return { cats: rcats, bestCats: best, prods: products };
    }
    return { cats: CATEGORIES, bestCats: bestsellerCats(), prods: PRODUCTS.map(normProduct) };
  }, [real]);

  return (
    <div className="min-h-screen bg-white pb-28 font-body" dir="rtl">
      <Header collapsed={collapsed} count={count} deliveryMinutes={deliveryMinutes} welcomeText={welcomeText} />
      <BestSellers cats={bestCats} prods={prods} />
      <ShopByCategory cats={cats} />
      <CartBar count={count} total={total} />
      <BottomNav />
    </div>
  );
}
