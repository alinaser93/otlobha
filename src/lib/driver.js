import { supabase, supabaseEnabled } from './supabase.js';

const KEY = 'otlobha-driver';

export function getDriverSession() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || 'null');
  } catch {
    return null;
  }
}
export function setDriverSession(d) {
  try {
    localStorage.setItem(KEY, JSON.stringify(d));
  } catch {}
}
export function clearDriverSession() {
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

export const driverLogin = (pass) => rpc('driver_login', { p_pass: pass });
export const driverListOrders = (driverId) => rpc('driver_list_orders', { p_driver_id: driverId });
export const driverUpdateDelivery = (driverId, orderId, status) =>
  rpc('driver_update_delivery', { p_driver_id: driverId, p_order_id: orderId, p_status: status });
export const driverUpdateLocation = (driverId, orderId, lat, lng) =>
  rpc('driver_update_location', { p_driver_id: driverId, p_order_id: orderId, p_lat: lat, p_lng: lng });
