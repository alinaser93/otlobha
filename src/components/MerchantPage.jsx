import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence, Reorder, useDragControls } from 'framer-motion';
import { BundleDetailModal } from './BundleSection.jsx';
import {
  Store, LogOut, Plus, Pencil, Trash2, Eye, EyeOff, Loader2, X, Save,
  Image as ImageIcon, Camera, Sparkles, Sun, Moon, Package, Phone,
  ClipboardList, MapPin, Clock, Ban, ChevronDown, Minus, MessageCircle, Truck, Gift, Layers, Copy, GripVertical, Wallet, Receipt, Banknote, CheckCircle2,
  Star, Users, Check, Lock, User, AlertTriangle, Tag, PackageCheck, Navigation, BellRing, QrCode,
} from 'lucide-react';
import {
  getMerchantSession, setMerchantSession, clearMerchantSession,
  merchantLogin, merchantMe, merchantLogout,
  merchantListProducts, merchantAddProduct, merchantUpdateProduct,
  merchantRemoveProduct, merchantSetProductActive, merchantUpdateStore, merchantSetLocation,
  merchantListOrders, merchantSetItemQty, merchantMarkReady, merchantUnmarkReady,
  merchantListBundles, merchantAddBundle, merchantUpdateBundle,
  merchantRemoveBundle, merchantSetBundleActive,
  merchantReorderBundles, merchantSetBundleSeason,
  merchantWallet, merchantInvoices, merchantConfirmReceipt,
  merchantSetHours, fetchStoreHours,
  fetchCategories, mapProduct,
} from '../lib/merchant.js';
import { uploadProductImage, uploadStoreCover, uploadStoreVideo } from '../lib/storage.js';
import { cleanProductImage } from '../lib/bgremove.js';
import { generateProductDescription, suggestBadge, suggestPrice, extractProductsFromImage, generateBundle } from '../lib/ai.js';
import CategoryPicker from './CategoryPicker.jsx';
import PushToggle from './PushToggle.jsx';
import InstallButton from './InstallButton.jsx';
import QRModal from './QRModal.jsx';
import { notifyCustomerStatus } from '../lib/push.js';
import { useOrderChime } from '../lib/alerts.js';
import { defaultHours, normalizeHours, DAYS_AR } from '../lib/storeHours.js';
import { NewOrderBanner, AlertBell } from './OrderAlert.jsx';

const STORE_TYPES = ['بقالة', 'مخبز', 'مطعم', 'خضار', 'فواكه', 'حلويات', 'لحوم', 'مشروبات', 'ألبان', 'أخرى'];

const fmt = (n) => (Number(n) || 0).toLocaleString('en-US');
const inp = 'w-full rounded-xl border border-ink/10 bg-beige px-3 py-2.5 text-sm text-ink outline-none focus:border-copper dark:border-white/10 dark:bg-night-900 dark:text-cream';

/* ───────────────────────── theme (standalone page) ───────────────────────── */
function useTheme() {
  const [dark, setDark] = useState(() => {
    try { return (localStorage.getItem('otlobha-theme') || 'light') === 'dark'; } catch { return false; }
  });
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    try { localStorage.setItem('otlobha-theme', dark ? 'dark' : 'light'); } catch {}
  }, [dark]);
  return [dark, () => setDark((d) => !d)];
}

