-- ════════════════════════════════════════════════════════════════════════
--  اطلبها · تحكّم واجهة Blinkit  (شغّله مرّة واحدة في Supabase ← SQL Editor)
--  يضيف: مجموعات الأقسام، التبويبات العلوية، البانرات، ربط الفئة بمجموعة/تبويب،
--        وإعدادات الواجهة — كلها يتحكّم بها الأدمن من /admin ← «واجهة Blinkit».
--  آمن وقابل لإعادة التشغيل (idempotent): IF NOT EXISTS / on conflict.
-- ════════════════════════════════════════════════════════════════════════

-- ── 1) أعمدة على categories: المجموعة + التبويب + التمييز ──
alter table public.categories add column if not exists home_group   uuid;
alter table public.categories add column if not exists home_tab     text default 'all';
alter table public.categories add column if not exists home_featured boolean default false;

-- ── 2) إعدادات الواجهة على app_settings (الصف id=1) ──
alter table public.app_settings add column if not exists sf_delivery_minutes integer default 10;
alter table public.app_settings add column if not exists sf_show_stores      boolean default true;
alter table public.app_settings add column if not exists sf_show_bundles     boolean default true;
alter table public.app_settings add column if not exists sf_welcome_title    text;
alter table public.app_settings add column if not exists sf_welcome_subtitle text;
update public.app_settings
   set sf_welcome_title    = coalesce(sf_welcome_title, 'أهلاً بك في اطلبها 👋'),
       sf_welcome_subtitle = coalesce(sf_welcome_subtitle, 'اطلب الآن واستمتع بتوصيل مجاني داخل السماوة')
 where id = 1;

-- ── 3) جداول الواجهة ──
create table if not exists public.home_groups (
  id         uuid primary key default gen_random_uuid(),
  title      text not null,
  tab        text default 'all',
  sort       integer default 0,
  active     boolean default true,
  created_at timestamptz default now()
);

create table if not exists public.home_tabs (
  id         uuid primary key default gen_random_uuid(),
  key        text unique not null,
  label      text not null,
  icon       text default '🛒',
  theme      text default '#F8CB46',
  sort       integer default 0,
  active     boolean default true,
  created_at timestamptz default now()
);

create table if not exists public.home_banners (
  id         uuid primary key default gen_random_uuid(),
  title      text,
  subtitle   text,
  cta_label  text,
  image      text,
  theme      text default '#F8CB46',
  tab        text default 'all',
  sort       integer default 0,
  active     boolean default true,
  created_at timestamptz default now()
);

-- ── 4) RLS: قراءة عامّة (الكتابة تتم عبر دوال SECURITY DEFINER فقط) ──
alter table public.home_groups  enable row level security;
alter table public.home_tabs    enable row level security;
alter table public.home_banners enable row level security;

drop policy if exists home_groups_read  on public.home_groups;
drop policy if exists home_tabs_read    on public.home_tabs;
drop policy if exists home_banners_read on public.home_banners;
create policy home_groups_read  on public.home_groups  for select using (true);
create policy home_tabs_read    on public.home_tabs    for select using (true);
create policy home_banners_read on public.home_banners for select using (true);

-- ── 5) بذور افتراضية (تبويبات + مجموعات) — تُطابق تصميم Blinkit ──
insert into public.home_tabs (key, label, icon, theme, sort) values
  ('all','الكل','🛒','#F8CB46',0),
  ('electronics','إلكترونيات','🎧','#CFE0F6',1),
  ('beauty','جمال','💄','#F8D5E3',2),
  ('decor','ديكور','🛋️','#EFD9BE',3),
  ('kids','أطفال','🧸','#C9E7F5',4),
  ('gifting','هدايا','🎁','#F4CFCF',5),
  ('imported','مستورد','🌍','#D8ECCB',6)
on conflict (key) do nothing;

insert into public.home_groups (title, tab, sort)
select v.title, 'all', v.sort from (values
  ('الأكثر مبيعاً',0),('البقالة والمطبخ',1),('وجبات ومشروبات',2),
  ('العناية والجمال',3),('مستلزمات المنزل',4)
) as v(title, sort)
where not exists (select 1 from public.home_groups);

-- ════════════════════════════════════════════════════════════════════════
--  6) دوال القراءة العامّة + تحكّم الأدمن (نفس نمط الحماية: _is_admin)
-- ════════════════════════════════════════════════════════════════════════

