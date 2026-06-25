import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  ClipboardCheck, Package, Truck, MapPin, CheckCircle2, Loader2,
  Phone, MessageCircle, Home, XCircle, Wallet, RefreshCw,
} from 'lucide-react';
import { fmt } from '../data/catalog.js';
import { WHATSAPP_NUMBER, SHOP_NAME } from '../config.js';
import { getOrderByToken } from '../lib/orders.js';

const STEPS = [
  { key: 'placed', label: 'تم استلام طلبك', icon: ClipboardCheck },
  { key: 'preparing', label: 'قيد التحضير', icon: Package },
  { key: 'on_way', label: 'في الطريق إليك', icon: Truck },
  { key: 'arrived', label: 'وصل المندوب', icon: MapPin },
  { key: 'delivered', label: 'تم التسليم', icon: CheckCircle2 },
];

function currentStep(o) {
  if (!o) return 0;
  if (o.status === 'cancelled') return -1;
  const ds = o.delivery_status;
  if (o.status === 'done' || ds === 'delivered') return 4;
  if (ds === 'arrived') return 3;
  if (ds === 'on_way' || ds === 'picked' || o.status === 'delivering') return 2;
  if (ds === 'assigned' || o.status === 'preparing') return 1;
  return 0;
}

function getOrderId() {
  try {
    const m = window.location.pathname.match(/\/order\/([^/?#]+)/);
    if (m) return decodeURIComponent(m[1]);
    return new URLSearchParams(window.location.search).get('order');
  } catch {
    return null;
  }
}

const digits = (p) => (p || '').replace(/[^\d]/g, '');

export default function OrderTrackingPage() {
  const id = getOrderId();
  const [order, setOrder] = useState(null);
  const [state, setState] = useState('loading'); // loading | ok | notfound | error
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrder = useCallback(async (silent) => {
    if (!id) { setState('notfound'); return; }
    if (silent) setRefreshing(true);
    const res = await getOrderByToken(id);
    if (res?.ok && res.order) { setOrder(res.order); setState('ok'); }
    else if (res?.ok === false && !silent) setState('notfound');
    setRefreshing(false);
  }, [id]);

  useEffect(() => { fetchOrder(false); }, [fetchOrder]);

  // live refresh every 15s (status + driver location)
  useEffect(() => {
    const t = setInterval(() => fetchOrder(true), 15000);
    return () => clearInterval(t);
  }, [fetchOrder]);

  if (state === 'loading') {
    return (
      <div className="grid min-h-screen place-items-center bg-beige dark:bg-night">
        <div className="flex items-center gap-2 font-body text-ink/50 dark:text-cream/50">
          <Loader2 className="h-5 w-5 animate-spin" /> جارٍ تحميل طلبك…
        </div>
      </div>
    );
  }

  if (state === 'notfound') {
    return (
      <div className="grid min-h-screen place-items-center bg-beige px-5 dark:bg-night" dir="rtl">
        <div className="text-center font-body">
          <XCircle className="mx-auto h-12 w-12 text-ink/30 dark:text-cream/30" />
          <p className="mt-3 text-ink/70 dark:text-cream/70">لم نعثر على هذا الطلب.</p>
          <a href="/" className="mt-4 inline-flex items-center gap-2 rounded-full bg-copper px-5 py-2.5 font-bold text-cream hover:bg-copper-dark">
            <Home className="h-4 w-4" /> العودة للمتجر
          </a>
        </div>
      </div>
    );
  }

  const step = currentStep(order);
  const cancelled = step === -1;
  const items = Array.isArray(order.items) ? order.items : [];
  const wa = digits(WHATSAPP_NUMBER);
  const hasMap = order.driver_lat && order.driver_lng;

  return (
    <div className="min-h-screen bg-beige pb-10 font-body text-ink dark:bg-night dark:text-cream" dir="rtl">
      {/* header */}
      <header className="bg-gradient-to-b from-brand-900 to-brand-800 px-5 pb-8 pt-6 text-cream dark:from-night-700 dark:to-night-800">
        <div className="mx-auto flex max-w-lg items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <img src="/icons/icon-192.png" alt="" className="h-9 w-9 rounded-lg" />
            <span className="font-display text-lg font-black">{SHOP_NAME}</span>
          </a>
          <button onClick={() => fetchOrder(true)} className="grid h-9 w-9 place-items-center rounded-full bg-white/10 hover:bg-white/20">
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
        <div className="mx-auto mt-5 max-w-lg">
          <div className="font-body text-sm text-cream/70">رقم الطلب</div>
          <div className="font-display text-3xl font-black">#{order.order_no}</div>
        </div>
      </header>

      <main className="mx-auto -mt-4 max-w-lg space-y-4 px-4">
        {cancelled ? (
          <div className="rounded-3xl bg-cream p-6 text-center shadow-card dark:bg-night-800">
            <XCircle className="mx-auto h-12 w-12 text-red-500" />
            <p className="mt-2 font-display text-lg font-bold">تم إلغاء هذا الطلب</p>
            <p className="mt-1 text-sm text-ink/50 dark:text-cream/50">للاستفسار تواصل معنا عبر واتساب.</p>
          </div>
        ) : (
          /* status timeline */
          <div className="rounded-3xl bg-cream p-5 shadow-card dark:bg-night-800">
            <div className="mb-4 font-display text-lg font-extrabold">حالة الطلب</div>
            <div className="space-y-0">
              {STEPS.map((s, i) => {
                const done = i < step;
                const active = i === step;
                const Icon = s.icon;
                return (
                  <div key={s.key} className="flex gap-3">
                    {/* icon + line */}
                    <div className="flex flex-col items-center">
                      <motion.div
                        initial={false}
                        animate={active ? { scale: [1, 1.12, 1] } : {}}
                        transition={active ? { repeat: Infinity, duration: 1.8 } : {}}
                        className={`grid h-10 w-10 place-items-center rounded-full ${
                          done || active ? 'bg-brand-600 text-cream' : 'bg-ink/10 text-ink/30 dark:bg-white/10 dark:text-cream/30'
                        }`}
                      >
                        {done ? <CheckCircle2 className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                      </motion.div>
                      {i < STEPS.length - 1 && (
                        <div className={`my-1 h-8 w-0.5 ${i < step ? 'bg-brand-600' : 'bg-ink/10 dark:bg-white/10'}`} />
                      )}
                    </div>
                    {/* label */}
                    <div className="pt-2">
                      <div className={`font-display font-bold ${done || active ? 'text-ink dark:text-cream' : 'text-ink/40 dark:text-cream/40'}`}>
                        {s.label}
                      </div>
                      {active && <div className="text-xs text-brand-600 dark:text-brand-300">الآن</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* driver + live map */}
        {order.driver && (
          <div className="overflow-hidden rounded-3xl bg-cream shadow-card dark:bg-night-800">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-full bg-copper/15 text-copper">
                  <Truck className="h-5 w-5" />
                </span>
                <div>
                  <div className="text-xs text-ink/50 dark:text-cream/50">مندوب التوصيل</div>
                  <div className="font-display font-bold">{order.driver.name || 'المندوب'}</div>
                </div>
              </div>
              {order.driver.phone && (
                <a href={`tel:${order.driver.phone}`} className="flex items-center gap-1.5 rounded-xl bg-brand-600 px-3 py-2 text-sm font-bold text-cream hover:bg-brand-700">
                  <Phone className="h-4 w-4" /> اتصال
                </a>
              )}
            </div>
            {hasMap ? (
              <iframe
                title="موقع المندوب"
                src={`https://maps.google.com/maps?q=${order.driver_lat},${order.driver_lng}&z=15&output=embed`}
                className="h-56 w-full border-0"
                loading="lazy"
              />
            ) : (
              <div className="border-t border-ink/5 px-4 py-3 text-center text-xs text-ink/45 dark:border-white/5 dark:text-cream/45">
                ستظهر خريطة موقع المندوب هنا عند انطلاقه إليك 🚚
              </div>
            )}
          </div>
        )}

        {/* order details */}
        <div className="rounded-3xl bg-cream p-5 shadow-card dark:bg-night-800">
          <div className="mb-3 font-display text-lg font-extrabold">تفاصيل الطلب</div>
          <div className="space-y-2">
            {items.map((it, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="text-ink/80 dark:text-cream/80">{it.name} <span className="text-ink/40 dark:text-cream/40">×{it.qty}</span></span>
                <span className="text-ink/60 dark:text-cream/60">{fmt((it.price || 0) * (it.qty || 1))} د.ع</span>
              </div>
            ))}
          </div>
          <div className="mt-3 space-y-1.5 border-t border-ink/10 pt-3 text-sm dark:border-white/10">
            <div className="flex items-center justify-between">
              <span className="text-ink/50 dark:text-cream/50">التوصيل</span>
              <span className="font-bold text-brand-600 dark:text-brand-300">مجاني ✓</span>
            </div>
            <div className="flex items-center justify-between font-display text-lg font-black">
              <span>المجموع</span>
              <span>{fmt(order.total || 0)} <span className="text-sm">د.ع</span></span>
            </div>
            {order.points_earned > 0 && (
              <div className="flex items-center justify-between text-xs text-copper">
                <span>نقاط مكتسبة</span>
                <span className="font-bold">+{order.points_earned} نقطة</span>
              </div>
            )}
            {order.area && (
              <div className="flex items-center justify-between text-xs text-ink/45 dark:text-cream/45">
                <span>المنطقة</span><span>{order.area}</span>
              </div>
            )}
            {order.payment && (
              <div className="flex items-center justify-between text-xs text-ink/45 dark:text-cream/45">
                <span>الدفع</span><span>{order.payment}</span>
              </div>
            )}
          </div>
        </div>

        {/* support */}
        <a
          href={`https://wa.me/${wa}?text=${encodeURIComponent(`مرحباً، بخصوص طلبي رقم #${order.order_no}`)}`}
          target="_blank" rel="noreferrer"
          className="flex items-center justify-center gap-2 rounded-2xl bg-[#25D366] py-3.5 font-display font-bold text-white hover:bg-[#1ebe5d]"
        >
          <MessageCircle className="h-5 w-5" /> تواصل معنا عبر واتساب
        </a>

        <a href="/" className="flex items-center justify-center gap-2 py-2 text-sm text-ink/50 hover:text-ink dark:text-cream/50 dark:hover:text-cream">
          <Home className="h-4 w-4" /> متابعة التسوّق
        </a>
      </main>
    </div>
  );
}
