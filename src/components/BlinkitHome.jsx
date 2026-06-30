import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, ChevronDown, User, Plus, Minus, Clock, ShoppingCart, ChevronLeft } from 'lucide-react';
import { PRODUCTS, fmt } from '../data/catalog.js';

/* ════════════════════════════════════════════════════════════════
   مسودّة أولى — صفحة رئيسية بنمط Blinkit (أصفر) لمتجر «اطلبها».
   مستقلّة تماماً عن الموقع الحالي: لها سلّتها الخاصة، تُعرض على /blinkit
   حتى نطابقها مع لقطاتك بالضبط قبل اعتمادها صفحةً رئيسية.
   ════════════════════════════════════════════════════════════════ */

const DELIVERY_MINUTES = 10;

/* ── شريط علوي أصفر: وقت التوصيل + الموقع + البحث ── */
const HINTS = ['طماطم', 'رمان', 'أرز عنبر', 'دبس رمان', 'تمور', 'كليجة'];
function TopBar() {
  const [hint, setHint] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setHint((h) => (h + 1) % HINTS.length), 2200);
    return () => clearInterval(t);
  }, []);
  return (
    <header className="sticky top-0 z-40 bg-blink-yellow">
      <div className="mx-auto max-w-3xl px-4 pb-3 pt-3">
        <div className="flex items-start justify-between gap-3">
          {/* وقت التوصيل + العنوان */}
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-display text-[19px] font-black leading-none text-blink-ink">
                التوصيل خلال {DELIVERY_MINUTES} دقائق
              </span>
            </div>
            <button className="mt-1 flex max-w-full items-center gap-1 text-blink-ink/80">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate font-body text-[13px] font-medium">السماوة · الحي الشرقي</span>
              <ChevronDown className="h-4 w-4 shrink-0" />
            </button>
          </div>
          {/* الحساب */}
          <button className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/40 text-blink-ink ring-1 ring-black/5">
            <User className="h-5 w-5" />
          </button>
        </div>

        {/* شريط البحث */}
        <button className="mt-3 flex w-full items-center gap-2.5 rounded-xl bg-white px-3.5 py-3 text-right shadow-sm ring-1 ring-black/5">
          <Search className="h-5 w-5 shrink-0 text-blink-ink/60" />
          <span className="flex-1 truncate font-body text-[14px] text-blink-sub">
            ابحث عن «
            <AnimatePresence mode="wait">
              <motion.span
                key={hint}
                initial={{ y: 8, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -8, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="inline-block font-bold text-blink-ink/70"
              >
                {HINTS[hint]}
              </motion.span>
            </AnimatePresence>
            » والمزيد
          </span>
        </button>
      </div>
    </header>
  );
}

/* ── بانر ترويجي علوي ── */
function HeroBanner() {
  return (
    <div className="mx-auto max-w-3xl px-4 pt-3">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-l from-blink-amber to-blink-yellowDk px-5 py-4">
        <div className="relative z-10 max-w-[70%]">
          <p className="font-display text-[20px] font-black leading-tight text-blink-ink">
            كل البقالة توصل بسرعة
          </p>
          <p className="mt-1 font-body text-[13px] font-bold text-blink-ink/75">
            خضار وفواكه ومؤونة طازجة — لباب بيتك في السماوة
          </p>
          <span className="mt-2.5 inline-flex items-center gap-1 rounded-full bg-blink-ink px-3 py-1.5 font-display text-[12px] font-black text-blink-yellow">
            <Clock className="h-3.5 w-3.5" /> خلال {DELIVERY_MINUTES} دقائق
          </span>
        </div>
        <div className="pointer-events-none absolute -left-4 -bottom-6 text-[120px] leading-none opacity-90">🧺</div>
      </div>
    </div>
  );
}

/* ── شبكة الفئات (نمط Blinkit الكثيف) ── */
const CATS = [
  { name: 'خضار',    image: '/images/tomato.webp',     bg: '#FDECEC' },
  { name: 'فواكه',   image: '/images/pomegranate.webp', bg: '#F7E9EC' },
  { name: 'مؤونة',   image: '/images/anbar-rice.webp',  bg: '#F4EFDD' },
  { name: 'حلويات',  image: '/images/kleicha.webp',     bg: '#F3E7D7' },
  { name: 'مخللات',  image: '/images/pickles.webp',     bg: '#F1ECD8' },
  { name: 'دبس وعسل', image: '/images/molasses.webp',   bg: '#F3E3E1' },
  { name: 'أعشاب',   image: '/images/herbs.webp',       bg: '#E8F3E6' },
  { name: 'بقوليات', image: '/images/chickpeas.webp',   bg: '#F2EEDD' },
];
function CategorySection() {
  return (
    <section className="mx-auto max-w-3xl px-4 pt-5">
      <h2 className="mb-3 font-display text-[17px] font-black text-blink-ink">تسوّق حسب الفئة</h2>
      <div className="grid grid-cols-4 gap-x-3 gap-y-4">
        {CATS.map((c) => (
          <button key={c.name} className="flex flex-col items-center gap-1.5">
            <span
              className="grid aspect-square w-full place-items-center overflow-hidden rounded-2xl p-2.5 ring-1 ring-black/5"
              style={{ background: c.bg }}
            >
              <img src={c.image} alt={c.name} loading="lazy" className="h-full w-full object-contain mix-blend-multiply" />
            </span>
            <span className="text-center font-body text-[11.5px] font-bold leading-tight text-blink-ink/85">{c.name}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

/* ── زر ADD ↔ عدّاد الكمية (توقيع Blinkit) ── */
function AddButton({ qty, onAdd, onInc, onDec }) {
  if (qty <= 0) {
    return (
      <button
        onClick={onAdd}
        className="rounded-lg border border-blink-green bg-blink-mint px-5 py-1.5 font-display text-[14px] font-black text-blink-green transition active:scale-95"
      >
        إضافة
      </button>
    );
  }
  return (
    <div className="flex items-center justify-between overflow-hidden rounded-lg bg-blink-green font-display text-[15px] font-black text-white">
      <button onClick={onDec} className="grid h-8 w-8 place-items-center active:bg-blink-greenDk" aria-label="إنقاص">
        <Minus className="h-4 w-4" />
      </button>
      <motion.span key={qty} initial={{ scale: 0.6 }} animate={{ scale: 1 }} className="min-w-[20px] text-center">
        {qty}
      </motion.span>
      <button onClick={onInc} className="grid h-8 w-8 place-items-center active:bg-blink-greenDk" aria-label="زيادة">
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}

/* ── بطاقة منتج Blinkit ── */
function ProductCard({ p, qty, onAdd, onInc, onDec }) {
  const discount = p.oldPrice ? Math.round((1 - p.price / p.oldPrice) * 100) : 0;
  return (
    <div className="flex w-[150px] shrink-0 snap-start flex-col rounded-2xl border border-blink-line bg-white p-2.5 sm:w-[165px]">
      {/* صورة + شارة الخصم */}
      <div className="relative grid place-items-center rounded-xl bg-blink-bg py-2">
        {discount > 0 && (
          <span className="absolute right-1 top-1 rounded-md bg-[#256fef] px-1.5 py-0.5 font-display text-[10px] font-black leading-tight text-white">
            خصم {discount}٪
          </span>
        )}
        <img src={p.image} alt={p.name} loading="lazy" className="h-24 w-24 object-contain mix-blend-multiply" />
      </div>

      {/* شارة وقت التوصيل */}
      <span className="mt-2 inline-flex w-fit items-center gap-1 rounded bg-gray-100 px-1.5 py-0.5 font-body text-[10px] font-bold text-blink-sub">
        <Clock className="h-3 w-3" /> {DELIVERY_MINUTES} دقائق
      </span>

      {/* الاسم + الوحدة */}
      <h3 className="mt-1.5 line-clamp-2 min-h-[34px] font-body text-[13px] font-bold leading-tight text-blink-ink">{p.name}</h3>
      <span className="mt-0.5 font-body text-[12px] text-blink-sub">{p.unit}</span>

      {/* السعر + زر الإضافة */}
      <div className="mt-2 flex items-center justify-between gap-1">
        <div className="leading-tight">
          <span className="block font-display text-[14px] font-black text-blink-ink">{fmt(p.price)} د.ع</span>
          {p.oldPrice && (
            <span className="block font-body text-[11px] text-blink-sub line-through">{fmt(p.oldPrice)}</span>
          )}
        </div>
        <AddButton qty={qty} onAdd={onAdd} onInc={onInc} onDec={onDec} />
      </div>
    </div>
  );
}

/* ── صف منتجات أفقي ── */
function Rail({ title, subtitle, products, qtyOf, onAdd, onInc, onDec }) {
  if (!products.length) return null;
  return (
    <section className="mx-auto max-w-3xl px-4 pt-5">
      <div className="mb-2.5 flex items-end justify-between">
        <div>
          <h2 className="font-display text-[17px] font-black text-blink-ink">{title}</h2>
          {subtitle && <p className="font-body text-[12px] text-blink-sub">{subtitle}</p>}
        </div>
        <button className="flex items-center font-display text-[13px] font-black text-blink-green">
          شوف الكل <ChevronLeft className="h-4 w-4" />
        </button>
      </div>
      <div className="-mx-4 flex snap-x gap-2.5 overflow-x-auto px-4 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {products.map((p) => (
          <ProductCard
            key={p.id}
            p={p}
            qty={qtyOf(p.id)}
            onAdd={() => onAdd(p)}
            onInc={() => onInc(p.id)}
            onDec={() => onDec(p.id)}
          />
        ))}
      </div>
    </section>
  );
}

/* ── شبكة منتجات كاملة ── */
function Grid({ title, products, qtyOf, onAdd, onInc, onDec }) {
  return (
    <section className="mx-auto max-w-3xl px-4 pt-5">
      <h2 className="mb-2.5 font-display text-[17px] font-black text-blink-ink">{title}</h2>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        {products.map((p) => (
          <div key={p.id} className="w-full">
            <ProductCard
              p={{ ...p }}
              qty={qtyOf(p.id)}
              onAdd={() => onAdd(p)}
              onInc={() => onInc(p.id)}
              onDec={() => onDec(p.id)}
            />
          </div>
        ))}
      </div>
    </section>
  );
}

/* ── شريط السلّة العائم (أخضر) ── */
function CartBar({ count, total, onOpen }) {
  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.div
          initial={{ y: 90 }}
          animate={{ y: 0 }}
          exit={{ y: 90 }}
          transition={{ type: 'spring', stiffness: 380, damping: 32 }}
          className="fixed bottom-3 left-1/2 z-50 w-[calc(100%-1.5rem)] max-w-md -translate-x-1/2"
        >
          <button
            onClick={onOpen}
            className="flex w-full items-center justify-between rounded-xl bg-blink-green px-4 py-3 text-white shadow-lg active:scale-[0.99]"
          >
            <span className="flex items-center gap-2.5">
              <span className="relative grid h-9 w-9 place-items-center rounded-lg bg-white/15">
                <ShoppingCart className="h-5 w-5" />
              </span>
              <span className="text-right leading-tight">
                <span className="block font-display text-[15px] font-black">{count} منتج</span>
                <span className="block font-body text-[12px] text-white/85">{fmt(total)} د.ع</span>
              </span>
            </span>
            <span className="flex items-center gap-0.5 font-display text-[15px] font-black">
              عرض السلّة <ChevronLeft className="h-5 w-5" />
            </span>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ════════════════════════ الصفحة ════════════════════════ */
export default function BlinkitHome() {
  const [items, setItems] = useState([]);
  const qtyOf = useCallback((id) => items.find((i) => i.key === id)?.qty || 0, [items]);

  const add = useCallback((p) => {
    setItems((prev) => {
      const f = prev.find((i) => i.key === p.id);
      if (f) return prev.map((i) => (i.key === p.id ? { ...i, qty: i.qty + 1 } : i));
      return [...prev, { key: p.id, name: p.name, price: p.price, qty: 1 }];
    });
  }, []);
  const inc = useCallback((id) => setItems((prev) => prev.map((i) => (i.key === id ? { ...i, qty: i.qty + 1 } : i))), []);
  const dec = useCallback((id) => setItems((prev) => prev.flatMap((i) => (i.key !== id ? [i] : i.qty <= 1 ? [] : [{ ...i, qty: i.qty - 1 }]))), []);

  const total = items.reduce((s, i) => s + i.price * i.qty, 0);
  const count = items.reduce((s, i) => s + i.qty, 0);

  // أعلى المبيعات
  const best = useMemo(() => PRODUCTS.slice(0, 10), []);
  // عروض اليوم — نضيف سعراً قديماً لبعض المنتجات لإظهار شارة الخصم + السعر المشطوب
  const deals = useMemo(
    () => PRODUCTS.slice(6, 14).map((p) => ({ ...p, oldPrice: Math.round((p.price * 1.25) / 250) * 250 })),
    []
  );

  const handlers = { qtyOf, onAdd: add, onInc: inc, onDec: dec };

  return (
    <div className="min-h-screen bg-white pb-24 font-body" dir="rtl">
      <TopBar />
      <HeroBanner />
      <CategorySection />
      <Rail title="الأكثر مبيعاً" subtitle="الأكثر طلباً في السماوة" products={best} {...handlers} />
      <Rail title="عروض اليوم" subtitle="خصومات لفترة محدودة" products={deals} {...handlers} />
      <Grid title="كل المنتجات" products={PRODUCTS} {...handlers} />
      <CartBar count={count} total={total} onOpen={() => {}} />
    </div>
  );
}
