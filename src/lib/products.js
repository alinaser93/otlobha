import { supabase, supabaseEnabled } from './supabase.js';

// shared RPC helper (same shape as lib/admin.js)
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

/* ───────────────────────── products (admin) ───────────────────────── */
export const adminListProducts = (adminId) => rpc('admin_list_products', { p_admin_id: adminId });

export const adminAddProduct = (adminId, f = {}) =>
  rpc('admin_add_product', {
    p_admin_id: adminId,
    p_name: f.name,
    p_category: f.category,
    p_price: f.price ?? 0,
    p_unit: f.unit || 'وحدة',
    p_emoji: f.emoji || '🛒',
    p_image: f.image || null,
    p_tint: f.tint || '#9A5318',
    p_badge: f.badge || null,
    p_description: f.description ?? null,
  });

// note: `??` means a provided '' clears (image/badge/description), an absent key = no change
export const adminUpdateProduct = (adminId, id, f = {}) =>
  rpc('admin_update_product', {
    p_admin_id: adminId,
    p_id: id,
    p_name: f.name ?? null,
    p_category: f.category ?? null,
    p_price: f.price ?? null,
    p_unit: f.unit ?? null,
    p_emoji: f.emoji ?? null,
    p_image: f.image ?? null,
    p_tint: f.tint ?? null,
    p_badge: f.badge ?? null,
    p_sort: f.sort ?? null,
    p_active: f.active ?? null,
    p_description: f.description ?? null,
  });

export const adminRemoveProduct = (adminId, id) =>
  rpc('admin_remove_product', { p_admin_id: adminId, p_id: id });

export const adminSetProductActive = (adminId, id, active) =>
  rpc('admin_set_product_active', { p_admin_id: adminId, p_id: id, p_active: active });

export const adminReorderProducts = (adminId, ids) =>
  rpc('admin_reorder_products', { p_admin_id: adminId, p_ids: ids });

/* ───────────────────────── categories (admin) ───────────────────────── */
export const adminListCategories = (adminId) => rpc('admin_list_categories', { p_admin_id: adminId });

export const adminAddCategory = (adminId, f = {}) =>
  rpc('admin_add_category', { p_admin_id: adminId, p_name: f.name, p_emoji: f.emoji || null });

export const adminUpdateCategory = (adminId, id, f = {}) =>
  rpc('admin_update_category', {
    p_admin_id: adminId,
    p_id: id,
    p_name: f.name ?? null,
    p_emoji: f.emoji ?? null,
    p_sort: f.sort ?? null,
    p_active: f.active ?? null,
  });

export const adminRemoveCategory = (adminId, id) =>
  rpc('admin_remove_category', { p_admin_id: adminId, p_id: id });

export const adminReorderCategories = (adminId, ids) =>
  rpc('admin_reorder_categories', { p_admin_id: adminId, p_ids: ids });

/* ───────────────────────── bundles (admin) ───────────────────────── */
export const adminListBundles = (adminId) => rpc('admin_list_bundles', { p_admin_id: adminId });

export const adminAddBundle = (adminId, f = {}) =>
  rpc('admin_add_bundle', {
    p_admin_id: adminId,
    p_name: f.name,
    p_kicker: f.kicker || null,
    p_description: f.description || null,
    p_price: f.price ?? 0,
    p_old_price: f.old_price ?? null,
    p_accent: f.accent || '#0F5132',
    p_image: f.image || null,
    p_ingredients: f.ingredients || [],
  });

// the bundle form always submits every field, so null simply clears optionals
export const adminUpdateBundle = (adminId, id, f = {}) =>
  rpc('admin_update_bundle', {
    p_admin_id: adminId,
    p_id: id,
    p_name: f.name ?? null,
    p_kicker: f.kicker ?? null,
    p_description: f.description ?? null,
    p_price: f.price ?? null,
    p_old_price: f.old_price ?? null,
    p_accent: f.accent ?? null,
    p_image: f.image ?? null,
    p_ingredients: f.ingredients ?? null,
    p_sort: f.sort ?? null,
    p_active: f.active ?? null,
  });

export const adminRemoveBundle = (adminId, id) =>
  rpc('admin_remove_bundle', { p_admin_id: adminId, p_id: id });

export const adminSetBundleActive = (adminId, id, active) =>
  rpc('admin_set_bundle_active', { p_admin_id: adminId, p_id: id, p_active: active });

export const adminReorderBundles = (adminId, ids) =>
  rpc('admin_reorder_bundles', { p_admin_id: adminId, p_ids: ids });

/* ───────────────────────── store (public read) ─────────────────────────
   Reads active products + categories for the storefront. Returns null when
   Supabase is off or the fetch fails, so the caller can fall back to the
   bundled catalog. Maps DB rows to the exact shape the product cards expect
   (note: `tag` mirrors the DB `category`). */
export async function fetchStoreCatalog() {
  if (!supabaseEnabled || !supabase) return null;
  try {
    const [pr, cr, br] = await Promise.all([
      supabase.from('products').select('*').eq('active', true).order('sort', { ascending: true }),
      supabase.from('categories').select('*').eq('active', true).order('sort', { ascending: true }),
      supabase.from('bundles').select('*').eq('active', true).order('sort', { ascending: true }),
    ]);
    if (pr.error || cr.error) return null;

    const products = (pr.data || []).map((r) => ({
      id: r.id,
      name: r.name,
      tag: r.category,
      price: r.price,
      unit: r.unit,
      emoji: r.emoji,
      image: r.image || null,
      tint: r.tint || '#9A5318',
      badge: r.badge || undefined,
      description: r.description || '',
    }));
    const categories = ['الكل', ...(cr.data || []).map((c) => c.name)];

    // bundles map back to the exact shape BundleCard/cart expect (parallel arrays)
    const bundles = (br.error ? [] : (br.data || [])).map((r) => {
      const ing = Array.isArray(r.ingredients) ? r.ingredients : [];
      return {
        id: r.id,
        name: r.name,
        kicker: r.kicker || '',
        desc: r.description || '',
        items: ing.map((x) => x?.name || ''),
        emojis: ing.map((x) => x?.emoji || '🛒'),
        images: ing.map((x) => x?.image || null),
        image: r.image || null,
        price: r.price,
        old: r.old_price ?? null,
        accent: r.accent || '#0F5132',
      };
    });

    return { products, categories, bundles };
  } catch {
    return null;
  }
}
