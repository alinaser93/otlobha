import { supabase, supabaseEnabled } from './supabase.js';

// نفس نمط استدعاء RPC المستخدم في admin.js / products.js
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

/* ── قراءة عامّة (المتجر) ── */
export const getHomeLayout = () => rpc('get_home_layout', {});

/* ── تحكّم الأدمن في «واجهة Blinkit» ── */
export const adminListHome = (adminId) => rpc('admin_list_home', { p_admin_id: adminId });

export const adminSaveHomeGroup = (adminId, f = {}) =>
  rpc('admin_save_home_group', {
    p_admin_id: adminId, p_id: f.id ?? null, p_title: f.title,
    p_tab: f.tab ?? 'all', p_sort: f.sort ?? 0, p_active: f.active ?? true,
  });
export const adminDeleteHomeGroup = (adminId, id) =>
  rpc('admin_delete_home_group', { p_admin_id: adminId, p_id: id });

export const adminSaveHomeTab = (adminId, f = {}) =>
  rpc('admin_save_home_tab', {
    p_admin_id: adminId, p_id: f.id ?? null, p_key: f.key, p_label: f.label,
    p_icon: f.icon ?? '🛒', p_icon_image: f.icon_image ?? null,
    p_theme: f.theme ?? '#F8CB46', p_sort: f.sort ?? 0, p_active: f.active ?? true,
  });
export const adminDeleteHomeTab = (adminId, id) =>
  rpc('admin_delete_home_tab', { p_admin_id: adminId, p_id: id });

export const adminSaveHomeBanner = (adminId, f = {}) =>
  rpc('admin_save_home_banner', {
    p_admin_id: adminId, p_id: f.id ?? null, p_title: f.title ?? null, p_subtitle: f.subtitle ?? null,
    p_cta_label: f.cta_label ?? null, p_image: f.image ?? null, p_theme: f.theme ?? '#F8CB46',
    p_tab: f.tab ?? 'all', p_sort: f.sort ?? 0, p_active: f.active ?? true,
  });
export const adminDeleteHomeBanner = (adminId, id) =>
  rpc('admin_delete_home_banner', { p_admin_id: adminId, p_id: id });

export const adminSetCategoryHome = (adminId, id, f = {}) =>
  rpc('admin_set_category_home', {
    p_admin_id: adminId, p_id: id, p_group: f.group ?? null, p_tab: f.tab ?? null, p_featured: f.featured ?? null,
  });

export const adminSetStorefront = (adminId, f = {}) =>
  rpc('admin_set_storefront', {
    p_admin_id: adminId,
    p_delivery_minutes: f.delivery_minutes ?? null,
    p_show_stores: f.show_stores ?? null,
    p_show_bundles: f.show_bundles ?? null,
    p_welcome_title: f.welcome_title ?? null,
    p_welcome_subtitle: f.welcome_subtitle ?? null,
    // مرّر '' لمسح الوسائط، أو undefined→null لإبقائها كما هي
    p_header_image: f.header_image === undefined ? null : f.header_image,
    p_header_video: f.header_video === undefined ? null : f.header_video,
    p_header_overlay: f.header_overlay ?? null,
  });

/* ── المرحلة ٢: مزايا جديدة قابلة للتحكّم (تحتاج db/blinkit_storefront_3.sql) ── */

// لوحة الإعلانات (بطاقات .bk-ad)
export const adminSaveHomeAd = (adminId, f = {}) =>
  rpc('admin_save_home_ad', {
    p_admin_id: adminId, p_id: f.id ?? null, p_title: f.title ?? null, p_subtitle: f.subtitle ?? null,
    p_cta_label: f.cta_label ?? null, p_emoji: f.emoji ?? null, p_image: f.image ?? null,
    p_bg: f.bg ?? null, p_fg: f.fg ?? null, p_tab: f.tab ?? 'all', p_sort: f.sort ?? 0, p_active: f.active ?? true,
  });
export const adminDeleteHomeAd = (adminId, id) =>
  rpc('admin_delete_home_ad', { p_admin_id: adminId, p_id: id });

// كولاج الأكثر مبيعاً (بطاقات شبكة bk-bs)
export const adminSaveHomeCollage = (adminId, f = {}) =>
  rpc('admin_save_home_collage', {
    p_admin_id: adminId, p_id: f.id ?? null, p_title: f.title,
    p_emojis: Array.isArray(f.emojis) ? f.emojis : [], p_more_count: f.more_count ?? 0,
    p_cat_name: f.cat_name ?? null, p_tab: f.tab ?? 'all', p_sort: f.sort ?? 0, p_active: f.active ?? true,
  });
export const adminDeleteHomeCollage = (adminId, id) =>
  rpc('admin_delete_home_collage', { p_admin_id: adminId, p_id: id });

// صفوف المنتجات (ProductRow) — المصدر: bestsellers | deals | category | manual
export const adminSaveHomeRail = (adminId, f = {}) =>
  rpc('admin_save_home_rail', {
    p_admin_id: adminId, p_id: f.id ?? null, p_title: f.title, p_subtitle: f.subtitle ?? null,
    p_source: f.source ?? 'bestsellers', p_cat_name: f.cat_name ?? null,
    p_product_ids: Array.isArray(f.product_ids) ? f.product_ids : [],
    p_tab: f.tab ?? 'all', p_sort: f.sort ?? 0, p_active: f.active ?? true,
  });
export const adminDeleteHomeRail = (adminId, id) =>
  rpc('admin_delete_home_rail', { p_admin_id: adminId, p_id: id });

// ثيم تبويب مخصّص (يُدمج فوق ثيم التصميم)
export const adminSetTabTheme = (adminId, id, themeJson) =>
  rpc('admin_set_tab_theme', { p_admin_id: adminId, p_id: id, p_theme_json: themeJson ?? null });

// الشريط الترويجي العلوي (⚡)
export const adminSetPromo = (adminId, enabled, text) =>
  rpc('admin_set_promo', { p_admin_id: adminId, p_enabled: enabled ?? null, p_text: text ?? null });
