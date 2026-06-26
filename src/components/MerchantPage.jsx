import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Store, LogOut, Plus, Pencil, Trash2, Eye, EyeOff, Loader2, X, Save,
  Image as ImageIcon, Camera, Sparkles, Sun, Moon, Package, Phone,
  Star, Users, Check, Lock, User, AlertTriangle, Tag,
} from 'lucide-react';
import {
  getMerchantSession, setMerchantSession, clearMerchantSession,
  merchantLogin, merchantMe, merchantLogout,
  merchantListProducts, merchantAddProduct, merchantUpdateProduct,
  merchantRemoveProduct, merchantSetProductActive, merchantUpdateStore,
  fetchCategories, mapProduct,
} from '../lib/merchant.js';
import { uploadProductImage, uploadStoreCover, uploadStoreVideo } from '../lib/storage.js';
import { cleanProductImage } from '../lib/bgremove.js';
import { generateProductDescription, suggestBadge, suggestPrice, extractProductsFromImage } from '../lib/ai.js';
import CategoryPicker from './CategoryPicker.jsx';

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
  const logoRef = useRef(null); const coverRef = useRef(null); const videoRef = useRef(null);

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
          <button onClick={toggleTheme} className="grid h-9 w-9 place-items-center rounded-full bg-ink/5 text-ink/70 hover:bg-ink/10 dark:bg-white/10 dark:text-cream/70">{dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}</button>
          <button onClick={onLogout} className="flex items-center gap-1.5 rounded-full bg-ink/5 px-3 py-1.5 text-sm font-bold text-ink/70 hover:bg-red-500/10 hover:text-red-600 dark:bg-white/10 dark:text-cream/70" title="خروج"><LogOut className="h-4 w-4" /></button>
        </div>

        {/* tabs */}
        <div className="mx-auto flex max-w-4xl gap-1 px-4 pb-2">
          {[['products', 'منتجاتي', Package], ['store', 'متجري', Store]].map(([k, label, Icon]) => (
            <button key={k} onClick={() => setTab(k)}
              className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold transition ${tab === k ? 'bg-copper text-cream shadow-soft' : 'bg-ink/5 text-ink/60 hover:bg-ink/10 dark:bg-white/10 dark:text-cream/60'}`}>
              <Icon className="h-4 w-4" /> {label}
            </button>
          ))}
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 pt-5">
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
              <div className="space-y-5">
                {grouped.map(([catName, items]) => (
                  <div key={catName}>
                    <div className="mb-2 flex items-center gap-2">
                      <h3 className="font-display text-sm font-black text-copper dark:text-copper-light">{catName}</h3>
                      <span className="rounded-full bg-ink/5 px-2 py-0.5 text-[10px] font-bold text-ink/40 dark:bg-white/10 dark:text-cream/40">{items.length}</span>
                      <span className="h-px flex-1 bg-ink/10 dark:bg-white/10" />
                    </div>
                    <div className="space-y-2.5">
                      {items.map((p) => (
                        <ProductRow key={p.id} token={token} p={p} onEdit={openEdit} onChanged={load} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
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
