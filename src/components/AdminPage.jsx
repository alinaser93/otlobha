import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence, Reorder, useDragControls } from 'framer-motion';
import {
  Lock, LogOut, RefreshCw, Loader2, Package, Clock, MapPin, Phone,
  MessageCircle, Navigation, UserPlus, Trash2, Users, Check, X,
  ShoppingBag, Wallet, ChevronDown, Truck, Sun, Moon,
  Plus, Pencil, Eye, EyeOff, GripVertical, Image as ImageIcon, Layers, Save,
} from 'lucide-react';
import { fmt } from '../data/catalog.js';
import ProfileForm, { Avatar } from './ProfileForm.jsx';
import {
  getAdminSession, setAdminSession, clearAdminSession,
  adminLogin, adminListOrders, adminUpdateStatus, adminStats,
  adminListAdmins, adminAdd, adminRemove,
  adminListDrivers, adminAddDriver, adminRemoveDriver, adminAssignDriver,
  adminGetMe, adminUpdateProfile,
} from '../lib/admin.js';
import {
  adminListProducts, adminAddProduct, adminUpdateProduct, adminRemoveProduct,
  adminSetProductActive, adminReorderProducts,
  adminListCategories, adminAddCategory, adminUpdateCategory, adminRemoveCategory,
  adminReorderCategories,
} from '../lib/products.js';
import { uploadProductImage } from '../lib/storage.js';

const STATUS = {
  new: { label: 'جديد', dot: 'bg-amber-400', chip: 'border-amber-500/30 bg-amber-500/15 text-amber-700 dark:text-amber-300', glow: 'bg-amber-400/40' },
  preparing: { label: 'قيد التحضير', dot: 'bg-blue-400', chip: 'border-blue-500/30 bg-blue-500/15 text-blue-700 dark:text-blue-300', glow: 'bg-blue-400/40' },
  delivering: { label: 'جارٍ التوصيل', dot: 'bg-indigo-400', chip: 'border-indigo-500/30 bg-indigo-500/15 text-indigo-700 dark:text-indigo-300', glow: 'bg-indigo-400/40' },
  done: { label: 'تم التوصيل', dot: 'bg-green-400', chip: 'border-green-500/30 bg-green-500/15 text-green-600 dark:text-green-300', glow: 'bg-green-400/40' },
  cancelled: { label: 'ملغى', dot: 'bg-red-400', chip: 'border-red-500/30 bg-red-500/15 text-red-700 dark:text-red-300', glow: 'bg-red-400/40' },
};
const TABS = [
  ['all', 'الكل'], ['new', 'جديد'], ['preparing', 'قيد التحضير'],
  ['delivering', 'جارٍ التوصيل'], ['done', 'تم'], ['cancelled', 'ملغى'],
];
const digits = (p) => (p || '').replace(/[^\d]/g, '');
const fmtDate = (iso) => {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('ar', { month: 'short', day: 'numeric' }) + ' · ' +
      d.toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit' });
  } catch { return ''; }
};

export default function AdminPage() {
  const [admin, setAdmin] = useState(() => getAdminSession());

  if (!admin) return <Login onIn={(a) => { setAdminSession(a); setAdmin(a); }} />;
  return <Dashboard admin={admin} onOut={() => { clearAdminSession(); setAdmin(null); }} />;
}

