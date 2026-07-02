-- seed_blinkit_demo.sql  (v2, copy-safe)
-- Otlobha: seeds the Blinkit demo layout as LIVE editable admin data.
-- Run ONCE in Supabase -> SQL Editor, AFTER blinkit_storefront 1+2+3.
-- Safe to re-run: on conflict / where not exists (never duplicates,
-- never overwrites your own edits). Prices are IQD starting points.

-- 1) Categories (demo tiles)
insert into public.categories (name, emoji, home_tab, sort) values
  ('خضار وفواكه','🥬','all',1),
  ('رز وطحين وبقوليات','🌾','all',2),
  ('زيت وسمن وبهارات','🫒','all',3),
  ('ألبان وفطور','🥛','all',4),
  ('مخبوزات وبسكويت','🍞','all',5),
  ('شيبس ومقرمشات','🍟','all',6),
  ('حلويات','🍫','all',7),
  ('مشروبات وعصائر','🥤','all',8),
  ('وجبات سريعة ومجمّدة','🍜','all',9),
  ('العناية الشخصية','🧴','all',10),
  ('مستلزمات التنظيف','🧼','all',11)
on conflict (name) do nothing;

-- 2) Products (26, IQD) - inserted only if no product with same name exists
insert into public.products (name, category, price, unit, emoji, tint, old_price, stock, rating, rating_count, active, sort)
select v.name, v.category, v.price, v.unit, v.emoji, v.tint, v.old_price, v.stock, v.rating, v.rating_count, true, v.sort
from (values
  ('طماطم عراقية','خضار وفواكه',1250,'كيلو','🍅','#FBE3DE',1500,60,4.6,2100,1),
  ('موز مستورد','خضار وفواكه',2000,'كيلو','🍌','#FBF3D6',NULL,45,4.7,1800,2),
  ('تفاح أحمر','خضار وفواكه',2500,'كيلو','🍎','#FBE0DD',3000,55,4.6,1560,3),
  ('حليب طازج كامل الدسم','ألبان وفطور',1500,'لتر','🥛','#EAF1F8',NULL,90,4.7,9000,4),
  ('بيض بنّي طازج','ألبان وفطور',2250,'٦ حبات','🥚','#F6EFE2',2600,70,4.5,7000,5),
  ('لبن زبادي','ألبان وفطور',1250,'٤ علب','🍶','#EEF3F6',1500,65,4.5,770,6),
  ('أرز بسمتي طويل الحبة','رز وطحين وبقوليات',5000,'كيلو','🌾','#F2EEE3',5500,50,4.6,7200,7),
  ('طحين فاخر','رز وطحين وبقوليات',2000,'كيلو','🌾','#F3ECDD',NULL,80,4.4,600,8),
  ('زيت دوّار الشمس','زيت وسمن وبهارات',4000,'لتر','🛢️','#FBF3E2',NULL,60,4.5,1200,9),
  ('سمن نباتي','زيت وسمن وبهارات',3500,'علبة','🧈','#F3ECDD',NULL,40,4.4,540,10),
  ('خبز صمون','مخبوزات وبسكويت',1000,'٦ حبات','🥖','#F3E6CE',NULL,100,4.5,910,11),
  ('بسكويت شاي','مخبوزات وبسكويت',1000,'علبة','🍪','#F3ECDD',NULL,80,4.5,880,12),
  ('رقائق بطاطس مملّحة','شيبس ومقرمشات',1000,'٥٢ غ','🍟','#FBF1DE',NULL,120,4.4,5000,13),
  ('مقرمشات ذرة','شيبس ومقرمشات',1000,'علبة','🌽','#FBF1E0',NULL,90,4.3,1200,14),
  ('لوح شوكولاتة داكنة غنية','حلويات',3500,'٩٠ غ','🍫','#F0E6DC',4300,70,4.6,4000,15),
  ('لوح شوكولاتة بالحليب','حلويات',1000,'٢٦ غ','🍫','#F0E6DC',1100,110,4.6,1100,16),
  ('آيس كريم كورنيتو بالشوكولاتة','حلويات',1500,'١٢٠ مل','🍦','#F3E7DD',1600,60,4.5,2300,17),
  ('علبة هدايا شوكولاتة متنوعة','حلويات',18000,'٢٥٠ غ','🍫','#F0E6DC',28000,25,4.7,5000,18),
  ('علبة مشروب كولا غازي','مشروبات وعصائر',1350,'٣٠٠ مل','🥤','#FBE3E3',1450,150,4.6,12000,19),
  ('عصير مانجو طبيعي','مشروبات وعصائر',3000,'لتر','🧃','#FBEFE0',3550,50,4.4,3400,20),
  ('آيس توك ليموناضة زرقاء','مشروبات وعصائر',3950,'٢٣٠ مل','🧊','#E7F0FB',4700,40,4.4,2300,21),
  ('مشروب ليمون غازي','مشروبات وعصائر',1450,'٧٥٠ مل','🍋','#EFF6E2',1600,70,4.3,1100,22),
  ('نودلز ماجيك ماسالا','وجبات سريعة ومجمّدة',1000,'٧٠ غ','🍜','#FCEFD9',1100,130,4.5,28000,23),
  ('سيروم فيتامين C للوجه','العناية الشخصية',10250,'٣٠ مل','🧪','#FBF6D9',21550,30,4.4,2100,24),
  ('شامبو للعناية بالشعر','العناية الشخصية',6000,'قطعة','🧴','#EFE9F6',NULL,45,4.3,900,25),
  ('سائل غسيل الأطباق','مستلزمات التنظيف',2500,'٧٥٠ مل','🧽','#E7F1F2',NULL,60,4.4,700,26)
) as v(name, category, price, unit, emoji, tint, old_price, stock, rating, rating_count, sort)
where not exists (select 1 from public.products p where p.name = v.name);

