import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Loader2, Check, MessageCircle, AlertCircle } from 'lucide-react';
import { fmt } from '../data/catalog.js';
import {
  WHATSAPP_NUMBER,
  SHOP_NAME,
  CITY,
  AREAS,
  PAYMENT_METHODS,
  DELIVERY_FEE,
  FREE_DELIVERY_OVER,
} from '../config.js';

const STORAGE_KEY = 'otlobha-customer';

export default function CheckoutModal({ open, onClose, items, total, profile }) {
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    area: '',
    address: '',
    notes: '',
    payment: PAYMENT_METHODS[0]?.id || 'cod',
  });
  const [geo, setGeo] = useState(null); // { lat, lng }
  const [geoState, setGeoState] = useState('idle'); // idle | loading | done | error
  const [errors, setErrors] = useState({});

  // prefill from the logged-in account, else from saved guest details
  useEffect(() => {
    if (!open) return;
    let saved = {};
    try {
      saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    } catch {}
    const merged = { ...saved };
    if (profile) {
      const p = {
        name: profile.name,
        phone: profile.phone,
        email: profile.email,
        area: profile.area,
        address: profile.address,
      };
      Object.entries(p).forEach(([k, v]) => {
        if (v) merged[k] = v; // account values take priority when present
      });
    }
    setForm((f) => ({ ...f, ...merged }));
    setErrors({});
  }, [open, profile]);

  // lock background scroll while open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const delivery =
    FREE_DELIVERY_OVER > 0 && total >= FREE_DELIVERY_OVER ? 0 : DELIVERY_FEE;
  const grand = total + delivery;

  const set = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: undefined }));
  };

  function locate() {
    if (!('geolocation' in navigator)) {
      setGeoState('error');
      return;
    }
    setGeoState('loading');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeo({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGeoState('done');
      },
      () => setGeoState('error'),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }

  function validate() {
    const e = {};
    if (!form.name.trim()) e.name = 'الرجاء كتابة الاسم';
    if (form.phone.replace(/\D/g, '').length < 10) e.phone = 'رقم هاتف صحيح مطلوب';
    if (!form.area) e.area = 'اختر المنطقة';
    if (!form.address.trim()) e.address = 'العنوان مطلوب';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function submit() {
    if (items.length === 0) return;
    if (!validate()) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(form));
    } catch {}

    const pm = PAYMENT_METHODS.find((p) => p.id === form.payment);
    const lines = items
      .map((it) => `• ${it.name} ×${it.qty} — ${fmt(it.price * it.qty)} د.ع`)
      .join('\n');

    const parts = [
      `🛒 *طلب جديد من ${SHOP_NAME}*`,
      ``,
      `👤 الاسم: ${form.name}`,
      `📱 الهاتف: ${form.phone}`,
      form.email ? `📧 البريد: ${form.email}` : null,
      `📍 المنطقة: ${form.area} — ${CITY}`,
      `🏠 العنوان: ${form.address}`,
      geo ? `🗺️ الموقع على الخريطة: https://maps.google.com/?q=${geo.lat},${geo.lng}` : null,
      form.notes ? `📝 ملاحظات: ${form.notes}` : null,
      ``,
      `——— الطلب ———`,
      lines,
      ``,
      `💳 الدفع: ${pm?.label || ''}`,
      delivery > 0 ? `🚚 التوصيل: ${fmt(delivery)} د.ع` : `🚚 التوصيل: مجاني`,
      `💰 *الإجمالي: ${fmt(grand)} د.ع*`,
    ].filter(Boolean);

    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(parts.join('\n'))}`;
    window.open(url, '_blank');
  }

  const fieldBase =
    'w-full rounded-2xl border bg-white px-4 py-3 font-body text-ink placeholder:text-ink/35 outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20 dark:bg-night-800 dark:text-cream dark:placeholder:text-cream/30';
  const ok = 'border-black/10 dark:border-white/10';
  const bad = 'border-red-400 ring-2 ring-red-400/20';

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-ink/50 backdrop-blur-sm"
          />

          <motion.div
            initial={{ y: '100%', opacity: 0.6 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0.6 }}
            transition={{ type: 'spring', stiffness: 300, damping: 32 }}
            className="relative flex max-h-[94vh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-cream shadow-card ring-1 ring-black/5 dark:bg-night-900 dark:ring-white/10 sm:rounded-3xl"
          >
            {/* header */}
            <div className="relative shrink-0 border-b border-black/5 px-5 py-4 dark:border-white/10">
              <button
                onClick={onClose}
                className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-black/5 text-ink hover:bg-black/10 dark:bg-white/10 dark:text-cream dark:hover:bg-white/20"
                aria-label="إغلاق"
              >
                <X className="h-4 w-4" />
              </button>
              <h3 className="font-display text-2xl font-extrabold text-ink dark:text-cream">إتمام الطلب</h3>
              <p className="mt-1 font-body text-sm text-ink/55 dark:text-cream/55">
                املأ بياناتك وسنرسل الطلب عبر واتساب لتأكيده
              </p>
            </div>

            {/* scrollable body */}
            <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
              {/* name */}
              <Field label="الاسم الكامل" required error={errors.name}>
                <input
                  value={form.name}
                  onChange={(e) => set('name', e.target.value)}
                  placeholder="اسمك الكريم"
                  className={`${fieldBase} ${errors.name ? bad : ok}`}
                />
              </Field>

              {/* phone */}
              <Field label="رقم الهاتف" required error={errors.phone}>
                <input
                  value={form.phone}
                  onChange={(e) => set('phone', e.target.value)}
                  inputMode="tel"
                  dir="ltr"
                  placeholder="07XX XXX XXXX"
                  className={`${fieldBase} text-right ${errors.phone ? bad : ok}`}
                />
              </Field>

              {/* email (optional) */}
              <Field label="البريد الإلكتروني (اختياري)">
                <input
                  value={form.email}
                  onChange={(e) => set('email', e.target.value)}
                  inputMode="email"
                  dir="ltr"
                  placeholder="example@email.com"
                  className={`${fieldBase} text-right ${ok}`}
                />
              </Field>

              {/* area */}
              <Field label={`المنطقة داخل ${CITY}`} required error={errors.area}>
                <select
                  value={form.area}
                  onChange={(e) => set('area', e.target.value)}
                  className={`${fieldBase} appearance-none ${errors.area ? bad : ok}`}
                >
                  <option value="" disabled>
                    اختر المنطقة
                  </option>
                  {AREAS.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              </Field>

              {/* address + locate */}
              <Field label="العنوان التفصيلي" required error={errors.address}>
                <input
                  value={form.address}
                  onChange={(e) => set('address', e.target.value)}
                  placeholder="أقرب نقطة دالة، اسم الزقاق/الشارع، رقم الدار"
                  className={`${fieldBase} ${errors.address ? bad : ok}`}
                />
                <button
                  type="button"
                  onClick={locate}
                  className={`mt-2 flex w-full items-center justify-center gap-2 rounded-2xl border py-2.5 font-body text-sm font-bold transition ${
                    geoState === 'done'
                      ? 'border-brand-600/40 bg-brand-600/10 text-brand-800 dark:text-brand-300'
                      : 'border-black/10 bg-white text-ink hover:bg-black/[0.03] dark:border-white/10 dark:bg-night-800 dark:text-cream dark:hover:bg-white/5'
                  }`}
                >
                  {geoState === 'loading' ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> جارٍ تحديد موقعك…
                    </>
                  ) : geoState === 'done' ? (
                    <>
                      <Check className="h-4 w-4" /> تم تحديد موقعك ✓ (سيُرفق بالطلب)
                    </>
                  ) : (
                    <>
                      <MapPin className="h-4 w-4 text-copper" /> إرفاق موقعي الحالي (اختياري)
                    </>
                  )}
                </button>
                {geoState === 'error' && (
                  <p className="mt-1.5 flex items-center gap-1 font-body text-xs text-red-500">
                    <AlertCircle className="h-3.5 w-3.5" /> تعذّر تحديد الموقع — تأكّد من السماح بالوصول للموقع
                  </p>
                )}
              </Field>

              {/* notes */}
              <Field label="ملاحظات (اختياري)">
                <textarea
                  value={form.notes}
                  onChange={(e) => set('notes', e.target.value)}
                  rows={2}
                  placeholder="أي تفاصيل تساعدنا في توصيل طلبك"
                  className={`${fieldBase} resize-none ${ok}`}
                />
              </Field>

              {/* payment methods */}
              <div>
                <p className="mb-2 font-display text-sm font-bold text-ink dark:text-cream">طريقة الدفع</p>
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  {PAYMENT_METHODS.map((p) => {
                    const active = form.payment === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => set('payment', p.id)}
                        className={`flex items-start gap-3 rounded-2xl border p-3 text-right transition ${
                          active
                            ? 'border-brand-600 bg-brand-600/10 ring-1 ring-brand-600/30'
                            : 'border-black/10 bg-white hover:border-brand-600/40 dark:border-white/10 dark:bg-night-800'
                        }`}
                      >
                        <span
                          className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 ${
                            active ? 'border-brand-600 bg-brand-600' : 'border-black/20 dark:border-white/25'
                          }`}
                        >
                          {active && <Check className="h-3 w-3 text-white" />}
                        </span>
                        <span className="flex-1">
                          <span className="block font-display text-[15px] font-bold text-ink dark:text-cream">
                            {p.label}
                          </span>
                          <span className="block font-body text-xs text-ink/50 dark:text-cream/50">{p.note}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* order summary */}
              <div className="rounded-2xl bg-black/[0.03] p-4 dark:bg-white/[0.04]">
                {items.map((it) => (
                  <div key={it.key} className="mb-1.5 flex items-center justify-between font-body text-sm">
                    <span className="text-ink/70 dark:text-cream/70">
                      {it.name} <span className="text-ink/40 dark:text-cream/40">×{it.qty}</span>
                    </span>
                    <span className="font-display font-bold text-ink dark:text-cream">
                      {fmt(it.price * it.qty)} د.ع
                    </span>
                  </div>
                ))}
                <div className="mb-1.5 flex items-center justify-between font-body text-sm">
                  <span className="text-ink/70 dark:text-cream/70">التوصيل</span>
                  <span className="font-display font-bold text-brand-700 dark:text-brand-400">
                    {delivery > 0 ? `${fmt(delivery)} د.ع` : 'مجاني ✓'}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between border-t border-black/10 pt-2 dark:border-white/10">
                  <span className="font-display text-lg font-black text-ink dark:text-cream">المجموع</span>
                  <span className="font-display text-xl font-black text-brand-800 dark:text-brand-400">
                    {fmt(grand)} <span className="text-sm">د.ع</span>
                  </span>
                </div>
              </div>
            </div>

            {/* sticky footer CTA */}
            <div className="shrink-0 border-t border-black/5 bg-cream/80 px-5 py-4 backdrop-blur dark:border-white/10 dark:bg-night-900/80">
              <button
                onClick={submit}
                disabled={items.length === 0}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#25D366] py-4 font-display text-lg font-bold text-white shadow-seal transition hover:brightness-95 active:scale-[.99] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <MessageCircle className="h-5 w-5" /> إرسال الطلب عبر واتساب
              </button>
              <p className="mt-2 text-center font-body text-xs text-ink/45 dark:text-cream/45">
                بياناتك تُستخدم لتوصيل طلبك فقط · لا دفع مسبق · تؤكّد طلبك معنا عبر واتساب
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function Field({ label, required, error, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block font-display text-sm font-bold text-ink dark:text-cream">
        {label} {required && <span className="text-copper">*</span>}
      </span>
      {children}
      {error && (
        <span className="mt-1 flex items-center gap-1 font-body text-xs text-red-500">
          <AlertCircle className="h-3.5 w-3.5" /> {error}
        </span>
      )}
    </label>
  );
}
