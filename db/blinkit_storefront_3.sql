-- ════════════════════════════════════════════════════════════════════════
--  اطلبها · تحكّم واجهة Blinkit — إضافة (٣): المزايا الجديدة القابلة للتحكّم
--  شغّله مرّة واحدة في Supabase ← SQL Editor (بعد الملفّين ١ و ٢). آمن للإعادة.
--
--  يضيف تحكّماً كاملاً من /admin ← «واجهة Blinkit» لـ:
--   1) لوحة الإعلانات   (home_ads)      → بطاقات .bk-ad
--   2) الشريط الترويجي  (sf_promo_*)    → شريط ⚡ العلوي
--   3) ثيمات التبويبات  (home_tabs.theme_json) → ألوان/تلميحات/هيرو كل تبويب
--   4) كولاج الأكثر مبيعاً (home_collages) → شبكة bk-bs
--   5) صفوف المنتجات    (home_rails)     → كل ProductRow (مصدر قابل للاختيار)
--  آمن وقابل لإعادة التشغيل: IF NOT EXISTS / create or replace / on conflict.
-- ════════════════════════════════════════════════════════════════════════

-- ── 1) أعمدة جديدة ──
alter table public.home_tabs    add column if not exists theme_json      jsonb;   -- ثيم مخصّص لكل تبويب
alter table public.app_settings add column if not exists sf_promo_enabled boolean default true;
alter table public.app_settings add column if not exists sf_promo_text    text;

-- ── 2) جداول المزايا الجديدة ──
-- لوحة الإعلانات: بطاقة إعلان (عنوان/وصف/زر/إيموجي/صورة/تدرّج/لون نص) لكل تبويب
create table if not exists public.home_ads (
  id         uuid primary key default gen_random_uuid(),
  title      text,
  subtitle   text,
  cta_label  text,
  emoji      text,
  image      text,
  bg         text,        -- خلفية CSS (تدرّج/لون)
  fg         text,        -- لون النص
  tab        text default 'all',
  sort       integer default 0,
  active     boolean default true,
  created_at timestamptz default now()
);

-- كولاج الأكثر مبيعاً: كل صفّ = بطاقة (٤ إيموجي + عدّاد «المزيد» + فئة للفتح)
create table if not exists public.home_collages (
  id         uuid primary key default gen_random_uuid(),
  title      text not null,
  emojis     jsonb   default '[]'::jsonb,   -- حتى ٤ إيموجي
  more_count integer default 0,
  cat_name   text,        -- فئة تُفتح عند الضغط (اختياري)
  tab        text default 'all',
  sort       integer default 0,
  active     boolean default true,
  created_at timestamptz default now()
);

-- صفوف المنتجات: عنوان + مصدر (الأكثر مبيعاً/عروض/فئة/يدوي) لكل تبويب
create table if not exists public.home_rails (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  subtitle    text,
  source      text default 'bestsellers',   -- bestsellers | deals | category | manual
  cat_name    text,                          -- عند source='category'
  product_ids jsonb default '[]'::jsonb,     -- عند source='manual' (مصفوفة معرّفات)
  tab         text default 'all',
  sort        integer default 0,
  active      boolean default true,
  created_at  timestamptz default now()
);

-- ── 3) RLS: قراءة عامّة (الكتابة عبر دوال SECURITY DEFINER فقط) ──
alter table public.home_ads      enable row level security;
alter table public.home_collages enable row level security;
alter table public.home_rails    enable row level security;

drop policy if exists home_ads_read      on public.home_ads;
drop policy if exists home_collages_read  on public.home_collages;
drop policy if exists home_rails_read     on public.home_rails;
create policy home_ads_read      on public.home_ads      for select using (true);
create policy home_collages_read on public.home_collages for select using (true);
create policy home_rails_read    on public.home_rails    for select using (true);

-- ════════════════════════════════════════════════════════════════════════
--  4) القراءة العامّة: get_home_layout (يُعاد تعريفها لتشمل الجديد)
-- ════════════════════════════════════════════════════════════════════════
create or replace function public.get_home_layout()
returns json language sql security definer set search_path to 'public' as $$
  select json_build_object(
    'tabs',    coalesce((select json_agg(t order by t.sort, t.created_at)
                         from public.home_tabs t where t.active), '[]'::json),
    'groups',  coalesce((select json_agg(g order by g.sort, g.created_at)
                         from public.home_groups g where g.active), '[]'::json),
    'banners', coalesce((select json_agg(b order by b.sort, b.created_at)
                         from public.home_banners b where b.active), '[]'::json),
    'ads',     coalesce((select json_agg(a order by a.sort, a.created_at)
                         from public.home_ads a where a.active), '[]'::json),
    'collages',coalesce((select json_agg(c order by c.sort, c.created_at)
                         from public.home_collages c where c.active), '[]'::json),
    'rails',   coalesce((select json_agg(r order by r.sort, r.created_at)
                         from public.home_rails r where r.active), '[]'::json),
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
                  'welcome_subtitle', s.sf_welcome_subtitle,
                  'header_image',     s.sf_header_image,
                  'header_video',     s.sf_header_video,
                  'header_overlay',   coalesce(s.sf_header_overlay, 0.18),
                  'promo_enabled',    coalesce(s.sf_promo_enabled, true),
                  'promo_text',       s.sf_promo_text)
                from public.app_settings s where s.id = 1)
  );
