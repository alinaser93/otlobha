import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Mic, ChevronDown, ChevronLeft, User, Wallet, Plus, Minus,
  Clock, Heart, Star, Home as HomeIcon, RotateCcw, LayoutGrid, ShoppingCart,
} from 'lucide-react';
import {
  TABS, CATEGORIES, GROUPS, PRODUCTS, STORES, BUNDLES,
  railTopSellers, railDeals, iqd,
} from '../data/blinkitCatalog.js';

/* ════════════════════════════════════════════════════════════════
   «اطلبها» — رئيسية بنمط Blinkit (مطابقة للفيديو المرجعي).
   معزولة على /blinkit بحالة سلّة خاصة بها حتى تُعتمد، ثم تُدمج كرئيسية.
   ════════════════════════════════════════════════════════════════ */

const DELIVERY = 10;
const pct = (price, old) => (old ? Math.round((1 - price / old) * 100) : 0);

/* ───────────────────────── زر الإضافة ↔ العدّاد ───────────────────────── */
function AddBtn({ qty, onAdd, onInc, onDec, size = 'sm' }) {
  const pad = size === 'lg' ? 'px-6 py-2 text-[15px]' : 'px-4 py-1.5 text-[13px]';
  if (qty <= 0) {
    return (
      <button
        onClick={(e) => { e.stopPropagation(); onAdd(); }}
        className={`rounded-lg border border-blink-green bg-blink-mint font-display font-black uppercase text-blink-green shadow-sm transition active:scale-95 ${pad}`}
      >
        إضافة
      </button>
    );
  }
  const h = size === 'lg' ? 'h-9' : 'h-8';
  return (
    <div className={`flex items-center justify-between overflow-hidden rounded-lg bg-blink-green font-display font-black text-white ${h} ${size === 'lg' ? 'w-24' : 'w-[72px]'}`}>
      <button onClick={(e) => { e.stopPropagation(); onDec(); }} className="grid h-full w-7 place-items-center active:bg-blink-greenDk" aria-label="إنقاص"><Minus className="h-4 w-4" /></button>
      <motion.span key={qty} initial={{ scale: 0.6 }} animate={{ scale: 1 }} className="text-center text-[14px]">{qty}</motion.span>
      <button onClick={(e) => { e.stopPropagation(); onInc(); }} className="grid h-full w-7 place-items-center active:bg-blink-greenDk" aria-label="زيادة"><Plus className="h-4 w-4" /></button>
    </div>
  );
}