/* ───────────────────────── login screen ───────────────────────── */
function MerchantLogin({ onLogin, dark, toggleTheme }) {
  const [username, setUsername] = useState('');
  const [pass, setPass] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [shake, setShake] = useState(false);

  async function submit() {
    if (!username.trim() || !pass) { setErr('اكتب اسم المستخدم وكلمة المرور'); setShake(true); setTimeout(() => setShake(false), 500); return; }
    setBusy(true); setErr('');
    const r = await merchantLogin(username.trim(), pass);
    setBusy(false);
    if (r?.ok && r.token) {
      onLogin({ token: r.token, store: r.store });
    } else {
      setErr(r?.error === 'bad_credentials' ? 'اسم المستخدم أو كلمة المرور غير صحيحة' : 'تعذّر الدخول، حاول مجدداً');
      setShake(true); setTimeout(() => setShake(false), 500);
    }
  }

  return (
    <div dir="rtl" className="flex min-h-screen items-center justify-center bg-gradient-to-b from-beige to-cream px-5 dark:from-night-900 dark:to-night">
      <button onClick={toggleTheme} className="fixed left-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-cream text-ink shadow-soft dark:bg-night-800 dark:text-cream">
        {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      </button>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className={`w-full max-w-sm rounded-[2rem] bg-cream p-7 shadow-card dark:bg-night-800 ${shake ? 'animate-[shake_0.4s]' : ''}`}>
        <div className="flex flex-col items-center text-center">
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-copper text-cream shadow-seal">
            <Store className="h-8 w-8" />
          </div>
          <h1 className="mt-4 font-display text-2xl font-black text-ink dark:text-cream">لوحة صاحب المتجر</h1>
          <p className="mt-1 font-body text-sm text-ink/50 dark:text-cream/50">سجّل الدخول لإدارة متجرك ومنتجاتك</p>
        </div>

        <div className="mt-6 space-y-3">
          <div className="relative">
            <User className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/30 dark:text-cream/30" />
            <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="اسم المستخدم"
              className={inp + ' pr-9'} dir="ltr" style={{ textAlign: 'right' }}
              onKeyDown={(e) => e.key === 'Enter' && submit()} />
          </div>
          <div className="relative">
            <Lock className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/30 dark:text-cream/30" />
            <input value={pass} onChange={(e) => setPass(e.target.value)} placeholder="كلمة المرور"
              type={show ? 'text' : 'password'} className={inp + ' pr-9 pl-9'} dir="ltr" style={{ textAlign: 'right' }}
              onKeyDown={(e) => e.key === 'Enter' && submit()} />
            <button type="button" onClick={() => setShow((s) => !s)}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/30 hover:text-ink/60 dark:text-cream/30">
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          {err && <div className="rounded-lg bg-red-500/10 px-3 py-2 text-center text-sm text-red-600 dark:text-red-300">{err}</div>}

          <button onClick={submit} disabled={busy}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-copper py-3 font-display font-bold text-cream transition hover:bg-copper-dark disabled:opacity-60">
            {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Store className="h-5 w-5" />} دخول
          </button>
        </div>

        <p className="mt-5 text-center font-body text-xs text-ink/40 dark:text-cream/40">
          ليس لديك حساب؟ تواصل مع إدارة «اطلبها» لإنشاء حساب متجرك.
        </p>
      </motion.div>
    </div>
  );
}

/* ───────────────────────── smart photo review (multi-product) ───────────────────────── */
function SmartReviewModal({ token, cats, items, onClose, onDone }) {
  const [rows, setRows] = useState(items.map((p) => ({ ...p, checked: true })));
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [err, setErr] = useState('');
  const chosen = rows.filter((r) => r.checked).length;

  function upd(i, patch) { setRows((r) => r.map((x, j) => (j === i ? { ...x, ...patch } : x))); }

  async function addAll() {
    const picks = rows.filter((r) => r.checked && r.name.trim());
    if (!picks.length) { setErr('اختر منتجاً واحداً على الأقل'); return; }
    setBusy(true); setErr(''); setProgress(0);
    let done = 0;
    for (const p of picks) {
      await merchantAddProduct(token, {
        name: p.name.trim(), category: p.category || cats[0] || 'عام',
        price: Math.max(0, parseInt(p.price, 10) || 0), unit: p.unit || 'وحدة', emoji: p.emoji || '🛒',
      });
      done += 1; setProgress(Math.round((done / picks.length) * 100));
    }
    setBusy(false); onDone(picks.length);
  }

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose} dir="rtl"
        className="fixed inset-0 z-[120] flex items-end justify-center bg-ink/50 backdrop-blur-sm sm:items-center sm:p-4">
        <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-[2rem] bg-cream p-6 shadow-card dark:bg-night-800 sm:rounded-[2rem]">
          <div className="mb-1 flex items-center justify-between">
            <h3 className="font-display text-xl font-black text-ink dark:text-cream">منتجات من الصورة</h3>
            <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full bg-ink/10 text-ink hover:bg-ink/20 dark:bg-white/10 dark:text-cream"><X className="h-4 w-4" /></button>
          </div>
          <p className="mb-4 font-body text-sm text-ink/50 dark:text-cream/50">الذكاء قرأ {rows.length} منتج — راجِعها وعدّلها ثم أضِف المحدّد.</p>

          <div className="space-y-2">
            {rows.map((r, i) => (
              <div key={i} className={`rounded-2xl p-3 ring-1 transition ${r.checked ? 'bg-cream ring-copper/30 dark:bg-night-900' : 'bg-ink/5 opacity-60 ring-transparent dark:bg-white/5'}`}>
                <div className="flex items-center gap-2">
                  <button onClick={() => upd(i, { checked: !r.checked })}
                    className={`grid h-6 w-6 shrink-0 place-items-center rounded-md border-2 transition ${r.checked ? 'border-copper bg-copper text-white' : 'border-ink/30 dark:border-white/30'}`}>
                    {r.checked && <Check className="h-3.5 w-3.5" />}
                  </button>
                  <input value={r.emoji} onChange={(e) => upd(i, { emoji: e.target.value })} maxLength={4}
                    className="h-9 w-10 rounded-lg border border-ink/10 bg-beige text-center text-base dark:border-white/10 dark:bg-night-800 dark:text-cream" />
                  <input value={r.name} onChange={(e) => upd(i, { name: e.target.value })} placeholder="اسم المنتج"
                    className="h-9 min-w-0 flex-1 rounded-lg border border-ink/10 bg-beige px-2 text-sm font-bold dark:border-white/10 dark:bg-night-800 dark:text-cream" />
                </div>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  <input value={r.price} onChange={(e) => upd(i, { price: e.target.value })} type="number" dir="ltr" placeholder="السعر"
                    className="h-9 rounded-lg border border-ink/10 bg-beige px-2 text-sm dark:border-white/10 dark:bg-night-800 dark:text-cream" />
                  <input value={r.unit} onChange={(e) => upd(i, { unit: e.target.value })} placeholder="الوحدة"
                    className="h-9 rounded-lg border border-ink/10 bg-beige px-2 text-sm dark:border-white/10 dark:bg-night-800 dark:text-cream" />
                  <CategoryPicker value={r.category} onChange={(v) => upd(i, { category: v })} options={cats} allowNew placeholder="القسم" />
                </div>
              </div>
            ))}
          </div>

          {err && <div className="mt-3 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-300">{err}</div>}

          <button onClick={addAll} disabled={busy}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-copper py-3 font-display font-bold text-cream hover:bg-copper-dark disabled:opacity-60">
            {busy ? <><Loader2 className="h-4 w-4 animate-spin" /> يضيف… {progress}%</> : <><Plus className="h-4 w-4" /> أضف المحدّد ({chosen})</>}
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/* ───────────────────────── product form modal ───────────────────────── */
const BADGES = ['', 'جديد', 'الأكثر مبيعاً', 'عرض خاص', 'محدود'];

function ProductForm({ token, cats, product, initial, onClose, onSaved }) {
  const editing = !!product;
  const base = product || initial || {};
  const [name, setName] = useState(base.name || '');
  const [category, setCategory] = useState(base.category || (cats[0] || 'عام'));
  const [price, setPrice] = useState(base.price != null ? String(base.price) : '');
  const [oldPrice, setOldPrice] = useState(base.oldPrice != null ? String(base.oldPrice) : '');
  const [unit, setUnit] = useState(base.unit || 'وحدة');
  const [emoji, setEmoji] = useState(base.emoji || '🛒');
  const [image, setImage] = useState(base.image || '');
  const [badge, setBadge] = useState(base.badge || '');
  const [description, setDescription] = useState(base.description || '');
  const [trackStock, setTrackStock] = useState(base.stock != null);
  const [stock, setStock] = useState(base.stock != null ? String(base.stock) : '');
  const [srcFile, setSrcFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const [cleanPct, setCleanPct] = useState(0);
  const [aiBusy, setAiBusy] = useState(false);
  const [badgeBusy, setBadgeBusy] = useState(false);
  const [priceBusy, setPriceBusy] = useState(false);
  const [priceNote, setPriceNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const fileRef = useRef(null);

  async function onFile(e) {
    const file = e.target.files?.[0]; e.target.value = '';
    if (!file) return;
    setSrcFile(file); setUploading(true); setErr('');
    const res = await uploadProductImage(file, product?.id || 'new');
    setUploading(false);
    if (res?.error) setErr(res.error); else setImage(res.url);
  }
  async function cleanBg() {
    if (!srcFile) { setErr('ارفع صورة أولاً ثم نظّف خلفيتها'); return; }
    setCleaning(true); setErr(''); setCleanPct(0);
    try {
      const blob = await cleanProductImage(srcFile, (p) => setCleanPct(p));
      const res = await uploadProductImage(blob, product?.id || 'new');
      if (res?.error) setErr(res.error); else setImage(res.url);
    } catch { setErr('تعذّر تنظيف الخلفية. جرّب صورة أوضح.'); }
    finally { setCleaning(false); }
  }
  async function genAI(style) {
    if (!name.trim()) { setErr('اكتب اسم المنتج أولاً لتوليد الوصف'); return; }
    setAiBusy(true); setErr('');
    try {
      const r = await generateProductDescription({
        name: name.trim(), category, unit, price: price ? Number(price) : undefined,
        style: style || undefined, current: style ? description : undefined,
      });
      if (r?.ok && r.description) setDescription(r.description);
      else setErr(r?.error || 'تعذّر توليد الوصف الآن.');
    } catch { setErr('تعذّر توليد الوصف الآن.'); }
    finally { setAiBusy(false); }
  }
  async function aiBadge() {
    if (!name.trim()) { setErr('اكتب اسم المنتج أولاً'); return; }
    setBadgeBusy(true); setErr('');
    try {
      const r = await suggestBadge({ name: name.trim(), category });
      if (r?.ok) setBadge(r.badge || '');
    } catch {} finally { setBadgeBusy(false); }
  }
  async function aiPrice() {
    if (!name.trim()) { setErr('اكتب اسم المنتج أولاً'); return; }
    setPriceBusy(true); setErr(''); setPriceNote('');
    try {
      const r = await suggestPrice({ name: name.trim(), category, unit });
      if (r?.ok && r.price) { setPrice(String(r.price)); setPriceNote(r.note || 'سعر استرشادي — عدّله كما تراه'); }
      else setErr(r?.error || 'تعذّر اقتراح السعر.');
    } catch { setErr('تعذّر اقتراح السعر.'); }
    finally { setPriceBusy(false); }
  }

  async function save() {
    if (!name.trim()) { setErr('اكتب اسم المنتج'); return; }
    setBusy(true); setErr('');
    const payload = {
      name: name.trim(), category, price: price === '' ? 0 : Math.max(0, parseInt(price, 10) || 0),
      oldPrice: oldPrice === '' ? null : Math.max(0, parseInt(oldPrice, 10) || 0),
      unit: unit.trim() || 'وحدة', emoji: emoji || '🛒', image, badge,
      description: description.trim() || null,
      stock: trackStock ? (stock === '' ? 0 : Math.max(0, parseInt(stock, 10) || 0)) : null,
    };
    const r = editing
      ? await merchantUpdateProduct(token, product.id, payload)
      : await merchantAddProduct(token, payload);
    setBusy(false);
    if (r?.ok) onSaved();
    else setErr(r?.error === 'unauthorized' ? 'انتهت الجلسة، سجّل الدخول مجدداً' : 'تعذّر الحفظ');
  }

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose} dir="rtl"
        className="fixed inset-0 z-[120] flex items-end justify-center bg-ink/50 backdrop-blur-sm sm:items-center sm:p-4">
        <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-[2rem] bg-cream p-6 shadow-card dark:bg-night-800 sm:rounded-[2rem]">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-xl font-black text-ink dark:text-cream">{editing ? 'تعديل منتج' : 'منتج جديد'}</h3>
            <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full bg-ink/10 text-ink hover:bg-ink/20 dark:bg-white/10 dark:text-cream"><X className="h-4 w-4" /></button>
          </div>

          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} />

          {/* image + emoji */}
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => fileRef.current?.click()}
              className="relative grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-2xl bg-white text-4xl ring-1 ring-ink/10 dark:ring-white/10">
              {uploading ? <Loader2 className="h-6 w-6 animate-spin text-copper" />
                : image ? <img src={image} alt="" className="h-full w-full object-contain p-1 mix-blend-multiply" />
                  : <span>{emoji}</span>}
              <span className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-0.5 bg-copper/90 py-0.5 text-[9px] font-bold text-white"><ImageIcon className="h-2.5 w-2.5" /> صورة</span>
            </button>
            <div className="flex-1 space-y-2">
              <div>
                <label className="mb-1 block text-[11px] font-bold text-ink/50 dark:text-cream/50">الإيموجي (يظهر إن لم توجد صورة)</label>
                <input value={emoji} onChange={(e) => setEmoji(e.target.value)} maxLength={4} className={inp + ' text-center text-lg'} />
              </div>
              {srcFile && (
                <button type="button" onClick={cleanBg} disabled={cleaning || uploading}
                  className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 px-2.5 py-1.5 text-[12px] font-bold text-white transition hover:opacity-90 disabled:opacity-60">
                  {cleaning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                  {cleaning ? (cleanPct ? `ينظّف… ${cleanPct}%` : 'يحمّل…') : 'نظّف خلفية الصورة'}
                </button>
              )}
              {image && !cleaning && <button type="button" onClick={() => { setImage(''); setSrcFile(null); }} className="text-[12px] font-bold text-red-600 dark:text-red-300">إزالة الصورة</button>}
            </div>
          </div>

          <div className="mt-4 space-y-3">
            <div>
              <label className="mb-1 block text-[11px] font-bold text-ink/50 dark:text-cream/50">اسم المنتج</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className={inp} placeholder="مثلاً: تفاح أحمر" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-[11px] font-bold text-ink/50 dark:text-cream/50">التصنيف</label>
                <CategoryPicker value={category} onChange={setCategory} options={cats} allowNew placeholder="اختر أو أضف تصنيفاً" />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-bold text-ink/50 dark:text-cream/50">الوحدة</label>
                <input value={unit} onChange={(e) => setUnit(e.target.value)} className={inp} placeholder="كيلو / قطعة / علبة" />
              </div>
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <label className="text-[11px] font-bold text-ink/50 dark:text-cream/50">السعر (د.ع)</label>
                  <button type="button" onClick={aiPrice} disabled={priceBusy}
                    className="flex items-center gap-1 rounded-md bg-gradient-to-br from-indigo-500 to-purple-600 px-1.5 py-0.5 text-[10px] font-bold text-white hover:opacity-90 disabled:opacity-60">
                    {priceBusy ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : <Sparkles className="h-2.5 w-2.5" />} اقترح
                  </button>
                </div>
                <input value={price} onChange={(e) => setPrice(e.target.value)} type="number" dir="ltr" className={inp} placeholder="1000" />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-bold text-ink/50 dark:text-cream/50">السعر قبل الخصم (اختياري)</label>
                <input value={oldPrice} onChange={(e) => setOldPrice(e.target.value)} type="number" dir="ltr" className={inp} placeholder="اتركه فارغاً" />
              </div>
            </div>

            {/* stock */}
            {priceNote && <p className="-mt-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-300">💡 {priceNote}</p>}
            <div className="rounded-xl bg-ink/5 p-3 dark:bg-white/5">
              <label className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-sm font-bold text-ink dark:text-cream"><Package className="h-4 w-4 text-copper" /> تتبّع الكمية</span>
                <button type="button" onClick={() => setTrackStock((v) => !v)}
                  className={`relative h-6 w-11 rounded-full transition ${trackStock ? 'bg-copper' : 'bg-ink/20 dark:bg-white/20'}`}>
                  <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${trackStock ? 'right-0.5' : 'right-5'}`} />
                </button>
              </label>
              {trackStock && (
                <input value={stock} onChange={(e) => setStock(e.target.value)} type="number" dir="ltr"
                  className={inp + ' mt-2'} placeholder="الكمية المتوفّرة" />
              )}
              {!trackStock && <p className="mt-1.5 text-[11px] text-ink/40 dark:text-cream/40">غير مفعّل = متوفّر دائماً (بدون عدّ)</p>}
            </div>

            {/* badge */}
            <div>
              <div className="mb-1 flex items-center justify-between">
                <label className="text-[11px] font-bold text-ink/50 dark:text-cream/50">شارة (اختياري)</label>
                <button type="button" onClick={aiBadge} disabled={badgeBusy}
                  className="flex items-center gap-1 rounded-md bg-gradient-to-br from-indigo-500 to-purple-600 px-1.5 py-0.5 text-[10px] font-bold text-white hover:opacity-90 disabled:opacity-60">
                  {badgeBusy ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : <Sparkles className="h-2.5 w-2.5" />} اقترح شارة
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {BADGES.map((b) => (
                  <button key={b || 'none'} type="button" onClick={() => setBadge(b)}
                    className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${badge === b ? 'bg-copper text-cream' : 'bg-ink/5 text-ink/60 hover:bg-ink/10 dark:bg-white/10 dark:text-cream/60'}`}>
                    {b || 'بدون'}
                  </button>
                ))}
              </div>
            </div>

            {/* description + AI */}
            <div>
              <div className="mb-1 flex items-center justify-between">
                <label className="text-[11px] font-bold text-ink/50 dark:text-cream/50">الوصف (اختياري)</label>
                <button type="button" onClick={() => genAI()} disabled={aiBusy}
                  className="flex items-center gap-1 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 px-2 py-1 text-[11px] font-bold text-white transition hover:opacity-90 disabled:opacity-60">
                  {aiBusy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />} توليد بالذكاء
                </button>
              </div>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className={inp} placeholder="وصف قصير يجذب الزبون…" />
              {description.trim() && (
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] font-bold text-ink/40 dark:text-cream/40">تحسين:</span>
                  {[['shorter', 'أقصر'], ['longer', 'أطول'], ['persuasive', 'أكثر إقناعاً']].map(([s, label]) => (
                    <button key={s} type="button" onClick={() => genAI(s)} disabled={aiBusy}
                      className="rounded-full bg-indigo-500/10 px-2.5 py-1 text-[11px] font-bold text-indigo-600 transition hover:bg-indigo-500/20 disabled:opacity-60 dark:text-indigo-300">
                      {label}
                    </button>
                  ))}
                  {aiBusy && <Loader2 className="h-3 w-3 animate-spin text-indigo-500" />}
                </div>
              )}
            </div>

            {err && <div className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-300">{err}</div>}

            <div className="flex gap-2 pt-1">
              <button onClick={save} disabled={busy || uploading || cleaning}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-copper py-3 font-display font-bold text-cream hover:bg-copper-dark disabled:opacity-60">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} {editing ? 'حفظ التعديلات' : 'إضافة المنتج'}
              </button>
              <button onClick={onClose} className="rounded-xl bg-ink/5 px-5 py-3 font-bold text-ink/70 hover:bg-ink/10 dark:bg-white/5 dark:text-cream/70">إلغاء</button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/* ───────────────────────── store branding editor ───────────────────────── */
function HoursEditor({ token, storeId }) {
  const [hours, setHours] = useState(null);
  const [manualClosed, setManualClosed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    let alive = true;
    fetchStoreHours(storeId).then((r) => {
      if (!alive) return;
      setHours(normalizeHours(r?.hours) || defaultHours());
      setManualClosed(!!r?.manualClosed);
      setLoaded(true);
    });
    return () => { alive = false; };
  }, [storeId]);

  const setDay = (i, patch) => setHours((h) => ({ ...h, [i]: { ...h[i], ...patch } }));
  const applyToAll = () => setHours((h) => { const d = h[0]; const n = {}; for (let k = 0; k < 7; k++) n[k] = { ...d }; return n; });

  async function toggleManual() {
    const val = !manualClosed;
    setManualClosed(val);
    await merchantSetHours(token, null, val);
    setMsg(val ? '🔴 متجرك صار «مغلق الآن» — لن يستقبل طلبات حتى تفتحه' : '🟢 متجرك يفتح حسب الساعات المحدّدة');
    setTimeout(() => setMsg(''), 3500);
  }

  async function save() {
    setBusy(true); setMsg('');
    const r = await merchantSetHours(token, hours, manualClosed);
    setBusy(false);
    setMsg(r?.ok ? 'تم حفظ ساعات العمل ✓' : 'تعذّر الحفظ، حاول ثانية');
    setTimeout(() => setMsg(''), 3000);
  }

  const tinp = 'rounded-lg border border-ink/10 bg-beige px-2 py-1.5 text-sm text-ink outline-none focus:border-copper dark:border-white/10 dark:bg-night-900 dark:text-cream';

  return (
    <div className="rounded-2xl bg-brand-800/5 p-3.5 ring-1 ring-brand-800/10">
      <span className="mb-1 flex items-center gap-1.5 font-display text-sm font-black text-ink dark:text-cream"><Clock className="h-4 w-4 text-copper" /> ساعات العمل وحالة المتجر</span>
      <p className="mb-3 text-[11px] leading-snug text-ink/50 dark:text-cream/50">حدّد متى متجرك مفتوح — الزبون يشوف «مفتوح / مغلق» مباشرة، ويگدر يفلتر «المفتوح الآن».</p>

      {!loaded ? (
        <div className="flex items-center gap-2 py-3 text-sm text-ink/50 dark:text-cream/50"><Loader2 className="h-4 w-4 animate-spin text-copper" /> يحمّل…</div>
      ) : (
        <>
          {/* quick "closed now" switch */}
          <button type="button" onClick={toggleManual}
            className={`mb-3 flex w-full items-center justify-between gap-2 rounded-xl px-3.5 py-3 ring-1 transition ${manualClosed ? 'bg-red-500/10 ring-red-500/30' : 'bg-green-500/10 ring-green-500/25'}`}>
            <span className="text-right">
              <span className={`block font-display text-sm font-black ${manualClosed ? 'text-red-600 dark:text-red-300' : 'text-green-700 dark:text-green-300'}`}>{manualClosed ? 'مغلق الآن مؤقتاً' : 'المتجر يعمل حسب الساعات'}</span>
              <span className="block text-[11px] text-ink/50 dark:text-cream/50">{manualClosed ? 'اضغط لإعادة الفتح' : 'اضغط لإغلاق فوري مؤقت (مثلاً مزدحم)'}</span>
            </span>
            <span dir="ltr" className={`relative h-7 w-[52px] shrink-0 rounded-full transition-colors ${manualClosed ? 'bg-red-500' : 'bg-green-500'}`}>
              <span className={`absolute top-1/2 grid h-5 w-5 -translate-y-1/2 place-items-center rounded-full bg-white shadow transition-all ${manualClosed ? 'left-1' : 'left-[26px]'}`}>
                {manualClosed ? <Ban className="h-3 w-3 text-red-500" /> : <Check className="h-3 w-3 text-green-600" />}
              </span>
            </span>
          </button>

          {/* weekly schedule */}
          <div className={manualClosed ? 'pointer-events-none opacity-50' : ''}>
            <div className="space-y-1.5">
              {DAYS_AR.map((name, i) => {
                const d = hours[i];
                return (
                  <div key={i} className="flex items-center gap-2">
                    <span className="w-12 shrink-0 font-body text-[13px] font-bold text-ink/70 dark:text-cream/70">{name}</span>
                    <button type="button" onClick={() => setDay(i, { closed: !d.closed })}
                      className={`w-16 shrink-0 rounded-lg py-1.5 text-[12px] font-bold transition ${d.closed ? 'bg-ink/10 text-ink/50 dark:bg-white/10 dark:text-cream/50' : 'bg-green-500/15 text-green-700 dark:text-green-300'}`}>
                      {d.closed ? 'مغلق' : 'مفتوح'}
                    </button>
                    {!d.closed ? (
                      <div className="flex flex-1 items-center gap-1.5">
                        <input type="time" dir="ltr" value={d.open} onChange={(e) => setDay(i, { open: e.target.value })} className={`${tinp} flex-1`} />
                        <span className="text-ink/40 dark:text-cream/40">–</span>
                        <input type="time" dir="ltr" value={d.close} onChange={(e) => setDay(i, { close: e.target.value })} className={`${tinp} flex-1`} />
                      </div>
                    ) : (
                      <span className="flex-1 text-[12px] text-ink/30 dark:text-cream/30">—</span>
                    )}
                  </div>
                );
              })}
            </div>
            <button type="button" onClick={applyToAll} className="mt-2.5 flex items-center gap-1.5 rounded-lg bg-ink/5 px-3 py-1.5 text-[12px] font-bold text-ink/70 hover:bg-ink/10 dark:bg-white/10 dark:text-cream/70">
              <Copy className="h-3.5 w-3.5" /> طبّق ساعات «الأحد» على كل الأيام
            </button>
          </div>

          {msg && <p className="mt-2.5 text-[12px] font-bold text-brand-700 dark:text-brand-300">{msg}</p>}

          <button type="button" onClick={save} disabled={busy}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-700 py-2.5 font-display font-bold text-cream shadow-soft transition hover:bg-brand-800 disabled:opacity-60">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} حفظ ساعات العمل
          </button>
        </>
      )}
    </div>
  );
}

