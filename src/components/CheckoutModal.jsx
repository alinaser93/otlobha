import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Loader2, Check, MessageCircle, AlertCircle, Gift, Ticket, Wallet, Calendar, Zap } from 'lucide-react';
import { fmt } from '../data/catalog.js';
import { createOrder, redeemPointsForOrder, setOrderSchedule } from '../lib/orders.js';
import { dayOptions, availableSlots, buildScheduledISO, formatScheduled } from '../lib/schedule.js';
import { validateCoupon, applyCouponToOrder, couponError } from '../lib/coupons.js';
import { accountWallet, redeemWalletForOrder } from '../lib/wallet.js';
import { notifyNewOrder } from '../lib/push.js';
import { useAuth } from '../lib/auth.jsx';
import {
  SETTINGS,
  SHOP_NAME,
  CITY,
  AREAS,
  PAYMENT_METHODS,
  POINTS,
  calcDelivery,
} from '../config.js';

const STORAGE_KEY = 'otlobha-customer';

export default function CheckoutModal({ open, onClose, items, total, profile }) {
  const { reload } = useAuth();
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
  const [usePts, setUsePts] = useState(false); // apply loyalty points as a discount
  const [couponInput, setCouponInput] = useState('');
  const [coupon, setCoupon] = useState(null); // applied coupon: { ok, code, discount }
  const [couponErr, setCouponErr] = useState('');
  const [couponBusy, setCouponBusy] = useState(false);
  const [useWallet, setUseWallet] = useState(false); // pay with wallet credit
  const [walletBalance, setWalletBalance] = useState(0);
  // delivery timing: now vs scheduled
  const [schedMode, setSchedMode] = useState('now'); // 'now' | 'later'
  const [schedOffset, setSchedOffset] = useState(0);
  const [schedSlotId, setSchedSlotId] = useState('');
  const [schedError, setSchedError] = useState('');
  const schedDays = dayOptions();
  const schedSlots = availableSlots(schedOffset);
  const schedSlot = schedSlots.find((s) => s.id === schedSlotId) || null;
  const scheduledISO = schedMode === 'later' && schedSlot ? buildScheduledISO(schedOffset, schedSlot) : null;

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

  // load the customer's wallet balance when the sheet opens
  useEffect(() => {
    if (!open || !profile?.id) { setWalletBalance(0); return; }
    let alive = true;
    accountWallet(profile.id).then((r) => { if (alive && r?.ok) setWalletBalance(Number(r.balance) || 0); });
    return () => { alive = false; };
  }, [open, profile]);

  // lock background scroll while open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    if (!open) { setUsePts(false); setCoupon(null); setCouponInput(''); setCouponErr(''); setUseWallet(false); }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const storeCount = Math.max(1, new Set((items || []).map((it) => it.storeId).filter(Boolean)).size || 1);
  const delivery = calcDelivery(total, storeCount);
  const grand = total + delivery;

  // ── discounts (coupon applies first, then points on the remainder) ──
  const couponDiscount = coupon?.ok ? Math.min(coupon.discount || 0, grand) : 0;
  const afterCoupon = grand - couponDiscount;

  const balance = Math.max(0, profile?.points || 0);
  const dpp = Number(SETTINGS.points_dinar_per_point ?? POINTS.redeemDinarPerPoint) || 1;
  const maxPct = Number(SETTINGS.points_redeem_max_pct ?? POINTS.redeemMaxPct) || 50;
  const minOrder = Number(SETTINGS.points_redeem_min_order ?? POINTS.redeemMinOrder) || 0;
  const cap = Math.floor((afterCoupon * maxPct) / 100);
  const maxRedeemable = Math.min(balance, Math.floor(cap / dpp));
  const canRedeem = !!profile && balance > 0 && afterCoupon >= minOrder && maxRedeemable > 0;
  const redeemPoints = usePts && canRedeem ? maxRedeemable : 0;
  const pointsDiscount = redeemPoints * dpp;
  const grandAfter = afterCoupon - pointsDiscount;

  // wallet credit pays last, on whatever remains
  const walletAvail = Math.max(0, walletBalance || 0);
  const walletUsed = useWallet && profile && walletAvail > 0 ? Math.min(walletAvail, grandAfter) : 0;
  const finalTotal = grandAfter - walletUsed;
  const totalDiscount = couponDiscount + pointsDiscount + walletUsed;

  async function applyCoupon() {
    const code = couponInput.trim();
    if (!code || !profile) return;
    setCouponBusy(true); setCouponErr('');
    const r = await validateCoupon(code, profile.id, grand);
    setCouponBusy(false);
    if (r?.ok) { setCoupon(r); setCouponErr(''); }
    else { setCoupon(null); setCouponErr(couponError(r?.error)); }
  }
  function clearCoupon() { setCoupon(null); setCouponInput(''); setCouponErr(''); }

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
    if (schedMode === 'later' && !schedSlot) { setSchedError('اختر يوم و فترة التوصيل'); return; }
    setSchedError('');
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
      scheduledISO ? `🗓️ موعد التوصيل: ${formatScheduled(scheduledISO)}` : `🚀 التوصيل: في أقرب وقت`,
      ``,
      `——— الطلب ———`,
      lines,
      ``,
      `💳 الدفع: ${pm?.label || ''}`,
      delivery > 0 ? `🚚 التوصيل: ${fmt(delivery)} د.ع` : `🚚 التوصيل: مجاني`,
      couponDiscount > 0 ? `🎟️ كوبون ${coupon.code}: -${fmt(couponDiscount)} د.ع` : null,
      pointsDiscount > 0 ? `🎁 خصم النقاط: -${fmt(pointsDiscount)} د.ع (${redeemPoints} نقطة)` : null,
      walletUsed > 0 ? `👛 من المحفظة: -${fmt(walletUsed)} د.ع` : null,
      `💰 *الإجمالي: ${fmt(finalTotal)} د.ع*`,
    ].filter(Boolean);

    const url = `https://wa.me/${SETTINGS.whatsapp_number}?text=${encodeURIComponent(parts.join('\n'))}`;
    window.open(url, '_blank');

    // Save the order to the database + grant loyalty points (registered users).
    // Fired AFTER window.open (which must stay synchronous so mobile browsers
    // don't block the WhatsApp tab). Best-effort: never blocks the order.
    createOrder({
      accountId: profile?.id || null,
      name: form.name,
      phone: form.phone,
      email: form.email,
      area: form.area,
      address: form.address,
      notes: form.notes,
      payment: pm?.label || form.payment,
      location: geo ? `https://maps.google.com/?q=${geo.lat},${geo.lng}` : null,
      items: items.map((it) => ({ key: it.key ?? null, name: it.name, qty: it.qty, price: it.price, storeId: it.storeId ?? null })),
      subtotal: total,
      total: grand,
    }).then(async (res) => {
      // apply discounts on the freshly-created order (atomic & safe): coupon first, then points
      if (res?.ok && res.order?.id && profile?.id) {
        if (couponDiscount > 0 && coupon?.code) {
          try { await applyCouponToOrder(profile.id, res.order.id, coupon.code); } catch {}
        }
        if (redeemPoints > 0) {
          try { await redeemPointsForOrder(profile.id, res.order.id, redeemPoints); } catch {}
        }
        if (walletUsed > 0) {
          try { await redeemWalletForOrder(profile.id, res.order.id, walletUsed); } catch {}
        }
      }
      // attach the scheduled delivery time (works for guests too)
      if (res?.ok && res.order?.id && scheduledISO) {
        try { await setOrderSchedule(res.order.id, scheduledISO); } catch {}
      }
      // refresh the cached account so the updated points show next time the drawer opens
      if (res?.ok) reload?.();
      // notify the merchant(s) + admin via push (fire-and-forget)
      if (res?.ok && res.order?.id) notifyNewOrder(res.order.id);
      // take the customer to the professional tracking page
      if (res?.ok && res.order?.id) {
        window.location.href = '/order/' + res.order.id;
      }
    });
  }

  const fieldBase =
    'w-full rounded-2xl border bg-cream px-4 py-3 font-body text-ink placeholder:text-ink/35 outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20 dark:bg-night-800 dark:text-cream dark:placeholder:text-cream/30';
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
                className="absolute left-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-black/5 text-ink hover:bg-black/10 dark:bg-white/10 dark:text-cream dark:hover:bg-white/20"
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
                      : 'border-black/10 bg-cream text-ink hover:bg-black/[0.03] dark:border-white/10 dark:bg-night-800 dark:text-cream dark:hover:bg-white/5'
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

              {/* delivery timing — now vs scheduled */}
              <div>
                <p className="mb-2 font-display text-sm font-bold text-ink dark:text-cream">وقت التوصيل</p>
                <div className="grid grid-cols-2 gap-2.5">
                  <button type="button" onClick={() => { setSchedMode('now'); setSchedError(''); }}
                    className={`flex items-center justify-center gap-1.5 rounded-2xl border px-3 py-3 font-display text-sm font-bold transition ${schedMode === 'now' ? 'border-copper bg-copper/10 text-copper-dark dark:text-copper-light' : 'border-ink/10 text-ink/55 dark:border-white/10 dark:text-cream/55'}`}>
                    <Zap className="h-4 w-4" /> وصّلها الآن
                  </button>
                  <button type="button" onClick={() => setSchedMode('later')}
                    className={`flex items-center justify-center gap-1.5 rounded-2xl border px-3 py-3 font-display text-sm font-bold transition ${schedMode === 'later' ? 'border-copper bg-copper/10 text-copper-dark dark:text-copper-light' : 'border-ink/10 text-ink/55 dark:border-white/10 dark:text-cream/55'}`}>
                    <Calendar className="h-4 w-4" /> جدولة لاحقاً
                  </button>
                </div>

                {schedMode === 'later' && (
                  <div className="mt-3 space-y-3 rounded-2xl bg-ink/[0.03] p-3 dark:bg-white/[0.04]">
                    {/* day chips */}
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {schedDays.map((d) => (
                        <button key={d.offset} type="button" onClick={() => { setSchedOffset(d.offset); setSchedSlotId(''); setSchedError(''); }}
                          className={`shrink-0 rounded-xl border px-3 py-1.5 text-center transition ${schedOffset === d.offset ? 'border-copper bg-copper/15' : 'border-ink/10 dark:border-white/10'}`}>
                          <div className="font-display text-xs font-bold text-ink dark:text-cream">{d.label}</div>
                          <div className="text-[10px] text-ink/45 dark:text-cream/45">{d.sub}</div>
                        </button>
                      ))}
                    </div>
                    {/* slot chips */}
                    {schedSlots.length === 0 ? (
                      <p className="text-xs font-bold text-ink/50 dark:text-cream/50">انتهت فترات اليوم — اختر يوماً آخر 📆</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {schedSlots.map((s) => (
                          <button key={s.id} type="button" onClick={() => { setSchedSlotId(s.id); setSchedError(''); }}
                            className={`rounded-xl border px-3 py-1.5 font-body text-xs font-bold transition ${schedSlotId === s.id ? 'border-copper bg-copper/15 text-copper-dark dark:text-copper-light' : 'border-ink/10 text-ink/70 dark:border-white/10 dark:text-cream/70'}`}>
                            {s.label}
                          </button>
                        ))}
                      </div>
                    )}
                    {scheduledISO && (
                      <p className="text-xs font-bold text-brand-700 dark:text-brand-400">سيصلك: {formatScheduled(scheduledISO)} ✅</p>
                    )}
                    {schedError && <p className="text-xs font-bold text-red-600 dark:text-red-300">{schedError}</p>}
                  </div>
                )}
              </div>

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
                            : 'border-black/10 bg-cream hover:border-brand-600/40 dark:border-white/10 dark:bg-night-800'
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

              {/* coupon code (logged-in customers) */}
              {profile && (
                <div className="rounded-2xl bg-black/[0.03] p-4 dark:bg-white/[0.04]">
                  {coupon?.ok ? (
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-2 font-body text-sm font-bold text-green-700 dark:text-green-400">
                        <Ticket className="h-4 w-4" /> كوبون {coupon.code} — خصم {fmt(couponDiscount)} د.ع
                      </span>
                      <button type="button" onClick={clearCoupon} className="text-xs font-bold text-red-600 dark:text-red-300">إزالة</button>
                    </div>
                  ) : (
                    <>
                      <span className="mb-1.5 flex items-center gap-1.5 font-body text-sm font-bold text-ink dark:text-cream"><Ticket className="h-4 w-4 text-copper" /> عندك كوبون خصم؟</span>
                      <div className="flex gap-2">
                        <input
                          value={couponInput}
                          onChange={(e) => { setCouponInput(e.target.value); setCouponErr(''); }}
                          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); applyCoupon(); } }}
                          placeholder="اكتب الكود" dir="ltr"
                          className="flex-1 rounded-xl border border-black/10 bg-cream px-3 py-2.5 text-center font-body font-bold uppercase tracking-wider text-ink outline-none focus:border-copper dark:border-white/10 dark:bg-night-800 dark:text-cream"
                        />
                        <button type="button" onClick={applyCoupon} disabled={couponBusy || !couponInput.trim()}
                          className="shrink-0 rounded-xl bg-brand-800 px-4 py-2.5 font-display text-sm font-bold text-cream transition hover:bg-brand-700 disabled:opacity-50 dark:bg-brand-600">
                          {couponBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'تطبيق'}
                        </button>
                      </div>
                      {couponErr && <p className="mt-1.5 flex items-center gap-1 font-body text-xs text-red-500"><AlertCircle className="h-3.5 w-3.5" /> {couponErr}</p>}
                    </>
                  )}
                </div>
              )}

              {/* loyalty points — surfaced proactively at the moment of intent */}
              {profile && balance > 0 && (
                canRedeem ? (
                  <button
                    type="button"
                    onClick={() => setUsePts((v) => !v)}
                    className={`flex w-full items-center justify-between gap-3 rounded-2xl px-4 py-3.5 text-right ring-1 transition ${usePts ? 'bg-green-500/10 ring-green-500/30' : 'bg-copper/[0.07] ring-copper/20 hover:ring-copper/40'}`}
                  >
                    <span className="flex items-center gap-3">
                      <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${usePts ? 'bg-green-500 text-white' : 'bg-copper/15 text-copper'}`}><Gift className="h-5 w-5" /></span>
                      <span className="leading-tight">
                        <span className="block font-display text-sm font-black text-ink dark:text-cream">
                          {usePts ? `طبّقنا خصم ${fmt(pointsDiscount)} د.ع 🎉` : `عندك ${balance.toLocaleString('en')} نقطة جاهزة`}
                        </span>
                        <span className="block font-body text-[11px] text-ink/55 dark:text-cream/55">
                          {usePts ? `استخدمنا ${redeemPoints.toLocaleString('en')} نقطة — اضغط للإلغاء` : `استخدمها = خصم حتى ${fmt(maxRedeemable * dpp)} د.ع على طلبك`}
                        </span>
                      </span>
                    </span>
                    <span dir="ltr" className={`relative h-7 w-[52px] shrink-0 rounded-full transition-colors ${usePts ? 'bg-green-500' : 'bg-ink/20 dark:bg-white/20'}`}>
                      <span className={`absolute top-1/2 h-5 w-5 -translate-y-1/2 rounded-full bg-white shadow transition-all ${usePts ? 'left-[26px]' : 'left-1'}`} />
                    </span>
                  </button>
                ) : (
                  <div className="flex items-center gap-3 rounded-2xl bg-copper/[0.07] px-4 py-3 ring-1 ring-copper/15">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-copper/15 text-copper"><Gift className="h-4 w-4" /></span>
                    <p className="font-body text-[12px] leading-snug text-ink/60 dark:text-cream/60">
                      عندك <b className="text-ink dark:text-cream">{balance.toLocaleString('en')}</b> نقطة — تكدر تستخدمها خصماً بطلبات فوق {fmt(minOrder)} د.ع.
                    </p>
                  </div>
                )
              )}

              {/* wallet credit — pay with store balance */}
              {profile && walletAvail > 0 && (
                <button
                  type="button"
                  onClick={() => setUseWallet((v) => !v)}
                  className={`flex w-full items-center justify-between gap-3 rounded-2xl px-4 py-3.5 text-right ring-1 transition ${useWallet ? 'bg-green-500/10 ring-green-500/30' : 'bg-brand-800/[0.06] ring-brand-800/15 hover:ring-brand-700/40'}`}
                >
                  <span className="flex items-center gap-3">
                    <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${useWallet ? 'bg-green-500 text-white' : 'bg-brand-700/15 text-brand-700 dark:text-brand-300'}`}><Wallet className="h-5 w-5" /></span>
                    <span className="leading-tight">
                      <span className="block font-display text-sm font-black text-ink dark:text-cream">
                        {useWallet ? `استخدمنا ${fmt(walletUsed)} د.ع من رصيدك` : `رصيدك ${fmt(walletAvail)} د.ع`}
                      </span>
                      <span className="block font-body text-[11px] text-ink/55 dark:text-cream/55">
                        {useWallet ? `يتبقّى ${fmt(walletAvail - walletUsed)} د.ع — اضغط للإلغاء` : 'ادفع جزءاً أو كل الطلب من محفظتك'}
                      </span>
                    </span>
                  </span>
                  <span dir="ltr" className={`relative h-7 w-[52px] shrink-0 rounded-full transition-colors ${useWallet ? 'bg-green-500' : 'bg-ink/20 dark:bg-white/20'}`}>
                    <span className={`absolute top-1/2 h-5 w-5 -translate-y-1/2 rounded-full bg-white shadow transition-all ${useWallet ? 'left-[26px]' : 'left-1'}`} />
                  </span>
                </button>
              )}

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
                  <span className="text-ink/70 dark:text-cream/70">
                    التوصيل
                    {storeCount > 1 && delivery > 0 && (
                      <span className="text-xs text-ink/40 dark:text-cream/40"> ({storeCount} متاجر)</span>
                    )}
                  </span>
                  <span className="font-display font-bold text-brand-700 dark:text-brand-400">
                    {delivery > 0 ? `${fmt(delivery)} د.ع` : 'مجاني ✓'}
                  </span>
                </div>
                {couponDiscount > 0 && (
                  <div className="mb-1.5 flex items-center justify-between font-body text-sm">
                    <span className="text-green-700 dark:text-green-400">🎟️ كوبون {coupon.code}</span>
                    <span className="font-display font-bold text-green-700 dark:text-green-400">- {fmt(couponDiscount)} د.ع</span>
                  </div>
                )}
                {redeemPoints > 0 && (
                  <div className="mb-1.5 flex items-center justify-between font-body text-sm">
                    <span className="text-green-700 dark:text-green-400">🎁 خصم النقاط ({redeemPoints.toLocaleString('en')} نقطة)</span>
                    <span className="font-display font-bold text-green-700 dark:text-green-400">- {fmt(pointsDiscount)} د.ع</span>
                  </div>
                )}
                {walletUsed > 0 && (
                  <div className="mb-1.5 flex items-center justify-between font-body text-sm">
                    <span className="text-green-700 dark:text-green-400">👛 من المحفظة</span>
                    <span className="font-display font-bold text-green-700 dark:text-green-400">- {fmt(walletUsed)} د.ع</span>
                  </div>
                )}
                <div className="mt-2 flex items-center justify-between border-t border-black/10 pt-2 dark:border-white/10">
                  <span className="font-display text-lg font-black text-ink dark:text-cream">المجموع</span>
                  <span className="font-display text-xl font-black text-brand-800 dark:text-brand-400">
                    {totalDiscount > 0 && <span className="ml-2 align-middle text-sm font-bold text-ink/35 line-through dark:text-cream/35">{fmt(grand)}</span>}
                    {fmt(finalTotal)} <span className="text-sm">د.ع</span>
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
