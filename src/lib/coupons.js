import { supabase, supabaseEnabled } from './supabase.js';

async function rpc(fn, args) {
  if (!supabaseEnabled || !supabase) return { ok: false, error: 'no_supabase' };
  try {
    const { data, error } = await supabase.rpc(fn, args);
    if (error) return { ok: false, error: error.message };
    return data;
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

// ── customer ──
// preview a coupon against a given base amount (no changes)
export const validateCoupon = (code, accountId, base) =>
  rpc('validate_coupon', { p_code: code, p_account_id: accountId || null, p_base: Math.max(0, Math.round(base || 0)) });

// apply a coupon to a freshly-created order (atomic; safe on failure)
export const applyCouponToOrder = (accountId, orderId, code) =>
  rpc('apply_coupon_to_order', { p_account_id: accountId || null, p_order_id: orderId, p_code: code });

// ── admin ──
export const adminListCoupons = (adminId) => rpc('admin_list_coupons', { p_admin_id: adminId });

export const adminUpsertCoupon = (adminId, c = {}) =>
  rpc('admin_upsert_coupon', {
    p_admin_id: adminId,
    p_id: c.id ?? null,
    p_code: c.code ?? '',
    p_kind: c.kind ?? 'percent',
    p_value: c.value ?? 0,
    p_min_order: c.minOrder ?? 0,
    p_max_discount: c.maxDiscount ?? 0,
    p_usage_limit: c.usageLimit ?? 0,
    p_per_user_limit: c.perUserLimit ?? 1,
    p_expires_at: c.expiresAt ?? null,
    p_active: c.active ?? true,
  });

export const adminSetCouponActive = (adminId, id, active) =>
  rpc('admin_set_coupon_active', { p_admin_id: adminId, p_id: id, p_active: active });

export const adminDeleteCoupon = (adminId, id) =>
  rpc('admin_delete_coupon', { p_admin_id: adminId, p_id: id });

// human-readable Arabic error for coupon validation results
export function couponError(code) {
  const map = {
    not_found: 'كود غير موجود',
    inactive: 'الكوبون متوقّف حالياً',
    expired: 'انتهت صلاحية الكوبون',
    exhausted: 'انتهت مرّات استخدام الكوبون',
    used_by_you: 'استخدمت هذا الكوبون من قبل',
    below_min: 'طلبك أقل من الحد المطلوب لهذا الكوبون',
    no_discount: 'لا ينطبق خصم على هذا الطلب',
    login_required: 'سجّل الدخول لاستخدام كوبون',
    duplicate: 'هذا الكود مستخدم — اختر غيره',
    bad_code: 'كود غير صالح',
  };
  return map[code] || 'تعذّر تطبيق الكوبون';
}
