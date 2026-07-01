import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  Search, Mic, ChevronDown, ChevronRight, ChevronLeft, User, Clock, Star,
  Plus, Minus, Home, RotateCcw, LayoutGrid, Printer, ShoppingBasket,
  Headphones, Sparkles, Lamp, Baby, Gift, Globe, ShoppingBag, TrendingUp,
} from "lucide-react";

/* ============================================================
   تطبيق تجارة سريعة بأسلوب بلينكيت — نسخة عربية (RTL).
   • هيدر ذهبي/بيج لكل قسم، وهوية كل فئة في القسم أسفل التبويبات.
   • هيدر قابل للطي: معلومات التوصيل تنطوي والبانر يتلاشى تدريجياً
     عند النزول، وشريط البحث + التبويبات يثبتان ويتغيّر لونهما.
   الصور إيموجي مؤقتة لاستبدالها لاحقاً.
   ============================================================ */

const YELLOW = "#F8CB46";
const YELLOW_DK = "#F0B500";
const GREEN = "#0C831F";
const GREEN_SOFT = "#E8F4EA";
const CREAM = "#FCF7E8";
const BLUE = "#2A6ED9";
const INK = "#1C1C1C";
const CUR = "د.ع";
const toIQD = (n) => Math.round((n * 36) / 50) * 50; // تحويل تقريبي إلى الدينار العراقي (أرقام واقعية)
const fmt = (n) => n.toLocaleString("en-US");

