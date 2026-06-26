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
    p_stock: f.stock ?? null,
    p_old_price: f.oldPrice ?? null,
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
    p_stock: f.stock ?? null,
    p_old_price: f.oldPrice ?? null,
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
  rpc('admin_add_category', { p_admin_id: adminId, p_name: f.name, p_emoji: f.emoji || null, p_image: f.image ?? null });

export const adminUpdateCategory = (adminId, id, f = {}) =>
  rpc('admin_update_category', {
    p_admin_id: adminId,
    p_id: id,
    p_name: f.name ?? null,
    p_emoji: f.emoji ?? null,
    p_sort: f.sort ?? null,
    p_active: f.active ?? null,
    p_image: f.image ?? null,
  });

export const adminRemoveCategory = (adminId, id) =>
  rpc('admin_remove_category', { p_admin_id: adminId, p_id: id });

export const adminReorderCategories = (adminId, ids) =>
  rpc('admin_reorder_categories', { p_admin_id: adminId, p_ids: ids });

/* ───────────────────────── stores (admin) ───────────────────────── */
export const adminListStores = (adminId) => rpc('admin_list_stores', { p_admin_id: adminId });

export const adminAddStore = (adminId, f = {}) =>
  rpc('admin_add_store', {
    p_admin_id: adminId,
    p_name: f.name,
    p_category: f.category || 'بقالة',
    p_logo: f.logo ?? null,
    p_tagline: f.tagline ?? null,
    p_phone: f.phone ?? null,
    p_rating: f.rating ?? null,
    p_sort: f.sort ?? 0,
    p_cover: f.cover ?? null,
    p_cover_video: f.coverVideo ?? null,
  });

export const adminUpdateStore = (adminId, id, f = {}) =>
  rpc('admin_update_store', {
    p_admin_id: adminId,
    p_id: id,
    p_name: f.name ?? null,
    p_category: f.category ?? null,
    p_logo: f.logo ?? null,
    p_tagline: f.tagline ?? null,
    p_phone: f.phone ?? null,
    p_rating: f.rating ?? null,
    p_sort: f.sort ?? null,
    p_active: f.active ?? null,
    p_cover: f.cover ?? null,
    p_cover_video: f.coverVideo ?? null,
  });

export const adminRemoveStore = (adminId, id) =>
  rpc('admin_remove_store', { p_admin_id: adminId, p_id: id });

export const adminReorderStores = (adminId, ids) =>
  rpc('admin_reorder_stores', { p_admin_id: adminId, p_ids: ids });

export const adminSetProductStore = (adminId, productId, storeId) =>
  rpc('admin_set_product_store', { p_admin_id: adminId, p_id: productId, p_store_id: storeId });

/* ───────────────────────── store ratings (customer) ───────────────────────── */
export const storeRate = (accountId, storeId, stars, comment) =>
  rpc('store_rate', { p_account_id: accountId, p_store_id: storeId, p_stars: stars, p_comment: comment ?? null });

export const storeMyRating = (accountId, storeId) =>
  rpc('store_my_rating', { p_account_id: accountId, p_store_id: storeId });

export const storeRatingsList = (storeId, limit = 20) =>
  rpc('store_ratings_list', { p_store_id: storeId, p_limit: limit });

/* ───────────────────────── store follows (customer) ───────────────────────── */
export const storeToggleFollow = (accountId, storeId) =>
  rpc('store_toggle_follow', { p_account_id: accountId, p_store_id: storeId });

export const storeMyFollows = (accountId) =>
  rpc('store_my_follows', { p_account_id: accountId });

/* ───────────────────────── merchant credentials (admin) ───────────────────────── */
export const adminSetStoreCredentials = (adminId, storeId, username, password) =>
  rpc('admin_set_store_credentials', { p_admin_id: adminId, p_store_id: storeId, p_username: username, p_password: password });

/* ───────────────────────── commission / earnings (admin) ───────────────────────── */
export const adminSetStoreCommission = (adminId, storeId, pct) =>
  rpc('admin_set_store_commission', { p_admin_id: adminId, p_store_id: storeId, p_pct: pct });

export const adminCommissionReport = (adminId, since = null) =>
  rpc('admin_commission_report', { p_admin_id: adminId, p_since: since });

/* ───────────────────────── app settings (admin control panel) ───────────────────────── */
export const getSettings = () => rpc('get_settings', {});
export const adminUpdateSettings = (adminId, s = {}) =>
  rpc('admin_update_settings', {
    p_admin_id: adminId,
    p_delivery_fee: s.delivery_fee ?? null,
    p_delivery_extra_store: s.delivery_extra_store ?? null,
    p_delivery_fee_cap: s.delivery_fee_cap ?? null,
    p_free_delivery_over: s.free_delivery_over ?? null,
    p_driver_fee_base: s.driver_fee_base ?? null,
    p_driver_fee_per_extra_store: s.driver_fee_per_extra_store ?? null,
    p_default_commission_pct: s.default_commission_pct ?? null,
  });

/* ───────────────────────── finance (admin) ───────────────────────── */
export const adminFinanceReport = (adminId, since = null) =>
  rpc('admin_finance_report', { p_admin_id: adminId, p_since: since });
