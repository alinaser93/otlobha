/* ============================================================
   blinkitLayout — يحوّل بيانات لوحة الأدمن الحيّة
   (getHomeLayout + fetchStoreCatalog) إلى «موديل عرض» تستهلكه
   واجهة /blinkit (BlinkitHome). عند غياب أي بيانات حيّة يُعيد null
   فترجع الواجهة إلى تصميمها المدمج (fallback) بلا أي تغيير بصري.

   المرحلة ١: التبويبات + عناوين الأقسام + بلاطات الفئات + المنتجات
   الحقيقية (بالدينار) + الترحيب + البانرات — كلها من تحكّم الأدمن/التاجر.
   ============================================================ */

// درجات خلفية لطيفة تُشتق من اسم الفئة (ثابتة لكل اسم) لبلاطات بلا لون محدّد
const TILE_BGS = [
  "#E9F2EC", "#F2EEE5", "#FBF3E2", "#EAF1F8", "#F3ECDD", "#FBEFE6",
  "#FBEAEA", "#EDEFF2", "#F6E9EE", "#EFE9F6", "#F1EEDF", "#EAF0F4",
];
const hashStr = (s) => {
  let h = 0;
  for (let i = 0; i < String(s).length; i++) h = (h * 31 + String(s).charCodeAt(i)) | 0;
  return Math.abs(h);
};
const tileBg = (name) => TILE_BGS[hashStr(name) % TILE_BGS.length];

// عدّاد مختصر للتقييمات (1200 → "1.2 ألف")
const shortCount = (n) => {
  n = Number(n) || 0;
  if (n >= 1000) return `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)} ألف`;
  return String(n);
};

// يبني بطاقة منتج بشكل تستهلكه ProductCard مباشرة (الأسعار نهائية بالدينار)
function uiProduct(p, deliveryMinutes) {
  const price = Math.round(p.price || 0);
  const mrp = p.oldPrice && p.oldPrice > price ? Math.round(p.oldPrice) : price;
  return {
    id: p.id,
    name: p.name,
    e: p.emoji || "🛒",
    image: p.image || null,
    bg: p.tint || "#F1ECE0",
    weight: p.unit || "",
    price,
    mrp,
    off: p.discountPct || (mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0),
    rating: Number(p.rating) || 4.5,
    reviews: shortCount(p.ratingCount),
    eta: `${deliveryMinutes} دقيقة`,
    iqd: true, // إشارة أن السعر نهائي بالدينار (لا تحويل ₹ في ProductCard)
  };
}

/**
 * buildBlinkitModel(layout, catalog, opts) → null | model
 *   layout  : ناتج getHomeLayout()  { tabs, groups, banners, categories, config } أو {ok:false}
 *   catalog : ناتج fetchStoreCatalog() { products, categories, bundles, stores } أو null
 *   opts    : { fallbackTabs: [{id,label}], fallbackThemes: {key:theme} }
 */
