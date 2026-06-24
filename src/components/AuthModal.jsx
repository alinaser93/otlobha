import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Check, AlertCircle, Phone, Lock, User, Gift } from 'lucide-react';
import { useAuth } from '../lib/auth.jsx';
import { AREAS, CITY, POINTS, SHOP_NAME } from '../config.js';

const REF_KEY = 'otlobha-ref';

export default function AuthModal({ open, onClose }) {
  const { enabled, signup, login } = useAuth();
  const [mode, setMode] = useState('signup'); // signup | login
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [done, setDone] = useState(false);
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

  async function submit() {
    setErr('');
    const phoneDigits = f.phone.replace(/\D/g, '');
    if (phoneDigits.length < 10) return setErr('أدخل رقم هاتف صحيح');
    if (f.pin.length !== 4) return setErr('الرمز السري 4 أرقام');

    setBusy(true);
    let res;
    if (mode === 'signup') {
      if (!f.name.trim()) {
        setBusy(false);
        return setErr('الرجاء كتابة الاسم');
      }
      if (!f.area) {
        setBusy(false);
        return setErr('اختر المنطقة');
      }
      res = await signup(f);
    } else {
      res = await login({ phone: f.phone, pin: f.pin });
    }
    setBusy(false);
    if (res.error) return setErr(res.error);

    try {
      localStorage.removeItem(REF_KEY);
    } catch {}
    setDone(true);
    setTimeout(() => onClose?.(), 1300);
  }

  const pinField = (
    <label className="block">
      <span className="mb-1.5 block font-body text-sm font-bold text-ink dark:text-cream">
        الرمز السري (4 أرقام)
      </span>
      <div className="flex items-center gap-2 rounded-2xl border-2 border-ink/10 bg-white px-3 focus-within:border-copper dark:border-white/15 dark:bg-night-700">
        <Lock className="h-5 w-5 text-ink/40 dark:text-cream/40" />
        <input
          type="password"
          inputMode="numeric"
          dir="ltr"
          maxLength={4}
          value={f.pin}
          onChange={(e) => set('pin', e.target.value.replace(/\D/g, ''))}
          placeholder="••••"
          className="w-full bg-transparent py-3.5 text-left font-display text-2xl tracking-[0.4em] text-ink outline-none placeholder:text-ink/30 dark:placeholder:text-cream/40 dark:text-cream"
        />
      </div>
    </label>
  );

  const phoneField = (
    <label className="block">
      <span className="mb-1.5 block font-body text-sm font-bold text-ink dark:text-cream">رقم الهاتف</span>
      <div className="flex items-center gap-2 rounded-2xl border-2 border-ink/10 bg-white px-3 focus-within:border-copper dark:border-white/15 dark:bg-night-700">
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
          className="fixed inset-0 z-[90] grid place-items-center overflow-y-auto bg-ink/50 p-4 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.94, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.94, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 24, stiffness: 280 }}
            onClick={(e) => e.stopPropagation()}
            className="relative my-auto w-full max-w-md overflow-hidden rounded-3xl bg-cream shadow-card dark:bg-night-800"
            dir="rtl"
          >
            {/* header */}
            <div className="relative bg-brand-900 px-6 pb-6 pt-6 text-center dark:bg-night-700">
              <button
                onClick={onClose}
                className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-cream/15 text-cream hover:bg-cream/25"
                aria-label="إغلاق"
              >
                <X className="h-5 w-5" />
              </button>
              <img src="/icons/icon-192.png" alt={SHOP_NAME} className="mx-auto mb-3 h-14 w-14 rounded-full" />
              <h2 className="font-display text-2xl font-extrabold text-cream">
                {done ? 'أهلاً بك! 🎉' : mode === 'signup' ? 'حساب جديد' : 'تسجيل الدخول'}
              </h2>
              <p className="mt-1 font-body text-sm text-cream/70">
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
                      <div className="flex items-center gap-2 rounded-2xl border-2 border-ink/10 bg-white px-3 focus-within:border-copper dark:border-white/15 dark:bg-night-700">
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
                        className="w-full rounded-2xl border-2 border-ink/10 bg-white px-4 py-3.5 font-body text-ink outline-none focus:border-copper dark:border-white/15 dark:bg-night-700 dark:text-cream"
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
                        className="w-full rounded-2xl border-2 border-ink/10 bg-white px-4 py-3.5 font-body text-ink outline-none focus:border-copper dark:border-white/15 dark:bg-night-700 dark:text-cream"
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
                    <p className="text-center font-body text-xs text-ink/50 dark:text-cream/50">
                      بإنشائك الحساب تحصل على {POINTS.welcome.toLocaleString('en')} نقطة ترحيبية 🎁
                    </p>
                  )}
                </div>
              </div>
            )}

            {done && (
              <div className="px-6 py-10 text-center">
                <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-brand-100 text-brand-700 dark:bg-brand-700/20">
                  <Check className="h-9 w-9" />
                </div>
                <p className="mt-4 font-body text-ink/70 dark:text-cream/70">تم تسجيل دخولك بنجاح</p>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