/* ───────────────────────── بطاقة منتج Blinkit ───────────────────────── */
function ProductCard({ p, qty, onAdd, onInc, onDec, wide }) {
  const [liked, setLiked] = useState(false);
  const d = pct(p.price, p.old);
  const catName = CATEGORIES.find((c) => c.id === p.cat)?.name;
  return (
    <div className={`relative flex shrink-0 flex-col rounded-2xl border border-blink-line bg-white p-2 ${wide ? 'w-full' : 'w-[150px] sm:w-[160px]'}`}>
      {/* صورة + شارة الخصم + قلب + زر الإضافة العائم */}
      <div className="relative rounded-xl bg-blink-bg" style={{ background: p.tint + '66' }}>
        {d > 0 && (
          <span className="absolute right-1.5 top-0 z-10 rounded-b-md bg-[#3661E0] px-1.5 pb-0.5 pt-1 font-display text-[10px] font-black leading-none text-white">
            {d}٪<br /><span className="text-[8px] font-bold">خصم</span>
          </span>
        )}
        <button onClick={() => setLiked((v) => !v)} className="absolute left-1.5 top-1.5 z-10 grid h-6 w-6 place-items-center rounded-full bg-white/80 shadow-sm" aria-label="مفضّلة">
          <Heart className={`h-3.5 w-3.5 ${liked ? 'fill-rose-500 text-rose-500' : 'text-gray-400'}`} />
        </button>
        <div className="grid h-[104px] place-items-center text-[52px]">{p.emoji}</div>
        {/* زر الإضافة يطفو على حافة الصورة السفلى (توقيع Blinkit) */}
        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2">
          <AddBtn qty={qty} onAdd={onAdd} onInc={onInc} onDec={onDec} />
        </div>
      </div>

      <div className="mt-4 flex flex-1 flex-col">
        {/* وقت التوصيل */}
        <span className="inline-flex w-fit items-center gap-1 rounded bg-gray-100 px-1.5 py-0.5 font-body text-[10px] font-bold text-blink-sub">
          <Clock className="h-3 w-3" /> {p.mins} دقيقة
        </span>
        <h3 className="mt-1 line-clamp-2 min-h-[34px] font-body text-[13px] font-bold leading-tight text-blink-ink">{p.name}</h3>
        <span className="mt-0.5 font-body text-[12px] text-blink-sub">{p.unit}</span>
        {/* السعر */}
        <div className="mt-1 flex items-center gap-1.5">
          <span className="font-display text-[15px] font-black text-blink-ink">{iqd(p.price)} د.ع</span>
          {p.old && <span className="font-body text-[11px] text-blink-sub line-through">{iqd(p.old)}</span>}
        </div>
        {/* تقييم + باقٍ */}
        <div className="mt-1 flex items-center gap-2 font-body text-[10.5px] text-blink-sub">
          <span className="inline-flex items-center gap-0.5 rounded bg-green-50 px-1 py-0.5 font-bold text-blink-green">
            <Star className="h-2.5 w-2.5 fill-blink-green" /> {p.rating}
          </span>
          <span>({iqd(p.ratingCount)})</span>
          {p.left && <span className="font-bold text-rose-500">باقٍ {p.left}</span>}
        </div>
        {catName && (
          <button className="mt-1 inline-flex w-fit items-center font-display text-[11px] font-bold text-blink-green">
            كل {catName} <ChevronLeft className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

/* ───────────────────────── صف منتجات أفقي ───────────────────────── */
function Rail({ title, products, h }) {
  if (!products.length) return null;
  return (
    <section className="px-4 pt-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-[18px] font-black text-blink-ink">{title}</h2>
        <button className="flex items-center font-display text-[13px] font-black text-blink-green">عرض الكل <ChevronLeft className="h-4 w-4" /></button>
      </div>
      <div className="-mx-4 flex gap-2.5 overflow-x-auto px-4 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {products.map((p) => (
          <ProductCard key={p.id} p={p} qty={h.qtyOf(p.id)} onAdd={() => h.add(p)} onInc={() => h.inc(p.id)} onDec={() => h.dec(p.id)} />
        ))}
      </div>
    </section>
  );
}

/* ───────────────────────── مجموعة أقسام (بلاطات) ───────────────────────── */
function CategoryGroup({ group }) {
  const cats = CATEGORIES.filter((c) => c.group === group.id);
  if (!cats.length) return null;
  return (
    <section className="px-4 pt-6">
      <h2 className="mb-3 font-display text-[18px] font-black text-blink-ink">{group.title}</h2>
      <div className="grid grid-cols-4 gap-x-2.5 gap-y-4">
        {cats.map((c) => {
          const n = PRODUCTS.filter((p) => p.cat === c.id).length;
          return (
            <button key={c.id} className="flex flex-col items-center gap-1.5">
              <span className="relative grid aspect-square w-full place-items-center overflow-hidden rounded-2xl text-[34px] ring-1 ring-black/5" style={{ background: c.tint }}>
                {c.emoji}
                {n > 0 && (
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-white/85 px-1.5 py-0.5 font-body text-[8.5px] font-bold text-blink-sub shadow-sm">
                    +{n} منتج
                  </span>
                )}
              </span>
              <span className="line-clamp-2 text-center font-body text-[11px] font-bold leading-tight text-blink-ink/85">{c.name}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

/* ───────────────────────── قسم المتاجر (Blinkit-style) ───────────────────────── */
function StoresSection() {
  return (
    <section className="px-4 pt-6">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="font-display text-[18px] font-black text-blink-ink">متاجر قريبة منك</h2>
          <p className="font-body text-[12px] text-blink-sub">اطلب من محلّك المفضّل مباشرة</p>
        </div>
        <button className="flex items-center font-display text-[13px] font-black text-blink-green">عرض الكل <ChevronLeft className="h-4 w-4" /></button>
      </div>
      <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {STORES.map((s) => (
          <button key={s.id} className="flex w-[150px] shrink-0 flex-col rounded-2xl border border-blink-line bg-white p-2.5 text-right">
            <span className="grid h-20 w-full place-items-center rounded-xl text-[40px]" style={{ background: s.tint }}>{s.emoji}</span>
            <span className="mt-2 inline-flex w-fit items-center gap-1 rounded bg-gray-100 px-1.5 py-0.5 font-body text-[10px] font-bold text-blink-sub"><Clock className="h-3 w-3" /> {s.mins} دقيقة</span>
            <h3 className="mt-1 line-clamp-1 font-body text-[13px] font-black text-blink-ink">{s.name}</h3>
            <div className="mt-0.5 flex items-center gap-1.5 font-body text-[11px] text-blink-sub">
              <span className="inline-flex items-center gap-0.5 rounded bg-green-50 px-1 font-bold text-blink-green"><Star className="h-2.5 w-2.5 fill-blink-green" /> {s.rating}</span>
              <span>{s.tag}</span>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}

/* ───────────────────────── قسم الباقات ───────────────────────── */
function BundlesSection({ h }) {
  return (
    <section className="px-4 pt-6">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="font-display text-[18px] font-black text-blink-ink">باقات اطلبها · وفّر أكثر</h2>
          <p className="font-body text-[12px] text-blink-sub">مكوّنات وصفة كاملة بسعر أوفر</p>
        </div>
      </div>
      <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {BUNDLES.map((b) => {
          const d = pct(b.price, b.old);
          return (
            <div key={b.id} className="relative flex w-[210px] shrink-0 flex-col rounded-2xl border border-blink-line bg-white p-3">
              <span className="absolute right-2 top-2 z-10 rounded-full bg-blink-green px-2 py-0.5 font-display text-[10px] font-black text-white">باقة</span>
              <div className="grid h-24 place-items-center rounded-xl text-[46px]" style={{ background: b.tint }}>{b.emoji}</div>
              <span className="mt-2 font-body text-[11px] font-bold text-copper">{b.kicker} · {b.items} مكوّنات</span>
              <h3 className="mt-0.5 line-clamp-1 font-display text-[15px] font-black text-blink-ink">{b.name}</h3>
              <div className="mt-1 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="font-display text-[15px] font-black text-blink-ink">{iqd(b.price)} د.ع</span>
                  {b.old && <span className="font-body text-[11px] text-blink-sub line-through">{iqd(b.old)}</span>}
                </div>
                <AddBtn qty={h.qtyOf(b.id)} onAdd={() => h.add(b)} onInc={() => h.inc(b.id)} onDec={() => h.dec(b.id)} />
              </div>
              {d > 0 && <span className="mt-1 w-fit rounded bg-amber-100 px-1.5 py-0.5 font-body text-[10px] font-black text-amber-700">وفّر {d}٪</span>}
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ───────────────────────── الهيدر (متبدّل اللون + متقلّص عند النزول) ───────────────────────── */
const HINTS = ['طماطم', 'رمان', 'حليب طازج', 'رز عنبر', 'شوكولا', 'حفّاضات'];
function Header({ tab, setTab, theme, collapsed, count }) {
  const [hint, setHint] = useState(0);
  useEffect(() => { const t = setInterval(() => setHint((h) => (h + 1) % HINTS.length), 2200); return () => clearInterval(t); }, []);
  return (
    <header
      className="sticky top-0 z-40 transition-[background-color,box-shadow] duration-300"
      style={{ background: collapsed ? '#ffffff' : theme, boxShadow: collapsed ? '0 8px 20px -14px rgba(0,0,0,0.35)' : 'none' }}
    >
      {/* بلوك وقت التوصيل — يتقلّص ويختفي عند النزول */}
      <motion.div
        initial={false}
        animate={{ height: collapsed ? 0 : 'auto', opacity: collapsed ? 0 : 1 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        className="overflow-hidden"
      >
        <div className="flex items-start justify-between gap-2 px-4 pt-3">
          <div className="min-w-0">
            <span className="font-body text-[12px] font-bold text-blink-ink/70">🛒 اطلبها · توصيل</span>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-[26px] font-black leading-none text-blink-ink">خلال {DELIVERY} دقائق</h1>
              <span className="rounded-full bg-blink-ink px-1.5 py-0.5 font-display text-[10px] font-black text-blink-yellow">24/7</span>
            </div>
            <button className="mt-1 flex max-w-full items-center gap-1 text-blink-ink/85">
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

      {/* صف البحث — يضيف أيقونة سلّة صغيرة عند التقلّص، ويصغر ارتفاعه قليلاً */}
      <div className={`flex items-center gap-2 px-4 ${collapsed ? 'pt-2.5' : 'pt-2.5'} `}>
        <AnimatePresence initial={false}>
          {collapsed && count > 0 && (
            <motion.button
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 40, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.22 }}
              className="relative grid h-10 shrink-0 place-items-center overflow-hidden rounded-full bg-blink-green text-white"
              aria-label="السلّة"
            >
              <ShoppingCart className="h-5 w-5" />
              <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-[16px] place-items-center rounded-full bg-blink-ink px-1 text-[9px] font-black ring-2 ring-white">{count}</span>
            </motion.button>
          )}
        </AnimatePresence>
        <div className={`flex w-full items-center gap-2.5 rounded-xl bg-white shadow-sm ring-1 ring-black/10 transition-[padding] duration-200 ${collapsed ? 'px-3.5 py-2.5' : 'px-3.5 py-3'}`}>
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
      <div className="mt-1 flex gap-5 overflow-x-auto px-4 pb-1.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className="flex shrink-0 flex-col items-center gap-0.5 pb-1">
            <span className="text-[20px]">{t.icon}</span>
            <span className={`font-body text-[12px] font-bold ${tab === t.id ? 'text-blink-ink' : 'text-blink-ink/55'}`}>{t.label}</span>
            <span className={`h-0.5 w-6 rounded-full ${tab === t.id ? 'bg-blink-ink' : 'bg-transparent'}`} />
          </button>
        ))}
      </div>
    </header>
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
function CartBar({ count, total, onOpen }) {
  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.div initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }} transition={{ type: 'spring', stiffness: 380, damping: 32 }} className="fixed bottom-[60px] left-1/2 z-40 w-[calc(100%-1.5rem)] max-w-md -translate-x-1/2">
          <button onClick={onOpen} className="flex w-full items-center justify-between rounded-xl bg-blink-green px-4 py-2.5 text-white shadow-lg active:scale-[0.99]">
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

/* ───────────────────────── بانر ترحيب ───────────────────────── */
function WelcomeBanner({ theme }) {
  return (
    <div className="px-4 pt-3">
      <div className="relative overflow-hidden rounded-2xl px-5 py-4" style={{ background: `linear-gradient(110deg, ${theme}, #ffffff)` }}>
        <p className="font-display text-[19px] font-black leading-tight text-blink-ink">أهلاً بك في اطلبها 👋</p>
        <p className="mt-1 font-body text-[13px] font-bold text-blink-ink/75">اطلب الآن واستمتع بـ توصيل مجاني داخل السماوة</p>
        <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-blink-ink px-3 py-1.5 font-display text-[12px] font-black text-blink-yellow"><Clock className="h-3.5 w-3.5" /> خلال {DELIVERY} دقائق</span>
      </div>
    </div>
  );
}

/* ════════════════════════════════ الصفحة ════════════════════════════════ */
export default function BlinkitHome() {
  const [tab, setTab] = useState('all');
  const [items, setItems] = useState([]);
  const [collapsed, setCollapsed] = useState(false);
  const theme = TABS.find((t) => t.id === tab)?.theme || '#F8CB46';

  // collapse the header (hide the delivery block) once the page is scrolled
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

  const qtyOf = useCallback((id) => items.find((i) => i.key === id)?.qty || 0, [items]);
  const add = useCallback((p) => setItems((prev) => {
    const f = prev.find((i) => i.key === p.id);
    if (f) return prev.map((i) => (i.key === p.id ? { ...i, qty: i.qty + 1 } : i));
    return [...prev, { key: p.id, name: p.name, price: p.price, qty: 1 }];
  }), []);
  const inc = useCallback((id) => setItems((prev) => prev.map((i) => (i.key === id ? { ...i, qty: i.qty + 1 } : i))), []);
  const dec = useCallback((id) => setItems((prev) => prev.flatMap((i) => (i.key !== id ? [i] : i.qty <= 1 ? [] : [{ ...i, qty: i.qty - 1 }]))), []);
  const h = { qtyOf, add, inc, dec };

  const total = items.reduce((s, i) => s + i.price * i.qty, 0);
  const count = items.reduce((s, i) => s + i.qty, 0);
  const top = useMemo(railTopSellers, []);
  const deals = useMemo(railDeals, []);

  return (
    <div className="min-h-screen bg-white pb-28 font-body" dir="rtl">
      <Header tab={tab} setTab={setTab} theme={theme} collapsed={collapsed} count={count} />

      <AnimatePresence mode="wait">
        <motion.main
          key={tab}
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -16 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        >
          {tab === 'all' ? (
            <>
              <WelcomeBanner theme={theme} />
              <CategoryGroup group={GROUPS[0]} />
              <Rail title="الأكثر مبيعاً" products={top} h={h} />
              <BundlesSection h={h} />
              <CategoryGroup group={GROUPS[1]} />
              <Rail title="عروض اليوم 🔥" products={deals} h={h} />
              <CategoryGroup group={GROUPS[2]} />
              <StoresSection />
              <CategoryGroup group={GROUPS[3]} />
              <CategoryGroup group={GROUPS[4]} />
              <Rail title="قد يعجبك أيضاً" products={PRODUCTS.slice(0, 12)} h={h} />
            </>
          ) : (
            <>
              <WelcomeBanner theme={theme} />
              <Rail title="مختارات لك" products={[...PRODUCTS].reverse().slice(0, 12)} h={h} />
              <CategoryGroup group={GROUPS[1]} />
              <Rail title="عروض اليوم 🔥" products={deals} h={h} />
              <div className="px-4 pt-6 pb-2 text-center font-body text-[13px] text-blink-sub">المزيد من أقسام «{TABS.find((t) => t.id === tab)?.label}» قريباً ✨</div>
            </>
          )}
        </motion.main>
      </AnimatePresence>

      <CartBar count={count} total={total} onOpen={() => {}} />
      <BottomNav />
    </div>
  );
}
