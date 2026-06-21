// ──────────────────────────────────────────────────────────────
//  Otlobha catalog
//  Grounded in the uploaded Iraqi product sheet.
//  Each item has an `emoji` placeholder + an `image` path.
//  Drop your transparent PNGs in /public/images and the cards
//  will render them instead of the emoji (see ProductCard.jsx).
// ──────────────────────────────────────────────────────────────

export const fmt = (n) => n.toLocaleString('en-US');

export const PRODUCTS = [
  { id: 'pom',   name: 'رمان عراقي',          tag: 'فواكه',  price: 3500, unit: 'كيلو',   emoji: '🥭', image: '/images/pomegranate.webp', tint: '#7d1a26' },
  { id: 'fig',   name: 'تين عراقي طازج',       tag: 'فواكه',  price: 5000, unit: 'علبة',   emoji: '🟣', image: '/images/figs.webp',        tint: '#5b3a73' },
  { id: 'grape', name: 'عنب عراقي',            tag: 'فواكه',  price: 2500, unit: 'كيلو',   emoji: '🍇', image: '/images/grapes.webp',      tint: '#4a2d6b' },
  { id: 'date',  name: 'تمور عراقية فاخرة',     tag: 'فواكه',  price: 6000, unit: 'علبة',   emoji: '🟤', image: '/images/dates.webp',       tint: '#6b4423', badge: 'فاخر' },
  { id: 'egg',   name: 'باذنجان عراقي – برش',   tag: 'خضار',   price: 1500, unit: 'كيلو',   emoji: '🍆', image: '/images/eggplant.webp',    tint: '#46275c' },
  { id: 'pepr',  name: 'فلفل أحمر حلو',         tag: 'خضار',   price: 2000, unit: 'كيلو',   emoji: '🫑', image: '/images/red-pepper.webp',  tint: '#9d2222' },
  { id: 'toma',  name: 'طماطم عراقية',          tag: 'خضار',   price: 1250, unit: 'كيلو',   emoji: '🍅', image: '/images/tomato.webp',      tint: '#b62f24' },
  { id: 'cuke',  name: 'خيار عراقي',            tag: 'خضار',   price: 1500, unit: 'كيلو',   emoji: '🥒', image: '/images/cucumber.webp',    tint: '#2f7d3a' },
  { id: 'okra',  name: 'بامية عراقية',          tag: 'خضار',   price: 3000, unit: 'كيلو',   emoji: '🫛', image: '/images/okra.webp',        tint: '#3f7d2c' },
  { id: 'rice',  name: 'أرز عنبر الرشيد',       tag: 'مؤونة',  price: 8500, unit: '٥ كيلو', emoji: '🍚', image: '/images/anbar-rice.webp',  tint: '#9c7b2e', badge: 'الأكثر طلباً' },
  { id: 'molas', name: 'دبس رمان الدرة الأصلي', tag: 'مؤونة',  price: 4500, unit: 'قنينة',  emoji: '🫙', image: '/images/molasses.webp',    tint: '#5a1b22' },
  { id: 'pick',  name: 'طرشي الدرة مشكّل',      tag: 'مؤونة',  price: 3500, unit: 'مرطبان', emoji: '🥫', image: '/images/pickles.webp',     tint: '#9a6a1f' },
  { id: 'klei',  name: 'كليجة عراقية',          tag: 'حلويات', price: 5500, unit: 'علبة',   emoji: '🍪', image: '/images/kleicha.webp',     tint: '#8a5a26' },
  { id: 'paste', name: 'معجون طماطم Goody',     tag: 'مؤونة',  price: 1750, unit: 'علبة',   emoji: '🥫', image: '/images/tomato-paste.webp',tint: '#b03124' },
  { id: 'chick', name: 'حمص شتورة مسلوق',       tag: 'مؤونة',  price: 1500, unit: 'علبة',   emoji: '🥫', image: '/images/chickpeas.webp',   tint: '#b89034' },
  { id: 'herb',  name: 'بقدونس وكزبرة',         tag: 'خضار',   price: 750,  unit: 'باقة',   emoji: '🌿', image: '/images/herbs.webp',       tint: '#2f7d3a' },
];

export const CATEGORIES = ['الكل', 'خضار', 'فواكه', 'مؤونة', 'حلويات'];

export const BUNDLES = [
  {
    id: 'dolma',
    name: 'لمة الدولمة العراقية',
    kicker: 'تكفي ٦ أشخاص',
    desc: 'كل ما تحتاجه لطبخة دولمة عراقية أصيلة — مكوّنات مختارة بعناية.',
    items: ['باذنجان', 'فلفل', 'طماطم', 'أرز عنبر', 'دبس رمان'],
    emojis: ['🍆', '🫑', '🍅', '🍚', '🫙'],
    image: '/images/bundle-dolma.webp',
    price: 18500,
    old: 22000,
    accent: '#0F5132',
  },
  {
    id: 'asriya',
    name: 'عصرية بغدادية',
    kicker: 'لمّة العصر',
    desc: 'طاولة شاي العصر العراقية كاملة — حلو، فاكهة، وضيافة.',
    items: ['كليجة', 'تمر', 'تين', 'عنب'],
    emojis: ['🍪', '🟤', '🟣', '🍇'],
    image: '/images/bundle-asriya.webp',
    price: 14000,
    old: null,
    accent: '#9A5318',
  },
  {
    id: 'weekly',
    name: 'سلة الطبخ الأسبوعية',
    kicker: 'وفّر وقتك',
    desc: 'خضار وأساسيات الطبخ لأسبوع كامل — تتجدد كل يوم بطازجها.',
    items: ['طماطم', 'خيار', 'ثوم', 'بامية', 'بقدونس'],
    emojis: ['🍅', '🥒', '🧄', '🫛', '🌿'],
    image: '/images/bundle-weekly.webp',
    price: 12500,
    old: 15000,
    accent: '#15613D',
  },
];
