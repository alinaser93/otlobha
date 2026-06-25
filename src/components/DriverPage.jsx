import { useEffect, useMemo, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Truck, Lock, LogOut, RefreshCw, Loader2, Phone, MessageCircle,
  Navigation, MapPin, Package, Check, CheckCircle2, ChevronLeft, Radio,
} from 'lucide-react';
import { fmt } from '../data/catalog.js';
import {
  getDriverSession, setDriverSession, clearDriverSession,
  driverLogin, driverListOrders, driverUpdateDelivery, driverUpdateLocation,
} from '../lib/driver.js';

// delivery workflow steps (in order)
const STEPS = [
  ['assigned', 'مُسند إليك'],
  ['picked', 'استلمت الطلب'],
  ['on_way', 'في الطريق'],
  ['arrived', 'وصلت للزبون'],
  ['delivered', 'تم التسليم'],
];
const STEP_LABEL = Object.fromEntries(STEPS);
const NEXT = { assigned: 'picked', picked: 'on_way', on_way: 'arrived', arrived: 'delivered' };
const NEXT_LABEL = { assigned: 'استلمت الطلب', picked: 'انطلقت — في الطريق', on_way: 'وصلت للزبون', arrived: 'تم التسليم ✓' };

const digits = (p) => (p || '').replace(/[^\d]/g, '');

export default function DriverPage() {
  const [driver, setDriver] = useState(() => getDriverSession());
  if (!driver) return <Login onIn={(d) => { setDriverSession(d); setDriver(d); }} />;
  return <Board driver={driver} onOut={() => { clearDriverSession(); setDriver(null); }} />;
}