function StoreEditor({ token, store, onSaved }) {
  const [category, setCategory] = useState(store.category || '');
  const [tagline, setTagline] = useState(store.tagline || '');
  const [phone, setPhone] = useState(store.phone || '');
  const [logo, setLogo] = useState(store.logo || '');
  const [cover, setCover] = useState(store.cover || '');
  const [coverVideo, setCoverVideo] = useState(store.cover_video || store.coverVideo || '');
  const [srcLogo, setSrcLogo] = useState(null);
  const [busyLogo, setBusyLogo] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const [cleanPct, setCleanPct] = useState(0);
  const [covBusy, setCovBusy] = useState(false);
  const [vidBusy, setVidBusy] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [ok, setOk] = useState(false);
  const [lat, setLat] = useState(store.lat ?? null);
  const [lng, setLng] = useState(store.lng ?? null);
  const [geoBusy, setGeoBusy] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [geoMsg, setGeoMsg] = useState('');
  const logoRef = useRef(null); const coverRef = useRef(null); const videoRef = useRef(null);

  function captureLocation() {
    if (!('geolocation' in navigator)) { setGeoMsg('جهازك لا يدعم تحديد الموقع'); return; }
    setGeoBusy(true); setGeoMsg('');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const la = pos.coords.latitude, ln = pos.coords.longitude;
        const r = await merchantSetLocation(token, la, ln);
        setGeoBusy(false);
        if (r?.ok) { setLat(la); setLng(ln); setGeoMsg('تم حفظ الموقع ✓'); setTimeout(() => setGeoMsg(''), 2500); }
        else setGeoMsg('تعذّر حفظ الموقع، حاول ثانية');
      },
      (e) => {
        setGeoBusy(false);
        setGeoMsg(e && e.code === 1 ? 'رُفض إذن الموقع — فعّله من إعدادات المتصفّح' : 'تعذّر تحديد الموقع، حاول ثانية');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  async function onLogo(e) {
    const f = e.target.files?.[0]; e.target.value = ''; if (!f) return;
    setSrcLogo(f); setBusyLogo(true); setErr('');
    const r = await uploadProductImage(f, 'store-' + store.id); setBusyLogo(false);
    if (r?.error) setErr(r.error); else setLogo(r.url);
  }
  async function cleanLogo() {
    if (!srcLogo) { setErr('ارفع شعاراً أولاً'); return; }
    setCleaning(true); setErr(''); setCleanPct(0);
    try { const blob = await cleanProductImage(srcLogo, (p) => setCleanPct(p)); const r = await uploadProductImage(blob, 'store-' + store.id); if (r?.error) setErr(r.error); else setLogo(r.url); }
    catch { setErr('تعذّر تنظيف الخلفية.'); } finally { setCleaning(false); }
  }
  async function onCover(e) {
    const f = e.target.files?.[0]; e.target.value = ''; if (!f) return;
    setCovBusy(true); setErr(''); const r = await uploadStoreCover(f, store.id); setCovBusy(false);
    if (r?.error) setErr(r.error); else setCover(r.url);
  }
  async function onVideo(e) {
    const f = e.target.files?.[0]; e.target.value = ''; if (!f) return;
    setVidBusy(true); setErr(''); const r = await uploadStoreVideo(f, store.id); setVidBusy(false);
    if (r?.error) setErr(r.error); else setCoverVideo(r.url);
  }
  async function save() {
    setBusy(true); setErr(''); setOk(false);
    const r = await merchantUpdateStore(token, { category: category.trim(), tagline: tagline.trim(), phone: phone.trim(), logo, cover, coverVideo });
    setBusy(false);
    if (r?.ok) { setOk(true); onSaved?.(r.store); setTimeout(() => setOk(false), 2000); }
    else setErr(r?.error === 'unauthorized' ? 'انتهت الجلسة، سجّل الدخول مجدداً' : 'تعذّر الحفظ');
  }

  return (
    <div className="space-y-5">
      <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={onLogo} />
      <input ref={coverRef} type="file" accept="image/*" className="hidden" onChange={onCover} />
      <input ref={videoRef} type="file" accept="video/*" className="hidden" onChange={onVideo} />

      {/* cover */}
      <div>
        <span className="mb-1.5 block font-body text-sm font-bold text-ink dark:text-cream">غلاف المتجر (صورة وفيديو)</span>
        <div className="relative h-36 w-full overflow-hidden rounded-2xl bg-ink/5 ring-1 ring-ink/10 dark:bg-white/5 dark:ring-white/10">
          {coverVideo ? <video className="h-full w-full object-cover" src={coverVideo} autoPlay muted loop playsInline poster={cover || undefined} />
            : cover ? <img src={cover} alt="" className="h-full w-full object-cover" />
              : <div className="grid h-full w-full place-items-center text-sm text-ink/40 dark:text-cream/40">لا يوجد غلاف بعد</div>}
          {(covBusy || vidBusy) && <div className="absolute inset-0 grid place-items-center bg-black/40"><Loader2 className="h-6 w-6 animate-spin text-white" /></div>}
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          <button type="button" onClick={() => coverRef.current?.click()} disabled={covBusy} className="flex items-center gap-1.5 rounded-lg bg-ink/5 px-3 py-1.5 text-[12px] font-bold text-ink/70 hover:bg-ink/10 disabled:opacity-60 dark:bg-white/10 dark:text-cream/70"><ImageIcon className="h-3.5 w-3.5" /> {cover ? 'تغيير الصورة' : 'صورة غلاف'}</button>
          <button type="button" onClick={() => videoRef.current?.click()} disabled={vidBusy} className="flex items-center gap-1.5 rounded-lg bg-ink/5 px-3 py-1.5 text-[12px] font-bold text-ink/70 hover:bg-ink/10 disabled:opacity-60 dark:bg-white/10 dark:text-cream/70"><Camera className="h-3.5 w-3.5" /> {coverVideo ? 'تغيير الفيديو' : 'فيديو (اختياري)'}</button>
          {cover && <button type="button" onClick={() => setCover('')} className="text-[12px] font-bold text-red-600 dark:text-red-300">حذف الصورة</button>}
          {coverVideo && <button type="button" onClick={() => setCoverVideo('')} className="text-[12px] font-bold text-red-600 dark:text-red-300">حذف الفيديو</button>}
        </div>
      </div>

      {/* logo */}
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => logoRef.current?.click()} className="relative grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-2xl bg-white text-3xl ring-1 ring-ink/10 dark:ring-white/10">
          {busyLogo ? <Loader2 className="h-6 w-6 animate-spin text-copper" /> : logo ? <img src={logo} alt="" className="h-full w-full object-contain p-1 mix-blend-multiply" /> : <span>🏪</span>}
          <span className="absolute inset-x-0 bottom-0 bg-copper/90 py-0.5 text-center text-[9px] font-bold text-white">شعار</span>
        </button>
        <div className="text-[11px] leading-relaxed text-ink/50 dark:text-cream/50">
          شعار المتجر (يظهر دائرياً). الأفضل خلفية بيضاء.
          {srcLogo && <button type="button" onClick={cleanLogo} disabled={cleaning} className="mt-2 flex items-center gap-1.5 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 px-2.5 py-1.5 text-[12px] font-bold text-white hover:opacity-90 disabled:opacity-60">{cleaning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}{cleaning ? (cleanPct ? `ينظّف… ${cleanPct}%` : 'يحمّل…') : 'نظّف الخلفية'}</button>}
          {logo && !cleaning && <button type="button" onClick={() => { setLogo(''); setSrcLogo(null); }} className="mt-1 block font-bold text-red-600 dark:text-red-300">إزالة الشعار</button>}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-[11px] font-bold text-ink/50 dark:text-cream/50">التصنيف</label>
          <CategoryPicker value={category} onChange={setCategory} options={STORE_TYPES} allowNew placeholder="مثلاً: مطعم" />
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-bold text-ink/50 dark:text-cream/50">هاتف المتجر</label>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} dir="ltr" className={inp} placeholder="07XXXXXXXXX" />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-[11px] font-bold text-ink/50 dark:text-cream/50">وصف قصير للمتجر</label>
          <input value={tagline} onChange={(e) => setTagline(e.target.value)} className={inp} placeholder="مثلاً: أطيب خبز طازج في السماوة" />
        </div>
      </div>

      {/* device push notifications */}
      <div className="rounded-2xl bg-copper/[0.06] p-3.5 ring-1 ring-copper/15">
        <span className="mb-1 flex items-center gap-1.5 font-display text-sm font-black text-ink dark:text-cream"><BellRing className="h-4 w-4 text-copper" /> إشعارات الطلبات الجديدة</span>
        <p className="mb-2.5 text-[11px] leading-snug text-ink/50 dark:text-cream/50">فعّلها لتصلك تنبيهات الطلبات على جهازك حتى لو التطبيق مسكّر.</p>
        <PushToggle partyType="merchant" partyId={store.id} />
      </div>

      <InstallButton variant="card" />

      <div className="rounded-2xl bg-brand-800/5 p-3.5 ring-1 ring-brand-800/10">
        <span className="mb-1 flex items-center gap-1.5 font-display text-sm font-black text-ink dark:text-cream"><QrCode className="h-4 w-4 text-copper" /> رمز QR لمتجرك</span>
        <p className="mb-2.5 text-[11px] leading-snug text-ink/50 dark:text-cream/50">اطبعه وعلّقه في محلّك — الزبون يمسحه فيفتح متجرك مباشرة.</p>
        <button type="button" onClick={() => setQrOpen(true)}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-700 py-3 font-display font-bold text-cream shadow-soft transition hover:bg-brand-800 active:scale-[.99]">
          <QrCode className="h-5 w-5" /> اعرض رمز QR
        </button>
      </div>
      {qrOpen && (
        <QRModal path={`/s/${store.name}`} title={store.name} subtitle={store.tagline || 'متجر في اطلبها'} onClose={() => setQrOpen(false)} />
      )}

      {/* store location for driver navigation */}
      <div className="rounded-2xl bg-brand-800/5 p-3.5 ring-1 ring-brand-800/10">
        <span className="mb-1 flex items-center gap-1.5 font-display text-sm font-black text-ink dark:text-cream"><MapPin className="h-4 w-4 text-copper" /> موقع المتجر على الخريطة</span>
        <p className="mb-2.5 text-[11px] leading-snug text-ink/50 dark:text-cream/50">يساعد المندوب يوصل متجرك بسرعة. كن داخل المتجر واضغط الزر مرّة واحدة.</p>
        <button onClick={captureLocation} disabled={geoBusy}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-700 py-3 font-display font-bold text-cream shadow-soft transition hover:bg-brand-800 active:scale-[.99] disabled:opacity-60">
          {geoBusy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Navigation className="h-5 w-5" />}
          {lat && lng ? 'تحديث موقعي الحالي' : 'استخدم موقعي الحالي'}
        </button>
        {lat && lng && (
          <div className="mt-2 flex items-center justify-between gap-2 rounded-xl bg-green-500/10 px-3 py-2 ring-1 ring-green-500/20">
            <span className="flex items-center gap-1 text-xs font-bold text-green-700 dark:text-green-300"><Check className="h-3.5 w-3.5" /> الموقع محفوظ</span>
            <a href={`https://www.google.com/maps?q=${lat},${lng}`} target="_blank" rel="noreferrer"
              className="flex items-center gap-1 rounded-lg bg-white/70 px-2.5 py-1 text-[11px] font-bold text-brand-800 dark:bg-white/10 dark:text-brand-300">
              <MapPin className="h-3 w-3" /> معاينة على الخريطة
            </a>
          </div>
        )}
        {geoMsg && <p className="mt-1.5 text-[11px] font-bold text-amber-600 dark:text-amber-300">{geoMsg}</p>}
      </div>

      {/* opening hours + open/closed status */}
      <HoursEditor token={token} storeId={store.id} />

      {err && <div className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-300">{err}</div>}
      {ok && <div className="flex items-center gap-2 rounded-lg bg-green-500/10 px-3 py-2 text-sm font-bold text-green-600 dark:text-green-300"><Check className="h-4 w-4" /> تم حفظ بيانات المتجر</div>}

      <button onClick={save} disabled={busy || covBusy || vidBusy || busyLogo || cleaning}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-copper py-3 font-display font-bold text-cream hover:bg-copper-dark disabled:opacity-60">
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} حفظ بيانات المتجر
      </button>
    </div>
  );
}

