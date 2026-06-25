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
