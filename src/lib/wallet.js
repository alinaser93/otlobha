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

// customer: read own balance + recent transactions
export const accountWallet = (accountId) => rpc('account_wallet', { p_account_id: accountId });

// customer: apply wallet credit to a freshly-created order (atomic; safe on failure)
export const redeemWalletForOrder = (accountId, orderId, amount) =>
  rpc('redeem_wallet_for_order', { p_account_id: accountId, p_order_id: orderId, p_amount: Math.max(0, Math.round(amount || 0)) });

// admin: add/deduct a customer's wallet credit (refund/compensation) — logs a transaction
export const adminAdjustWallet = (adminId, accountId, amount, reason) =>
  rpc('admin_adjust_wallet', { p_admin_id: adminId, p_account_id: accountId, p_amount: Math.round(amount || 0), p_reason: reason || null });