$$;

-- قائمة الأدمن الكاملة (تشمل غير المفعّل) — تُعاد لتشمل الجديد
create or replace function public.admin_list_home(p_admin_id uuid)
returns json language plpgsql security definer set search_path to 'public' as $$
begin
  if not _is_admin(p_admin_id) then return json_build_object('ok', false, 'error', 'unauthorized'); end if;
  return json_build_object('ok', true,
    'tabs',    coalesce((select json_agg(t order by t.sort, t.created_at) from public.home_tabs t), '[]'::json),
    'groups',  coalesce((select json_agg(g order by g.sort, g.created_at) from public.home_groups g), '[]'::json),
    'banners', coalesce((select json_agg(b order by b.sort, b.created_at) from public.home_banners b), '[]'::json),
    'ads',     coalesce((select json_agg(a order by a.sort, a.created_at) from public.home_ads a), '[]'::json),
    'collages',coalesce((select json_agg(c order by c.sort, c.created_at) from public.home_collages c), '[]'::json),
    'rails',   coalesce((select json_agg(r order by r.sort, r.created_at) from public.home_rails r), '[]'::json));
end; $$;

-- ════════════════════════════════════════════════════════════════════════
--  5) تحكّم الأدمن (نفس نمط الحماية: _is_admin + security definer)
-- ════════════════════════════════════════════════════════════════════════

-- ── لوحة الإعلانات ──
create or replace function public.admin_save_home_ad(
  p_admin_id uuid, p_id uuid, p_title text, p_subtitle text, p_cta_label text,
  p_emoji text, p_image text, p_bg text, p_fg text,
  p_tab text default 'all', p_sort integer default 0, p_active boolean default true)
returns json language plpgsql security definer set search_path to 'public' as $$
declare v public.home_ads;
begin
  if not _is_admin(p_admin_id) then return json_build_object('ok', false, 'error', 'unauthorized'); end if;
  if coalesce(btrim(p_title),'')='' and coalesce(btrim(p_emoji),'')='' and coalesce(btrim(p_image),'')='' then
    return json_build_object('ok', false, 'error', 'empty_ad'); end if;
  if p_id is null then
    insert into public.home_ads (title, subtitle, cta_label, emoji, image, bg, fg, tab, sort, active)
      values (p_title, p_subtitle, p_cta_label, p_emoji, p_image, p_bg, p_fg,
              coalesce(p_tab,'all'), coalesce(p_sort,0), coalesce(p_active,true)) returning * into v;
  else
    update public.home_ads set title=p_title, subtitle=p_subtitle, cta_label=p_cta_label,
      emoji=p_emoji, image=p_image, bg=p_bg, fg=p_fg, tab=coalesce(p_tab,tab),
      sort=coalesce(p_sort,sort), active=coalesce(p_active,active) where id=p_id returning * into v;
  end if;
  return json_build_object('ok', true, 'ad', row_to_json(v));
end; $$;

create or replace function public.admin_delete_home_ad(p_admin_id uuid, p_id uuid)
returns json language plpgsql security definer set search_path to 'public' as $$
begin
  if not _is_admin(p_admin_id) then return json_build_object('ok', false, 'error', 'unauthorized'); end if;
  delete from public.home_ads where id = p_id;
  return json_build_object('ok', true);
end; $$;

-- ── كولاج الأكثر مبيعاً ──
create or replace function public.admin_save_home_collage(
  p_admin_id uuid, p_id uuid, p_title text, p_emojis jsonb, p_more_count integer,
  p_cat_name text, p_tab text default 'all', p_sort integer default 0, p_active boolean default true)
returns json language plpgsql security definer set search_path to 'public' as $$
declare v public.home_collages;
begin
  if not _is_admin(p_admin_id) then return json_build_object('ok', false, 'error', 'unauthorized'); end if;
  if coalesce(btrim(p_title),'')='' then return json_build_object('ok', false, 'error', 'title_required'); end if;
  if p_id is null then
    insert into public.home_collages (title, emojis, more_count, cat_name, tab, sort, active)
      values (btrim(p_title), coalesce(p_emojis,'[]'::jsonb), coalesce(p_more_count,0),
              nullif(btrim(coalesce(p_cat_name,'')),''), coalesce(p_tab,'all'),
              coalesce(p_sort,0), coalesce(p_active,true)) returning * into v;
  else
    update public.home_collages set title=btrim(p_title), emojis=coalesce(p_emojis,emojis),
      more_count=coalesce(p_more_count,more_count), cat_name=nullif(btrim(coalesce(p_cat_name,'')),''),
      tab=coalesce(p_tab,tab), sort=coalesce(p_sort,sort), active=coalesce(p_active,active)
      where id=p_id returning * into v;
  end if;
  return json_build_object('ok', true, 'collage', row_to_json(v));