-- 3) Section groups (created only if missing)
insert into public.home_groups (title, tab, sort)
select v.title, 'all', v.sort from (values
  ('البقالة والمطبخ',1),('وجبات ومشروبات',2),('العناية والتنظيف',3)
) as v(title, sort)
where not exists (select 1 from public.home_groups g where g.title = v.title and g.tab = 'all');

-- 4) Link categories to groups (only ones not linked yet)
update public.categories c set home_group = g.id, home_tab = 'all'
  from public.home_groups g
 where g.tab='all' and g.title='البقالة والمطبخ' and c.home_group is null
   and c.name in ('خضار وفواكه','رز وطحين وبقوليات','زيت وسمن وبهارات','ألبان وفطور','مخبوزات وبسكويت');
update public.categories c set home_group = g.id, home_tab = 'all'
  from public.home_groups g
 where g.tab='all' and g.title='وجبات ومشروبات' and c.home_group is null
   and c.name in ('شيبس ومقرمشات','حلويات','مشروبات وعصائر','وجبات سريعة ومجمّدة');
update public.categories c set home_group = g.id, home_tab = 'all'
  from public.home_groups g
 where g.tab='all' and g.title='العناية والتنظيف' and c.home_group is null
   and c.name in ('العناية الشخصية','مستلزمات التنظيف');

-- 5) Bestseller collage (6 demo cards) - seeded only if no collages yet
insert into public.home_collages (title, emojis, more_count, cat_name, tab, sort)
select v.title, v.emojis::jsonb, v.more, v.cat, 'all', v.sort
from (values
  ('خضار وفواكه','["🥦","🍌","🧅","🫛"]',133,'خضار وفواكه',0),
  ('رقائق ومقرمشات','["🥔","🍟","🌽","🥨"]',325,'شيبس ومقرمشات',1),
  ('مشروبات وعصائر','["🥤","🧃","🥫","🧉"]',200,'مشروبات وعصائر',2),
  ('ألبان وخبز وبيض','["🥛","🍶","🧈","🥚"]',22,'ألبان وفطور',3),
  ('آيس كريم والمزيد','["🍦","🍫","🍨","🧁"]',38,'حلويات',4),
  ('زيت وسمن وبهارات','["🫒","🛢️","🌾","🧂"]',152,'زيت وسمن وبهارات',5)
) as v(title, emojis, more, cat, sort)
where not exists (select 1 from public.home_collages);

-- 6) Product rails (3, like the demo) - seeded only if no rails yet
insert into public.home_rails (title, subtitle, source, cat_name, tab, sort)
select v.title, v.subtitle, v.source, v.cat_name, 'all', v.sort
from (values
  ('لِعشّاق الحلويات', NULL, 'category', 'حلويات', 10),
  ('مشروبات باردة وعصائر', NULL, 'category', 'مشروبات وعصائر', 11),
  ('الأساسيات اليومية، توصيل سريع', NULL, 'bestsellers', NULL, 12)
) as v(title, subtitle, source, cat_name, sort)
where not exists (select 1 from public.home_rails);

-- 7) Biryani ad card - seeded only if no ads yet
insert into public.home_ads (title, subtitle, cta_label, emoji, bg, fg, tab, sort)
select 'احتفال البرياني هنا','أحضر أجود أنواع الأرز','تسوّق الآن','🍚',
       'linear-gradient(120deg,#f3e9c9 0%,#efe2b6 45%,#1f2d6b 46%,#16204f 100%)','#2a2a2a','all',5
where not exists (select 1 from public.home_ads);

-- Done. Preview: /blinkit?real=1 - edit everything in /admin -> "واجهة Blinkit".
