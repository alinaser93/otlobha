import { supabase, supabaseEnabled } from './supabase.js';

const KEY = 'otlobha-admin';

export function getAdminSession() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || 'null');
  } catch {
    return null;
  }
}
export function setAdminSession(a) {
  try {
    localStorage.setItem(KEY, JSON.stringify(a));
  } catch {}
}
export function clearAdminSession() {
  try {
    localStorage.removeItem(KEY);
  } catch {}
}

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

export const adminLogin = (pass) => rpc('admin_login', { p_pass: pass });
export const adminListOrders = (adminId, status, limit) =>
  rpc('admin_list_orders', { p_admin_id: adminId, p_status: status || null, p_limit: limit || 500 });
export const adminUpdateStatus = (adminId, orderId, status) =>
  rpc('admin_update_status', { p_admin_id: adminId, p_order_id: orderId, p_status: status });
export const adminStats = (adminId) => rpc('admin_stats', { p_admin_id: adminId });
export const adminListAdmins = (adminId) => rpc('admin_list_admins', { p_admin_id: adminId });
export const adminAdd = (adminId, username, pass, name) =>
  rpc('admin_add', { p_admin_id: adminId, p_username: username, p_pass: pass, p_name: name });
export const adminRemove = (adminId, targetId) =>
  rpc('admin_remove', { p_admin_id: adminId, p_target_id: targetId });

// drivers + assignment
export const adminListDrivers = (adminId) => rpc('admin_list_drivers', { p_admin_id: adminId });
export const adminAddDriver = (adminId, username, pass, name, phone) =>
  rpc('admin_add_driver', { p_admin_id: adminId, p_username: username, p_pass: pass, p_name: name, p_phone: phone });
export const adminRemoveDriver = (adminId, targetId) =>
  rpc('admin_remove_driver', { p_admin_id: adminId, p_target_id: targetId });
export const adminAssignDriver = (adminId, orderId, driverId) =>
  rpc('admin_assign_driver', { p_admin_id: adminId, p_order_id: orderId, p_driver_id: driverId || null });

// self profile (extended data)
export const adminGetMe = (adminId) => rpc('admin_get_me', { p_id: adminId });
export const adminUpdateProfile = (adminId, f) =>
  rpc('admin_update_profile', {
    p_id: adminId,
    p_name: f.name ?? null, p_phone: f.phone ?? null, p_email: f.email ?? null,
    p_birthdate: f.birthdate ?? null, p_gender: f.gender ?? null, p_avatar_url: f.avatar_url ?? null,
  });
