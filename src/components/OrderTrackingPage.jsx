import { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ClipboardCheck, Package, Truck, MapPin, CheckCircle2, Loader2,
  Phone, MessageCircle, Home, XCircle, Wallet, Radio, PartyPopper,
} from 'lucide-react';
import { fmt } from '../data/catalog.js';
import { SETTINGS, SHOP_NAME } from '../config.js';
import { getOrderByToken } from '../lib/orders.js';
import LiveRouteMap from './LiveRouteMap.jsx';

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
  const [celebrate, setCelebrate] = useState(null); // label of newly-reached step
  const prevStep = useRef(null);

  const fetchOrder = useCallback(async (silent) => {
    if (!id) { setState('notfound'); return; }
    const res = await getOrderByToken(id);
    if (res?.ok && res.order) {
      setOrder(res.order);
      setState('ok');
      // celebrate when the order advances to a new step
      const s = currentStep(res.order);
      if (prevStep.current !== null && s > prevStep.current && s >= 0) {
        const label = STEPS[s]?.label;
        if (label) {
          setCelebrate(label);
          setTimeout(() => setCelebrate(null), 4000);
        }
      }
      prevStep.current = s;
    } else if (res?.ok === false && !silent) {
      setState('notfound');
    }
  }, [id]);

  useEffect(() => { fetchOrder(false); }, [fetchOrder]);

  // silent live sync every 6s (status + driver location) — no visible spinner
  useEffect(() => {
    const t = setInterval(() => fetchOrder(true), 6000);
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
  const wa = digits(SETTINGS.whatsapp_number);
  const hasMap = order.driver_lat && order.driver_lng;
  const driverPt = hasMap ? { lat: order.driver_lat, lng: order.driver_lng } : null;
  // customer location is stored in location_url as ...?q=LAT,LNG
  const custPt = (() => {
    const m = (order.location_url || '').match(/q=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
    return m ? { lat: parseFloat(m[1]), lng: parseFloat(m[2]) } : null;
  })();

  return (
    <div className="min-h-screen bg-beige pb-10 font-body text-ink dark:bg-night dark:text-cream" dir="rtl">
      {/* header */}
      <header className="bg-gradient-to-b from-brand-900 to-brand-800 px-5 pb-8 pt-6 text-cream dark:from-night-700 dark:to-night-800">
        <div className="mx-auto flex max-w-lg items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <img src="/icons/icon-192.png" alt="" className="h-9 w-9 rounded-lg" />
            <span className="font-display text-lg font-black">{SHOP_NAME}</span>
          </a>
          <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-bold text-green-300">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-green-400" />
            </span>
            مباشر
          </span>
        </div>
        <div className="mx-auto mt-5 max-w-lg">
          <div className="font-body text-sm text-cream/70">رقم الطلب</div>
          <div className="font-display text-3xl font-black">#{order.order_no}</div>
        </div>
      </header>

      {/* celebration banner on status advance */}
      <AnimatePresence>
        {celebrate && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            transition={{ type: 'spring', damping: 18 }}
            className="sticky top-3 z-30 mx-auto -mt-3 mb-1 flex max-w-lg items-center justify-center gap-2 rounded-2xl border border-brand-400/40 bg-brand-600 px-4 py-3 font-display font-bold text-cream shadow-card"
          >
            <PartyPopper className="h-5 w-5" /> طلبك الآن: {celebrate}
          </motion.div>
        )}
      </AnimatePresence>

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
                const reached = done || active;
                const Icon = s.icon;
                return (
                  <div key={s.key} className="flex gap-3">
                    {/* icon + line */}
                    <div className="flex flex-col items-center">
                      <div className="relative">
                        {active && (
                          <motion.span
                            className="absolute inset-0 rounded-full bg-brand-500"
                            initial={{ scale: 1, opacity: 0.5 }}
                            animate={{ scale: 2, opacity: 0 }}
                            transition={{ repeat: Infinity, duration: 1.8, ease: 'easeOut' }}
                          />
                        )}
                        <motion.div
                          initial={false}
                          animate={active ? { scale: [1, 1.14, 1] } : { scale: 1 }}
                          transition={active ? { repeat: Infinity, duration: 1.8 } : { duration: 0.3 }}
                          className={`relative grid h-10 w-10 place-items-center rounded-full transition-colors duration-500 ${
                            reached ? 'bg-brand-600 text-cream shadow-soft' : 'bg-ink/10 text-ink/30 dark:bg-white/10 dark:text-cream/30'
                          }`}
                        >
                          <AnimatePresence mode="wait" initial={false}>
                            {done ? (
                              <motion.span key="check"
                                initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }}
                                transition={{ type: 'spring', damping: 12 }}>
                                <CheckCircle2 className="h-5 w-5" />
                              </motion.span>
                            ) : (
                              <motion.span key="icon" initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                                <Icon className="h-5 w-5" />
                              </motion.span>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      </div>
                      {i < STEPS.length - 1 && (
                        <div className="relative my-1 h-8 w-0.5 overflow-hidden rounded bg-ink/10 dark:bg-white/10">
                          <motion.div
                            initial={false}
                            animate={{ scaleY: i < step ? 1 : 0 }}
                            transition={{ duration: 0.5, ease: 'easeOut' }}
                            style={{ originY: 0 }}
                            className="absolute inset-0 rounded bg-brand-600"
                          />
                        </div>
                      )}
                    </div>
                    {/* label */}
                    <div className="pt-2">
                      <div className={`font-display font-bold transition-colors duration-500 ${reached ? 'text-ink dark:text-cream' : 'text-ink/40 dark:text-cream/40'}`}>
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
              <div className="p-3 pt-0">
                <LiveRouteMap driver={driverPt} customer={custPt} height={260} />
                {!custPt && (
                  <div className="mt-2 text-center text-[11px] text-ink/45 dark:text-cream/45">
                    لرؤية المسار ووقت الوصول، شارك موقعك عند الطلب القادم 📍
                  </div>
                )}
              </div>
            ) : (
              <div className="border-t border-ink/5 px-4 py-3 text-center text-xs text-ink/45 dark:border-white/5 dark:text-cream/45">
                ستظهر خريطة موقع المندوب والمسار هنا عند انطلاقه إليك 🚚
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
            {(() => {
              const sub = order.subtotal != null ? order.subtotal : items.reduce((s, it) => s + (it.price || 0) * (it.qty || 1), 0);
              const delivery = Math.max(0, (order.total || 0) - sub);
              return (
                <div className="flex items-center justify-between">
                  <span className="text-ink/50 dark:text-cream/50">التوصيل</span>
                  {delivery > 0
                    ? <span className="font-bold text-ink dark:text-cream">{fmt(delivery)} د.ع</span>
                    : <span className="font-bold text-brand-600 dark:text-brand-300">مجاني ✓</span>}
                </div>
              );
            })()}
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