/* أدوات ألوان لإعادة تلوين الهيدر أثناء التمرير */
const CREAM_RGB = [252, 247, 232];
const INK_RGB = [28, 28, 28];
const hexToRgb = (h) => {
  h = h.replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
const rgb = (a) => `rgb(${a[0]},${a[1]},${a[2]})`;
const rgba = (a, al) => `rgba(${a[0]},${a[1]},${a[2]},${al})`;
const clamp01 = (x) => Math.min(1, Math.max(0, x));

/* ------------------------- التبويبات ------------------------- */
const TABS = [
  { id: "all", label: "الكل", Icon: ShoppingBasket },
  { id: "electronics", label: "إلكترونيات", Icon: Headphones },
  { id: "beauty", label: "الجمال", Icon: Sparkles },
  { id: "decor", label: "ديكور", Icon: Lamp },
  { id: "kids", label: "الأطفال", Icon: Baby },
  { id: "gifting", label: "الهدايا", Icon: Gift },
  { id: "imported", label: "مستورد", Icon: Globe },
];

/* ------------------------- بيانات الرئيسية (الكل) ------------------------- */
const BESTSELLERS = [
  { title: "خضار وفواكه", more: 133, items: ["🥦", "🍌", "🧅", "🫛"] },
  { title: "رقائق ومقرمشات", more: 325, items: ["🥔", "🍟", "🌽", "🥨"] },
  { title: "مشروبات وعصائر", more: 200, items: ["🥤", "🧃", "🥫", "🧉"] },
  { title: "ألبان وخبز وبيض", more: 22, items: ["🥛", "🍶", "🧈", "🥚"] },
  { title: "آيس كريم والمزيد", more: 38, items: ["🍦", "🍫", "🍨", "🧁"] },
  { title: "زيت وسمن وبهارات", more: 152, items: ["🫒", "🛢️", "🌾", "🧂"] },
];
const GROCERY = [
  { t: "خضار وفواكه", e: "🥬", bg: "#E9F2EC" },
  { t: "طحين وأرز وعدس", e: "🌾", bg: "#F2EEE5" },
  { t: "زيت وسمن وبهارات", e: "🫒", bg: "#FBF3E2" },
  { t: "ألبان وخبز وبيض", e: "🥛", bg: "#EAF1F8" },
  { t: "مخبوزات وبسكويت", e: "🍪", bg: "#F3ECDD" },
  { t: "مكسرات وحبوب", e: "🥣", bg: "#FBEFE6" },
  { t: "دجاج ولحوم وأسماك", e: "🍗", bg: "#FBEAEA" },
  { t: "أدوات وأجهزة مطبخ", e: "🍳", bg: "#EDEFF2" },
];
const SNACKS = [
  { t: "رقائق ومقرمشات", e: "🍟", bg: "#FBF1E0" },
  { t: "حلويات وشوكولاتة", e: "🍫", bg: "#F3E7DD" },
  { t: "مشروبات وعصائر", e: "🥤", bg: "#E7F0F6" },
  { t: "شاي وقهوة والمزيد", e: "☕", bg: "#EFE7DD" },
  { t: "طعام سريع التحضير", e: "🍜", bg: "#FBEFE0" },
  { t: "صلصات ومربى", e: "🥫", bg: "#FBEAE4" },
  { t: "ركن الپان", e: "🍃", bg: "#E9F2E6" },
  { t: "آيس كريم والمزيد", e: "🍦", bg: "#F1EAF6" },
];
const HOUSEHOLD = [
  { t: "المنزل ونمط الحياة", e: "🏠", bg: "#EEF1F4" },
  { t: "منظفات وطاردات", e: "🧽", bg: "#E7F1F2" },
  { t: "إلكترونيات", e: "🔌", bg: "#EFEFEF" },
  { t: "قرطاسية وألعاب", e: "🎲", bg: "#F1ECE0" },
];
const STORES_SPOTLIGHT = [
  { t: "متجر الآيس كريم", e: "🍦", bg: "#FBF0E4" },
  { t: "متجر السفر", e: "🧳", bg: "#EAF1F8" },
  { t: "متجر الهوايات", e: "🎨", bg: "#F3EAF6" },
  { t: "متجر الرياضة", e: "🏀", bg: "#E9F2EC" },
];
const PICKS_LIFESTYLE = [
  { t: "احتياجات روحية", e: "🪔", bg: "#F6EEDD" },
  { t: "متجر الحيوانات", e: "🐾", bg: "#EEF1F4" },
  { t: "أساسيات الموضة", e: "👕", bg: "#EAF0F6" },
  { t: "متجر الألعاب", e: "🧸", bg: "#F3ECDD" },
  { t: "متجر الكتب", e: "📚", bg: "#EAF1F4" },
  { t: "متجر الصيدلية", e: "💊", bg: "#EAF4EE" },
  { t: "هدايا إلكترونية", e: "🎁", bg: "#FBEFE0" },
  { t: "متجر المجوهرات", e: "💍", bg: "#F6EEDD" },
];

/* ------------------------- فئات الأقسام المُثيّمة ------------------------- */
const ELECTRONICS_TILES = [
  { t: "جوالات وإكسسوارات", e: "📱", bg: "#ECEFF2" },
  { t: "صوتيات", e: "🎧", bg: "#EAF0F4" },
  { t: "أجهزة منزلية", e: "🔌", bg: "#EFEFEF" },
  { t: "أجهزة ذكية", e: "⌚", bg: "#ECEEF1" },
  { t: "حواسيب", e: "💻", bg: "#EDEFF2" },
  { t: "إضاءة", e: "💡", bg: "#F1EEDF" },
  { t: "كاميرات", e: "📷", bg: "#EEEFF1" },
  { t: "ألعاب فيديو", e: "🎮", bg: "#ECEDF2" },
];
const BEAUTY = [
  { t: "الاستحمام والجسم", e: "🧴", bg: "#F6E9EE" },
  { t: "الشعر", e: "💇", bg: "#EFE9F6" },
  { t: "البشرة والوجه", e: "🧖", bg: "#FBEAF0" },
  { t: "تجميل ومكياج", e: "💄", bg: "#F6E7EC" },
  { t: "العناية النسائية", e: "🌸", bg: "#FBEAF2" },
  { t: "عناية بالطفل", e: "🍼", bg: "#F1E7F0" },
  { t: "صحة وأدوية", e: "💊", bg: "#F3E7EE" },
  { t: "عطور", e: "🌷", bg: "#F6E7EC" },
];
const DECOR_TILES = [
  { t: "ديكور المنزل", e: "🪴", bg: "#EFE6D5" },
  { t: "مصابيح وإضاءة", e: "💡", bg: "#F2ECD9" },
  { t: "مزهريات وأصص", e: "🏺", bg: "#EDE3D0" },
  { t: "ديكور الجدران", e: "🖼️", bg: "#F0E8D8" },
  { t: "شموع ومعطرات", e: "🕯️", bg: "#F2E9D6" },
  { t: "وسائد وأغطية", e: "🛋️", bg: "#EEE4D2" },
  { t: "نباتات صناعية", e: "🌿", bg: "#E9F0E2" },
  { t: "ساعات وإطارات", e: "🕰️", bg: "#EFEADB" },
];
const KIDS_TILES = [
  { t: "حفاضات ومناديل", e: "🧷", bg: "#DDEFF6" },
  { t: "طعام الأطفال", e: "🍼", bg: "#E6F2F8" },
  { t: "ألعاب", e: "🧸", bg: "#E0EEF6" },
  { t: "استحمام وبشرة", e: "🧴", bg: "#E8F3F8" },
  { t: "الرضاعة", e: "🥣", bg: "#DEEFF6" },
  { t: "أزياء الأطفال", e: "👕", bg: "#E6F1F8" },
  { t: "التعلم", e: "📚", bg: "#E0EDF6" },
  { t: "قرطاسية", e: "✏️", bg: "#E8F2F8" },
];
const IMPORTED_TILES = [
  { t: "وجبات عالمية", e: "🍫", bg: "#F1E6CE" },
  { t: "نودلز ومعكرونة", e: "🍝", bg: "#F2E9D2" },
  { t: "صلصات وغموس", e: "🥫", bg: "#EFE3CB" },
  { t: "مشروبات", e: "🥤", bg: "#F0E7D0" },
  { t: "شوكولاتة", e: "🍬", bg: "#F2E8D0" },
  { t: "الفطور", e: "🥣", bg: "#EEE2CA" },
];
const OCCASIONS = [
  { t: "عيد ميلاد", e: "🎂" }, { t: "ذكرى سنوية", e: "💐" },
  { t: "استقبال مولود", e: "🍼" }, { t: "منزل جديد", e: "🏡" },
  { t: "وداع", e: "🎁" }, { t: "تهنئة", e: "🎉" },
];

/* ------------------------- المنتجات ------------------------- */
const PRODUCTS = [
  { id: 1, name: "نودلز ماجيك ماسالا سريعة التحضير", e: "🍜", bg: "#FCEFD9", weight: "70 غ", price: 14, mrp: 15, off: 6, rating: 4.5, reviews: "28 ألف", eta: "8 دقائق" },
  { id: 2, name: "رقائق بطاطس مملّحة كلاسيكية", e: "🍟", bg: "#FBF1DE", weight: "52 غ", price: 20, mrp: 20, off: 0, rating: 4.4, reviews: "50 ألف", eta: "8 دقائق" },
  { id: 3, name: "علبة مشروب كولا غازي", e: "🥤", bg: "#FBE3E3", weight: "300 مل", price: 38, mrp: 40, off: 5, rating: 4.6, reviews: "12 ألف", eta: "8 دقائق" },
  { id: 4, name: "كيس حليب طازج كامل الدسم", e: "🥛", bg: "#EAF1F8", weight: "500 مل", price: 34, mrp: 35, off: 3, rating: 4.7, reviews: "9 آلاف", eta: "8 دقائق" },
  { id: 5, name: "بيض بنّي طازج من المزرعة", e: "🥚", bg: "#F6EFE2", weight: "6 حبات", price: 62, mrp: 72, off: 14, rating: 4.5, reviews: "7 آلاف", eta: "8 دقائق" },
  { id: 6, name: "سيروم فيتامين C مفتّح للوجه", e: "🧪", bg: "#FBF6D9", weight: "30 مل", price: 285, mrp: 599, off: 52, rating: 4.4, reviews: "2.1 ألف", eta: "21 دقيقة" },
  { id: 7, name: "بلسم شفاه ملوّن كولر+كير", e: "💄", bg: "#F6E9EE", weight: "3 غ", price: 240, mrp: 299, off: 19, rating: 4.5, reviews: "1.2 ألف", eta: "21 دقيقة" },
  { id: 8, name: "كريم إزالة اسمرار البشرة الاحترافي", e: "🧴", bg: "#EFEFEF", weight: "12 غ", price: 432, mrp: 480, off: 10, rating: 4.3, reviews: "1.4 ألف", eta: "21 دقيقة" },
  { id: 9, name: "سماعات رأس بلوتوث لاسلكية", e: "🎧", bg: "#EAF0F4", weight: "قطعة", price: 2899, mrp: 6990, off: 58, rating: 4.2, reviews: "988", eta: "13 دقيقة" },
  { id: 10, name: "مكبّر صوت بلوتوث مدمج", e: "🔊", bg: "#EDEFF2", weight: "16 واط", price: 899, mrp: 2199, off: 59, rating: 4.1, reviews: "215", eta: "13 دقيقة" },
  { id: 11, name: "سماعات أذن لاسلكية برو", e: "🎵", bg: "#F1ECF6", weight: "قطعة", price: 499, mrp: 5999, off: 91, rating: 4.0, reviews: "1.1 ألف", eta: "13 دقيقة" },
  { id: 12, name: "لوح شوكولاتة داكنة غنية", e: "🍫", bg: "#F0E6DC", weight: "90 غ", price: 99, mrp: 120, off: 17, rating: 4.6, reviews: "4 آلاف", eta: "8 دقائق" },
  { id: 13, name: "زبدة فول سوداني مقرمشة", e: "🥜", bg: "#FBEFE0", weight: "340 غ", price: 189, mrp: 225, off: 16, rating: 4.5, reviews: "3.2 ألف", eta: "10 دقائق" },
  { id: 14, name: "أرز بسمتي طويل الحبة عطري", e: "🌾", bg: "#F2EEE3", weight: "1 كغ", price: 101, mrp: 108, off: 6, rating: 4.6, reviews: "72 ألف", eta: "10 دقائق" },
  { id: 15, name: "دمية دب قطيفة ناعمة", e: "🧸", bg: "#F3ECD9", weight: "30 سم", price: 349, mrp: 599, off: 42, rating: 4.6, reviews: "2.4 ألف", eta: "13 دقيقة" },
  { id: 16, name: "حفاضات أطفال بنطلون (وسط)", e: "🧷", bg: "#E6F2F8", weight: "56 حبة", price: 699, mrp: 999, off: 30, rating: 4.5, reviews: "8 آلاف", eta: "13 دقيقة" },
  { id: 17, name: "مجموعة مكعبات بناء خشبية", e: "🧱", bg: "#EAF1F8", weight: "50 قطعة", price: 449, mrp: 899, off: 50, rating: 4.4, reviews: "1.1 ألف", eta: "13 دقيقة" },
  { id: 18, name: "مزهرية سيراميك", e: "🏺", bg: "#EFE6D5", weight: "قطعة", price: 299, mrp: 849, off: 64, rating: 4.3, reviews: "640", eta: "19 دقيقة" },
  { id: 19, name: "أضواء خيطية LED", e: "✨", bg: "#F2ECD9", weight: "10 م", price: 189, mrp: 399, off: 52, rating: 4.5, reviews: "3.1 ألف", eta: "19 دقيقة" },
  { id: 20, name: "مجموعة شموع صويا معطّرة", e: "🕯️", bg: "#F2E9D6", weight: "3 قطع", price: 349, mrp: 699, off: 50, rating: 4.6, reviews: "900", eta: "19 دقيقة" },
  { id: 21, name: "نبتة بوثوس داخلية مع أصيص", e: "🪴", bg: "#E9F0E2", weight: "قطعة", price: 185, mrp: 399, off: 53, rating: 4.4, reviews: "21 ألف", eta: "13 دقيقة" },
  { id: 22, name: "علبة هدايا شوكولاتة متنوعة", e: "🍫", bg: "#F0E6DC", weight: "250 غ", price: 499, mrp: 799, off: 37, rating: 4.7, reviews: "5 آلاف", eta: "13 دقيقة" },
  { id: 23, name: "مشروب آيس توك ليموناضة زرقاء", e: "🧊", bg: "#E7F0FB", weight: "230 مل", price: 110, mrp: 130, off: 15, rating: 4.4, reviews: "2.3 ألف", eta: "21 دقيقة" },
  { id: 24, name: "آيس كريم كورنيتو بالشوكولاتة", e: "🍦", bg: "#F3E7DD", weight: "120 مل", price: 40, mrp: 45, off: 11, rating: 4.5, reviews: "2.3 ألف", eta: "13 دقيقة" },
  { id: 25, name: "لوح شوكولاتة بالحليب", e: "🍫", bg: "#F0E6DC", weight: "26 غ", price: 26, mrp: 30, off: 13, rating: 4.6, reviews: "1.1 ألف", eta: "8 دقائق" },
  { id: 26, name: "عصير مانجو طبيعي", e: "🧃", bg: "#FBEFE0", weight: "1 لتر", price: 85, mrp: 99, off: 14, rating: 4.4, reviews: "3.4 ألف", eta: "10 دقائق" },
  { id: 27, name: "مشروب ليمون غازي", e: "🍋", bg: "#EFF6E2", weight: "750 مل", price: 40, mrp: 45, off: 11, rating: 4.3, reviews: "1.1 ألف", eta: "8 دقائق" },
];
const byId = (id) => PRODUCTS.find((p) => p.id === id);

/* ------------------------- نظام الثيمات ------------------------- */
const THEMES = {
  all: {
    eta: "12", headTop: "#C99A24", headBot: "#8E6112", onHead: "#ffffff", sub: "#fbeccd",
    badge: "#ffffff", badgeBorder: "rgba(255,255,255,.5)", searchBg: "#fff",
    searchText: "#8a8a8a", searchIcon: "#5a5a5a", promo: true, welcome: true,
    hints: ["نباتات", "حقيبة هدايا", "تمارين", "بانير", "كولا"],
  },
  electronics: {
    eta: "13", headTop: "#4a4b50", headBot: "#6e6d6e", onHead: "#ffffff", sub: "#eaeaea",
    badge: "#fff", badgeBorder: "rgba(255,255,255,.55)", searchBg: "#fff",
    searchText: "#8a8a8a", searchIcon: "#5a5a5a",
    hints: ["أجهزة مطبخ", "سماعات", "سماعات أذن", "ساعة ذكية"],
    hero: { kind: "featured", title: "أفضل الصوتيات والإكسسوارات",
      chips: [{ t: "باور بانك وشواحن", e: "🔋" }, { t: "سماعات", e: "🔊" }, { t: "أضواء ومصابيح LED", e: "💡" }] },
    row1Title: "أفضل الصوتيات والإكسسوارات", row1: [9, 10, 11],
    row2Title: "أجهزة تناسب كل احتياجاتك", row2: [11, 9, 10], tiles: ELECTRONICS_TILES,
  },
  beauty: {
    eta: "21", surge: true, headTop: "#F5BFD1", headBot: "#F8D2E0", onHead: "#6a2a48", sub: "#8a4a66",
    badge: "#6a2a48", badgeBorder: "#e0a8be", searchBg: "#fff",
    searchText: "#a08590", searchIcon: "#8a6072",
    hints: ["سيروم للوجه", "أحمر شفاه", "شامبو", "واقي شمس"],
    hero: { kind: "glow", title: "أبرزي إشراقتك اليومية", sub: "أفضل منتجات الجمال المختارة لكِ",
      bg: "linear-gradient(135deg,#F7CBDC,#F1B0CA)", text: "#7E2E5C", subText: "#6a5a62" },
    zone: "linear-gradient(180deg,#F8D2E0 0%,#FBE6EE 55%,#ffffff 100%)",
    cardBg: "#FDF0F5", cardBorder: "#f2cede",
    row1Title: null, row1: [8, 7, 6],
    row2Title: "غذّي وأصلحي شعركِ", row2Sub: "ماسكات وسيرومات للشعر", row2: [6, 8, 7], tiles: BEAUTY,
  },
  decor: {
    eta: "19", headTop: "#E9D6B2", headBot: "#DCC08E", onHead: "#4a3b22", sub: "#6a5636",
    badge: "#7a6636", badgeBorder: "#cbb583", searchBg: "#fff",
    searchText: "#8a7a5a", searchIcon: "#6a5636",
    hints: ["مصباح ديكور", "نبتة", "مزهرية", "وسادة"],
    hero: { kind: "glow", title: "أعد تصميم مساحتك", sub: "قطع منزلية رائعة",
      bg: "linear-gradient(135deg,#EAD8B4,#D8B87E)", text: "#5a3a1a", subText: "#6a5636", script: true },
    zone: "linear-gradient(180deg,#EBDBBB 0%,#F4EAD6 55%,#ffffff 100%)",
    cardBg: "#FBF6EC", cardBorder: "#ece0c8",
    row1Title: null, row1: [18, 19, 20],
    row2Title: "أضف الخضرة لكل غرفة", row2: [21, 18, 19], tiles: DECOR_TILES,
  },
  kids: {
    eta: "13", headTop: "#CFE9F2", headBot: "#AEDCEC", onHead: "#1e3a4a", sub: "#3a5a6a",
    badge: "#3a6a7a", badgeBorder: "#9ccbe0", searchBg: "#fff",
    searchText: "#6a8a9a", searchIcon: "#3a5a6a",
    hints: ["معقّم زجاجات", "حفاضات", "ألعاب", "طعام أطفال"],
    hero: { kind: "glow", title: "ركن الصغار", sub: "لوقت لعب سعيد",
      bg: "linear-gradient(135deg,#CFEAF4,#A6D8EC)", text: "#164a5a", subText: "#3a5a6a" },
    zone: "linear-gradient(180deg,#D3ECF5 0%,#E8F5FA 55%,#ffffff 100%)",
    cardBg: "#F0F9FC", cardBorder: "#d6e9f2",
    row1Title: null, row1: [15, 16, 17],
    row2Title: "هدايا للصغار", row2: [17, 15, 16], tiles: KIDS_TILES,
  },
  gifting: {
    eta: "13", headTop: "#4a4b50", headBot: "#6e6d6e", onHead: "#ffffff", sub: "#eaeaea",
    badge: "#fff", badgeBorder: "rgba(255,255,255,.55)", searchBg: "#fff",
    searchText: "#8a8a8a", searchIcon: "#5a5a5a",
    hints: ["مجوهرات", "علبة هدايا", "ورود", "شوكولاتة"],
    hero: { kind: "occasions", title: "تسوّق حسب المناسبة", cardBg: "#2a2333" },
    row1Title: "هدايا مختارة سيحبونها", row1: [21, 22, 15],
    row2Title: "هدية الطبيعة المثالية", row2: [18, 21, 20], tiles: null,
  },
  imported: {
    eta: "21", surge: true, headTop: "#E7D6B4", headBot: "#DCC79E", onHead: "#4a3b22", sub: "#6a5636",
    badge: "#3a2f4a", badgeBorder: "#cbb583", searchBg: "#fff",
    searchText: "#8a7a5a", searchIcon: "#6a5636",
    hints: ["فيتامينات متعددة", "رقائق فاخرة", "معكرونة", "زيت زيتون"],
    hero: { kind: "store", title: "المتجر المستورد", sub: "اكتشف ماركات من حول العالم",
      bg: "radial-gradient(140% 120% at 50% -25%,#EFE4CC 0%,#E4D4AE 70%,#DCC99E 100%)", text: "#6B4A2A" },
    row1Title: "وصل حديثاً: المفضّلة عالمياً", row1: [23, 1, 2, 12],
    row2Title: "استمتع بعالم من النكهات", row2: [12, 22, 13], tiles: IMPORTED_TILES,
  },
};

/* ------------------------- الأنماط ------------------------- */
const CSS = `
.bk-wrap{position:fixed;inset:0;background:#2b2b2b;display:flex;align-items:center;justify-content:center;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Tahoma,Roboto,'Helvetica Neue',Arial,sans-serif;}
.bk-phone{position:relative;width:100%;max-width:430px;height:100%;max-height:932px;background:#fff;overflow:hidden;display:flex;flex-direction:column;box-shadow:0 0 60px rgba(0,0,0,.5);}
@media(min-width:480px){.bk-phone{border-radius:36px;}}
.bk-phone *{box-sizing:border-box;-webkit-tap-highlight-color:transparent;}
.hide-sb::-webkit-scrollbar{display:none;}.hide-sb{scrollbar-width:none;}

.bk-header{display:none;}
.bk-deliv-gold{padding-top:12px;}
.bk-sticky{position:sticky;top:0;z-index:15;padding-bottom:2px;will-change:background;}
.bk-deliv-wrap{overflow:hidden;}
.bk-deliv{display:flex;align-items:flex-start;justify-content:space-between;padding:2px 16px 6px;}
.bk-deliv .lbl{font-size:12px;font-weight:600;letter-spacing:.2px;}
.bk-deliv .min{font-size:22px;font-weight:800;display:flex;align-items:center;gap:9px;line-height:1.05;}
.bk-247{font-size:10px;font-weight:800;border:1.4px solid;border-radius:20px;padding:2px 7px;letter-spacing:.3px;}
.bk-surge{display:flex;align-items:center;gap:4px;font-size:11px;font-weight:700;background:#cbe7e2;color:#256b60;border-radius:20px;padding:3px 9px 3px 7px;}
.bk-loc{display:flex;align-items:center;gap:4px;font-size:13px;margin-top:3px;}
.bk-loc b{font-weight:800;}
.bk-headicons{display:flex;align-items:center;gap:9px;flex:0 0 auto;}
.bk-mapw{width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,#2f7d32,#1f5c22);display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,.15);font-size:18px;}
.bk-profile{width:40px;height:40px;border-radius:50%;background:rgba(255,255,255,.2);border:1.5px solid rgba(255,255,255,.28);display:flex;align-items:center;justify-content:center;flex:0 0 auto;}

.bk-search{margin:6px 14px 8px;border-radius:14px;height:48px;display:flex;align-items:center;padding:0 14px;gap:10px;box-shadow:0 2px 6px rgba(0,0,0,.06);}
.bk-search .ph{flex:1;font-size:15px;overflow:hidden;white-space:nowrap;}
.bk-search .ph b{font-weight:600;}
.bk-mic{width:1.5px;height:22px;background:#e2e2e2;margin-left:2px;}

.bk-tabs{display:flex;gap:2px;overflow-x:auto;padding:6px 12px 0;}
.bk-tab{flex:0 0 auto;min-width:64px;display:flex;flex-direction:column;align-items:center;gap:5px;padding:2px 8px 10px;position:relative;cursor:pointer;}
.bk-tab .tl{font-size:13px;font-weight:600;white-space:nowrap;}
.bk-tab.on .tl{font-weight:800;}
.bk-uline{position:absolute;bottom:0;left:16%;right:16%;height:3px;border-radius:3px;}
.bk-tab .iconwrap{position:relative;z-index:1;display:flex;}
.bk-tab.on .iconwrap:before{content:"";position:absolute;inset:-5px -9px;border-radius:50%;background:rgba(248,203,70,.4);z-index:0;}

.bk-promo{background:linear-gradient(90deg,${YELLOW},${YELLOW_DK});color:#5a3d00;font-size:12.5px;font-weight:800;text-align:center;letter-spacing:.3px;overflow:hidden;}

.bk-content{flex:1;overflow-y:auto;background:#fff;padding-bottom:150px;-webkit-overflow-scrolling:touch;overscroll-behavior-y:contain;}
.bk-herowrap{will-change:opacity,transform;}

/* بانر الترحيب (الكل) */
.bk-whero{position:relative;padding:18px 16px 26px;text-align:center;overflow:hidden;background:radial-gradient(130% 100% at 50% -10%,#D3A62B 0%,#A9780F 55%,#875B10 100%);}
.bk-whero:after{content:"";position:absolute;left:-4%;right:-4%;bottom:-3px;height:26px;background:#fff;border-radius:50%/100% 100% 0 0;}
.bk-whero .rays{position:absolute;inset:0;background:conic-gradient(from -20deg at 50% -5%,rgba(255,255,255,.16),transparent 10deg,rgba(255,255,255,.12) 20deg,transparent 30deg,rgba(255,255,255,.14) 40deg,transparent 50deg);opacity:.6;}
.wh-title{font-size:38px;font-weight:900;letter-spacing:1px;color:#F7E9CB;text-shadow:0 3px 0 #6f4b08,0 6px 12px rgba(0,0,0,.28);position:relative;z-index:2;}
.wh-sub{margin-top:8px;font-size:14.5px;font-weight:800;color:#fff;position:relative;z-index:2;text-shadow:0 1px 3px rgba(0,0,0,.2);}
.wh-hand{position:absolute;bottom:8px;font-size:52px;z-index:1;filter:drop-shadow(0 4px 6px rgba(0,0,0,.25));}
.wh-hand.l{left:2px;transform:scaleX(-1);}
.wh-hand.r{right:2px;}

/* بانر المتجر المستورد */
.bk-store{position:relative;padding:22px 16px 28px;text-align:center;overflow:hidden;}
.bk-store:after{content:"";position:absolute;left:-4%;right:-4%;bottom:-3px;height:22px;background:#fff;border-radius:50%/100% 100% 0 0;}
.bk-store .rays{position:absolute;inset:0;background:radial-gradient(60% 90% at 50% 0%,rgba(255,255,255,.35),transparent 70%);opacity:.7;}
.bk-store h3{margin:0;font-size:28px;font-weight:900;letter-spacing:.5px;position:relative;z-index:2;text-shadow:0 1px 0 rgba(255,255,255,.4),0 2px 3px rgba(0,0,0,.12);}
.bk-store p{margin:7px 0 0;font-size:13px;font-weight:700;position:relative;z-index:2;opacity:.9;}
.bk-store .spk{position:absolute;top:50%;transform:translateY(-50%);font-size:18px;z-index:2;opacity:.75;}
.bk-store .spk.l{left:22px;}.bk-store .spk.r{right:22px;}

/* بانر الإشراق (جمال / ديكور / أطفال) */
.bk-glow{position:relative;padding:18px 16px 12px;overflow:hidden;}
.bk-glow h3{margin:0;font-size:26px;font-weight:800;line-height:1.15;max-width:72%;}
.bk-glow.script h3{font-size:28px;}
.bk-glow p{margin:8px 0 0;font-size:13.5px;font-weight:600;max-width:72%;}
.bk-glow .spk{position:absolute;left:14px;top:22px;font-size:20px;opacity:.5;letter-spacing:3px;}

.bk-sec{padding:16px 14px 4px;}
.bk-sec-h{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:12px;}
.bk-sec-t{font-size:20px;font-weight:800;color:${INK};}
.bk-sec-sub{font-size:13px;color:#7a7a7a;font-weight:500;margin-top:2px;}
.bk-sec-link{display:flex;align-items:center;gap:2px;color:${GREEN};font-size:13px;font-weight:700;cursor:pointer;flex:0 0 auto;padding-top:3px;}
.bk-hs{display:flex;gap:12px;overflow-x:auto;padding:2px 14px 10px;}

.bk-bs-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;padding:4px 14px 10px;}
.bk-bs{background:#f6f7f8;border-radius:16px;padding:8px 8px 10px;cursor:pointer;}
.bk-bs-g{display:grid;grid-template-columns:1fr 1fr;gap:5px;position:relative;}
.bk-bs-th{aspect-ratio:1;background:#fff;border-radius:9px;display:flex;align-items:center;justify-content:center;font-size:26px;box-shadow:0 1px 2px rgba(0,0,0,.05);}
.bk-bs-more{position:absolute;left:50%;bottom:-7px;transform:translateX(-50%);background:#fff;font-size:10px;font-weight:700;color:#3a3a3a;padding:2px 8px;border-radius:20px;box-shadow:0 1px 4px rgba(0,0,0,.16);white-space:nowrap;}
.bk-bs-t{font-size:12.5px;font-weight:700;color:${INK};margin-top:14px;text-align:center;line-height:1.25;}

.bk-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px 8px;padding:2px 14px 6px;}
.bk-tile{cursor:pointer;}
.bk-tile-img{aspect-ratio:1;border-radius:16px;display:flex;align-items:center;justify-content:center;font-size:38px;}
.bk-tile-t{font-size:12px;color:#2a2a2a;text-align:center;margin-top:7px;line-height:1.2;font-weight:500;}

.bk-pc{flex:0 0 auto;width:158px;background:#fff;border:1px solid #f0f0f0;border-radius:14px;padding:8px;display:flex;flex-direction:column;}
.bk-pc.grid{width:auto;}
.bk-pc-imgwrap{position:relative;border-radius:10px;height:120px;display:flex;align-items:center;justify-content:center;overflow:hidden;}
.bk-pc-img{font-size:54px;}
.bk-off{position:absolute;top:0;right:7px;background:${BLUE};color:#fff;font-size:9.5px;font-weight:800;padding:8px 5px 4px;line-height:1;text-align:center;width:34px;clip-path:polygon(0 0,100% 0,100% 78%,50% 100%,0 78%);}
.bk-veg{position:absolute;top:6px;left:6px;width:15px;height:15px;border:1.5px solid #0a8a3a;border-radius:3px;display:flex;align-items:center;justify-content:center;background:#fff;}
.bk-veg i{width:7px;height:7px;border-radius:50%;background:#0a8a3a;display:block;}
.bk-eta{position:absolute;right:6px;bottom:6px;background:rgba(255,255,255,.95);border-radius:6px;font-size:10px;font-weight:600;color:#5a5a5a;display:flex;align-items:center;gap:3px;padding:2px 6px;box-shadow:0 1px 2px rgba(0,0,0,.08);}
.bk-pc-body{padding-top:8px;display:flex;flex-direction:column;flex:1;}
.bk-w{font-size:12px;color:#7a7a7a;font-weight:500;}
.bk-pn{font-size:13px;color:${INK};font-weight:600;line-height:1.3;margin:3px 0 5px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;min-height:35px;}
.bk-rt{display:flex;align-items:center;gap:4px;margin-bottom:6px;}
.bk-rt .b{display:flex;align-items:center;gap:2px;background:#f3f3f3;border-radius:5px;padding:1px 5px;font-size:11px;font-weight:700;color:#2a2a2a;direction:ltr;}
.bk-rt .c{font-size:11px;color:#9a9a9a;}
.bk-foot{display:flex;align-items:flex-end;justify-content:space-between;margin-top:auto;gap:6px;}
.bk-price{font-size:14px;font-weight:800;color:${INK};line-height:1.1;direction:ltr;text-align:right;}
.bk-mrp{font-size:11.5px;color:#9a9a9a;text-decoration:line-through;margin-right:4px;font-weight:500;}
.bk-offt{font-size:10.5px;font-weight:700;color:${BLUE};margin-top:1px;}
.bk-add{flex:0 0 auto;min-width:64px;height:34px;border:1.4px solid #c6e8cd;background:${GREEN_SOFT};color:${GREEN};font-weight:800;font-size:14px;border-radius:9px;display:flex;align-items:center;justify-content:center;cursor:pointer;letter-spacing:.4px;transition:transform .08s;}
.bk-add:active{transform:scale(.94);}
.bk-step{flex:0 0 auto;min-width:64px;height:34px;background:${GREEN};border-radius:9px;display:flex;align-items:center;justify-content:space-between;color:#fff;overflow:hidden;animation:bkPop .18s ease;}
.bk-step button{width:26px;height:34px;background:transparent;border:0;color:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;}
.bk-step .q{font-size:14px;font-weight:800;min-width:18px;text-align:center;}

.bk-hero-feat{padding:12px 14px 2px;}
.bk-hero-chips{display:flex;gap:10px;overflow-x:auto;padding-bottom:4px;}
.bk-fcard{flex:0 0 auto;width:118px;border-radius:14px;padding:10px;position:relative;color:#fff;background:linear-gradient(135deg,#2b2b2b,#454545);}
.bk-fcard .ft{position:absolute;top:0;right:10px;background:${GREEN};font-size:8.5px;font-weight:800;color:#fff;padding:2px 6px;border-radius:0 0 5px 5px;}
.bk-fcard .fe{font-size:40px;text-align:center;margin:14px 0 8px;}
.bk-fcard .fl{font-size:12px;font-weight:700;line-height:1.2;}

.bk-occ{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;padding:12px 14px 2px;}
.bk-occ-c{border-radius:14px;aspect-ratio:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;color:#fff;}
.bk-occ-c .oe{font-size:30px;}
.bk-occ-c .ol{font-size:11px;font-weight:700;text-align:center;padding:0 4px;}

.bk-ad{margin:14px;border-radius:18px;overflow:hidden;background:linear-gradient(120deg,#f3e9c9 0%,#efe2b6 45%,#1f2d6b 46%,#16204f 100%);height:170px;position:relative;padding:22px;display:flex;flex-direction:column;justify-content:center;}
.bk-ad h4{font-size:24px;font-weight:800;color:#2a2a2a;line-height:1.15;margin:0;max-width:62%;}
.bk-ad p{font-size:14px;color:#4a4a4a;margin:8px 0 0;max-width:60%;}
.bk-ad .shop{margin-top:16px;align-self:flex-start;background:#111;color:#fff;font-size:13px;font-weight:700;border-radius:8px;padding:9px 16px;}
.bk-ad .em{position:absolute;left:18px;top:50%;transform:translateY(-50%);font-size:64px;filter:drop-shadow(0 6px 10px rgba(0,0,0,.25));}
.bk-ad .tag{position:absolute;left:8px;bottom:8px;background:rgba(0,0,0,.3);color:#fff;font-size:9px;padding:1px 6px;border-radius:5px;}

.bk-nav{position:absolute;left:0;right:0;bottom:0;height:62px;background:#fff;border-top:1px solid #eee;display:flex;z-index:30;}
.bk-nav-i{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;cursor:pointer;position:relative;}
.bk-nav-i .ic{color:#8a8a8a;}.bk-nav-i .l{font-size:11px;color:#8a8a8a;font-weight:600;}
.bk-nav-i.on .ic{color:${INK};}.bk-nav-i.on .l{color:${INK};font-weight:700;}
.bk-nav-i.on:before{content:"";position:absolute;top:0;left:30%;right:30%;height:3px;background:${INK};border-radius:3px;}

.bk-cart{position:absolute;left:8px;right:8px;bottom:70px;height:54px;background:${GREEN};border-radius:14px;display:flex;align-items:center;justify-content:space-between;padding:0 14px 0 8px;z-index:29;box-shadow:0 8px 20px rgba(12,131,31,.35);animation:bkUp .28s cubic-bezier(.2,.8,.2,1);}
.bk-cart .l{display:flex;align-items:center;gap:10px;color:#fff;}
.bk-cart .icn{width:34px;height:34px;border-radius:9px;background:rgba(255,255,255,.18);display:flex;align-items:center;justify-content:center;position:relative;}
.bk-cart .icn .badge{position:absolute;top:-5px;left:-5px;background:#fff;color:${GREEN};font-size:10px;font-weight:800;border-radius:20px;min-width:17px;height:17px;display:flex;align-items:center;justify-content:center;padding:0 4px;}
.bk-cart .txt b{font-size:14px;font-weight:800;display:block;line-height:1.2;direction:ltr;text-align:right;}
.bk-cart .txt span{font-size:11px;opacity:.85;}
.bk-cart .view{display:flex;align-items:center;gap:6px;color:#fff;font-size:15px;font-weight:800;height:54px;padding:0 8px;cursor:pointer;}

.bk-listhead{background:${YELLOW};flex:0 0 auto;padding-bottom:10px;}
.bk-listhead .top{display:flex;align-items:center;gap:12px;padding:16px 14px 6px;}
.bk-back{width:36px;height:36px;display:flex;align-items:center;justify-content:center;cursor:pointer;}
.bk-listhead .ti{font-size:18px;font-weight:800;color:${INK};}
.bk-listhead .sub{font-size:11px;color:#5a4a00;font-weight:600;}
.bk-listsearch{margin:4px 14px 0;background:#fff;border-radius:12px;height:44px;display:flex;align-items:center;padding:0 14px;gap:10px;color:#8a8a8a;font-size:14px;}
.bk-listgrid{display:grid;grid-template-columns:1fr 1fr;gap:12px;padding:14px;}

.bk-splash{position:absolute;inset:0;z-index:50;display:flex;flex-direction:column;align-items:center;justify-content:center;background:radial-gradient(circle at 50% 38%,#FBD64B 0%,#F4BE1E 45%,#E5A700 100%);}
.bk-splash.out{animation:bkSplashOut .55s ease forwards;}
.bk-logo{font-size:44px;font-weight:900;color:#1c1c1c;display:flex;align-items:center;animation:bkRise .6s cubic-bezier(.2,.8,.2,1) both;}
.bk-logo .b{background:#1c1c1c;color:${YELLOW};width:54px;height:54px;border-radius:16px;display:flex;align-items:center;justify-content:center;font-size:34px;margin-left:10px;box-shadow:0 8px 22px rgba(0,0,0,.2);}
.bk-tagline{margin-top:18px;color:#4a3600;font-size:14px;font-weight:800;letter-spacing:.4px;animation:bkRise .6s .12s cubic-bezier(.2,.8,.2,1) both;}
.bk-welcome{margin-top:6px;color:#6a5200;font-size:12px;font-weight:600;animation:bkRise .6s .2s cubic-bezier(.2,.8,.2,1) both;}
.bk-load{margin-top:34px;width:140px;height:4px;border-radius:4px;background:rgba(0,0,0,.12);overflow:hidden;}
.bk-load i{display:block;height:100%;width:40%;background:#1c1c1c;border-radius:4px;animation:bkLoad 1.6s ease-in-out infinite;}

@keyframes bkUp{from{transform:translateY(80px);opacity:0;}to{transform:none;opacity:1;}}
@keyframes bkPop{from{transform:scale(.85);}to{transform:scale(1);}}
@keyframes bkSplashOut{to{opacity:0;transform:scale(1.06);visibility:hidden;}}
@keyframes bkRise{from{opacity:0;transform:translateY(16px);}to{opacity:1;transform:none;}}
@keyframes bkLoad{0%{transform:translateX(120%);}100%{transform:translateX(-320%);}}
@media(prefers-reduced-motion:reduce){.bk-splash *{animation-duration:.01ms!important;}}
`;

/* ------------------------- مكوّنات صغيرة ------------------------- */
function ProductCard({ p, qty, onAdd, onInc, onDec, grid, cardBg, cardBorder }) {
  const style = {};
  if (cardBg) style.background = cardBg;
  if (cardBorder) style.borderColor = cardBorder;
  const price = toIQD(p.price);
  const mrp = toIQD(p.mrp);
  const off = mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;
  return (
    <div className={"bk-pc" + (grid ? " grid" : "")} style={style}>
      <div className="bk-pc-imgwrap" style={{ background: p.bg }}>
        {off > 0 && <div className="bk-off">{off}%<br />خصم</div>}
        <div className="bk-veg"><i /></div>
        <div className="bk-pc-img">{p.e}</div>
        <div className="bk-eta"><Clock size={10} strokeWidth={2.5} />{p.eta}</div>
      </div>
      <div className="bk-pc-body">
        <div className="bk-w">{p.weight}</div>
        <div className="bk-pn">{p.name}</div>
        <div className="bk-rt">
          <span className="b"><Star size={10} fill="#f0a500" stroke="#f0a500" />{p.rating}</span>
          <span className="c">({p.reviews})</span>
        </div>
        <div className="bk-foot">
          <div>
            <div className="bk-price">{fmt(price)} {CUR}{mrp > price && <span className="bk-mrp">{fmt(mrp)}</span>}</div>
            {off > 0 && <div className="bk-offt">خصم {off}%</div>}
          </div>
          {qty > 0 ? (
            <div className="bk-step">
              <button onClick={() => onDec(p.id)} aria-label="إنقاص"><Minus size={15} strokeWidth={3} /></button>
              <span className="q">{qty}</span>
              <button onClick={() => onInc(p.id)} aria-label="زيادة"><Plus size={15} strokeWidth={3} /></button>
            </div>
          ) : (
            <button className="bk-add" onClick={() => onAdd(p.id)}>أضف</button>
          )}
        </div>
      </div>
    </div>
  );
}

function ProductRow({ title, sub, ids, cart, add, inc, dec, onSeeAll, cardBg, cardBorder }) {
  return (
    <>
      {title && (
        <div className="bk-sec">
          <div className="bk-sec-h">
            <div>
              <div className="bk-sec-t">{title}</div>
              {sub && <div className="bk-sec-sub">{sub}</div>}
            </div>
            <div className="bk-sec-link" onClick={onSeeAll}>عرض الكل <ChevronLeft size={15} strokeWidth={2.6} /></div>
          </div>
        </div>
      )}
      <div className="bk-hs hide-sb">
        {ids.map((id) => (
          <ProductCard key={id} p={byId(id)} qty={cart[id] || 0} onAdd={add} onInc={inc} onDec={dec} cardBg={cardBg} cardBorder={cardBorder} />
        ))}
      </div>
    </>
  );
}

function TileGrid({ items, onOpen }) {
  return (
    <div className="bk-grid">
      {items.map((c, i) => (
        <div className="bk-tile" key={i} onClick={() => onOpen && onOpen(c.t)}>
          <div className="bk-tile-img" style={{ background: c.bg }}>{c.e}</div>
          <div className="bk-tile-t">{c.t}</div>
        </div>
      ))}
    </div>
  );
}

/* بانر القسم (يختلف حسب النوع) */
function Hero({ hero }) {
  if (!hero) return null;
  if (hero.kind === "store") {
    return (
      <div className="bk-store" style={{ background: hero.bg, color: hero.text }}>
        <div className="rays" />
        <span className="spk l">✦</span>
        <h3>{hero.title}</h3>
        <p>{hero.sub}</p>
        <span className="spk r">✦</span>
      </div>
    );
  }
  if (hero.kind === "glow") {
    return (
      <div className={"bk-glow" + (hero.script ? " script" : "")} style={{ background: hero.bg }}>
        <div className="spk" style={{ color: hero.text }}>✦ ✧ ✦</div>
        <h3 style={{ color: hero.text }}>{hero.title}</h3>
        <p style={{ color: hero.subText }}>{hero.sub}</p>
      </div>
    );
  }
  if (hero.kind === "featured") {
    return (
      <div className="bk-hero-feat">
        <div className="bk-hero-chips hide-sb">
          {hero.chips.map((c, i) => (
            <div className="bk-fcard" key={i}>
              <div className="ft">مميّز</div>
              <div className="fe">{c.e}</div>
              <div className="fl">{c.t}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (hero.kind === "occasions") {
    return (
      <div className="bk-occ">
        {OCCASIONS.map((o, i) => (
          <div className="bk-occ-c" key={i} style={{ background: hero.cardBg }}>
            <div className="oe">{o.e}</div>
            <div className="ol">{o.t}</div>
          </div>
        ))}
      </div>
    );
  }
  return null;
}

/* بانر الترحيب (الكل) — يتلاشى عند التمرير */
function WelcomeHero() {
  return (
    <div className="bk-whero">
      <div className="rays" />
      <div className="wh-hand l">🛍️</div>
      <div className="wh-title">أهلاً بك</div>
      <div className="wh-sub">اطلب الآن واحصل على توصيل مجاني</div>
      <div className="wh-hand r">🛍️</div>
    </div>
  );
}

/* ------------------------- الرئيسية (الكل) ------------------------- */
function HomeContent({ cart, add, inc, dec, openList }) {
  return (
    <>
      <div className="bk-sec"><div className="bk-sec-h"><div className="bk-sec-t">الأكثر مبيعاً</div></div></div>
      <div className="bk-bs-grid">
        {BESTSELLERS.map((b, i) => (
          <div className="bk-bs" key={i} onClick={() => openList(b.title)}>
            <div className="bk-bs-g">
              {b.items.map((e, j) => <div className="bk-bs-th" key={j}>{e}</div>)}
              <div className="bk-bs-more">+{b.more} المزيد</div>
            </div>
            <div className="bk-bs-t">{b.title}</div>
          </div>
        ))}
      </div>

      <div className="bk-sec"><div className="bk-sec-h"><div className="bk-sec-t">البقالة والمطبخ</div></div></div>
      <TileGrid items={GROCERY} onOpen={openList} />

      <div className="bk-sec"><div className="bk-sec-h"><div className="bk-sec-t">وجبات خفيفة ومشروبات</div></div></div>
      <TileGrid items={SNACKS} onOpen={openList} />

      <div className="bk-sec"><div className="bk-sec-h"><div className="bk-sec-t">الجمال والعناية الشخصية</div></div></div>
      <TileGrid items={BEAUTY} onOpen={openList} />

      <div className="bk-sec"><div className="bk-sec-h"><div className="bk-sec-t">مستلزمات المنزل</div></div></div>
      <TileGrid items={HOUSEHOLD} onOpen={openList} />

      <div className="bk-sec"><div className="bk-sec-h"><div className="bk-sec-t">متاجر مميّزة</div></div></div>
      <TileGrid items={STORES_SPOTLIGHT} onOpen={openList} />

      <div className="bk-sec"><div className="bk-sec-h"><div className="bk-sec-t">مختارات لأسلوب حياتك</div></div></div>
      <TileGrid items={PICKS_LIFESTYLE} onOpen={openList} />

      <div className="bk-ad">
        <h4>احتفال البرياني هنا</h4>
        <p>أحضر أجود أنواع الأرز</p>
        <div className="shop">تسوّق الآن</div>
        <div className="em">🍚</div>
        <div className="tag">إعلان</div>
      </div>

      <ProductRow title="لِعشّاق الحلويات" ids={[12, 25, 24, 22]} cart={cart} add={add} inc={inc} dec={dec} onSeeAll={() => openList("حلويات وشوكولاتة")} />

      <ProductRow title="مشروبات باردة وعصائر" ids={[3, 26, 23, 27]} cart={cart} add={add} inc={inc} dec={dec} onSeeAll={() => openList("مشروبات وعصائر")} />

      <ProductRow title="الأساسيات اليومية، توصيل سريع" ids={[4, 5, 14, 2]} cart={cart} add={add} inc={inc} dec={dec} onSeeAll={() => openList("البقالة")} />
    </>
  );
}

/* ------------------------- الصفحة المُثيّمة (بقية الأقسام) ------------------------- */
function ThemedContent({ theme, cart, add, inc, dec, openList }) {
  const featured = theme.hero && theme.hero.kind === "featured";

  const topBlock = (
    <>
      {featured && <div style={{ padding: "12px 14px 0" }}><div className="bk-sec-t">{theme.hero.title}</div></div>}
      <ProductRow
        title={theme.row1Title} ids={theme.row1}
        cart={cart} add={add} inc={inc} dec={dec}
        onSeeAll={() => openList("منتجات")}
        cardBg={theme.cardBg} cardBorder={theme.cardBorder}
      />
    </>
  );

  return (
    <>
      {theme.zone ? <div style={{ background: theme.zone }}>{topBlock}</div> : topBlock}
      {theme.tiles && (<><div className="bk-sec"><div className="bk-sec-h"><div className="bk-sec-t">تسوّق حسب الفئة</div></div></div><TileGrid items={theme.tiles} onOpen={openList} /></>)}
      <ProductRow title={theme.row2Title} sub={theme.row2Sub} ids={theme.row2} cart={cart} add={add} inc={inc} dec={dec} onSeeAll={() => openList("منتجات")} />
    </>
  );
}

/* ------------------------- شاشة القائمة ------------------------- */
function Listing({ title, cart, add, inc, dec, onBack }) {
  return (
    <>
      <div className="bk-listhead">
        <div className="top">
          <div className="bk-back" onClick={onBack}><ChevronRight size={24} strokeWidth={2.5} /></div>
          <div style={{ flex: 1 }}>
            <div className="ti">{title}</div>
            <div className="sub">التوصيل خلال 8 دقائق · 142 منتج</div>
          </div>
          <div className="bk-profile" style={{ background: "rgba(0,0,0,.06)", borderColor: "rgba(0,0,0,.08)" }}><User size={20} strokeWidth={2} color="#3a3a3a" /></div>
        </div>
        <div className="bk-listsearch"><Search size={18} strokeWidth={2.4} color="#7a7a7a" /> ابحث في {title}</div>
      </div>
      <div className="bk-content">
        <div className="bk-listgrid">
          {PRODUCTS.map((p) => <ProductCard key={p.id} p={p} grid qty={cart[p.id] || 0} onAdd={add} onInc={inc} onDec={dec} />)}
        </div>
        <div style={{ height: 40 }} />
      </div>
    </>
  );
}

/* ------------------------- التطبيق ------------------------- */
export default function BlinkitHome() {
  const [ready, setReady] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [nav, setNav] = useState("home");
  const [catTab, setCatTab] = useState("all");
  const [cart, setCart] = useState({});
  const [hint, setHint] = useState(0);
  const [listing, setListing] = useState(null);
  const [scrollY, setScrollY] = useState(0);
  const tabRefs = useRef({});
  const scrollRef = useRef(null);
  const rafPending = useRef(false);
  const lastY = useRef(0);

  const theme = THEMES[catTab];
  const COLLAPSE = 120;
  const FADE = 210;

  useEffect(() => {
    const t1 = setTimeout(() => setExiting(true), 1700);
    const t2 = setTimeout(() => setReady(true), 2250);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  useEffect(() => { setHint(0); }, [catTab]);
  useEffect(() => {
    const iv = setInterval(() => setHint((h) => (h + 1) % theme.hints.length), 2200);
    return () => clearInterval(iv);
  }, [theme]);

  const add = useCallback((id) => setCart((c) => ({ ...c, [id]: 1 })), []);
  const inc = useCallback((id) => setCart((c) => ({ ...c, [id]: (c[id] || 0) + 1 })), []);
  const dec = useCallback((id) => setCart((c) => {
    const n = (c[id] || 0) - 1; const nc = { ...c };
    if (n <= 0) delete nc[id]; else nc[id] = n; return nc;
  }), []);
  const openList = useCallback((t) => setListing(t), []);

  const count = Object.values(cart).reduce((a, b) => a + b, 0);
  const total = Object.entries(cart).reduce((a, [id, q]) => a + toIQD(byId(+id)?.price || 0) * q, 0);
  const savings = Object.entries(cart).reduce((a, [id, q]) => {
    const p = byId(+id); return a + (p ? (toIQD(p.mrp) - toIQD(p.price)) * q : 0);
  }, 0);

  const skip = () => { setExiting(true); setTimeout(() => setReady(true), 400); };
  const pickTab = (id, el) => {
    setCatTab(id); setListing(null); setScrollY(0);
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
    if (el) el.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  };
  // throttle scroll updates to one per animation frame (keeps scrolling smooth)
  const onScroll = (e) => {
    lastY.current = e.currentTarget.scrollTop;
    if (!rafPending.current) {
      rafPending.current = true;
      requestAnimationFrame(() => { rafPending.current = false; setScrollY(lastY.current); });
    }
  };

  const t = clamp01((scrollY - 60) / 90);
  const heroFade = clamp01(1 - scrollY / FADE);
  const delivBg = `linear-gradient(180deg, ${theme.headTop}, ${theme.headBot})`;
  const stickyBg = rgb(mix(hexToRgb(theme.headBot), CREAM_RGB, t)); // ذهبي في الأعلى ← كريمي عند النزول
  const onHeadRgb = hexToRgb(theme.onHead);
  const tabRgb = mix(onHeadRgb, INK_RGB, t);
  const tabCol = rgb(tabRgb);
  const tabColDim = rgba(tabRgb, 0.72);

  // Heavy content is memoized so scrolling never re-renders the product/tile lists.
  const sections = useMemo(
    () => (catTab === "all"
      ? <HomeContent cart={cart} add={add} inc={inc} dec={dec} openList={openList} />
      : <ThemedContent theme={theme} cart={cart} add={add} inc={inc} dec={dec} openList={openList} />),
    [catTab, cart, theme, add, inc, dec, openList]
  );

  return (
    <div className="bk-wrap">
      <style>{CSS}</style>
      <div className="bk-phone" dir="rtl" lang="ar">

        {!ready && (
          <div className={"bk-splash" + (exiting ? " out" : "")} onClick={skip}>
            <div className="bk-logo"><span className="b">ب</span>بلينكيت</div>
            <div className="bk-tagline">تطبيق الدقائق الأخيرة</div>
            <div className="bk-welcome">اطلب الآن واستمتع بتوصيل مجاني</div>
            <div className="bk-load"><i /></div>
          </div>
        )}

        {listing ? (
          <Listing title={listing} cart={cart} add={add} inc={inc} dec={dec} onBack={() => setListing(null)} />
        ) : (
          <div className="bk-content" ref={scrollRef} onScroll={onScroll} key={catTab}>

            {/* معلومات التوصيل — تنزل طبيعيًا مع التمرير (بلا تغيير تخطيط) */}
            <div className="bk-deliv-gold" style={{ background: delivBg }}>
              <div className="bk-deliv">
                <div>
                  <div className="lbl" style={{ color: rgba(onHeadRgb, 0.9) }}>التوصيل خلال</div>
                  <div className="min" style={{ color: rgb(onHeadRgb) }}>
                    {theme.eta} دقيقة
                    {theme.surge
                      ? <span className="bk-surge"><TrendingUp size={12} strokeWidth={2.6} />أسعار الذروة</span>
                      : <span className="bk-247" style={{ color: theme.badge, borderColor: theme.badgeBorder }}>على مدار الساعة</span>}
                  </div>
                  <div className="bk-loc" style={{ color: theme.sub }}>
                    <b style={{ color: rgb(onHeadRgb) }}>المنزل</b> - علي، 22، منطقة راجباث <ChevronDown size={16} strokeWidth={2.6} />
                  </div>
                </div>
                <div className="bk-headicons">
                  <div className="bk-mapw">💳</div>
                  <div className="bk-profile"><User size={22} strokeWidth={2} color={rgb(onHeadRgb)} /></div>
                </div>
              </div>
            </div>

            {/* البحث + التبويبات — لاصق في الأعلى، تتغيّر ألوانه فقط (بلا إعادة تخطيط) */}
            <div className="bk-sticky" style={{ background: stickyBg, boxShadow: `0 4px 12px rgba(0,0,0,${0.05 * t})` }}>
              <div className="bk-search" style={{ background: theme.searchBg }}>
                <Search size={20} strokeWidth={2.4} color={theme.searchIcon} />
                <div className="ph" style={{ color: theme.searchText }}>
                  {catTab === "all"
                    ? <>ابحث عن طحين، عدس، كولا و<b style={{ color: theme.searchText }}>{theme.hints[hint]}</b></>
                    : <>ابحث عن {theme.hints[hint]}</>}
                </div>
                <div className="bk-mic" />
                <Mic size={20} strokeWidth={2} color={theme.searchIcon} />
              </div>

              <div className="bk-tabs hide-sb">
                {TABS.map((tb) => {
                  const on = catTab === tb.id;
                  return (
                    <div key={tb.id} ref={(el) => (tabRefs.current[tb.id] = el)}
                      className={"bk-tab" + (on ? " on" : "")}
                      onClick={(e) => pickTab(tb.id, e.currentTarget)}>
                      <span className="iconwrap"><tb.Icon size={24} strokeWidth={1.9} color={on ? tabCol : tabColDim} /></span>
                      <span className="tl" style={{ color: on ? tabCol : tabColDim }}>{tb.label}</span>
                      {on && <span className="bk-uline" style={{ background: tabCol }} />}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* البانر يتلاشى عند التمرير */}
            <div className="bk-herowrap" style={{ opacity: heroFade, transform: `translateY(${-(1 - heroFade) * (catTab === "all" ? 10 : 12)}px)` }}>
              {catTab === "all" ? <WelcomeHero /> : <Hero hero={theme.hero} />}
            </div>
            {sections}
            <div style={{ textAlign: "center", color: "#c8c8c8", fontSize: 13, padding: "20px 0 8px", fontWeight: 800, letterSpacing: 1 }}>بلينكيت</div>
          </div>
        )}

        {/* شريط السلة */}
        {count > 0 && (
          <div className="bk-cart">
            <div className="l">
              <div className="icn"><ShoppingBag size={18} color="#fff" /><span className="badge">{count}</span></div>
              <div className="txt">
                <b>{fmt(total)} {CUR}</b>
                <span>{savings > 0 ? `وفّرت ${fmt(savings)} ${CUR}` : `${count} منتج`}</span>
              </div>
            </div>
            <div className="view">عرض السلة <ChevronLeft size={20} strokeWidth={2.6} /></div>
          </div>
        )}

        {/* الشريط السفلي */}
        <div className="bk-nav">
          {[
            { id: "home", l: "الرئيسية", Icon: Home },
            { id: "again", l: "اطلب مجدداً", Icon: RotateCcw },
            { id: "cats", l: "الفئات", Icon: LayoutGrid },
            { id: "print", l: "طباعة", Icon: Printer },
          ].map((n) => (
            <div key={n.id} className={"bk-nav-i" + (nav === n.id ? " on" : "")} onClick={() => { setNav(n.id); setListing(null); }}>
              <n.Icon className="ic" size={22} strokeWidth={2} />
              <span className="l">{n.l}</span>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
