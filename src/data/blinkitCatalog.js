// ──────────────────────────────────────────────────────────────
//  «اطلبها» — كتالوج تجريبي مطابق لبنية الكود المصدري (Blinkit clone):
//  ٢٠ قسماً بأيقوناتها الفوتوغرافية (public/images/cat/*) + منتجات.
//  بنية الواجهة في المصدر: هيدر → BestSellers (كولاج) → Shop By Category.
// ──────────────────────────────────────────────────────────────

export const iqd = (n) => Number(n || 0).toLocaleString('en-US');

// تبويبات الأقسام العلوية (كلٌّ يلوّن الهيدر) — كما في تطبيق Blinkit الحقيقي
export const TABS = [
  { id: 'all',         label: 'الكل',       icon: '🛒', theme: '#FBCB25' },
  { id: 'electronics', label: 'إلكترونيات', icon: '🎧', theme: '#CFE0F6' },
  { id: 'beauty',      label: 'جمال',       icon: '💄', theme: '#F8D5E3' },
  { id: 'decor',       label: 'ديكور',      icon: '🛋️', theme: '#EFD9BE' },
  { id: 'kids',        label: 'أطفال',      icon: '🧸', theme: '#C9E7F5' },
  { id: 'gifting',     label: 'هدايا',      icon: '🎁', theme: '#F4CFCF' },
  { id: 'imported',    label: 'مستورد',     icon: '🌍', theme: '#D8ECCB' },
];

// الأقسام الـ٢٠ بالضبط كما في Constants.kt (أسماء معرّبة + أيقونات المصدر)
export const CATEGORIES = [
  { id: 'veg',      name: 'خضار وفواكه',            image: '/images/cat/vegetable.png',       emoji: '🥬' },
  { id: 'dairy',    name: 'ألبان وفطور',            image: '/images/cat/dairy_breakfast.png', emoji: '🥚' },
  { id: 'chips',    name: 'شيبس ومقرمشات',          image: '/images/cat/munchies.png',        emoji: '🍿' },
  { id: 'drinks',   name: 'مشروبات باردة وعصائر',    image: '/images/cat/cold_and_juices.png', emoji: '🥤' },
  { id: 'instant',  name: 'وجبات سريعة ومجمّدة',     image: '/images/cat/instant.png',         emoji: '🍜' },
  { id: 'tea',      name: 'شاي وقهوة',              image: '/images/cat/tea.png',             emoji: '☕' },
  { id: 'bakery',   name: 'مخبوزات وبسكويت',         image: '/images/cat/bakery_biscuits.png', emoji: '🍞' },
  { id: 'sweet',    name: 'حلويات',                 image: '/images/cat/sweet_tooth.png',     emoji: '🍫' },
  { id: 'rice',     name: 'رز وطحين وبقوليات',       image: '/images/cat/atta_rice.png',       emoji: '🍚' },
  { id: 'masala',   name: 'مكسرات وبهارات وزيوت',    image: '/images/cat/masala.png',          emoji: '🌶️' },
  { id: 'sauces',   name: 'صلصات ومنكّهات',          image: '/images/cat/sauce_spreads.png',   emoji: '🥫' },
  { id: 'meat',     name: 'لحوم ودجاج وسمك',         image: '/images/cat/chicken_meat.png',    emoji: '🍗' },
  { id: 'paan',     name: 'ركن المعسّل',             image: '/images/cat/paan_corner.png',     emoji: '🍃' },
  { id: 'organic',  name: 'عضوي وفاخر',             image: '/images/cat/organic_premium.png', emoji: '🌿' },
  { id: 'baby',     name: 'عناية الأطفال',          image: '/images/cat/baby.png',            emoji: '🍼' },
  { id: 'pharma',   name: 'صحة وصيدلية',            image: '/images/cat/pharma_wellness.png', emoji: '💊' },
  { id: 'cleaning', name: 'مستلزمات التنظيف',        image: '/images/cat/cleaning.png',        emoji: '🧼' },
  { id: 'home',     name: 'المنزل والمكتب',          image: '/images/cat/home_office.png',     emoji: '🏠' },
  { id: 'personal', name: 'العناية الشخصية',         image: '/images/cat/personal_care.png',   emoji: '🧴' },
  { id: 'pet',      name: 'مستلزمات الحيوانات',      image: '/images/cat/pet_care.png',        emoji: '🐾' },
];

// منتجات تجريبية موزّعة على الأقسام (لتعبئة الكولاج وبطاقات المنتجات)
const P = (id, name, cat, emoji, tint, price, old, unit, rating, rc, left) =>
  ({ id, name, cat, emoji, tint, price, old, unit, rating, ratingCount: rc, mins: 13, left, image: null });

