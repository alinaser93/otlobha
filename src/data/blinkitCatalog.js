// ──────────────────────────────────────────────────────────────
//  Blinkit-style demo catalog for «اطلبها» (Arabic / IQD).
//  Emoji placeholders stand in for product photos so the redesign
//  runs out of the box; real images can be added per product later.
//  Mirrors Blinkit's structure: tabbed top nav, category GROUPS,
//  dense category tiles, and rich product cards.
// ──────────────────────────────────────────────────────────────

export const iqd = (n) => Number(n || 0).toLocaleString('en-US');

// ── top category tabs (each themes the header colour, Blinkit-style) ──
export const TABS = [
  { id: 'all',         label: 'الكل',       icon: '🛒', theme: '#FBCB25', soft: '#FEF3C7' },
  { id: 'electronics', label: 'إلكترونيات', icon: '🎧', theme: '#CFE0F6', soft: '#E8F0FB' },
  { id: 'beauty',      label: 'جمال',       icon: '💄', theme: '#F8D5E3', soft: '#FCE9F1' },
  { id: 'decor',       label: 'ديكور',      icon: '🛋️', theme: '#EFD9BE', soft: '#F6EADA' },
  { id: 'kids',        label: 'أطفال',      icon: '🧸', theme: '#C9E7F5', soft: '#E4F3FB' },
  { id: 'gifting',     label: 'هدايا',      icon: '🎁', theme: '#F4CFCF', soft: '#FBE6E6' },
  { id: 'imported',    label: 'مستورد',     icon: '🌍', theme: '#D8ECCB', soft: '#ECF5E4' },
];

// ── categories (id, name, emoji, tint, group, tab) ──
export const CATEGORIES = [
  // bestsellers (group: best)
  { id: 'drinks',   name: 'مشروبات وعصائر',  emoji: '🥤', tint: '#FDE9D6', group: 'best' },
  { id: 'snacksb',  name: 'تسالي ومقرمشات',  emoji: '🍿', tint: '#FCEFD0', group: 'best' },
  { id: 'icecream', name: 'آيس كريم',         emoji: '🍦', tint: '#E7F2FB', group: 'best' },
  { id: 'sweetsb',  name: 'حلويات وشوكولا',   emoji: '🍫', tint: '#F1E2D4', group: 'best' },

  // grocery & kitchen (group: grocery)
  { id: 'veg',      name: 'خضار وفواكه',      emoji: '🥬', tint: '#E4F4DD', group: 'grocery' },
  { id: 'rice',     name: 'رز وطحين وبقوليات', emoji: '🌾', tint: '#F4ECD3', group: 'grocery' },
  { id: 'oil',      name: 'زيوت وسمن وبهارات', emoji: '🫒', tint: '#EFEAD2', group: 'grocery' },
  { id: 'dairy',    name: 'حليب وخبز وبيض',    emoji: '🥚', tint: '#FBF3DE', group: 'grocery' },
  { id: 'bakery',   name: 'مخبوزات وبسكويت',   emoji: '🍞', tint: '#F3E6CE', group: 'grocery' },
  { id: 'nuts',     name: 'حبوب ومكسرات',     emoji: '🥜', tint: '#F0E3CC', group: 'grocery' },
  { id: 'meat',     name: 'لحوم ودجاج وسمك',  emoji: '🍗', tint: '#F7DFDB', group: 'grocery' },
  { id: 'kitchen',  name: 'أدوات مطبخ',        emoji: '🍴', tint: '#E8EBEF', group: 'grocery' },

  // snacks & drinks (group: snacks)
  { id: 'chips',    name: 'شيبس ومقرمشات',    emoji: '🥔', tint: '#FCEFD0', group: 'snacks' },
  { id: 'choco',    name: 'شوكولا وحلوى',     emoji: '🍬', tint: '#F1E2D4', group: 'snacks' },
  { id: 'juice',    name: 'عصائر ومشروبات',   emoji: '🧃', tint: '#FDE9D6', group: 'snacks' },
  { id: 'coffee',   name: 'شاي وقهوة',         emoji: '☕', tint: '#EAD9C7', group: 'snacks' },
  { id: 'instant',  name: 'وجبات سريعة',       emoji: '🍜', tint: '#F6E5CF', group: 'snacks' },
  { id: 'sauces',   name: 'صلصات وتتبيلات',    emoji: '🥫', tint: '#F7DFDB', group: 'snacks' },
  { id: 'pickles',  name: 'مخللات وطرشي',     emoji: '🥒', tint: '#EEF2D8', group: 'snacks' },
  { id: 'dates',    name: 'تمور ومؤونة',      emoji: '🌴', tint: '#EFE0CB', group: 'snacks' },

  // beauty & personal care (group: beauty)
  { id: 'body',     name: 'العناية بالجسم',    emoji: '🧴', tint: '#F8E1EC', group: 'beauty' },
  { id: 'hair',     name: 'العناية بالشعر',    emoji: '💆', tint: '#F3E0EE', group: 'beauty' },
  { id: 'skin',     name: 'البشرة والوجه',     emoji: '🧖', tint: '#FBE6EE', group: 'beauty' },
  { id: 'makeup',   name: 'مكياج وتجميل',      emoji: '💄', tint: '#F8D5E3', group: 'beauty' },
  { id: 'baby',     name: 'عناية الأطفال',     emoji: '🍼', tint: '#E4F3FB', group: 'beauty' },
  { id: 'pharma',   name: 'صحة وصيدلية',       emoji: '💊', tint: '#E6F0E2', group: 'beauty' },

  // household (group: home)
  { id: 'clean',    name: 'منظفات',           emoji: '🧼', tint: '#E2F0F6', group: 'home' },
  { id: 'tissue',   name: 'مناديل ومحارم',     emoji: '🧻', tint: '#EFEFE9', group: 'home' },
  { id: 'tools',    name: 'أدوات تنظيف',       emoji: '🧹', tint: '#EDE7DA', group: 'home' },
  { id: 'plastic',  name: 'بلاستيك ومطبخ',     emoji: '🧺', tint: '#E8EBEF', group: 'home' },
];

