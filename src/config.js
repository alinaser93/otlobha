// ⚙️  إعدادات المتجر — عدّل القيم هنا فقط
//
// رقم واتساب الذي تصلك عليه الطلبات: رمز الدولة + الرقم، بدون «+» أو أصفار بادئة أو مسافات.
// العراق (+964) + 7748600445
export const WHATSAPP_NUMBER = '9647748600445';

export const SHOP_NAME = 'اطلبها';

// المدينة التي تخدمها
export const CITY = 'السماوة';

// 🚚 التوصيل
// النظام: أجور أساسية + زيادة لكل متجر إضافي (بسقف)، ويصبح مجانياً فوق مبلغ معيّن.
// عدّل الأرقام هنا حسب حاجتك (بالدينار):
export const DELIVERY_FEE = 2000;          // الأجور الأساسية (متجر واحد)
export const DELIVERY_EXTRA_STORE = 500;   // يُضاف لكل متجر إضافي بعد الأول
export const DELIVERY_FEE_CAP = 3000;      // الحد الأقصى للأجور مهما تعدّدت المتاجر
export const FREE_DELIVERY_OVER = 80000;   // توصيل مجاني فوق هذا المبلغ (0 = معطّل)

// 🛵 أجور المندوب (يُحسب لكل توصيل): أساس + زيادة لكل متجر إضافي بعد الأول
export const DRIVER_FEE_BASE = 1500;            // لكل توصيل (متجر واحد)
export const DRIVER_FEE_PER_EXTRA_STORE = 500;  // يُضاف لكل متجر إضافي في نفس الطلب

// يحسب أجور التوصيل حسب إجمالي السلّة وعدد المتاجر المختلفة فيها
export function calcDelivery(total, storeCount = 1) {
  if (FREE_DELIVERY_OVER > 0 && total >= FREE_DELIVERY_OVER) return 0;
  const extra = Math.max(0, (storeCount || 1) - 1) * DELIVERY_EXTRA_STORE;
  return Math.min(DELIVERY_FEE + extra, DELIVERY_FEE_CAP);
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
};
