import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Lock, LogOut, RefreshCw, Loader2, Package, Clock, MapPin, Phone,
  MessageCircle, Navigation, UserPlus, Trash2, Users, Check, X,
  ShoppingBag, Wallet, ChevronDown, Truck,
} from 'lucide-react';
import { fmt } from '../data/catalog.js';
import {
  getAdminSession, setAdminSession, clearAdminSession,
  adminLogin, adminListOrders, adminUpdateStatus, adminStats,
  adminListAdmins, adminAdd, adminRemove,
  adminListDrivers, adminAddDriver, adminRemoveDriver, adminAssignDriver,
} from '../lib/admin.js';

const STATUS = {
  new: { label: 'جديد', dot: 'bg-amber-400', chip: 'border-amber-500/30 bg-amber-500/15 text-amber-300' },
  preparing: { label: 'قيد التحضير', dot: 'bg-blue-400', chip: 'border-blue-500/30 bg-blue-500/15 text-blue-300' },
  delivering: { label: 'جارٍ التوصيل', dot: 'bg-indigo-400', chip: 'border-indigo-500/30 bg-indigo-500/15 text-indigo-300' },
  done: { label: 'تم التوصيل', dot: 'bg-green-400', chip: 'border-green-500/30 bg-green-500/15 text-green-300' },
  cancelled: { label: 'ملغى', dot: 'bg-red-400', chip: 'border-red-500/30 bg-red-500/15 text-red-300' },
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
    <div className="grid min-h-screen place-items-center bg-night-900 px-5 font-body text-cream" dir="rtl">
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm rounded-3xl border border-white/10 bg-night-800 p-7 shadow-card"
      >
        <div className="mb-5 flex flex-col items-center gap-3 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-copper/20 text-copper">
            <Lock className="h-7 w-7" />
          </span>
          <div>
            <h1 className="font-display text-2xl font-black">لوحة الإدارة</h1>
            <p className="mt-1 text-sm text-cream/50">اطلبها — للمشرفين فقط</p>
          </div>
        </div>
        <input
          type="password" value={pass} onChange={(e) => setPass(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder="كلمة المرور" autoFocus
          className="w-full rounded-2xl border border-white/10 bg-night-900 px-4 py-3 text-center font-body text-lg tracking-widest text-cream outline-none placeholder:text-cream/30 focus:border-copper"
        />
        {err && <p className="mt-2 text-center text-sm text-red-400">{err}</p>}
        <button
          onClick={submit} disabled={busy}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-copper py-3 font-display font-bold text-cream transition hover:bg-copper-dark disabled:opacity-60"
        >
          {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Lock className="h-5 w-5" />}
          دخول
        </button>
        <a href="/" className="mt-4 block text-center text-xs text-cream/40 hover:text-cream/70">→ العودة للمتجر</a>
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
    }, 8000);
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
    <div className="min-h-screen bg-night-900 font-body text-cream" dir="rtl">
      {/* top bar */}
      <header className="sticky top-0 z-20 border-b border-white/10 bg-night-900/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-copper/20 text-copper">
              <Package className="h-5 w-5" />
            </span>
            <div className="leading-tight">
              <div className="font-display text-lg font-black">لوحة الإدارة</div>
              <div className="text-[11px] text-cream/45">أهلاً {admin.name || admin.username}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={load} className="grid h-9 w-9 place-items-center rounded-xl bg-white/5 text-cream/80 hover:bg-white/10" title="تحديث">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button onClick={onOut} className="flex items-center gap-1.5 rounded-xl bg-white/5 px-3 py-2 text-sm text-red-300 hover:bg-red-500/10">
              <LogOut className="h-4 w-4" /> خروج
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-5 px-4 py-5">
        {/* stats */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <Stat icon={Clock} label="طلبات اليوم" value={stats?.today_orders ?? '—'} accent="text-amber-300" />
          <Stat icon={ShoppingBag} label="إجمالي الطلبات" value={stats?.total_orders ?? '—'} accent="text-blue-300" />
          <Stat icon={Wallet} label="مبيعات اليوم" value={stats ? `${fmt(stats.today_sales)}` : '—'} suffix="د.ع" accent="text-green-300" />
          <Stat icon={Wallet} label="إجمالي المبيعات" value={stats ? `${fmt(stats.total_sales)}` : '—'} suffix="د.ع" accent="text-green-300" />
          <Stat icon={Package} label="قيد التنفيذ" value={stats?.pending ?? '—'} accent="text-indigo-300" />
        </div>

        {/* top areas */}
        {stats?.by_area?.length > 0 && (
          <div className="rounded-2xl border border-white/10 bg-night-800 p-4">
            <div className="mb-3 flex items-center gap-2 font-display font-bold">
              <MapPin className="h-4 w-4 text-copper" /> المناطق الأكثر طلباً
            </div>
            <div className="flex flex-wrap gap-2">
              {stats.by_area.slice(0, 8).map((a, i) => (
                <div key={i} className="flex items-center gap-2 rounded-xl bg-white/5 px-3 py-1.5 text-sm">
                  <span className="font-bold">{a.area}</span>
                  <span className="text-cream/40">·</span>
                  <span className="text-copper-light">{a.count} طلب</span>
                  <span className="text-cream/40">·</span>
                  <span className="text-green-300">{fmt(a.sales)} د.ع</span>
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
                  ? 'border-copper bg-copper text-cream'
                  : 'border-white/10 bg-white/5 text-cream/70 hover:bg-white/10'
              }`}
            >
              {label}
              {counts[k] > 0 && (
                <span className={`mr-1.5 rounded-full px-1.5 text-xs ${filter === k ? 'bg-black/20' : 'bg-white/10'}`}>
                  {counts[k]}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* orders */}
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-cream/50">
            <Loader2 className="h-5 w-5 animate-spin" /> جارٍ التحميل…
          </div>
        ) : shown.length === 0 ? (
          <div className="py-16 text-center text-cream/40">لا توجد طلبات في هذا القسم.</div>
        ) : (
          <div className="space-y-3">
            {shown.map((o) => <OrderCard key={o.id} o={o} onStatus={setStatus} drivers={drivers} onAssign={assignDriver} />)}
          </div>
        )}

        {/* drivers manager */}
        <div className="rounded-2xl border border-white/10 bg-night-800">
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
        <div className="rounded-2xl border border-white/10 bg-night-800">
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

        <div className="pb-6 pt-2 text-center text-xs text-cream/30">اطلبها — لوحة الإدارة</div>
      </main>
    </div>
  );
}

function Stat({ icon: Icon, label, value, suffix, accent }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-night-800 p-3.5">
      <div className="flex items-center gap-1.5 text-[11px] text-cream/45">
        <Icon className={`h-3.5 w-3.5 ${accent}`} /> {label}
      </div>
      <div className="mt-1.5 font-display text-2xl font-black">
        {value}{suffix && <span className="mr-1 text-xs font-bold text-cream/40">{suffix}</span>}
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
    <div className="rounded-2xl border border-white/10 bg-night-800 p-4">
      {/* head */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-display text-lg font-black">طلب #{o.order_no}</span>
            <AnimatePresence mode="wait">
              <motion.span key={o.status}
                initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.6, opacity: 0 }}
                transition={{ type: 'spring', damping: 14 }}
                className={`flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${st.chip}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} /> {st.label}
              </motion.span>
            </AnimatePresence>
          </div>
          <div className="mt-0.5 text-[11px] text-cream/45">{fmtDate(o.created_at)}</div>
        </div>
        <div className="text-left">
          <div className="font-display text-xl font-black text-green-300">{fmt(o.total || 0)} <span className="text-xs">د.ع</span></div>
          {o.points_earned > 0 && <div className="text-[11px] text-copper-light">+{o.points_earned} نقطة</div>}
        </div>
      </div>

      {/* customer */}
      <div className="mt-3 grid gap-1.5 rounded-xl bg-white/5 p-3 text-sm">
        <div className="flex items-center gap-2"><Users className="h-3.5 w-3.5 text-cream/40" /> <b>{o.customer_name || '—'}</b></div>
        <div className="flex items-center gap-2" dir="ltr"><Phone className="h-3.5 w-3.5 shrink-0 text-cream/40" /> <span className="text-cream/80">{o.customer_phone || '—'}</span></div>
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
            className="flex items-center gap-1.5 rounded-xl bg-white/10 px-3 py-2 text-sm font-bold hover:bg-white/15">
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
      <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl bg-white/5 p-2.5">
        <span className="flex items-center gap-1.5 text-xs text-cream/50"><Truck className="h-3.5 w-3.5 text-copper" /> المندوب:</span>
        <select
          value={o.driver_id || ''}
          onChange={(e) => onAssign?.(o.id, e.target.value || null)}
          className="flex-1 rounded-lg border border-white/10 bg-night-900 px-2.5 py-1.5 text-sm text-cream outline-none focus:border-copper"
        >
          <option value="">— بدون مندوب —</option>
          {drivers.map((d) => (
            <option key={d.id} value={d.id}>{d.name || d.username}</option>
          ))}
        </select>
        {o.delivery_status && (
          <span className="rounded-full bg-copper/15 px-2.5 py-0.5 text-[11px] font-bold text-copper-light">
            {DELIV[o.delivery_status] || o.delivery_status}
          </span>
        )}
      </div>

      {/* status control */}
      <div className="mt-3 border-t border-white/10 pt-3">
        <div className="mb-2 text-[11px] text-cream/40">تغيير الحالة:</div>
        <div className="flex flex-wrap gap-1.5">
          {Object.keys(STATUS).map((k) => (
            <button
              key={k} onClick={() => onStatus(o.id, k)}
              className={`rounded-lg border px-2.5 py-1.5 text-xs font-bold transition ${
                o.status === k ? STATUS[k].chip : 'border-white/10 bg-white/5 text-cream/60 hover:bg-white/10'
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
        <div className="flex items-center gap-2 py-3 text-sm text-cream/50"><Loader2 className="h-4 w-4 animate-spin" /> تحميل…</div>
      ) : (
        <div className="space-y-2">
          {list.map((a) => (
            <div key={a.id} className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2 text-sm">
              <div>
                <span className="font-bold">{a.name || a.username}</span>
                <span className="mr-2 text-cream/40">@{a.username}</span>
                {a.id === admin.id && <span className="mr-2 rounded bg-copper/20 px-1.5 text-[11px] text-copper">أنت</span>}
              </div>
              {a.id !== admin.id && (
                <button onClick={() => remove(a.id)} className="grid h-7 w-7 place-items-center rounded-lg bg-red-500/10 text-red-300 hover:bg-red-500/20">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* add form */}
      <div className="rounded-xl border border-white/10 bg-night-900 p-3">
        <div className="mb-2 flex items-center gap-2 text-sm font-bold"><UserPlus className="h-4 w-4 text-copper" /> إضافة مشرف</div>
        <div className="grid gap-2 sm:grid-cols-3">
          <input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="اسم الدخول" className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none placeholder:text-cream/30 focus:border-copper" dir="ltr" />
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="الاسم (اختياري)" className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none placeholder:text-cream/30 focus:border-copper" />
          <input value={form.pass} onChange={(e) => setForm({ ...form, pass: e.target.value })} type="password" placeholder="كلمة المرور" className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none placeholder:text-cream/30 focus:border-copper" />
        </div>
        {msg && <p className="mt-2 text-xs text-cream/70">{msg}</p>}
        <button onClick={add} disabled={busy} className="mt-2 flex items-center gap-1.5 rounded-lg bg-copper px-3 py-2 text-sm font-bold text-cream hover:bg-copper-dark disabled:opacity-60">
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
        <div className="flex items-center gap-2 py-3 text-sm text-cream/50"><Loader2 className="h-4 w-4 animate-spin" /> تحميل…</div>
      ) : list.length === 0 ? (
        <div className="py-2 text-sm text-cream/40">لا يوجد مندوبون بعد — أضف مندوباً ليتسلّم الطلبات.</div>
      ) : (
        <div className="space-y-2">
          {list.map((d) => (
            <div key={d.id} className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2 text-sm">
              <div>
                <span className="font-bold">{d.name || d.username}</span>
                <span className="mr-2 text-cream/40">@{d.username}</span>
                {d.phone && <span className="mr-2 text-cream/50" dir="ltr">{d.phone}</span>}
              </div>
              <button onClick={() => remove(d.id)} className="grid h-7 w-7 place-items-center rounded-lg bg-red-500/10 text-red-300 hover:bg-red-500/20">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-xl border border-white/10 bg-night-900 p-3">
        <div className="mb-2 flex items-center gap-2 text-sm font-bold"><UserPlus className="h-4 w-4 text-copper" /> إضافة مندوب</div>
        <div className="grid gap-2 sm:grid-cols-2">
          <input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="اسم الدخول" className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none placeholder:text-cream/30 focus:border-copper" dir="ltr" />
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="الاسم" className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none placeholder:text-cream/30 focus:border-copper" />
          <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="رقم الهاتف (اختياري)" className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none placeholder:text-cream/30 focus:border-copper" dir="ltr" />
          <input value={form.pass} onChange={(e) => setForm({ ...form, pass: e.target.value })} type="password" placeholder="كلمة المرور" className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none placeholder:text-cream/30 focus:border-copper" />
        </div>
        {msg && <p className="mt-2 text-xs text-cream/70">{msg}</p>}
        <button onClick={add} disabled={busy} className="mt-2 flex items-center gap-1.5 rounded-lg bg-copper px-3 py-2 text-sm font-bold text-cream hover:bg-copper-dark disabled:opacity-60">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} إضافة
        </button>
      </div>
    </div>
  );
}
