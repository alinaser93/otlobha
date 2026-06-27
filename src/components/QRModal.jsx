// 📲 بطاقة QR — تولّد رمز للرابط، يُحمّل/يُطبع/يُشارك.
import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { X, Download, Share2, Check } from 'lucide-react';

function buildUrl(path) {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://otlobha.netlify.app';
  if (!path) return origin + '/';
  return origin + (path.startsWith('/') ? path : '/' + path);
}

export default function QRModal({ path, title = 'اطلبها', subtitle = '', onClose }) {
  const [dataUrl, setDataUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const url = buildUrl(path);

  useEffect(() => {
    QRCode.toDataURL(url, { width: 600, margin: 2, color: { dark: '#0A3D2A', light: '#FFFFFF' } })
      .then(setDataUrl)
      .catch(() => setDataUrl(''));
  }, [url]);

  function download() {
    if (!dataUrl) return;
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `otlobha-qr-${(title || 'link').replace(/\s+/g, '-')}.png`;
    document.body.appendChild(a); a.click(); a.remove();
  }

  async function shareImg() {
    try {
      if (navigator.share && dataUrl) {
        const blob = await (await fetch(dataUrl)).blob();
        const file = new File([blob], 'otlobha-qr.png', { type: 'image/png' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title, text: subtitle || title });
          return;
        }
        await navigator.share({ title, text: subtitle || title, url });
        return;
      }
    } catch (e) { return; }
    try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch (e) {}
  }

  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-ink/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-xs overflow-hidden rounded-3xl bg-cream shadow-card dark:bg-night-800" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between bg-gradient-to-l from-brand-700 to-brand-800 px-4 py-3 text-cream">
          <span className="font-display text-base font-black">رمز QR للمشاركة</span>
          <button onClick={onClose} aria-label="إغلاق" className="grid h-8 w-8 place-items-center rounded-full bg-white/15 hover:bg-white/25"><X className="h-4 w-4" /></button>
        </div>
        <div className="p-5">
          <div className="mx-auto grid aspect-square w-full max-w-[220px] place-items-center rounded-2xl bg-white p-3 shadow-soft">
            {dataUrl ? <img src={dataUrl} alt="QR" className="h-full w-full" /> : <div className="text-sm text-ink/40">جارٍ التوليد…</div>}
          </div>
          <div className="mt-3 text-center">
            <div className="font-display text-lg font-black text-ink dark:text-cream">{title}</div>
            {subtitle && <div className="text-xs text-ink/50 dark:text-cream/50">{subtitle}</div>}
            <div className="mt-1 truncate text-[11px] text-ink/40 dark:text-cream/40" dir="ltr">{url}</div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button onClick={download} className="flex items-center justify-center gap-1.5 rounded-xl bg-brand-700 py-2.5 font-display text-sm font-bold text-cream transition hover:bg-brand-800">
              <Download className="h-4 w-4" /> تحميل
            </button>
            <button onClick={shareImg} className="flex items-center justify-center gap-1.5 rounded-xl bg-copper py-2.5 font-display text-sm font-bold text-cream transition hover:bg-copper-dark">
              {copied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />} {copied ? 'نُسخ' : 'مشاركة'}
            </button>
          </div>
          <p className="mt-3 text-center text-[11px] leading-snug text-ink/45 dark:text-cream/45">اطبعه وعلّقه في المتجر — الزبون يمسحه بالكاميرا فيفتح الرابط مباشرة.</p>
        </div>
      </div>
    </div>
  );
}