/* ───────────────────────── Login ───────────────────────── */
function Login({ onIn }) {
  const [pass, setPass] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  async function submit() {
    if (!pass.trim()) return;
    setBusy(true); setErr('');
    const res = await adminLogin(pass.trim());
    setBusy(false);
    if (res?.ok) onIn(res.admin);
    else setErr('كلمة المرور غير صحيحة');
  }

  return (
    <div className="grid min-h-screen place-items-center bg-beige dark:bg-night-900 px-5 font-body text-ink dark:text-cream" dir="rtl">
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm rounded-3xl border border-ink/10 dark:border-white/10 bg-cream dark:bg-night-800 p-7 shadow-card"
      >
        <div className="mb-5 flex flex-col items-center gap-3 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-copper/20 text-copper">
            <Lock className="h-7 w-7" />
          </span>
          <div>
            <h1 className="font-display text-2xl font-black">لوحة الإدارة</h1>
            <p className="mt-1 text-sm text-ink/50 dark:text-cream/50">اطلبها — للمشرفين فقط</p>
          </div>
        </div>
        <input
          type="password" value={pass} onChange={(e) => setPass(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder="كلمة المرور" autoFocus
          className="w-full rounded-2xl border border-ink/10 dark:border-white/10 bg-beige dark:bg-night-900 px-4 py-3 text-center font-body text-lg tracking-widest text-ink dark:text-cream outline-none placeholder:text-ink/35 dark:placeholder:text-cream/30 focus:border-copper"
        />
        {err && <p className="mt-2 text-center text-sm text-red-400">{err}</p>}
        <button
          onClick={submit} disabled={busy}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-copper py-3 font-display font-bold text-ink dark:text-cream transition hover:bg-copper-dark disabled:opacity-60"
        >
          {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Lock className="h-5 w-5" />}
          دخول
        </button>
        <a href="/" className="mt-4 block text-center text-xs text-ink/40 dark:text-cream/40 hover:text-cream/70">→ العودة للمتجر</a>
      </motion.div>
    </div>
  );
}

/* ───────────────────────── Dashboard ───────────────────────── */
function Dashboard({ admin, onOut }) {
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState(null);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showAdmins, setShowAdmins] = useState(false);
  const [showDrivers, setShowDrivers] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showProducts, setShowProducts] = useState(false);
  const [showCats, setShowCats] = useState(false);
  const [me, setMe] = useState(null);

  // load my profile once
  useEffect(() => {
    adminGetMe(admin.id).then((r) => { if (r?.ok) setMe(r.profile); });
    /* eslint-disable-next-line */
  }, []);

  // theme (follows phone by default via no-FOUC script; toggle persists choice)
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'));
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    try { localStorage.setItem('otlobha-theme', dark ? 'dark' : 'light'); } catch { /* ignore */ }
  }, [dark]);

  async function load() {
    setLoading(true);
    const [o, s, d] = await Promise.all([
      adminListOrders(admin.id, null, 500),
      adminStats(admin.id),
      adminListDrivers(admin.id),
    ]);
    setOrders(Array.isArray(o?.orders) ? o.orders : []);
    setStats(s?.ok ? s.stats : null);
    setDrivers(Array.isArray(d?.drivers) ? d.drivers : []);
    setLoading(false);
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  // silent live sync every 8s (no spinner flash)
  useEffect(() => {
    const t = setInterval(async () => {
      const [o, s, d] = await Promise.all([
        adminListOrders(admin.id, null, 500),
        adminStats(admin.id),
        adminListDrivers(admin.id),
      ]);
      if (Array.isArray(o?.orders)) setOrders(o.orders);
      if (s?.ok) setStats(s.stats);
      if (Array.isArray(d?.drivers)) setDrivers(d.drivers);
    }, 5000);
    return () => clearInterval(t);
    /* eslint-disable-next-line */
  }, []);

  const counts = useMemo(() => {
    const c = { all: orders.length };
    for (const o of orders) c[o.status] = (c[o.status] || 0) + 1;
    return c;
  }, [orders]);

  const shown = useMemo(
    () => (filter === 'all' ? orders : orders.filter((o) => o.status === filter)),
    [orders, filter]
  );

  async function setStatus(orderId, status) {
    const res = await adminUpdateStatus(admin.id, orderId, status);
    if (res?.ok) {
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status } : o)));
      adminStats(admin.id).then((s) => s?.ok && setStats(s.stats));
    }
  }

  async function assignDriver(orderId, driverId) {
    const res = await adminAssignDriver(admin.id, orderId, driverId);
    if (res?.ok && res.order) {
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, ...res.order } : o)));
    }
  }

  return (
    <div className="min-h-screen bg-beige dark:bg-night-900 font-body text-ink dark:text-cream" dir="rtl">
      {/* top bar */}
      <header className="sticky top-0 z-20 border-b border-ink/10 dark:border-white/10 bg-beige/90 dark:bg-night-900/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2.5">
            {me?.avatar_url
              ? <Avatar name={me.name || admin.name} url={me.avatar_url} size={38} />
              : <span className="grid h-9 w-9 place-items-center rounded-xl bg-copper/20 text-copper">
                  <Package className="h-5 w-5" />
                </span>}
            <div className="leading-tight">
              <div className="font-display text-lg font-black">لوحة الإدارة</div>
              <div className="text-[11px] text-ink/45 dark:text-cream/45">أهلاً {admin.name || admin.username}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
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

      <main className="mx-auto max-w-5xl space-y-5 px-4 py-5">
        {/* stats */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <Stat icon={Clock} label="طلبات اليوم" value={stats?.today_orders ?? '—'} accent="text-amber-700 dark:text-amber-300" />
          <Stat icon={ShoppingBag} label="إجمالي الطلبات" value={stats?.total_orders ?? '—'} accent="text-blue-700 dark:text-blue-300" />
          <Stat icon={Wallet} label="مبيعات اليوم" value={stats ? `${fmt(stats.today_sales)}` : '—'} suffix="د.ع" accent="text-green-600 dark:text-green-300" />
          <Stat icon={Wallet} label="إجمالي المبيعات" value={stats ? `${fmt(stats.total_sales)}` : '—'} suffix="د.ع" accent="text-green-600 dark:text-green-300" />
          <Stat icon={Package} label="قيد التنفيذ" value={stats?.pending ?? '—'} accent="text-indigo-700 dark:text-indigo-300" />
        </div>

        {/* top areas */}
        {stats?.by_area?.length > 0 && (
          <div className="rounded-2xl border border-ink/10 dark:border-white/10 bg-cream dark:bg-night-800 p-4">
            <div className="mb-3 flex items-center gap-2 font-display font-bold">
              <MapPin className="h-4 w-4 text-copper" /> المناطق الأكثر طلباً
            </div>
            <div className="flex flex-wrap gap-2">
              {stats.by_area.slice(0, 8).map((a, i) => (
                <div key={i} className="flex items-center gap-2 rounded-xl bg-ink/5 dark:bg-white/5 px-3 py-1.5 text-sm">
                  <span className="font-bold">{a.area}</span>
                  <span className="text-ink/40 dark:text-cream/40">·</span>
                  <span className="text-copper-dark dark:text-copper-light">{a.count} طلب</span>
                  <span className="text-ink/40 dark:text-cream/40">·</span>
                  <span className="text-green-600 dark:text-green-300">{fmt(a.sales)} د.ع</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* filter tabs */}
        <div className="flex flex-wrap gap-2">
          {TABS.map(([k, label]) => (
            <button
              key={k} onClick={() => setFilter(k)}
              className={`rounded-full border px-3.5 py-1.5 text-sm font-bold transition ${
                filter === k
                  ? 'border-copper bg-copper text-ink dark:text-cream'
                  : 'border-ink/10 dark:border-white/10 bg-ink/5 dark:bg-white/5 text-ink/65 dark:text-cream/70 hover:bg-ink/10 dark:hover:bg-white/10'
              }`}
            >
              {label}
              {counts[k] > 0 && (
                <span className={`mr-1.5 rounded-full px-1.5 text-xs ${filter === k ? 'bg-black/20' : 'bg-ink/10 dark:bg-white/10'}`}>
                  {counts[k]}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* orders */}
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-ink/50 dark:text-cream/50">
            <Loader2 className="h-5 w-5 animate-spin" /> جارٍ التحميل…
          </div>
        ) : shown.length === 0 ? (
          <div className="py-16 text-center text-ink/40 dark:text-cream/40">لا توجد طلبات في هذا القسم.</div>
        ) : (
          <div className="space-y-3">
            {shown.map((o) => <OrderCard key={o.id} o={o} onStatus={setStatus} drivers={drivers} onAssign={assignDriver} />)}
          </div>
        )}

        {/* products manager */}
        <div className="rounded-2xl border border-ink/10 dark:border-white/10 bg-cream dark:bg-night-800">
          <button onClick={() => setShowProducts((v) => !v)}
            className="flex w-full items-center justify-between px-4 py-3 font-display font-bold">
            <span className="flex items-center gap-2"><Package className="h-4 w-4 text-copper" /> إدارة المنتجات</span>
            <ChevronDown className={`h-5 w-5 transition ${showProducts ? 'rotate-180' : ''}`} />
          </button>
          <AnimatePresence>
            {showProducts && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <ProductsManager admin={admin} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* categories manager */}
        <div className="rounded-2xl border border-ink/10 dark:border-white/10 bg-cream dark:bg-night-800">
          <button onClick={() => setShowCats((v) => !v)}
            className="flex w-full items-center justify-between px-4 py-3 font-display font-bold">
            <span className="flex items-center gap-2"><Layers className="h-4 w-4 text-copper" /> إدارة الأقسام</span>
            <ChevronDown className={`h-5 w-5 transition ${showCats ? 'rotate-180' : ''}`} />
          </button>
          <AnimatePresence>
            {showCats && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <CategoriesManager admin={admin} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* my profile */}
        <div className="rounded-2xl border border-ink/10 dark:border-white/10 bg-cream dark:bg-night-800">
          <button onClick={() => setShowProfile((v) => !v)}
            className="flex w-full items-center justify-between px-4 py-3 font-display font-bold">
            <span className="flex items-center gap-2"><Users className="h-4 w-4 text-copper" /> ملفّي الشخصي</span>
            <ChevronDown className={`h-5 w-5 transition ${showProfile ? 'rotate-180' : ''}`} />
          </button>
          <AnimatePresence>
            {showProfile && me && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="px-4 pb-4">
                  <ProfileForm
                    initial={me}
                    show={{ phone: true, email: true, birthdate: true, gender: true }}
                    uploadPrefix="admin"
                    uploadId={admin.id}
                    onAvatarChange={async (url) => {
                      const r = await adminUpdateProfile(admin.id, { avatar_url: url });
                      if (r?.ok) setMe(r.profile);
                      return { error: r?.ok ? undefined : (r?.msg || 'تعذّر الحفظ') };
                    }}
                    onSave={async (vals) => {
                      const r = await adminUpdateProfile(admin.id, {
                        name: vals.name.trim(), phone: vals.phone.trim() || null,
                        email: vals.email.trim() || null, birthdate: vals.birthdate || null, gender: vals.gender || null,
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

        {/* drivers manager */}
        <div className="rounded-2xl border border-ink/10 dark:border-white/10 bg-cream dark:bg-night-800">
          <button onClick={() => setShowDrivers((v) => !v)}
            className="flex w-full items-center justify-between px-4 py-3 font-display font-bold">
            <span className="flex items-center gap-2"><Truck className="h-4 w-4 text-copper" /> إدارة المندوبين</span>
            <ChevronDown className={`h-5 w-5 transition ${showDrivers ? 'rotate-180' : ''}`} />
          </button>
          <AnimatePresence>
            {showDrivers && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <DriversManager admin={admin} onChange={load} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* admins manager */}
        <div className="rounded-2xl border border-ink/10 dark:border-white/10 bg-cream dark:bg-night-800">
          <button
            onClick={() => setShowAdmins((v) => !v)}
            className="flex w-full items-center justify-between px-4 py-3 font-display font-bold"
          >
            <span className="flex items-center gap-2"><Users className="h-4 w-4 text-copper" /> إدارة المشرفين</span>
            <ChevronDown className={`h-5 w-5 transition ${showAdmins ? 'rotate-180' : ''}`} />
          </button>
          <AnimatePresence>
            {showAdmins && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <AdminsManager admin={admin} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="pb-6 pt-2 text-center text-xs text-ink/35 dark:text-cream/30">اطلبها — لوحة الإدارة</div>
      </main>
    </div>
  );
}

function Stat({ icon: Icon, label, value, suffix, accent }) {
  return (
    <div className="rounded-2xl border border-ink/10 dark:border-white/10 bg-cream dark:bg-night-800 p-3.5">
      <div className="flex items-center gap-1.5 text-[11px] text-ink/45 dark:text-cream/45">
        <Icon className={`h-3.5 w-3.5 ${accent}`} /> {label}
      </div>
      <div className="mt-1.5 font-display text-2xl font-black">
        {value}{suffix && <span className="mr-1 text-xs font-bold text-ink/40 dark:text-cream/40">{suffix}</span>}
      </div>
    </div>
  );
}

/* ───────────────────────── Order card ───────────────────────── */
function OrderCard({ o, onStatus, drivers = [], onAssign }) {
  const st = STATUS[o.status] || STATUS.new;
  const items = Array.isArray(o.items) ? o.items : [];
  const wa = digits(o.customer_phone);
  const DELIV = { assigned: 'مُسند', picked: 'استلم الطلب', on_way: 'في الطريق', arrived: 'وصل', delivered: 'سُلّم' };

  return (
    <div className="rounded-2xl border border-ink/10 dark:border-white/10 bg-cream dark:bg-night-800 p-4">
      {/* head */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-display text-lg font-black">طلب #{o.order_no}</span>
            <AnimatePresence mode="popLayout">
              <motion.span key={o.status}
                initial={{ scale: 0.5, opacity: 0, y: -4 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.5, opacity: 0, y: 4 }}
                transition={{ type: 'spring', stiffness: 420, damping: 17 }}
                className={`relative flex items-center gap-1.5 overflow-hidden rounded-full border px-3 py-1 text-[11px] font-bold ${st.chip}`}>
                {/* radiating ring on change */}
                <motion.span key={o.status + 'r'}
                  initial={{ scale: 0.7, opacity: 0.7 }} animate={{ scale: 2.4, opacity: 0 }}
                  transition={{ duration: 1.1, ease: 'easeOut' }}
                  className={`pointer-events-none absolute inset-0 rounded-full ${st.glow}`} />
                {/* shimmer sweep */}
                <motion.span
                  initial={{ x: '-160%' }} animate={{ x: '160%' }}
                  transition={{ duration: 1.3, ease: 'easeInOut', repeat: Infinity, repeatDelay: 2.6 }}
                  className="pointer-events-none absolute inset-y-0 w-1/3 -skew-x-12 bg-white/25 blur-[2px]" />
                <span className="relative flex h-1.5 w-1.5">
                  <span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${st.dot} opacity-75`} />
                  <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${st.dot}`} />
                </span>
                <span className="relative">{st.label}</span>
              </motion.span>
            </AnimatePresence>
          </div>
          <div className="mt-0.5 text-[11px] text-ink/45 dark:text-cream/45">{fmtDate(o.created_at)}</div>
        </div>
        <div className="text-left">
          <div className="font-display text-xl font-black text-green-600 dark:text-green-300">{fmt(o.total || 0)} <span className="text-xs">د.ع</span></div>
          {o.points_earned > 0 && <div className="text-[11px] text-copper-dark dark:text-copper-light">+{o.points_earned} نقطة</div>}
        </div>
      </div>

      {/* customer */}
      <div className="mt-3 grid gap-1.5 rounded-xl bg-ink/5 dark:bg-white/5 p-3 text-sm">
        <div className="flex items-center gap-2"><Users className="h-3.5 w-3.5 text-ink/40 dark:text-cream/40" /> <b>{o.customer_name || '—'}</b></div>
        <div className="flex items-center gap-2" dir="ltr"><Phone className="h-3.5 w-3.5 shrink-0 text-ink/40 dark:text-cream/40" /> <span className="text-ink/70 dark:text-cream/80">{o.customer_phone || '—'}</span></div>
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

      {/* contact actions */}
      <div className="mt-3 flex flex-wrap gap-2">
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
        {o.location_url && (
          <a href={o.location_url} target="_blank" rel="noreferrer"
            className="flex items-center gap-1.5 rounded-xl bg-blue-600/80 px-3 py-2 text-sm font-bold text-white hover:bg-blue-600">
            <Navigation className="h-4 w-4" /> الموقع
          </a>
        )}
      </div>

      {/* driver assignment */}
      <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl bg-ink/5 dark:bg-white/5 p-2.5">
        <span className="flex items-center gap-1.5 text-xs text-ink/50 dark:text-cream/50"><Truck className="h-3.5 w-3.5 text-copper" /> المندوب:</span>
        <select
          value={o.driver_id || ''}
          onChange={(e) => onAssign?.(o.id, e.target.value || null)}
          className="flex-1 rounded-lg border border-ink/10 dark:border-white/10 bg-beige dark:bg-night-900 px-2.5 py-1.5 text-sm text-ink dark:text-cream outline-none focus:border-copper"
        >
          <option value="">— بدون مندوب —</option>
          {drivers.map((d) => (
            <option key={d.id} value={d.id}>{d.name || d.username}</option>
          ))}
        </select>
        {o.delivery_status && (
          <span className="rounded-full bg-copper/15 px-2.5 py-0.5 text-[11px] font-bold text-copper-dark dark:text-copper-light">
            {DELIV[o.delivery_status] || o.delivery_status}
          </span>
        )}
      </div>

      {/* status control */}
      <div className="mt-3 border-t border-ink/10 dark:border-white/10 pt-3">
        <div className="mb-2 text-[11px] text-ink/40 dark:text-cream/40">تغيير الحالة:</div>
        <div className="flex flex-wrap gap-1.5">
          {Object.keys(STATUS).map((k) => (
            <button
              key={k} onClick={() => onStatus(o.id, k)}
              className={`rounded-lg border px-2.5 py-1.5 text-xs font-bold transition ${
                o.status === k ? STATUS[k].chip : 'border-ink/10 dark:border-white/10 bg-ink/5 dark:bg-white/5 text-ink/55 dark:text-cream/60 hover:bg-ink/10 dark:hover:bg-white/10'
              }`}
            >
              {STATUS[k].label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────── Admins manager ───────────────────────── */
function AdminsManager({ admin }) {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ username: '', name: '', pass: '' });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  async function load() {
    setLoading(true);
    const res = await adminListAdmins(admin.id);
    setList(Array.isArray(res?.admins) ? res.admins : []);
    setLoading(false);
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  async function add() {
    setMsg('');
    if (!form.username.trim() || form.pass.length < 4) { setMsg('أدخل اسم دخول وكلمة مرور (4 أحرف على الأقل)'); return; }
    setBusy(true);
    const res = await adminAdd(admin.id, form.username.trim(), form.pass, form.name.trim());
    setBusy(false);
    if (res?.ok) { setForm({ username: '', name: '', pass: '' }); setMsg('✓ تمت الإضافة'); load(); }
    else setMsg(res?.error === 'username_taken' ? 'اسم الدخول مستخدم' : 'تعذّرت الإضافة');
  }

  async function remove(id) {
    const res = await adminRemove(admin.id, id);
    if (res?.ok) load();
    else setMsg(res?.error === 'last_admin' ? 'لا يمكن حذف آخر مشرف' : res?.error === 'cannot_remove_self' ? 'لا يمكنك حذف نفسك' : 'تعذّر الحذف');
  }

  return (
    <div className="space-y-4 px-4 pb-4">
      {/* list */}
      {loading ? (
        <div className="flex items-center gap-2 py-3 text-sm text-ink/50 dark:text-cream/50"><Loader2 className="h-4 w-4 animate-spin" /> تحميل…</div>
      ) : (
        <div className="space-y-2">
          {list.map((a) => (
            <div key={a.id} className="flex items-center justify-between rounded-xl bg-ink/5 dark:bg-white/5 px-3 py-2 text-sm">
              <div>
                <span className="font-bold">{a.name || a.username}</span>
                <span className="mr-2 text-ink/40 dark:text-cream/40">@{a.username}</span>
                {a.id === admin.id && <span className="mr-2 rounded bg-copper/20 px-1.5 text-[11px] text-copper">أنت</span>}
              </div>
              {a.id !== admin.id && (
                <button onClick={() => remove(a.id)} className="grid h-7 w-7 place-items-center rounded-lg bg-red-500/10 text-red-700 dark:text-red-300 hover:bg-red-500/20">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* add form */}
      <div className="rounded-xl border border-ink/10 dark:border-white/10 bg-beige dark:bg-night-900 p-3">
        <div className="mb-2 flex items-center gap-2 text-sm font-bold"><UserPlus className="h-4 w-4 text-copper" /> إضافة مشرف</div>
        <div className="grid gap-2 sm:grid-cols-3">
          <input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="اسم الدخول" className="rounded-lg border border-ink/10 dark:border-white/10 bg-ink/5 dark:bg-white/5 px-3 py-2 text-sm outline-none placeholder:text-ink/35 dark:placeholder:text-cream/30 focus:border-copper" dir="ltr" />
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="الاسم (اختياري)" className="rounded-lg border border-ink/10 dark:border-white/10 bg-ink/5 dark:bg-white/5 px-3 py-2 text-sm outline-none placeholder:text-ink/35 dark:placeholder:text-cream/30 focus:border-copper" />
          <input value={form.pass} onChange={(e) => setForm({ ...form, pass: e.target.value })} type="password" placeholder="كلمة المرور" className="rounded-lg border border-ink/10 dark:border-white/10 bg-ink/5 dark:bg-white/5 px-3 py-2 text-sm outline-none placeholder:text-ink/35 dark:placeholder:text-cream/30 focus:border-copper" />
        </div>
        {msg && <p className="mt-2 text-xs text-ink/65 dark:text-cream/70">{msg}</p>}
        <button onClick={add} disabled={busy} className="mt-2 flex items-center gap-1.5 rounded-lg bg-copper px-3 py-2 text-sm font-bold text-ink dark:text-cream hover:bg-copper-dark disabled:opacity-60">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} إضافة
        </button>
      </div>
    </div>
  );
}

/* ───────────────────────── Drivers manager ───────────────────────── */
function DriversManager({ admin, onChange }) {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ username: '', name: '', phone: '', pass: '' });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  async function load() {
    setLoading(true);
    const res = await adminListDrivers(admin.id);
    setList(Array.isArray(res?.drivers) ? res.drivers : []);
    setLoading(false);
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  async function add() {
    setMsg('');
    if (!form.username.trim() || form.pass.length < 4) { setMsg('أدخل اسم دخول وكلمة مرور (4 أحرف على الأقل)'); return; }
    setBusy(true);
    const res = await adminAddDriver(admin.id, form.username.trim(), form.pass, form.name.trim(), form.phone.trim());
    setBusy(false);
    if (res?.ok) { setForm({ username: '', name: '', phone: '', pass: '' }); setMsg('✓ تمت الإضافة'); load(); onChange?.(); }
    else setMsg(res?.error === 'username_taken' ? 'اسم الدخول مستخدم' : 'تعذّرت الإضافة');
  }

  async function remove(id) {
    const res = await adminRemoveDriver(admin.id, id);
    if (res?.ok) { load(); onChange?.(); } else setMsg('تعذّر الحذف');
  }

  return (
    <div className="space-y-4 px-4 pb-4">
      {loading ? (
        <div className="flex items-center gap-2 py-3 text-sm text-ink/50 dark:text-cream/50"><Loader2 className="h-4 w-4 animate-spin" /> تحميل…</div>
      ) : list.length === 0 ? (
        <div className="py-2 text-sm text-ink/40 dark:text-cream/40">لا يوجد مندوبون بعد — أضف مندوباً ليتسلّم الطلبات.</div>
      ) : (
        <div className="space-y-2">
          {list.map((d) => (
            <div key={d.id} className="flex items-center justify-between rounded-xl bg-ink/5 dark:bg-white/5 px-3 py-2 text-sm">
              <div>
                <span className="font-bold">{d.name || d.username}</span>
                <span className="mr-2 text-ink/40 dark:text-cream/40">@{d.username}</span>
                {d.phone && <span className="mr-2 text-ink/50 dark:text-cream/50" dir="ltr">{d.phone}</span>}
              </div>
              <button onClick={() => remove(d.id)} className="grid h-7 w-7 place-items-center rounded-lg bg-red-500/10 text-red-700 dark:text-red-300 hover:bg-red-500/20">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-xl border border-ink/10 dark:border-white/10 bg-beige dark:bg-night-900 p-3">
        <div className="mb-2 flex items-center gap-2 text-sm font-bold"><UserPlus className="h-4 w-4 text-copper" /> إضافة مندوب</div>
        <div className="grid gap-2 sm:grid-cols-2">
          <input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="اسم الدخول" className="rounded-lg border border-ink/10 dark:border-white/10 bg-ink/5 dark:bg-white/5 px-3 py-2 text-sm outline-none placeholder:text-ink/35 dark:placeholder:text-cream/30 focus:border-copper" dir="ltr" />
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="الاسم" className="rounded-lg border border-ink/10 dark:border-white/10 bg-ink/5 dark:bg-white/5 px-3 py-2 text-sm outline-none placeholder:text-ink/35 dark:placeholder:text-cream/30 focus:border-copper" />
          <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="رقم الهاتف (اختياري)" className="rounded-lg border border-ink/10 dark:border-white/10 bg-ink/5 dark:bg-white/5 px-3 py-2 text-sm outline-none placeholder:text-ink/35 dark:placeholder:text-cream/30 focus:border-copper" dir="ltr" />
          <input value={form.pass} onChange={(e) => setForm({ ...form, pass: e.target.value })} type="password" placeholder="كلمة المرور" className="rounded-lg border border-ink/10 dark:border-white/10 bg-ink/5 dark:bg-white/5 px-3 py-2 text-sm outline-none placeholder:text-ink/35 dark:placeholder:text-cream/30 focus:border-copper" />
        </div>
        {msg && <p className="mt-2 text-xs text-ink/65 dark:text-cream/70">{msg}</p>}
        <button onClick={add} disabled={busy} className="mt-2 flex items-center gap-1.5 rounded-lg bg-copper px-3 py-2 text-sm font-bold text-ink dark:text-cream hover:bg-copper-dark disabled:opacity-60">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} إضافة
        </button>
      </div>
    </div>
  );
}

/* ════════════════════════ Products & Categories ════════════════════════ */

const inp =
  'w-full rounded-xl border border-ink/10 bg-beige px-3 py-2.5 text-sm text-ink outline-none transition focus:border-copper/50 dark:border-white/10 dark:bg-night-900 dark:text-cream';

function Lbl({ label, full, children }) {
  return (
    <label className={`block ${full ? 'col-span-2' : ''}`}>
      <span className="mb-1 block text-[12px] font-bold text-ink/55 dark:text-cream/55">{label}</span>
      {children}
    </label>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center" dir="rtl"
    >
      <div onClick={onClose} className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <motion.div
        initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 24, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        className="relative z-10 max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-cream p-5 shadow-card dark:bg-night-800 sm:rounded-3xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-lg font-black text-ink dark:text-cream">{title}</h3>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-lg bg-ink/5 text-ink/60 hover:bg-ink/10 dark:bg-white/5 dark:text-cream/70">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-4">{children}</div>
      </motion.div>
    </motion.div>
  );
}

function Thumb({ p }) {
  const [ok, setOk] = useState(true);
  return (
    <div className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-lg bg-white text-xl ring-1 ring-ink/5 dark:ring-white/10">
      {p.image && ok
        ? <img src={p.image} alt="" className="h-full w-full object-contain p-0.5 mix-blend-multiply" onError={() => setOk(false)} />
        : <span>{p.emoji}</span>}
    </div>
  );
}

/* ───────────────────────── Products manager ───────────────────────── */
function ProductsManager({ admin }) {
  const [list, setList] = useState([]);
  const [cats, setCats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // null | 'new' | product
  const [confirm, setConfirm] = useState(null);
  const listRef = useRef([]);

  async function load() {
    setLoading(true);
    const [p, c] = await Promise.all([adminListProducts(admin.id), adminListCategories(admin.id)]);
    const items = Array.isArray(p?.products) ? p.products : [];
    setList(items); listRef.current = items;
    setCats(Array.isArray(c?.categories) ? c.categories : []);
    setLoading(false);
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);
  useEffect(() => {
    if (!confirm) return;
    const t = setTimeout(() => setConfirm(null), 2600);
    return () => clearTimeout(t);
  }, [confirm]);

  function onReorder(next) { setList(next); listRef.current = next; }
  async function persistOrder() { await adminReorderProducts(admin.id, listRef.current.map((x) => x.id)); }

  async function toggle(p) {
    const next = !p.active;
    const apply = (arr) => arr.map((x) => (x.id === p.id ? { ...x, active: next } : x));
    setList(apply); listRef.current = apply(listRef.current);
    const r = await adminSetProductActive(admin.id, p.id, next);
    if (!r?.ok) load();
  }

  async function remove(id) {
    setConfirm(null);
    const r = await adminRemoveProduct(admin.id, id);
    if (r?.ok) {
      listRef.current = listRef.current.filter((x) => x.id !== id);
      setList((l) => l.filter((x) => x.id !== id));
    }
  }

  return (
    <div className="space-y-3 px-4 pb-4">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[12px] text-ink/50 dark:text-cream/50">{list.length} منتج · اسحب للترتيب</span>
        <button onClick={() => setEditing('new')}
          className="flex items-center gap-1.5 rounded-xl bg-copper px-3 py-2 text-sm font-bold text-ink dark:text-cream hover:bg-copper-dark">
          <Plus className="h-4 w-4" /> منتج جديد
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-10 text-ink/50 dark:text-cream/50">
          <Loader2 className="h-5 w-5 animate-spin" /> جارٍ التحميل…
        </div>
      ) : list.length === 0 ? (
        <div className="py-10 text-center text-sm text-ink/40 dark:text-cream/40">لا توجد منتجات. اضغط «منتج جديد».</div>
      ) : (
        <Reorder.Group axis="y" values={list} onReorder={onReorder} className="space-y-2">
          {list.map((p) => (
            <ProductRow key={p.id} p={p} onToggle={toggle} onEdit={setEditing}
              onDelete={remove} confirm={confirm} setConfirm={setConfirm} onPersist={persistOrder} />
          ))}
        </Reorder.Group>
      )}

      <AnimatePresence>
        {editing && (
          <ProductForm admin={admin} cats={cats} product={editing === 'new' ? null : editing}
            onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />
        )}
      </AnimatePresence>
    </div>
  );
}

function ProductRow({ p, onToggle, onEdit, onDelete, confirm, setConfirm, onPersist }) {
  const controls = useDragControls();
  return (
    <Reorder.Item value={p} dragListener={false} dragControls={controls} onDragEnd={onPersist}
      className={`flex items-center gap-2 rounded-xl border border-ink/10 dark:border-white/10 bg-beige dark:bg-night-900 p-2 ${p.active ? '' : 'opacity-60'}`}>
      <span onPointerDown={(e) => controls.start(e)}
        className="cursor-grab touch-none px-0.5 text-ink/30 dark:text-cream/30 active:cursor-grabbing">
        <GripVertical className="h-4 w-4" />
      </span>
      <Thumb p={p} />
      <div className="min-w-0 flex-1">
        <div className="truncate font-display text-sm font-bold text-ink dark:text-cream">{p.name}</div>
        <div className="flex flex-wrap items-center gap-x-1.5 text-[11px]">
          <span className="rounded bg-ink/5 px-1.5 py-0.5 text-ink/60 dark:bg-white/10 dark:text-cream/60">{p.category}</span>
          <span className="font-bold text-green-600 dark:text-green-300">{fmt(p.price)}</span>
          <span className="text-ink/40 dark:text-cream/40">د.ع / {p.unit}</span>
        </div>
      </div>
      <button onClick={() => onToggle(p)} title={p.active ? 'إخفاء من المتجر' : 'إظهار في المتجر'}
        className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${p.active ? 'bg-green-500/10 text-green-600 dark:text-green-300' : 'bg-ink/10 text-ink/40 dark:bg-white/10 dark:text-cream/40'}`}>
        {p.active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
      </button>
      <button onClick={() => onEdit(p)}
        className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-ink/5 text-ink/60 hover:bg-ink/10 dark:bg-white/10 dark:text-cream/70">
        <Pencil className="h-4 w-4" />
      </button>
      {confirm === p.id ? (
        <button onClick={() => onDelete(p.id)} className="shrink-0 rounded-lg bg-red-600 px-2 py-1.5 text-[11px] font-bold text-white">تأكيد؟</button>
      ) : (
        <button onClick={() => setConfirm(p.id)}
          className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-red-500/10 text-red-600 hover:bg-red-500/20 dark:text-red-300">
          <Trash2 className="h-4 w-4" />
        </button>
      )}
    </Reorder.Item>
  );
}

function ProductForm({ admin, cats, product, onClose, onSaved }) {
  const [f, setF] = useState({
    name: product?.name || '',
    category: product?.category || (cats[0]?.name || ''),
    price: product?.price ?? '',
    unit: product?.unit || 'كيلو',
    emoji: product?.emoji || '🛒',
    tint: product?.tint || '#9A5318',
    badge: product?.badge || '',
  });
  const [image, setImage] = useState(product?.image || '');
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const fileRef = useRef(null);
  const set = (k) => (e) => setF((prev) => ({ ...prev, [k]: e.target.value }));

  async function onFile(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true); setErr('');
    const res = await uploadProductImage(file, product?.id || 'new');
    setUploading(false);
    if (res?.error) { setErr(res.error); return; }
    setImage(res.url);
  }

  async function save() {
    if (!f.name.trim()) { setErr('اكتب اسم المنتج'); return; }
    if (!f.category) { setErr('اختر القسم'); return; }
    setBusy(true); setErr('');
    const fields = {
      name: f.name.trim(),
      category: f.category,
      price: Math.max(0, parseInt(f.price, 10) || 0),
      unit: f.unit.trim() || 'وحدة',
      emoji: f.emoji.trim() || '🛒',
      tint: f.tint || '#9A5318',
      badge: f.badge.trim(),
      image, // '' clears, url sets
    };
    const r = product
      ? await adminUpdateProduct(admin.id, product.id, fields)
      : await adminAddProduct(admin.id, fields);
    setBusy(false);
    if (r?.ok) onSaved();
    else setErr('تعذّر الحفظ، حاول مرّة ثانية.');
  }

  return (
    <Modal title={product ? 'تعديل منتج' : 'منتج جديد'} onClose={onClose}>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => fileRef.current?.click()}
          className="relative grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-2xl bg-white text-3xl ring-1 ring-ink/10 dark:ring-white/10">
          {uploading
            ? <Loader2 className="h-6 w-6 animate-spin text-copper" />
            : image
              ? <img src={image} alt="" className="h-full w-full object-contain p-1 mix-blend-multiply" />
              : <span>{f.emoji || '🛒'}</span>}
          <span className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-0.5 bg-copper/90 py-0.5 text-[9px] font-bold text-white">
            <ImageIcon className="h-2.5 w-2.5" /> صورة
          </span>
        </button>
        <div className="text-[11px] leading-relaxed text-ink/50 dark:text-cream/50">
          اضغط المربّع لرفع صورة المنتج من جهازك. الأفضل صورة على خلفية بيضاء.
          {image && (
            <button type="button" onClick={() => setImage('')} className="mt-1 block font-bold text-red-600 dark:text-red-300">
              إزالة الصورة (يرجع للإيموجي)
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Lbl label="اسم المنتج" full>
          <input className={inp} value={f.name} onChange={set('name')} placeholder="مثلاً: تفاح أحمر" />
        </Lbl>
        <Lbl label="القسم">
          <select className={inp} value={f.category} onChange={set('category')}>
            {cats.length === 0 && <option value="">— أضِف قسماً أولاً —</option>}
            {cats.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
          </select>
        </Lbl>
        <Lbl label="السعر (د.ع)">
          <input type="number" inputMode="numeric" className={inp} value={f.price} onChange={set('price')} placeholder="0" dir="ltr" />
        </Lbl>
        <Lbl label="الوحدة">
          <input className={inp} value={f.unit} onChange={set('unit')} placeholder="كيلو / علبة" />
        </Lbl>
        <Lbl label="إيموجي احتياطي">
          <input className={inp} value={f.emoji} onChange={set('emoji')} placeholder="🍎" />
        </Lbl>
        <Lbl label="شارة (اختياري)">
          <input className={inp} value={f.badge} onChange={set('badge')} placeholder="فاخر / الأكثر طلباً" />
        </Lbl>
        <Lbl label="لون الإطار">
          <input type="color" value={f.tint} onChange={set('tint')}
            className="h-10 w-full cursor-pointer rounded-xl border border-ink/10 bg-beige dark:border-white/10 dark:bg-night-900" />
        </Lbl>
      </div>

      {err && <div className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-300">{err}</div>}

      <div className="flex gap-2">
        <button onClick={save} disabled={busy || uploading}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-copper py-3 font-display font-bold text-ink dark:text-cream hover:bg-copper-dark disabled:opacity-60">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} حفظ
        </button>
        <button onClick={onClose}
          className="rounded-xl bg-ink/5 px-5 py-3 font-bold text-ink/70 hover:bg-ink/10 dark:bg-white/5 dark:text-cream/70">إلغاء</button>
      </div>
    </Modal>
  );
}

/* ───────────────────────── Categories manager ───────────────────────── */
function CategoriesManager({ admin }) {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', emoji: '' });
  const [editing, setEditing] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [msg, setMsg] = useState('');
  const listRef = useRef([]);

  async function load() {
    setLoading(true);
    const c = await adminListCategories(admin.id);
    const items = Array.isArray(c?.categories) ? c.categories : [];
    setList(items); listRef.current = items;
    setLoading(false);
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);
  useEffect(() => {
    if (!confirm) return;
    const t = setTimeout(() => setConfirm(null), 2600);
    return () => clearTimeout(t);
  }, [confirm]);

  function onReorder(next) { setList(next); listRef.current = next; }
  async function persistOrder() { await adminReorderCategories(admin.id, listRef.current.map((x) => x.id)); }

  async function add() {
    setMsg('');
    if (!form.name.trim()) { setMsg('اكتب اسم القسم'); return; }
    const r = await adminAddCategory(admin.id, { name: form.name.trim(), emoji: form.emoji.trim() });
    if (r?.ok) { setForm({ name: '', emoji: '' }); load(); }
    else setMsg(r?.error === 'exists' ? 'هذا القسم موجود مسبقاً' : 'تعذّرت الإضافة');
  }

  async function saveEdit() {
    if (!editing?.name.trim()) { setMsg('اكتب اسم القسم'); return; }
    setMsg('');
    const r = await adminUpdateCategory(admin.id, editing.id, { name: editing.name.trim(), emoji: (editing.emoji || '').trim() });
    if (r?.ok) { setEditing(null); load(); }
    else setMsg(r?.error === 'exists' ? 'الاسم مستخدم لقسم آخر' : 'تعذّر الحفظ');
  }

  async function remove(c) {
    setConfirm(null); setMsg('');
    const r = await adminRemoveCategory(admin.id, c.id);
    if (r?.ok) load();
    else if (r?.error === 'in_use') setMsg(`فيه ${r.count} منتج في «${c.name}» — غيّر قسمها أو احذفها أولاً`);
    else setMsg('تعذّر الحذف');
  }

  return (
    <div className="space-y-3 px-4 pb-4">
      <span className="text-[12px] text-ink/50 dark:text-cream/50">{list.length} قسم · اسحب للترتيب · يظهر بالمتجر بنفس الترتيب</span>
      {loading ? (
        <div className="flex items-center justify-center gap-2 py-8 text-ink/50 dark:text-cream/50">
          <Loader2 className="h-5 w-5 animate-spin" /> جارٍ التحميل…
        </div>
      ) : (
        <Reorder.Group axis="y" values={list} onReorder={onReorder} className="space-y-2">
          {list.map((c) => (
            <CategoryRow key={c.id} c={c} editing={editing} setEditing={setEditing}
              onSaveEdit={saveEdit} onDelete={remove} confirm={confirm} setConfirm={setConfirm} onPersist={persistOrder} />
          ))}
        </Reorder.Group>
      )}
      {msg && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-600 dark:text-red-300">{msg}</p>}

      <div className="rounded-xl border border-ink/10 dark:border-white/10 bg-cream dark:bg-night-800 p-3">
        <div className="mb-2 flex items-center gap-2 text-sm font-bold"><Plus className="h-4 w-4 text-copper" /> إضافة قسم</div>
        <div className="flex gap-2">
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="اسم القسم (مثلاً: مشروبات)" className={inp + ' flex-1'} />
          <input value={form.emoji} onChange={(e) => setForm({ ...form, emoji: e.target.value })}
            placeholder="🏷️" className="w-16 shrink-0 rounded-xl border border-ink/10 bg-beige px-2 py-2.5 text-center text-sm outline-none focus:border-copper dark:border-white/10 dark:bg-night-900" />
          <button onClick={add} className="shrink-0 rounded-xl bg-copper px-4 py-2.5 text-sm font-bold text-ink dark:text-cream hover:bg-copper-dark">إضافة</button>
        </div>
      </div>
    </div>
  );
}

function CategoryRow({ c, editing, setEditing, onSaveEdit, onDelete, confirm, setConfirm, onPersist }) {
  const controls = useDragControls();
  const isEditing = editing?.id === c.id;
  return (
    <Reorder.Item value={c} dragListener={false} dragControls={controls} onDragEnd={onPersist}
      className="flex items-center gap-2 rounded-xl border border-ink/10 dark:border-white/10 bg-beige dark:bg-night-900 p-2">
      <span onPointerDown={(e) => controls.start(e)}
        className="cursor-grab touch-none px-0.5 text-ink/30 dark:text-cream/30 active:cursor-grabbing">
        <GripVertical className="h-4 w-4" />
      </span>
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white text-xl ring-1 ring-ink/5 dark:bg-night-800 dark:ring-white/10">
        {(isEditing ? editing.emoji : c.emoji) || '🏷️'}
      </span>
      {isEditing ? (
        <>
          <input className={inp + ' flex-1'} value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
          <input className="w-14 shrink-0 rounded-xl border border-ink/10 bg-beige px-2 py-2.5 text-center text-sm outline-none focus:border-copper dark:border-white/10 dark:bg-night-900"
            value={editing.emoji} onChange={(e) => setEditing({ ...editing, emoji: e.target.value })} placeholder="🏷️" />
          <button onClick={onSaveEdit} className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-green-500/15 text-green-600 dark:text-green-300"><Check className="h-4 w-4" /></button>
          <button onClick={() => setEditing(null)} className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-ink/5 dark:bg-white/10"><X className="h-4 w-4" /></button>
        </>
      ) : (
        <>
          <span className="flex-1 truncate font-display text-sm font-bold text-ink dark:text-cream">{c.name}</span>
          <button onClick={() => setEditing({ id: c.id, name: c.name, emoji: c.emoji || '' })}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-ink/5 text-ink/60 hover:bg-ink/10 dark:bg-white/10 dark:text-cream/70"><Pencil className="h-4 w-4" /></button>
          {confirm === c.id ? (
            <button onClick={() => onDelete(c)} className="shrink-0 rounded-lg bg-red-600 px-2 py-1.5 text-[11px] font-bold text-white">تأكيد؟</button>
          ) : (
            <button onClick={() => setConfirm(c.id)}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-red-500/10 text-red-600 hover:bg-red-500/20 dark:text-red-300"><Trash2 className="h-4 w-4" /></button>
          )}
        </>
      )}
    </Reorder.Item>
  );
}