/* ───────────── Login ───────────── */
function Login({ onIn }) {
  const [pass, setPass] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  async function submit() {
    if (!pass.trim()) return;
    setBusy(true); setErr('');
    const res = await driverLogin(pass.trim());
    setBusy(false);
    if (res?.ok) onIn(res.driver);
    else setErr('كلمة المرور غير صحيحة');
  }

  return (
    <div className="grid min-h-screen place-items-center bg-night-900 px-5 font-body text-cream" dir="rtl">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm rounded-3xl border border-white/10 bg-night-800 p-7 shadow-card">
        <div className="mb-5 flex flex-col items-center gap-3 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-copper/20 text-copper">
            <Truck className="h-7 w-7" />
          </span>
          <div>
            <h1 className="font-display text-2xl font-black">بوابة المندوب</h1>
            <p className="mt-1 text-sm text-cream/50">اطلبها — للمندوبين</p>
          </div>
        </div>
        <input type="password" value={pass} onChange={(e) => setPass(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()} placeholder="كلمة المرور" autoFocus
          className="w-full rounded-2xl border border-white/10 bg-night-900 px-4 py-3 text-center text-lg tracking-widest text-cream outline-none placeholder:text-cream/30 focus:border-copper" />
        {err && <p className="mt-2 text-center text-sm text-red-400">{err}</p>}
        <button onClick={submit} disabled={busy}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-copper py-3 font-display font-bold text-cream hover:bg-copper-dark disabled:opacity-60">
          {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Lock className="h-5 w-5" />} دخول
        </button>
        <a href="/" className="mt-4 block text-center text-xs text-cream/40 hover:text-cream/70">→ العودة للمتجر</a>
      </motion.div>
    </div>
  );
}

/* ───────────── Board ───────────── */
function Board({ driver, onOut }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('active'); // active | done

  async function load() {
    setLoading(true);
    const res = await driverListOrders(driver.id);
    setOrders(Array.isArray(res?.orders) ? res.orders : []);
    setLoading(false);
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  // silent live sync every 8s
  useEffect(() => {
    const t = setInterval(async () => {
      const res = await driverListOrders(driver.id);
      if (Array.isArray(res?.orders)) setOrders(res.orders);
    }, 8000);
    return () => clearInterval(t);
    /* eslint-disable-next-line */
  }, []);

  const active = useMemo(() => orders.filter((o) => o.delivery_status !== 'delivered'), [orders]);
  const done = useMemo(() => orders.filter((o) => o.delivery_status === 'delivered'), [orders]);
  const shown = tab === 'active' ? active : done;

  async function advance(orderId, current) {
    const next = NEXT[current];
    if (!next) return;
    const res = await driverUpdateDelivery(driver.id, orderId, next);
    if (res?.ok) setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, delivery_status: next, status: res.order?.status || o.status } : o)));
  }

  return (
    <div className="min-h-screen bg-night-900 font-body text-cream" dir="rtl">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-night-900/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-copper/20 text-copper"><Truck className="h-5 w-5" /></span>
            <div className="leading-tight">
              <div className="font-display text-lg font-black">مرحباً {driver.name || driver.username}</div>
              <div className="text-[11px] text-cream/45">{active.length} طلب نشط</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={load} className="grid h-9 w-9 place-items-center rounded-xl bg-white/5 text-cream/80 hover:bg-white/10">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button onClick={onOut} className="flex items-center gap-1.5 rounded-xl bg-white/5 px-3 py-2 text-sm text-red-300 hover:bg-red-500/10">
              <LogOut className="h-4 w-4" /> خروج
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl space-y-4 px-4 py-5">
        {/* tabs */}
        <div className="flex gap-2">
          <button onClick={() => setTab('active')}
            className={`flex-1 rounded-xl py-2.5 text-sm font-bold transition ${tab === 'active' ? 'bg-copper text-cream' : 'bg-white/5 text-cream/70 hover:bg-white/10'}`}>
            النشطة ({active.length})
          </button>
          <button onClick={() => setTab('done')}
            className={`flex-1 rounded-xl py-2.5 text-sm font-bold transition ${tab === 'done' ? 'bg-copper text-cream' : 'bg-white/5 text-cream/70 hover:bg-white/10'}`}>
            المُسلّمة ({done.length})
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-cream/50"><Loader2 className="h-5 w-5 animate-spin" /> جارٍ التحميل…</div>
        ) : shown.length === 0 ? (
          <div className="py-16 text-center text-cream/40">{tab === 'active' ? 'لا توجد طلبات نشطة الآن.' : 'لا توجد طلبات مُسلّمة بعد.'}</div>
        ) : (
          <div className="space-y-3">{shown.map((o) => <DeliveryCard key={o.id} o={o} onAdvance={advance} driverId={driver.id} />)}</div>
        )}
        <div className="pb-6 pt-2 text-center text-xs text-cream/30">اطلبها — بوابة المندوب</div>
      </main>
    </div>
  );
}

