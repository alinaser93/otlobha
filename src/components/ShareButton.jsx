// 🔗 زرّ مشاركة موحّد — مشاركة أصلية بنظام الهاتف + نسخ كبديل.
import { useState } from 'react';
import { Share2, Check } from 'lucide-react';

function buildUrl(path) {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://otlobha.netlify.app';
  if (!path) return origin + '/';
  return origin + (path.startsWith('/') ? path : '/' + path);
}

/**
 * props:
 *  - path: المسار الداخلي (مثل /s/اطلبها أو /c/فواكه أو /p/42)
 *  - title, text: نصوص المشاركة
 *  - variant: 'pill' (افتراضي) | 'icon' | 'ghost'
 *  - label: نصّ الزرّ (افتراضي «مشاركة»)
 */
export default function ShareButton({ path, title = 'اطلبها', text = '', variant = 'pill', label = 'مشاركة', className = '' }) {
  const [copied, setCopied] = useState(false);

  async function doShare(e) {
    e?.stopPropagation?.();
    e?.preventDefault?.();
    const url = buildUrl(path);
    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({ title, text: text || title, url });
        return;
      }
    } catch (err) { return; /* المستخدم ألغى */ }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch (err) { /* لا يدعم النسخ */ }
  }

  if (variant === 'icon') {
    return (
      <button onClick={doShare} aria-label={label} title={label} className={className || 'grid h-9 w-9 place-items-center rounded-full bg-white/90 text-ink shadow-soft transition hover:bg-white'}>
        {copied ? <Check className="h-4 w-4 text-green-600" /> : <Share2 className="h-4 w-4" />}
      </button>
    );
  }

  if (variant === 'ghost') {
    return (
      <button onClick={doShare} className={className || 'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold text-ink/60 hover:bg-ink/5 dark:text-cream/60 dark:hover:bg-white/10'}>
        {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Share2 className="h-3.5 w-3.5" />} {copied ? 'نُسخ' : label}
      </button>
    );
  }

  return (
    <button onClick={doShare} className={className || 'inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-sm font-bold text-ink shadow-soft backdrop-blur transition hover:bg-white'}>
      {copied ? <Check className="h-4 w-4 text-green-600" /> : <Share2 className="h-4 w-4" />} {copied ? 'نُسخ' : label}
    </button>
  );
}