export function buildBlinkitModel(layout, catalog, opts = {}) {
  const L = layout && layout.ok !== false ? layout : {};
  const tabsRaw = Array.isArray(L.tabs) ? L.tabs.filter((t) => t && t.active !== false) : [];
  const groupsRaw = Array.isArray(L.groups) ? L.groups.filter((g) => g && g.active !== false) : [];
  const bannersRaw = Array.isArray(L.banners) ? L.banners.filter((b) => b && b.active !== false) : [];
  const catsRaw = Array.isArray(L.categories) ? L.categories : [];
  const products = catalog && Array.isArray(catalog.products) ? catalog.products : [];

  // لا شيء حيّ إطلاقاً → دع الواجهة تستعمل تصميمها المدمج
  const hasLive = products.length > 0 || tabsRaw.length > 0 || catsRaw.length > 0;
  if (!hasLive) return null;

  const cfg = L.config || {};
  const config = {
    deliveryMinutes: cfg.delivery_minutes ?? 12,
    welcomeTitle: cfg.welcome_title || "أهلاً بك",
    welcomeSubtitle: cfg.welcome_subtitle || "اطلب الآن واحصل على توصيل مجاني",
    headerImage: cfg.header_image || null,
    headerVideo: cfg.header_video || null,
    headerOverlay: cfg.header_overlay ?? 0.18,
    showStores: cfg.show_stores !== false,
    showBundles: cfg.show_bundles !== false,
  };

  // ── التبويبات: من الأدمن إن وُجدت، وإلا التبويبات المدمجة ──
  const fallbackTabs = opts.fallbackTabs || [{ id: "all", label: "الكل" }];
  const tabs = tabsRaw.length
    ? tabsRaw
        .slice()
        .sort((a, b) => (a.sort || 0) - (b.sort || 0))
        .map((t) => ({ key: t.key, label: t.label, iconImage: t.icon_image || null, theme: t.theme || "#F8CB46" }))
    : fallbackTabs.map((t) => ({ key: t.id, label: t.label, iconImage: null, theme: null }));

  const tabKeys = new Set(tabs.map((t) => t.key));
  const DEFAULT_TAB = tabs.length ? tabs[0].key : "all";
  // فئة تنتمي لتبويب موجود، وإلا تُنسب للتبويب الأول
  const catTab = (c) => (tabKeys.has(c.home_tab) ? c.home_tab : DEFAULT_TAB);

  // الفئات: من ربط لوحة الأدمن (home_tab/home_group) إن وُجدت، وإلا من كتالوج
  // المتجر مباشرةً (تُنسب كلها للتبويب الأول) حتى تظهر البلاطات دون هجرة SQL.
  const catalogCats =
    catalog && Array.isArray(catalog.categories)
      ? catalog.categories.filter((c) => c && c.name && c.name !== "الكل")
      : [];
  const cats = catsRaw.length
    ? catsRaw
    : catalogCats.map((c) => ({
        id: "cat:" + c.name, name: c.name, emoji: c.emoji, image: c.image,
        home_group: null, home_tab: DEFAULT_TAB,
      }));

  // ── فهرس المنتجات (نهائية بالدينار) + تجميعها حسب الفئة ──
  const productsById = {};
  const byCat = {};
  const bySold = products.slice().sort((a, b) => (b.sold || 0) - (a.sold || 0));
  products.forEach((p) => {
    const up = uiProduct(p, config.deliveryMinutes);
    productsById[String(up.id)] = up;
    const c = p.tag || "أخرى";
    (byCat[c] = byCat[c] || []).push(up);
  });
  const topSoldIds = bySold.map((p) => String(p.id));
  const dealIds = bySold.filter((p) => p.oldPrice && p.oldPrice > p.price).map((p) => String(p.id));

  // ── هيرو من بانر الأدمن ──
  const bannerHero = (b) => ({
    kind: "glow",
    title: b.title || "",
    sub: b.subtitle || "",
    image: b.image || null,
    cta: b.cta_label || null,
    bg: b.image ? "#f4f4f4" : `linear-gradient(135deg, ${b.theme || "#F7CBDC"}, ${b.theme || "#F1B0CA"})`,
    text: "#3a2740",
    subText: "#6a5a62",
  });

  // ── بناء أقسام كل تبويب ──
  const sectionsByTab = {};
  const heroByTab = {}; // الهيرو العلوي (يتلاشى مع التمرير داخل .bk-herowrap)
  for (const tab of tabs) {
    const key = tab.key;
    const secs = [];
    const isAll = key === DEFAULT_TAB;
    const tabCats = cats.filter((c) => catTab(c) === key);

    // 1) الهيرو العلوي: ترحيب لتبويب «الكل»، وإلا أول بانر لهذا التبويب
    const tabBanners = bannersRaw
      .filter((b) => (b.tab || "all") === key)
      .sort((a, b) => (a.sort || 0) - (b.sort || 0));
    const ffTheme = (opts.fallbackThemes || {})[key];
    heroByTab[key] = isAll
      ? { kind: "welcome", title: config.welcomeTitle, sub: config.welcomeSubtitle }
      : tabBanners[0]
      ? { kind: "banner", hero: bannerHero(tabBanners[0]) }
      : ffTheme && ffTheme.hero
      ? { kind: "themehero", hero: ffTheme.hero } // احتفظ بهيرو التصميم المدمج حتى يضيف الأدمن بانراً
      : null;
    // بانرات إضافية (الثاني فما بعد) تُعرض كأقسام
    tabBanners.slice(1).forEach((b) => secs.push({ kind: "banner", hero: bannerHero(b) }));

    // 2) تبويب «الكل»: كولاج الأكثر مبيعاً (مشتق من الفئات الحقيقية)
    if (isAll) {
      const collageCats = (tabCats.length ? tabCats : cats)
        .filter((c) => (byCat[c.name] || []).length)
        .slice(0, 6);
      if (collageCats.length >= 3) {
        secs.push({
          kind: "collage",
          cards: collageCats.map((c) => {
            const items = (byCat[c.name] || []).slice(0, 4).map((p) => p.e);
            while (items.length < 4) items.push(c.emoji || "🛒");
            return { title: c.name, more: Math.max(0, (byCat[c.name] || []).length - 4), items, catName: c.name };
          }),
        });
      }
    }

    // 3) مجموعات الأدمن (عناوين الأقسام) + بلاطات فئاتها
    const groups = groupsRaw
      .filter((g) => (g.tab || "all") === key)
      .sort((a, b) => (a.sort || 0) - (b.sort || 0));
    const usedCatIds = new Set();
    for (const g of groups) {
      const tiles = tabCats
        .filter((c) => c.home_group === g.id)
        .map((c) => {
          usedCatIds.add(c.id);
          return { t: c.name, e: c.emoji || "🛒", image: c.image || null, bg: tileBg(c.name), catName: c.name };
        });
      if (tiles.length) secs.push({ kind: "tiles", title: g.title, tiles });
    }

    // 4) فئات بلا مجموعة → قسم افتراضي «تسوّق حسب الفئة»
    const looseTiles = tabCats
      .filter((c) => !usedCatIds.has(c.id))
      .map((c) => ({ t: c.name, e: c.emoji || "🛒", image: c.image || null, bg: tileBg(c.name), catName: c.name }));
    if (looseTiles.length) secs.push({ kind: "tiles", title: "تسوّق حسب الفئة", tiles: looseTiles });

    // 5) صفوف المنتجات الحقيقية
    if (isAll) {
      if (topSoldIds.length) secs.push({ kind: "rail", title: "الأكثر مبيعاً", ids: topSoldIds.slice(0, 12) });
      secs.push({ kind: "ad" }); // بطاقة إعلان مدمجة (تصبح قابلة للتحكم في المرحلة ٢)
      if (dealIds.length) secs.push({ kind: "rail", title: "عروض وخصومات", ids: dealIds.slice(0, 12) });
    } else {
      // منتجات التبويب = منتجات الفئات المنسوبة إليه
      const tabCatNames = new Set(tabCats.map((c) => c.name));
      const ids = bySold.filter((p) => tabCatNames.has(p.tag)).map((p) => String(p.id));
      if (ids.length) secs.push({ kind: "rail", title: `منتجات ${tab.label}`, ids: ids.slice(0, 12) });
    }

    sectionsByTab[key] = secs;
  }

  return { config, tabs, productsById, productsByCat: byCat, sectionsByTab, heroByTab, defaultTab: DEFAULT_TAB };
}