-- قراءة عامّة لكل بيانات الواجهة (يستدعيها المتجر)
create or replace function public.get_home_layout()
returns json language sql security definer set search_path to 'public' as $$
  select json_build_object(
    'tabs',    coalesce((select json_agg(t order by t.sort, t.created_at)
                         from public.home_tabs t where t.active), '[]'::json),
    'groups',  coalesce((select json_agg(g order by g.sort, g.created_at)
                         from public.home_groups g where g.active), '[]'::json),
    'banners', coalesce((select json_agg(b order by b.sort, b.created_at)
                         from public.home_banners b where b.active), '[]'::json),
    'categories', coalesce((select json_agg(json_build_object(
                              'id', c.id, 'name', c.name, 'emoji', c.emoji, 'image', c.image,
                              'home_group', c.home_group, 'home_tab', c.home_tab, 'home_featured', c.home_featured
                            ) order by c.sort, c.created_at)
                         from public.categories c where c.active), '[]'::json),
    'config', (select json_build_object(
                  'delivery_minutes', coalesce(s.sf_delivery_minutes, 10),
                  'show_stores',      coalesce(s.sf_show_stores, true),
                  'show_bundles',     coalesce(s.sf_show_bundles, true),
                  'welcome_title',    s.sf_welcome_title,
                  'welcome_subtitle', s.sf_welcome_subtitle)
                from public.app_settings s where s.id = 1)
  );
$$;

-- قائمة كاملة للأدمن (تشمل غير المفعّل)
create or replace function public.admin_list_home(p_admin_id uuid)
returns json language plpgsql security definer set search_path to 'public' as $$
begin
  if not _is_admin(p_admin_id) then return json_build_object('ok', false, 'error', 'unauthorized'); end if;
  return json_build_object('ok', true,
    'tabs',    coalesce((select json_agg(t order by t.sort, t.created_at) from public.home_tabs t), '[]'::json),
    'groups',  coalesce((select json_agg(g order by g.sort, g.created_at) from public.home_groups g), '[]'::json),
    'banners', coalesce((select json_agg(b order by b.sort, b.created_at) from public.home_banners b), '[]'::json));
end; $$;

-- مجموعات
create or replace function public.admin_save_home_group(p_admin_id uuid, p_id uuid, p_title text, p_tab text default 'all', p_sort integer default 0, p_active boolean default true)
returns json language plpgsql security definer set search_path to 'public' as $$
declare v public.home_groups;
begin
  if not _is_admin(p_admin_id) then return json_build_object('ok', false, 'error', 'unauthorized'); end if;
  if coalesce(btrim(p_title),'') = '' then return json_build_object('ok', false, 'error', 'title_required'); end if;
  if p_id is null then
    insert into public.home_groups (title, tab, sort, active)
      values (btrim(p_title), coalesce(p_tab,'all'), coalesce(p_sort,0), coalesce(p_active,true)) returning * into v;
  else
    update public.home_groups set title=btrim(p_title), tab=coalesce(p_tab,tab),
      sort=coalesce(p_sort,sort), active=coalesce(p_active,active) where id=p_id returning * into v;
  end if;
  return json_build_object('ok', true, 'group', row_to_json(v));
end; $$;

create or replace function public.admin_delete_home_group(p_admin_id uuid, p_id uuid)
returns json language plpgsql security definer set search_path to 'public' as $$
begin
  if not _is_admin(p_admin_id) then return json_build_object('ok', false, 'error', 'unauthorized'); end if;
  update public.categories set home_group = null where home_group = p_id;
  delete from public.home_groups where id = p_id;
  return json_build_object('ok', true);
end; $$;

-- تبويبات
create or replace function public.admin_save_home_tab(p_admin_id uuid, p_id uuid, p_key text, p_label text, p_icon text default '🛒', p_theme text default '#F8CB46', p_sort integer default 0, p_active boolean default true)
returns json language plpgsql security definer set search_path to 'public' as $$
declare v public.home_tabs;
begin
  if not _is_admin(p_admin_id) then return json_build_object('ok', false, 'error', 'unauthorized'); end if;
  if coalesce(btrim(p_key),'')='' or coalesce(btrim(p_label),'')='' then return json_build_object('ok', false, 'error', 'key_label_required'); end if;
  if p_id is null then
    insert into public.home_tabs (key, label, icon, theme, sort, active)
      values (btrim(p_key), btrim(p_label), coalesce(p_icon,'🛒'), coalesce(p_theme,'#F8CB46'), coalesce(p_sort,0), coalesce(p_active,true))
      on conflict (key) do update set label=excluded.label, icon=excluded.icon, theme=excluded.theme, sort=excluded.sort, active=excluded.active
      returning * into v;
  else
    update public.home_tabs set key=btrim(p_key), label=btrim(p_label), icon=coalesce(p_icon,icon),
      theme=coalesce(p_theme,theme), sort=coalesce(p_sort,sort), active=coalesce(p_active,active) where id=p_id returning * into v;
  end if;
  return json_build_object('ok', true, 'tab', row_to_json(v));
end; $$;

create or replace function public.admin_delete_home_tab(p_admin_id uuid, p_id uuid)
returns json language plpgsql security definer set search_path to 'public' as $$
begin
  if not _is_admin(p_admin_id) then return json_build_object('ok', false, 'error', 'unauthorized'); end if;
  delete from public.home_tabs where id = p_id;
  return json_build_object('ok', true);