export const adminSettleMerchant = (adminId, storeId, amount, method, note = null) =>
  rpc('admin_settle_merchant', { p_admin_id: adminId, p_store_id: storeId, p_amount: amount, p_method: method, p_note: note });
export const adminSettleDriver = (adminId, driverId, amount, method, note = null) =>
  rpc('admin_settle_driver', { p_admin_id: adminId, p_driver_id: driverId, p_amount: amount, p_method: method, p_note: note });

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

export const adminSetBundleSeason = (adminId, id, season) =>
  rpc('admin_set_bundle_season', { p_admin_id: adminId, p_id: id, p_season: season });

/* ───────────────────────── store (public read) ─────────────────────────
   Reads active products + categories for the storefront. Returns null when
   Supabase is off or the fetch fails, so the caller can fall back to the
   bundled catalog. Maps DB rows to the exact shape the product cards expect
   (note: `tag` mirrors the DB `category`). */
export async function fetchStoreCatalog() {
  if (!supabaseEnabled || !supabase) return null;
  try {
    const [pr, cr, br, bs, sr] = await Promise.all([
      supabase.from('products').select('*').eq('active', true).order('sort', { ascending: true }),
      supabase.from('categories').select('*').eq('active', true).order('sort', { ascending: true }),
      supabase.from('bundles').select('*').eq('active', true).order('sort', { ascending: true }),
      supabase.rpc('store_best_sellers', { p_limit: 200 }),
      supabase.from('stores').select('*').eq('active', true).order('sort', { ascending: true }),
    ]);
    if (pr.error || cr.error) return null;

    // sales ranking by product name (orders store items as { name, qty, price })
    const soldMap = {};
    const rows = bs && !bs.error && Array.isArray(bs.data) ? bs.data : [];
    rows.forEach((r) => { if (r && r.name) soldMap[r.name] = Number(r.sold) || 0; });

    const NEW_DAYS = 10;
    const now = Date.now();
    const products = (pr.data || []).map((r) => {
      const price = r.price;
      const oldPrice = r.old_price && r.old_price > price ? r.old_price : null;
      const stock = r.stock === null || r.stock === undefined ? null : Number(r.stock);
      const isNew = r.created_at ? now - new Date(r.created_at).getTime() < NEW_DAYS * 86400000 : false;
      const pct = oldPrice ? Math.round(((oldPrice - price) / oldPrice) * 100) : 0;
      return {
        id: r.id,
        name: r.name,
        tag: r.category,
        storeId: r.store_id || null,
        price,
        unit: r.unit,
        emoji: r.emoji,
        image: r.image || null,
        tint: r.tint || '#9A5318',
        description: r.description || '',
        sold: soldMap[r.name] || 0,
        oldPrice,
        stock,
        discountPct: pct,
        _manual: r.badge || '',
        _discount: !!oldPrice,
        _new: isNew,
      };
    });

    // order by real sales (stable: ties keep the admin's manual order),
    // mark the top sellers that actually have sales
    products.sort((a, b) => b.sold - a.sold);
    products.forEach((p, i) => { p._best = i < 3 && p.sold > 0; });

    // resolve ONE badge per product by priority:
    // manual > خصم > الأكثر مبيعاً > جديد
    products.forEach((p) => {
      p.badge =
        p._manual ||
        (p._discount ? `خصم ${p.discountPct}%` : '') ||
        (p._best ? 'الأكثر مبيعاً' : '') ||
        (p._new ? 'جديد' : '') ||
        undefined;
      delete p._manual; delete p._discount; delete p._new; delete p._best;
    });
    const categories = [
      { name: 'الكل', image: null, emoji: null },
      ...(cr.data || []).map((c) => ({ name: c.name, image: c.image || null, emoji: c.emoji || null })),
    ];

    // bundles map back to the exact shape BundleCard/cart expect (parallel arrays)
    const bundles = (br.error ? [] : (br.data || [])).map((r) => {
      const ing = Array.isArray(r.ingredients) ? r.ingredients : [];
      return {
        id: r.id,
        name: r.name,
        kicker: r.kicker || '',
        desc: r.description || '',
        // show quantity + unit inline when present (e.g. "طماطم × 5 كيلو")
        items: ing.map((x) => {
          const nm = x?.name || '';
          return x?.qty ? `${nm} × ${x.qty}${x.unit ? ' ' + x.unit : ''}` : nm;
        }),
        emojis: ing.map((x) => x?.emoji || '🛒'),
        images: ing.map((x) => x?.image || null),
        image: r.image || null,
        price: r.price,
        old: r.old_price ?? null,
        accent: r.accent || '#0F5132',
        storeId: r.store_id || null,
        season: r.season || null,
        sold: soldMap[r.name] || 0,
      };
    });

    const stores = (sr && !sr.error ? sr.data || [] : []).map((s) => ({
      id: s.id,
      name: s.name,
      category: s.category || 'بقالة',
      logo: s.logo || null,
      cover: s.cover || null,
      coverVideo: s.cover_video || null,
      tagline: s.tagline || '',
      phone: s.phone || '',
      rating: Number(s.rating) || 0,
      ratingCount: s.rating_count || 0,
      followersCount: s.followers_count || 0,
      featured: !!s.featured,
    }));

    return { products, categories, bundles, stores };
  } catch {
    return null;
  }
}