end; $$;

create or replace function public.admin_delete_home_collage(p_admin_id uuid, p_id uuid)
returns json language plpgsql security definer set search_path to 'public' as $$
begin
  if not _is_admin(p_admin_id) then return json_build_object('ok', false, 'error', 'unauthorized'); end if;
  delete from public.home_collages where id = p_id;
  return json_build_object('ok', true);
end; $$;

-- ── صفوف المنتجات ──
create or replace function public.admin_save_home_rail(
  p_admin_id uuid, p_id uuid, p_title text, p_subtitle text, p_source text,
  p_cat_name text, p_product_ids jsonb, p_tab text default 'all',
  p_sort integer default 0, p_active boolean default true)
returns json language plpgsql security definer set search_path to 'public' as $$
declare v public.home_rails;
begin
  if not _is_admin(p_admin_id) then return json_build_object('ok', false, 'error', 'unauthorized'); end if;
  if coalesce(btrim(p_title),'')='' then return json_build_object('ok', false, 'error', 'title_required'); end if;
  if p_id is null then
    insert into public.home_rails (title, subtitle, source, cat_name, product_ids, tab, sort, active)
      values (btrim(p_title), p_subtitle, coalesce(nullif(btrim(coalesce(p_source,'')),''),'bestsellers'),
              nullif(btrim(coalesce(p_cat_name,'')),''), coalesce(p_product_ids,'[]'::jsonb),
              coalesce(p_tab,'all'), coalesce(p_sort,0), coalesce(p_active,true)) returning * into v;
  else
    update public.home_rails set title=btrim(p_title), subtitle=p_subtitle,
      source=coalesce(nullif(btrim(coalesce(p_source,'')),''),source),
      cat_name=nullif(btrim(coalesce(p_cat_name,'')),''), product_ids=coalesce(p_product_ids,product_ids),
      tab=coalesce(p_tab,tab), sort=coalesce(p_sort,sort), active=coalesce(p_active,active)
      where id=p_id returning * into v;
  end if;
  return json_build_object('ok', true, 'rail', row_to_json(v));
end; $$;

create or replace function public.admin_delete_home_rail(p_admin_id uuid, p_id uuid)
returns json language plpgsql security definer set search_path to 'public' as $$
begin
  if not _is_admin(p_admin_id) then return json_build_object('ok', false, 'error', 'unauthorized'); end if;
  delete from public.home_rails where id = p_id;
  return json_build_object('ok', true);
end; $$;

-- ── ثيم تبويب (theme_json) ──
create or replace function public.admin_set_tab_theme(p_admin_id uuid, p_id uuid, p_theme_json jsonb)
returns json language plpgsql security definer set search_path to 'public' as $$
declare v public.home_tabs;
begin
  if not _is_admin(p_admin_id) then return json_build_object('ok', false, 'error', 'unauthorized'); end if;
  update public.home_tabs set theme_json = p_theme_json where id = p_id returning * into v;
  return json_build_object('ok', true, 'tab', row_to_json(v));
end; $$;

-- ── الشريط الترويجي ──
create or replace function public.admin_set_promo(p_admin_id uuid, p_enabled boolean, p_text text)
returns json language plpgsql security definer set search_path to 'public' as $$
begin
  if not _is_admin(p_admin_id) then return json_build_object('ok', false, 'error', 'unauthorized'); end if;
  update public.app_settings set
    sf_promo_enabled = coalesce(p_enabled, sf_promo_enabled),
    sf_promo_text    = case when p_text is null then sf_promo_text else nullif(btrim(p_text),'') end,
    updated_at = now()
  where id = 1;
  return json_build_object('ok', true);
end; $$;

-- ── 6) صلاحيات التنفيذ ──
grant execute on function public.get_home_layout()   to anon, authenticated;
grant execute on function public.admin_list_home(uuid) to anon, authenticated;
grant execute on function public.admin_save_home_ad(uuid,uuid,text,text,text,text,text,text,text,text,integer,boolean) to anon, authenticated;
grant execute on function public.admin_delete_home_ad(uuid,uuid) to anon, authenticated;
grant execute on function public.admin_save_home_collage(uuid,uuid,text,jsonb,integer,text,text,integer,boolean) to anon, authenticated;
grant execute on function public.admin_delete_home_collage(uuid,uuid) to anon, authenticated;
grant execute on function public.admin_save_home_rail(uuid,uuid,text,text,text,text,jsonb,text,integer,boolean) to anon, authenticated;
grant execute on function public.admin_delete_home_rail(uuid,uuid) to anon, authenticated;
grant execute on function public.admin_set_tab_theme(uuid,uuid,jsonb) to anon, authenticated;
grant execute on function public.admin_set_promo(uuid,boolean,text) to anon, authenticated;

-- تم ✓  افتح /admin ← «واجهة Blinkit»: الإعلانات · الثيمات · الكولاج · الصفوف · الشريط
