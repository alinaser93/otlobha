import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Wallet, Gift, Copy, Check, LogOut, User, MapPin, Phone,
  Pencil, Loader2, Users, BadgeCheck, ShieldAlert,
} from 'lucide-react';
import { useAuth } from '../lib/auth.jsx';
import { AREAS, CITY, POINTS } from '../config.js';
import { useBackClose } from '../lib/motion.js';

export default function AccountDrawer({ open, onClose }) {
  const { account, updateProfile, logout } = useAuth();
  useBackClose(open, onClose);
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ name: '', area: '', address: '' });

  useEffect(() => {
    if (account) setForm({ name: account.name || '', area: account.area || '', address: account.address || '' });
  }, [account, open]);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!account && open) {
    // safety: nothing to show without an account
  }

  const code = account?.referral_code || '------';
  const link =
    typeof window !== 'undefined' ? `${window.location.origin}/?ref=${code}` : `/?ref=${code}`;
  const points = account?.points ?? 0;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {}
  }

  async function save() {
    setBusy(true);
    await updateProfile({ name: form.name.trim(), area: form.area, address: form.address.trim() });
    setBusy(false);
    setEditing(false);
  }

  return (
    <AnimatePresence>
      {open && account && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[85] bg-ink/40 backdrop-blur-sm"
          />
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="fixed inset-y-0 left-0 z-[86] flex w-full max-w-md flex-col bg-beige shadow-card dark:bg-night"
            dir="rtl"
          >
            {/* header */}
            <div className="flex items-center justify-between bg-brand-900 px-5 py-4 dark:bg-night-700">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-full bg-copper font-display text-xl font-black text-cream">
                  {(account.name || 'ض').trim().charAt(0)}
                </span>
                <div>
                  <div className="flex items-center gap-1.5 font-display text-lg font-extrabold text-cream">
                    {account.name || 'حسابي'}
                    {account.verified ? (
                      <BadgeCheck className="h-4 w-4 text-brand-300" />
                    ) : null}
                  </div>
                  <div className="font-body text-xs text-cream/60" dir="ltr">
                    {account.phone || ''}
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="grid h-9 w-9 place-items-center rounded-full bg-cream/15 text-cream hover:bg-cream/25"
                aria-label="إغلاق"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto p-5">
              {/* verification status */}
              {!account.verified && (
                <div className="flex items-center gap-2 rounded-2xl bg-amber-50 px-4 py-2.5 font-body text-sm text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
                  <ShieldAlert className="h-4 w-4 shrink-0" />
                  <span>رقمك غير موثّق بعد — سيُفعّل التوثيق قريباً ويمنحك مزايا إضافية.</span>
                </div>
              )}

              {/* points wallet */}
              <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-brand-800 to-brand-950 p-5 text-cream shadow-soft">
                <div className="flex items-center gap-2 font-body text-sm text-cream/80">
                  <Wallet className="h-4 w-4" /> محفظة النقاط
                </div>
                <div className="mt-2 font-display text-4xl font-black">
                  {points.toLocaleString('en')} <span className="text-xl font-bold text-copper-light">نقطة</span>
                </div>
                <div className="mt-1 font-body text-xs text-cream/60">
                  ≈ {(points * POINTS.dinarPerPoint).toLocaleString('en')} د.ع رصيد
                </div>
              </div>

              {/* referral */}
              <div className="rounded-3xl bg-cream p-5 shadow-soft dark:bg-night-800">
                <div className="flex items-center gap-2 font-display text-lg font-extrabold text-ink dark:text-cream">
                  <Gift className="h-5 w-5 text-copper" /> ادعُ واربح
                </div>
                <p className="mt-1 font-body text-sm text-ink/60 dark:text-cream/60">
                  صديقك يحصل على {POINTS.referralInvitee.toLocaleString('en')} نقطة، وأنت{' '}
                  {POINTS.referralInviter.toLocaleString('en')} نقطة عند انضمامه عبر رابطك.
                </p>
                <div className="mt-3 flex items-center gap-2 rounded-2xl bg-ink/5 p-2 dark:bg-white/5">
                  <code className="flex-1 truncate px-2 font-body text-sm text-ink/70 dark:text-cream/70" dir="ltr">
                    {link}
                  </code>
                  <button
                    onClick={copyLink}
                    className="flex shrink-0 items-center gap-1.5 rounded-xl bg-copper px-3 py-2 font-body text-sm font-bold text-cream hover:bg-copper-dark"
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    {copied ? 'تم' : 'نسخ'}
                  </button>
                </div>
                <div className="mt-2 flex items-center gap-1.5 font-body text-xs text-ink/40 dark:text-cream/40">
                  <Users className="h-3.5 w-3.5" /> كودك: <b className="text-copper">{code}</b>
                </div>
              </div>

              {/* profile details */}
              <div className="rounded-3xl bg-cream p-5 shadow-soft dark:bg-night-800">
                <div className="mb-3 flex items-center justify-between">
                  <span className="font-display text-lg font-extrabold text-ink dark:text-cream">بياناتي</span>
                  {!editing && (
                    <button
                      onClick={() => setEditing(true)}
                      className="flex items-center gap-1 font-body text-sm text-copper hover:underline"
                    >
                      <Pencil className="h-4 w-4" /> تعديل
                    </button>
                  )}
                </div>

                {!editing ? (
                  <div className="space-y-2.5 font-body text-sm text-ink/80 dark:text-cream/80">
                    <Row icon={User} v={account.name} />
                    <Row icon={Phone} v={account.phone} ltr />
                    <Row icon={MapPin} v={[account.area, account.address].filter(Boolean).join(' — ') || '—'} />
                  </div>
                ) : (
                  <div className="space-y-3">
                    <input
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      placeholder="الاسم"
                      className="w-full rounded-xl border-2 border-ink/10 bg-cream px-3 py-2.5 font-body text-ink outline-none focus:border-copper dark:border-white/10 dark:bg-night dark:text-cream"
                    />
                    <select
                      value={form.area}
                      onChange={(e) => setForm((f) => ({ ...f, area: e.target.value }))}
                      className="w-full rounded-xl border-2 border-ink/10 bg-cream px-3 py-2.5 font-body text-ink outline-none focus:border-copper dark:border-white/10 dark:bg-night dark:text-cream"
                    >
                      <option value="">المنطقة داخل {CITY}</option>
                      {AREAS.map((a) => (
                        <option key={a} value={a}>
                          {a}
                        </option>
                      ))}
                    </select>
                    <input
                      value={form.address}
                      onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                      placeholder="العنوان"
                      className="w-full rounded-xl border-2 border-ink/10 bg-cream px-3 py-2.5 font-body text-ink outline-none focus:border-copper dark:border-white/10 dark:bg-night dark:text-cream"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={save}
                        disabled={busy}
                        className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-copper py-2.5 font-body font-bold text-cream hover:bg-copper-dark disabled:opacity-50"
                      >
                        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'حفظ'}
                      </button>
                      <button
                        onClick={() => setEditing(false)}
                        className="rounded-xl bg-ink/10 px-4 py-2.5 font-body text-ink dark:bg-white/10 dark:text-cream"
                      >
                        إلغاء
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* logout */}
            <div className="border-t border-ink/10 p-4 dark:border-white/10">
              <button
                onClick={() => {
                  logout();
                  onClose?.();
                }}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-ink/5 py-3 font-body font-bold text-red-600 hover:bg-red-50 dark:bg-white/5 dark:text-red-400 dark:hover:bg-red-500/10"
              >
                <LogOut className="h-5 w-5" /> تسجيل الخروج
              </button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function Row({ icon: Icon, v, ltr }) {
  return (
    <div className="flex items-center gap-2.5">
      <Icon className="h-4 w-4 shrink-0 text-ink/40 dark:text-cream/40" />
      <span dir={ltr ? 'ltr' : 'rtl'} className={ltr ? 'text-left' : ''}>
        {v || '—'}
      </span>
    </div>
  );
}