end; $$;

-- بانرات
create or replace function public.admin_save_home_banner(p_admin_id uuid, p_id uuid, p_title text, p_subtitle text, p_cta_label text, p_image text, p_theme text default '#F8CB46', p_tab text default 'all', p_sort integer default 0, p_active boolean default true)
returns json language plpgsql security definer set search_path to 'public' as $$
declare v public.home_banners;
begin
  if not _is_admin(p_admin_id) then return json_build_object('ok', false, 'error', 'unauthorized'); end if;
  if p_id is null then
    insert into public.home_banners (title, subtitle, cta_label, image, theme, tab, sort, active)
      values (p_title, p_subtitle, p_cta_label, p_image, coalesce(p_theme,'#F8CB46'), coalesce(p_tab,'all'), coalesce(p_sort,0), coalesce(p_active,true)) returning * into v;
  else
    update public.home_banners set title=p_title, subtitle=p_subtitle, cta_label=p_cta_label, image=p_image,
      theme=coalesce(p_theme,theme), tab=coalesce(p_tab,tab), sort=coalesce(p_sort,sort), active=coalesce(p_active,active) where id=p_id returning * into v;
  end if;
  return json_build_object('ok', true, 'banner', row_to_json(v));
end; $$;

create or replace function public.admin_delete_home_banner(p_admin_id uuid, p_id uuid)
returns json language plpgsql security definer set search_path to 'public' as $$
begin
  if not _is_admin(p_admin_id) then return json_build_object('ok', false, 'error', 'unauthorized'); end if;
  delete from public.home_banners where id = p_id;
  return json_build_object('ok', true);
end; $$;

-- ربط فئة بمجموعة/تبويب/تمييز
create or replace function public.admin_set_category_home(p_admin_id uuid, p_id uuid, p_group uuid, p_tab text, p_featured boolean default null)
returns json language plpgsql security definer set search_path to 'public' as $$
begin
  if not _is_admin(p_admin_id) then return json_build_object('ok', false, 'error', 'unauthorized'); end if;
  update public.categories set home_group = p_group, home_tab = coalesce(p_tab, home_tab),
    home_featured = coalesce(p_featured, home_featured) where id = p_id;
  return json_build_object('ok', true);
end; $$;

-- إعدادات الواجهة
create or replace function public.admin_set_storefront(p_admin_id uuid, p_delivery_minutes integer default null, p_show_stores boolean default null, p_show_bundles boolean default null, p_welcome_title text default null, p_welcome_subtitle text default null)
returns json language plpgsql security definer set search_path to 'public' as $$
begin
  if not _is_admin(p_admin_id) then return json_build_object('ok', false, 'error', 'unauthorized'); end if;
  update public.app_settings set
    sf_delivery_minutes = coalesce(p_delivery_minutes, sf_delivery_minutes),
    sf_show_stores      = coalesce(p_show_stores, sf_show_stores),
    sf_show_bundles     = coalesce(p_show_bundles, sf_show_bundles),
    sf_welcome_title    = coalesce(nullif(btrim(coalesce(p_welcome_title,'')),''), sf_welcome_title),
    sf_welcome_subtitle = coalesce(nullif(btrim(coalesce(p_welcome_subtitle,'')),''), sf_welcome_subtitle),
    updated_at = now()
  where id = 1;
  return json_build_object('ok', true);
end; $$;

-- ── 7) صلاحيات التنفيذ (تُستدعى بمفتاح anon؛ دوال الأدمن محميّة بـ _is_admin) ──
grant execute on function public.get_home_layout()                          to anon, authenticated;
grant execute on function public.admin_list_home(uuid)                       to anon, authenticated;
grant execute on function public.admin_save_home_group(uuid,uuid,text,text,integer,boolean)        to anon, authenticated;
grant execute on function public.admin_delete_home_group(uuid,uuid)          to anon, authenticated;
grant execute on function public.admin_save_home_tab(uuid,uuid,text,text,text,text,integer,boolean) to anon, authenticated;
grant execute on function public.admin_delete_home_tab(uuid,uuid)            to anon, authenticated;
grant execute on function public.admin_save_home_banner(uuid,uuid,text,text,text,text,text,text,integer,boolean) to anon, authenticated;
grant execute on function public.admin_delete_home_banner(uuid,uuid)         to anon, authenticated;
grant execute on function public.admin_set_category_home(uuid,uuid,uuid,text,boolean) to anon, authenticated;
grant execute on function public.admin_set_storefront(uuid,integer,boolean,boolean,text,text) to anon, authenticated;

-- تم ✓  افتح /admin ← «واجهة Blinkit» للتحكّم، وعايِن على /blinkit?real=1
