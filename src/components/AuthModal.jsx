import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Check, AlertCircle, Phone, Lock, User, Gift } from 'lucide-react';
import { useAuth } from '../lib/auth.jsx';
import { CodeInput, SuccessCheck } from './CodeInput.jsx';
import { AREAS, CITY, POINTS, SHOP_NAME } from '../config.js';

const REF_KEY = 'otlobha-ref';

export default function AuthModal({ open, onClose }) {
  const { enabled, signup, login } = useAuth();
  const [mode, setMode] = useState('signup'); // signup | login
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [done, setDone] = useState(false);
  const [shake, setShake] = useState(false);
  const [f, setF] = useState({ phone: '', pin: '', name: '', area: '', address: '', ref: '' });

  useEffect(() => {
    if (!open) return;
    setMode('signup');
    setErr('');
    setBusy(false);
    setDone(false);
    let ref = '';
    try {
      ref = localStorage.getItem(REF_KEY) || '';
    } catch {}
    setF({ phone: '', pin: '', name: '', area: '', address: '', ref });
  }, [open]);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const set = (k, v) => {
    setF((s) => ({ ...s, [k]: v }));
    if (err) setErr('');
  };

  function fail(m) {
    setShake(true);
    setTimeout(() => setShake(false), 550);
    return setErr(m);
  }

  async function submit(pinOverride) {
    setErr('');
    const pin = typeof pinOverride === 'string' ? pinOverride : f.pin;
    const phoneDigits = f.phone.replace(/\D/g, '');
    if (phoneDigits.length < 10) return fail('أدخل رقم هاتف صحيح');
    if (pin.length !== 4) return fail('الرمز السري 4 أرقام');

    setBusy(true);
    let res;
    if (mode === 'signup') {
      if (!f.name.trim()) {
        setBusy(false);
        return fail('الرجاء كتابة الاسم');
      }
      if (!f.area) {
        setBusy(false);
        return fail('اختر المنطقة');
      }
      res = await signup({ ...f, pin });
    } else {
      res = await login({ phone: f.phone, pin });
    }
    setBusy(false);
    if (res.error) return fail(res.error);

    try {
      localStorage.removeItem(REF_KEY);
    } catch {}
    setDone(true);
    setTimeout(() => onClose?.(), 1300);
  }

  const pinField = (
    <div>
      <span className="mb-2 block text-center font-body text-sm font-bold text-ink dark:text-cream">
        الرمز السري (4 أرقام)
      </span>
      <CodeInput
        length={4}
        mask
        value={f.pin}
        onChange={(v) => set('pin', v)}
        onComplete={(v) => { if (mode === 'login') submit(v); }}
        error={shake}
      />
    </div>
  );

  const phoneField = (
    <label className="block">
      <span className="mb-1.5 block font-body text-sm font-bold text-ink dark:text-cream">رقم الهاتف</span>
      <div className="flex items-center gap-2 rounded-2xl border-2 border-ink/10 bg-beige px-3 focus-within:border-copper focus-within:ring-2 focus-within:ring-copper/20 dark:border-white/10 dark:bg-night-900">
        <Phone className="h-5 w-5 text-ink/40 dark:text-cream/40" />
        <input
          type="tel"
          dir="ltr"
          value={f.phone}
          onChange={(e) => set('phone', e.target.value)}
          placeholder="07XX XXX XXXX"
          className="w-full bg-transparent py-3.5 text-left font-body text-ink outline-none placeholder:text-ink/30 dark:placeholder:text-cream/40 dark:text-cream"
        />
      </div>
    </label>
  );

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[90] grid place-items-center overflow-y-auto bg-ink/60 p-4 backdrop-blur-sm dark:bg-black/70"
        >
          <motion.div
            initial={{ scale: 0.94, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.94, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 24, stiffness: 280 }}
            onClick={(e) => e.stopPropagation()}
            className="relative my-auto w-full max-w-md overflow-hidden rounded-[28px] bg-cream shadow-2xl ring-1 ring-black/5 dark:bg-night-800 dark:ring-white/10"
            dir="rtl"
          >
            {/* header — rich solid gradient */}
            <div className="relative overflow-hidden bg-gradient-to-br from-brand-700 via-brand-800 to-brand-900 px-6 pb-7 pt-7 text-center">
              {/* decorative glow */}
              <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
              <div className="pointer-events-none absolute -left-12 bottom-0 h-28 w-28 rounded-full bg-copper/20 blur-2xl" />
              <button
                onClick={onClose}
                className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-white/15 text-cream backdrop-blur-md transition hover:bg-white/25"
                aria-label="إغلاق"
              >
                <X className="h-5 w-5" />
              </button>
              <img src="/icons/icon-192.png" alt={SHOP_NAME} className="relative mx-auto mb-3 h-16 w-16 rounded-2xl shadow-lg ring-2 ring-white/30" />
              <h2 className="relative font-display text-2xl font-extrabold text-cream">
                {done ? 'أهلاً بك! 🎉' : mode === 'signup' ? 'حساب جديد' : 'تسجيل الدخول'}
              </h2>
              <p className="relative mt-1 font-body text-sm text-cream/80">
                {done
                  ? 'تم بنجاح — يبقى حسابك مفتوحاً على جهازك'
                  : mode === 'signup'
                  ? 'سجّل بسهولة برقمك ورمز سري — بلا رسائل'
                  : 'أدخل رقمك ورمزك السري'}
              </p>
            </div>

            {!done && (
              <div className="px-6 py-6">
                {!enabled && (
                  <div className="mb-4 flex items-start gap-2 rounded-2xl bg-amber-50 p-3 font-body text-sm text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>نظام الحسابات لم يُفعّل بعد. على صاحب المتجر إكمال إعداد Supabase.</span>
                  </div>
                )}

                {/* mode tabs */}
                <div className="mb-5 grid grid-cols-2 gap-1 rounded-2xl bg-ink/5 p-1 dark:bg-white/5">
                  {[
                    ['signup', 'حساب جديد'],
                    ['login', 'دخول'],
                  ].map(([m, label]) => (
                    <button
                      key={m}
                      onClick={() => {
                        setMode(m);
                        setErr('');
                      }}
                      className={`rounded-xl py-2.5 font-display text-sm font-bold transition ${
                        mode === m
                          ? 'bg-copper text-cream shadow-seal'
                          : 'text-ink/60 dark:text-cream/60'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {err && (
                  <div className="mb-4 flex items-center gap-2 rounded-2xl bg-red-50 p-3 font-body text-sm text-red-700 dark:bg-red-500/10 dark:text-red-300">
                    <AlertCircle className="h-4 w-4 shrink-0" /> {err}
                  </div>
                )}

                <div className="space-y-3.5">
                  {mode === 'signup' && (
                    <label className="block">
                      <span className="mb-1.5 block font-body text-sm font-bold text-ink dark:text-cream">الاسم الكامل</span>
                      <div className="flex items-center gap-2 rounded-2xl border-2 border-ink/10 bg-beige px-3 focus-within:border-copper focus-within:ring-2 focus-within:ring-copper/20 dark:border-white/10 dark:bg-night-900">
                        <User className="h-5 w-5 text-ink/40 dark:text-cream/40" />
                        <input
                          value={f.name}
                          onChange={(e) => set('name', e.target.value)}
                          placeholder="اسمك الكريم"
                          className="w-full bg-transparent py-3.5 font-body text-ink outline-none placeholder:text-ink/30 dark:placeholder:text-cream/40 dark:text-cream"
                        />
                      </div>
                    </label>
                  )}

                  {phoneField}
                  {pinField}

                  {mode === 'signup' && (
                    <>
                      <select
                        value={f.area}
                        onChange={(e) => set('area', e.target.value)}
                        className="w-full rounded-2xl border-2 border-ink/10 bg-beige px-4 py-3.5 font-body text-ink outline-none focus:border-copper focus:ring-2 focus:ring-copper/20 dark:border-white/15 dark:bg-night-900 dark:text-cream"
                      >
                        <option value="">المنطقة داخل {CITY} *</option>
                        {AREAS.map((a) => (
                          <option key={a} value={a}>
                            {a}
                          </option>
                        ))}
                      </select>
                      <input
                        value={f.address}
                        onChange={(e) => set('address', e.target.value)}
                        placeholder="العنوان (أقرب نقطة دالة)"
                        className="w-full rounded-2xl border-2 border-ink/10 bg-beige px-4 py-3.5 font-body text-ink outline-none focus:border-copper focus:ring-2 focus:ring-copper/20 dark:border-white/15 dark:bg-night-900 dark:text-cream"
                      />
                      <label className="flex items-center gap-2 rounded-2xl border-2 border-dashed border-copper/40 bg-copper/5 px-4 py-3">
                        <Gift className="h-5 w-5 shrink-0 text-copper" />
                        <input
                          value={f.ref}
                          onChange={(e) => set('ref', e.target.value.toUpperCase())}
                          dir="ltr"
                          placeholder="كود دعوة (اختياري)"
                          className="w-full bg-transparent text-left font-body text-ink outline-none placeholder:text-ink/40 dark:placeholder:text-cream/40 dark:text-cream"
                        />
                      </label>
                    </>
                  )}

                  <button
                    onClick={submit}
                    disabled={busy || !enabled}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-copper py-3.5 font-display text-lg font-bold text-cream shadow-seal transition hover:bg-copper-dark disabled:opacity-50"
                  >
                    {busy ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : mode === 'signup' ? (
                      'إنشاء الحساب'
                    ) : (
                      'دخول'
                    )}
                  </button>

                  {mode === 'signup' && (
                    <div className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-l from-copper/15 to-amber-400/15 px-4 py-3 ring-1 ring-copper/20">
                      <Gift className="h-5 w-5 shrink-0 text-copper" />
                      <p className="text-center font-body text-sm font-bold text-copper-dark dark:text-copper-light">
                        احصل على {POINTS.welcome.toLocaleString('en')} نقطة ترحيبية فور التسجيل 🎁
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {done && (
              <div className="px-6 py-8">
                <SuccessCheck label="تم بنجاح 🎉" sub="يبقى حسابك مفتوحاً على جهازك" />
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
