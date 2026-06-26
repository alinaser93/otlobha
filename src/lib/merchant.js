import { supabase, supabaseEnabled } from './supabase.js';

const KEY = 'otlobha-merchant'; // { token, store }

export function getMerchantSession() {
  try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch { return null; }
}
export function setMerchantSession(s) {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch {}
}
export function clearMerchantSession() {
  try { localStorage.removeItem(KEY); } catch {}
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

// auth
export const merchantLogin  = (username, pass) => rpc('merchant_login', { p_username: username, p_pass: pass });
export const merchantMe      = (token) => rpc('merchant_me', { p_token: token });
export const merchantLogout  = (token) => rpc('merchant_logout', { p_token: token });

// store branding (self)
export const merchantUpdateStore = (token, f = {}) =>
  rpc('merchant_update_store', {
    p_token: token,
    p_category: f.category ?? null,
    p_logo: f.logo ?? null,
    p_tagline: f.tagline ?? null,
    p_phone: f.phone ?? null,
    p_cover: f.cover ?? null,
    p_cover_video: f.coverVideo ?? null,
  });

// products (store-scoped)
export const merchantListProducts = (token) => rpc('merchant_list_products', { p_token: token });

export const merchantAddProduct = (token, f = {}) =>
  rpc('merchant_add_product', {
    p_token: token,
    p_name: f.name,
    p_category: f.category || 'عام',
    p_price: f.price ?? 0,
    p_unit: f.unit || 'وحدة',
    p_emoji: f.emoji || '🛒',
    p_image: f.image ?? null,
    p_badge: f.badge ?? null,
    p_description: f.description ?? null,
    p_stock: f.stock ?? null,
    p_old_price: f.oldPrice ?? null,
  });

export const merchantUpdateProduct = (token, id, f = {}) =>
  rpc('merchant_update_product', {
    p_token: token,
    p_id: id,
    p_name: f.name ?? null,
    p_category: f.category ?? null,
    p_price: f.price ?? null,
    p_unit: f.unit ?? null,
    p_emoji: f.emoji ?? null,
    p_image: f.image ?? null,
    p_badge: f.badge ?? null,
    p_sort: f.sort ?? null,
    p_active: f.active ?? null,
    p_description: f.description ?? null,
    p_stock: f.stock ?? null,
    p_old_price: f.oldPrice ?? null,
  });

export const merchantRemoveProduct    = (token, id) => rpc('merchant_remove_product', { p_token: token, p_id: id });
export const merchantSetProductActive = (token, id, active) => rpc('merchant_set_product_active', { p_token: token, p_id: id, p_active: active });
export const merchantReorderProducts  = (token, ids) => rpc('merchant_reorder_products', { p_token: token, p_ids: ids });

// public categories (anon-readable) for the product form
export async function fetchCategories() {
  if (!supabaseEnabled || !supabase) return [];
  try {
    const { data, error } = await supabase.from('categories').select('name,emoji,sort,active').eq('active', true).order('sort');
    if (error || !data) return [];
    return data.map((c) => c.name).filter(Boolean);
  } catch { return []; }
}

// map a raw DB product row to the form/display shape
export const mapProduct = (p) => ({
  id: p.id,
  name: p.name,
  category: p.category,
  price: p.price,
  unit: p.unit,
  emoji: p.emoji,
  image: p.image,
  badge: p.badge,
  active: p.active,
  sort: p.sort,
  description: p.description,
  stock: p.stock,
  oldPrice: p.old_price,
});
