// 📳 زرّ تفعيل/إيقاف إشعارات الجهاز (Push) — يُستخدم بلوحات التاجر/المندوب/الأدمن.
import { useEffect, useState } from 'react';
import { BellRing, BellOff, Loader2, Check } from 'lucide-react';
import { pushSupported, pushStatus, enablePush, disablePush } from '../lib/push.js';

export default function PushToggle({ partyType, partyId }) {
  const [status, setStatus] = useState('loading'); // loading|unsupported|denied|default|granted-on|granted-off
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!pushSupported()) { setStatus('unsupported'); return; }
    pushStatus(partyType).then(setStatus);
    /* eslint-disable-next-line */
  }, []);

  async function enable() {
    setBusy(true);
    const r = await enablePush(partyType, partyId);
    setBusy(false);
    setStatus(r.ok ? 'granted-on' : r.error === 'denied' ? 'denied' : 'granted-off');
  }
  async function disable() {
    setBusy(true);
    await disablePush(partyType);
    setBusy(false);
    setStatus('granted-off');
  }

  if (status === 'loading') return null;

  if (status === 'unsupported') {
    return (
      <div className="rounded-2xl bg-ink/5 px-4 py-3 text-center text-xs text-ink/50 dark:bg-white/5 dark:text-cream/50">
        جهازك أو متصفّحك لا يدعم إشعارات الخلفية. جرّب Chrome على أندرويد، أو «أضِف للشاشة الرئيسية» على آيفون.
      </div>
    );
  }

  if (status === 'denied') {
    return (
      <div className="rounded-2xl bg-amber-500/10 px-4 py-3 text-center text-xs font-bold text-amber-700 ring-1 ring-amber-500/20 dark:text-amber-300">
        الإشعارات محظورة من إعدادات المتصفّح. فعّلها يدوياً: إعدادات الموقع ← الإشعارات ← سماح.
      </div>
    );
  }

  if (status === 'granted-on') {
    return (
      <div className="flex items-center justify-between gap-2 rounded-2xl bg-green-500/10 px-4 py-3 ring-1 ring-green-500/20">
        <span className="flex items-center gap-1.5 font-display text-sm font-black text-green-700 dark:text-green-300">
          <Check className="h-4 w-4" /> إشعارات الجهاز مفعّلة
        </span>
        <button onClick={disable} disabled={busy}
          className="flex items-center gap-1 rounded-lg bg-ink/5 px-2.5 py-1 text-[11px] font-bold text-ink/60 hover:bg-ink/10 disabled:opacity-50 dark:bg-white/10 dark:text-cream/60">
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <BellOff className="h-3.5 w-3.5" />} إيقاف
        </button>
      </div>
    );
  }

  // default | granted-off → invite to enable
  return (
    <button onClick={enable} disabled={busy}
      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-copper py-3 font-display font-bold text-cream shadow-soft transition hover:bg-copper-dark active:scale-[.99] disabled:opacity-60">
      {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <BellRing className="h-5 w-5" />}
      فعّل إشعارات الجهاز (حتى لو التطبيق مسكّر)
    </button>
  );
}
