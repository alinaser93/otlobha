// 🔔 عناصر بصرية مشتركة لتنبيه الطلبات الجديدة (بانر + زرّ جرس/كتم).
import { Bell, BellOff, Check } from 'lucide-react';

// بانر يظهر فوق اللوحة عند وصول طلب جديد
export function NewOrderBanner({ count, onAck }) {
  if (!count) return null;
  return (
    <button
      onClick={onAck}
      className="flex w-full items-center justify-between gap-3 rounded-2xl bg-gradient-to-l from-copper to-amber-500 px-4 py-3 text-cream shadow-seal ring-1 ring-white/20"
    >
      <span className="flex items-center gap-2">
        <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/20">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white/30" />
          <Bell className="relative h-5 w-5" />
        </span>
        <span className="text-right">
          <span className="block font-display text-base font-black leading-tight">
            {count === 1 ? 'طلب جديد وصل!' : `${count} طلبات جديدة!`}
          </span>
          <span className="block font-body text-[11px] text-cream/80">اضغط لإيقاف التنبيه والاطّلاع</span>
        </span>
      </span>
      <span className="flex shrink-0 items-center gap-1 rounded-full bg-white/20 px-3 py-1.5 font-body text-xs font-bold">
        <Check className="h-4 w-4" /> تم
      </span>
    </button>
  );
}

// زرّ جرس صغير لكتم/تفعيل الصوت (يوضع بالهيدر)
export function AlertBell({ muted, onToggle, hasNew }) {
  return (
    <button
      onClick={onToggle}
      aria-label={muted ? 'تفعيل صوت التنبيه' : 'كتم صوت التنبيه'}
      title={muted ? 'الصوت متوقّف — اضغط للتفعيل' : 'الصوت مفعّل'}
      className={`relative grid h-9 w-9 place-items-center rounded-xl transition ${
        muted
          ? 'bg-ink/5 text-ink/40 dark:bg-white/5 dark:text-cream/40'
          : 'bg-copper/15 text-copper dark:bg-copper/20 dark:text-copper-light'
      }`}
    >
      {muted ? <BellOff className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
      {hasNew && !muted && (
        <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-cream dark:ring-night-800" />
      )}
    </button>
  );
}
