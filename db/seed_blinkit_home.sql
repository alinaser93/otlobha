-- ════════════════════════════════════════════════════════════════════════
--  اطلبها · بذرة اختيارية لواجهة Blinkit  (شغّلها بعد blinkit_storefront.sql)
--  تربط فئات المتجر الحالية بمجموعات الأقسام المبذورة تحت تبويب «الكل»،
--  كي يفتح الأدمن «واجهة Blinkit» فيجد التصميم منظّماً وجاهزاً للتعديل.
--
--  • آمنة وقابلة لإعادة التشغيل: تُحدّث فقط الفئات التي home_group فيها NULL،
--    فلا تلغي أي ربط قام به الأدمن يدوياً لاحقاً.
--  • إن اختلفت أسماء فئاتك عن الأسماء أدناه فلن يحدث شيء (لا خطأ) — تربطها
--    يدوياً من لوحة الأدمن. لا حاجة لتشغيلها إطلاقاً؛ الواجهة تعمل بدونها.
-- ════════════════════════════════════════════════════════════════════════

-- البقالة والمطبخ
update public.categories c
   set home_group = g.id, home_tab = 'all'
  from public.home_groups g
 where c.home_group is null
   and g.tab = 'all' and g.title = 'البقالة والمطبخ'
   and c.name in ('خضار وفواكه','ألبان وفطور','رز وطحين وبقوليات',
                  'مكسرات وبهارات وزيوت','صلصات ومنكّهات','لحوم ودجاج وسمك','مخبوزات وبسكويت');

-- وجبات ومشروبات
update public.categories c
   set home_group = g.id, home_tab = 'all'
  from public.home_groups g
 where c.home_group is null
   and g.tab = 'all' and g.title = 'وجبات ومشروبات'
   and c.name in ('شيبس ومقرمشات','مشروبات باردة وعصائر','وجبات سريعة ومجمّدة',
                  'شاي وقهوة','حلويات','ركن المعسّل');

-- العناية والجمال
update public.categories c
   set home_group = g.id, home_tab = 'all'
  from public.home_groups g
 where c.home_group is null
   and g.tab = 'all' and g.title = 'العناية والجمال'
   and c.name in ('العناية الشخصية','صحة وصيدلية','عناية الأطفال');

-- مستلزمات المنزل
update public.categories c
   set home_group = g.id, home_tab = 'all'
  from public.home_groups g
 where c.home_group is null
   and g.tab = 'all' and g.title = 'مستلزمات المنزل'
   and c.name in ('مستلزمات التنظيف','المنزل والمكتب','مستلزمات الحيوانات','عضوي وفاخر');
