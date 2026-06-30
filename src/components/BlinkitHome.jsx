import { useState, useEffect, useMemo, useCallback, Fragment } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Mic, ChevronDown, ChevronLeft, User, Wallet, Plus, Minus,
  Clock, Heart, Star, Home as HomeIcon, RotateCcw, LayoutGrid, ShoppingCart,
} from 'lucide-react';
import {
  TABS, CATEGORIES, GROUPS, PRODUCTS, STORES, BUNDLES,
  railTopSellers, railDeals, iqd,
} from '../data/blinkitCatalog.js';
import { fetchStoreCatalog } from '../lib/products.js';
import { getHomeLayout } from '../lib/storefront.js';

/* ════════════════════════════════════════════════════════════════
   «اطلبها» — رئيسية بنمط Blinkit (مطابقة للفيديو المرجعي).
   • الوضع الافتراضي: كتالوج تجريبي غنّي للمعاينة.
   • مع ?real=1 : يقرأ كتالوجك الحقيقي من Supabase (منتجات/فئات/متاجر/باقات)
     فتتحكّم به لوحة الأدمن/التاجر الحالية. يعود للتجريبي إن تعذّر الاتصال.
   ════════════════════════════════════════════════════════════════ */

const DELIVERY = 10;
const pct = (price, old) => (old ? Math.round((1 - price / old) * 100) : 0);