export const GROUPS = [
  { id: 'best',    title: 'الأكثر مبيعاً' },
  { id: 'grocery', title: 'البقالة والمطبخ' },
  { id: 'snacks',  title: 'وجبات ومشروبات' },
  { id: 'beauty',  title: 'العناية والجمال' },
  { id: 'home',    title: 'مستلزمات المنزل' },
];

// ── products ── (id, name, cat, emoji, tint, price, old, unit, rating, ratingCount, mins, left, tag)
const P = (id, name, cat, emoji, tint, price, old, unit, rating, rc, left, tag) =>
  ({ id, name, cat, emoji, tint, price, old, unit, rating, ratingCount: rc, mins: 13, left, tag });

export const PRODUCTS = [
  // خضار وفواكه
  P('p-toma',  'طماطم عراقية',          'veg',   '🍅', '#FBE3DE', 1250, 1500, 'كيلو',    4.6, 21339, 8,  'طازج'),
  P('p-cuke',  'خيار عراقي',            'veg',   '🥒', '#E7F4DE', 1000, 1250, 'كيلو',    4.5, 13381, 12, 'طازج'),
  P('p-potato','بطاطا',                 'veg',   '🥔', '#F4ECD3', 1000, null, 'كيلو',    4.4, 9210,  null, null),
  P('p-onion', 'بصل أحمر',              'veg',   '🧅', '#F6E2E6', 750,  1000, 'كيلو',    4.3, 7720,  20, null),
  P('p-banana','موز',                   'veg',   '🍌', '#FBF3D6', 2000, null, 'كيلو',    4.7, 18044, 5,  'مستورد'),
  P('p-apple', 'تفاح أحمر',             'veg',   '🍎', '#FBE0DD', 2500, 3000, 'كيلو',    4.6, 15622, null, null),
  P('p-pom',   'رمان عراقي',            'veg',   '🔴', '#F7DEDE', 3500, null, 'كيلو',    4.8, 9044,  3,  'محلي'),
  P('p-grape', 'عنب عراقي',             'veg',   '🍇', '#ECE2F3', 2500, 3000, 'كيلو',    4.5, 6610,  null, null),
  P('p-herb',  'بقدونس وكزبرة',         'veg',   '🌿', '#E7F4DE', 750,  null, 'باقة',    4.4, 3120,  null, 'طازج'),
  P('p-egg2',  'باذنجان عراقي',         'veg',   '🍆', '#ECE0F1', 1500, null, 'كيلو',    4.5, 5120,  null, null),

  // رز وطحين وبقوليات
  P('p-rice',  'رز عنبر الرشيد',        'rice',  '🍚', '#F4ECD3', 8500, 9500, '٥ كيلو',  4.8, 19381, 4,  'الأكثر طلباً'),
  P('p-flour', 'طحين فاخر',             'rice',  '🌾', '#F4ECD3', 3000, null, '٢ كيلو',  4.5, 7210,  null, null),
  P('p-lentil','عدس أحمر',              'rice',  '🟠', '#F6E5CF', 2250, 2500, 'كيلو',    4.4, 4120,  null, null),
  P('p-chick', 'حمص حب',                'rice',  '🟤', '#F0E3CC', 2000, null, 'كيلو',    4.3, 3810,  10, null),
  P('p-bean',  'فاصوليا بيضاء',         'rice',  '⚪', '#F2ECDD', 2500, null, 'كيلو',    4.4, 2980,  null, null),

  // زيوت وبهارات
  P('p-oil',   'زيت دوّار الشمس',        'oil',   '🛢️', '#F4EFD0', 4500, 5500, '١.٨ لتر', 4.6, 12044, 6,  'عرض'),
  P('p-ghee',  'سمن حيواني',            'oil',   '🧈', '#F6EBC9', 9000, null, '٩٠٠ غم',  4.7, 8120,  null, 'فاخر'),
  P('p-salt',  'ملح طعام',              'oil',   '🧂', '#EEF0F2', 500,  null, 'كيس',     4.5, 5210,  null, null),
  P('p-spice', 'بهارات مشكّلة',          'oil',   '🌶️', '#F7DCD6', 1500, 1750, 'علبة',    4.4, 3340,  null, null),

  // حليب وخبز وبيض
  P('p-milk',  'حليب طازج',             'dairy', '🥛', '#EFF3F6', 1500, null, 'لتر',     4.6, 16210, 9,  'مبرّد'),
  P('p-egg',   'بيض مائدة',             'dairy', '🥚', '#FBF3DE', 4000, 4500, '٣٠ حبة',  4.7, 14820, 7,  null),
  P('p-bread', 'خبز صمون',              'dairy', '🥖', '#F3E6CE', 1000, null, '٦ حبات',  4.5, 9120,  null, 'طازج'),
  P('p-cheese','جبن مثلثات',            'dairy', '🧀', '#FBEFCF', 2500, null, 'علبة',    4.4, 6610,  null, null),
  P('p-yog',   'لبن زبادي',             'dairy', '🍦', '#EEF3F6', 1250, 1500, '٤ علب',   4.5, 7740,  null, null),

  // مخبوزات وبسكويت / مكسرات
  P('p-bisc',  'بسكويت شاي',            'bakery','🍪', '#F3E6CE', 1000, null, 'علبة',    4.5, 8810,  null, null),
  P('p-cake',  'كيك إسفنجي',            'bakery','🍰', '#F6E3D6', 1750, 2000, 'علبة',    4.4, 4120,  null, null),
  P('p-klei',  'كليجة عراقية',          'bakery','🥮', '#EFE0CB', 5500, null, 'علبة',    4.8, 5044,  3,  'محلي'),
  P('p-nuts',  'مكسرات مشكّلة',          'nuts',  '🥜', '#F0E3CC', 7500, 8500, '٥٠٠ غم',  4.7, 6210,  5,  'فاخر'),
  P('p-date',  'تمر برحي',              'dates', '🌴', '#EFE0CB', 6000, null, 'علبة',    4.8, 7120,  4,  'فاخر'),

  // لحوم ودجاج
  P('p-chk',   'دجاج طازج',             'meat',  '🍗', '#F7DFDB', 6500, 7500, 'كيلو',    4.6, 11020, 6,  'طازج'),
  P('p-meat',  'لحم غنم',               'meat',  '🥩', '#F4D7D2', 17000, null,'كيلو',    4.7, 5210,  3,  null),
  P('p-fish',  'سمك مزروع',             'meat',  '🐟', '#E2EEF4', 9000, 10000,'كيلو',    4.4, 2980,  null, null),

  // تسالي ومقرمشات / شيبس
  P('p-chips', 'شيبس بطاطا',            'chips', '🥔', '#FCEFD0', 1000, null, 'كيس',     4.5, 22044, 15, 'الأكثر طلباً'),
  P('p-pop',   'فشار بالجبن',           'snacksb','🍿', '#FCEFD0', 1250, 1500, 'كيس',    4.4, 7120,  null, null),
  P('p-pretz', 'بسكويت مملّح',           'chips', '🥨', '#F3E6CE', 1500, null, 'علبة',    4.3, 3340,  null, null),

  // شوكولا وحلوى
  P('p-choco', 'شوكولا بالحليب',        'choco', '🍫', '#F1E2D4', 2000, 2500, 'لوح',     4.7, 18810, 8,  'عرض'),
  P('p-candy', 'حلوى جلي',              'choco', '🍬', '#F8E1EC', 1000, null, 'كيس',     4.4, 6210,  null, null),
  P('p-wafer', 'ويفر شوكولا',           'choco', '🍫', '#F1E2D4', 750,  1000, 'علبة',    4.5, 9120,  12, null),

  // عصائر ومشروبات
  P('p-cola',  'مشروب غازي',            'drinks','🥤', '#FDE9D6', 1000, null, 'قنينة',   4.5, 24044, 20, null),
  P('p-juice', 'عصير برتقال',           'juice', '🧃', '#FDE9D6', 1500, 1750, 'لتر',     4.6, 12810, 9,  'طازج'),
  P('p-water', 'ماء معدني',             'drinks','💧', '#E7F2FB', 250,  null, 'قنينة',   4.7, 30210, null, null),
  P('p-energy','مشروب طاقة',            'drinks','⚡', '#FDE9D6', 2000, null, 'علبة',     4.3, 5120,  null, null),

  // شاي وقهوة
  P('p-tea',   'شاي عراقي',             'coffee','🍵', '#EAD9C7', 3500, 4000, 'علبة',    4.7, 9810,  6,  'الأكثر طلباً'),
  P('p-coffee','قهوة سريعة',            'coffee','☕', '#EAD9C7', 5500, null, 'علبة',     4.6, 7210,  null, null),

  // وجبات سريعة / صلصات
  P('p-noodle','نودلز سريعة',           'instant','🍜', '#F6E5CF', 750,  null, 'علبة',    4.5, 14044, 18, 'عرض'),
  P('p-paste', 'معجون طماطم',           'sauces','🥫', '#F7DFDB', 1750, 2000, 'علبة',    4.4, 6610,  null, null),
  P('p-ketch', 'كاتشب',                 'sauces','🍅', '#F7DFDB', 2000, null, 'قنينة',   4.5, 5120,  null, null),

  // مخللات
  P('p-pick',  'طرشي مشكّل',             'pickles','🥒', '#EEF2D8', 3500, null, 'مرطبان',  4.6, 5044,  5,  'محلي'),
  P('p-olive', 'زيتون أخضر',            'pickles','🫒', '#EEF2D8', 4000, 4500, 'علبة',    4.5, 4120,  null, null),

  // عناية الجسم/شعر/بشرة
  P('p-soap',  'صابون مرطّب',            'body',  '🧼', '#F8E1EC', 1000, null, 'قطعة',    4.5, 8120,  null, null),
  P('p-sham',  'شامبو للشعر',           'hair',  '🧴', '#F3E0EE', 4500, 5500, 'قنينة',   4.6, 9810,  7,  'عرض'),
  P('p-cream', 'كريم مرطّب',             'skin',  '🧴', '#FBE6EE', 3500, null, 'علبة',    4.5, 6210,  null, null),
  P('p-tooth', 'معجون أسنان',           'body',  '🪥', '#E7F2FB', 1750, 2000, 'أنبوب',   4.6, 11020, 10, null),

  // عناية أطفال / صحة
  P('p-diaper','حفّاضات أطفال',          'baby',  '🍼', '#E4F3FB', 9000, 11000,'كيس',     4.7, 7044,  4,  'عرض'),
  P('p-wipes', 'مناديل مبلّلة',           'baby',  '🧻', '#EFEFE9', 2500, null, 'علبة',    4.5, 5120,  null, null),

  // منزل
  P('p-deter', 'مسحوق غسيل',            'clean', '🧴', '#E2F0F6', 6500, 7500, 'كيس',     4.6, 8810,  6,  'عرض'),
  P('p-dish',  'سائل جلي',              'clean', '🧼', '#E2F0F6', 2000, null, 'قنينة',   4.5, 6610,  null, null),
  P('p-tissue','محارم ورقية',           'tissue','🧻', '#EFEFE9', 1500, null, 'علبة',    4.4, 7740,  null, null),
];

