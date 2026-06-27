// 📲 زرّ «أضف للشاشة الرئيسية» (PWA) — أندرويد/كروم تلقائي، آيفون بتعليمات.
import { useEffect, useState } from 'react';
import { Download, Share, SquarePlus, X, Check } from 'lucide-react';

// beforeinstallprompt قد يُطلق قبل تركيب المكوّن — نلتقطه على مستوى الوحدة
let deferredPrompt = null;
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    window.dispatchEvent(new Event('otlobha-installable'));
  });
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    window.dispatchEvent(new Event('otlobha-installed'));
  });
}

function isStandalone() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
}
function isIOS() {
  if (typeof navigator === 'undefined') return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream;
}

/**
 * variant:
 *  - 'button' (افتراضي): زرّ كامل العرض
 *  - 'card': بطاقة بعنوان ووصف (للوحات)
 */
export default function InstallButton({ variant = 'button', label }) {
  const [canInstall, setCanInstall] = useState(typeof window !== 'undefined' && !!deferredPrompt);
  const [installed, setInstalled] = useState(false);
  const [iosHelp, setIosHelp] = useState(false);

  useEffect(() => {
    if (isStandalone()) { setInstalled(true); return; }
    const onInstallable = () => setCanInstall(true);
    const onInstalled = () => setInstalled(true);
    window.addEventListener('otlobha-installable', onInstallable);
    window.addEventListener('otlobha-installed', onInstalled);
    return () => {
      window.removeEventListener('otlobha-installable', onInstallable);
      window.removeEventListener('otlobha-installed', onInstalled);
    };
  }, []);

  if (installed) return null;

  // آيفون لا يطلق الحدث؛ نعرض الزرّ دائماً مع تعليمات. أندرويد فقط عند توفّر الحدث.
  const ios = isIOS();
  if (!canInstall && !ios) return null;

  async function onClick() {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      try { await deferredPrompt.userChoice; } catch (e) { /* ignore */ }
      deferredPrompt = null;
      setCanInstall(false);
    } else if (ios) {
      setIosHelp((v) => !v);
    }
  }

  const btnLabel = label || 'أضِف التطبيق للشاشة الرئيسية';

  const iosBox = iosHelp && (
    <div className="mt-2 rounded-xl bg-ink/[0.04] p-3 text-xs leading-relaxed text-ink/70 dark:bg-white/[0.04] dark:text-cream/70">
      <div className="mb-1 flex items-center justify-between font-bold text-ink dark:text-cream">
        <span>على آيفون (Safari):</span>
        <button onClick={() => setIosHelp(false)} className="text-ink/40 dark:text-cream/40"><X className="h-3.5 w-3.5" /></button>
      </div>
      <ol className="list-inside list-decimal space-y-1">
        <li>اضغط زرّ المشاركة <Share className="inline h-3.5 w-3.5 -translate-y-px" /> بالأسفل.</li>
        <li>اختر <span className="font-bold">«إضافة إلى الشاشة الرئيسية»</span> <SquarePlus className="inline h-3.5 w-3.5 -translate-y-px" />.</li>
        <li>اضغط <span className="font-bold">«إضافة»</span> — و افتح اطلبها من الأيقونة.</li>
      </ol>
    </div>
  );

  if (variant === 'card') {
    return (
      <div className="rounded-2xl bg-brand-800/5 p-3.5 ring-1 ring-brand-800/10">
        <span className="mb-1 flex items-center gap-1.5 font-display text-sm font-black text-ink dark:text-cream"><Download className="h-4 w-4 text-copper" /> تطبيق اطلبها على هاتفك</span>
        <p className="mb-2.5 text-[11px] leading-snug text-ink/50 dark:text-cream/50">ثبّته كأيقونة على شاشتك ليفتح أسرع ويستقبل الإشعارات.</p>
        <button onClick={onClick}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-700 py-3 font-display font-bold text-cream shadow-soft transition hover:bg-brand-800 active:scale-[.99]">
          <Download className="h-5 w-5" /> {btnLabel}
        </button>
        {iosBox}
      </div>
    );
  }

  return (
    <div>
      <button onClick={onClick}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-copper py-3 font-display font-bold text-cream shadow-soft transition hover:bg-copper-dark active:scale-[.99]">
        <Download className="h-5 w-5" /> {btnLabel}
      </button>
      {iosBox}
    </div>
  );
}