// يوحّد شكل المنتج (تجريبي أو حقيقي) إلى ما تتوقّعه البطاقة
const normProduct = (p) => ({
  ...p,
  old: p.old ?? p.oldPrice ?? null,
  cat: p.cat ?? p.tag ?? null,
  mins: p.mins ?? 13,
  left: p.left ?? (p.stock != null && p.stock > 0 && p.stock <= 5 ? p.stock : null),
  rating: p.rating || 4.5,
  ratingCount: p.ratingCount || 0,
  image: p.image || null,
});
const catNameOf = (cat) => CATEGORIES.find((c) => c.id === cat)?.name || cat || null;

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
  const hh = size === 'lg' ? 'h-9' : 'h-8';
  return (
    <div className={`flex items-center justify-between overflow-hidden rounded-lg bg-blink-green font-display font-black text-white ${hh} ${size === 'lg' ? 'w-24' : 'w-[72px]'}`}>
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
  const catName = catNameOf(p.cat);
  return (
    <div className={`relative flex shrink-0 flex-col rounded-2xl border border-blink-line bg-white p-2 ${wide ? 'w-full' : 'w-[150px] sm:w-[160px]'}`}>
      <div className="relative rounded-xl" style={{ background: (p.tint || '#EFEFEF') + '55' }}>
        {d > 0 && (
          <span className="absolute right-1.5 top-0 z-10 rounded-b-md bg-[#3661E0] px-1.5 pb-0.5 pt-1 text-center font-display text-[10px] font-black leading-none text-white">
            {d}٪<br /><span className="text-[8px] font-bold">خصم</span>
          </span>
        )}
        <button onClick={() => setLiked((v) => !v)} className="absolute left-1.5 top-1.5 z-10 grid h-6 w-6 place-items-center rounded-full bg-white/80 shadow-sm" aria-label="مفضّلة">
          <Heart className={`h-3.5 w-3.5 ${liked ? 'fill-rose-500 text-rose-500' : 'text-gray-400'}`} />
        </button>
        {p.image ? (
          <img src={p.image} alt={p.name} loading="lazy" className="h-[104px] w-full object-contain p-1.5 mix-blend-multiply" />
        ) : (
          <div className="grid h-[104px] place-items-center text-[52px]">{p.emoji}</div>
        )}
        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2">
          <AddBtn qty={qty} onAdd={onAdd} onInc={onInc} onDec={onDec} />
        </div>
      </div>

      <div className="mt-4 flex flex-1 flex-col">
        <span className="inline-flex w-fit items-center gap-1 rounded bg-gray-100 px-1.5 py-0.5 font-body text-[10px] font-bold text-blink-sub">
          <Clock className="h-3 w-3" /> {p.mins} دقيقة
        </span>
        <h3 className="mt-1 line-clamp-2 min-h-[34px] font-body text-[13px] font-bold leading-tight text-blink-ink">{p.name}</h3>
        <span className="mt-0.5 font-body text-[12px] text-blink-sub">{p.unit}</span>
        <div className="mt-1 flex items-center gap-1.5">
          <span className="font-display text-[15px] font-black text-blink-ink">{iqd(p.price)} د.ع</span>
          {p.old && <span className="font-body text-[11px] text-blink-sub line-through">{iqd(p.old)}</span>}
        </div>
        <div className="mt-1 flex items-center gap-2 font-body text-[10.5px] text-blink-sub">
          <span className="inline-flex items-center gap-0.5 rounded bg-green-50 px-1 py-0.5 font-bold text-blink-green">
            <Star className="h-2.5 w-2.5 fill-blink-green" /> {p.rating}
          </span>
          {p.ratingCount > 0 && <span>({iqd(p.ratingCount)})</span>}
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

/* ───────────────────────── شبكة بلاطات أقسام ───────────────────────── */
function CategoryTiles({ title, cats }) {
  if (!cats.length) return null;
  return (
    <section className="px-4 pt-6">
      <h2 className="mb-3 font-display text-[18px] font-black text-blink-ink">{title}</h2>
      <div className="grid grid-cols-4 gap-x-2.5 gap-y-4">
        {cats.map((c) => (
          <button key={c.key} className="flex flex-col items-center gap-1.5">
            <span className="relative grid aspect-square w-full place-items-center overflow-hidden rounded-2xl text-[34px] ring-1 ring-black/5" style={{ background: c.tint || '#F2F2F2' }}>
              {c.image ? <img src={c.image} alt={c.name} loading="lazy" className="h-full w-full object-contain p-1.5 mix-blend-multiply" /> : c.emoji}
              {c.count > 0 && (
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-white/85 px-1.5 py-0.5 font-body text-[8.5px] font-bold text-blink-sub shadow-sm">+{c.count} منتج</span>
              )}
            </span>
            <span className="line-clamp-2 text-center font-body text-[11px] font-bold leading-tight text-blink-ink/85">{c.name}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

/* ───────────────────────── قسم المتاجر ───────────────────────── */
function StoresSection({ stores }) {
  if (!stores.length) return null;
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
        {stores.map((s) => (
          <button key={s.id} className="flex w-[150px] shrink-0 flex-col rounded-2xl border border-blink-line bg-white p-2.5 text-right">
            <span className="grid h-20 w-full place-items-center overflow-hidden rounded-xl text-[40px]" style={{ background: s.tint || '#F4F4F4' }}>
              {s.image ? <img src={s.image} alt={s.name} loading="lazy" className="h-full w-full object-cover" /> : (s.emoji || '🏪')}
            </span>
            {s.mins ? <span className="mt-2 inline-flex w-fit items-center gap-1 rounded bg-gray-100 px-1.5 py-0.5 font-body text-[10px] font-bold text-blink-sub"><Clock className="h-3 w-3" /> {s.mins} دقيقة</span> : null}
            <h3 className="mt-1 line-clamp-1 font-body text-[13px] font-black text-blink-ink">{s.name}</h3>
            <div className="mt-0.5 flex items-center gap-1.5 font-body text-[11px] text-blink-sub">
              {s.rating > 0 && <span className="inline-flex items-center gap-0.5 rounded bg-green-50 px-1 font-bold text-blink-green"><Star className="h-2.5 w-2.5 fill-blink-green" /> {s.rating}</span>}
              <span>{s.tag}</span>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}

/* ───────────────────────── قسم الباقات ───────────────────────── */
function BundlesSection({ bundles, h }) {
  if (!bundles.length) return null;
  return (
    <section className="px-4 pt-6">
      <div className="mb-3">
        <h2 className="font-display text-[18px] font-black text-blink-ink">باقات اطلبها · وفّر أكثر</h2>
        <p className="font-body text-[12px] text-blink-sub">مكوّنات وصفة كاملة بسعر أوفر</p>
      </div>
      <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {bundles.map((b) => {
          const d = pct(b.price, b.old);
          return (
            <div key={b.id} className="relative flex w-[210px] shrink-0 flex-col rounded-2xl border border-blink-line bg-white p-3">
              <span className="absolute right-2 top-2 z-10 rounded-full bg-blink-green px-2 py-0.5 font-display text-[10px] font-black text-white">باقة</span>
              <span className="grid h-24 place-items-center overflow-hidden rounded-xl text-[46px]" style={{ background: b.tint || '#EFF4EC' }}>
                {b.image ? <img src={b.image} alt={b.name} loading="lazy" className="h-full w-full object-contain p-1.5 mix-blend-multiply" /> : b.emoji}
              </span>
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
function Header({ tabs, tab, setTab, theme, collapsed, count, deliveryMinutes, media, fade }) {
  const [hint, setHint] = useState(0);
  useEffect(() => { const t = setInterval(() => setHint((x) => (x + 1) % HINTS.length), 2200); return () => clearInterval(t); }, []);
  const hasMedia = media && (media.image || media.video);
  return (
    <header
      className="sticky top-0 z-40 transition-[background-color,box-shadow] duration-300"
      style={{ background: collapsed ? '#ffffff' : theme, boxShadow: collapsed ? '0 8px 20px -14px rgba(0,0,0,0.35)' : 'none' }}
    >
      {/* خلفية الهيدر (صورة/فيديو) — الجزء العلوي، يتلاشى تدريجياً عند النزول */}
      {hasMedia && !collapsed && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden" style={{ opacity: 1 - fade }}>
          {media.video
            ? <video src={media.video} className="h-full w-full object-cover" autoPlay loop muted playsInline />
            : <img src={media.image} alt="" className="h-full w-full object-cover" />}
          <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, rgba(255,255,255,${media.overlay ?? 0.18}), rgba(255,255,255,0) 55%)` }} />
        </div>
      )}
      <motion.div initial={false} animate={{ height: collapsed ? 0 : 'auto', opacity: collapsed ? 0 : 1 }} transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }} className="relative overflow-hidden">
        <div className="flex items-start justify-between gap-2 px-4 pt-3">
          <div className="min-w-0">
            <span className="font-body text-[12px] font-bold text-blink-ink/70">🛒 اطلبها · توصيل</span>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-[26px] font-black leading-none text-blink-ink">خلال {deliveryMinutes} دقائق</h1>
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

      <div className="relative flex items-center gap-2 px-4 pt-2.5">
        <AnimatePresence initial={false}>
          {collapsed && count > 0 && (
            <motion.button initial={{ width: 0, opacity: 0 }} animate={{ width: 40, opacity: 1 }} exit={{ width: 0, opacity: 0 }} transition={{ duration: 0.22 }} className="relative grid h-10 shrink-0 place-items-center overflow-hidden rounded-full bg-blink-green text-white" aria-label="السلّة">
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

      <div className="relative mt-1 flex gap-5 overflow-x-auto px-4 pb-1.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className="flex shrink-0 flex-col items-center gap-0.5 pb-1">
            {t.iconImage
              ? <img src={t.iconImage} alt="" className="h-[22px] w-[22px] object-contain" />
              : <span className="text-[20px]">{t.icon}</span>}
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

/* ───────────────────────── بانر ترحيب (الجزء السفلي من الخلفية) ───────────────────────── */
function WelcomeBanner({ theme, banner, deliveryMinutes, welcome, media }) {
  const title = banner?.title || welcome?.title || 'أهلاً بك في اطلبها 👋';
  const subtitle = banner?.subtitle || welcome?.subtitle || 'اطلب الآن واستمتع بتوصيل مجاني داخل السماوة';
  const bg = banner?.theme || theme;
  const img = banner?.image || media?.image || null;
  const vid = !banner?.image && media?.video ? media.video : null;
  const hasMedia = !!(img || vid);
  return (
    <div className="px-4 pt-3">
      <div className="relative overflow-hidden rounded-2xl px-5 py-4" style={{ background: hasMedia ? undefined : `linear-gradient(110deg, ${bg}, #ffffff)`, minHeight: hasMedia ? 120 : undefined }}>
        {vid ? <video src={vid} className="absolute inset-0 h-full w-full object-cover" autoPlay loop muted playsInline />
          : img ? <img src={img} alt="" className="absolute inset-0 h-full w-full object-cover" /> : null}
        {hasMedia && <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, rgba(255,255,255,${(media?.overlay ?? 0.18) + 0.05}), rgba(255,255,255,0))` }} />}
        <div className="relative">
          <p className="font-display text-[19px] font-black leading-tight text-blink-ink">{title}</p>
          <p className="mt-1 font-body text-[13px] font-bold text-blink-ink/75">{subtitle}</p>
          <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-blink-ink px-3 py-1.5 font-display text-[12px] font-black text-blink-yellow"><Clock className="h-3.5 w-3.5" /> {banner?.cta_label || `خلال ${deliveryMinutes} دقائق`}</span>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════ الصفحة ════════════════════════════════ */
export default function BlinkitHome() {
  const [tab, setTab] = useState('all');
  const [items, setItems] = useState([]);
  const [collapsed, setCollapsed] = useState(false);
  const [fade, setFade] = useState(0);        // 0 (أعلى) → 1 (نزلنا) — لتلاشي خلفية الهيدر تدريجياً
  const [real, setReal] = useState(null);     // كتالوج حقيقي عند تفعيل ?real=1
  const [layout, setLayout] = useState(null); // تخطيط الواجهة من /admin (تبويبات/مجموعات/بانرات/إعدادات)

  // ?real=1 → اقرأ الكتالوج الحقيقي + تخطيط الواجهة (يتحكّم بهما الأدمن). يعود للتجريبي إن تعذّر.
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

  // collapse the header (hide the delivery block) once the page is scrolled
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

  // ── base data (products/stores/bundles/rails) — real when available, else demo ──
  const data = useMemo(() => {
    if (real) {
      const products = real.products.map(normProduct);
      const counts = {};
      products.forEach((p) => { if (p.cat) counts[p.cat] = (counts[p.cat] || 0) + 1; });
      const stores = (real.stores || []).map((s) => ({ id: s.id, name: s.name, tag: s.category, rating: s.rating, image: s.logo || s.cover || null, emoji: '🏪', mins: null }));
      const bundles = (real.bundles || []).map((b) => ({ id: b.id, name: b.name, kicker: b.kicker || 'باقة', items: (b.items || []).length, price: b.price, old: b.old, image: b.image, emoji: (b.emojis && b.emojis[0]) || '🧺', tint: '#EFF4EC' }));
      const top = [...products].sort((a, b) => (b.sold || 0) - (a.sold || 0)).slice(0, 12);
      const deals = products.filter((p) => p.old).slice(0, 12);
      const fallbackCats = (real.categories || []).filter((c) => c.name && c.name !== 'الكل').map((c) => ({ key: c.name, name: c.name, emoji: c.emoji || '🛒', image: c.image, count: counts[c.name] || 0 }));
      return { mode: 'real', counts, groups: [{ title: 'تسوّق حسب القسم', cats: fallbackCats }], top, deals, more: products.slice(0, 12), stores, bundles };
    }
    const dp = PRODUCTS.map(normProduct);
    const groups = GROUPS.map((g) => ({
      title: g.title,
      cats: CATEGORIES.filter((c) => c.group === g.id).map((c) => ({ key: c.id, name: c.name, emoji: c.emoji, image: null, tint: c.tint, count: PRODUCTS.filter((p) => p.cat === c.id).length })),
    }));
    const stores = STORES.map((s) => ({ id: s.id, name: s.name, tag: s.tag, rating: s.rating, image: null, emoji: s.emoji, mins: s.mins, tint: s.tint }));
    const bundles = BUNDLES.map((b) => ({ ...b }));
    return { mode: 'demo', groups, top: railTopSellers().map(normProduct), deals: railDeals().map(normProduct), more: dp.slice(0, 12), stores, bundles };
  }, [real]);

  // ── tabs / theme / config / banner (admin-controlled in real mode) ──
  const tabsList = (real && layout?.tabs?.length)
    ? layout.tabs.map((t) => ({ id: t.key, label: t.label, icon: t.icon || '🛒', iconImage: t.icon_image || null, theme: t.theme || '#F8CB46' }))
    : TABS;
  const theme = tabsList.find((t) => t.id === tab)?.theme || '#F8CB46';
  const cfg = (real && layout?.config) || null;
  const deliveryMinutes = cfg?.delivery_minutes || DELIVERY;
  const welcome = cfg ? { title: cfg.welcome_title, subtitle: cfg.welcome_subtitle } : null;
  const showStores = cfg ? cfg.show_stores !== false : true;
  const showBundles = cfg ? cfg.show_bundles !== false : true;
  const banner = (real && layout?.banners?.length)
    ? (layout.banners.find((b) => b.tab === tab) || layout.banners.find((b) => b.tab === 'all') || null)
    : null;

  // خلفية الهيدر (صورة/فيديو): من الإعدادات، أو معاينة سريعة عبر ?hero=URL / ?herovid=URL
  const override = useMemo(() => {
    try { const p = new URLSearchParams(window.location.search); const img = p.get('hero'); const vid = p.get('herovid'); if (img || vid) return { image: img || null, video: vid || null, overlay: 0.18 }; } catch { /* ignore */ }
    return null;
  }, []);
  const media = override || (cfg && (cfg.header_image || cfg.header_video)
    ? { image: cfg.header_image || null, video: cfg.header_video || null, overlay: cfg.header_overlay ?? 0.18 }
    : null);

  // ── groups for the current tab (real mode uses admin-assigned groups) ──
  const realGroups = useMemo(() => {
    if (!(real && layout?.groups?.length && layout?.categories?.length)) return null;
    const counts = data.counts || {};
    const tabOk = (t) => tab === 'all' || !t || t === 'all' || t === tab;
    const mk = (c) => ({ key: c.name, name: c.name, emoji: c.emoji || '🛒', image: c.image, count: counts[c.name] || 0 });
    const out = layout.groups
      .filter((g) => tabOk(g.tab))
      .map((g) => ({ title: g.title, cats: layout.categories.filter((c) => c.home_group === g.id && tabOk(c.home_tab)).map(mk) }))
      .filter((g) => g.cats.length);
    const ungrouped = layout.categories.filter((c) => !c.home_group && tabOk(c.home_tab)).map(mk);
    if (ungrouped.length) out.push({ title: out.length ? 'أقسام أخرى' : 'تسوّق حسب القسم', cats: ungrouped });
    return out;
  }, [real, layout, tab, data]);

  return (
    <div className="min-h-screen bg-white pb-28 font-body" dir="rtl">
      <Header tabs={tabsList} tab={tab} setTab={setTab} theme={theme} collapsed={collapsed} count={count} deliveryMinutes={deliveryMinutes} media={media} fade={fade} />

      <AnimatePresence mode="wait">
        <motion.main key={tab} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}>
          {data.mode === 'real' ? (
            <>
              <WelcomeBanner theme={theme} banner={banner} welcome={welcome} deliveryMinutes={deliveryMinutes} media={media} />
              {(realGroups || data.groups).map((g, i) => (
                <Fragment key={g.title + i}>
                  <CategoryTiles title={g.title} cats={g.cats} />
                  {i === 0 && <Rail title="الأكثر مبيعاً" products={data.top} h={h} />}
                  {i === 0 && showBundles && <BundlesSection bundles={data.bundles} h={h} />}
                </Fragment>
              ))}
              <Rail title="عروض اليوم 🔥" products={data.deals} h={h} />
              {showStores && <StoresSection stores={data.stores} />}
              <Rail title="قد يعجبك أيضاً" products={data.more} h={h} />
            </>
          ) : tab === 'all' ? (
            <>
              <WelcomeBanner theme={theme} deliveryMinutes={deliveryMinutes} media={media} />
              {data.groups[0] && <CategoryTiles title={data.groups[0].title} cats={data.groups[0].cats} />}
              <Rail title="الأكثر مبيعاً" products={data.top} h={h} />
              <BundlesSection bundles={data.bundles} h={h} />
              {data.groups[1] && <CategoryTiles title={data.groups[1].title} cats={data.groups[1].cats} />}
              <Rail title="عروض اليوم 🔥" products={data.deals} h={h} />
              {data.groups[2] && <CategoryTiles title={data.groups[2].title} cats={data.groups[2].cats} />}
              <StoresSection stores={data.stores} />
              {data.groups[3] && <CategoryTiles title={data.groups[3].title} cats={data.groups[3].cats} />}
              {data.groups[4] && <CategoryTiles title={data.groups[4].title} cats={data.groups[4].cats} />}
              <Rail title="قد يعجبك أيضاً" products={data.more} h={h} />
            </>
          ) : (
            <>
              <WelcomeBanner theme={theme} deliveryMinutes={deliveryMinutes} media={media} />
              <Rail title="مختارات لك" products={[...data.more].reverse()} h={h} />
              {data.groups[1] && <CategoryTiles title={data.groups[1].title} cats={data.groups[1].cats} />}
              <Rail title="عروض اليوم 🔥" products={data.deals} h={h} />
              <div className="px-4 pb-2 pt-6 text-center font-body text-[13px] text-blink-sub">المزيد من أقسام «{tabsList.find((t) => t.id === tab)?.label}» قريباً ✨</div>
            </>
          )}
        </motion.main>
      </AnimatePresence>

      <CartBar count={count} total={total} onOpen={() => {}} />
      <BottomNav />
    </div>
  );
}