// curated rails for the home page
export const railTopSellers = () =>
  [...PRODUCTS].filter((p) => p.ratingCount > 9000).sort((a, b) => b.ratingCount - a.ratingCount).slice(0, 12);
export const railDeals = () => PRODUCTS.filter((p) => p.old).slice(0, 12);

// nearby stores (Blinkit-style horizontal cards)
export const STORES = [
  { id: 's1', name: 'سوبرماركت السماوة', emoji: '🏪', tint: '#FEF3C7', mins: 12, rating: 4.7, tag: 'بقالة' },
  { id: 's2', name: 'مخبز الرشيد',        emoji: '🥖', tint: '#F3E6CE', mins: 10, rating: 4.8, tag: 'مخبوزات' },
  { id: 's3', name: 'لحوم الفرات',        emoji: '🥩', tint: '#F7DFDB', mins: 18, rating: 4.6, tag: 'لحوم' },
  { id: 's4', name: 'صيدلية الحياة',      emoji: '💊', tint: '#E6F0E2', mins: 15, rating: 4.9, tag: 'صيدلية' },
  { id: 's5', name: 'خضار وفواكه النهر',  emoji: '🥬', tint: '#E4F4DD', mins: 14, rating: 4.5, tag: 'خضار' },
];

// bundle offers (kept, restyled for Blinkit)
export const BUNDLES = [
  { id: 'b-dolma',  name: 'لمة الدولمة العراقية', emoji: '🍆', tint: '#E4F4DD', price: 18500, old: 22000, items: 5, kicker: 'تكفي ٦ أشخاص' },
  { id: 'b-asriya', name: 'عصرية بغدادية',        emoji: '🍪', tint: '#EFE0CB', price: 14000, old: null,  items: 4, kicker: 'لمّة العصر' },
  { id: 'b-weekly', name: 'سلة الطبخ الأسبوعية',  emoji: '🧺', tint: '#FEF3C7', price: 12500, old: 15000, items: 5, kicker: 'وفّر وقتك' },
];
