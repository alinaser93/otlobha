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

// Redeem loyalty points against a just-created order. Atomic & best-effort:
// on failure nothing changes (no points lost, order stays at full price).
export async function redeemPointsForOrder(accountId, orderId, points) {
  if (!supabaseEnabled || !supabase || !accountId || !orderId || !points) return { ok: false };
  try {
    const { data, error } = await supabase.rpc('redeem_points_for_order', {
      p_account_id: accountId,
      p_order_id: orderId,
      p_points: points,
    });
    if (error) return { ok: false, error: error.message };
    return data;
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

// Driver rating (public, by order token)
export async function getOrderDriverRating(orderId) {
  if (!supabaseEnabled || !supabase || !orderId) return { ok: false };
  try {
    const { data, error } = await supabase.rpc('order_driver_rating', { p_order_id: orderId });
    if (error) return { ok: false, error: error.message };
    return data;
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

export async function rateOrderDriver(orderId, rating, comment) {
  if (!supabaseEnabled || !supabase || !orderId) return { ok: false };
  try {
    const { data, error } = await supabase.rpc('rate_order_driver', { p_order_id: orderId, p_rating: rating, p_comment: comment || null });
    if (error) return { ok: false, error: error.message };
    return data;
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

// What's rateable for a delivered order (driver + each store + each product).
export async function orderRatingStatus(orderId) {
  if (!supabaseEnabled || !supabase || !orderId) return { ok: false };
  try {
    const { data, error } = await supabase.rpc('order_rating_status', { p_order_id: orderId });
    if (error) return { ok: false, error: error.message };
    return data;
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

export async function rateOrderProduct(orderId, productId, stars, comment) {
  if (!supabaseEnabled || !supabase || !orderId) return { ok: false };
  try {
    const { data, error } = await supabase.rpc('rate_order_product', { p_order_id: orderId, p_product_id: productId, p_stars: stars, p_comment: comment || null });
    if (error) return { ok: false, error: error.message };
    return data;
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

export async function rateOrderStore(orderId, storeId, stars, comment) {
  if (!supabaseEnabled || !supabase || !orderId) return { ok: false };
  try {
    const { data, error } = await supabase.rpc('rate_order_store', { p_order_id: orderId, p_store_id: storeId, p_stars: stars, p_comment: comment || null });
    if (error) return { ok: false, error: error.message };
    return data;
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

// Public order tracking by its secure id (token) — no login needed.
export async function orderReadyByToken(id) {
  if (!supabaseEnabled || !supabase || !id) return null;
  try {
    const { data, error } = await supabase.rpc('order_ready_by_token', { p_id: id });
    if (error) return null;
    return data || null;
  } catch { return null; }
}

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
