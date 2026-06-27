import { useEffect, useMemo, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Truck, Lock, LogOut, RefreshCw, Loader2, Phone, MessageCircle,
  Navigation, MapPin, Package, Check, CheckCircle2, ChevronLeft, Radio, Sun, Moon,
  Wallet, Banknote, TrendingUp, Store as StoreIcon, PackageCheck, Clock3, Star,
} from 'lucide-react';
import { fmt } from '../data/catalog.js';
import { CodeInput, SuccessCheck } from './CodeInput.jsx';
import {
  getDriverSession, setDriverSession, clearDriverSession,
  driverLogin, driverListOrders, driverUpdateDelivery, driverUpdateLocation,
  driverGetMe, driverUpdateProfile, driverWallet, driverOrdersReady, driverOrderStores, driverRatingSummary,
} from '../lib/driver.js';
import ProfileForm, { Avatar } from './ProfileForm.jsx';
import PushToggle from './PushToggle.jsx';
import InstallButton from './InstallButton.jsx';
import { notifyCustomerStatus } from '../lib/push.js';
import { useOrderChime } from '../lib/alerts.js';
import { NewOrderBanner, AlertBell } from './OrderAlert.jsx';

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

// radiating "outline glow" styles (literal classes so Tailwind keeps them)
const GLOW = {
  red:   'bg-red-600 text-white border-2 border-red-400 animate-glow-red hover:bg-red-700',
  green: 'bg-green-600 text-white border-2 border-green-400 animate-glow-green hover:bg-green-700',
  blue:  'bg-blue-600 text-white border-2 border-blue-400 animate-glow-blue hover:bg-blue-700',
};
// advance-button glow by current delivery status
const ADV_GLOW = { assigned: 'red', picked: 'red', on_way: 'green', arrived: 'blue' };

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
  const [shake, setShake] = useState(false);
  const [done, setDone] = useState(false);
  const [plain, setPlain] = useState(false);

  async function submit(code) {
    const p = (code ?? pass).trim();
    if (!p) return;
    setBusy(true); setErr('');
    const res = await driverLogin(p);
    if (res?.ok) {
      setDone(true);
      setTimeout(() => onIn(res.driver), 1050);
    } else {
      setBusy(false);
      setErr('كلمة المرور غير صحيحة');
      setShake(true);
      setTimeout(() => setShake(false), 550);
      setPass('');
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-beige dark:bg-night-900 px-5 font-body text-ink dark:text-cream" dir="rtl">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm rounded-3xl border border-ink/10 dark:border-white/10 bg-cream dark:bg-night-800 p-7 shadow-card">
        <div className="mb-5 flex flex-col items-center gap-3 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-copper/20 text-copper">
            <Truck className="h-7 w-7" />
          </span>
          <div>
            <h1 className="font-display text-2xl font-black">بوابة المندوب</h1>
            <p className="mt-1 text-sm text-ink/50 dark:text-cream/50">اطلبها — للمندوبين</p>
          </div>
        </div>

        {done ? (
          <SuccessCheck label="أهلاً بك 👋" sub="جارٍ فتح البوابة…" />
        ) : (
          <>
            {plain ? (
              <input type="password" value={pass} onChange={(e) => setPass(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submit()} placeholder="كلمة المرور" autoFocus
                className="w-full rounded-2xl border border-ink/10 dark:border-white/10 bg-beige dark:bg-night-900 px-4 py-3 text-center text-lg tracking-widest text-ink dark:text-cream outline-none placeholder:text-ink/35 dark:placeholder:text-cream/30 focus:border-copper" />
            ) : (
              <CodeInput length={6} mask value={pass} onChange={setPass} onComplete={(v) => submit(v)} error={shake} autoFocus autoComplete="off" disabled={busy} />
            )}
            {err && <p className="mt-3 text-center text-sm text-red-400">{err}</p>}
            <button onClick={() => submit()} disabled={busy}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-copper py-3 font-display font-bold text-ink dark:text-cream hover:bg-copper-dark disabled:opacity-60">
              {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Lock className="h-5 w-5" />} دخول
            </button>
            <button type="button" onClick={() => { setPlain((v) => !v); setPass(''); setErr(''); }}
              className="mt-3 block w-full text-center text-xs text-ink/40 transition hover:text-copper dark:text-cream/40">
              {plain ? 'استخدم مربّعات الرمز' : 'كلمة مرور عادية؟'}
            </button>
          </>
        )}
        <a href="/" className="mt-4 block text-center text-xs text-ink/40 dark:text-cream/40 hover:text-cream/70">→ العودة للمتجر</a>
      </motion.div>
    </div>
  );
}

/* ───────────── Board ───────────── */
function Board({ driver, onOut }) {
  const [orders, setOrders] = useState([]);
  const [readyMap, setReadyMap] = useState({}); // orderId -> {ready_count, store_count}
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('active'); // active | done
  const [showProfile, setShowProfile] = useState(false);
  const [me, setMe] = useState(null);
  const [rating, setRating] = useState(null); // { rating, count }

  useEffect(() => {
    driverGetMe(driver.id).then((r) => { if (r?.ok) setMe(r.profile); });
    driverRatingSummary(driver.id).then((r) => { if (r?.ok) setRating(r); });
    /* eslint-disable-next-line */
  }, []);

  // theme (follows phone by default; toggle persists choice)
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'));
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    try { localStorage.setItem('otlobha-theme', dark ? 'dark' : 'light'); } catch { /* ignore */ }
  }, [dark]);

  async function load() {
    setLoading(true);
    const res = await driverListOrders(driver.id);
    setOrders(Array.isArray(res?.orders) ? res.orders : []);
    fetchReady();
    setLoading(false);
  }
  async function fetchReady() {
    const r = await driverOrdersReady(driver.id);
    if (Array.isArray(r)) {
      const m = {};
      for (const x of r) m[x.order_id] = { ready_count: x.ready_count, store_count: x.store_count };
      setReadyMap(m);
    }
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  // silent live sync every 5s (orders + readiness)
  useEffect(() => {
    const t = setInterval(async () => {
      const res = await driverListOrders(driver.id);
      if (Array.isArray(res?.orders)) setOrders(res.orders);
      fetchReady();
    }, 5000);
    return () => clearInterval(t);
    /* eslint-disable-next-line */
  }, []);

  const active = useMemo(() => orders.filter((o) => o.delivery_status !== 'delivered'), [orders]);
  const done = useMemo(() => orders.filter((o) => o.delivery_status === 'delivered'), [orders]);
  const assignedCount = useMemo(() => orders.filter((o) => o.delivery_status === 'assigned').length, [orders]);
  const alert = useOrderChime(assignedCount);
  // count of orders fully ready but not yet picked up — rings when one becomes ready
  const readyToPickup = useMemo(
    () => active.filter((o) => {
      const r = readyMap[o.id];
      return r && r.store_count > 0 && r.ready_count >= r.store_count && o.delivery_status === 'assigned';
    }).length,
    [active, readyMap]
  );
  const readyAlert = useOrderChime(readyToPickup);
  const shown = tab === 'active' ? active : done;

  async function advance(orderId, current) {
    const next = NEXT[current];
    if (!next) return;
    const res = await driverUpdateDelivery(driver.id, orderId, next);
    if (res?.ok) {
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, delivery_status: next, status: res.order?.status || o.status } : o)));
      if (next === 'on_way' || next === 'arrived' || next === 'delivered') notifyCustomerStatus(orderId, next);
    }
  }

  return (
    <div className="min-h-screen bg-beige dark:bg-night-900 font-body text-ink dark:text-cream" dir="rtl">
      <header className="sticky top-0 z-20 border-b border-ink/10 dark:border-white/10 bg-beige/90 dark:bg-night-900/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2.5">
            {me?.avatar_url
              ? <Avatar name={me.name || driver.name} url={me.avatar_url} size={38} />
              : <span className="grid h-9 w-9 place-items-center rounded-xl bg-copper/20 text-copper"><Truck className="h-5 w-5" /></span>}
            <div className="leading-tight">
              <div className="font-display text-lg font-black">مرحباً {driver.name || driver.username}</div>
              <div className="flex items-center gap-2 text-[11px] text-ink/45 dark:text-cream/45">
                <span>{active.length} طلب نشط</span>
                {rating?.rating != null && (
                  <span className="inline-flex items-center gap-0.5 font-bold text-amber-500"><Star className="h-3 w-3 fill-amber-400 text-amber-400" /> {rating.rating} <span className="font-normal text-ink/40 dark:text-cream/40">({rating.count})</span></span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <AlertBell muted={alert.muted} onToggle={alert.toggleMute} hasNew={alert.hasNew} primed={alert.primed} />
            <button onClick={() => setDark((d) => !d)} aria-label="تبديل الوضع"
              className="grid h-9 w-9 place-items-center rounded-xl bg-ink/5 text-ink/70 hover:bg-ink/10 dark:bg-white/5 dark:text-cream/80 dark:hover:bg-white/10">
              {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <span className="flex items-center gap-1.5 rounded-full bg-ink/5 dark:bg-white/5 px-3 py-1.5 text-[11px] font-bold text-green-600 dark:text-green-300">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-green-400" />
              </span>
              مباشر
            </span>
            <button onClick={onOut} className="flex items-center gap-1.5 rounded-xl bg-ink/5 dark:bg-white/5 px-3 py-2 text-sm text-red-700 dark:text-red-300 hover:bg-red-500/10">
              <LogOut className="h-4 w-4" /> خروج
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl space-y-4 px-4 py-5">
        {alert.newCount > 0 && (
          <NewOrderBanner count={alert.newCount} onAck={() => { alert.acknowledge(); setTab('active'); }} />
        )}
        {readyAlert.newCount > 0 && (
          <button onClick={() => { readyAlert.acknowledge(); setTab('active'); }}
            className="flex w-full items-center justify-between gap-3 rounded-2xl bg-gradient-to-l from-green-600 to-emerald-500 px-4 py-3 text-white shadow-seal ring-1 ring-white/20">
            <span className="flex items-center gap-2">
              <span className="relative flex h-9 w-9 items-center justify-center rounded-full bg-white/20">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white/30" />
                <PackageCheck className="relative h-5 w-5" />
              </span>
              <span className="text-right">
                <span className="block font-display text-base font-black leading-tight">طلب جاهز للاستلام!</span>
                <span className="block font-body text-[11px] text-white/80">المتجر جهّز الطلب — توجّه لاستلامه</span>
              </span>
            </span>
            <Check className="h-5 w-5" />
          </button>
        )}
        {/* daily summary */}
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-2xl bg-cream p-3 text-center shadow-soft ring-1 ring-brand-900/5 dark:bg-night-800 dark:ring-white/10">
            <div className="font-display text-2xl font-black text-copper dark:text-copper-light">{active.length}</div>
            <div className="text-[11px] text-ink/50 dark:text-cream/50">طلب نشط</div>
          </div>
          <div className="rounded-2xl bg-cream p-3 text-center shadow-soft ring-1 ring-brand-900/5 dark:bg-night-800 dark:ring-white/10">
            <div className="font-display text-2xl font-black text-green-600 dark:text-green-400">{done.length}</div>
            <div className="text-[11px] text-ink/50 dark:text-cream/50">مُسلّم</div>
          </div>
          <div className="rounded-2xl bg-cream p-3 text-center shadow-soft ring-1 ring-brand-900/5 dark:bg-night-800 dark:ring-white/10">
            <div className="font-display text-2xl font-black text-ink dark:text-cream">{active.length + done.length}</div>
            <div className="text-[11px] text-ink/50 dark:text-cream/50">الإجمالي</div>
          </div>
        </div>

        {/* tabs */}
        <div className="flex gap-2">
          {[['active', 'النشطة', Package, active.length], ['done', 'المُسلّمة', CheckCircle2, done.length], ['wallet', 'محفظتي', Wallet, null]].map(([k, label, Icon, count]) => (
            <button key={k} onClick={() => setTab(k)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-bold transition ${tab === k ? 'bg-copper text-ink shadow-soft dark:text-cream' : 'bg-ink/5 dark:bg-white/5 text-ink/65 dark:text-cream/70 hover:bg-ink/10 dark:hover:bg-white/10'}`}>
              <Icon className="h-4 w-4" /> {label}{count != null ? ` (${count})` : ''}
            </button>
          ))}
        </div>

        {tab === 'wallet' ? (
          <DriverWallet driverId={driver.id} />
        ) : loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-ink/50 dark:text-cream/50"><Loader2 className="h-5 w-5 animate-spin" /> جارٍ التحميل…</div>
        ) : shown.length === 0 ? (
          <div className="py-16 text-center text-ink/40 dark:text-cream/40">{tab === 'active' ? 'لا توجد طلبات نشطة الآن.' : 'لا توجد طلبات مُسلّمة بعد.'}</div>
        ) : (
          <div className="space-y-3">{shown.map((o) => <DeliveryCard key={o.id} o={o} ready={readyMap[o.id]} onAdvance={advance} driverId={driver.id} />)}</div>
        )}

        {/* device push notifications */}
        <div className="mt-4 rounded-2xl bg-copper/[0.06] p-3.5 ring-1 ring-copper/15">
          <span className="mb-1 flex items-center gap-1.5 font-display text-sm font-black text-ink dark:text-cream"><Radio className="h-4 w-4 text-copper" /> إشعارات الطلبات</span>
          <p className="mb-2.5 text-[11px] leading-snug text-ink/50 dark:text-cream/50">فعّلها لتصلك تنبيهات الطلبات المُسندة إليك على جهازك حتى لو التطبيق مسكّر.</p>
          <PushToggle partyType="driver" partyId={driver.id} />
        </div>

        <div className="mt-3"><InstallButton variant="card" /></div>

        {/* my profile */}
        <div className="mt-4 rounded-2xl border border-ink/10 dark:border-white/10 bg-cream dark:bg-night-800">
          <button onClick={() => setShowProfile((v) => !v)}
            className="flex w-full items-center justify-between px-4 py-3 font-display font-bold text-ink dark:text-cream">
            <span className="flex items-center gap-2"><Truck className="h-4 w-4 text-copper" /> ملفّي الشخصي</span>
            <ChevronLeft className={`h-5 w-5 transition ${showProfile ? '-rotate-90' : ''}`} />
          </button>
          <AnimatePresence>
            {showProfile && me && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="px-4 pb-4">
                  <ProfileForm
                    initial={me}
                    show={{ phone: true, email: true, birthdate: true, gender: true, vehicle: true }}
                    uploadPrefix="driver"
                    uploadId={driver.id}
                    onAvatarChange={async (url) => {
                      const r = await driverUpdateProfile(driver.id, { avatar_url: url });
                      if (r?.ok) setMe(r.profile);
                      return { error: r?.ok ? undefined : (r?.msg || 'تعذّر الحفظ') };
                    }}
                    onSave={async (vals) => {
                      const r = await driverUpdateProfile(driver.id, {
                        name: vals.name.trim(), phone: vals.phone.trim() || null, email: vals.email.trim() || null,
                        birthdate: vals.birthdate || null, gender: vals.gender || null, vehicle: vals.vehicle.trim() || null,
                      });
                      if (r?.ok) setMe(r.profile);
                      return { error: r?.ok ? undefined : (r?.msg || 'تعذّر الحفظ') };
                    }}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="pb-6 pt-2 text-center text-xs text-ink/35 dark:text-cream/30">اطلبها — بوابة المندوب</div>
      </main>
    </div>
  );
}

/* ───────────── Delivery card ───────────── */
function DriverWallet({ driverId }) {
  const [w, setW] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let on = true;
    driverWallet(driverId).then((r) => { if (on) { setW(r?.ok ? r : null); setLoading(false); } });
    return () => { on = false; };
  }, [driverId]);

  if (loading) return <div className="flex items-center justify-center gap-2 py-16 text-ink/50 dark:text-cream/50"><Loader2 className="h-5 w-5 animate-spin" /> جارٍ تحميل المحفظة…</div>;
  if (!w) return <div className="py-16 text-center text-ink/40 dark:text-cream/40">تعذّر تحميل المحفظة.</div>;

  const list = w.deliveries_list || [];
  return (
    <div className="space-y-4">
      {/* hero: earnings */}
      <div className="rounded-3xl bg-gradient-to-br from-brand-800 to-brand-900 p-5 text-cream shadow-card">
        <div className="flex items-center gap-2 text-cream/80"><TrendingUp className="h-4 w-4" /> <span className="text-sm font-bold">أرباحك من التوصيل</span></div>
        <p className="mt-1 font-display text-4xl font-black">{fmt(w.earned)} <span className="text-lg">د.ع</span></p>
        <p className="mt-1 text-sm text-cream/70">من {w.deliveries} توصيلة مُسلّمة</p>
      </div>

      {/* cash flow */}
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-2xl bg-cream p-3.5 shadow-soft ring-1 ring-brand-900/5 dark:bg-night-800 dark:ring-white/10">
          <div className="flex items-center gap-1.5 text-ink/55 dark:text-cream/55"><Banknote className="h-4 w-4" /> <span className="text-[11px]">حصّلته نقداً</span></div>
          <p className="mt-1 font-display text-xl font-black text-ink dark:text-cream">{fmt(w.collected)}</p>
          <p className="text-[10px] text-ink/40 dark:text-cream/40">دينار (بضاعة + توصيل)</p>
        </div>
        <div className="rounded-2xl bg-copper/10 p-3.5 shadow-soft ring-1 ring-copper/30">
          <div className="flex items-center gap-1.5 text-copper-dark dark:text-copper-light"><Wallet className="h-4 w-4" /> <span className="text-[11px] font-bold">تسلّمه للإدارة</span></div>
          <p className="mt-1 font-display text-xl font-black text-copper dark:text-copper-light">{fmt(w.remaining)}</p>
          <p className="text-[10px] text-ink/40 dark:text-cream/40">المتبقّي بعد أجرتك</p>
        </div>
      </div>
      <p className="rounded-xl bg-beige/60 px-3 py-2 text-center text-[11px] text-ink/50 dark:bg-night-900/60 dark:text-cream/50">
        💡 أجرتك: <b>١٥٠٠ د.ع</b> لكل توصيلة + <b>٥٠٠ د.ع</b> لكل محل إضافي بنفس الطلب.
      </p>

      {/* per-delivery breakdown */}
      <div className="flex items-center gap-2"><Package className="h-4 w-4 text-ink/50 dark:text-cream/50" /><h3 className="font-display text-sm font-black text-ink dark:text-cream">تفاصيل التوصيلات ({list.length})</h3></div>
      {list.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ink/15 py-12 text-center text-sm text-ink/45 dark:border-white/15 dark:text-cream/45">لا توجد توصيلات مُسلّمة بعد.</div>
      ) : (
        <div className="space-y-2">
          {list.map((d) => (
            <div key={d.id} className="flex items-center justify-between rounded-2xl bg-cream p-3 shadow-soft ring-1 ring-brand-900/5 dark:bg-night-800 dark:ring-white/10">
              <div>
                <p className="font-display font-bold text-ink dark:text-cream">طلب #{d.order_no || '—'}</p>
                <p className="flex items-center gap-1 text-[11px] text-ink/45 dark:text-cream/45">
                  <StoreIcon className="h-3 w-3" /> {d.stores || 1} محل · {new Date(d.created_at).toLocaleDateString('en-GB')}
                </p>
              </div>
              <div className="text-left">
                <p className="font-display font-black text-green-600 dark:text-green-400">+{fmt(d.fee)} د.ع</p>
                <p className="text-[10px] text-ink/40 dark:text-cream/40">حصّل {fmt(d.total)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DeliveryCard({ o, ready, onAdvance, driverId }) {
  const items = Array.isArray(o.items) ? o.items : [];
  const cur = o.delivery_status || 'assigned';
  const wa = digits(o.customer_phone);
  const curIdx = STEPS.findIndex(([k]) => k === cur);
  const lastSent = useRef(0);
  const watchId = useRef(null);
  const [geoState, setGeoState] = useState('off'); // off | locating | live | denied | error
  const [stores, setStores] = useState([]); // pickup stores with locations
  const shouldShare = cur === 'on_way' || cur === 'arrived';

  useEffect(() => {
    let alive = true;
    driverOrderStores(o.id).then((r) => { if (alive && Array.isArray(r)) setStores(r); });
    return () => { alive = false; };
  }, [o.id]);

  function sendPos(pos, force) {
    const now = Date.now();
    if (!force && now - lastSent.current < 8000) return; // throttle ~8s
    lastSent.current = now;
    driverUpdateLocation(driverId, o.id, pos.coords.latitude, pos.coords.longitude);
    setGeoState('live');
  }

  function onGeoErr(err) {
    if (err && err.code === 1) setGeoState('denied'); // permission denied
    else setGeoState('error'); // timeout / unavailable
  }

  // manual "send my location now" fallback
  function sendNow() {
    if (!('geolocation' in navigator)) { setGeoState('error'); return; }
    setGeoState((s) => (s === 'live' ? 'live' : 'locating'));
    navigator.geolocation.getCurrentPosition(
      (pos) => sendPos(pos, true),
      onGeoErr,
      { enableHighAccuracy: true, maximumAge: 0, timeout: 25000 }
    );
  }

  // share live GPS while on the way / arrived
  useEffect(() => {
    if (!shouldShare) { setGeoState('off'); return; }
    if (!('geolocation' in navigator)) { setGeoState('error'); return; }
    setGeoState('locating');
    // 1) get an immediate first fix (fast), then 2) keep watching
    navigator.geolocation.getCurrentPosition(
      (pos) => sendPos(pos, true),
      onGeoErr,
      { enableHighAccuracy: true, maximumAge: 0, timeout: 25000 }
    );
    watchId.current = navigator.geolocation.watchPosition(
      (pos) => sendPos(pos, false),
      onGeoErr,
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 27000 }
    );
    return () => { if (watchId.current != null) navigator.geolocation.clearWatch(watchId.current); };
    // eslint-disable-next-line
  }, [cur, o.id, driverId]);

  // navigation link: prefer the customer's shared GPS location, else search the address text
  const navUrl = o.location_url
    ? o.location_url
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([o.area, o.address, 'السماوة'].filter(Boolean).join(' '))}`;

  return (
    <div className="rounded-2xl border border-ink/10 dark:border-white/10 bg-cream dark:bg-night-800 p-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="font-display text-lg font-black">طلب #{o.order_no}</div>
          <AnimatePresence mode="popLayout">
            <motion.span key={cur}
              initial={{ scale: 0.5, opacity: 0, y: -3 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.5, opacity: 0, y: 3 }}
              transition={{ type: 'spring', stiffness: 420, damping: 17 }}
              className="relative mt-1 inline-flex items-center gap-1.5 overflow-hidden rounded-full border border-copper/40 bg-copper/15 px-2.5 py-0.5 text-[11px] font-bold text-copper-dark dark:text-copper-light">
              <motion.span key={cur + 'r'}
                initial={{ scale: 0.7, opacity: 0.7 }} animate={{ scale: 2.4, opacity: 0 }}
                transition={{ duration: 1.1, ease: 'easeOut' }}
                className="pointer-events-none absolute inset-0 rounded-full bg-copper/40" />
              <motion.span initial={{ x: '-160%' }} animate={{ x: '160%' }}
                transition={{ duration: 1.3, ease: 'easeInOut', repeat: Infinity, repeatDelay: 2.6 }}
                className="pointer-events-none absolute inset-y-0 w-1/3 -skew-x-12 bg-white/25 blur-[2px]" />
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-copper opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-copper" />
              </span>
              <span className="relative">{STEP_LABEL[cur]}</span>
            </motion.span>
          </AnimatePresence>
        </div>
        <div className="font-display text-lg font-black text-green-600 dark:text-green-300">{fmt(o.total || 0)} <span className="text-xs">د.ع</span></div>
      </div>

      {/* readiness from the store(s) */}
      {ready && ready.store_count > 0 && cur === 'assigned' && (
        ready.ready_count >= ready.store_count ? (
          <div className="mt-2 flex items-center gap-1.5 rounded-xl bg-green-500/12 px-3 py-2 font-display text-sm font-black text-green-700 ring-1 ring-green-500/20 dark:text-green-300">
            <PackageCheck className="h-4 w-4" /> جاهز للاستلام — توجّه للمتجر
          </div>
        ) : (
          <div className="mt-2 flex items-center gap-1.5 rounded-xl bg-amber-500/12 px-3 py-2 font-display text-sm font-bold text-amber-700 ring-1 ring-amber-500/20 dark:text-amber-300">
            <Clock3 className="h-4 w-4" /> قيد التجهيز {ready.store_count > 1 ? `(${ready.ready_count}/${ready.store_count} متجر جاهز)` : '— انتظر إشعار الجاهزية'}
          </div>
        )
      )}

      {/* pickup store(s) — navigate to grab the goods */}
      {stores.length > 0 && cur !== 'delivered' && (
        <div className="mt-2 space-y-1.5 rounded-xl bg-ink/[0.03] p-2 dark:bg-white/[0.03]">
          <div className="px-1 text-[11px] font-bold text-ink/45 dark:text-cream/45">{stores.length > 1 ? 'الاستلام من المتاجر:' : 'الاستلام من المتجر:'}</div>
          {stores.map((s) => (
            <div key={s.id} className="flex items-center justify-between gap-2 rounded-lg bg-cream px-2.5 py-1.5 dark:bg-night-900/60">
              <span className="flex min-w-0 items-center gap-1.5 text-sm font-bold text-ink/80 dark:text-cream/80">
                <StoreIcon className="h-3.5 w-3.5 shrink-0 text-copper" /> <span className="truncate">{s.name}</span>
              </span>
              {s.lat && s.lng ? (
                <a href={`https://www.google.com/maps/dir/?api=1&destination=${s.lat},${s.lng}`} target="_blank" rel="noreferrer"
                  className="flex shrink-0 items-center gap-1 rounded-lg bg-brand-700 px-2.5 py-1 text-[11px] font-bold text-cream transition hover:bg-brand-800">
                  <Navigation className="h-3 w-3" /> الخريطة
                </a>
              ) : (
                <span className="shrink-0 rounded-lg bg-ink/5 px-2 py-1 text-[10px] text-ink/40 dark:bg-white/5 dark:text-cream/40">لا موقع</span>
              )}
            </div>
          ))}
        </div>
      )}
      <div className="mt-3 flex items-center gap-1">
        {STEPS.map(([k, label], i) => {
          const isCur = i === curIdx;
          return (
            <div key={k} className="flex flex-1 flex-col items-center gap-1">
              <div className="relative h-2 w-full overflow-hidden rounded-full bg-ink/10 dark:bg-white/10">
                <motion.div
                  initial={false}
                  animate={isCur
                    ? { scaleX: 1, boxShadow: ['0 0 0px rgba(193,124,79,0)', '0 0 10px rgba(193,124,79,0.9)', '0 0 0px rgba(193,124,79,0)'] }
                    : { scaleX: i <= curIdx ? 1 : 0 }}
                  transition={isCur
                    ? { scaleX: { duration: 0.4 }, boxShadow: { duration: 1.6, repeat: Infinity } }
                    : { duration: 0.4, ease: 'easeOut' }}
                  style={{ originX: 1 }}
                  className="absolute inset-0 rounded-full bg-copper"
                />
              </div>
              <span className={`text-[9px] transition-colors duration-500 ${i <= curIdx ? 'text-copper-dark dark:text-copper-light' : 'text-ink/35 dark:text-cream/30'}`}>{label}</span>
            </div>
          );
        })}
      </div>

      {/* customer */}
      <div className="mt-3 grid gap-1.5 rounded-xl bg-ink/5 dark:bg-white/5 p-3 text-sm">
        <div className="flex items-center gap-2"><Package className="h-3.5 w-3.5 text-ink/40 dark:text-cream/40" /> <b>{o.customer_name || '—'}</b></div>
        <div className="flex items-start gap-2"><MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink/40 dark:text-cream/40" /> <span className="text-ink/70 dark:text-cream/80">{[o.area, o.address].filter(Boolean).join(' — ') || '—'}</span></div>
        {o.notes && <div className="text-ink/55 dark:text-cream/60">📝 {o.notes}</div>}
        <div className="text-ink/50 dark:text-cream/50">💳 {o.payment || '—'}</div>
      </div>

      {/* items */}
      <div className="mt-3 space-y-1">
        {items.map((it, i) => (
          <div key={i} className="flex items-center justify-between text-sm">
            <span className="text-ink/70 dark:text-cream/80">{it.name} <span className="text-ink/40 dark:text-cream/40">×{it.qty}</span></span>
            <span className="text-ink/55 dark:text-cream/60">{fmt((it.price || 0) * (it.qty || 1))} د.ع</span>
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
            className="flex items-center gap-1.5 rounded-xl bg-ink/10 dark:bg-white/10 px-3 py-2 text-sm font-bold hover:bg-ink/10 dark:hover:bg-white/15">
            <Phone className="h-4 w-4" /> اتصال
          </a>
        )}
      </div>

      {/* live location status (honest states) */}
      {shouldShare && (
        <div className="mt-3 space-y-2">
          {geoState === 'live' && (
            <div className="flex items-center justify-center gap-1.5 rounded-xl bg-green-500/15 py-2 text-xs font-bold text-green-600 dark:text-green-300">
              <Radio className="h-3.5 w-3.5 animate-pulse" /> يتم مشاركة موقعك مع الزبون مباشرة
            </div>
          )}
          {geoState === 'locating' && (
            <div className="flex items-center justify-center gap-1.5 rounded-xl bg-amber-500/15 py-2 text-xs font-bold text-amber-700 dark:text-amber-300">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> جارٍ تحديد موقعك…
            </div>
          )}
          {(geoState === 'denied' || geoState === 'error') && (
            <div className="rounded-xl bg-red-500/15 px-3 py-2 text-center text-[11px] font-bold text-red-600 dark:text-red-300">
              {geoState === 'denied'
                ? '⚠️ الموقع محظور. فعّل إذن الموقع لهذا الموقع من إعدادات المتصفّح (في Brave: أوقف الدرع Shields لهذا الموقع).'
                : '⚠️ تعذّر تحديد موقعك. تأكّد أن GPS مُفعّل وأنت في مكان مكشوف.'}
            </div>
          )}
          <button onClick={sendNow}
            className={`flex w-full items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-bold transition active:scale-[0.98] ${geoState === 'live' ? GLOW.green : GLOW.red}`}>
            <Navigation className="h-4 w-4" /> {geoState === 'live' ? 'موقعك يُرسَل الآن ✓' : 'أرسل موقعي الآن'}
          </button>
        </div>
      )}

      {cur !== 'delivered' ? (
        <button onClick={() => onAdvance(o.id, cur)}
          className={`mt-3 flex w-full items-center justify-center gap-2 rounded-xl py-3 font-display font-bold transition active:scale-[0.98] ${GLOW[ADV_GLOW[cur]] || GLOW.red}`}>
          {NEXT_LABEL[cur]} <ChevronLeft className="h-4 w-4" />
        </button>
      ) : (
        <div className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-green-500/15 py-3 font-display font-bold text-green-600 dark:text-green-300">
          <CheckCircle2 className="h-5 w-5" /> تم التسليم بنجاح
        </div>
      )}
    </div>
  );
}