/* ───────────────────────── product row ───────────────────────── */
function ProductRow({ token, p, onEdit, onChanged }) {
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const out = p.stock != null && p.stock <= 0;

  async function toggle() {
    setBusy(true);
    await merchantSetProductActive(token, p.id, !p.active);
    setBusy(false); onChanged();
  }
  async function remove() {
    setBusy(true);
    await merchantRemoveProduct(token, p.id);
    setBusy(false); onChanged();
  }

  return (
    <div className={`flex items-center gap-3 rounded-2xl bg-cream p-3 ring-1 ring-brand-900/5 dark:bg-night-800 dark:ring-white/10 ${!p.active ? 'opacity-60' : ''}`}>
      <span className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-xl bg-white text-2xl ring-1 ring-ink/5">
        {p.image ? <img src={p.image} alt="" className="h-full w-full object-contain p-0.5 mix-blend-multiply" /> : <span>{p.emoji}</span>}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h4 className="truncate font-display text-sm font-bold text-ink dark:text-cream">{p.name}</h4>
          {p.badge && <span className="shrink-0 rounded-full bg-copper/15 px-1.5 py-0.5 text-[9px] font-bold text-copper-dark dark:text-copper-light">{p.badge}</span>}
        </div>
        <div className="mt-0.5 flex items-center gap-2 text-xs">
          <span className="font-black text-copper dark:text-copper-light">{fmt(p.price)} د.ع</span>
          {p.old_price > 0 && <span className="text-ink/40 line-through dark:text-cream/40">{fmt(p.old_price)}</span>}
          <span className="text-ink/40 dark:text-cream/40">/ {p.unit}</span>
        </div>
        <div className="mt-0.5 text-[11px]">
          {p.stock == null ? <span className="text-ink/40 dark:text-cream/40">متوفّر دائماً</span>
            : out ? <span className="font-bold text-red-600 dark:text-red-300">نفد المخزون</span>
              : <span className="text-ink/50 dark:text-cream/50">بقي {p.stock}</span>}
        </div>
      </div>
      <div className="flex shrink-0 flex-col gap-1.5">
        <div className="flex gap-1.5">
          <button onClick={() => onEdit(mapProduct(p))} className="grid h-8 w-8 place-items-center rounded-lg bg-ink/5 text-ink/60 hover:bg-ink/10 dark:bg-white/10 dark:text-cream/60" title="تعديل"><Pencil className="h-4 w-4" /></button>
          <button onClick={toggle} disabled={busy} className="grid h-8 w-8 place-items-center rounded-lg bg-ink/5 text-ink/60 hover:bg-ink/10 dark:bg-white/10 dark:text-cream/60" title={p.active ? 'إخفاء' : 'إظهار'}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : p.active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
          </button>
          {confirm ? (
            <button onClick={remove} disabled={busy} className="grid h-8 w-8 place-items-center rounded-lg bg-red-500 text-white" title="تأكيد الحذف"><Check className="h-4 w-4" /></button>
          ) : (
            <button onClick={() => setConfirm(true)} className="grid h-8 w-8 place-items-center rounded-lg bg-red-500/10 text-red-600 hover:bg-red-500/20 dark:text-red-300" title="حذف"><Trash2 className="h-4 w-4" /></button>
          )}
        </div>
        {confirm && <button onClick={() => setConfirm(false)} className="text-[10px] font-bold text-ink/40 dark:text-cream/40">تراجع</button>}
      </div>
    </div>
  );
}

/* ───────────────────────── dashboard ───────────────────────── */
// ───────────────────────── merchant orders (read-only, scoped to this store) ─────────────────────────
const ORDER_STATUS = {
  new: ['جديد', 'bg-blue-500/15 text-blue-600 dark:text-blue-300'],
  preparing: ['قيد التحضير', 'bg-amber-500/15 text-amber-600 dark:text-amber-300'],
  delivering: ['جارٍ التوصيل', 'bg-purple-500/15 text-purple-600 dark:text-purple-300'],
  done: ['تم', 'bg-green-500/15 text-green-600 dark:text-green-300'],
  cancelled: ['ملغى', 'bg-red-500/15 text-red-600 dark:text-red-300'],
};
const fmtOrderDate = (iso) => {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('ar', { month: 'short', day: 'numeric' }) + ' · ' +
      d.toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit' });
  } catch { return ''; }
};

const ORDER_FILTERS = [
  ['all', 'الكل'], ['new', 'جديد'], ['preparing', 'قيد التحضير'],
  ['delivering', 'جارٍ التوصيل'], ['done', 'تم'],
];
const onlyDigits = (s) => (s || '').replace(/[^\d]/g, '');

