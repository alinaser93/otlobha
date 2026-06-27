// ساعات عمل المتاجر + حساب حالة «مفتوح/مغلق» بتوقيت بغداد (UTC+3).
// نموذج البيانات (jsonb على عمود stores.hours):
//   { "0": { "closed": false, "open": "09:00", "close": "23:00" }, ... "6": {...} }
//   المفتاح 0..6 = الأحد..السبت (مطابق لـ Date.getDay()).
// stores.manual_closed (bool) = «مغلق الآن مؤقتاً» يتجاوز الساعات.

export const DAYS_AR = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

export function defaultHours() {
  const h = {};
  for (let i = 0; i < 7; i++) h[i] = { closed: false, open: '09:00', close: '23:00' };
  return h;
}

// تطبيع أي بيانات قادمة من القاعدة إلى الشكل المعياري (7 أيام)
export function normalizeHours(raw) {
  const base = defaultHours();
  if (!raw || typeof raw !== 'object') return null; // null = لا ساعات (يُعامل كمفتوح)
  let any = false;
  for (let i = 0; i < 7; i++) {
    const d = raw[i] ?? raw[String(i)];
    if (d && typeof d === 'object') {
      any = true;
      base[i] = {
        closed: !!d.closed,
        open: typeof d.open === 'string' ? d.open : '09:00',
        close: typeof d.close === 'string' ? d.close : '23:00',
      };
    }
  }
  return any ? base : null;
}

// الوقت الحالي بتوقيت بغداد كـ {day, minutes}
function nowBaghdad() {
  const now = new Date();
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
  const b = new Date(utcMs + 3 * 3600000); // +3 ساعات
  return { day: b.getDay(), minutes: b.getHours() * 60 + b.getMinutes() };
}

const toMin = (t) => {
  const [h, m] = String(t || '0:0').split(':').map((x) => parseInt(x, 10) || 0);
  return h * 60 + m;
};

const fmt12 = (t) => {
  const mins = toMin(t);
  let h = Math.floor(mins / 60);
  const m = mins % 60;
  const am = h < 12;
  let hh = h % 12; if (hh === 0) hh = 12;
  return `${hh}:${String(m).padStart(2, '0')} ${am ? 'ص' : 'م'}`;
};

// نطاق اليوم كنصّ عربي، مثل: «9:00 ص – 11:00 م»
export function rangeLabel(d) {
  if (!d || d.closed) return 'مغلق';
  return `${fmt12(d.open)} – ${fmt12(d.close)}`;
}

// الحالة الحالية للمتجر
// تُرجع: { open, unknown, manual, today, todayLabel }
export function storeStatus(store) {
  if (!store) return { open: true, unknown: true };
  if (store.manualClosed || store.manual_closed) return { open: false, manual: true, todayLabel: 'مغلق مؤقتاً' };

  const hours = normalizeHours(store.hours);
  if (!hours) return { open: true, unknown: true }; // لم تُضبط ساعات → نعتبره مفتوح

  const { day, minutes } = nowBaghdad();
  const today = hours[day];
  if (!today || today.closed) return { open: false, today, todayLabel: 'مغلق اليوم' };

  const o = toMin(today.open);
  const c = toMin(today.close);
  let open;
  if (c > o) open = minutes >= o && minutes < c;
  else open = minutes >= o || minutes < c; // يمتدّ بعد منتصف الليل
  return { open, today, todayLabel: rangeLabel(today) };
}

// المسافة بالكيلومتر بين نقطتين (هافرساين)
export function distanceKm(lat1, lng1, lat2, lng2) {
  if ([lat1, lng1, lat2, lng2].some((v) => v == null || Number.isNaN(Number(v)))) return null;
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function distanceLabel(km) {
  if (km == null) return '';
  if (km < 1) return `${Math.round(km * 1000)} م`;
  return `${km.toFixed(1)} كم`;
}
