import { supabase, supabaseEnabled } from './supabase.js';

// Save an order to the database (and grant loyalty points server-side for
// registered customers). Best-effort: if Supabase isn't configured or the call
// fails, we resolve with { ok:false } so the WhatsApp order still goes through.
export async function createOrder(payload) {
  if (!supabaseEnabled || !supabase) return { ok: false, skipped: true };
  try {
    const { data, error } = await supabase.rpc('create_order', {
      p_account_id: payload.accountId || null,
      p_name: payload.name || null,
      p_phone: payload.phone || null,
      p_email: payload.email || null,
      p_area: payload.area || null,
      p_address: payload.address || null,
      p_notes: payload.notes || null,
      p_payment: payload.payment || null,
      p_location: payload.location || null,
      p_items: payload.items || [],
      p_subtotal: payload.subtotal || 0,
      p_total: payload.total || 0,
    });
    if (error) return { ok: false, error: error.message };
    return data;
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

// Public order tracking by its secure id (token) — no login needed.
export async function getOrderByToken(id) {
  if (!supabaseEnabled || !supabase || !id) return { ok: false };
  try {
    const { data, error } = await supabase.rpc('get_order_by_token', { p_id: id });
    if (error) return { ok: false, error: error.message };
    return data;
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}
export async function listMyOrders(accountId) {
  if (!supabaseEnabled || !supabase || !accountId) return { ok: false, orders: [] };
  try {
    const { data, error } = await supabase.rpc('list_orders_for_account', {
      p_account_id: accountId,
    });
    if (error) return { ok: false, orders: [], error: error.message };
    return data;
  } catch (e) {
    return { ok: false, orders: [], error: String(e) };
  }
}
