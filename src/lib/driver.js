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
export const driverOrdersReady = (driverId) => rpc('driver_orders_ready', { p_driver_id: driverId });
export const driverUpdateLocation = (driverId, orderId, lat, lng) =>
  rpc('driver_update_location', { p_driver_id: driverId, p_order_id: orderId, p_lat: lat, p_lng: lng });

// self profile (extended data)
export const driverGetMe = (driverId) => rpc('driver_get_me', { p_id: driverId });
export const driverUpdateProfile = (driverId, f) =>
  rpc('driver_update_profile', {
    p_id: driverId,
    p_name: f.name ?? null, p_phone: f.phone ?? null, p_email: f.email ?? null,
    p_birthdate: f.birthdate ?? null, p_gender: f.gender ?? null,
    p_vehicle: f.vehicle ?? null, p_avatar_url: f.avatar_url ?? null,
  });

// driver wallet (earnings + cash owed to admin)
export const driverWallet = (driverId) => rpc('driver_wallet', { p_driver_id: driverId });
