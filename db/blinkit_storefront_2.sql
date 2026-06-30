-- ════════════════════════════════════════════════════════════════════════
--  اطلبها · إضافة (٢): خلفية الهيدر (صورة/فيديو) + أيقونات التبويبات كصور
--  شغّله مرّة واحدة في Supabase ← SQL Editor (بعد الملف الأول). آمن للإعادة.
-- ════════════════════════════════════════════════════════════════════════

-- ── أعمدة جديدة ──
alter table public.home_tabs    add column if not exists icon_image      text;
alter table public.app_settings add column if not exists sf_header_image text;
alter table public.app_settings add column if not exists sf_header_video text;
alter table public.app_settings add column if not exists sf_header_overlay numeric default 0.18;

-- ── تحديث دالة حفظ التبويب (إضافة صورة الأيقونة) ──
drop function if exists public.admin_save_home_tab(uuid,uuid,text,text,text,text,integer,boolean);
create or replace function public.admin_save_home_tab(
  p_admin_id uuid, p_id uuid, p_key text, p_label text,
  p_icon text default '🛒', p_icon_image text default null,
  p_theme text default '#F8CB46', p_sort integer default 0, p_active boolean default true)
returns json language plpgsql security definer set search_path to 'public' as $$
declare v public.home_tabs;
begin
  if not _is_admin(p_admin_id) then return json_build_object('ok', false, 'error', 'unauthorized'); end if;
  if coalesce(btrim(p_key),'')='' or coalesce(btrim(p_label),'')='' then return json_build_object('ok', false, 'error', 'key_label_required'); end if;
  if p_id is null then
    insert into public.home_tabs (key, label, icon, icon_image, theme, sort, active)
      values (btrim(p_key), btrim(p_label), coalesce(p_icon,'🛒'), nullif(btrim(coalesce(p_icon_image,'')),''), coalesce(p_theme,'#F8CB46'), coalesce(p_sort,0), coalesce(p_active,true))
      on conflict (key) do update set label=excluded.label, icon=excluded.icon, icon_image=excluded.icon_image, theme=excluded.theme, sort=excluded.sort, active=excluded.active
      returning * into v;
  else
    update public.home_tabs set key=btrim(p_key), label=btrim(p_label), icon=coalesce(p_icon,icon),
      icon_image = nullif(btrim(coalesce(p_icon_image,'')),''),
      theme=coalesce(p_theme,theme), sort=coalesce(p_sort,sort), active=coalesce(p_active,active) where id=p_id returning * into v;
  end if;
  return json_build_object('ok', true, 'tab', row_to_json(v));
end; $$;

-- ── تحديث دالة إعدادات الواجهة (إضافة خلفية الهيدر) ──
drop function if exists public.admin_set_storefront(uuid,integer,boolean,boolean,text,text);
create or replace function public.admin_set_storefront(
  p_admin_id uuid, p_delivery_minutes integer default null, p_show_stores boolean default null,
  p_show_bundles boolean default null, p_welcome_title text default null, p_welcome_subtitle text default null,
  p_header_image text default null, p_header_video text default null, p_header_overlay numeric default null)
returns json language plpgsql security definer set search_path to 'public' as $$
begin
  if not _is_admin(p_admin_id) then return json_build_object('ok', false, 'error', 'unauthorized'); end if;
  update public.app_settings set
    sf_delivery_minutes = coalesce(p_delivery_minutes, sf_delivery_minutes),
    sf_show_stores      = coalesce(p_show_stores, sf_show_stores),
    sf_show_bundles     = coalesce(p_show_bundles, sf_show_bundles),
    sf_welcome_title    = coalesce(nullif(btrim(coalesce(p_welcome_title,'')),''), sf_welcome_title),
    sf_welcome_subtitle = coalesce(nullif(btrim(coalesce(p_welcome_subtitle,'')),''), sf_welcome_subtitle),
    -- صورة/فيديو الهيدر: تمرير سلسلة فارغة '' يمسحها، NULL يتركها كما هي
    sf_header_image     = case when p_header_image is null then sf_header_image else nullif(btrim(p_header_image),'') end,
    sf_header_video     = case when p_header_video is null then sf_header_video else nullif(btrim(p_header_video),'') end,
    sf_header_overlay   = coalesce(p_header_overlay, sf_header_overlay),
    updated_at = now()
  where id = 1;
  return json_build_object('ok', true);
end; $$;

-- ── تحديث القراءة العامّة (إضافة خلفية الهيدر للإعدادات) ──
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
                  'welcome_subtitle', s.sf_welcome_subtitle,
                  'header_image',     s.sf_header_image,
                  'header_video',     s.sf_header_video,
                  'header_overlay',   coalesce(s.sf_header_overlay, 0.18))
                from public.app_settings s where s.id = 1)
  );
$$;

-- ── صلاحيات التنفيذ للتواقيع الجديدة ──
grant execute on function public.get_home_layout()                                              to anon, authenticated;
grant execute on function public.admin_save_home_tab(uuid,uuid,text,text,text,text,text,integer,boolean) to anon, authenticated;
grant execute on function public.admin_set_storefront(uuid,integer,boolean,boolean,text,text,text,text,numeric) to anon, authenticated;

-- تم ✓  ارفع خلفية الهيدر وأيقونات التبويبات من /admin ← «واجهة Blinkit»
