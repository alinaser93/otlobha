// ⚙️  إعدادات المتجر — عدّل القيم هنا فقط
//
// رقم واتساب الذي تصلك عليه الطلبات: رمز الدولة + الرقم، بدون «+» أو أصفار بادئة أو مسافات.
// العراق (+964) + 7748600445
export const WHATSAPP_NUMBER = '9647748600445';

export const SHOP_NAME = 'اطلبها';

// المدينة التي تخدمها
export const CITY = 'السماوة';

// 🚚 التوصيل وأجور المندوب
// هذه القيم افتراضية فقط — تُحمّل القيم الحقيقية من لوحة التحكّم (قاعدة البيانات) عند الإقلاع،
// ويقدر الأدمن يعدّلها من «الإعدادات» بدون كود.
export const SETTINGS = {
  delivery_fee: 2000,               // الأجور الأساسية (متجر واحد)
  delivery_extra_store: 500,        // يُضاف لكل متجر إضافي بعد الأول
  delivery_fee_cap: 3000,           // الحد الأقصى للأجور
  free_delivery_over: 80000,        // توصيل مجاني فوق هذا المبلغ (0 = معطّل)
  driver_fee_base: 1500,            // أجرة المندوب لكل توصيل
  driver_fee_per_extra_store: 500,  // يُضاف لأجرة المندوب لكل متجر إضافي
  default_commission_pct: 15,       // العمولة الافتراضية للمتاجر الجديدة
  markup_pct: 0,                    // 🆕 هامش المنصّة العام (نسبة ربحك فوق سعر التاجر) — 0 = معطّل
  whatsapp_number: '9647748600445', // رقم واتساب استلام الطلبات/الاستفسارات
};

const NUMERIC_KEYS = ['delivery_fee', 'delivery_extra_store', 'delivery_fee_cap', 'free_delivery_over', 'driver_fee_base', 'driver_fee_per_extra_store', 'default_commission_pct', 'points_dinar_per_point', 'points_redeem_max_pct', 'points_redeem_min_order', 'markup_pct'];

// يدمج إعدادات قادمة من الخادم في الكائن الحيّ (يُستدعى عند الإقلاع وبعد أي تعديل)
export function applySettings(s) {
  if (!s) return;
  for (const k of NUMERIC_KEYS) {
    if (s[k] != null && !Number.isNaN(Number(s[k]))) SETTINGS[k] = Number(s[k]);
  }
  if (typeof s.whatsapp_number === 'string' && s.whatsapp_number.trim()) SETTINGS.whatsapp_number = s.whatsapp_number.trim();
}

// ثوابت للتوافق الخلفي (قيمها الابتدائية فقط)
export const DELIVERY_FEE = SETTINGS.delivery_fee;
export const DELIVERY_EXTRA_STORE = SETTINGS.delivery_extra_store;
export const DELIVERY_FEE_CAP = SETTINGS.delivery_fee_cap;
export const FREE_DELIVERY_OVER = SETTINGS.free_delivery_over;
export const DRIVER_FEE_BASE = SETTINGS.driver_fee_base;
export const DRIVER_FEE_PER_EXTRA_STORE = SETTINGS.driver_fee_per_extra_store;

// يحسب أجور التوصيل حسب إجمالي السلّة وعدد المتاجر (يقرأ القيم الحيّة)
export function calcDelivery(total, storeCount = 1) {
  const s = SETTINGS;
  if (s.free_delivery_over > 0 && total >= s.free_delivery_over) return 0;
  const extra = Math.max(0, (storeCount || 1) - 1) * s.delivery_extra_store;
  return Math.min(s.delivery_fee + extra, s.delivery_fee_cap);
}

// 🆕 هامش المنصّة — يحلّ النسبة الفعّالة (الأخصّ يفوز، null/فارغ = يرث الأعلى)
//   الترتيب: منتج → فئة → متجر → العام. يُستعمل للمنتجات (مرّر الثلاثة) وللباقات (مرّر منتج=هامش الباقة + متجر).
export function effectiveMarkup({ product, category, store } = {}) {
  const pick = [product, category, store].find((v) => v !== null && v !== undefined && v !== '');
  const pct = pick !== null && pick !== undefined && pick !== '' ? Number(pick) : Number(SETTINGS.markup_pct || 0);
  return Number.isFinite(pct) && pct > 0 ? pct : 0;
}