function OrdersList({ token, orders, onReload }) {
  const [busyItem, setBusyItem] = useState(null);
  const [busyReady, setBusyReady] = useState(null);
  const [filter, setFilter] = useState('all');
  const maxQty = useRef({}); // capture original ordered qty per item to cap "+"

  // record the highest-seen qty for each item so the merchant can restore (but not inflate beyond the order)
  useEffect(() => {
    for (const o of orders || []) {
      for (const it of o.items || []) {
        const k = `${o.id}:${it.name}`;
        if (maxQty.current[k] == null || it.qty > maxQty.current[k]) maxQty.current[k] = it.qty;
      }
    }
  }, [orders]);

  async function setQty(orderId, name, newQty) {
    if (newQty <= 0 && !window.confirm(`إزالة «${name}» من الطلب؟\nسيُخصم من حساب الزبون تلقائياً.`)) return;
    setBusyItem(`${orderId}:${name}`);
    const r = await merchantSetItemQty(token, orderId, name, newQty);
    setBusyItem(null);
    if (r?.ok) { await onReload?.(); }
    else alert('تعذّر التحديث. حاول ثانية.');
  }

  async function markReady(orderId, currentlyReady) {
    setBusyReady(orderId);
    const r = currentlyReady ? await merchantUnmarkReady(token, orderId) : await merchantMarkReady(token, orderId);
    setBusyReady(null);
    if (r?.ok) {
      if (!currentlyReady) notifyCustomerStatus(orderId, 'ready');
      await onReload?.();
    }
    else alert('تعذّر التحديث. حاول ثانية.');
  }

  const list = orders || [];
  const shown = filter === 'all' ? list : list.filter((o) => o.status === filter);
  const counts = list.reduce((acc, o) => { acc[o.status] = (acc[o.status] || 0) + 1; return acc; }, {});

  const today = new Date().toDateString();
  const todayOrders = list.filter((o) => o.created_at && new Date(o.created_at).toDateString() === today);
  const todayEarnings = todayOrders.reduce((s, o) => s + (Number(o.subtotal) || 0), 0);

  const DELIV = { assigned: 'مُسند', picked: 'استلم', on_way: 'في الطريق', arrived: 'وصل', delivered: 'سُلّم' };

  return (
    <>
      <div className="mb-3">
        <h2 className="font-display text-xl font-black text-ink dark:text-cream">طلبات متجري</h2>
        <p className="font-body text-xs text-ink/50 dark:text-cream/50">{list.length} طلب · {todayOrders.length} اليوم</p>
      </div>

      {/* today's earnings */}
      {todayOrders.length > 0 && (
        <div className="mb-4 flex items-center justify-between rounded-2xl bg-gradient-to-br from-green-500/15 to-emerald-500/10 p-3.5 ring-1 ring-green-500/20">
          <span className="flex items-center gap-1.5 text-sm font-bold text-green-700 dark:text-green-300"><Tag className="h-4 w-4" /> قيمة منتجاتك اليوم</span>
          <span className="font-display text-xl font-black text-green-700 dark:text-green-300">{fmt(todayEarnings)} <span className="text-xs">د.ع</span></span>
        </div>
      )}

      {/* status filters */}
      <div className="mb-4 flex flex-wrap gap-2">
        {ORDER_FILTERS.map(([k, label]) => (
          <button key={k} onClick={() => setFilter(k)}
            className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${filter === k ? 'bg-copper text-cream shadow-soft' : 'bg-ink/5 text-ink/55 hover:bg-ink/10 dark:bg-white/10 dark:text-cream/55'}`}>
            {label}{k !== 'all' && counts[k] > 0 && <span className="mr-1 opacity-70">({counts[k]})</span>}
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ink/15 py-16 text-center dark:border-white/15">
          <ClipboardList className="mx-auto mb-3 h-10 w-10 text-ink/20 dark:text-cream/20" />
          <p className="font-bold text-ink/50 dark:text-cream/50">لا توجد طلبات{filter !== 'all' ? ' في هذا القسم' : ' بعد'}</p>
          <p className="mt-1 text-xs text-ink/40 dark:text-cream/40">ستظهر هنا الطلبات التي تحتوي منتجاتك تلقائياً.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {shown.map((o) => {
            const [label, cls] = ORDER_STATUS[o.status] || ['—', 'bg-ink/10 text-ink/60'];
            const items = o.items || [];
            const removed = o.removed_items || [];
            const canEdit = o.status !== 'done' && o.status !== 'cancelled';
            const isNew = o.status === 'new';
            const dphone = o.driver_phone;
            return (
              <div key={o.id} className={`rounded-2xl bg-cream p-4 shadow-soft ring-1 dark:bg-night-800 ${isNew ? 'ring-2 ring-copper/40' : 'ring-brand-900/5 dark:ring-white/10'}`}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-display font-black text-ink dark:text-cream">طلب #{o.order_no || '—'}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${cls}`}>{label}</span>
                    </div>
                    <p className="mt-0.5 flex items-center gap-2 text-xs text-ink/45 dark:text-cream/45">
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {fmtOrderDate(o.created_at)}</span>
                      {o.area && <span className="flex items-center gap-0.5"><MapPin className="h-3 w-3" /> {o.area}</span>}
                    </p>
                  </div>
                  <div className="text-left">
                    <div className="text-[10px] text-ink/40 dark:text-cream/40">قيمة منتجاتك</div>
                    <div className="font-display font-black text-copper dark:text-copper-light">{fmt(o.subtotal)} <span className="text-xs">د.ع</span></div>
                  </div>
                </div>

                {/* driver (no customer data) */}
                <div className="mt-2 flex items-center justify-between gap-2 rounded-xl bg-ink/[0.03] px-3 py-2 dark:bg-white/[0.03]">
                  <span className="flex items-center gap-1.5 text-xs font-bold text-ink/70 dark:text-cream/70">
                    <Truck className="h-3.5 w-3.5 text-copper" />
                    {o.driver_name ? `المندوب: ${o.driver_name}` : 'لم يُسنَد مندوب بعد'}
                  </span>
                  {dphone && (
                    <span className="flex gap-1.5">
                      <a href={`https://wa.me/${onlyDigits(dphone)}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 rounded-lg bg-[#25D366]/15 px-2 py-1 text-[11px] font-bold text-[#1aa851] dark:text-[#3ddc7f]"><MessageCircle className="h-3 w-3" /> واتساب</a>
                      <a href={`tel:${dphone}`} className="flex items-center gap-1 rounded-lg bg-ink/10 px-2 py-1 text-[11px] font-bold text-ink/70 dark:bg-white/10 dark:text-cream/70"><Phone className="h-3 w-3" /> اتصال</a>
                    </span>
                  )}
                </div>

                {/* items with quantity stepper */}
                <div className="mt-3 space-y-1 rounded-xl bg-ink/[0.03] p-2 dark:bg-white/[0.03]">
                  {items.length === 0 && <p className="px-1 py-2 text-center text-xs text-ink/40 dark:text-cream/40">لا منتجات لك في هذا الطلب الآن.</p>}
                  {items.map((it, i) => {
                    const isBusy = busyItem === `${o.id}:${it.name}`;
                    const cap = maxQty.current[`${o.id}:${it.name}`] ?? it.qty;
                    return (
                      <div key={i} className="flex items-center justify-between gap-2 rounded-lg px-1.5 py-1.5">
                        <span className="min-w-0 flex-1 truncate text-sm text-ink/80 dark:text-cream/80">{it.name}</span>
                        <span className="shrink-0 text-xs font-bold text-ink/45 dark:text-cream/45">{fmt(it.price)}×</span>
                        {canEdit ? (
                          <div className="flex shrink-0 items-center gap-1.5">
                            <button onClick={() => setQty(o.id, it.name, it.qty - 1)} disabled={isBusy}
                              title={it.qty <= 1 ? 'إزالة' : 'إنقاص'}
                              className="grid h-7 w-7 place-items-center rounded-lg bg-red-500/10 text-red-600 transition hover:bg-red-500/20 disabled:opacity-50 dark:text-red-300">
                              {isBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : (it.qty <= 1 ? <Trash2 className="h-3.5 w-3.5" /> : <Minus className="h-3.5 w-3.5" />)}
                            </button>
                            <span className="w-6 text-center font-display font-black text-ink dark:text-cream">{it.qty}</span>
                            <button onClick={() => setQty(o.id, it.name, it.qty + 1)} disabled={isBusy || it.qty >= cap}
                              title="زيادة (حتى الكمية المطلوبة)"
                              className="grid h-7 w-7 place-items-center rounded-lg bg-ink/10 text-ink/70 transition hover:bg-ink/20 disabled:opacity-30 dark:bg-white/10 dark:text-cream/70">
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ) : (
                          <span className="shrink-0 font-display font-black text-ink/70 dark:text-cream/70">{it.qty}×</span>
                        )}
                        <span className="w-16 shrink-0 text-left text-sm font-bold text-ink/60 dark:text-cream/60">{fmt(it.price * it.qty)}</span>
                      </div>
                    );
                  })}
                </div>

                {removed.length > 0 && (
                  <div className="mt-2 rounded-xl bg-red-500/[0.06] p-2 text-xs">
                    <span className="font-bold text-red-600 dark:text-red-300">أُزيل لعدم التوفّر: </span>
                    <span className="text-ink/55 dark:text-cream/55">{removed.map((r) => `${r.qty}× ${r.name}`).join('، ')}</span>
                  </div>
                )}

                {/* ready-for-pickup action */}
                {canEdit && items.length > 0 && (
                  o.ready ? (
                    <div className="mt-3 flex items-center justify-between gap-2 rounded-xl bg-green-500/10 px-3 py-2.5 ring-1 ring-green-500/20">
                      <span className="flex items-center gap-1.5 font-display text-sm font-black text-green-700 dark:text-green-300"><Check className="h-4 w-4" /> جاهز للاستلام — أُبلغ المندوب</span>
                      <button onClick={() => markReady(o.id, true)} disabled={busyReady === o.id}
                        className="rounded-lg bg-ink/5 px-2.5 py-1 text-[11px] font-bold text-ink/60 hover:bg-ink/10 disabled:opacity-50 dark:bg-white/10 dark:text-cream/60">
                        {busyReady === o.id ? '…' : 'تراجع'}
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => markReady(o.id, false)} disabled={busyReady === o.id}
                      className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-copper py-3 font-display text-base font-bold text-cream shadow-soft transition hover:bg-copper-dark active:scale-[.99] disabled:opacity-50">
                      {busyReady === o.id ? <Loader2 className="h-5 w-5 animate-spin" /> : <PackageCheck className="h-5 w-5" />}
                      جهّزت الطلب — جاهز للاستلام
                    </button>
                  )
                )}
              </div>
            );
          })}
        </div>
      )}

      <p className="mt-4 px-1 text-[11px] leading-relaxed text-ink/40 dark:text-cream/40">
        💡 عدّل الكمية بـ − / + إن توفّر جزء فقط، أو أنقصها للصفر لإزالة المنتج — ويُخصم الفرق تلقائياً. بعد ما تجهّز الطلب وتعبّيه، اضغط «جاهز للاستلام» ليصل إشعار للمندوب فيروح يستلمه. التواصل مع الزبون عبر المندوب.
      </p>
    </>
  );
}

// ───────────────────────── merchant bundles ─────────────────────────
const BUNDLE_UNITS = ['كيلو', 'علبة', 'باقة', 'قطعة', 'حبة', 'كرتون', 'كيس', 'لتر'];

// compute the full (pre-discount) value of a bundle from its ingredients × product prices
function bundleFullPrice(ingredients, productByName) {
  return (ingredients || []).reduce((sum, ing) => {
    const p = productByName.get(ing.name);
    const price = p ? (Number(p.price) || 0) : 0;
    return sum + price * (Number(ing.qty) || 0);
  }, 0);
}

function BundlesManager({ token, products }) {
  const [bundles, setBundles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editBundle, setEditBundle] = useState(null);
  const [aiInitial, setAiInitial] = useState(null);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiErr, setAiErr] = useState('');
  const [previewBundle, setPreviewBundle] = useState(null);
  const [savingOrder, setSavingOrder] = useState(false);

  const productByName = useMemo(() => new Map(products.map((p) => [p.name, p])), [products]);

  async function load() {
    setLoading(true);
    const r = await merchantListBundles(token);
    setBundles(r?.ok ? (r.bundles || []) : []);
    setLoading(false);
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [token]);

  function openAdd() { setEditBundle(null); setAiInitial(null); setFormOpen(true); }
  function openEdit(b) { setEditBundle(b); setAiInitial(null); setFormOpen(true); }

  async function generateWithAI() {
    setAiErr('');
    if (products.length < 2) { setAiErr('أضِف منتجات أكثر أولاً ليقترح الذكاء باقة.'); return; }
    setAiBusy(true);
    const r = await generateBundle(products.map((p) => ({ name: p.name, price: p.price, unit: p.unit })));
    setAiBusy(false);
    if (!r?.ok || !r.bundle) { setAiErr(r?.error || 'تعذّر توليد الباقة، حاول مجدداً.'); return; }
    // enrich AI ingredients with emoji/image from the matching product, dedupe by name
    const seen = new Set();
    const ingredients = (r.bundle.ingredients || []).filter((x) => {
      if (seen.has(x.name)) return false; seen.add(x.name); return true;
    }).map((x) => {
      const p = productByName.get(x.name);
      return { name: x.name, qty: x.qty, unit: x.unit || (p?.unit || ''), emoji: p?.emoji || '🛒', image: p?.image || '' };
    });
    const full = bundleFullPrice(ingredients, productByName);
    const price = Math.max(0, Math.round(full * (1 - (r.bundle.discount_pct || 10) / 100)));
    setEditBundle(null);
    setAiInitial({
      name: r.bundle.name, kicker: r.bundle.kicker, description: r.bundle.description,
      ingredients, old_price: full || null, price: price || full,
    });
    setFormOpen(true);
  }

  async function remove(b) {
    if (!window.confirm(`حذف باقة «${b.name}»؟`)) return;
    const r = await merchantRemoveBundle(token, b.id);
    if (r?.ok) load();
  }
  async function toggleActive(b) {
    const r = await merchantSetBundleActive(token, b.id, !b.active);
    if (r?.ok) setBundles((prev) => prev.map((x) => (x.id === b.id ? { ...x, active: !x.active } : x)));
  }

  // duplicate a bundle (creates an editable copy)
  async function duplicate(b) {
    const payload = {
      name: (b.name || 'باقة') + ' (نسخة)', kicker: b.kicker || null, description: b.description || null,
      price: b.price ?? 0, old_price: b.old_price ?? null, accent: b.accent || '#0F5132',
      image: b.image || null, ingredients: Array.isArray(b.ingredients) ? b.ingredients : [],
    };
    const r = await merchantAddBundle(token, payload);
    if (r?.ok) { if (b.season) await merchantSetBundleSeason(token, r.bundle.id, b.season); load(); }
  }

  // persist a new drag order
  async function onReorder(newOrder) {
    setBundles(newOrder);
    setSavingOrder(true);
    await merchantReorderBundles(token, newOrder.map((b) => b.id));
    setSavingOrder(false);
  }

  // map a raw DB bundle to the customer card shape (for preview)
  function toCustomerBundle(b) {
    const ing = Array.isArray(b.ingredients) ? b.ingredients : [];
    return {
      id: b.id, name: b.name, kicker: b.kicker || '', desc: b.description || '',
      items: ing.map((x) => (x?.qty ? `${x.name} × ${x.qty}${x.unit ? ' ' + x.unit : ''}` : (x?.name || ''))),
      emojis: ing.map((x) => x?.emoji || '🛒'), images: ing.map((x) => x?.image || null),
      image: b.image || null, price: b.price, old: b.old_price ?? null, accent: b.accent || '#0F5132', season: b.season || null,
    };
  }

  if (loading) {
    return <div className="flex items-center justify-center gap-2 py-16 text-ink/50 dark:text-cream/50"><Loader2 className="h-5 w-5 animate-spin" /> جارٍ تحميل الباقات…</div>;
  }

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-black text-ink dark:text-cream">باقاتي</h2>
          <p className="font-body text-xs text-ink/50 dark:text-cream/50">اجمع منتجاتك في باقات بسعر مميّز — تظهر للزبائن في متجرك</p>
        </div>
        <div className="flex gap-2">
          <button onClick={generateWithAI} disabled={aiBusy}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 px-4 py-2.5 font-display text-sm font-bold text-white shadow-soft transition hover:opacity-90 disabled:opacity-60">
            {aiBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} توليد بالذكاء
          </button>
          <button onClick={openAdd} className="flex items-center gap-1.5 rounded-xl bg-copper px-4 py-2.5 font-display text-sm font-bold text-cream shadow-soft hover:bg-copper-dark">
            <Plus className="h-4 w-4" /> أضف باقة
          </button>
        </div>
      </div>

      {aiBusy && (
        <div className="mb-4 flex items-center gap-2 rounded-2xl bg-indigo-500/10 px-4 py-3 text-sm font-bold text-indigo-600 dark:text-indigo-300">
          <Sparkles className="h-4 w-4 animate-pulse" /> الذكاء يراجع منتجاتك ويكوّن باقة مقترحة…
        </div>
      )}
      {aiErr && <div className="mb-4 rounded-2xl bg-red-500/10 px-4 py-3 text-sm font-bold text-red-600 dark:text-red-300">{aiErr}</div>}

      {bundles.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ink/15 py-16 text-center dark:border-white/15">
          <Gift className="mx-auto mb-3 h-10 w-10 text-ink/20 dark:text-cream/20" />
          <p className="font-bold text-ink/50 dark:text-cream/50">لا توجد باقات بعد</p>
          <p className="mt-1 text-xs text-ink/40 dark:text-cream/40">أنشئ باقة يدوياً أو دع الذكاء يقترح واحدة من منتجاتك.</p>
        </div>
      ) : (
        <>
          {bundles.length > 1 && (
            <p className="mb-2 flex items-center gap-1.5 text-[11px] font-bold text-ink/40 dark:text-cream/40">
              <GripVertical className="h-3.5 w-3.5" /> اسحب من المقبض لإعادة ترتيب الباقات {savingOrder && <span className="text-copper">· جارٍ الحفظ…</span>}
            </p>
          )}
          <Reorder.Group axis="y" values={bundles} onReorder={onReorder} className="space-y-3">
            {bundles.map((b) => (
              <MerchantBundleRow key={b.id} b={b}
                onToggle={() => toggleActive(b)} onEdit={() => openEdit(b)} onRemove={() => remove(b)}
                onDuplicate={() => duplicate(b)} onPreview={() => setPreviewBundle(toCustomerBundle(b))} />
            ))}
          </Reorder.Group>
        </>
      )}

      {formOpen && (
        <BundleForm token={token} products={products} bundle={editBundle} initial={aiInitial}
          onClose={() => setFormOpen(false)} onSaved={() => { setFormOpen(false); load(); }} />
      )}
      {previewBundle && <BundleDetailModal b={previewBundle} onAdd={null} onClose={() => setPreviewBundle(null)} />}
    </>
  );
}

// a single draggable bundle row in the merchant manager
function MerchantBundleRow({ b, onToggle, onEdit, onRemove, onDuplicate, onPreview }) {
  const controls = useDragControls();
  const ing = Array.isArray(b.ingredients) ? b.ingredients : [];
  return (
    <Reorder.Item value={b} dragListener={false} dragControls={controls}
      className={`rounded-2xl bg-cream p-4 shadow-soft ring-1 dark:bg-night-800 ${b.active ? 'ring-brand-900/5 dark:ring-white/10' : 'opacity-60 ring-ink/10'}`}>
      <div className="flex items-start gap-2">
        <button onPointerDown={(e) => controls.start(e)} className="mt-1 cursor-grab touch-none rounded-lg p-1 text-ink/30 hover:bg-ink/5 hover:text-ink/60 active:cursor-grabbing dark:text-cream/30 dark:hover:bg-white/10" title="اسحب للترتيب">
          <GripVertical className="h-5 w-5" />
        </button>
        <span className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-xl text-2xl" style={{ background: b.accent || '#0F5132' }}>
          {b.image ? <img src={b.image} alt="" className="h-full w-full object-cover" /> : '🧺'}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <h3 className="font-display font-black text-ink dark:text-cream">{b.name}</h3>
            {b.season && <span className="rounded-full bg-copper/15 px-2 py-0.5 text-[10px] font-bold text-copper-dark dark:text-copper-light">{b.season}</span>}
          </div>
          {b.kicker && <p className="text-[11px] font-bold text-copper dark:text-copper-light">{b.kicker}</p>}
          <p className="mt-0.5 text-xs text-ink/50 dark:text-cream/50">{ing.length} مكوّن</p>
        </div>
        <div className="text-left">
          <div className="font-display font-black text-copper dark:text-copper-light">{fmt(b.price)} <span className="text-xs">د.ع</span></div>
          {b.old_price > 0 && <div className="text-xs text-ink/40 line-through dark:text-cream/40">{fmt(b.old_price)}</div>}
        </div>
      </div>

      {ing.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {ing.slice(0, 6).map((x, i) => (
            <span key={i} className="rounded-full bg-ink/5 px-2 py-0.5 text-[11px] text-ink/60 dark:bg-white/10 dark:text-cream/60">
              {x.name}{x.qty ? ` × ${x.qty}${x.unit ? ' ' + x.unit : ''}` : ''}
            </span>
          ))}
          {ing.length > 6 && <span className="rounded-full bg-ink/5 px-2 py-0.5 text-[11px] font-bold text-copper dark:bg-white/10 dark:text-copper-light">+{ing.length - 6}</span>}
        </div>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        <button onClick={onToggle} className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold ${b.active ? 'bg-green-500/10 text-green-600 dark:text-green-300' : 'bg-ink/10 text-ink/50 dark:bg-white/10 dark:text-cream/50'}`}>
          {b.active ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />} {b.active ? 'ظاهرة' : 'مخفية'}
        </button>
        <button onClick={onPreview} className="flex items-center gap-1 rounded-lg bg-brand-800/10 px-2.5 py-1.5 text-xs font-bold text-brand-700 hover:bg-brand-800/20 dark:bg-white/10 dark:text-brand-300"><Eye className="h-3.5 w-3.5" /> معاينة</button>
        <button onClick={onEdit} className="flex items-center gap-1 rounded-lg bg-ink/5 px-2.5 py-1.5 text-xs font-bold text-ink/70 hover:bg-ink/10 dark:bg-white/10 dark:text-cream/70"><Pencil className="h-3.5 w-3.5" /> تعديل</button>
        <button onClick={onDuplicate} className="flex items-center gap-1 rounded-lg bg-ink/5 px-2.5 py-1.5 text-xs font-bold text-ink/70 hover:bg-ink/10 dark:bg-white/10 dark:text-cream/70"><Copy className="h-3.5 w-3.5" /> نسخ</button>
        <button onClick={onRemove} className="flex items-center gap-1 rounded-lg bg-red-500/10 px-2.5 py-1.5 text-xs font-bold text-red-600 hover:bg-red-500/20 dark:text-red-300"><Trash2 className="h-3.5 w-3.5" /> حذف</button>
      </div>
    </Reorder.Item>
  );
}

function BundleForm({ token, products, bundle, initial, onClose, onSaved }) {
  const base = bundle || initial || {};
  const productByName = useMemo(() => new Map(products.map((p) => [p.name, p])), [products]);
  const productNames = useMemo(() => products.map((p) => p.name), [products]);

  const [name, setName] = useState(base.name || '');
  const [kicker, setKicker] = useState(base.kicker || '');
  const [description, setDescription] = useState(base.description || base.desc || '');
  const [image, setImage] = useState(base.image || '');
  const [accent, setAccent] = useState(base.accent || '#0F5132');
  const [season, setSeason] = useState(base.season || '');
  const [ingredients, setIngredients] = useState(
    Array.isArray(base.ingredients) && base.ingredients.length
      ? base.ingredients.map((x) => ({ name: x.name || '', qty: x.qty || 1, unit: x.unit || '', emoji: x.emoji || '🛒', image: x.image || '' }))
      : [{ name: '', qty: 1, unit: '', emoji: '🛒', image: '' }]
  );
  // pricing is driven by a discount % so it stays live as ingredients change
  const initDisc = (() => {
    const op = base.old_price, pr = base.price;
    if (op && pr != null && op > 0) return Math.min(95, Math.max(0, Math.round((1 - pr / op) * 100)));
    return 10;
  })();
  const [discountPct, setDiscountPct] = useState(initDisc);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [descBusy, setDescBusy] = useState(false);
  const [imgBusy, setImgBusy] = useState(false);
  const fileRef = useRef(null);

  const inp = 'w-full rounded-xl border border-ink/10 bg-beige px-3 py-2.5 text-sm text-ink outline-none focus:border-copper dark:border-white/10 dark:bg-night-900 dark:text-cream';

  const full = useMemo(() => bundleFullPrice(ingredients, productByName), [ingredients, productByName]);
  const price = Math.max(0, Math.round(full * (1 - discountPct / 100)));
  const saving = Math.max(0, full - price);
  function onPriceInput(v) {
    const p = Math.max(0, parseInt(v, 10) || 0);
    if (full > 0) setDiscountPct(Math.min(95, Math.max(0, Math.round((1 - p / full) * 100))));
  }

  function setIng(i, patch) {
    setIngredients((list) => list.map((x, idx) => {
      if (idx !== i) return x;
      const next = { ...x, ...patch };
      // when a product is picked, auto-fill unit/emoji/image
      if ('name' in patch) {
        const p = productByName.get(patch.name);
        if (p) { next.unit = next.unit || p.unit || ''; next.emoji = p.emoji || '🛒'; next.image = p.image || ''; }
      }
      return next;
    }));
  }
  function addIng() { setIngredients((l) => [...l, { name: '', qty: 1, unit: '', emoji: '🛒', image: '' }]); }
  function removeIng(i) { setIngredients((l) => l.filter((_, idx) => idx !== i)); }

  async function genDesc() {
    if (!name.trim()) { setErr('اكتب اسم الباقة أولاً'); return; }
    setDescBusy(true);
    const items = ingredients.filter((x) => x.name).map((x) => x.name).join('، ');
    const r = await generateProductDescription({ name: name.trim(), category: 'باقة', unit: '', current: items ? `الباقة تحتوي: ${items}` : '' });
    setDescBusy(false);
    if (r?.ok && r.description) setDescription(r.description);
  }

  async function onFile(e) {
    const file = e.target.files?.[0]; e.target.value = '';
    if (!file) return;
    setImgBusy(true);
    const up = await uploadProductImage(file, 'bundle-' + Date.now());
    setImgBusy(false);
    if (up?.url) setImage(up.url);
  }

  async function save() {
    const clean = ingredients
      .filter((x) => x.name && x.name.trim())
      .map((x) => ({ name: x.name.trim(), qty: Math.max(1, parseInt(x.qty, 10) || 1), unit: (x.unit || '').trim(), emoji: x.emoji || '🛒', image: x.image || null }));
    if (!name.trim()) { setErr('اكتب اسم الباقة'); return; }
    if (clean.length < 2) { setErr('أضِف منتجين على الأقل للباقة'); return; }
    if (price <= 0) { setErr('سعر الباقة غير صالح — تأكّد من أسعار المنتجات'); return; }

    setBusy(true); setErr('');
    const payload = {
      name: name.trim(), kicker: kicker.trim() || null, description: description.trim() || null,
      price,
      old_price: full > price ? full : null,
      accent, image: image || null, ingredients: clean,
    };
    const r = bundle ? await merchantUpdateBundle(token, bundle.id, payload) : await merchantAddBundle(token, payload);
    if (r?.ok) {
      const id = bundle ? bundle.id : r.bundle?.id;
      if (id) await merchantSetBundleSeason(token, id, season || '');
    }
    setBusy(false);
    if (r?.ok) onSaved();
    else setErr(r?.error === 'name_required' ? 'اكتب اسم الباقة' : 'تعذّر الحفظ، حاول ثانية');
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-end justify-center bg-black/50 sm:items-center" onClick={onClose}>
      <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-cream p-5 dark:bg-night-800 sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-lg font-black text-ink dark:text-cream">{bundle ? 'تعديل باقة' : 'باقة جديدة'}</h3>
          <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full bg-ink/5 text-ink/60 dark:bg-white/10 dark:text-cream/60"><X className="h-5 w-5" /></button>
        </div>

        {/* image */}
        <div className="mb-3 flex items-center gap-3">
          <span className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-xl text-3xl" style={{ background: accent }}>
            {image ? <img src={image} alt="" className="h-full w-full object-cover" /> : '🧺'}
          </span>
          <div className="flex flex-col gap-1.5">
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
            <button onClick={() => fileRef.current?.click()} disabled={imgBusy} className="flex items-center gap-1.5 rounded-lg bg-ink/5 px-3 py-1.5 text-xs font-bold text-ink/70 dark:bg-white/10 dark:text-cream/70">
              {imgBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImageIcon className="h-3.5 w-3.5" />} صورة الباقة
            </button>
            {image && <button onClick={() => setImage('')} className="text-[11px] font-bold text-red-500">إزالة الصورة</button>}
          </div>
        </div>

        <label className="mb-1 block text-[11px] font-bold text-ink/50 dark:text-cream/50">اسم الباقة</label>
        <input value={name} onChange={(e) => setName(e.target.value)} className={inp} placeholder="مثلاً: سلة الطبخ الأسبوعية" />

        <label className="mb-1 mt-3 block text-[11px] font-bold text-ink/50 dark:text-cream/50">سطر تشويقي (اختياري)</label>
        <input value={kicker} onChange={(e) => setKicker(e.target.value)} className={inp} placeholder="مثلاً: وفّر وقتك" />

        <div className="mb-1 mt-3 flex items-center justify-between">
          <label className="block text-[11px] font-bold text-ink/50 dark:text-cream/50">الوصف (اختياري)</label>
          <button onClick={genDesc} disabled={descBusy} className="flex items-center gap-1 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 px-2 py-1 text-[11px] font-bold text-white disabled:opacity-60">
            {descBusy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />} توليد بالذكاء
          </button>
        </div>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className={inp} placeholder="وصف قصير يشهّي الزبون…" />

        {/* seasonal tag */}
        <label className="mb-1 mt-3 block text-[11px] font-bold text-ink/50 dark:text-cream/50">وسم موسمي (يبرز الباقة للزبون)</label>
        <div className="flex flex-wrap gap-1.5">
          {['', 'رمضان', 'عيد', 'الصيف', 'الشتاء', 'العودة للمدارس', 'عاشوراء'].map((s) => (
            <button key={s || 'none'} type="button" onClick={() => setSeason(s)}
              className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${season === s ? 'bg-copper text-cream shadow-soft' : 'bg-ink/5 text-ink/60 hover:bg-ink/10 dark:bg-white/10 dark:text-cream/60'}`}>
              {s === '' ? 'بدون' : s}
            </button>
          ))}
        </div>

        {/* ingredients */}
        <div className="mb-2 mt-4 flex items-center justify-between">
          <span className="text-[12px] font-bold text-ink/60 dark:text-cream/60">المكوّنات ({ingredients.length})</span>
          <button onClick={addIng} className="flex items-center gap-1 rounded-lg bg-copper/15 px-2 py-1 text-[11px] font-bold text-copper-dark dark:text-copper-light"><Plus className="h-3 w-3" /> مكوّن</button>
        </div>
        <div className="space-y-2">
          {ingredients.map((ing, i) => (
            <div key={i} className="rounded-xl border border-ink/10 bg-beige/50 p-2 dark:border-white/10 dark:bg-night-900/50">
              <div className="flex items-center gap-2">
                <span className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-lg bg-white text-lg ring-1 ring-ink/10 dark:ring-white/10">
                  {ing.image ? <img src={ing.image} alt="" className="h-full w-full object-contain p-0.5 mix-blend-multiply" /> : ing.emoji}
                </span>
                <div className="min-w-0 flex-1"><CategoryPicker value={ing.name} onChange={(v) => setIng(i, { name: v })} options={productNames.filter((n) => n === ing.name || !ingredients.some((o, idx) => idx !== i && o.name === n))} allowNew={false} placeholder="اختر منتجاً" /></div>
                <button onClick={() => removeIng(i)} className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-red-500/10 text-red-500"><Trash2 className="h-4 w-4" /></button>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-ink/40 dark:text-cream/40">الكمية</span>
                  <input type="number" min="1" dir="ltr" value={ing.qty} onChange={(e) => setIng(i, { qty: e.target.value })}
                    className="h-8 w-full rounded-lg border border-ink/10 bg-beige px-2 text-sm dark:border-white/10 dark:bg-night-900 dark:text-cream" />
                </div>
                <div className="min-w-0"><CategoryPicker value={ing.unit} onChange={(v) => setIng(i, { unit: v })} options={BUNDLE_UNITS} allowNew placeholder="الوحدة" /></div>
              </div>
            </div>
          ))}
        </div>

        {/* pricing — driven by discount %, updates live with ingredients */}
        <div className="mt-4 rounded-2xl bg-copper/5 p-3.5">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs text-ink/55 dark:text-cream/55">قيمة المنتجات مفردة (قبل الخصم)</span>
            <span className="font-display text-lg font-black text-ink/70 line-through dark:text-cream/70">{fmt(full)} د.ع</span>
          </div>

          {/* discount slider + number */}
          <label className="mb-1 block text-[11px] font-bold text-ink/50 dark:text-cream/50">نسبة الخصم على الباقة</label>
          <div className="flex items-center gap-3">
            <input type="range" min="0" max="50" value={discountPct} onChange={(e) => setDiscountPct(parseInt(e.target.value, 10) || 0)}
              className="h-2 flex-1 cursor-pointer appearance-none rounded-full bg-ink/10 accent-copper dark:bg-white/10" />
            <div className="flex items-center gap-1 rounded-lg bg-cream px-2 py-1 dark:bg-night-900">
              <input type="number" min="0" max="95" dir="ltr" value={discountPct} onChange={(e) => setDiscountPct(Math.min(95, Math.max(0, parseInt(e.target.value, 10) || 0)))}
                className="w-10 bg-transparent text-center text-sm font-black text-copper outline-none dark:text-copper-light" />
              <span className="text-xs font-bold text-copper dark:text-copper-light">%</span>
            </div>
          </div>

          {/* final price (editable → adjusts discount) */}
          <div className="mt-3 flex items-center justify-between rounded-xl bg-copper/10 p-3">
            <span className="text-sm font-bold text-ink/70 dark:text-cream/70">سعر الباقة للزبون</span>
            <div className="flex items-baseline gap-1">
              <input type="number" dir="ltr" value={price} onChange={(e) => onPriceInput(e.target.value)}
                className="w-24 rounded-lg border border-copper/30 bg-cream px-2 py-1 text-left font-display text-xl font-black text-copper outline-none focus:border-copper dark:bg-night-900 dark:text-copper-light" />
              <span className="text-xs font-bold text-copper dark:text-copper-light">د.ع</span>
            </div>
          </div>

          {saving > 0 && (
            <p className="mt-2 text-center text-xs font-bold text-green-600 dark:text-green-300">يوفّر الزبون {fmt(saving)} د.ع ({discountPct}%) 🎉</p>
          )}
          {full === 0 && (
            <p className="mt-2 text-center text-[11px] text-amber-600 dark:text-amber-300">⚠️ أضِف منتجات لها أسعار ليُحسب سعر الباقة تلقائياً.</p>
          )}
        </div>

        {err && <p className="mt-3 flex items-center gap-1 text-xs font-bold text-red-500"><AlertTriangle className="h-3.5 w-3.5" /> {err}</p>}

        <div className="mt-4 flex gap-2">
          <button onClick={onClose} className="flex-1 rounded-xl bg-ink/5 py-3 font-bold text-ink/70 dark:bg-white/10 dark:text-cream/70">إلغاء</button>
          <button onClick={save} disabled={busy} className="flex flex-[2] items-center justify-center gap-2 rounded-xl bg-copper py-3 font-display font-bold text-cream shadow-soft hover:bg-copper-dark disabled:opacity-60">
            {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />} {bundle ? 'حفظ التعديلات' : 'إنشاء الباقة'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ───────────────────────── merchant wallet & invoices ─────────────────────────
const PAY_METHODS = [['driver', 'عبر المندوب (نقد)', Banknote], ['rafidain', 'مصرف الرافدين', Wallet]];

function MerchantWallet({ token }) {
  const [wallet, setWallet] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmFor, setConfirmFor] = useState(null); // invoice awaiting method choice

  async function load() {
    setLoading(true);
    const [w, inv] = await Promise.all([merchantWallet(token), merchantInvoices(token)]);
    setWallet(w?.ok ? w : null);
    setInvoices(inv?.ok ? (inv.invoices || []) : []);
    setLoading(false);
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [token]);

  async function confirm(inv, method) {
    setConfirmFor(null);
    const r = await merchantConfirmReceipt(token, inv.id, method);
    if (r?.ok) load();
  }

  if (loading) {
    return <div className="flex items-center justify-center gap-2 py-16 text-ink/50 dark:text-cream/50"><Loader2 className="h-5 w-5 animate-spin" /> جارٍ تحميل المحفظة…</div>;
  }

  const due = wallet?.due || 0, paid = wallet?.paid || 0, pending = wallet?.pending || 0;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-xl font-black text-ink dark:text-cream">محفظتي</h2>
        <p className="font-body text-xs text-ink/50 dark:text-cream/50">مستحقّاتك من الطلبات المسلّمة بعد خصم عمولة اطلبها ({wallet?.commission_pct || 15}%)</p>
      </div>

      {/* summary cards */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-2xl bg-gradient-to-br from-brand-800 to-brand-900 p-3 text-cream shadow-soft">
          <p className="text-[11px] opacity-80">إجمالي مستحقّاتك</p>
          <p className="mt-1 font-display text-lg font-black">{fmt(due)}</p>
          <p className="text-[10px] opacity-70">دينار</p>
        </div>
        <div className="rounded-2xl bg-cream p-3 shadow-soft ring-1 ring-green-500/20 dark:bg-night-800">
          <p className="text-[11px] text-ink/55 dark:text-cream/55">استلمته</p>
          <p className="mt-1 font-display text-lg font-black text-green-600 dark:text-green-400">{fmt(paid)}</p>
          <p className="text-[10px] text-ink/40 dark:text-cream/40">دينار</p>
        </div>
        <div className="rounded-2xl bg-cream p-3 shadow-soft ring-1 ring-copper/30 dark:bg-night-800">
          <p className="text-[11px] text-ink/55 dark:text-cream/55">قيد التحصيل</p>
          <p className="mt-1 font-display text-lg font-black text-copper dark:text-copper-light">{fmt(pending)}</p>
          <p className="text-[10px] text-ink/40 dark:text-cream/40">دينار</p>
        </div>
      </div>

      {/* invoices */}
      <div className="flex items-center gap-2">
        <Receipt className="h-4 w-4 text-ink/50 dark:text-cream/50" />
        <h3 className="font-display text-sm font-black text-ink dark:text-cream">سجل الفواتير ({invoices.length})</h3>
      </div>

      {invoices.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ink/15 py-12 text-center dark:border-white/15">
          <Receipt className="mx-auto mb-2 h-8 w-8 text-ink/20 dark:text-cream/20" />
          <p className="text-sm font-bold text-ink/50 dark:text-cream/50">لا توجد فواتير بعد</p>
          <p className="mt-1 text-xs text-ink/40 dark:text-cream/40">تظهر هنا فاتورة لكل طلب يُسلَّم للزبون.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {invoices.map((inv) => (
            <div key={inv.id} className="rounded-2xl bg-cream p-3.5 shadow-soft ring-1 ring-brand-900/5 dark:bg-night-800 dark:ring-white/10">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-display font-black text-ink dark:text-cream">فاتورة #{inv.order_no || '—'}</p>
                  <p className="text-[11px] text-ink/45 dark:text-cream/45">{inv.area || ''} · {new Date(inv.created_at).toLocaleDateString('en-GB')}</p>
                </div>
                {inv.settled ? (
                  <span className="flex items-center gap-1 rounded-full bg-green-500/15 px-2.5 py-1 text-[11px] font-bold text-green-600 dark:text-green-300"><CheckCircle2 className="h-3.5 w-3.5" /> استُلمت</span>
                ) : (
                  <span className="rounded-full bg-copper/15 px-2.5 py-1 text-[11px] font-bold text-copper dark:text-copper-light">قيد التحصيل</span>
                )}
              </div>

              <div className="mt-2 space-y-1 rounded-xl bg-beige/60 p-2.5 text-xs dark:bg-night-900/60">
                <div className="flex justify-between"><span className="text-ink/55 dark:text-cream/55">قيمة بضاعتك</span><span className="font-bold text-ink dark:text-cream">{fmt(inv.goods)} د.ع</span></div>
                <div className="flex justify-between"><span className="text-ink/55 dark:text-cream/55">عمولة اطلبها</span><span className="font-bold text-red-500">− {fmt(inv.commission)} د.ع</span></div>
                <div className="flex justify-between border-t border-ink/10 pt-1 dark:border-white/10"><span className="font-bold text-ink dark:text-cream">صافي مستحقّك</span><span className="font-display font-black text-brand-800 dark:text-brand-400">{fmt(inv.net)} د.ع</span></div>
              </div>

              {!inv.settled ? (
                confirmFor === inv.id ? (
                  <div className="mt-2.5">
                    <p className="mb-1.5 text-[11px] font-bold text-ink/60 dark:text-cream/60">كيف استلمت المبلغ؟</p>
                    <div className="grid grid-cols-2 gap-2">
                      {PAY_METHODS.map(([key, label, Icon]) => (
                        <button key={key} onClick={() => confirm(inv, key)}
                          className="flex items-center justify-center gap-1.5 rounded-xl bg-brand-800 py-2.5 text-xs font-bold text-cream hover:bg-brand-900">
                          <Icon className="h-4 w-4" /> {label}
                        </button>
                      ))}
                    </div>
                    <button onClick={() => setConfirmFor(null)} className="mt-1.5 w-full text-center text-[11px] text-ink/40 dark:text-cream/40">إلغاء</button>
                  </div>
                ) : (
                  <button onClick={() => setConfirmFor(inv.id)}
                    className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-xl bg-copper py-2.5 text-sm font-bold text-cream shadow-soft hover:bg-copper-dark">
                    <CheckCircle2 className="h-4 w-4" /> تأكيد استلام المبلغ
                  </button>
                )
              ) : (
                <p className="mt-2 text-center text-[11px] text-ink/45 dark:text-cream/45">
                  استُلم {inv.method === 'rafidain' ? 'عبر مصرف الرافدين' : 'عبر المندوب نقداً'}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Dashboard({ session, onLogout, onStoreUpdated, dark, toggleTheme }) {
  const { token } = session;
  const [store, setStore] = useState(session.store);
  const [tab, setTab] = useState('products'); // products | store
  const [products, setProducts] = useState([]);
  const [cats, setCats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [initialProduct, setInitialProduct] = useState(null);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoErr, setPhotoErr] = useState('');
  const [reviewItems, setReviewItems] = useState(null);
  const photoRef = useRef(null);

  async function load() {
    setLoading(true);
    const [pr, cs] = await Promise.all([merchantListProducts(token), fetchCategories()]);
    if (pr?.ok) setProducts(Array.isArray(pr.products) ? pr.products : []);
    if (Array.isArray(cs)) setCats(cs.length ? cs : ['عام']);
    setLoading(false);
    if (pr && pr.ok === false && pr.error === 'unauthorized') onLogout();
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  // orders + silent live sync every 8s (powers the badge and the orders tab)
  const [orders, setOrders] = useState([]);
  async function loadOrders() {
    const r = await merchantListOrders(token);
    if (r?.ok) setOrders(Array.isArray(r.orders) ? r.orders : []);
  }
  useEffect(() => {
    loadOrders();
    const t = setInterval(loadOrders, 8000);
    return () => clearInterval(t);
    /* eslint-disable-next-line */
  }, []);
  const newOrdersCount = useMemo(() => orders.filter((o) => o.status === 'new').length, [orders]);
  const alert = useOrderChime(newOrdersCount);

  const activeCount = useMemo(() => products.filter((p) => p.active).length, [products]);
  const outCount = useMemo(() => products.filter((p) => p.stock != null && p.stock <= 0).length, [products]);
  // group products by category (sorted), preserving each product's order within its group
  const grouped = useMemo(() => {
    const map = new Map();
    for (const p of products) {
      const key = (p.category || 'بدون تصنيف').trim() || 'بدون تصنيف';
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(p);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0], 'ar'));
  }, [products]);

  // collapsible category sections (all expanded by default)
  const [collapsedCats, setCollapsedCats] = useState(() => new Set());
  const toggleCat = (name) => setCollapsedCats((prev) => {
    const next = new Set(prev);
    next.has(name) ? next.delete(name) : next.add(name);
    return next;
  });

  function openAdd() { setEditProduct(null); setInitialProduct(null); setFormOpen(true); }
  function openEdit(p) { setEditProduct(p); setInitialProduct(null); setFormOpen(true); }

  async function onPhoto(e) {
    const file = e.target.files?.[0]; e.target.value = '';
    if (!file) return;
    setPhotoBusy(true); setPhotoErr('');
    // run extraction + photo upload in parallel
    const [ex, up] = await Promise.all([
      extractProductsFromImage(file, cats),
      uploadProductImage(file, 'new'),
    ]);
    setPhotoBusy(false);
    if (!ex?.ok || !Array.isArray(ex.products) || ex.products.length === 0) {
      setPhotoErr(ex?.error || 'لم أتعرّف على منتجات في الصورة. جرّب صورة أوضح وأقرب.');
      return;
    }
    if (ex.products.length === 1) {
      const p = ex.products[0];
      setEditProduct(null);
      setInitialProduct({ ...p, image: up?.url || '' }); // attach the photo to the single product
      setFormOpen(true);
    } else {
      setReviewItems(ex.products); // multi-product review
    }
  }

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-b from-beige/40 to-cream pb-16 dark:from-night-900 dark:to-night">
      {/* top bar */}
      <header className="sticky top-0 z-40 border-b border-ink/5 bg-cream/90 backdrop-blur dark:border-white/5 dark:bg-night-800/90">
        <div className="mx-auto flex max-w-4xl items-center gap-3 px-4 py-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-xl bg-white text-2xl ring-1 ring-ink/10 dark:ring-white/10">
            {store.logo ? <img src={store.logo} alt="" className="h-full w-full object-contain p-1 mix-blend-multiply" /> : <Store className="h-5 w-5 text-copper" />}
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-display text-lg font-black text-ink dark:text-cream">{store.name}</h1>
            <div className="flex items-center gap-2 text-[11px] text-ink/50 dark:text-cream/50">
              <span className="inline-flex items-center gap-0.5"><Star className="h-3 w-3 fill-amber-400 text-amber-400" /> {(Number(store.rating) || 0).toFixed(1)}</span>
              {store.followers_count > 0 && <span className="inline-flex items-center gap-0.5"><Users className="h-3 w-3" /> {store.followers_count}</span>}
              <span>· {store.category}</span>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-green-500/15 px-2.5 py-1 text-[11px] font-bold text-green-600 dark:text-green-300">
            <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" /><span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" /></span>
            مباشر
          </span>
          <AlertBell muted={alert.muted} onToggle={alert.toggleMute} hasNew={alert.hasNew} primed={alert.primed} />
          <button onClick={toggleTheme} className="grid h-9 w-9 place-items-center rounded-full bg-ink/5 text-ink/70 hover:bg-ink/10 dark:bg-white/10 dark:text-cream/70">{dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}</button>
          <button onClick={onLogout} className="flex items-center gap-1.5 rounded-full bg-ink/5 px-3 py-1.5 text-sm font-bold text-ink/70 hover:bg-red-500/10 hover:text-red-600 dark:bg-white/10 dark:text-cream/70" title="خروج"><LogOut className="h-4 w-4" /></button>
        </div>

        {/* tabs */}
        <div className="mx-auto flex max-w-4xl gap-1.5 overflow-x-auto px-4 pb-2 no-scrollbar">
          {[['products', 'منتجاتي', Package], ['bundles', 'الباقات', Gift], ['orders', 'الطلبات', ClipboardList], ['wallet', 'محفظتي', Wallet], ['store', 'متجري', Store]].map(([k, label, Icon]) => (
            <button key={k} onClick={() => setTab(k)}
              className={`relative flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-2 text-sm font-bold transition ${tab === k ? 'bg-copper text-cream shadow-soft' : 'bg-ink/5 text-ink/60 hover:bg-ink/10 dark:bg-white/10 dark:text-cream/60'}`}>
              <Icon className="h-4 w-4" /> {label}
              {k === 'orders' && newOrdersCount > 0 && (
                <span className="grid h-5 min-w-5 place-items-center rounded-full bg-red-500 px-1 text-[10px] font-black text-white">{newOrdersCount}</span>
              )}
            </button>
          ))}
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 pt-5">
        {alert.newCount > 0 && (
          <div className="mb-4">
            <NewOrderBanner count={alert.newCount} onAck={() => { alert.acknowledge(); setTab('orders'); }} />
          </div>
        )}
        {tab === 'products' ? (
          <>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-xl font-black text-ink dark:text-cream">منتجاتي</h2>
                <p className="font-body text-xs text-ink/50 dark:text-cream/50">
                  {products.length} منتج · {activeCount} ظاهر
                  {outCount > 0 && <span className="text-red-500"> · {outCount} نافد</span>}
                </p>
              </div>
              <div className="flex gap-2">
                <input ref={photoRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={onPhoto} />
                <button onClick={() => photoRef.current?.click()} disabled={photoBusy}
                  className="flex items-center gap-1.5 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 px-4 py-2.5 font-display text-sm font-bold text-white shadow-soft transition hover:opacity-90 disabled:opacity-60">
                  {photoBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />} أضف بصورة
                </button>
                <button onClick={openAdd} className="flex items-center gap-1.5 rounded-xl bg-copper px-4 py-2.5 font-display text-sm font-bold text-cream shadow-soft hover:bg-copper-dark">
                  <Plus className="h-4 w-4" /> أضف منتج
                </button>
              </div>
            </div>

            {photoBusy && (
              <div className="mb-4 flex items-center gap-2 rounded-2xl bg-indigo-500/10 px-4 py-3 text-sm font-bold text-indigo-600 dark:text-indigo-300">
                <Sparkles className="h-4 w-4 animate-pulse" /> الذكاء يقرأ صورتك ويملأ بيانات المنتج…
              </div>
            )}
            {photoErr && (
              <div className="mb-4 flex items-center gap-2 rounded-2xl bg-red-500/10 px-4 py-3 text-sm font-bold text-red-600 dark:text-red-300">
                <AlertTriangle className="h-4 w-4" /> {photoErr}
              </div>
            )}

            {loading ? (
              <div className="flex justify-center py-20"><Loader2 className="h-7 w-7 animate-spin text-copper" /></div>
            ) : products.length === 0 ? (
              <div className="flex flex-col items-center rounded-[2rem] border border-dashed border-ink/15 bg-beige/30 py-16 text-center dark:border-white/15 dark:bg-white/5">
                <div className="grid h-16 w-16 place-items-center rounded-2xl bg-copper/10 text-copper"><Package className="h-8 w-8" /></div>
                <p className="mt-4 font-display text-lg font-bold text-ink/70 dark:text-cream/70">لا توجد منتجات بعد</p>
                <p className="mt-1 font-body text-sm text-ink/45 dark:text-cream/45">ابدأ بإضافة أول منتج لمتجرك 🌟</p>
                <button onClick={openAdd} className="mt-4 flex items-center gap-1.5 rounded-xl bg-copper px-5 py-2.5 font-bold text-cream hover:bg-copper-dark"><Plus className="h-4 w-4" /> أضف أول منتج</button>
              </div>
            ) : (
              <div className="space-y-3">
                {grouped.map(([catName, items]) => {
                  const isCollapsed = collapsedCats.has(catName);
                  const outInCat = items.filter((p) => p.stock != null && p.stock <= 0).length;
                  return (
                    <div key={catName} className="overflow-hidden rounded-2xl border border-ink/5 bg-ink/[0.02] dark:border-white/5 dark:bg-white/[0.02]">
                      <button onClick={() => toggleCat(catName)}
                        className="flex w-full items-center gap-2 px-3.5 py-3 transition hover:bg-ink/[0.03] dark:hover:bg-white/[0.03]">
                        <ChevronDown className={`h-4 w-4 text-copper transition-transform duration-300 ${isCollapsed ? '-rotate-90' : ''}`} />
                        <h3 className="font-display text-sm font-black text-copper dark:text-copper-light">{catName}</h3>
                        <span className="rounded-full bg-copper/15 px-2 py-0.5 text-[10px] font-bold text-copper-dark dark:text-copper-light">{items.length}</span>
                        {outInCat > 0 && <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] font-bold text-red-500">{outInCat} نافد</span>}
                        <span className="h-px flex-1 bg-ink/10 dark:bg-white/10" />
                      </button>
                      <AnimatePresence initial={false}>
                        {!isCollapsed && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25, ease: 'easeInOut' }} className="overflow-hidden">
                            <div className="space-y-2.5 p-2.5 pt-0">
                              {items.map((p) => (
                                <ProductRow key={p.id} token={token} p={p} onEdit={openEdit} onChanged={load} />
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        ) : tab === 'orders' ? (
          <OrdersList token={token} orders={orders} onReload={loadOrders} />
        ) : tab === 'bundles' ? (
          <BundlesManager token={token} products={products} cats={cats} />
        ) : tab === 'wallet' ? (
          <MerchantWallet token={token} />
        ) : (
          <>
            <div className="mb-4">
              <h2 className="font-display text-xl font-black text-ink dark:text-cream">بيانات متجري</h2>
              <p className="font-body text-xs text-ink/50 dark:text-cream/50">عدّل شعار وغلاف ووصف متجرك كما يظهر للزبائن</p>
            </div>
            <StoreEditor token={token} store={store}
              onSaved={(s) => { if (s) { const merged = { ...store, ...s }; setStore(merged); onStoreUpdated(merged); } }} />
          </>
        )}
      </main>

      {formOpen && (
        <ProductForm token={token} cats={cats} product={editProduct} initial={initialProduct}
          onClose={() => setFormOpen(false)}
          onSaved={() => { setFormOpen(false); load(); }} />
      )}
      {reviewItems && (
        <SmartReviewModal token={token} cats={cats} items={reviewItems}
          onClose={() => setReviewItems(null)}
          onDone={() => { setReviewItems(null); load(); }} />
      )}
    </div>
  );
}

/* ───────────────────────── root ───────────────────────── */
export default function MerchantPage() {
  const [dark, toggleTheme] = useTheme();
  const [session, setSession] = useState(() => getMerchantSession());
  const [checking, setChecking] = useState(true);

  // verify the saved token still valid
  useEffect(() => {
    let alive = true;
    const s = getMerchantSession();
    if (!s?.token) { setChecking(false); return; }
    merchantMe(s.token).then((r) => {
      if (!alive) return;
      if (r?.ok) { const ns = { token: s.token, store: r.store }; setMerchantSession(ns); setSession(ns); }
      else { clearMerchantSession(); setSession(null); }
      setChecking(false);
    });
    return () => { alive = false; };
  }, []);

  function handleLogin(s) { setMerchantSession(s); setSession(s); }
  async function handleLogout() {
    if (session?.token) merchantLogout(session.token);
    clearMerchantSession(); setSession(null);
  }
  function handleStoreUpdated(store) {
    setSession((prev) => { const ns = { ...prev, store }; setMerchantSession(ns); return ns; });
  }

  if (checking) {
    return <div className="grid min-h-screen place-items-center bg-cream dark:bg-night"><Loader2 className="h-8 w-8 animate-spin text-copper" /></div>;
  }
  if (!session) return <MerchantLogin onLogin={handleLogin} dark={dark} toggleTheme={toggleTheme} />;
  return <Dashboard session={session} onLogout={handleLogout} onStoreUpdated={handleStoreUpdated} dark={dark} toggleTheme={toggleTheme} />;
}