/* ───────────── Delivery card ───────────── */
function DeliveryCard({ o, onAdvance, driverId }) {
  const items = Array.isArray(o.items) ? o.items : [];
  const cur = o.delivery_status || 'assigned';
  const wa = digits(o.customer_phone);
  const curIdx = STEPS.findIndex(([k]) => k === cur);
  const lastSent = useRef(0);
  const [sharing, setSharing] = useState(false);

  // share live GPS location with the customer while on the way / arrived
  useEffect(() => {
    if (cur !== 'on_way' && cur !== 'arrived') { setSharing(false); return; }
    if (!('geolocation' in navigator)) return;
    setSharing(true);
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        const now = Date.now();
        if (now - lastSent.current < 8000) return; // throttle to ~8s
        lastSent.current = now;
        driverUpdateLocation(driverId, o.id, pos.coords.latitude, pos.coords.longitude);
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 8000, timeout: 20000 }
    );
    return () => navigator.geolocation.clearWatch(id);
  }, [cur, o.id, driverId]);

  // navigation link: prefer the customer's shared GPS location, else search the address text
  const navUrl = o.location_url
    ? o.location_url
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([o.area, o.address, 'السماوة'].filter(Boolean).join(' '))}`;

  return (
    <div className="rounded-2xl border border-white/10 bg-night-800 p-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="font-display text-lg font-black">طلب #{o.order_no}</div>
          <div className="mt-0.5 text-[11px] text-cream/45">{STEP_LABEL[cur]}</div>
        </div>
        <div className="font-display text-lg font-black text-green-300">{fmt(o.total || 0)} <span className="text-xs">د.ع</span></div>
      </div>

      {/* progress steps */}
      <div className="mt-3 flex items-center gap-1">
        {STEPS.map(([k, label], i) => (
          <div key={k} className="flex flex-1 flex-col items-center gap-1">
            <div className="relative h-2 w-full overflow-hidden rounded-full bg-white/10">
              <motion.div
                initial={false}
                animate={{ scaleX: i <= curIdx ? 1 : 0 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                style={{ originX: 1 }}
                className="absolute inset-0 rounded-full bg-copper"
              />
            </div>
            <span className={`text-[9px] transition-colors duration-500 ${i <= curIdx ? 'text-copper-light' : 'text-cream/30'}`}>{label}</span>
          </div>
        ))}
      </div>

      {/* customer */}
      <div className="mt-3 grid gap-1.5 rounded-xl bg-white/5 p-3 text-sm">
        <div className="flex items-center gap-2"><Package className="h-3.5 w-3.5 text-cream/40" /> <b>{o.customer_name || '—'}</b></div>
        <div className="flex items-start gap-2"><MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-cream/40" /> <span className="text-cream/80">{[o.area, o.address].filter(Boolean).join(' — ') || '—'}</span></div>
        {o.notes && <div className="text-cream/60">📝 {o.notes}</div>}
        <div className="text-cream/50">💳 {o.payment || '—'}</div>
      </div>

      {/* items */}
      <div className="mt-3 space-y-1">
        {items.map((it, i) => (
          <div key={i} className="flex items-center justify-between text-sm">
            <span className="text-cream/80">{it.name} <span className="text-cream/40">×{it.qty}</span></span>
            <span className="text-cream/60">{fmt((it.price || 0) * (it.qty || 1))} د.ع</span>
          </div>
        ))}
      </div>

      {/* actions */}
      <div className="mt-3 flex flex-wrap gap-2">
        <a href={navUrl} target="_blank" rel="noreferrer"
          className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-3 py-2 text-sm font-bold text-white hover:bg-blue-500">
          <Navigation className="h-4 w-4" /> الملاحة للموقع
        </a>
        {wa && (
          <a href={`https://wa.me/${wa}`} target="_blank" rel="noreferrer"
            className="flex items-center gap-1.5 rounded-xl bg-green-600/90 px-3 py-2 text-sm font-bold text-white hover:bg-green-600">
            <MessageCircle className="h-4 w-4" /> واتساب
          </a>
        )}
        {o.customer_phone && (
          <a href={`tel:${o.customer_phone}`}
            className="flex items-center gap-1.5 rounded-xl bg-white/10 px-3 py-2 text-sm font-bold hover:bg-white/15">
            <Phone className="h-4 w-4" /> اتصال
          </a>
        )}
      </div>

      {/* advance button */}
      {sharing && (
        <div className="mt-3 flex items-center justify-center gap-1.5 rounded-xl bg-green-500/15 py-2 text-xs font-bold text-green-300">
          <Radio className="h-3.5 w-3.5 animate-pulse" /> يتم مشاركة موقعك مع الزبون مباشرة
        </div>
      )}
      {cur !== 'delivered' ? (
        <button onClick={() => onAdvance(o.id, cur)}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-copper py-3 font-display font-bold text-cream transition hover:bg-copper-dark active:scale-[0.98]">
          {NEXT_LABEL[cur]} <ChevronLeft className="h-4 w-4" />
        </button>
      ) : (
        <div className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-green-500/15 py-3 font-display font-bold text-green-300">
          <CheckCircle2 className="h-5 w-5" /> تم التسليم بنجاح
        </div>
      )}
    </div>
  );
}