// يطبّق النسبة على السعر الأساسي ويقرّب لأقرب دينار
export function withMarkup(basePrice, pct) {
  const b = Number(basePrice) || 0;
  if (!pct || pct <= 0) return b;
  return Math.round(b * (1 + pct / 100));
}

// 📍 مناطق/أحياء السماوة وأقضيتها — أضِف أو احذف بحرية
export const AREAS = [
  'الشرقي',
  'الغربي',
  'حي المعلمين',
  'حي الحسين',
  'حي الزهراء',
  'حي الجمهورية',
  'حي العسكري',
  'حي الصدر',
  'حي الوحدة',
  'حي الإسكان',
  'حي القادسية',
  'حي النصر',
  'حي السلام',
  'حي الجزيرة',
  'حي العروبة',
  'حي الرسالة',
  'المجد',
  'البلدية',
  'قضاء الرميثة',
  'قضاء الخضر',
  'ناحية السوير',
  'ناحية الوركاء',
  'أخرى (سنتواصل لتأكيد العنوان)',
];

// 💳 طرق الدفع — id ثابت، label يظهر للزبون، note وصف صغير
export const PAYMENT_METHODS = [
  { id: 'cod',      label: 'الدفع عند الاستلام', note: 'ادفع نقداً عند وصول طلبك' },
  { id: 'zaincash', label: 'زين كاش',            note: 'تحويل مسبق عبر زين كاش' },
  { id: 'superqi',  label: 'SuperQi',            note: 'تحويل مسبق عبر SuperQi' },
  { id: 'fib',      label: 'FIB',                note: 'تحويل مسبق عبر FIB' },
  { id: 'rafidain', label: 'مصرف الرافدين',      note: 'تحويل مسبق إلى الحساب' },
];

// ═══════════════════════════════════════════════════════════════
// 🔐 حسابات الزبائن (Supabase) — اتبع دليل الإعداد لإنشاء المشروع
//    ثم انسخ القيمتين من: Supabase ← Project Settings ← API
// ═══════════════════════════════════════════════════════════════
export const SUPABASE_URL = 'https://tzruqvplazcwwhpmgdje.supabase.co';
export const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR6cnVxdnBsYXpjd3docG1nZGplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyODcwMTcsImV4cCI6MjA5Nzg2MzAxN30.rXfhNjLq99OyPTEVMHgSaodoldCb44UQu0e0dP6wrFE';

// تسجيل الدخول الآن: الهاتف + رمز سري (PIN) — مجاني، بلا رسائل.
// (التوثيق عبر OTP ميزة اختيارية تُضاف لاحقاً.)

// 🎁 نظام النقاط (القيم الفعلية مضبوطة أيضاً في supabase/schema.sql —
//    إن غيّرتها هنا غيّرها هناك أيضاً ليتطابق العرض مع المنح الفعلي)
export const POINTS = {
  welcome: 1000,          // نقاط ترحيبية عند التسجيل
  referralInviter: 5000,  // للداعي عند انضمام صديق عبر رابطه
  referralInvitee: 5000,  // للمدعو الجديد
  dinarPerPoint: 1,       // قيمة النقطة بالدينار (عرض فقط)
  dinarsPerEarnedPoint: 100, // يكسب الزبون نقطة لكل 100 دينار من قيمة الطلب
  // ── الاستبدال (قيم افتراضية؛ يضبطها الأدمن من الإعدادات وتُقرأ من app_settings) ──
  redeemDinarPerPoint: 1, // قيمة النقطة بالدينار عند الاستبدال خصماً
  redeemMaxPct: 50,       // أقصى نسبة من الطلب تُدفع بالنقاط
  redeemMinOrder: 5000,   // أقل قيمة طلب للاستبدال
};
