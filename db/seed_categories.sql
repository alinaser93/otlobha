-- ════════════════════════════════════════════════════════════════════════
--  اطلبها · الأقسام الـ٢٠ المطابقة للكود المصدري (بأيقوناتها الفوتوغرافية)
--  شغّله مرّة واحدة في Supabase ← SQL Editor. يضيف/يحدّث الأقسام وأيقوناتها.
--  الأيقونات ملفات ضمن الموقع (public/images/cat/*) فتظهر تلقائياً.
--  تتحكّم بها من /admin ← الكتالوج ← الأقسام (إعادة ترتيب/تسمية/استبدال صورة).
-- ════════════════════════════════════════════════════════════════════════

insert into public.categories (name, image, emoji, sort) values
  ('خضار وفواكه',          '/images/cat/vegetable.png',       '🥬', 1),
  ('ألبان وفطور',          '/images/cat/dairy_breakfast.png', '🥚', 2),
  ('شيبس ومقرمشات',        '/images/cat/munchies.png',        '🍿', 3),
  ('مشروبات باردة وعصائر', '/images/cat/cold_and_juices.png', '🥤', 4),
  ('وجبات سريعة ومجمّدة',  '/images/cat/instant.png',         '🍜', 5),
  ('شاي وقهوة',            '/images/cat/tea.png',             '☕', 6),
  ('مخبوزات وبسكويت',      '/images/cat/bakery_biscuits.png', '🍞', 7),
  ('حلويات',               '/images/cat/sweet_tooth.png',     '🍫', 8),
  ('رز وطحين وبقوليات',    '/images/cat/atta_rice.png',       '🍚', 9),
  ('مكسرات وبهارات وزيوت', '/images/cat/masala.png',          '🌶️', 10),
  ('صلصات ومنكّهات',       '/images/cat/sauce_spreads.png',   '🥫', 11),
  ('لحوم ودجاج وسمك',      '/images/cat/chicken_meat.png',    '🍗', 12),
  ('ركن المعسّل',          '/images/cat/paan_corner.png',     '🍃', 13),
  ('عضوي وفاخر',           '/images/cat/organic_premium.png', '🌿', 14),
  ('عناية الأطفال',        '/images/cat/baby.png',            '🍼', 15),
  ('صحة وصيدلية',          '/images/cat/pharma_wellness.png', '💊', 16),
  ('مستلزمات التنظيف',     '/images/cat/cleaning.png',        '🧼', 17),
  ('المنزل والمكتب',       '/images/cat/home_office.png',     '🏠', 18),
  ('العناية الشخصية',      '/images/cat/personal_care.png',   '🧴', 19),
  ('مستلزمات الحيوانات',   '/images/cat/pet_care.png',        '🐾', 20)
on conflict (name) do update
  set image = excluded.image, emoji = excluded.emoji, sort = excluded.sort;

-- تم ✓  عايِن على /blinkit?real=1  ·  تحكّم من /admin ← الكتالوج ← الأقسام
