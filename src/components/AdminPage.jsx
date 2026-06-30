import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence, Reorder, useDragControls } from 'framer-motion';
import {
  Lock, LogOut, RefreshCw, Loader2, Package, Clock, MapPin, Phone,
  MessageCircle, Navigation, UserPlus, Trash2, Users, Check, X,
  ShoppingBag, Wallet, ChevronDown, Truck, Sun, Moon, TrendingUp,
  Plus, Minus, Pencil, Eye, EyeOff, GripVertical, Image as ImageIcon, Layers, Save, Boxes,
  Search, KeyRound, Ban, Sparkles, Camera, Link2, Store as StoreIcon, Star, SlidersHorizontal, Banknote, Bike, CheckCircle2, BellRing, Home, Tag,
} from 'lucide-react';
import { useOrderChime } from '../lib/alerts.js';
import PushToggle from './PushToggle.jsx';
import InstallButton from './InstallButton.jsx';
import { sendCampaign } from '../lib/push.js';
import { NewOrderBanner, AlertBell } from './OrderAlert.jsx';
import { fmt } from '../data/catalog.js';
import ProfileForm, { Avatar } from './ProfileForm.jsx';
import { CodeInput, SuccessCheck } from './CodeInput.jsx';
import CategoryPicker from './CategoryPicker.jsx';
import {
  getAdminSession, setAdminSession, clearAdminSession,
  adminLogin, adminListOrders, adminUpdateStatus, adminStats,
  adminListAdmins, adminAdd, adminRemove,
  adminListDrivers, adminAddDriver, adminRemoveDriver, adminAssignDriver,
  adminGetMe, adminUpdateProfile,
  adminListAccounts, adminUpdateAccount, adminResetAccountPin, adminSetAccountPoints, adminRemoveAccount,
  adminListDriversExt, adminListAdminsExt, adminResetDriverPass, adminResetAdminPass,
  adminSetDriverActive, adminSetAdminActive,
  adminCreateCampaign, adminListCampaigns, adminCustomerSubCount,
  adminStoreReviews, adminDeleteStoreReview, adminDriverReviews, adminDeleteDriverReview, adminSetProductReviews, adminMarkupIncome,
} from '../lib/admin.js';
import ReviewsModeration from './ReviewsModeration.jsx';
import {
  adminListProducts, adminAddProduct, adminUpdateProduct, adminRemoveProduct,
  adminSetProductActive, adminReorderProducts,
  adminListCategories, adminAddCategory, adminUpdateCategory, adminRemoveCategory,
  adminReorderCategories,
  adminListSubcategories, adminSaveSubcategory, adminDeleteSubcategory, adminSetProductSubcategory,
  adminListBundles, adminAddBundle, adminUpdateBundle, adminRemoveBundle,
  adminSetBundleActive, adminReorderBundles, adminSetBundleSeason,
  adminListStores, adminAddStore, adminUpdateStore, adminRemoveStore,
  adminReorderStores, adminSetProductStore, adminSetStoreCredentials,
  adminSetStoreCommission, adminCommissionReport,
  adminFinanceReport, adminSettleMerchant, adminSettleDriver,
  adminSetGlobalMarkup, adminSetStoreMarkup, adminSetCategoryMarkup, adminSetProductMarkup, adminSetBundleMarkup, adminSetPriceRounding,
  getSettings, adminUpdateSettings, adminSetPointsSettings, adminSetRatingWindow,
} from '../lib/products.js';
import {
  adminListHome, adminSaveHomeGroup, adminDeleteHomeGroup,
  adminSaveHomeTab, adminDeleteHomeTab, adminSaveHomeBanner, adminDeleteHomeBanner,
  adminSetCategoryHome, adminSetStorefront,
} from '../lib/storefront.js';
import { uploadProductImage, uploadStoreCover, uploadStoreVideo } from '../lib/storage.js';
import { extractProductsFromImage, generateProductDescription, generateBundle } from '../lib/ai.js';
import { cleanProductImage } from '../lib/bgremove.js';
import { applySettings, POINTS } from '../config.js';
import { adminListCoupons, adminUpsertCoupon, adminSetCouponActive, adminDeleteCoupon, couponError } from '../lib/coupons.js';
import { adminAdjustWallet } from '../lib/wallet.js';

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
  const [shake, setShake] = useState(false);
  const [done, setDone] = useState(false);
  const [plain, setPlain] = useState(false);

  async function submit(code) {
    const p = (code ?? pass).trim();
    if (!p) return;
    setBusy(true); setErr('');
    const res = await adminLogin(p);
    if (res?.ok) {
      setDone(true);
      setTimeout(() => onIn(res.admin), 1050);
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

        {done ? (
          <SuccessCheck label="أهلاً بك 👋" sub="جارٍ فتح اللوحة…" />
        ) : (
          <>
            {plain ? (
              <input
                type="password" value={pass} onChange={(e) => setPass(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submit()}
                placeholder="كلمة المرور" autoFocus
                className="w-full rounded-2xl border border-ink/10 dark:border-white/10 bg-beige dark:bg-night-900 px-4 py-3 text-center font-body text-lg tracking-widest text-ink dark:text-cream outline-none placeholder:text-ink/35 dark:placeholder:text-cream/30 focus:border-copper"
              />
            ) : (
              <CodeInput length={6} mask value={pass} onChange={setPass} onComplete={(v) => submit(v)} error={shake} autoFocus autoComplete="off" disabled={busy} />
            )}
            {err && <p className="mt-3 text-center text-sm text-red-400">{err}</p>}
            <button
              onClick={() => submit()} disabled={busy}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-copper py-3 font-display font-bold text-ink dark:text-cream transition hover:bg-copper-dark disabled:opacity-60"
            >
              {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Lock className="h-5 w-5" />}
              دخول
            </button>
            <button
              type="button"
              onClick={() => { setPlain((v) => !v); setPass(''); setErr(''); }}
              className="mt-3 block w-full text-center text-xs text-ink/40 transition hover:text-copper dark:text-cream/40"
            >
              {plain ? 'استخدم مربّعات الرمز' : 'كلمة مرور عادية؟'}
            </button>
          </>
        )}
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
  const [showStores, setShowStores] = useState(false);
  const [showEarnings, setShowEarnings] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [section, setSection] = useState('orders'); // orders | catalog | stores | finance | people | settings | profile
  const [showBundles, setShowBundles] = useState(false);
  const [showUsers, setShowUsers] = useState(false);
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
  const alert = useOrderChime(counts.new || 0);

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

      <main className="mx-auto max-w-5xl space-y-5 px-4 py-5">
        {/* section navigation */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {[['orders', 'الطلبات', ShoppingBag], ['catalog', 'الكتالوج', Boxes], ['storefront', 'واجهة Blinkit', Sparkles], ['stores', 'المتاجر', StoreIcon], ['finance', 'المالية', Wallet], ['people', 'المستخدمون', Users], ['coupons', 'كوبونات', Tag], ['reviews', 'التقييمات', Star], ['campaigns', 'الإشعارات', BellRing], ['settings', 'الإعدادات', SlidersHorizontal], ['profile', 'حسابي', KeyRound]].map(([k, label, Icon]) => (
            <button key={k} onClick={() => setSection(k)}
              className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-2 text-sm font-bold transition ${section === k ? 'bg-copper text-cream shadow-soft' : 'bg-ink/5 text-ink/60 hover:bg-ink/10 dark:bg-white/10 dark:text-cream/60'}`}>
              <Icon className="h-4 w-4" /> {label}
            </button>
          ))}
        </div>

        {section === 'orders' && (<>
        {alert.newCount > 0 && (
          <NewOrderBanner count={alert.newCount} onAck={() => { alert.acknowledge(); setFilter('new'); }} />
        )}
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
        </>)}

        {section === 'catalog' && <SectionCard><CatalogSection admin={admin} /></SectionCard>}
        {section === 'storefront' && <SectionCard><StorefrontSection admin={admin} /></SectionCard>}
        {section === 'stores' && <SectionCard><StoresManager admin={admin} /></SectionCard>}
        {section === 'finance' && <SectionCard><EarningsManager admin={admin} /></SectionCard>}
        {section === 'people' && <SectionCard><PeopleSection admin={admin} onChange={load} /></SectionCard>}
        {section === 'coupons' && <SectionCard><CouponsManager admin={admin} /></SectionCard>}
        {section === 'reviews' && <SectionCard><ReviewsManager admin={admin} /></SectionCard>}
        {section === 'settings' && <SectionCard><SettingsManager admin={admin} /></SectionCard>}
        {section === 'campaigns' && <SectionCard><CampaignsManager admin={admin} /></SectionCard>}
        {section === 'profile' && (
          <SectionCard>
            <div className="p-4">
              {me ? (
                <ProfileForm
                  initial={me}
                  show={{ phone: true, email: true }}
                  uploadPrefix="admin"
                  uploadId={admin.id}
                  title="ملفّي الشخصي"
                  onAvatarChange={async (url) => {
                    const r = await adminUpdateProfile(admin.id, { avatar_url: url });
                    if (r?.ok) setMe(r.profile);
                    return { error: r?.ok ? undefined : 'تعذّر الحفظ' };
                  }}
                  onSave={async (vals) => {
                    const r = await adminUpdateProfile(admin.id, {
                      name: (vals.name || '').trim(), phone: (vals.phone || '').trim() || null, email: (vals.email || '').trim() || null,
                    });
                    if (r?.ok) { setMe(r.profile); return {}; }
                    return { error: 'تعذّر الحفظ' };
                  }}
                />
              ) : (
                <div className="flex items-center justify-center gap-2 py-10 text-ink/50 dark:text-cream/50"><Loader2 className="h-5 w-5 animate-spin" /> جارٍ التحميل…</div>
              )}
            </div>
          </SectionCard>
        )}

        <div className="pb-6 pt-2 text-center text-xs text-ink/35 dark:text-cream/30">اطلبها — لوحة الإدارة</div>
      </main>
    </div>
  );
}

// a card container for an admin section
function SectionCard({ children }) {
  return <div className="overflow-hidden rounded-2xl border border-ink/10 bg-cream dark:border-white/10 dark:bg-night-800">{children}</div>;
}

// sub-tabs used inside grouped admin sections
function SubTabs({ value, onChange, tabs }) {
  return (
    <div className="flex gap-1.5 overflow-x-auto border-b border-ink/5 px-4 py-3 no-scrollbar dark:border-white/5">
      {tabs.map(([k, label, Icon]) => (
        <button key={k} onClick={() => onChange(k)}
          className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-2 text-sm font-bold transition ${value === k ? 'bg-copper text-cream shadow-soft' : 'bg-ink/5 text-ink/60 hover:bg-ink/10 dark:bg-white/10 dark:text-cream/60'}`}>
          <Icon className="h-4 w-4" /> {label}
        </button>
      ))}
    </div>
  );
}

// الكتالوج: المنتجات + الأقسام + الباقات
function CatalogSection({ admin }) {
  const [t, setT] = useState('products');
  return (
    <div>
      <SubTabs value={t} onChange={setT} tabs={[['products', 'المنتجات', Package], ['categories', 'الأقسام', Layers], ['subcategories', 'التفرّعات', Layers], ['bundles', 'الباقات', Boxes]]} />
      {t === 'products' && <ProductsManager admin={admin} />}
      {t === 'categories' && <CategoriesManager admin={admin} />}
      {t === 'subcategories' && <SubcategoriesManager admin={admin} />}
      {t === 'bundles' && <BundlesManager admin={admin} />}
    </div>
  );
}

// المستخدمون: الزبائن + المندوبون + المشرفون
function PeopleSection({ admin, onChange }) {
  const [t, setT] = useState('customers');
  return (
    <div>
      <SubTabs value={t} onChange={setT} tabs={[['customers', 'الزبائن', Users], ['drivers', 'المندوبون', Truck], ['admins', 'المشرفون', KeyRound]]} />
      {t === 'customers' && <UsersManager admin={admin} />}
      {t === 'drivers' && <DriversManager admin={admin} onChange={onChange} />}
      {t === 'admins' && <AdminsManager admin={admin} />}
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
// a ready, status-aware WhatsApp message to the customer (free wa.me link)
function customerWaMessage(o) {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const link = `${origin}/order/${o.id}`;
  const name = o.customer_name ? ` ${o.customer_name}` : '';
  const no = o.order_no;
  const total = `${fmt(o.total || 0)} د.ع`;
  switch (o.status) {
    case 'preparing':
      return `مرحباً${name} 👋\nطلبك رقم #${no} قيد التحضير الآن 👨‍🍳\nراح نبلّغك أول ما ينطلق إليك.\nتابع طلبك: ${link}\n— اطلبها 🌿`;
    case 'delivering':
      return `مرحباً${name} 🚗💨\nطلبك رقم #${no} بالطريق إليك الآن!\nيرجى تجهيز المبلغ: ${total}\nتابع المندوب لحظة بلحظة: ${link}\n— اطلبها 🌿`;
    case 'done':
      return `مرحباً${name} 🎉\nتم توصيل طلبك رقم #${no} بنجاح.\nشكراً لثقتك بـ«اطلبها» 🌿 نتشرّف بخدمتك مجدداً!`;
    case 'cancelled':
      return `مرحباً${name}\nبخصوص طلبك رقم #${no} — نأسف، تم إلغاء الطلب.\nلأي استفسار نحن بالخدمة. — اطلبها`;
    case 'new':
    default:
      return `مرحباً${name} 👋\nتم استلام طلبك رقم #${no} بنجاح ✅\nالإجمالي: ${total}\nراح نبلّغك بكل تحديث على الطلب.\nتابع طلبك من هنا: ${link}\n— اطلبها 🌿`;
  }
}

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
          <a href={`https://wa.me/${wa}?text=${encodeURIComponent(customerWaMessage(o))}`} target="_blank" rel="noreferrer"
            className="flex items-center gap-1.5 rounded-xl bg-green-600/90 px-3 py-2 text-sm font-bold text-white hover:bg-green-600">
            <MessageCircle className="h-4 w-4" /> أبلغ الزبون
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
          className={`flex-1 rounded-lg px-2.5 py-1.5 text-sm font-bold outline-none transition ${
            o.driver_id
              ? 'border-2 border-green-400 bg-green-600 text-white animate-glow-green'
              : 'border-2 border-red-400 bg-red-600 text-white animate-glow-red'
          }`}
        >
          <option value="" className="bg-night-800 text-cream">— بدون مندوب —</option>
          {drivers.map((d) => (
            <option key={d.id} value={d.id} className="bg-night-800 text-cream">{d.name || d.username}</option>
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
function ReviewsManager({ admin }) {
  const [tab, setTab] = useState('stores');
  return (
    <div>
      <p className="mb-3 text-sm text-ink/55 dark:text-cream/55">راجع و احذف أي تقييم أو تعليق غير لائق. حذف التقييم يعيد حساب معدّل المتجر/المندوب تلقائياً.</p>
      <div className="mb-4 flex gap-2">
        {[['stores', 'تقييمات المتاجر'], ['drivers', 'تقييمات المندوبين']].map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-bold transition ${tab === k ? 'bg-copper text-cream shadow-soft' : 'bg-ink/5 text-ink/60 hover:bg-ink/10 dark:bg-white/10 dark:text-cream/60'}`}>
            {l}
          </button>
        ))}
      </div>
      {tab === 'stores' && (
        <ReviewsModeration
          load={() => adminStoreReviews(admin.id)}
          remove={(id) => adminDeleteStoreReview(admin.id, id)}
          primaryKey="name" secondaryKey="store"
          emptyText="لا توجد تقييمات متاجر بعد"
        />
      )}
      {tab === 'drivers' && (
        <ReviewsModeration
          load={() => adminDriverReviews(admin.id)}
          remove={(oid) => adminDeleteDriverReview(admin.id, oid)}
          idKey="order_id" primaryKey="driver"
          emptyText="لا توجد تقييمات مندوبين بعد"
        />
      )}
    </div>
  );
}

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
                {d.rating_count > 0 && (
                  <span className="mr-2 inline-flex items-center gap-0.5 font-bold text-amber-500"><Star className="h-3 w-3 fill-amber-400 text-amber-400" /> {(d.rating_sum / d.rating_count).toFixed(1)} <span className="font-normal text-ink/40 dark:text-cream/40">({d.rating_count})</span></span>
                )}
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
  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // null | 'new' | product
  const [confirm, setConfirm] = useState(null);
  const [smart, setSmart] = useState(false);
  const listRef = useRef([]);

  async function load() {
    setLoading(true);
    const [p, c, s] = await Promise.all([adminListProducts(admin.id), adminListCategories(admin.id), adminListSubcategories(admin.id)]);
    const items = Array.isArray(p?.products) ? p.products : [];
    setList(items); listRef.current = items;
    setCats(Array.isArray(c?.categories) ? c.categories : []);
    setSubs(Array.isArray(s) ? s : []);
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
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-[12px] text-ink/50 dark:text-cream/50">{list.length} منتج · اسحب للترتيب</span>
        <div className="flex items-center gap-2">
          <button onClick={() => setSmart(true)}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 px-3 py-2 text-sm font-bold text-white shadow-sm transition hover:opacity-90">
            <Sparkles className="h-4 w-4" /> إضافة ذكية
          </button>
          <button onClick={() => setEditing('new')}
            className="flex items-center gap-1.5 rounded-xl bg-copper px-3 py-2 text-sm font-bold text-ink dark:text-cream hover:bg-copper-dark">
            <Plus className="h-4 w-4" /> منتج جديد
          </button>
        </div>
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
          <ProductForm admin={admin} cats={cats} subs={subs} product={editing === 'new' ? null : editing}
            onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />
        )}
        {smart && (
          <SmartAddModal admin={admin} cats={cats}
            onClose={() => setSmart(false)} onDone={() => { setSmart(false); load(); }} />
        )}
      </AnimatePresence>
    </div>
  );
}

function CopyLinkButton({ url, title = 'نسخ رابط المشاركة' }) {
  const [done, setDone] = useState(false);
  async function copy(e) {
    e.stopPropagation();
    try {
      if (navigator.share) { await navigator.share({ url }); return; }
    } catch { return; }
    try { await navigator.clipboard.writeText(url); setDone(true); setTimeout(() => setDone(false), 1600); } catch {}
  }
  return (
    <button onClick={copy} title={title}
      className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${done ? 'bg-green-500/15 text-green-600 dark:text-green-300' : 'bg-ink/5 text-ink/60 hover:bg-ink/10 dark:bg-white/10 dark:text-cream/70'}`}>
      {done ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
    </button>
  );
}

function ProductRow({ p, onToggle, onEdit, onDelete, confirm, setConfirm, onPersist }) {
  const controls = useDragControls();
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
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
      <CopyLinkButton url={`${origin}/p/${p.id}`} title="نسخ رابط المنتج (للإعلان/المشاركة)" />
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

function ProductForm({ admin, cats, subs = [], product, onClose, onSaved }) {
  const [f, setF] = useState({
    name: product?.name || '',
    category: product?.category || (cats[0]?.name || ''),
    subcategory: product?.subcategory || '',
    price: product?.price ?? '',
    unit: product?.unit || 'كيلو',
    emoji: product?.emoji || '🛒',
    tint: product?.tint || '#9A5318',
    badge: product?.badge || '',
    description: product?.description || '',
  });
  const [track, setTrack] = useState(product?.stock !== null && product?.stock !== undefined);
  const [stock, setStock] = useState(product?.stock != null ? String(product.stock) : '');
  const [reviewsEnabled, setReviewsEnabled] = useState(product?.reviews_enabled !== false);
  const [markup, setMarkup] = useState(product?.markup_pct != null ? String(product.markup_pct) : '');
  const [oldPrice, setOldPrice] = useState(product?.old_price ? String(product.old_price) : '');
  const [stores, setStores] = useState([]);
  const [storeId, setStoreId] = useState(product?.store_id || '');
  const [image, setImage] = useState(product?.image || '');
  const [srcFile, setSrcFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const [cleanPct, setCleanPct] = useState(0);
  const [busy, setBusy] = useState(false);
  const [gen, setGen] = useState(false);
  const [err, setErr] = useState('');
  const fileRef = useRef(null);
  const set = (k) => (e) => setF((prev) => ({ ...prev, [k]: e.target.value }));

  useEffect(() => {
    adminListStores(admin.id).then((r) => {
      const items = Array.isArray(r?.stores) ? r.stores : [];
      setStores(items);
      setStoreId((prev) => prev || product?.store_id || (items[0]?.id || ''));
    });
    // eslint-disable-next-line
  }, []);

  async function cleanBg() {
    if (!srcFile) { setErr('ارفع صورة من جهازك أولاً ثم نظّف خلفيتها'); return; }
    setCleaning(true); setErr(''); setCleanPct(0);
    try {
      const blob = await cleanProductImage(srcFile, (p) => setCleanPct(p));
      const res = await uploadProductImage(blob, product?.id || 'new');
      if (res?.error) setErr(res.error);
      else setImage(res.url);
    } catch {
      setErr('تعذّر تنظيف الخلفية. جرّب صورة أوضح أو جهازاً أقوى.');
    } finally {
      setCleaning(false);
    }
  }

  async function writeWithAI() {
    if (!f.name.trim()) { setErr('اكتب اسم المنتج أولاً'); return; }
    setGen(true); setErr('');
    const r = await generateProductDescription({
      name: f.name.trim(), category: f.category, unit: f.unit, price: parseInt(f.price, 10) || undefined,
    });
    setGen(false);
    if (r?.ok && r.description) setF((prev) => ({ ...prev, description: r.description }));
    else setErr(r?.error || 'تعذّر توليد الوصف');
  }

  async function onFile(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setSrcFile(file);
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
      description: f.description.trim(),
      stock: track ? Math.max(0, parseInt(stock, 10) || 0) : -1, // -1 => untracked
      oldPrice: oldPrice ? Math.max(0, parseInt(oldPrice, 10) || 0) : 0, // 0 => no discount
      image, // '' clears, url sets
    };
    const r = product
      ? await adminUpdateProduct(admin.id, product.id, fields)
      : await adminAddProduct(admin.id, fields);
    if (r?.ok) {
      const pid = r.product?.id || product?.id;
      if (pid && storeId) await adminSetProductStore(admin.id, pid, storeId);
      if (pid) { try { await adminSetProductReviews(admin.id, pid, reviewsEnabled); } catch {} }
      if (pid) { try { await adminSetProductMarkup(admin.id, pid, markup.trim() === '' ? null : Math.max(0, parseFloat(markup) || 0)); } catch {} }
      if (pid) { try { await adminSetProductSubcategory(admin.id, pid, f.subcategory || null); } catch {} }
      setBusy(false);
      onSaved();
    } else {
      setBusy(false);
      setErr('تعذّر الحفظ، حاول مرّة ثانية.');
    }
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
          {srcFile && (
            <button type="button" onClick={cleanBg} disabled={cleaning || uploading}
              className="mt-2 flex items-center gap-1.5 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 px-2.5 py-1.5 text-[12px] font-bold text-white transition hover:opacity-90 disabled:opacity-60">
              {cleaning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              {cleaning ? (cleanPct ? `ينظّف… ${cleanPct}%` : 'يحمّل الأداة…') : 'نظّف الخلفية (أبيض موحّد)'}
            </button>
          )}
          {cleaning && (
            <span className="mt-1 block text-[10px] text-ink/40 dark:text-cream/40">أول مرّة قد تأخذ وقتاً لتحميل الأداة (~٢٠ ميغا، مرّة واحدة).</span>
          )}
          {image && !cleaning && (
            <button type="button" onClick={() => { setImage(''); setSrcFile(null); }} className="mt-1 block font-bold text-red-600 dark:text-red-300">
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
          <CategoryPicker value={f.category} onChange={(v) => setF((prev) => ({ ...prev, category: v, subcategory: '' }))}
            options={cats.map((c) => c.name)} allowNew placeholder="اختر أو أضف قسماً" />
        </Lbl>
        {subs.filter((s) => s.category_name === f.category).length > 0 && (
          <Lbl label="التفرّع (اختياري)">
            <select className={inp} value={f.subcategory} onChange={(e) => setF((prev) => ({ ...prev, subcategory: e.target.value }))}>
              <option value="">— بدون تفرّع —</option>
              {subs.filter((s) => s.category_name === f.category).map((s) => (
                <option key={s.id} value={s.name}>{s.emoji ? s.emoji + ' ' : ''}{s.name}</option>
              ))}
            </select>
          </Lbl>
        )}
        {stores.length > 0 && (
          <Lbl label="المتجر" full>
            <select className={inp} value={storeId} onChange={(e) => setStoreId(e.target.value)}>
              {stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </Lbl>
        )}
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

      {/* stock + discount */}
      <div className="rounded-xl border border-ink/10 dark:border-white/10 bg-cream/60 dark:bg-night-900/40 p-3 space-y-3">
        <label className="flex items-center gap-2 text-sm font-bold text-ink dark:text-cream">
          <input type="checkbox" checked={track} onChange={(e) => setTrack(e.target.checked)}
            className="h-4 w-4 accent-copper" />
          تتبّع الكمية المتوفرة
        </label>
        {track && (
          <div className="grid grid-cols-2 gap-3">
            <Lbl label="الكمية المتوفرة" full>
              <input type="number" inputMode="numeric" className={inp} value={stock} onChange={(e) => setStock(e.target.value)} placeholder="مثلاً: 12" dir="ltr" />
            </Lbl>
            <p className="col-span-2 -mt-1 text-[11px] text-ink/45 dark:text-cream/45">يظهر «بقي N» للزبون عند قلّة الكمية، و «نفد» عند انتهائها (يمنع الطلب).</p>
          </div>
        )}
        <Lbl label="السعر قبل الخصم (اختياري — يفعّل شارة خصم)" full>
          <input type="number" inputMode="numeric" className={inp} value={oldPrice} onChange={(e) => setOldPrice(e.target.value)}
            placeholder="اتركه فارغاً لو ما في خصم" dir="ltr" />
        </Lbl>
        {oldPrice && parseInt(oldPrice, 10) > (parseInt(f.price, 10) || 0) && (
          <p className="-mt-1 text-[11px] font-bold text-green-600 dark:text-green-300">
            خصم {Math.round(((parseInt(oldPrice, 10) - (parseInt(f.price, 10) || 0)) / parseInt(oldPrice, 10)) * 100)}% — يظهر السعر القديم مشطوباً.
          </p>
        )}
      </div>

      {/* per-product reviews toggle */}
      <label className="flex items-center justify-between rounded-xl border border-ink/10 bg-cream/60 p-3 dark:border-white/10 dark:bg-night-900/40">
        <span className="flex items-center gap-1.5 text-sm font-bold text-ink dark:text-cream"><Star className="h-4 w-4 text-copper" /> السماح بتقييم هذا المنتج</span>
        <input type="checkbox" checked={reviewsEnabled} onChange={(e) => setReviewsEnabled(e.target.checked)} className="h-4 w-4 accent-copper" />
      </label>

      {/* per-product platform markup (owner's margin) */}
      <div className="rounded-xl border border-ink/10 bg-cream/60 p-3 dark:border-white/10 dark:bg-night-900/40">
        <div className="mb-1.5 flex items-center gap-1.5 text-sm font-bold text-ink dark:text-cream"><TrendingUp className="h-4 w-4 text-copper" /> هامش المنصّة لهذا المنتج %</div>
        <input type="number" step="0.5" min="0" max="100" dir="ltr" value={markup} onChange={(e) => setMarkup(e.target.value)}
          className="w-full rounded-lg border border-ink/10 bg-beige px-3 py-2 text-sm font-bold text-ink outline-none focus:border-copper dark:border-white/10 dark:bg-night-900 dark:text-cream"
          placeholder="فارغ = يرث الفئة/المتجر/العام" />
        <p className="mt-1 text-[10px] leading-snug text-ink/40 dark:text-cream/40">نسبة ربحك المضافة فوق سعر التاجر. اتركه فارغاً ليرث الأعلى، أو 0 لإلغاء الهامش هنا.</p>
      </div>

      {/* description (shown in the product detail popup) */}
      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <span className="font-body text-sm font-bold text-ink dark:text-cream">الوصف (يظهر عند فتح المنتج)</span>
          <button type="button" onClick={writeWithAI} disabled={gen}
            className="flex items-center gap-1.5 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 px-2.5 py-1.5 text-[12px] font-bold text-white transition hover:opacity-90 disabled:opacity-60">
            {gen ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            {gen ? 'يكتب…' : 'اكتب بالذكاء'}
          </button>
        </div>
        <textarea rows={4} className={inp} value={f.description} onChange={set('description')}
          placeholder="نبذة تسويقية قصيرة تجعل الزبون يرغب بالشراء… أو اضغط «اكتب بالذكاء»." />
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
  const [editCat, setEditCat] = useState(null);
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

  async function remove(c) {
    setConfirm(null); setMsg('');
    const r = await adminRemoveCategory(admin.id, c.id);
    if (r?.ok) load();
    else if (r?.error === 'in_use') setMsg(`فيه ${r.count} منتج في «${c.name}» — غيّر قسمها أو احذفها أولاً`);
    else setMsg('تعذّر الحذف');
  }

  return (
    <div className="space-y-3 px-4 pb-4">
      <span className="text-[12px] text-ink/50 dark:text-cream/50">{list.length} قسم · اسحب للترتيب · اضغط ✎ لإضافة صورة</span>
      {loading ? (
        <div className="flex items-center justify-center gap-2 py-8 text-ink/50 dark:text-cream/50">
          <Loader2 className="h-5 w-5 animate-spin" /> جارٍ التحميل…
        </div>
      ) : (
        <Reorder.Group axis="y" values={list} onReorder={onReorder} className="space-y-2">
          {list.map((c) => (
            <CategoryRow key={c.id} c={c} onEdit={() => setEditCat(c)}
              onDelete={remove} confirm={confirm} setConfirm={setConfirm} onPersist={persistOrder} />
          ))}
        </Reorder.Group>
      )}
      {msg && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-600 dark:text-red-300">{msg}</p>}

      <div className="rounded-xl border border-ink/10 dark:border-white/10 bg-cream dark:bg-night-800 p-3">
        <div className="mb-2 flex items-center gap-2 text-sm font-bold"><Plus className="h-4 w-4 text-copper" /> إضافة قسم</div>
        <div className="flex gap-2">
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="اسم القسم (مثلاً: أجبان)" className={inp + ' flex-1'} />
          <input value={form.emoji} onChange={(e) => setForm({ ...form, emoji: e.target.value })}
            placeholder="🏷️" className="w-16 shrink-0 rounded-xl border border-ink/10 bg-beige px-2 py-2.5 text-center text-sm outline-none focus:border-copper dark:border-white/10 dark:bg-night-900" />
          <button onClick={add} className="shrink-0 rounded-xl bg-copper px-4 py-2.5 text-sm font-bold text-ink dark:text-cream hover:bg-copper-dark">إضافة</button>
        </div>
        <p className="mt-1.5 text-[11px] text-ink/40 dark:text-cream/40">بعد الإضافة، اضغط ✎ على القسم لرفع صورة له.</p>
      </div>

      <AnimatePresence>
        {editCat && (
          <CategoryModal admin={admin} category={editCat}
            onClose={() => setEditCat(null)} onSaved={() => { setEditCat(null); load(); }} />
        )}
      </AnimatePresence>
    </div>
  );
}

function CategoryRow({ c, onEdit, onDelete, confirm, setConfirm, onPersist }) {
  const controls = useDragControls();
  const [ok, setOk] = useState(true);
  return (
    <Reorder.Item value={c} dragListener={false} dragControls={controls} onDragEnd={onPersist}
      className="flex items-center gap-2 rounded-xl border border-ink/10 dark:border-white/10 bg-beige dark:bg-night-900 p-2">
      <span onPointerDown={(e) => controls.start(e)}
        className="cursor-grab touch-none px-0.5 text-ink/30 dark:text-cream/30 active:cursor-grabbing">
        <GripVertical className="h-4 w-4" />
      </span>
      <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-lg bg-white text-xl ring-1 ring-ink/5 dark:ring-white/10">
        {c.image && ok
          ? <img src={c.image} alt="" className="h-full w-full object-contain p-0.5 mix-blend-multiply" onError={() => setOk(false)} />
          : <span>{c.emoji || '🏷️'}</span>}
      </span>
      <span className="flex-1 truncate font-display text-sm font-bold text-ink dark:text-cream">{c.name}</span>
      <CopyLinkButton url={`${typeof window !== 'undefined' ? window.location.origin : ''}/c/${encodeURIComponent(c.name)}`} title="نسخ رابط القسم (للإعلان/المشاركة)" />
      <button onClick={onEdit}
        className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-ink/5 text-ink/60 hover:bg-ink/10 dark:bg-white/10 dark:text-cream/70"><Pencil className="h-4 w-4" /></button>
      {confirm === c.id ? (
        <button onClick={() => onDelete(c)} className="shrink-0 rounded-lg bg-red-600 px-2 py-1.5 text-[11px] font-bold text-white">تأكيد؟</button>
      ) : (
        <button onClick={() => setConfirm(c.id)}
          className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-red-500/10 text-red-600 hover:bg-red-500/20 dark:text-red-300"><Trash2 className="h-4 w-4" /></button>
      )}
    </Reorder.Item>
  );
}

function SubcategoriesManager({ admin }) {
  const [cats, setCats] = useState([]);
  const [subs, setSubs] = useState([]);
  const [form, setForm] = useState({ categoryName: '', name: '', emoji: '' });
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [confirm, setConfirm] = useState(null);

  async function load() {
    setLoading(true);
    const [c, s] = await Promise.all([adminListCategories(admin.id), adminListSubcategories(admin.id)]);
    const cl = Array.isArray(c?.categories) ? c.categories : [];
    setCats(cl);
    setSubs(Array.isArray(s) ? s : []);
    setForm((f) => ({ ...f, categoryName: f.categoryName || (cl[0]?.name || '') }));
    setLoading(false);
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);
  useEffect(() => {
    if (!confirm) return;
    const t = setTimeout(() => setConfirm(null), 2600);
    return () => clearTimeout(t);
  }, [confirm]);

  async function add() {
    setMsg('');
    if (!form.categoryName) { setMsg('اختر الفئة الأمّ'); return; }
    if (!form.name.trim()) { setMsg('اكتب اسم التفرّع'); return; }
    const r = await adminSaveSubcategory(admin.id, { categoryName: form.categoryName, name: form.name.trim(), emoji: form.emoji.trim(), sort: subs.length });
    if (r && r.id) { setForm({ categoryName: form.categoryName, name: '', emoji: '' }); load(); }
    else setMsg('تعذّرت الإضافة');
  }

  async function remove(s) {
    setConfirm(null); setMsg('');
    const r = await adminDeleteSubcategory(admin.id, s.id);
    if (r?.ok) load(); else setMsg('تعذّر الحذف');
  }

  const grouped = {};
  subs.forEach((s) => { (grouped[s.category_name] = grouped[s.category_name] || []).push(s); });

  return (
    <div className="space-y-3 px-4 pb-4">
      <span className="text-[12px] text-ink/50 dark:text-cream/50">{subs.length} تفرّع · التفرّع يتبع فئة أمّ · المنتج بدون تفرّع يبقى يظهر بالفئة</span>
      {loading ? (
        <div className="flex items-center justify-center gap-2 py-8 text-ink/50 dark:text-cream/50">
          <Loader2 className="h-5 w-5 animate-spin" /> جارٍ التحميل…
        </div>
      ) : !cats.length ? (
        <p className="rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">أضِف أقساماً أولاً من تبويب «الأقسام»، بعدها تگدر تضيف تفرّعات لها.</p>
      ) : (
        <div className="space-y-3">
          {cats.filter((c) => grouped[c.name]?.length).map((c) => (
            <div key={c.id} className="overflow-hidden rounded-xl border border-ink/10 dark:border-white/10">
              <div className="flex items-center gap-2 bg-beige px-3 py-2 font-display text-sm font-bold text-ink dark:bg-night-900 dark:text-cream">
                <span>{c.emoji || '🏷️'}</span> {c.name}
                <span className="text-[11px] font-normal text-ink/40 dark:text-cream/40">({grouped[c.name].length})</span>
              </div>
              <div className="divide-y divide-ink/5 dark:divide-white/5">
                {grouped[c.name].map((s) => (
                  <div key={s.id} className="flex items-center gap-2 bg-cream px-3 py-2 dark:bg-night-800">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white text-lg ring-1 ring-ink/5 dark:bg-night-900 dark:ring-white/10">{s.emoji || '🔖'}</span>
                    <span className="flex-1 truncate text-sm text-ink dark:text-cream">{s.name}</span>
                    {confirm === s.id ? (
                      <button onClick={() => remove(s)} className="shrink-0 rounded-lg bg-red-600 px-2 py-1.5 text-[11px] font-bold text-white">تأكيد؟</button>
                    ) : (
                      <button onClick={() => setConfirm(s.id)} className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-red-500/10 text-red-600 hover:bg-red-500/20 dark:text-red-300"><Trash2 className="h-4 w-4" /></button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
          {!subs.length && <p className="py-4 text-center text-xs text-ink/40 dark:text-cream/40">ماكو تفرّعات بعد — أضف أول تفرّع تحت.</p>}
        </div>
      )}
      {msg && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-600 dark:text-red-300">{msg}</p>}

      {cats.length > 0 && (
        <div className="rounded-xl border border-ink/10 bg-cream p-3 dark:border-white/10 dark:bg-night-800">
          <div className="mb-2 flex items-center gap-2 text-sm font-bold"><Plus className="h-4 w-4 text-copper" /> إضافة تفرّع</div>
          <div className="space-y-2">
            <select value={form.categoryName} onChange={(e) => setForm({ ...form, categoryName: e.target.value })} className={inp + ' w-full'}>
              {cats.map((c) => <option key={c.id} value={c.name}>{c.emoji ? c.emoji + ' ' : ''}{c.name}</option>)}
            </select>
            <div className="flex gap-2">
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="اسم التفرّع (مثلاً: أجبان بيضاء)" className={inp + ' flex-1'} />
              <input value={form.emoji} onChange={(e) => setForm({ ...form, emoji: e.target.value })}
                placeholder="🔖" className="w-16 shrink-0 rounded-xl border border-ink/10 bg-beige px-2 py-2.5 text-center text-sm outline-none focus:border-copper dark:border-white/10 dark:bg-night-900" />
              <button onClick={add} className="shrink-0 rounded-xl bg-copper px-4 py-2.5 text-sm font-bold text-ink hover:bg-copper-dark dark:text-cream">إضافة</button>
            </div>
          </div>
          <p className="mt-1.5 text-[11px] text-ink/40 dark:text-cream/40">بعد إضافة التفرّعات، روح لـ«المنتجات» وحدّد تفرّع كل منتج.</p>
        </div>
      )}
    </div>
  );
}

function CategoryModal({ admin, category, onClose, onSaved }) {
  const [name, setName] = useState(category.name || '');
  const [emoji, setEmoji] = useState(category.emoji || '');
  const [markup, setMarkup] = useState(category.markup_pct != null ? String(category.markup_pct) : '');
  const [image, setImage] = useState(category.image || '');
  const [srcFile, setSrcFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const [cleanPct, setCleanPct] = useState(0);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const fileRef = useRef(null);

  async function onFile(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setSrcFile(file);
    setUploading(true); setErr('');
    const res = await uploadProductImage(file, 'cat-' + category.id);
    setUploading(false);
    if (res?.error) { setErr(res.error); return; }
    setImage(res.url);
  }

  async function cleanBg() {
    if (!srcFile) { setErr('ارفع صورة أولاً ثم نظّف خلفيتها'); return; }
    setCleaning(true); setErr(''); setCleanPct(0);
    try {
      const blob = await cleanProductImage(srcFile, (p) => setCleanPct(p));
      const res = await uploadProductImage(blob, 'cat-' + category.id);
      if (res?.error) setErr(res.error);
      else setImage(res.url);
    } catch {
      setErr('تعذّر تنظيف الخلفية. جرّب صورة أوضح.');
    } finally {
      setCleaning(false);
    }
  }

  async function save() {
    if (!name.trim()) { setErr('اكتب اسم القسم'); return; }
    setBusy(true); setErr('');
    const r = await adminUpdateCategory(admin.id, category.id, {
      name: name.trim(), emoji: emoji.trim(), image,
    });
    try { await adminSetCategoryMarkup(admin.id, category.id, markup.trim() === '' ? null : Math.max(0, parseFloat(markup) || 0)); } catch {}
    setBusy(false);
    if (r?.ok) onSaved();
    else setErr(r?.error === 'exists' ? 'الاسم مستخدم لقسم آخر' : 'تعذّر الحفظ');
  }

  return (
    <Modal title="تعديل القسم" onClose={onClose}>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => fileRef.current?.click()}
          className="relative grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-2xl bg-white text-3xl ring-1 ring-ink/10 dark:ring-white/10">
          {uploading
            ? <Loader2 className="h-6 w-6 animate-spin text-copper" />
            : image
              ? <img src={image} alt="" className="h-full w-full object-contain p-1 mix-blend-multiply" />
              : <span>{emoji || '🏷️'}</span>}
          <span className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-0.5 bg-copper/90 py-0.5 text-[9px] font-bold text-white">
            <ImageIcon className="h-2.5 w-2.5" /> صورة
          </span>
        </button>
        <div className="text-[11px] leading-relaxed text-ink/50 dark:text-cream/50">
          اضغط المربّع لرفع صورة للقسم (مثل صورة فواكه أو أجبان). الأفضل خلفية بيضاء.
          {srcFile && (
            <button type="button" onClick={cleanBg} disabled={cleaning || uploading}
              className="mt-2 flex items-center gap-1.5 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 px-2.5 py-1.5 text-[12px] font-bold text-white transition hover:opacity-90 disabled:opacity-60">
              {cleaning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              {cleaning ? (cleanPct ? `ينظّف… ${cleanPct}%` : 'يحمّل الأداة…') : 'نظّف الخلفية'}
            </button>
          )}
          {image && !cleaning && (
            <button type="button" onClick={() => { setImage(''); setSrcFile(null); }} className="mt-1 block font-bold text-red-600 dark:text-red-300">
              إزالة الصورة (يرجع للإيموجي)
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Lbl label="اسم القسم" full>
          <input className={inp} value={name} onChange={(e) => setName(e.target.value)} />
        </Lbl>
        <Lbl label="إيموجي احتياطي">
          <input className={inp} value={emoji} onChange={(e) => setEmoji(e.target.value)} placeholder="🏷️" />
        </Lbl>
        <Lbl label="هامش المنصّة %">
          <input type="number" step="0.5" min="0" max="100" dir="ltr" className={inp} value={markup} onChange={(e) => setMarkup(e.target.value)} placeholder="فارغ = العام" />
        </Lbl>
      </div>

      {err && <div className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-300">{err}</div>}

      <div className="flex gap-2">
        <button onClick={save} disabled={busy || uploading || cleaning}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-copper py-3 font-display font-bold text-ink dark:text-cream hover:bg-copper-dark disabled:opacity-60">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} حفظ
        </button>
        <button onClick={onClose} className="rounded-xl bg-ink/5 px-5 py-3 font-bold text-ink/70 hover:bg-ink/10 dark:bg-white/5 dark:text-cream/70">إلغاء</button>
      </div>
    </Modal>
  );
}

/* ════════════════════════════ Stores ════════════════════════════ */
const STORE_CATS = ['بقالة', 'مخبز', 'مطعم', 'خضار', 'فواكه', 'حلويات', 'لحوم', 'مشروبات', 'ألبان', 'أخرى'];

function CampaignsManager({ admin }) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [destType, setDestType] = useState('home'); // home | category | store | product | custom
  const [destValue, setDestValue] = useState(''); // selected name/id (or custom path)
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null); // {type:'ok'|'err', text}
  const [subCount, setSubCount] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cats, setCats] = useState([]);
  const [stores, setStores] = useState([]);
  const [products, setProducts] = useState([]);

  // build destination path from picker
  const url = useMemo(() => {
    if (destType === 'home') return '';
    if (destType === 'custom') return destValue.trim();
    if (!destValue) return '';
    if (destType === 'category') return `/c/${destValue}`;
    if (destType === 'store') return `/s/${destValue}`;
    if (destType === 'product') return `/p/${destValue}`;
    return '';
  }, [destType, destValue]);

  async function refresh() {
    const [c, s] = await Promise.all([adminListCampaigns(admin.id), adminCustomerSubCount(admin.id)]);
    if (c?.ok) setCampaigns(c.campaigns || []);
    if (s?.ok) setSubCount(s.count);
    setLoading(false);
  }
  useEffect(() => {
    refresh();
    adminListCategories(admin.id).then((r) => { if (Array.isArray(r?.categories)) setCats(r.categories); });
    adminListStores(admin.id).then((r) => { if (Array.isArray(r?.stores)) setStores(r.stores); });
    adminListProducts(admin.id).then((r) => { if (Array.isArray(r?.products)) setProducts(r.products); });
    /* eslint-disable-next-line */
  }, []);

  async function send() {
    if (!title.trim() || !body.trim()) { setMsg({ type: 'err', text: 'اكتب العنوان والنص.' }); return; }
    if (!window.confirm(`إرسال الإشعار لكل الزبائن المشتركين${subCount != null ? ` (${subCount})` : ''}؟`)) return;
    setBusy(true); setMsg(null);
    const c = await adminCreateCampaign(admin.id, title.trim(), body.trim(), url.trim() || null);
    if (!c?.ok) { setBusy(false); setMsg({ type: 'err', text: 'تعذّر إنشاء الحملة.' }); return; }
    const r = await sendCampaign(c.id, admin.id);
    setBusy(false);
    if (r?.ok) {
      setMsg({ type: 'ok', text: `تم الإرسال إلى ${r.sent} جهاز ✅` });
      setTitle(''); setBody(''); setDestType('home'); setDestValue('');
      refresh();
    } else {
      setMsg({ type: 'err', text: r?.error === 'no_vapid_key' ? 'مفتاح الإشعارات غير مضبوط في Netlify.' : 'تعذّر الإرسال. حاول ثانية.' });
      refresh();
    }
  }

  const inp = 'w-full rounded-xl border border-ink/10 bg-cream px-3 py-2.5 font-body text-ink outline-none transition focus:border-copper focus:ring-2 focus:ring-copper/20 dark:border-white/10 dark:bg-night-800 dark:text-cream';

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center gap-2"><BellRing className="h-5 w-5 text-copper" /><h2 className="font-display text-lg font-black text-ink dark:text-cream">إشعارات الإعلانات والعروض</h2></div>
        <p className="mt-1 text-xs text-ink/50 dark:text-cream/50">
          أرسل إشعاراً لكل الزبائن الذين فعّلوا الإشعارات{subCount != null && <span className="font-bold text-copper"> · {subCount} مشترك</span>}.
        </p>
      </div>

      {/* composer */}
      <div className="space-y-3 rounded-2xl bg-ink/[0.02] p-4 ring-1 ring-ink/5 dark:bg-white/[0.02] dark:ring-white/5">
        <div>
          <label className="mb-1 block text-xs font-bold text-ink/60 dark:text-cream/60">العنوان</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={50} className={inp} placeholder="مثلاً: 🎉 خصم ٢٠٪ اليوم فقط!" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-bold text-ink/60 dark:text-cream/60">النص</label>
          <textarea value={body} onChange={(e) => setBody(e.target.value)} maxLength={120} rows={2} className={inp} placeholder="مثلاً: على كل الخضار والفواكه الطازجة — اطلب الآن قبل ما يخلص!" />
        </div>

        {/* destination picker */}
        <div>
          <label className="mb-1 block text-xs font-bold text-ink/60 dark:text-cream/60">عند الضغط على الإشعار يفتح…</label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[['home', 'الرئيسية', Home], ['category', 'فئة', Boxes], ['store', 'متجر', StoreIcon], ['product', 'منتج', Tag]].map(([k, label, Icon]) => (
              <button key={k} type="button" onClick={() => { setDestType(k); setDestValue(''); }}
                className={`flex items-center justify-center gap-1.5 rounded-xl py-2 text-sm font-bold transition ${destType === k ? 'bg-copper text-cream shadow-soft' : 'bg-ink/5 text-ink/60 hover:bg-ink/10 dark:bg-white/10 dark:text-cream/60'}`}>
                <Icon className="h-4 w-4" /> {label}
              </button>
            ))}
          </div>

          {destType === 'category' && (
            <select value={destValue} onChange={(e) => setDestValue(e.target.value)} className={`mt-2 ${inp}`}>
              <option value="">— اختر الفئة —</option>
              {cats.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
          )}
          {destType === 'store' && (
            <select value={destValue} onChange={(e) => setDestValue(e.target.value)} className={`mt-2 ${inp}`}>
              <option value="">— اختر المتجر —</option>
              {stores.map((s) => <option key={s.id} value={s.name}>{s.name}</option>)}
            </select>
          )}
          {destType === 'product' && (
            <select value={destValue} onChange={(e) => setDestValue(e.target.value)} className={`mt-2 ${inp}`}>
              <option value="">— اختر المنتج —</option>
              {products.map((p) => <option key={p.id} value={p.id}>{p.name}{p.price ? ` — ${p.price} د.ع` : ''}</option>)}
            </select>
          )}
          {url && (
            <p className="mt-1.5 flex items-center gap-1 text-[11px] text-ink/45 dark:text-cream/45">
              <Link2 className="h-3 w-3" /> الوجهة: <span dir="ltr" className="font-mono">{url}</span>
            </p>
          )}
        </div>

        {/* live preview */}
        {(title || body) && (
          <div className="rounded-xl border border-ink/10 bg-white p-3 shadow-sm dark:border-white/10 dark:bg-night-900">
            <div className="flex items-start gap-2.5">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-700 text-cream">🛒</div>
              <div className="min-w-0">
                <div className="truncate font-display text-sm font-black text-ink dark:text-cream">{title || 'اطلبها'}</div>
                <div className="line-clamp-2 text-xs text-ink/60 dark:text-cream/60">{body || 'نصّ الإشعار يظهر هنا'}</div>
                <div className="mt-0.5 text-[10px] text-ink/35 dark:text-cream/35">اطلبها · الآن</div>
              </div>
            </div>
          </div>
        )}

        {msg && (
          <div className={`rounded-xl px-3 py-2 text-sm font-bold ${msg.type === 'ok' ? 'bg-green-500/10 text-green-700 dark:text-green-300' : 'bg-red-500/10 text-red-600 dark:text-red-300'}`}>{msg.text}</div>
        )}

        <button onClick={send} disabled={busy}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-copper py-3 font-display font-bold text-cream shadow-soft transition hover:bg-copper-dark active:scale-[.99] disabled:opacity-60">
          {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <BellRing className="h-5 w-5" />}
          إرسال لكل الزبائن
        </button>
      </div>

      {/* history */}
      <div>
        <h3 className="mb-2 font-display text-sm font-black text-ink dark:text-cream">سجلّ الحملات</h3>
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-8 text-ink/40 dark:text-cream/40"><Loader2 className="h-4 w-4 animate-spin" /> جارٍ التحميل…</div>
        ) : campaigns.length === 0 ? (
          <div className="rounded-xl bg-ink/[0.02] py-8 text-center text-sm text-ink/40 dark:bg-white/[0.02] dark:text-cream/40">لا توجد حملات بعد.</div>
        ) : (
          <div className="space-y-2">
            {campaigns.map((c) => (
              <div key={c.id} className="rounded-xl border border-ink/8 bg-cream p-3 dark:border-white/8 dark:bg-night-800">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate font-display text-sm font-black text-ink dark:text-cream">{c.title}</div>
                    <div className="line-clamp-2 text-xs text-ink/55 dark:text-cream/55">{c.body}</div>
                  </div>
                  <span className="shrink-0 rounded-lg bg-green-500/10 px-2 py-1 text-[11px] font-bold text-green-700 dark:text-green-300">{c.sent_count} 📨</span>
                </div>
                <div className="mt-1 flex items-center gap-2 text-[10px] text-ink/35 dark:text-cream/35">
                  <span>{new Date(c.created_at).toLocaleString('en-GB')}</span>
                  {c.url && <span className="truncate" dir="ltr">· {c.url}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CouponForm({ admin, coupon, onDone, onCancel }) {
  const [f, setF] = useState({
    code: coupon?.code || '',
    kind: coupon?.kind || 'percent',
    value: coupon?.value ?? 10,
    minOrder: coupon?.min_order ?? 0,
    maxDiscount: coupon?.max_discount ?? 0,
    usageLimit: coupon?.usage_limit ?? 0,
    perUserLimit: coupon?.per_user_limit ?? 1,
    expiresAt: coupon?.expires_at ? String(coupon.expires_at).slice(0, 10) : '',
    active: coupon?.active ?? true,
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const set = (k) => (e) => { setF((p) => ({ ...p, [k]: e.target.value })); setErr(''); };

  async function save() {
    if (!f.code.trim()) { setErr('اكتب كود الكوبون'); return; }
    setBusy(true); setErr('');
    const r = await adminUpsertCoupon(admin.id, {
      id: coupon?.id || null,
      code: f.code.trim().toUpperCase(),
      kind: f.kind,
      value: Math.max(0, parseInt(f.value, 10) || 0),
      minOrder: Math.max(0, parseInt(f.minOrder, 10) || 0),
      maxDiscount: Math.max(0, parseInt(f.maxDiscount, 10) || 0),
      usageLimit: Math.max(0, parseInt(f.usageLimit, 10) || 0),
      perUserLimit: Math.max(0, parseInt(f.perUserLimit, 10) || 0),
      expiresAt: f.expiresAt ? f.expiresAt : null,
      active: !!f.active,
    });
    setBusy(false);
    if (r?.ok) onDone(); else setErr(couponError(r?.error));
  }

  const inp = 'w-full rounded-xl border border-ink/10 bg-beige px-3 py-2.5 text-sm font-bold text-ink outline-none focus:border-copper dark:border-white/10 dark:bg-night-900 dark:text-cream';
  const lbl = 'mb-1 block text-[12px] font-bold text-ink/60 dark:text-cream/60';

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center gap-2">
        <button onClick={onCancel} className="grid h-8 w-8 place-items-center rounded-lg bg-ink/5 text-ink/60 hover:bg-ink/10 dark:bg-white/10 dark:text-cream/60"><X className="h-4 w-4" /></button>
        <h3 className="font-display text-base font-black text-ink dark:text-cream">{coupon ? 'تعديل كوبون' : 'كوبون جديد'}</h3>
      </div>

      <div>
        <label className={lbl}>الكود</label>
        <input value={f.code} onChange={set('code')} dir="ltr" placeholder="مثلاً WELCOME10"
          className={inp + ' text-center uppercase tracking-widest'} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={lbl}>نوع الخصم</label>
          <select value={f.kind} onChange={set('kind')} className={inp}>
            <option value="percent">نسبة %</option>
            <option value="fixed">مبلغ ثابت</option>
          </select>
        </div>
        <div>
          <label className={lbl}>{f.kind === 'percent' ? 'النسبة (%)' : 'المبلغ (د.ع)'}</label>
          <input type="number" dir="ltr" inputMode="numeric" value={f.value} onChange={set('value')} className={inp} />
        </div>
        <div>
          <label className={lbl}>أقل طلب (د.ع)</label>
          <input type="number" dir="ltr" inputMode="numeric" value={f.minOrder} onChange={set('minOrder')} className={inp} />
        </div>
        {f.kind === 'percent' && (
          <div>
            <label className={lbl}>سقف الخصم (د.ع)</label>
            <input type="number" dir="ltr" inputMode="numeric" value={f.maxDiscount} onChange={set('maxDiscount')} className={inp} />
            <p className="mt-1 text-[10px] text-ink/40 dark:text-cream/40">0 = بلا سقف</p>
          </div>
        )}
        <div>
          <label className={lbl}>حدّ الاستخدام الكلي</label>
          <input type="number" dir="ltr" inputMode="numeric" value={f.usageLimit} onChange={set('usageLimit')} className={inp} />
          <p className="mt-1 text-[10px] text-ink/40 dark:text-cream/40">0 = بلا حدّ</p>
        </div>
        <div>
          <label className={lbl}>لكل زبون</label>
          <input type="number" dir="ltr" inputMode="numeric" value={f.perUserLimit} onChange={set('perUserLimit')} className={inp} />
          <p className="mt-1 text-[10px] text-ink/40 dark:text-cream/40">0 = بلا حدّ</p>
        </div>
        <div>
          <label className={lbl}>تاريخ الانتهاء (اختياري)</label>
          <input type="date" dir="ltr" value={f.expiresAt} onChange={set('expiresAt')} className={inp} />
        </div>
      </div>

      <label className="flex items-center justify-between rounded-xl bg-ink/5 px-3 py-2.5 dark:bg-white/5">
        <span className="text-sm font-bold text-ink/70 dark:text-cream/70">مُفعّل</span>
        <input type="checkbox" checked={f.active} onChange={(e) => setF((p) => ({ ...p, active: e.target.checked }))} className="h-5 w-5 accent-copper" />
      </label>

      {err && <p className="flex items-center gap-1 text-sm font-bold text-red-500"><X className="h-4 w-4" /> {err}</p>}

      <button onClick={save} disabled={busy}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-copper py-3 font-display font-bold text-cream shadow-soft transition hover:bg-copper-dark disabled:opacity-60">
        {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />} {coupon ? 'حفظ التعديلات' : 'إنشاء الكوبون'}
      </button>
    </div>
  );
}

function CouponsManager({ admin }) {
  const [list, setList] = useState(null);
  const [editing, setEditing] = useState(null); // null | 'new' | couponObject
  const [busyId, setBusyId] = useState(null);

  const load = () => adminListCoupons(admin.id).then((r) => setList(r?.ok ? (r.coupons || []) : []));
  useEffect(() => { load(); }, []);

  async function toggle(c) { setBusyId(c.id); await adminSetCouponActive(admin.id, c.id, !c.active); await load(); setBusyId(null); }
  async function remove(c) {
    if (!window.confirm(`حذف الكوبون ${c.code}؟`)) return;
    setBusyId(c.id); await adminDeleteCoupon(admin.id, c.id); await load(); setBusyId(null);
  }

  if (list === null) return <div className="flex items-center justify-center gap-2 py-12 text-ink/50 dark:text-cream/50"><Loader2 className="h-5 w-5 animate-spin" /> جارٍ التحميل…</div>;
  if (editing) return <CouponForm admin={admin} coupon={editing === 'new' ? null : editing} onDone={() => { setEditing(null); load(); }} onCancel={() => setEditing(null)} />;

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-display text-base font-black text-ink dark:text-cream">الكوبونات {list.length > 0 && <span className="text-ink/40 dark:text-cream/40">({list.length})</span>}</h3>
        <button onClick={() => setEditing('new')} className="flex items-center gap-1.5 rounded-xl bg-copper px-3.5 py-2 font-display text-sm font-bold text-cream shadow-soft transition hover:bg-copper-dark">
          <Plus className="h-4 w-4" /> كوبون جديد
        </button>
      </div>

      {list.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ink/15 py-12 text-center dark:border-white/15">
          <Tag className="mx-auto h-8 w-8 text-ink/25 dark:text-cream/25" />
          <p className="mt-2 font-display font-bold text-ink/60 dark:text-cream/60">ماكو كوبونات بعد</p>
          <p className="mt-1 text-sm text-ink/40 dark:text-cream/40">أنشئ كوبون أول حتى يستخدمه زبائنك عند الدفع</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {list.map((c) => {
            const expired = c.expires_at && new Date(c.expires_at) < new Date();
            return (
              <div key={c.id} className={`rounded-2xl bg-cream p-3.5 ring-1 shadow-soft dark:bg-night-800 ${c.active && !expired ? 'ring-brand-900/5 dark:ring-white/10' : 'ring-ink/10 opacity-70 dark:ring-white/10'}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-display text-lg font-black tracking-wider text-copper-dark dark:text-copper-light" dir="ltr">{c.code}</span>
                      <span className="rounded-full bg-brand-800/10 px-2 py-0.5 text-[11px] font-bold text-brand-800 dark:bg-brand-600/20 dark:text-brand-300">
                        {c.kind === 'percent' ? `${c.value}%` : `${fmt(c.value)} د.ع`}
                      </span>
                      {(!c.active || expired) && <span className="rounded-full bg-ink/10 px-2 py-0.5 text-[10px] font-bold text-ink/50 dark:bg-white/10 dark:text-cream/50">{expired ? 'منتهٍ' : 'متوقّف'}</span>}
                    </div>
                    <p className="mt-1 text-[11px] leading-relaxed text-ink/50 dark:text-cream/50">
                      {c.min_order > 0 && <>أقل طلب {fmt(c.min_order)} د.ع · </>}
                      {c.kind === 'percent' && c.max_discount > 0 && <>سقف {fmt(c.max_discount)} د.ع · </>}
                      استُخدم {c.used_count}{c.usage_limit > 0 ? `/${c.usage_limit}` : ''} مرّة
                      {c.per_user_limit > 0 && <> · {c.per_user_limit} لكل زبون</>}
                      {c.expires_at && <> · ينتهي {String(c.expires_at).slice(0, 10)}</>}
                    </p>
                  </div>
                </div>
                <div className="mt-2.5 flex items-center gap-2 border-t border-ink/5 pt-2.5 dark:border-white/5">
                  <button onClick={() => toggle(c)} disabled={busyId === c.id}
                    className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[12px] font-bold transition disabled:opacity-50 ${c.active ? 'bg-green-500/15 text-green-700 dark:text-green-300' : 'bg-ink/5 text-ink/50 dark:bg-white/10 dark:text-cream/50'}`}>
                    {busyId === c.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : c.active ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                    {c.active ? 'مُفعّل' : 'متوقّف'}
                  </button>
                  <button onClick={() => setEditing(c)} className="flex items-center gap-1 rounded-lg bg-ink/5 px-2.5 py-1.5 text-[12px] font-bold text-ink/60 hover:bg-ink/10 dark:bg-white/10 dark:text-cream/60">
                    <Pencil className="h-3.5 w-3.5" /> تعديل
                  </button>
                  <button onClick={() => remove(c)} disabled={busyId === c.id} className="ml-auto flex items-center gap-1 rounded-lg bg-red-500/10 px-2.5 py-1.5 text-[12px] font-bold text-red-600 hover:bg-red-500/20 disabled:opacity-50 dark:text-red-300">
                    <Trash2 className="h-3.5 w-3.5" /> حذف
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════ واجهة Blinkit (المجموعات/التبويبات/البانرات/الربط/الإعدادات) ═══════════════════ */
function StorefrontSection({ admin }) {
  const [t, setT] = useState('groups');
  const [home, setHome] = useState({ tabs: [], groups: [], banners: [] });
  const [cats, setCats] = useState([]);
  const [cfg, setCfg] = useState(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const [h, c, s] = await Promise.all([adminListHome(admin.id), adminListCategories(admin.id), getSettings()]);
    if (h?.ok) setHome({ tabs: h.tabs || [], groups: h.groups || [], banners: h.banners || [] });
    if (Array.isArray(c?.categories)) setCats(c.categories);
    if (s) setCfg(s);
    setLoading(false);
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  if (loading) return <div className="flex items-center justify-center gap-2 py-10 text-ink/50 dark:text-cream/50"><Loader2 className="h-5 w-5 animate-spin" /> جارٍ التحميل…</div>;

  return (
    <div>
      <SubTabs value={t} onChange={setT} tabs={[['groups', 'المجموعات', Layers], ['tabs', 'التبويبات', Boxes], ['banners', 'البانرات', ImageIcon], ['link', 'ربط الأقسام', Tag], ['settings', 'إعدادات الواجهة', SlidersHorizontal]]} />
      <div className="px-4 pb-4 pt-1">
        <p className="mb-3 rounded-lg bg-copper/10 px-3 py-2 text-[12px] font-bold text-copper-dark dark:text-copper-light">✨ عايِن تغييراتك على <span dir="ltr">/blinkit?real=1</span></p>
        {t === 'groups'   && <SfGroups   admin={admin} home={home} reload={load} />}
        {t === 'tabs'     && <SfTabs     admin={admin} home={home} reload={load} />}
        {t === 'banners'  && <SfBanners  admin={admin} home={home} reload={load} />}
        {t === 'link'     && <SfCatLink  admin={admin} cats={cats} home={home} reload={load} />}
        {t === 'settings' && <SfSettings admin={admin} cfg={cfg} reload={load} />}
      </div>
    </div>
  );
}

function SfRowShell({ children, onDelete, active, onToggle }) {
  return (
    <div className={`flex items-center gap-2 rounded-xl border border-ink/10 bg-beige p-2.5 dark:border-white/10 dark:bg-night-900 ${active ? '' : 'opacity-55'}`}>
      {children}
      {onToggle && <button onClick={onToggle} className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-ink/5 text-ink/60 dark:bg-white/10 dark:text-cream/70" title={active ? 'إخفاء' : 'إظهار'}>{active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}</button>}
      {onDelete && <button onClick={onDelete} className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-red-500/10 text-red-600 dark:text-red-300" title="حذف"><Trash2 className="h-4 w-4" /></button>}
    </div>
  );
}

// رفع ملف (صورة/فيديو) → يعيد الرابط
function SfUpload({ label, uploader, accept = 'image/*', onUrl, id = 'sf' }) {
  const [busy, setBusy] = useState(false);
  return (
    <label className={`flex cursor-pointer items-center gap-1.5 rounded-lg bg-copper/15 px-3 py-2 text-[12px] font-bold text-copper-dark dark:text-copper-light ${busy ? 'opacity-50' : ''}`}>
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />} {label}
      <input type="file" accept={accept} className="hidden" disabled={busy} onChange={async (e) => {
        const file = e.target.files?.[0]; if (!file) return; setBusy(true);
        const r = await uploader(file, id); setBusy(false); e.target.value = '';
        if (r?.url) onUrl(r.url); else alert(r?.error || 'تعذّر الرفع');
      }} />
    </label>
  );
}

/* ── المجموعات ── */
function SfGroups({ admin, home, reload }) {
  const [title, setTitle] = useState('');
  const [tab, setTab] = useState('all');
  const [busy, setBusy] = useState(false);
  const tabs = home.tabs.length ? home.tabs : [{ key: 'all', label: 'الكل' }];
  const add = async () => { if (!title.trim()) return; setBusy(true); await adminSaveHomeGroup(admin.id, { title: title.trim(), tab, sort: home.groups.length }); setTitle(''); setBusy(false); reload(); };
  return (
    <div className="space-y-2">
      <span className="text-[12px] text-ink/50 dark:text-cream/50">{home.groups.length} مجموعة — تظهر كعناوين أقسام في الواجهة</span>
      {home.groups.map((g) => (
        <SfRowShell key={g.id} active={g.active}
          onToggle={async () => { await adminSaveHomeGroup(admin.id, { id: g.id, title: g.title, tab: g.tab, sort: g.sort, active: !g.active }); reload(); }}
          onDelete={async () => { await adminDeleteHomeGroup(admin.id, g.id); reload(); }}>
          <span className="flex-1 truncate font-display text-sm font-bold text-ink dark:text-cream">{g.title}</span>
          <span className="rounded-full bg-ink/5 px-2 py-0.5 text-[11px] text-ink/50 dark:bg-white/10 dark:text-cream/50">{tabs.find((x) => x.key === g.tab)?.label || g.tab}</span>
        </SfRowShell>
      ))}
      <div className="rounded-xl border border-ink/10 bg-cream p-3 dark:border-white/10 dark:bg-night-800">
        <div className="mb-2 flex items-center gap-2 text-sm font-bold"><Plus className="h-4 w-4 text-copper" /> إضافة مجموعة</div>
        <div className="flex flex-wrap gap-2">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="عنوان (مثلاً: البقالة والمطبخ)" className={inp + ' flex-1'} />
          <select value={tab} onChange={(e) => setTab(e.target.value)} className={inp + ' w-32'}>{tabs.map((x) => <option key={x.key} value={x.key}>{x.label}</option>)}</select>
          <button onClick={add} disabled={busy} className="shrink-0 rounded-xl bg-copper px-4 py-2.5 text-sm font-bold text-ink hover:bg-copper-dark dark:text-cream">إضافة</button>
        </div>
      </div>
    </div>
  );
}

/* ── التبويبات ── */
function SfTabs({ admin, home, reload }) {
  const [f, setF] = useState({ key: '', label: '', icon: '🛒', icon_image: '', theme: '#F8CB46' });
  const add = async () => { if (!f.key.trim() || !f.label.trim()) return; await adminSaveHomeTab(admin.id, { ...f, sort: home.tabs.length }); setF({ key: '', label: '', icon: '🛒', icon_image: '', theme: '#F8CB46' }); reload(); };
  const save = async (tb, patch) => { await adminSaveHomeTab(admin.id, { id: tb.id, key: tb.key, label: tb.label, icon: tb.icon, icon_image: tb.icon_image, theme: tb.theme, sort: tb.sort, active: tb.active, ...patch }); reload(); };
  return (
    <div className="space-y-2">
      <span className="text-[12px] text-ink/50 dark:text-cream/50">{home.tabs.length} تبويب — أيقونة إيموجي أو صورة، ولون يلوّن الهيدر</span>
      {home.tabs.map((tb) => (
        <SfRowShell key={tb.id} active={tb.active}
          onToggle={() => save(tb, { active: !tb.active })}
          onDelete={async () => { await adminDeleteHomeTab(admin.id, tb.id); reload(); }}>
          <span className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-lg text-xl" style={{ background: tb.theme }}>
            {tb.icon_image ? <img src={tb.icon_image} alt="" className="h-full w-full object-contain p-0.5" /> : tb.icon}
          </span>
          <span className="flex-1 truncate font-display text-sm font-bold text-ink dark:text-cream">{tb.label}</span>
          <SfUpload label="صورة" uploader={uploadProductImage} id={'tab-' + tb.key} onUrl={(u) => save(tb, { icon_image: u })} />
          {tb.icon_image && <button onClick={() => save(tb, { icon_image: '' })} className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-ink/5 text-ink/50 dark:bg-white/10" title="إزالة الصورة"><X className="h-4 w-4" /></button>}
        </SfRowShell>
      ))}
      <div className="rounded-xl border border-ink/10 bg-cream p-3 dark:border-white/10 dark:bg-night-800">
        <div className="mb-2 flex items-center gap-2 text-sm font-bold"><Plus className="h-4 w-4 text-copper" /> إضافة تبويب</div>
        <div className="flex flex-wrap gap-2">
          <input value={f.icon} onChange={(e) => setF({ ...f, icon: e.target.value })} placeholder="🎧" className="w-14 shrink-0 rounded-xl border border-ink/10 bg-beige px-2 py-2.5 text-center dark:border-white/10 dark:bg-night-900" />
          <input value={f.label} onChange={(e) => setF({ ...f, label: e.target.value })} placeholder="الاسم (إلكترونيات)" className={inp + ' flex-1'} />
          <input dir="ltr" value={f.key} onChange={(e) => setF({ ...f, key: e.target.value.replace(/\s/g, '') })} placeholder="key" className={inp + ' w-24'} />
          <input type="color" value={f.theme} onChange={(e) => setF({ ...f, theme: e.target.value })} className="h-11 w-12 shrink-0 rounded-xl border border-ink/10 dark:border-white/10" />
          <button onClick={add} className="shrink-0 rounded-xl bg-copper px-4 py-2.5 text-sm font-bold text-ink hover:bg-copper-dark dark:text-cream">إضافة</button>
        </div>
        <p className="mt-1.5 text-[11px] text-ink/40 dark:text-cream/40">بعد الإضافة، اضغط «صورة» على التبويب لاستبدال الإيموجي بأيقونة صورة.</p>
      </div>
    </div>
  );
}

/* ── البانرات ── */
function SfBanners({ admin, home, reload }) {
  const [f, setF] = useState({ title: '', subtitle: '', cta_label: '', image: '', theme: '#F8CB46', tab: 'all' });
  const tabs = home.tabs.length ? home.tabs : [{ key: 'all', label: 'الكل' }];
  const add = async () => { if (!f.title.trim() && !f.image.trim()) return; await adminSaveHomeBanner(admin.id, { ...f, sort: home.banners.length }); setF({ title: '', subtitle: '', cta_label: '', image: '', theme: '#F8CB46', tab: 'all' }); reload(); };
  return (
    <div className="space-y-2">
      <span className="text-[12px] text-ink/50 dark:text-cream/50">{home.banners.length} بانر — تظهر أعلى الواجهة حسب التبويب</span>
      {home.banners.map((b) => (
        <SfRowShell key={b.id} active={b.active}
          onToggle={async () => { await adminSaveHomeBanner(admin.id, { ...b, active: !b.active }); reload(); }}
          onDelete={async () => { await adminDeleteHomeBanner(admin.id, b.id); reload(); }}>
          <span className="h-10 w-16 shrink-0 overflow-hidden rounded-lg" style={{ background: b.theme }}>{b.image ? <img src={b.image} alt="" className="h-full w-full object-cover" /> : null}</span>
          <span className="flex-1 truncate font-display text-sm font-bold text-ink dark:text-cream">{b.title || '(بدون عنوان)'}</span>
          <span className="rounded-full bg-ink/5 px-2 py-0.5 text-[11px] text-ink/50 dark:bg-white/10 dark:text-cream/50">{tabs.find((x) => x.key === b.tab)?.label || b.tab}</span>
        </SfRowShell>
      ))}
      <div className="space-y-2 rounded-xl border border-ink/10 bg-cream p-3 dark:border-white/10 dark:bg-night-800">
        <div className="flex items-center gap-2 text-sm font-bold"><Plus className="h-4 w-4 text-copper" /> إضافة بانر</div>
        <input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="العنوان" className={inp} />
        <input value={f.subtitle} onChange={(e) => setF({ ...f, subtitle: e.target.value })} placeholder="الوصف" className={inp} />
        <div className="flex flex-wrap gap-2">
          <input value={f.cta_label} onChange={(e) => setF({ ...f, cta_label: e.target.value })} placeholder="زر (تسوّق الآن)" className={inp + ' flex-1'} />
          <select value={f.tab} onChange={(e) => setF({ ...f, tab: e.target.value })} className={inp + ' w-28'}>{tabs.map((x) => <option key={x.key} value={x.key}>{x.label}</option>)}</select>
          <input type="color" value={f.theme} onChange={(e) => setF({ ...f, theme: e.target.value })} className="h-11 w-12 shrink-0 rounded-xl border border-ink/10 dark:border-white/10" />
        </div>
        <input dir="ltr" value={f.image} onChange={(e) => setF({ ...f, image: e.target.value })} placeholder="رابط صورة (اختياري)" className={inp} />
        <button onClick={add} className="w-full rounded-xl bg-copper px-4 py-2.5 text-sm font-bold text-ink hover:bg-copper-dark dark:text-cream">إضافة البانر</button>
      </div>
    </div>
  );
}

/* ── ربط الأقسام بمجموعة/تبويب ── */
function SfCatLink({ admin, cats, home, reload }) {
  const tabs = home.tabs.length ? home.tabs : [{ key: 'all', label: 'الكل' }];
  const set = async (c, patch) => { await adminSetCategoryHome(admin.id, c.id, patch); reload(); };
  return (
    <div className="space-y-2">
      <span className="text-[12px] text-ink/50 dark:text-cream/50">اربط كل قسم بمجموعة وتبويب ليظهر في مكانه الصحيح بنمط Blinkit</span>
      {cats.length === 0 && <p className="py-6 text-center text-sm text-ink/40 dark:text-cream/40">لا توجد أقسام بعد — أضِفها من «الكتالوج ← الأقسام».</p>}
      {cats.map((c) => (
        <div key={c.id} className="flex flex-wrap items-center gap-2 rounded-xl border border-ink/10 bg-beige p-2.5 dark:border-white/10 dark:bg-night-900">
          <span className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-lg bg-white text-lg ring-1 ring-ink/5 dark:ring-white/10">{c.image ? <img src={c.image} alt="" className="h-full w-full object-contain p-0.5 mix-blend-multiply" /> : (c.emoji || '🏷️')}</span>
          <span className="min-w-[80px] flex-1 truncate font-display text-sm font-bold text-ink dark:text-cream">{c.name}</span>
          <select value={c.home_group || ''} onChange={(e) => set(c, { group: e.target.value || null, tab: c.home_tab || 'all' })} className={inp + ' w-32 shrink-0'}>
            <option value="">— مجموعة —</option>
            {home.groups.map((g) => <option key={g.id} value={g.id}>{g.title}</option>)}
          </select>
          <select value={c.home_tab || 'all'} onChange={(e) => set(c, { group: c.home_group || null, tab: e.target.value })} className={inp + ' w-28 shrink-0'}>
            {tabs.map((x) => <option key={x.key} value={x.key}>{x.label}</option>)}
          </select>
        </div>
      ))}
    </div>
  );
}

/* ── إعدادات الواجهة ── */
function SfSettings({ admin, cfg, reload }) {
  const [f, setF] = useState({
    delivery_minutes: cfg?.sf_delivery_minutes ?? 10,
    show_stores: cfg?.sf_show_stores ?? true,
    show_bundles: cfg?.sf_show_bundles ?? true,
    welcome_title: cfg?.sf_welcome_title ?? '',
    welcome_subtitle: cfg?.sf_welcome_subtitle ?? '',
    header_image: cfg?.sf_header_image ?? '',
    header_video: cfg?.sf_header_video ?? '',
    header_overlay: cfg?.sf_header_overlay ?? 0.18,
  });
  const [msg, setMsg] = useState('');
  const save = async () => { setMsg(''); const r = await adminSetStorefront(admin.id, f); setMsg(r?.ok ? 'تم الحفظ ✓' : 'تعذّر الحفظ'); reload(); };
  return (
    <div className="space-y-3">
      {/* خلفية الهيدر (صورة/فيديو) */}
      <div className="space-y-2 rounded-xl border border-copper/30 bg-copper/5 p-3">
        <div className="flex items-center gap-2 text-sm font-bold text-ink dark:text-cream"><ImageIcon className="h-4 w-4 text-copper" /> خلفية الهيدر (صورة أو فيديو)</div>
        <p className="text-[11px] text-ink/50 dark:text-cream/50">تظهر خلف أعلى الواجهة وبانر الترحيب، وتختفي تدريجياً عند النزول.</p>
        {f.header_video ? (
          <video src={f.header_video} className="h-24 w-full rounded-lg object-cover" autoPlay loop muted playsInline />
        ) : f.header_image ? (
          <img src={f.header_image} alt="" className="h-24 w-full rounded-lg object-cover" />
        ) : (
          <div className="grid h-16 place-items-center rounded-lg bg-ink/5 text-[12px] text-ink/40 dark:bg-white/5 dark:text-cream/40">لا توجد خلفية بعد</div>
        )}
        <div className="flex flex-wrap gap-2">
          <SfUpload label="رفع صورة" uploader={uploadStoreCover} id="header" onUrl={(u) => setF({ ...f, header_image: u, header_video: '' })} />
          <SfUpload label="رفع فيديو" accept="video/*" uploader={uploadStoreVideo} id="header" onUrl={(u) => setF({ ...f, header_video: u, header_image: '' })} />
          {(f.header_image || f.header_video) && <button onClick={() => setF({ ...f, header_image: '', header_video: '' })} className="rounded-lg bg-red-500/10 px-3 py-2 text-[12px] font-bold text-red-600 dark:text-red-300">مسح</button>}
        </div>
        <div className="flex items-center gap-2">
          <span className="shrink-0 text-[12px] font-bold text-ink/60 dark:text-cream/60">تعتيم النص</span>
          <input type="range" min="0" max="0.6" step="0.02" value={f.header_overlay} onChange={(e) => setF({ ...f, header_overlay: Number(e.target.value) })} className="flex-1 accent-copper" />
          <span className="w-8 text-left text-[11px] text-ink/40 dark:text-cream/40">{Math.round(f.header_overlay * 100)}%</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <label className="text-sm font-bold text-ink dark:text-cream">وقت التوصيل (دقائق)</label>
        <input type="number" value={f.delivery_minutes} onChange={(e) => setF({ ...f, delivery_minutes: Number(e.target.value) })} className={inp + ' w-24'} />
      </div>
      <input value={f.welcome_title} onChange={(e) => setF({ ...f, welcome_title: e.target.value })} placeholder="عنوان الترحيب" className={inp} />
      <input value={f.welcome_subtitle} onChange={(e) => setF({ ...f, welcome_subtitle: e.target.value })} placeholder="وصف الترحيب" className={inp} />
      <label className="flex items-center justify-between rounded-xl border border-ink/10 bg-beige px-3 py-2.5 dark:border-white/10 dark:bg-night-900">
        <span className="text-sm font-bold text-ink dark:text-cream">عرض قسم المتاجر</span>
        <input type="checkbox" checked={!!f.show_stores} onChange={(e) => setF({ ...f, show_stores: e.target.checked })} className="h-5 w-5 accent-copper" />
      </label>
      <label className="flex items-center justify-between rounded-xl border border-ink/10 bg-beige px-3 py-2.5 dark:border-white/10 dark:bg-night-900">
        <span className="text-sm font-bold text-ink dark:text-cream">عرض قسم الباقات</span>
        <input type="checkbox" checked={!!f.show_bundles} onChange={(e) => setF({ ...f, show_bundles: e.target.checked })} className="h-5 w-5 accent-copper" />
      </label>
      <button onClick={save} className="flex w-full items-center justify-center gap-2 rounded-xl bg-copper px-4 py-2.5 text-sm font-bold text-ink hover:bg-copper-dark dark:text-cream"><Save className="h-4 w-4" /> حفظ الإعدادات</button>
      {msg && <p className="text-center text-xs font-bold text-green-600 dark:text-green-300">{msg}</p>}
    </div>
  );
}

function SettingsManager({ admin }) {
  const [s, setS] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getSettings().then((r) => {
      const v = { ...(r || {}) };
      if (v.points_dinar_per_point == null) v.points_dinar_per_point = POINTS.redeemDinarPerPoint;
      if (v.points_redeem_max_pct == null) v.points_redeem_max_pct = POINTS.redeemMaxPct;
      if (v.points_redeem_min_order == null) v.points_redeem_min_order = POINTS.redeemMinOrder;
      if (v.rating_window_days == null) v.rating_window_days = 30;
      setS(v);
      setLoading(false);
    });
  }, []);

  const set = (k) => (e) => { setS((prev) => ({ ...prev, [k]: e.target.value })); setSaved(false); };

  async function save() {
    setSaving(true); setSaved(false);
    const payload = {};
    for (const k of ['delivery_fee', 'delivery_extra_store', 'delivery_fee_cap', 'free_delivery_over', 'driver_fee_base', 'driver_fee_per_extra_store', 'default_commission_pct']) {
      payload[k] = Math.max(0, parseFloat(s[k]) || 0);
    }
    payload.whatsapp_number = (s.whatsapp_number || '').replace(/[^\d]/g, '');
    const r = await adminUpdateSettings(admin.id, payload);
    // also persist loyalty-points redemption settings (self-contained RPC)
    await adminSetPointsSettings(admin.id, {
      dinarPerPoint: Math.max(1, parseInt(s.points_dinar_per_point, 10) || 1),
      maxPct: Math.min(100, Math.max(0, parseInt(s.points_redeem_max_pct, 10) || 0)),
      minOrder: Math.max(0, parseInt(s.points_redeem_min_order, 10) || 0),
    });
    await adminSetRatingWindow(admin.id, Math.max(1, parseInt(s.rating_window_days, 10) || 30));
    const mkVal = Math.max(0, parseFloat(s.markup_pct) || 0);
    await adminSetGlobalMarkup(admin.id, mkVal);
    const stepVal = Math.max(0, parseInt(s.price_round_step, 10) || 0);
    await adminSetPriceRounding(admin.id, stepVal);
    setSaving(false);
    if (r?.ok) { setSaved(true); applySettings({ ...r.settings, markup_pct: mkVal, price_round_step: stepVal }); setTimeout(() => setSaved(false), 2500); }
  }

  if (loading) return <div className="flex items-center justify-center gap-2 py-12 text-ink/50 dark:text-cream/50"><Loader2 className="h-5 w-5 animate-spin" /> جارٍ التحميل…</div>;

  const fieldInp = 'w-full rounded-xl border border-ink/10 bg-beige px-3 py-2.5 text-sm font-bold text-ink outline-none focus:border-copper dark:border-white/10 dark:bg-night-900 dark:text-cream';
  const Field = ({ label, k, hint, suffix = 'د.ع' }) => (
    <div>
      <label className="mb-1 block text-[12px] font-bold text-ink/60 dark:text-cream/60">{label}</label>
      <div className="relative">
        <input type="number" dir="ltr" inputMode="numeric" value={s[k] ?? ''} onChange={set(k)} className={fieldInp + ' pl-12'} />
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-ink/40 dark:text-cream/40">{suffix}</span>
      </div>
      {hint && <p className="mt-1 text-[10px] leading-snug text-ink/40 dark:text-cream/40">{hint}</p>}
    </div>
  );

  return (
    <div className="space-y-5 p-4">
      {/* delivery */}
      <div>
        <div className="mb-2 flex items-center gap-2"><Truck className="h-4 w-4 text-copper" /><h3 className="font-display text-sm font-black text-ink dark:text-cream">رسوم التوصيل (يدفعها الزبون)</h3></div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="الأجور الأساسية" k="delivery_fee" hint="لطلب من متجر واحد" />
          <Field label="زيادة لكل متجر إضافي" k="delivery_extra_store" hint="يُضاف لكل متجر بعد الأول" />
          <Field label="الحد الأقصى للتوصيل" k="delivery_fee_cap" hint="مهما تعدّدت المتاجر" />
          <Field label="توصيل مجاني فوق" k="free_delivery_over" hint="0 = تعطيل المجاني" />
        </div>
      </div>

      {/* driver */}
      <div>
        <div className="mb-2 flex items-center gap-2"><Bike className="h-4 w-4 text-copper" /><h3 className="font-display text-sm font-black text-ink dark:text-cream">أجور المندوب (يستحقّها المندوب)</h3></div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="أجرة التوصيلة" k="driver_fee_base" hint="لكل توصيلة (متجر واحد)" />
          <Field label="زيادة لكل متجر إضافي" k="driver_fee_per_extra_store" hint="يُضاف لأجرة المندوب" />
        </div>
      </div>

      {/* commission */}
      <div>
        <div className="mb-2 flex items-center gap-2"><Wallet className="h-4 w-4 text-copper" /><h3 className="font-display text-sm font-black text-ink dark:text-cream">العمولة</h3></div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="العمولة الافتراضية" k="default_commission_pct" hint="للمتاجر الجديدة (تقدر تغيّرها لكل متجر)" suffix="%" />
        </div>
      </div>

      {/* platform markup (owner's margin) */}
      <div>
        <div className="mb-2 flex items-center gap-2"><TrendingUp className="h-4 w-4 text-copper" /><h3 className="font-display text-sm font-black text-ink dark:text-cream">هامش المنصّة (ربحك)</h3></div>
        <p className="mb-2 text-[11px] leading-snug text-ink/45 dark:text-cream/45">نسبة تُضاف فوق سعر التاجر يدفعها الزبون — ربح <b>إلك إنت</b>، منفصلة عن العمولة. يقدر التاجر يضل يقبض على سعره الأساسي. تقدر تخصّصها لكل متجر/فئة/منتج/باقة (تطغى على العام).</p>
        <div className="grid grid-cols-2 gap-3">
          <Field label="الهامش العام" k="markup_pct" hint="على كل السلع افتراضياً · 0 = معطّل" suffix="%" />
        </div>
        <div className="mt-3">
          <label className="mb-1 block text-[12px] font-bold text-ink/60 dark:text-cream/60">تقريب السعر لأقرب فئة نقدية</label>
          <div className="grid grid-cols-4 gap-2">
            {[['بدون', 0], ['٢٥٠', 250], ['٥٠٠', 500], ['١٬٠٠٠', 1000]].map(([lbl, val]) => {
              const active = (parseInt(s.price_round_step, 10) || 0) === val;
              return (
                <button key={val} type="button" onClick={() => { setS((prev) => ({ ...prev, price_round_step: val })); setSaved(false); }}
                  className={`rounded-xl py-2.5 text-sm font-bold transition ${active ? 'bg-copper text-cream shadow-soft' : 'bg-beige text-ink/60 hover:bg-ink/10 dark:bg-night-900 dark:text-cream/60'}`}>
                  {lbl}
                </button>
              );
            })}
          </div>
          <p className="mt-1 text-[10px] leading-snug text-ink/40 dark:text-cream/40">السعر بعد الهامش يصير رقماً مريحاً بالنقود (مثلاً ٦٬٠٥٠ ← ٦٬٠٠٠). سعر التاجر ما يتأثّر.</p>
        </div>
      </div>

      {/* loyalty points redemption */}
      <div>
        <div className="mb-2 flex items-center gap-2"><Sparkles className="h-4 w-4 text-copper" /><h3 className="font-display text-sm font-black text-ink dark:text-cream">استبدال نقاط الولاء</h3></div>
        <p className="mb-2 text-[11px] leading-snug text-ink/45 dark:text-cream/45">الزبون يكسب نقطة لكل {POINTS.dinarsPerEarnedPoint} د.ع تلقائياً، و يستبدلها خصماً عند الدفع حسب هذه القيم.</p>
        <div className="grid grid-cols-2 gap-3">
          <Field label="قيمة النقطة" k="points_dinar_per_point" hint="كم دينار خصم لكل نقطة" suffix="د.ع" />
          <Field label="أقصى خصم من الطلب" k="points_redeem_max_pct" hint="أعلى نسبة من الطلب تُدفع بالنقاط" suffix="%" />
          <Field label="أقل طلب للاستبدال" k="points_redeem_min_order" hint="لا استبدال تحت هذا المبلغ" suffix="د.ع" />
        </div>
      </div>

      {/* verified ratings */}
      <div>
        <div className="mb-2 flex items-center gap-2"><Star className="h-4 w-4 text-copper" /><h3 className="font-display text-sm font-black text-ink dark:text-cream">التقييمات الموثّقة</h3></div>
        <p className="mb-2 text-[11px] leading-snug text-ink/45 dark:text-cream/45">التقييم متاح فقط للزبون الذي طلب فعلاً، بعد التوصيل، خلال هذه المدة من تاريخ الطلب. (المتاجر الكبرى تعطي مدة واسعة — لا يُنصح بدقائق معدودة لأنها تقتل عدد التقييمات.)</p>
        <div className="grid grid-cols-2 gap-3">
          <Field label="نافذة التقييم" k="rating_window_days" hint="كم يوم يبقى التقييم مفتوحاً بعد الطلب" suffix="يوم" />
        </div>
      </div>

      {/* whatsapp */}
      <div>
        <div className="mb-2 flex items-center gap-2"><MessageCircle className="h-4 w-4 text-copper" /><h3 className="font-display text-sm font-black text-ink dark:text-cream">رقم واتساب الاستلام</h3></div>
        <input type="tel" dir="ltr" value={s.whatsapp_number ?? ''} onChange={set('whatsapp_number')} className={fieldInp} placeholder="9647XXXXXXXXX" />
        <p className="mt-1 text-[10px] leading-snug text-ink/40 dark:text-cream/40">رمز الدولة + الرقم بدون «+» أو صفر (العراق: 964 ثم الرقم). يستقبل الطلبات والاستفسارات.</p>
      </div>

      {/* device push notifications */}
      <div>
        <div className="mb-2 flex items-center gap-2"><BellRing className="h-4 w-4 text-copper" /><h3 className="font-display text-sm font-black text-ink dark:text-cream">إشعارات الجهاز</h3></div>
        <p className="mb-2 text-[11px] text-ink/50 dark:text-cream/50">فعّلها لتصلك تنبيهات الطلبات الجديدة على جهازك حتى لو التطبيق مسكّر.</p>
        <PushToggle partyType="admin" partyId={admin.id} />
      </div>

      <InstallButton variant="card" />

      {/* live preview */}
      <LivePreview s={s} />

      <button onClick={save} disabled={saving}
        className={`flex w-full items-center justify-center gap-2 rounded-xl py-3 font-display font-bold text-cream shadow-soft transition disabled:opacity-60 ${saved ? 'bg-green-600' : 'bg-copper hover:bg-copper-dark'}`}>
        {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : saved ? <Check className="h-5 w-5" /> : <Save className="h-5 w-5" />}
        {saved ? 'تم الحفظ ✓' : 'حفظ الإعدادات'}
      </button>
      <p className="text-center text-[11px] leading-relaxed text-ink/45 dark:text-cream/45">
        💡 تُطبَّق فوراً على كل التطبيق. أجور المندوب تُحتسب على الطلبات الجديدة المُسلّمة.
      </p>
    </div>
  );
}

// معاينة حيّة: تحسب مثالاً واقعياً من القيم الحالية أثناء التعديل
function LivePreview({ s }) {
  const n = (k) => Math.max(0, parseFloat(s[k]) || 0);
  const free = n('free_delivery_over');
  const calc = (total, stores) => {
    if (free > 0 && total >= free) return 0;
    return Math.min(n('delivery_fee') + Math.max(0, stores - 1) * n('delivery_extra_store'), n('delivery_fee_cap'));
  };
  const driverFee = (stores) => n('driver_fee_base') + Math.max(0, stores - 1) * n('driver_fee_per_extra_store');
  const examples = [
    { label: 'طلب 25,000 من متجر واحد', total: 25000, stores: 1 },
    { label: 'طلب 50,000 من متجرين', total: 50000, stores: 2 },
    { label: `طلب ${fmt(free || 100000)} (حدّ المجاني)`, total: free || 100000, stores: 1 },
  ];
  return (
    <div className="rounded-2xl bg-brand-800/5 p-3.5 ring-1 ring-brand-800/10">
      <div className="mb-2 flex items-center gap-2"><Eye className="h-4 w-4 text-brand-700 dark:text-brand-300" /><h3 className="font-display text-sm font-black text-ink dark:text-cream">معاينة حيّة (تتغيّر مع الأرقام)</h3></div>
      <div className="space-y-2">
        {examples.map((ex, i) => {
          const d = calc(ex.total, ex.stores);
          const f = driverFee(ex.stores);
          return (
            <div key={i} className="rounded-xl bg-cream p-2.5 text-xs dark:bg-night-900">
              <p className="mb-1 font-bold text-ink/70 dark:text-cream/70">{ex.label}</p>
              <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                <span className="text-ink/55 dark:text-cream/55">التوصيل: <b className={d === 0 ? 'text-green-600 dark:text-green-400' : 'text-ink dark:text-cream'}>{d === 0 ? 'مجاني' : fmt(d) + ' د.ع'}</b></span>
                <span className="text-ink/55 dark:text-cream/55">أجرة المندوب: <b className="text-copper dark:text-copper-light">{fmt(f)} د.ع</b></span>
                <span className="text-ink/55 dark:text-cream/55">يدفع الزبون: <b className="text-ink dark:text-cream">{fmt(ex.total + d)} د.ع</b></span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function EarningsManager({ admin }) {
  const [range, setRange] = useState('all');
  const [data, setData] = useState(null);
  const [markupIncome, setMarkupIncome] = useState(0);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('merchants'); // merchants | drivers

  const sinceFor = (r) => {
    const now = new Date();
    if (r === 'today') { const d = new Date(now); d.setHours(0, 0, 0, 0); return d.toISOString(); }
    if (r === 'week') return new Date(now.getTime() - 7 * 86400000).toISOString();
    if (r === 'month') return new Date(now.getTime() - 30 * 86400000).toISOString();
    return null;
  };

  async function load(r) {
    setLoading(true);
    const [res, mk] = await Promise.all([
      adminFinanceReport(admin.id, sinceFor(r)),
      adminMarkupIncome(admin.id, sinceFor(r)),
    ]);
    setData(res?.ok ? res : { ok: false, merchants: [], drivers: [], total_commission: 0, total_delivery: 0, total_driver_fees: 0, net: 0 });
    setMarkupIncome(mk?.ok ? (mk.markup_income || 0) : 0);
    setLoading(false);
  }
  useEffect(() => { load(range); /* eslint-disable-next-line */ }, [range]);

  async function settleMerchant(m, amount, method) {
    const r = await adminSettleMerchant(admin.id, m.id, amount, method);
    if (r?.ok) load(range);
  }
  async function settleDriver(d, amount, method) {
    const r = await adminSettleDriver(admin.id, d.id, amount, method);
    if (r?.ok) load(range);
  }

  const merchants = data?.merchants || [];
  const drivers = data?.drivers || [];

  return (
    <div className="space-y-4 p-4">
      {/* range filter */}
      <div className="flex flex-wrap gap-2">
        {[['today', 'اليوم'], ['week', 'آخر أسبوع'], ['month', 'آخر شهر'], ['all', 'الكل']].map(([k, label]) => (
          <button key={k} onClick={() => setRange(k)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-bold transition ${range === k ? 'bg-copper text-cream shadow-soft' : 'bg-ink/5 text-ink/60 hover:bg-ink/10 dark:bg-white/10 dark:text-cream/60'}`}>
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-12 text-ink/50 dark:text-cream/50"><Loader2 className="h-5 w-5 animate-spin" /> جارٍ الحساب…</div>
      ) : (
        <>
          {/* net profit hero */}
          <div className="rounded-3xl bg-gradient-to-br from-brand-800 to-brand-900 p-5 text-cream shadow-card">
            <div className="flex items-center gap-1.5 text-cream/80"><Wallet className="h-4 w-4" /> <span className="text-sm font-bold">صافي ربح اطلبها</span></div>
            <p className="mt-1 font-display text-4xl font-black">{fmt((data?.net || 0) + (markupIncome || 0))} <span className="text-lg">د.ع</span></p>
            <p className="mt-1 text-xs text-cream/70">العمولات + التوصيل + هامش المنصّة − أجور المندوبين · من {data?.orders_count || 0} طلب مُسلّم</p>
          </div>

          {/* breakdown cards */}
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-2xl bg-green-500/10 p-3 ring-1 ring-green-500/20">
              <div className="text-[11px] font-bold text-green-700/80 dark:text-green-300/80">العمولات</div>
              <div className="mt-0.5 font-display text-lg font-black text-green-700 dark:text-green-300">{fmt(data?.total_commission || 0)}</div>
            </div>
            <div className="rounded-2xl bg-copper/10 p-3 ring-1 ring-copper/20">
              <div className="text-[11px] font-bold text-copper-dark dark:text-copper-light">التوصيل</div>
              <div className="mt-0.5 font-display text-lg font-black text-copper dark:text-copper-light">{fmt(data?.total_delivery || 0)}</div>
            </div>
            <div className="rounded-2xl bg-indigo-500/10 p-3 ring-1 ring-indigo-500/20">
              <div className="flex items-center gap-1 text-[11px] font-bold text-indigo-700/80 dark:text-indigo-300/80"><TrendingUp className="h-3 w-3" /> هامش المنصّة</div>
              <div className="mt-0.5 font-display text-lg font-black text-indigo-700 dark:text-indigo-300">{fmt(markupIncome || 0)}</div>
            </div>
            <div className="rounded-2xl bg-red-500/10 p-3 ring-1 ring-red-500/20">
              <div className="text-[11px] font-bold text-red-600/80 dark:text-red-300/80">أجور المندوبين</div>
              <div className="mt-0.5 font-display text-lg font-black text-red-600 dark:text-red-300">−{fmt(data?.total_driver_fees || 0)}</div>
            </div>
          </div>

          {/* merchants / drivers toggle */}
          <div className="grid grid-cols-2 gap-1 rounded-xl bg-ink/5 p-1 dark:bg-white/5">
            {[['merchants', 'تسويات التجار'], ['drivers', 'تسويات المندوبين']].map(([k, l]) => (
              <button key={k} onClick={() => setView(k)}
                className={`rounded-lg py-2 text-sm font-bold transition ${view === k ? 'bg-copper text-cream shadow-seal' : 'text-ink/60 dark:text-cream/60'}`}>{l}</button>
            ))}
          </div>

          {view === 'merchants' ? (
            merchants.length === 0 ? (
              <Empty text="لا توجد مستحقّات للتجار في هذه الفترة." />
            ) : (
              <div className="space-y-2">
                {merchants.map((m) => (
                  <SettleRow key={m.id} title={m.name} tag={`عمولة ${m.pct}%`}
                    rows={[['قيمة البضاعة', m.goods], ['عمولتك', -m.commission], ['مستحقّ المتجر', m.due]]}
                    paid={m.paid} pending={m.pending}
                    onSettle={(amt, method) => settleMerchant(m, amt, method)}
                    settleLabel="تسوية مع التاجر" />
                ))}
              </div>
            )
          ) : (
            drivers.length === 0 ? (
              <Empty text="لا توجد مستحقّات للمندوبين في هذه الفترة." />
            ) : (
              <div className="space-y-2">
                {drivers.map((d) => (
                  <SettleRow key={d.id} title={d.name} tag={`${d.deliveries} توصيلة`}
                    rows={[['حصّل نقداً', d.collected], ['أجرته', -d.earned], ['يسلّمه للإدارة', d.owes]]}
                    paid={d.paid} pending={d.remaining}
                    onSettle={(amt, method) => settleDriver(d, amt, method)}
                    settleLabel="تأكيد استلام النقد" pendingLabel="المتبقّي عليه" />
                ))}
              </div>
            )
          )}

          <p className="px-1 text-[11px] leading-relaxed text-ink/40 dark:text-cream/40">
            💡 تُحسب من الطلبات المُسلّمة فقط. «تسوية التاجر» = دفعت له مستحقّاته. «استلام النقد» = استلمت من المندوب ما يخصّ الإدارة.
          </p>
        </>
      )}
    </div>
  );
}

function Empty({ text }) {
  return <div className="rounded-2xl border border-dashed border-ink/15 py-10 text-center text-sm text-ink/40 dark:border-white/15 dark:text-cream/40">{text}</div>;
}

// a settlement row with expandable amount/method picker
function SettleRow({ title, tag, rows, paid, pending, onSettle, settleLabel, pendingLabel = 'قيد التحصيل' }) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(String(pending || 0));
  const [method, setMethod] = useState('cash');
  return (
    <div className="rounded-2xl bg-cream p-3.5 ring-1 ring-brand-900/5 dark:bg-night-900 dark:ring-white/10">
      <div className="flex items-center justify-between">
        <span className="font-display font-bold text-ink dark:text-cream">{title}</span>
        <span className="rounded-full bg-copper/15 px-2 py-0.5 text-[11px] font-bold text-copper-dark dark:text-copper-light">{tag}</span>
      </div>
      <div className="mt-2 space-y-1 rounded-xl bg-beige/60 p-2.5 text-xs dark:bg-night-800/60">
        {rows.map(([label, val], i) => (
          <div key={i} className="flex justify-between">
            <span className="text-ink/55 dark:text-cream/55">{label}</span>
            <span className={`font-bold ${val < 0 ? 'text-red-500' : 'text-ink dark:text-cream'}`}>{val < 0 ? '− ' : ''}{fmt(Math.abs(val))} د.ع</span>
          </div>
        ))}
      </div>
      <div className="mt-2 flex items-center justify-between text-xs">
        <span className="text-green-600 dark:text-green-400">سُوّي: <b>{fmt(paid)}</b></span>
        <span className="text-copper dark:text-copper-light">{pendingLabel}: <b>{fmt(pending)}</b></span>
      </div>

      {pending > 0 && (open ? (
        <div className="mt-2.5 rounded-xl bg-ink/5 p-2.5 dark:bg-white/5">
          <div className="flex items-center gap-2">
            <input type="number" dir="ltr" value={amount} onChange={(e) => setAmount(e.target.value)}
              className="w-28 rounded-lg border border-ink/10 bg-beige px-2 py-1.5 text-sm dark:border-white/10 dark:bg-night-900 dark:text-cream" />
            <div className="flex gap-1">
              {[['cash', 'نقد'], ['rafidain', 'رافدين']].map(([k, l]) => (
                <button key={k} onClick={() => setMethod(k)}
                  className={`rounded-lg px-2.5 py-1.5 text-xs font-bold ${method === k ? 'bg-copper text-cream' : 'bg-ink/10 text-ink/60 dark:bg-white/10 dark:text-cream/60'}`}>{l}</button>
              ))}
            </div>
          </div>
          <div className="mt-2 flex gap-2">
            <button onClick={() => setOpen(false)} className="flex-1 rounded-lg bg-ink/10 py-2 text-xs font-bold text-ink/60 dark:bg-white/10 dark:text-cream/60">إلغاء</button>
            <button onClick={() => { onSettle(Math.max(0, parseInt(amount, 10) || 0), method); setOpen(false); }}
              className="flex-[2] rounded-lg bg-green-600 py-2 text-xs font-bold text-white hover:bg-green-700">تأكيد التسوية</button>
          </div>
        </div>
      ) : (
        <button onClick={() => { setAmount(String(pending)); setOpen(true); }}
          className="mt-2.5 w-full rounded-xl bg-copper py-2.5 text-sm font-bold text-cream shadow-soft hover:bg-copper-dark">{settleLabel}</button>
      ))}
    </div>
  );
}

function StoresManager({ admin }) {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', category: 'بقالة' });
  const [editStore, setEditStore] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [msg, setMsg] = useState('');
  const listRef = useRef([]);

  async function load() {
    setLoading(true);
    const c = await adminListStores(admin.id);
    const items = Array.isArray(c?.stores) ? c.stores : [];
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
  async function persistOrder() { await adminReorderStores(admin.id, listRef.current.map((x) => x.id)); }

  async function add() {
    setMsg('');
    if (!form.name.trim()) { setMsg('اكتب اسم المتجر'); return; }
    const r = await adminAddStore(admin.id, { name: form.name.trim(), category: form.category });
    if (r?.ok) { setForm({ name: '', category: 'بقالة' }); load(); }
    else setMsg(r?.error === 'exists' ? 'هذا المتجر موجود مسبقاً' : 'تعذّرت الإضافة');
  }

  async function remove(s) {
    setConfirm(null); setMsg('');
    const r = await adminRemoveStore(admin.id, s.id);
    if (r?.ok) load(); else setMsg('تعذّر الحذف');
  }

  return (
    <div className="space-y-3 px-4 pb-4">
      <span className="text-[12px] text-ink/50 dark:text-cream/50">{list.length} متجر · اسحب للترتيب · اضغط ✎ للشعار والتفاصيل</span>
      {loading ? (
        <div className="flex items-center justify-center gap-2 py-8 text-ink/50 dark:text-cream/50">
          <Loader2 className="h-5 w-5 animate-spin" /> جارٍ التحميل…
        </div>
      ) : (
        <Reorder.Group axis="y" values={list} onReorder={onReorder} className="space-y-2">
          {list.map((s) => (
            <StoreRow key={s.id} s={s} onEdit={() => setEditStore(s)}
              onDelete={remove} confirm={confirm} setConfirm={setConfirm} onPersist={persistOrder} />
          ))}
        </Reorder.Group>
      )}
      {msg && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-600 dark:text-red-300">{msg}</p>}

      <div className="rounded-xl border border-ink/10 dark:border-white/10 bg-cream dark:bg-night-800 p-3">
        <div className="mb-2 flex items-center gap-2 text-sm font-bold"><Plus className="h-4 w-4 text-copper" /> إضافة متجر</div>
        <div className="flex gap-2">
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="اسم المتجر (مثلاً: مخبز السماوة)" className={inp + ' flex-1'} />
          <div className="w-32 shrink-0">
            <CategoryPicker value={form.category} onChange={(v) => setForm({ ...form, category: v })} options={STORE_CATS} allowNew placeholder="التصنيف" />
          </div>
          <button onClick={add} className="shrink-0 rounded-xl bg-copper px-4 py-2.5 text-sm font-bold text-ink dark:text-cream hover:bg-copper-dark">إضافة</button>
        </div>
        <p className="mt-1.5 text-[11px] text-ink/40 dark:text-cream/40">بعد الإضافة، اضغط ✎ لرفع شعار المتجر وكتابة وصفه. اربط المنتجات بالمتجر من «تعديل منتج».</p>
      </div>

      <AnimatePresence>
        {editStore && (
          <StoreModal admin={admin} store={editStore}
            onClose={() => setEditStore(null)} onSaved={() => { setEditStore(null); load(); }} />
        )}
      </AnimatePresence>
    </div>
  );
}

function StoreRow({ s, onEdit, onDelete, confirm, setConfirm, onPersist }) {
  const controls = useDragControls();
  const [ok, setOk] = useState(true);
  return (
    <Reorder.Item value={s} dragListener={false} dragControls={controls} onDragEnd={onPersist}
      className={`flex items-center gap-2 rounded-xl border border-ink/10 dark:border-white/10 bg-beige dark:bg-night-900 p-2 ${s.active ? '' : 'opacity-60'}`}>
      <span onPointerDown={(e) => controls.start(e)}
        className="cursor-grab touch-none px-0.5 text-ink/30 dark:text-cream/30 active:cursor-grabbing">
        <GripVertical className="h-4 w-4" />
      </span>
      <span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-xl bg-white text-2xl ring-1 ring-ink/5 dark:ring-white/10">
        {s.logo && ok
          ? <img src={s.logo} alt="" className="h-full w-full object-contain p-0.5 mix-blend-multiply" onError={() => setOk(false)} />
          : <span>🏪</span>}
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate font-display text-sm font-bold text-ink dark:text-cream">{s.name}</div>
        <div className="flex flex-wrap items-center gap-x-1.5 text-[11px]">
          <span className="rounded bg-ink/5 px-1.5 py-0.5 text-ink/60 dark:bg-white/10 dark:text-cream/60">{s.category}</span>
          <span className="inline-flex items-center gap-0.5 font-bold text-amber-600 dark:text-amber-300"><Star className="h-3 w-3 fill-amber-400 text-amber-400" /> {Number(s.rating || 0).toFixed(1)}</span>
        </div>
      </div>
      <CopyLinkButton url={`${typeof window !== 'undefined' ? window.location.origin : ''}/s/${encodeURIComponent(s.name)}`} title="نسخ رابط المتجر" />
      <button onClick={onEdit}
        className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-ink/5 text-ink/60 hover:bg-ink/10 dark:bg-white/10 dark:text-cream/70"><Pencil className="h-4 w-4" /></button>
      {confirm === s.id ? (
        <button onClick={() => onDelete(s)} className="shrink-0 rounded-lg bg-red-600 px-2 py-1.5 text-[11px] font-bold text-white">تأكيد؟</button>
      ) : (
        <button onClick={() => setConfirm(s.id)}
          className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-red-500/10 text-red-600 hover:bg-red-500/20 dark:text-red-300"><Trash2 className="h-4 w-4" /></button>
      )}
    </Reorder.Item>
  );
}

function StoreModal({ admin, store, onClose, onSaved }) {
  const [name, setName] = useState(store.name || '');
  const [category, setCategory] = useState(store.category || 'بقالة');
  const [tagline, setTagline] = useState(store.tagline || '');
  const [phone, setPhone] = useState(store.phone || '');
  const [rating, setRating] = useState(store.rating != null ? String(store.rating) : '');
  const [commission, setCommission] = useState(store.commission_pct != null ? String(store.commission_pct) : '15');
  const [markup, setMarkup] = useState(store.markup_pct != null ? String(store.markup_pct) : '');
  const [logo, setLogo] = useState(store.logo || '');
  const [cover, setCover] = useState(store.cover || '');
  const [coverVideo, setCoverVideo] = useState(store.cover_video || store.coverVideo || '');
  const [srcFile, setSrcFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [covBusy, setCovBusy] = useState(false);
  const [vidBusy, setVidBusy] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const [cleanPct, setCleanPct] = useState(0);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const fileRef = useRef(null);
  const coverRef = useRef(null);
  const videoRef = useRef(null);

  async function onLogo(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setSrcFile(file);
    setUploading(true); setErr('');
    const res = await uploadProductImage(file, 'store-' + store.id);
    setUploading(false);
    if (res?.error) { setErr(res.error); return; }
    setLogo(res.url);
  }

  async function onCover(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setCovBusy(true); setErr('');
    const res = await uploadStoreCover(file, store.id);
    setCovBusy(false);
    if (res?.error) { setErr(res.error); return; }
    setCover(res.url);
  }

  async function onVideo(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setVidBusy(true); setErr('');
    const res = await uploadStoreVideo(file, store.id);
    setVidBusy(false);
    if (res?.error) { setErr(res.error); return; }
    setCoverVideo(res.url);
  }

  async function cleanBg() {
    if (!srcFile) { setErr('ارفع شعاراً أولاً ثم نظّف خلفيته'); return; }
    setCleaning(true); setErr(''); setCleanPct(0);
    try {
      const blob = await cleanProductImage(srcFile, (p) => setCleanPct(p));
      const res = await uploadProductImage(blob, 'store-' + store.id);
      if (res?.error) setErr(res.error); else setLogo(res.url);
    } catch { setErr('تعذّر تنظيف الخلفية. جرّب صورة أوضح.'); }
    finally { setCleaning(false); }
  }

  async function save() {
    if (!name.trim()) { setErr('اكتب اسم المتجر'); return; }
    setBusy(true); setErr('');
    const r = await adminUpdateStore(admin.id, store.id, {
      name: name.trim(), category: (category || '').trim() || 'بقالة', tagline: tagline.trim(), phone: phone.trim(),
      rating: rating === '' ? null : Math.min(5, Math.max(0, parseFloat(rating) || 0)),
      logo, cover, coverVideo,
    });
    // save commission rate (best-effort, separate RPC)
    await adminSetStoreCommission(admin.id, store.id, commission === '' ? 15 : Math.min(100, Math.max(0, parseFloat(commission) || 0)));
    // save platform markup (empty = inherit global)
    await adminSetStoreMarkup(admin.id, store.id, markup.trim() === '' ? null : Math.max(0, parseFloat(markup) || 0));
    setBusy(false);
    if (r?.ok) onSaved();
    else setErr(r?.error === 'exists' ? 'الاسم مستخدم لمتجر آخر' : 'تعذّر الحفظ');
  }

  return (
    <Modal title="تعديل المتجر" onClose={onClose}>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onLogo} />
      <input ref={coverRef} type="file" accept="image/*" className="hidden" onChange={onCover} />
      <input ref={videoRef} type="file" accept="video/*" className="hidden" onChange={onVideo} />

      {/* COVER preview + buttons */}
      <div>
        <span className="mb-1.5 block font-body text-sm font-bold text-ink dark:text-cream">غلاف المتجر (صورة وفيديو)</span>
        <div className="relative h-32 w-full overflow-hidden rounded-2xl bg-ink/5 ring-1 ring-ink/10 dark:bg-white/5 dark:ring-white/10">
          {coverVideo ? (
            <video className="h-full w-full object-cover" src={coverVideo} autoPlay muted loop playsInline poster={cover || undefined} />
          ) : cover ? (
            <img src={cover} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="grid h-full w-full place-items-center text-sm text-ink/40 dark:text-cream/40">لا يوجد غلاف بعد</div>
          )}
          {(covBusy || vidBusy) && <div className="absolute inset-0 grid place-items-center bg-black/40"><Loader2 className="h-6 w-6 animate-spin text-white" /></div>}
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          <button type="button" onClick={() => coverRef.current?.click()} disabled={covBusy}
            className="flex items-center gap-1.5 rounded-lg bg-ink/5 px-3 py-1.5 text-[12px] font-bold text-ink/70 hover:bg-ink/10 disabled:opacity-60 dark:bg-white/10 dark:text-cream/70">
            <ImageIcon className="h-3.5 w-3.5" /> {cover ? 'تغيير الصورة' : 'رفع صورة غلاف'}
          </button>
          <button type="button" onClick={() => videoRef.current?.click()} disabled={vidBusy}
            className="flex items-center gap-1.5 rounded-lg bg-ink/5 px-3 py-1.5 text-[12px] font-bold text-ink/70 hover:bg-ink/10 disabled:opacity-60 dark:bg-white/10 dark:text-cream/70">
            <Camera className="h-3.5 w-3.5" /> {coverVideo ? 'تغيير الفيديو' : 'رفع فيديو (اختياري)'}
          </button>
          {cover && <button type="button" onClick={() => setCover('')} className="text-[12px] font-bold text-red-600 dark:text-red-300">حذف الصورة</button>}
          {coverVideo && <button type="button" onClick={() => setCoverVideo('')} className="text-[12px] font-bold text-red-600 dark:text-red-300">حذف الفيديو</button>}
        </div>
        <p className="mt-1 text-[11px] text-ink/40 dark:text-cream/40">الفيديو يُعرض تلقائياً (صامت) فوق الصورة. الحد ٢٥ ميغا — يُفضّل مقطع قصير.</p>
      </div>

      {/* LOGO */}
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => fileRef.current?.click()}
          className="relative grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-2xl bg-white text-3xl ring-1 ring-ink/10 dark:ring-white/10">
          {uploading ? <Loader2 className="h-6 w-6 animate-spin text-copper" />
            : logo ? <img src={logo} alt="" className="h-full w-full object-contain p-1 mix-blend-multiply" />
              : <span>🏪</span>}
          <span className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-0.5 bg-copper/90 py-0.5 text-[9px] font-bold text-white">
            <ImageIcon className="h-2.5 w-2.5" /> شعار
          </span>
        </button>
        <div className="text-[11px] leading-relaxed text-ink/50 dark:text-cream/50">
          شعار المتجر (يظهر دائرياً). الأفضل خلفية بيضاء.
          {srcFile && (
            <button type="button" onClick={cleanBg} disabled={cleaning || uploading}
              className="mt-2 flex items-center gap-1.5 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 px-2.5 py-1.5 text-[12px] font-bold text-white transition hover:opacity-90 disabled:opacity-60">
              {cleaning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              {cleaning ? (cleanPct ? `ينظّف… ${cleanPct}%` : 'يحمّل الأداة…') : 'نظّف خلفية الشعار'}
            </button>
          )}
          {logo && !cleaning && <button type="button" onClick={() => { setLogo(''); setSrcFile(null); }} className="mt-1 block font-bold text-red-600 dark:text-red-300">إزالة الشعار</button>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Lbl label="اسم المتجر" full>
          <input className={inp} value={name} onChange={(e) => setName(e.target.value)} />
        </Lbl>
        <Lbl label="التصنيف (اكتب أو اختر)">
          <CategoryPicker value={category} onChange={setCategory} options={STORE_CATS} allowNew placeholder="مثلاً: مطعم" />
        </Lbl>
        <Lbl label="التقييم (0-5)">
          <input type="number" step="0.1" min="0" max="5" dir="ltr" className={inp} value={rating} onChange={(e) => setRating(e.target.value)} placeholder="مثلاً: 4.5" />
        </Lbl>
        <Lbl label="نسبة عمولتك % (ربحك من المتجر)">
          <input type="number" step="0.5" min="0" max="100" dir="ltr" className={inp} value={commission} onChange={(e) => setCommission(e.target.value)} placeholder="15" />
        </Lbl>
        <Lbl label="هامش المنصّة % (يُضاف فوق السعر)">
          <input type="number" step="0.5" min="0" max="100" dir="ltr" className={inp} value={markup} onChange={(e) => setMarkup(e.target.value)} placeholder="فارغ = العام" />
        </Lbl>
        <Lbl label="هاتف المتجر (اختياري)" full>
          <input dir="ltr" className={inp} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="07XXXXXXXXX" />
        </Lbl>
        <Lbl label="وصف قصير (اختياري)" full>
          <input className={inp} value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="مثلاً: أطيب خبز طازج في السماوة" />
        </Lbl>
      </div>

      {err && <div className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-300">{err}</div>}

      <MerchantCreds admin={admin} store={store} />

      <div className="flex gap-2">
        <button onClick={save} disabled={busy || uploading || cleaning || covBusy || vidBusy}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-copper py-3 font-display font-bold text-ink dark:text-cream hover:bg-copper-dark disabled:opacity-60">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} حفظ
        </button>
        <button onClick={onClose} className="rounded-xl bg-ink/5 px-5 py-3 font-bold text-ink/70 hover:bg-ink/10 dark:bg-white/5 dark:text-cream/70">إلغاء</button>
      </div>
    </Modal>
  );
}

/* لوحة الأدمن: إنشاء/تعديل بيانات دخول صاحب المتجر */
function MerchantCreds({ admin, store }) {
  const [username, setUsername] = useState(store.merchant_username || '');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const hasAccount = !!store.merchant_username;

  async function save() {
    if (!username.trim()) { setErr('اكتب اسم المستخدم'); return; }
    if (!hasAccount && !password) { setErr('اكتب كلمة مرور لإنشاء الحساب'); return; }
    setBusy(true); setErr(''); setMsg('');
    const r = await adminSetStoreCredentials(admin.id, store.id, username.trim(), password);
    setBusy(false);
    if (r?.ok) {
      setMsg(hasAccount && !password ? 'تم تحديث اسم المستخدم' : 'تم حفظ بيانات الدخول ✓');
      setPassword('');
      store.merchant_username = username.trim(); // reflect locally
    } else {
      setErr(r?.error === 'username_taken' ? 'اسم المستخدم مستخدم لمتجر آخر'
        : r?.error === 'password_required' ? 'كلمة المرور مطلوبة لإنشاء الحساب'
        : 'تعذّر الحفظ');
    }
  }

  return (
    <div className="rounded-2xl border border-copper/20 bg-copper/5 p-3.5">
      <div className="mb-2 flex items-center gap-1.5">
        <StoreIcon className="h-4 w-4 text-copper" />
        <span className="font-display text-sm font-bold text-ink dark:text-cream">دخول صاحب المتجر</span>
        {hasAccount && <span className="rounded-full bg-green-500/15 px-2 py-0.5 text-[10px] font-bold text-green-600 dark:text-green-300">مُفعّل</span>}
      </div>
      <p className="mb-2.5 text-[11px] leading-relaxed text-ink/50 dark:text-cream/50">
        يدخل صاحب المتجر عبر <span dir="ltr" className="font-bold">otlobha.netlify.app/merchant</span> ليدير منتجاته بنفسه.
      </p>
      <div className="grid grid-cols-2 gap-2">
        <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="اسم المستخدم" dir="ltr"
          className="rounded-lg border border-ink/10 bg-beige px-2.5 py-2 text-sm outline-none focus:border-copper dark:border-white/10 dark:bg-night-900 dark:text-cream" style={{ textAlign: 'right' }} />
        <div className="relative">
          <input value={password} onChange={(e) => setPassword(e.target.value)} type={show ? 'text' : 'password'}
            placeholder={hasAccount ? 'كلمة مرور جديدة (اختياري)' : 'كلمة المرور'} dir="ltr"
            className="w-full rounded-lg border border-ink/10 bg-beige px-2.5 py-2 pl-8 text-sm outline-none focus:border-copper dark:border-white/10 dark:bg-night-900 dark:text-cream" style={{ textAlign: 'right' }} />
          <button type="button" onClick={() => setShow((s) => !s)} className="absolute left-2 top-1/2 -translate-y-1/2 text-ink/30 dark:text-cream/30">
            {show ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>
      {err && <div className="mt-2 text-[12px] font-bold text-red-600 dark:text-red-300">{err}</div>}
      {msg && <div className="mt-2 text-[12px] font-bold text-green-600 dark:text-green-300">{msg}</div>}
      <button onClick={save} disabled={busy}
        className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-lg bg-copper/90 py-2 text-sm font-bold text-cream hover:bg-copper disabled:opacity-60">
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} {hasAccount ? 'تحديث الدخول' : 'إنشاء حساب الدخول'}
      </button>
    </div>
  );
}

/* ════════════════════════════ Bundles ════════════════════════════ */

function BundlesManager({ admin }) {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // null | 'new' | bundle
  const [confirm, setConfirm] = useState(null);
  const listRef = useRef([]);

  async function load() {
    setLoading(true);
    const b = await adminListBundles(admin.id);
    const items = Array.isArray(b?.bundles) ? b.bundles : [];
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
  async function persistOrder() { await adminReorderBundles(admin.id, listRef.current.map((x) => x.id)); }

  async function toggle(b) {
    const next = !b.active;
    const apply = (arr) => arr.map((x) => (x.id === b.id ? { ...x, active: next } : x));
    setList(apply); listRef.current = apply(listRef.current);
    const r = await adminSetBundleActive(admin.id, b.id, next);
    if (!r?.ok) load();
  }

  async function remove(id) {
    setConfirm(null);
    const r = await adminRemoveBundle(admin.id, id);
    if (r?.ok) {
      listRef.current = listRef.current.filter((x) => x.id !== id);
      setList((l) => l.filter((x) => x.id !== id));
    }
  }

  return (
    <div className="space-y-3 px-4 pb-4">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[12px] text-ink/50 dark:text-cream/50">{list.length} باقة · اسحب للترتيب</span>
        <button onClick={() => setEditing('new')}
          className="flex items-center gap-1.5 rounded-xl bg-copper px-3 py-2 text-sm font-bold text-ink dark:text-cream hover:bg-copper-dark">
          <Plus className="h-4 w-4" /> باقة جديدة
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-10 text-ink/50 dark:text-cream/50">
          <Loader2 className="h-5 w-5 animate-spin" /> جارٍ التحميل…
        </div>
      ) : list.length === 0 ? (
        <div className="py-10 text-center text-sm text-ink/40 dark:text-cream/40">لا توجد باقات. اضغط «باقة جديدة».</div>
      ) : (
        <Reorder.Group axis="y" values={list} onReorder={onReorder} className="space-y-2">
          {list.map((b) => (
            <BundleRow key={b.id} b={b} onToggle={toggle} onEdit={setEditing}
              onDelete={remove} confirm={confirm} setConfirm={setConfirm} onPersist={persistOrder} />
          ))}
        </Reorder.Group>
      )}

      <AnimatePresence>
        {editing && (
          <BundleForm admin={admin} bundle={editing === 'new' ? null : editing}
            onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />
        )}
      </AnimatePresence>
    </div>
  );
}

function BundleRow({ b, onToggle, onEdit, onDelete, confirm, setConfirm, onPersist }) {
  const controls = useDragControls();
  const count = Array.isArray(b.ingredients) ? b.ingredients.length : 0;
  return (
    <Reorder.Item value={b} dragListener={false} dragControls={controls} onDragEnd={onPersist}
      className={`flex items-center gap-2 rounded-xl border border-ink/10 dark:border-white/10 bg-beige dark:bg-night-900 p-2 ${b.active ? '' : 'opacity-60'}`}>
      <span onPointerDown={(e) => controls.start(e)}
        className="cursor-grab touch-none px-0.5 text-ink/30 dark:text-cream/30 active:cursor-grabbing">
        <GripVertical className="h-4 w-4" />
      </span>
      <span className="h-10 w-10 shrink-0 rounded-lg ring-1 ring-black/5"
        style={{ background: `linear-gradient(150deg, ${b.accent || '#0F5132'} 0%, #06271B 130%)` }} />
      <div className="min-w-0 flex-1">
        <div className="truncate font-display text-sm font-bold text-ink dark:text-cream">{b.name}</div>
        <div className="flex flex-wrap items-center gap-x-1.5 text-[11px]">
          <span className="font-bold text-green-600 dark:text-green-300">{fmt(b.price)}</span>
          <span className="text-ink/40 dark:text-cream/40">د.ع</span>
          {b.old_price ? <span className="text-ink/35 line-through dark:text-cream/35">{fmt(b.old_price)}</span> : null}
          <span className="text-ink/40 dark:text-cream/40">· {count} مكوّن</span>
        </div>
      </div>
      <button onClick={() => onToggle(b)} title={b.active ? 'إخفاء من المتجر' : 'إظهار في المتجر'}
        className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${b.active ? 'bg-green-500/10 text-green-600 dark:text-green-300' : 'bg-ink/10 text-ink/40 dark:bg-white/10 dark:text-cream/40'}`}>
        {b.active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
      </button>
      <button onClick={() => onEdit(b)}
        className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-ink/5 text-ink/60 hover:bg-ink/10 dark:bg-white/10 dark:text-cream/70">
        <Pencil className="h-4 w-4" />
      </button>
      {confirm === b.id ? (
        <button onClick={() => onDelete(b.id)} className="shrink-0 rounded-lg bg-red-600 px-2 py-1.5 text-[11px] font-bold text-white">تأكيد؟</button>
      ) : (
        <button onClick={() => setConfirm(b.id)}
          className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-red-500/10 text-red-600 hover:bg-red-500/20 dark:text-red-300">
          <Trash2 className="h-4 w-4" />
        </button>
      )}
    </Reorder.Item>
  );
}

function IngredientRow({ ing, onChange, onRemove }) {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);
  async function onFile(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true);
    const res = await uploadProductImage(file, 'bundle-ing');
    setUploading(false);
    if (!res?.error) onChange({ ...ing, image: res.url });
  }
  return (
    <div className="rounded-xl border border-ink/10 bg-beige/50 p-2 dark:border-white/10 dark:bg-night-900/50">
      <div className="flex items-center gap-2">
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
        <button type="button" onClick={() => fileRef.current?.click()} title="صورة المكوّن"
          className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-lg bg-white text-lg ring-1 ring-ink/10 dark:ring-white/10">
          {uploading
            ? <Loader2 className="h-4 w-4 animate-spin text-copper" />
            : ing.image
              ? <img src={ing.image} alt="" className="h-full w-full object-contain p-0.5 mix-blend-multiply" />
              : <span>{ing.emoji || '🛒'}</span>}
        </button>
        <input className={inp + ' flex-1'} value={ing.name} onChange={(e) => onChange({ ...ing, name: e.target.value })} placeholder="اسم المكوّن" />
        <input className="w-12 shrink-0 rounded-xl border border-ink/10 bg-beige px-1 py-2.5 text-center text-sm outline-none focus:border-copper dark:border-white/10 dark:bg-night-900"
          value={ing.emoji} onChange={(e) => onChange({ ...ing, emoji: e.target.value })} placeholder="🍆" />
        <button type="button" onClick={onRemove}
          className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-red-500/10 text-red-600 hover:bg-red-500/20 dark:text-red-300">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-ink/40 dark:text-cream/40">الكمية</span>
          <input type="number" min="1" dir="ltr" value={ing.qty ?? 1} onChange={(e) => onChange({ ...ing, qty: e.target.value })}
            className="h-9 w-full rounded-lg border border-ink/10 bg-beige px-2 text-sm dark:border-white/10 dark:bg-night-900 dark:text-cream" />
        </div>
        <input value={ing.unit || ''} onChange={(e) => onChange({ ...ing, unit: e.target.value })} placeholder="الوحدة (كيلو/علبة..)"
          className="h-9 rounded-lg border border-ink/10 bg-beige px-2 text-sm dark:border-white/10 dark:bg-night-900 dark:text-cream" />
      </div>
    </div>
  );
}

function BundleForm({ admin, bundle, onClose, onSaved }) {
  const [f, setF] = useState({
    name: bundle?.name || '',
    kicker: bundle?.kicker || '',
    description: bundle?.description || '',
    price: bundle?.price ?? '',
    old_price: bundle?.old_price ?? '',
    accent: bundle?.accent || '#0F5132',
  });
  const [image, setImage] = useState(bundle?.image || '');
  const [season, setSeason] = useState(bundle?.season || '');
  const [markup, setMarkup] = useState(bundle?.markup_pct != null ? String(bundle.markup_pct) : '');
  const [ingredients, setIngredients] = useState(
    Array.isArray(bundle?.ingredients) && bundle.ingredients.length
      ? bundle.ingredients.map((x) => ({ name: x?.name || '', qty: x?.qty ?? 1, unit: x?.unit || '', emoji: x?.emoji || '🛒', image: x?.image || '' }))
      : []
  );
  const [aiProducts, setAiProducts] = useState([]);
  const [aiBusy, setAiBusy] = useState(false);
  useEffect(() => { adminListProducts(admin.id).then((r) => { if (Array.isArray(r?.products)) setAiProducts(r.products); }); /* eslint-disable-next-line */ }, []);
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const fileRef = useRef(null);
  const set = (k) => (e) => setF((prev) => ({ ...prev, [k]: e.target.value }));

  async function onHeroFile(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true); setErr('');
    const res = await uploadProductImage(file, bundle?.id || 'bundle');
    setUploading(false);
    if (res?.error) { setErr(res.error); return; }
    setImage(res.url);
  }

  function addIngredient() { setIngredients((l) => [...l, { name: '', qty: 1, unit: '', emoji: '🛒', image: '' }]); }
  function updateIngredient(i, next) { setIngredients((l) => l.map((x, idx) => (idx === i ? next : x))); }
  function removeIngredient(i) { setIngredients((l) => l.filter((_, idx) => idx !== i)); }

  async function generateAI() {
    setErr('');
    if (aiProducts.length < 2) { setErr('لا توجد منتجات كافية لتوليد باقة.'); return; }
    setAiBusy(true);
    const r = await generateBundle(aiProducts.map((p) => ({ name: p.name, price: p.price, unit: p.unit })));
    setAiBusy(false);
    if (!r?.ok || !r.bundle) { setErr(r?.error || 'تعذّر توليد الباقة.'); return; }
    const byName = new Map(aiProducts.map((p) => [p.name, p]));
    const ing = (r.bundle.ingredients || []).map((x) => {
      const p = byName.get(x.name);
      return { name: x.name, qty: x.qty, unit: x.unit || (p?.unit || ''), emoji: p?.emoji || '🛒', image: p?.image || '' };
    });
    const full = ing.reduce((s, x) => s + ((byName.get(x.name)?.price || 0) * (x.qty || 0)), 0);
    const price = Math.max(0, Math.round(full * (1 - (r.bundle.discount_pct || 10) / 100)));
    setIngredients(ing);
    setF((prev) => ({ ...prev, name: r.bundle.name || prev.name, kicker: r.bundle.kicker || prev.kicker, description: r.bundle.description || prev.description, old_price: full || prev.old_price, price: price || full }));
  }

  async function save() {
    if (!f.name.trim()) { setErr('اكتب اسم الباقة'); return; }
    const cleanIngredients = ingredients
      .map((x) => ({ name: (x.name || '').trim(), qty: Math.max(1, parseInt(x.qty, 10) || 1), unit: (x.unit || '').trim(), emoji: (x.emoji || '').trim() || '🛒', image: (x.image || '').trim() || null }))
      .filter((x) => x.name);
    setBusy(true); setErr('');
    const fields = {
      name: f.name.trim(),
      kicker: f.kicker.trim(),
      description: f.description.trim(),
      price: Math.max(0, parseInt(f.price, 10) || 0),
      old_price: f.old_price === '' || f.old_price == null ? null : Math.max(0, parseInt(f.old_price, 10) || 0),
      accent: f.accent || '#0F5132',
      image,
      ingredients: cleanIngredients,
    };
    const r = bundle
      ? await adminUpdateBundle(admin.id, bundle.id, fields)
      : await adminAddBundle(admin.id, fields);
    if (r?.ok) {
      const id = bundle ? bundle.id : r.bundle?.id;
      if (id) await adminSetBundleSeason(admin.id, id, season || '');
      if (id) { try { await adminSetBundleMarkup(admin.id, id, markup.trim() === '' ? null : Math.max(0, parseFloat(markup) || 0)); } catch {} }
    }
    setBusy(false);
    if (r?.ok) onSaved();
    else setErr('تعذّر الحفظ، حاول مرّة ثانية.');
  }

  return (
    <Modal title={bundle ? 'تعديل باقة' : 'باقة جديدة'} onClose={onClose}>
      {/* hero image (optional) + accent */}
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onHeroFile} />
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => fileRef.current?.click()}
          className="relative grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-2xl text-3xl ring-1 ring-ink/10 dark:ring-white/10"
          style={{ background: `linear-gradient(150deg, ${f.accent || '#0F5132'} 0%, #06271B 130%)` }}>
          {uploading
            ? <Loader2 className="h-6 w-6 animate-spin text-cream" />
            : image
              ? <img src={image} alt="" className="h-full w-full object-contain p-1" />
              : <Boxes className="h-7 w-7 text-cream/90" />}
          <span className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-0.5 bg-black/40 py-0.5 text-[9px] font-bold text-white">
            <ImageIcon className="h-2.5 w-2.5" /> صورة
          </span>
        </button>
        <div className="text-[11px] leading-relaxed text-ink/50 dark:text-cream/50">
          صورة الباقة اختيارية (الكروت تعرض دوائر المكوّنات). اللون يتحكّم بخلفية الكرت.
          {image && (
            <button type="button" onClick={() => setImage('')} className="mt-1 block font-bold text-red-600 dark:text-red-300">إزالة الصورة</button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Lbl label="اسم الباقة" full>
          <input className={inp} value={f.name} onChange={set('name')} placeholder="مثلاً: لمة الدولمة" />
        </Lbl>
        <Lbl label="سطر صغير (kicker)" full>
          <input className={inp} value={f.kicker} onChange={set('kicker')} placeholder="تكفي ٦ أشخاص / لمّة العصر" />
        </Lbl>
        <Lbl label="الوصف" full>
          <textarea className={inp} rows={2} value={f.description} onChange={set('description')} placeholder="وصف قصير للباقة" />
        </Lbl>
        <Lbl label="وسم موسمي (يبرز الباقة)" full>
          <div className="flex flex-wrap gap-1.5">
            {['', 'رمضان', 'عيد', 'الصيف', 'الشتاء', 'العودة للمدارس', 'عاشوراء'].map((s) => (
              <button key={s || 'none'} type="button" onClick={() => setSeason(s)}
                className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${season === s ? 'bg-copper text-cream shadow-seal' : 'bg-ink/5 text-ink/60 hover:bg-ink/10 dark:bg-white/10 dark:text-cream/60'}`}>
                {s === '' ? 'بدون' : s}
              </button>
            ))}
          </div>
        </Lbl>
        <Lbl label="السعر (د.ع)">
          <input type="number" inputMode="numeric" className={inp} value={f.price} onChange={set('price')} placeholder="0" dir="ltr" />
        </Lbl>
        <Lbl label="السعر قبل الخصم (اختياري)">
          <input type="number" inputMode="numeric" className={inp} value={f.old_price} onChange={set('old_price')} placeholder="بدون خصم" dir="ltr" />
        </Lbl>
        <Lbl label="هامش المنصّة %">
          <input type="number" step="0.5" min="0" max="100" dir="ltr" className={inp} value={markup} onChange={(e) => setMarkup(e.target.value)} placeholder="فارغ = العام" />
        </Lbl>
        <Lbl label="لون الباقة">
          <input type="color" value={f.accent} onChange={set('accent')}
            className="h-10 w-full cursor-pointer rounded-xl border border-ink/10 bg-beige dark:border-white/10 dark:bg-night-900" />
        </Lbl>
      </div>

      {/* ingredients editor */}
      <div className="rounded-xl border border-ink/10 dark:border-white/10 bg-beige/60 dark:bg-night-900/60 p-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[12px] font-bold text-ink/60 dark:text-cream/60">المكوّنات ({ingredients.length})</span>
          <div className="flex gap-2">
            <button type="button" onClick={generateAI} disabled={aiBusy}
              className="flex items-center gap-1 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 px-2.5 py-1.5 text-[12px] font-bold text-white hover:opacity-90 disabled:opacity-60">
              {aiBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />} توليد بالذكاء
            </button>
            <button type="button" onClick={addIngredient}
              className="flex items-center gap-1 rounded-lg bg-copper/15 px-2.5 py-1.5 text-[12px] font-bold text-copper-dark dark:text-copper-light hover:bg-copper/25">
              <Plus className="h-3.5 w-3.5" /> أضف مكوّن
            </button>
          </div>
        </div>
        {aiBusy && <p className="mb-2 flex items-center gap-1.5 text-[12px] font-bold text-indigo-600 dark:text-indigo-300"><Sparkles className="h-3.5 w-3.5 animate-pulse" /> الذكاء يكوّن باقة من المنتجات…</p>}
        {ingredients.length === 0 ? (
          <p className="py-2 text-center text-[12px] text-ink/40 dark:text-cream/40">أضِف مكوّنات الباقة، أو دع الذكاء يقترحها.</p>
        ) : (
          <div className="space-y-2">
            {ingredients.map((ing, i) => (
              <IngredientRow key={i} ing={ing} onChange={(next) => updateIngredient(i, next)} onRemove={() => removeIngredient(i)} />
            ))}
          </div>
        )}
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

/* ════════════════════════════ Users ════════════════════════════ */

function randomDigits(n) {
  let s = '';
  for (let i = 0; i < n; i++) s += Math.floor(Math.random() * 10);
  return s;
}

function UsersManager({ admin }) {
  const [tab, setTab] = useState('customers');
  return (
    <div className="space-y-3 px-4 pb-4">
      <div className="grid grid-cols-3 gap-1 rounded-xl bg-ink/5 p-1 dark:bg-white/5">
        {[['customers', 'الزبائن'], ['drivers', 'المندوبون'], ['admins', 'المشرفون']].map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`rounded-lg py-2 text-sm font-bold transition ${tab === k ? 'bg-copper text-cream shadow-seal' : 'text-ink/60 dark:text-cream/60'}`}>
            {l}
          </button>
        ))}
      </div>
      {tab === 'customers' && <AccountsList admin={admin} />}
      {tab === 'drivers' && <StaffList admin={admin} kind="driver" />}
      {tab === 'admins' && <StaffList admin={admin} kind="admin" />}
    </div>
  );
}

const fmtJoin = (iso) => {
  if (!iso) return '';
  try { return new Date(iso).toLocaleDateString('ar', { year: 'numeric', month: 'short', day: 'numeric' }); }
  catch { return ''; }
};

/* ───────── customers ───────── */
function AccountsList({ admin }) {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null);
  const [resetting, setResetting] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const first = useRef(true);

  async function load(s) {
    setLoading(true);
    const r = await adminListAccounts(admin.id, s ?? search, 500);
    setList(Array.isArray(r?.accounts) ? r.accounts : []);
    setLoading(false);
  }
  useEffect(() => { load(''); /* eslint-disable-next-line */ }, []);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    const t = setTimeout(() => load(search), 350);
    return () => clearTimeout(t);
    /* eslint-disable-next-line */
  }, [search]);
  useEffect(() => {
    if (!confirm) return;
    const t = setTimeout(() => setConfirm(null), 2600);
    return () => clearTimeout(t);
  }, [confirm]);

  async function remove(id) {
    setConfirm(null);
    const r = await adminRemoveAccount(admin.id, id);
    if (r?.ok) setList((l) => l.filter((x) => x.id !== id));
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 rounded-xl border border-ink/10 bg-beige px-3 dark:border-white/10 dark:bg-night-900">
        <Search className="h-4 w-4 shrink-0 text-ink/40 dark:text-cream/40" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ابحث بالاسم أو الهاتف أو البريد"
          className="w-full bg-transparent py-2.5 text-sm text-ink outline-none placeholder:text-ink/35 dark:text-cream dark:placeholder:text-cream/30" />
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-10 text-ink/50 dark:text-cream/50"><Loader2 className="h-5 w-5 animate-spin" /> جارٍ التحميل…</div>
      ) : list.length === 0 ? (
        <div className="py-10 text-center text-sm text-ink/40 dark:text-cream/40">{search ? 'لا نتائج للبحث' : 'لا يوجد زبائن بعد'}</div>
      ) : (
        <>
          <div className="text-[12px] text-ink/50 dark:text-cream/50">{list.length} زبون</div>
          <div className="space-y-2">
            {list.map((a) => (
              <AccountCard key={a.id} a={a} onEdit={() => setEditing(a)} onReset={() => setResetting(a)}
                onDelete={() => remove(a.id)} confirm={confirm} setConfirm={setConfirm} />
            ))}
          </div>
        </>
      )}

      <AnimatePresence>
        {editing && (
          <AccountEditModal admin={admin} account={editing} onClose={() => setEditing(null)}
            onSaved={() => { setEditing(null); load(search); }} />
        )}
        {resetting && (
          <ResetPinModal title={`رمز مؤقّت لـ ${resetting.name || resetting.phone}`} minLen={4} suggest={4}
            onClose={() => setResetting(null)}
            onSubmit={(code) => adminResetAccountPin(admin.id, resetting.id, code)} />
        )}
      </AnimatePresence>
    </div>
  );
}

function AccountCard({ a, onEdit, onReset, onDelete, confirm, setConfirm }) {
  return (
    <div className="rounded-xl border border-ink/10 bg-beige p-3 dark:border-white/10 dark:bg-night-900">
      <div className="flex items-start gap-3">
        <Avatar name={a.name} url={a.avatar_url} size={40} />
        <div className="min-w-0 flex-1">
          <div className="truncate font-display text-sm font-bold text-ink dark:text-cream">{a.name || 'بدون اسم'}</div>
          <div className="text-[12px] text-ink/60 dark:text-cream/60" dir="ltr">{a.phone}</div>
          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px]">
            {a.email && <span className="rounded bg-ink/5 px-1.5 py-0.5 text-ink/60 dark:bg-white/10 dark:text-cream/60" dir="ltr">{a.email}</span>}
            {a.area && <span className="rounded bg-ink/5 px-1.5 py-0.5 text-ink/60 dark:bg-white/10 dark:text-cream/60">{a.area}</span>}
            <span className="rounded bg-copper/15 px-1.5 py-0.5 font-bold text-copper-dark dark:text-copper-light">{fmt(a.points || 0)} نقطة</span>
            {a.created_at && <span className="text-ink/40 dark:text-cream/40">انضمّ {fmtJoin(a.created_at)}</span>}
          </div>
        </div>
      </div>
      <div className="mt-2.5 flex flex-wrap gap-1.5">
        <button onClick={onEdit} className="flex items-center gap-1 rounded-lg bg-ink/5 px-2.5 py-1.5 text-[12px] font-bold text-ink/70 hover:bg-ink/10 dark:bg-white/10 dark:text-cream/70">
          <Pencil className="h-3.5 w-3.5" /> تعديل
        </button>
        <button onClick={onReset} className="flex items-center gap-1 rounded-lg bg-copper/15 px-2.5 py-1.5 text-[12px] font-bold text-copper-dark hover:bg-copper/25 dark:text-copper-light">
          <KeyRound className="h-3.5 w-3.5" /> رمز مؤقّت
        </button>
        {confirm === a.id ? (
          <button onClick={onDelete} className="rounded-lg bg-red-600 px-2.5 py-1.5 text-[12px] font-bold text-white">تأكيد الحذف؟</button>
        ) : (
          <button onClick={() => setConfirm(a.id)} className="flex items-center gap-1 rounded-lg bg-red-500/10 px-2.5 py-1.5 text-[12px] font-bold text-red-600 hover:bg-red-500/20 dark:text-red-300">
            <Trash2 className="h-3.5 w-3.5" /> حذف
          </button>
        )}
      </div>
    </div>
  );
}

function AccountEditModal({ admin, account, onClose, onSaved }) {
  const [f, setF] = useState({
    name: account.name || '', phone: account.phone || '', phone2: account.phone2 || '',
    email: account.email || '', area: account.area || '', address: account.address || '',
    birthdate: account.birthdate || '', gender: account.gender || '', notes: account.notes || '',
    points: account.points ?? 0,
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));

  // wallet credit adjuster
  const [walletBal, setWalletBal] = useState(account.wallet_balance ?? 0);
  const [wAmt, setWAmt] = useState('');
  const [wReason, setWReason] = useState('');
  const [wBusy, setWBusy] = useState(false);
  const [wMsg, setWMsg] = useState('');
  async function adjustWallet(sign) {
    const amt = Math.abs(parseInt(wAmt, 10) || 0);
    if (!amt) { setWMsg('اكتب مبلغاً'); return; }
    setWBusy(true); setWMsg('');
    const r = await adminAdjustWallet(admin.id, account.id, sign * amt, wReason.trim());
    setWBusy(false);
    if (r?.ok) { setWalletBal(r.balance); setWAmt(''); setWReason(''); setWMsg('تم ✓'); setTimeout(() => setWMsg(''), 2000); }
    else setWMsg(r?.error === 'insufficient' ? 'الرصيد لا يكفي للخصم' : 'تعذّر التعديل');
  }

  async function save() {
    if (!f.phone.trim()) { setErr('رقم الهاتف مطلوب'); return; }
    setBusy(true); setErr('');
    const r = await adminUpdateAccount(admin.id, account.id, {
      name: f.name.trim(), phone: f.phone.trim(), phone2: f.phone2.trim(), email: f.email.trim(),
      area: f.area.trim(), address: f.address.trim(), birthdate: f.birthdate || null,
      gender: f.gender || '', notes: f.notes.trim(),
    });
    if (!r?.ok) {
      setBusy(false);
      setErr(r?.error === 'phone_taken' ? 'رقم الهاتف مستخدم لحساب آخر' : 'تعذّر الحفظ');
      return;
    }
    const newPts = Math.max(0, parseInt(f.points, 10) || 0);
    if (newPts !== (account.points ?? 0)) await adminSetAccountPoints(admin.id, account.id, newPts);
    setBusy(false);
    onSaved();
  }

  return (
    <Modal title="تعديل بيانات الزبون" onClose={onClose}>
      <div className="grid grid-cols-2 gap-3">
        <Lbl label="الاسم" full><input className={inp} value={f.name} onChange={set('name')} /></Lbl>
        <Lbl label="الهاتف"><input className={inp} dir="ltr" value={f.phone} onChange={set('phone')} /></Lbl>
        <Lbl label="هاتف إضافي"><input className={inp} dir="ltr" value={f.phone2} onChange={set('phone2')} /></Lbl>
        <Lbl label="البريد" full><input className={inp} dir="ltr" value={f.email} onChange={set('email')} placeholder="example@mail.com" /></Lbl>
        <Lbl label="المنطقة"><input className={inp} value={f.area} onChange={set('area')} /></Lbl>
        <Lbl label="النقاط"><input type="number" dir="ltr" className={inp} value={f.points} onChange={set('points')} /></Lbl>
        <Lbl label="العنوان" full><input className={inp} value={f.address} onChange={set('address')} /></Lbl>
        <Lbl label="الجنس">
          <select className={inp} value={f.gender} onChange={set('gender')}>
            <option value="">—</option><option value="ذكر">ذكر</option><option value="أنثى">أنثى</option>
          </select>
        </Lbl>
        <Lbl label="تاريخ الميلاد"><input type="date" dir="ltr" className={inp} value={f.birthdate || ''} onChange={set('birthdate')} /></Lbl>
        <Lbl label="ملاحظات (خاصة بك)" full><textarea rows={2} className={inp} value={f.notes} onChange={set('notes')} /></Lbl>
      </div>

      {/* wallet credit */}
      <div className="rounded-xl bg-brand-800/5 p-3 ring-1 ring-brand-800/10 dark:bg-white/5">
        <div className="mb-2 flex items-center justify-between">
          <span className="flex items-center gap-1.5 font-display text-sm font-black text-ink dark:text-cream"><Wallet className="h-4 w-4 text-copper" /> محفظة الرصيد</span>
          <span className="font-display text-lg font-black text-brand-800 dark:text-brand-300">{fmt(walletBal)} د.ع</span>
        </div>
        <div className="flex gap-2">
          <input type="number" dir="ltr" inputMode="numeric" value={wAmt} onChange={(e) => setWAmt(e.target.value)} placeholder="المبلغ" className={inp} />
          <input value={wReason} onChange={(e) => setWReason(e.target.value)} placeholder="السبب (اختياري)" className={inp} />
        </div>
        <div className="mt-2 flex gap-2">
          <button type="button" onClick={() => adjustWallet(1)} disabled={wBusy} className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-green-600 py-2 text-[13px] font-bold text-white hover:bg-green-700 disabled:opacity-60">{wBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />} إضافة رصيد</button>
          <button type="button" onClick={() => adjustWallet(-1)} disabled={wBusy} className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-ink/10 py-2 text-[13px] font-bold text-ink/70 hover:bg-ink/15 dark:bg-white/10 dark:text-cream/70"><Minus className="h-3.5 w-3.5" /> خصم</button>
        </div>
        {wMsg && <p className="mt-1.5 text-[12px] font-bold text-brand-700 dark:text-brand-300">{wMsg}</p>}
        <p className="mt-1 text-[10px] text-ink/40 dark:text-cream/40">للإرجاعات والتعويضات — الزبون يصرفه عند الدفع.</p>
      </div>

      {err && <div className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-300">{err}</div>}
      <div className="flex gap-2">
        <button onClick={save} disabled={busy} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-copper py-3 font-display font-bold text-ink dark:text-cream hover:bg-copper-dark disabled:opacity-60">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} حفظ
        </button>
        <button onClick={onClose} className="rounded-xl bg-ink/5 px-5 py-3 font-bold text-ink/70 hover:bg-ink/10 dark:bg-white/5 dark:text-cream/70">إلغاء</button>
      </div>
    </Modal>
  );
}

/* shared: reset a forgotten PIN/password to a temporary code (admin reads it out) */
function ResetPinModal({ title, minLen = 4, suggest = 4, onClose, onSubmit }) {
  const [code, setCode] = useState(() => randomDigits(suggest));
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState('');

  async function go() {
    if (code.trim().length < minLen) { setErr(`الرمز ${minLen} خانات على الأقل`); return; }
    setBusy(true); setErr('');
    const r = await onSubmit(code.trim());
    setBusy(false);
    if (r?.ok) setDone(true);
    else setErr('تعذّر تعيين الرمز');
  }

  return (
    <Modal title={title} onClose={onClose}>
      {done ? (
        <div className="space-y-4 text-center">
          <SuccessCheck label="تم تعيين الرمز" />
          <div className="rounded-2xl bg-copper/10 p-4">
            <div className="text-[12px] text-ink/60 dark:text-cream/60">الرمز المؤقّت — أعطِه للمستخدم:</div>
            <div className="mt-1 font-display text-3xl font-black tracking-[0.3em] text-copper-dark dark:text-copper-light" dir="ltr">{code}</div>
          </div>
          <p className="text-[12px] leading-relaxed text-ink/50 dark:text-cream/50">يدخل المستخدم بهذا الرمز، ويُنصح بتغييره من صفحته بعد الدخول.</p>
          <button onClick={onClose} className="w-full rounded-xl bg-copper py-3 font-display font-bold text-ink dark:text-cream hover:bg-copper-dark">تم</button>
        </div>
      ) : (
        <>
          <p className="text-[13px] leading-relaxed text-ink/60 dark:text-cream/60">
            اكتب رمزاً مؤقّتاً (أو ولّد واحداً) وأعطِه للمستخدم ليسجّل الدخول، ثم يغيّره بنفسه.
          </p>
          <div className="flex items-center gap-2">
            <input value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} dir="ltr" inputMode="numeric" maxLength={8}
              className={inp + ' text-center font-display text-2xl font-black tracking-[0.3em]'} />
            <button type="button" onClick={() => setCode(randomDigits(suggest))}
              className="shrink-0 rounded-xl bg-ink/5 px-3 py-2.5 text-sm font-bold text-ink/70 hover:bg-ink/10 dark:bg-white/10 dark:text-cream/70">توليد</button>
          </div>
          {err && <div className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-300">{err}</div>}
          <div className="flex gap-2">
            <button onClick={go} disabled={busy} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-copper py-3 font-display font-bold text-ink dark:text-cream hover:bg-copper-dark disabled:opacity-60">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />} تعيين الرمز
            </button>
            <button onClick={onClose} className="rounded-xl bg-ink/5 px-5 py-3 font-bold text-ink/70 hover:bg-ink/10 dark:bg-white/5 dark:text-cream/70">إلغاء</button>
          </div>
        </>
      )}
    </Modal>
  );
}

/* ───────── drivers + admins ───────── */
function StaffList({ admin, kind }) {
  const isDriver = kind === 'driver';
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(null);
  const [msg, setMsg] = useState('');

  async function load() {
    setLoading(true);
    const r = isDriver ? await adminListDriversExt(admin.id) : await adminListAdminsExt(admin.id);
    setList(isDriver ? (Array.isArray(r?.drivers) ? r.drivers : []) : (Array.isArray(r?.admins) ? r.admins : []));
    setLoading(false);
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  async function toggle(u) {
    setMsg('');
    const next = !(u.active !== false);
    const r = isDriver
      ? await adminSetDriverActive(admin.id, u.id, next)
      : await adminSetAdminActive(admin.id, u.id, next);
    if (r?.ok) load();
    else if (r?.error === 'last_admin') setMsg('لا يمكن إيقاف آخر مشرف فعّال');
    else setMsg('تعذّرت العملية');
  }

  if (loading) {
    return <div className="flex items-center justify-center gap-2 py-10 text-ink/50 dark:text-cream/50"><Loader2 className="h-5 w-5 animate-spin" /> جارٍ التحميل…</div>;
  }
  if (list.length === 0) {
    return <div className="py-10 text-center text-sm text-ink/40 dark:text-cream/40">{isDriver ? 'لا يوجد مندوبون' : 'لا يوجد مشرفون'}</div>;
  }

  return (
    <div className="space-y-2">
      <div className="text-[12px] text-ink/50 dark:text-cream/50">{list.length} {isDriver ? 'مندوب' : 'مشرف'}</div>
      {list.map((u) => {
        const banned = u.active === false;
        return (
          <div key={u.id} className={`rounded-xl border border-ink/10 bg-beige p-3 dark:border-white/10 dark:bg-night-900 ${banned ? 'opacity-70' : ''}`}>
            <div className="flex items-center gap-3">
              <Avatar name={u.name} url={u.avatar_url} size={38} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate font-display text-sm font-bold text-ink dark:text-cream">{u.name || u.username}</span>
                  {banned && <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] font-bold text-red-600 dark:text-red-300">موقوف</span>}
                </div>
                <div className="text-[12px] text-ink/55 dark:text-cream/55" dir="ltr">
                  @{u.username}{u.phone ? ' · ' + u.phone : ''}
                </div>
              </div>
            </div>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              <button onClick={() => setResetting(u)} className="flex items-center gap-1 rounded-lg bg-copper/15 px-2.5 py-1.5 text-[12px] font-bold text-copper-dark hover:bg-copper/25 dark:text-copper-light">
                <KeyRound className="h-3.5 w-3.5" /> رمز مؤقّت
              </button>
              <button onClick={() => toggle(u)}
                className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[12px] font-bold ${banned ? 'bg-green-500/15 text-green-600 dark:text-green-300' : 'bg-ink/5 text-ink/70 hover:bg-ink/10 dark:bg-white/10 dark:text-cream/70'}`}>
                {banned ? <Check className="h-3.5 w-3.5" /> : <Ban className="h-3.5 w-3.5" />} {banned ? 'تفعيل' : 'إيقاف'}
              </button>
            </div>
          </div>
        );
      })}
      {msg && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-600 dark:text-red-300">{msg}</p>}

      <AnimatePresence>
        {resetting && (
          <ResetPinModal title={`رمز مؤقّت لـ ${resetting.name || resetting.username}`} minLen={4} suggest={6}
            onClose={() => setResetting(null)}
            onSubmit={(code) => (isDriver
              ? adminResetDriverPass(admin.id, resetting.id, code)
              : adminResetAdminPass(admin.id, resetting.id, code))} />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ════════════════ Smart add (AI from image) ════════════════ */
function SmartAddModal({ admin, cats, onClose, onDone }) {
  const catNames = (cats || []).map((c) => c.name);
  const [step, setStep] = useState('pick'); // pick | loading | review | saving | done
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [rows, setRows] = useState([]);
  const [err, setErr] = useState('');
  const [progress, setProgress] = useState({ done: 0, total: 0, failed: 0 });
  const fileRef = useRef(null);

  function pick(f) {
    if (!f) return;
    setErr('');
    setFile(f);
    try { setPreview(URL.createObjectURL(f)); } catch {}
  }

  async function analyze() {
    if (!file) return;
    setStep('loading'); setErr('');
    const r = await extractProductsFromImage(file, catNames);
    if (!r?.ok) {
      setErr(r?.error || 'تعذّر تحليل الصورة');
      setStep('pick');
      return;
    }
    const known = catNames.map((n) => n.trim());
    setRows((r.products || []).map((p, i) => ({
      key: 'r' + i,
      name: p.name || '',
      price: p.price || 0,
      unit: p.unit || 'وحدة',
      category: p.category || '',
      emoji: p.emoji || '🛒',
      include: true,
      isNew: p.category ? !known.includes(p.category.trim()) : false,
    })));
    setStep('review');
  }

  function upd(key, patch) {
    setRows((rs) => rs.map((r) => {
      if (r.key !== key) return r;
      const next = { ...r, ...patch };
      if ('category' in patch) {
        next.isNew = next.category.trim() ? !catNames.map((n) => n.trim()).includes(next.category.trim()) : false;
      }
      return next;
    }));
  }

  const chosen = rows.filter((r) => r.include && r.name.trim());

  async function addAll() {
    if (chosen.length === 0) return;
    setStep('saving');
    setProgress({ done: 0, total: chosen.length, failed: 0 });

    // 1) create any new categories first (unique by name)
    const newCats = {};
    chosen.forEach((r) => {
      const c = r.category.trim();
      if (c && r.isNew && !newCats[c]) newCats[c] = r.emoji || '🛒';
    });
    for (const name of Object.keys(newCats)) {
      try { await adminAddCategory(admin.id, { name, emoji: newCats[name] }); } catch {}
    }

    // 2) add products
    let done = 0, failed = 0;
    for (const r of chosen) {
      try {
        const res = await adminAddProduct(admin.id, {
          name: r.name.trim(),
          category: r.category.trim(),
          price: Math.max(0, parseInt(r.price, 10) || 0),
          unit: r.unit.trim() || 'وحدة',
          emoji: r.emoji.trim() || '🛒',
        });
        if (res?.ok) done++; else failed++;
      } catch { failed++; }
      setProgress({ done: done + failed, total: chosen.length, failed });
    }
    setProgress({ done: chosen.length, total: chosen.length, failed });
    setStep('done');
    setTimeout(() => onDone?.(), 1700);
  }

  return (
    <Modal title="إضافة ذكية بالصورة" onClose={step === 'saving' ? undefined : onClose}>
      {step === 'pick' && (
        <div className="space-y-4">
          <p className="text-[13px] leading-relaxed text-ink/60 dark:text-cream/60">
            ارفع <b>ورقة أسعار الجملة</b> (مكتوبة أو مطبوعة) أو <b>صورة منتجات</b>، وسيقرأها الذكاء الصناعي ويجهّز قائمة جاهزة للمراجعة.
          </p>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
          {preview ? (
            <div className="space-y-3">
              <img src={preview} alt="" className="max-h-60 w-full rounded-2xl object-contain ring-1 ring-ink/10 dark:ring-white/10" />
              <button onClick={() => fileRef.current?.click()} className="text-xs font-bold text-copper">تغيير الصورة</button>
            </div>
          ) : (
            <button onClick={() => fileRef.current?.click()}
              className="flex w-full flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-ink/20 py-10 text-ink/50 transition hover:border-copper hover:text-copper dark:border-white/15 dark:text-cream/50">
              <Camera className="h-8 w-8" />
              <span className="text-sm font-bold">اضغط لاختيار صورة</span>
            </button>
          )}
          {err && <div className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-300">{err}</div>}
          <button onClick={analyze} disabled={!file}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 py-3 font-display font-bold text-white transition hover:opacity-90 disabled:opacity-50">
            <Sparkles className="h-5 w-5" /> حلّل الصورة
          </button>
        </div>
      )}

      {step === 'loading' && (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <Loader2 className="h-9 w-9 animate-spin text-copper" />
          <div className="font-display font-bold text-ink dark:text-cream">جارٍ قراءة الصورة…</div>
          <div className="text-xs text-ink/50 dark:text-cream/50">قد يستغرق بضع ثوانٍ</div>
        </div>
      )}

      {step === 'review' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[12px] text-ink/55 dark:text-cream/55">{chosen.length} مُختار من {rows.length}</span>
            <span className="text-[11px] text-ink/40 dark:text-cream/40">عدّل أي حقل قبل الإضافة</span>
          </div>
          <datalist id="smart-cats">
            {catNames.map((n) => <option key={n} value={n} />)}
          </datalist>
          <div className="max-h-[52vh] space-y-2 overflow-y-auto pe-1">
            {rows.map((r) => (
              <div key={r.key} className={`rounded-xl border p-2.5 ${r.include ? 'border-ink/10 bg-beige dark:border-white/10 dark:bg-night-900' : 'border-ink/5 bg-ink/[0.02] opacity-50 dark:border-white/5 dark:bg-white/[0.02]'}`}>
                <div className="flex items-center gap-2">
                  <button onClick={() => upd(r.key, { include: !r.include })}
                    className={`grid h-6 w-6 shrink-0 place-items-center rounded-md border-2 ${r.include ? 'border-copper bg-copper text-white' : 'border-ink/25 dark:border-white/25'}`}>
                    {r.include && <Check className="h-4 w-4" />}
                  </button>
                  <input value={r.emoji} onChange={(e) => upd(r.key, { emoji: e.target.value })}
                    className="w-10 shrink-0 rounded-lg border border-ink/10 bg-white/70 py-1.5 text-center text-lg dark:border-white/10 dark:bg-white/5" />
                  <input value={r.name} onChange={(e) => upd(r.key, { name: e.target.value })} placeholder="اسم المنتج"
                    className="min-w-0 flex-1 rounded-lg border border-ink/10 bg-white/70 px-2 py-1.5 text-sm font-bold text-ink outline-none focus:border-copper dark:border-white/10 dark:bg-white/5 dark:text-cream" />
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex items-center rounded-lg border border-ink/10 bg-white/70 dark:border-white/10 dark:bg-white/5">
                    <input value={r.price} onChange={(e) => upd(r.key, { price: e.target.value.replace(/\D/g, '') })} dir="ltr" inputMode="numeric"
                      className="w-20 bg-transparent px-2 py-1.5 text-left text-sm font-bold text-ink outline-none dark:text-cream" />
                    <span className="pe-2 text-[11px] text-ink/40 dark:text-cream/40">د.ع</span>
                  </div>
                  <input value={r.unit} onChange={(e) => upd(r.key, { unit: e.target.value })} placeholder="وحدة"
                    className="w-16 rounded-lg border border-ink/10 bg-white/70 px-2 py-1.5 text-center text-xs text-ink outline-none dark:border-white/10 dark:bg-white/5 dark:text-cream" />
                  <div className="relative min-w-0 flex-1">
                    <input list="smart-cats" value={r.category} onChange={(e) => upd(r.key, { category: e.target.value })} placeholder="القسم"
                      className="w-full rounded-lg border border-ink/10 bg-white/70 px-2 py-1.5 text-xs text-ink outline-none focus:border-copper dark:border-white/10 dark:bg-white/5 dark:text-cream" />
                    {r.isNew && r.category.trim() && (
                      <span className="absolute inset-y-0 left-1 my-auto h-fit rounded bg-green-500/15 px-1 py-0.5 text-[9px] font-bold text-green-600 dark:text-green-300">جديد</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          {err && <div className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-300">{err}</div>}
          <div className="flex gap-2">
            <button onClick={addAll} disabled={chosen.length === 0}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-copper py-3 font-display font-bold text-ink dark:text-cream hover:bg-copper-dark disabled:opacity-50">
              <Plus className="h-4 w-4" /> أضف الكل ({chosen.length})
            </button>
            <button onClick={() => { setStep('pick'); setRows([]); }} className="rounded-xl bg-ink/5 px-4 py-3 text-sm font-bold text-ink/70 dark:bg-white/5 dark:text-cream/70">صورة أخرى</button>
          </div>
        </div>
      )}

      {step === 'saving' && (
        <div className="flex flex-col items-center gap-3 py-10 text-center">
          <Loader2 className="h-9 w-9 animate-spin text-copper" />
          <div className="font-display font-bold text-ink dark:text-cream">جارٍ الإضافة… {progress.done}/{progress.total}</div>
          <div className="h-2 w-48 overflow-hidden rounded-full bg-ink/10 dark:bg-white/10">
            <div className="h-full bg-copper transition-all" style={{ width: `${progress.total ? (progress.done / progress.total) * 100 : 0}%` }} />
          </div>
        </div>
      )}

      {step === 'done' && (
        <div className="py-4">
          <SuccessCheck label={`أُضيفت ${progress.total - progress.failed} منتج`}
            sub={progress.failed ? `تعذّر إضافة ${progress.failed}` : 'ظهرت في متجرك مباشرة'} />
        </div>
      )}
    </Modal>
  );
}