export const PRODUCTS = [
  // خضار وفواكه
  P('toma',  'طماطم عراقية',     'veg',    '🍅', '#FBE3DE', 1250, 1500, 'كيلو', 4.6, 2133, 60),
  P('cuke',  'خيار عراقي',       'veg',    '🥒', '#E7F4DE', 1000, 1250, 'كيلو', 4.5, 1338, 80),
  P('banana','موز مستورد',       'veg',    '🍌', '#FBF3D6', 2000, null, 'كيلو', 4.7, 1804, 40),
  P('apple', 'تفاح أحمر',        'veg',    '🍎', '#FBE0DD', 2500, 3000, 'كيلو', 4.6, 1562, null),
  P('pom',   'رمان عراقي',       'veg',    '🔴', '#F7DEDE', 3500, null, 'كيلو', 4.8, 904,  30),
  // ألبان وفطور
  P('milk',  'حليب طازج',        'dairy',  '🥛', '#EFF3F6', 1500, null, 'لتر',  4.6, 1621, 90),
  P('egg',   'بيض مائدة',        'dairy',  '🥚', '#FBF3DE', 4000, 4500, '٣٠ حبة',4.7, 1482, 70),
  P('cheese','جبن مثلثات',       'dairy',  '🧀', '#FBEFCF', 2500, null, 'علبة', 4.4, 661,  null),
  P('yog',   'لبن زبادي',        'dairy',  '🍶', '#EEF3F6', 1250, 1500, '٤ علب', 4.5, 774,  null),
  // شيبس ومقرمشات
  P('chips', 'شيبس بطاطا',       'chips',  '🥔', '#FCEFD0', 1000, null, 'كيس',  4.5, 2204, 200),
  P('pop',   'فشار بالجبن',      'chips',  '🍿', '#FCEFD0', 1250, 1500, 'كيس',  4.4, 712,  null),
  // مشروبات
  P('cola',  'مشروب غازي',       'drinks', '🥤', '#FDE9D6', 1000, null, 'قنينة', 4.5, 2404, 150),
  P('juice', 'عصير برتقال',      'drinks', '🧃', '#FDE9D6', 1500, 1750, 'لتر',  4.6, 1281, 90),
  P('water', 'ماء معدني',        'drinks', '💧', '#E7F2FB', 250,  null, 'قنينة', 4.7, 3021, 300),
  // شاي وقهوة
  P('tea',   'شاي عراقي',        'tea',    '🍵', '#EAD9C7', 3500, 4000, 'علبة', 4.7, 981,  45),
  P('coffee','قهوة سريعة',       'tea',    '☕', '#EAD9C7', 5500, null, 'علبة', 4.6, 712,  null),
  // مخبوزات
  P('bread', 'خبز صمون',         'bakery', '🥖', '#F3E6CE', 1000, null, '٦ حبات',4.5, 912,  100),
  P('bisc',  'بسكويت شاي',       'bakery', '🍪', '#F3E6CE', 1000, null, 'علبة', 4.5, 881,  80),
  P('cake',  'كيك إسفنجي',       'bakery', '🍰', '#F6E3D6', 1750, 2000, 'علبة', 4.4, 412,  null),
  // حلويات
  P('choco', 'شوكولا بالحليب',   'sweet',  '🍫', '#F1E2D4', 2000, 2500, 'لوح',  4.7, 1881, 120),
  P('klei',  'كليجة عراقية',     'sweet',  '🥮', '#EFE0CB', 5500, null, 'علبة', 4.8, 504,  25),
  // رز وطحين وبقوليات
  P('rice',  'رز عنبر الرشيد',   'rice',   '🍚', '#F4ECD3', 8500, 9500, '٥ كيلو',4.8, 1938, 40),
  P('flour', 'طحين فاخر',        'rice',   '🌾', '#F4ECD3', 3000, null, '٢ كيلو',4.5, 721,  null),
  P('lentil','عدس أحمر',         'rice',   '🟠', '#F6E5CF', 2250, 2500, 'كيلو', 4.4, 412,  null),
  P('chick', 'حمص حب',           'rice',   '🟤', '#F0E3CC', 2000, null, 'كيلو', 4.3, 381,  null),
  // مكسرات وبهارات وزيوت
  P('nuts',  'مكسرات مشكّلة',     'masala', '🥜', '#F0E3CC', 7500, 8500, '٥٠٠ غم',4.7, 621,  null),
  P('oil',   'زيت دوّار الشمس',   'masala', '🛢️','#F4EFD0', 4500, 5500, '١.٨ لتر',4.6,1204, 50),
  P('date',  'تمر برحي',         'masala', '🌴', '#EFE0CB', 6000, null, 'علبة', 4.8, 712,  null),
  // صلصات
  P('paste', 'معجون طماطم',      'sauces', '🥫', '#F7DFDB', 1750, 2000, 'علبة', 4.4, 661,  null),
  P('ketch', 'كاتشب',            'sauces', '🍅', '#F7DFDB', 2000, null, 'قنينة', 4.5, 512,  null),
  // لحوم ودجاج وسمك
  P('chk',   'دجاج طازج',        'meat',   '🍗', '#F7DFDB', 6500, 7500, 'كيلو', 4.6, 1102, 35),
  P('meat',  'لحم غنم',          'meat',   '🥩', '#F4D7D2', 17000,null, 'كيلو', 4.7, 521,  20),
  // وجبات سريعة
  P('noodle','نودلز سريعة',      'instant','🍜', '#F6E5CF', 750,  null, 'علبة', 4.5, 1404, 180),
  // تنظيف
  P('deter', 'مسحوق غسيل',       'cleaning','🧴','#E2F0F6', 6500, 7500, 'كيس',  4.6, 881,  55),
  P('dish',  'سائل جلي',         'cleaning','🧼','#E2F0F6', 2000, null, 'قنينة', 4.5, 661,  null),
  // عناية شخصية
  P('sham',  'شامبو للشعر',      'personal','🧴','#F3E0EE', 4500, 5500, 'قنينة', 4.6, 981,  60),
  P('tooth', 'معجون أسنان',      'personal','🪥','#E7F2FB', 1750, 2000, 'أنبوب', 4.6, 1102, null),
  // عناية الأطفال
  P('diaper','حفّاضات أطفال',     'baby',   '🍼', '#E4F3FB', 9000, 11000,'كيس',  4.7, 704,  25),
];

// أقسام «الأكثر مبيعاً» (BestSellers) — الأكثر امتلاءً بالمنتجات
export const bestsellerCats = () => {
  const counts = {};
  PRODUCTS.forEach((p) => { counts[p.cat] = (counts[p.cat] || 0) + 1; });
  return CATEGORIES
    .map((c) => ({ ...c, count: counts[c.id] || 0 }))
    .filter((c) => c.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);
};
