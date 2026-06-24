-- ════════════════════════════════════════════════════════════════
--  اطلبها · Otlobha — مخطّط قاعدة البيانات (تسجيل بالهاتف + PIN)
--  شغّله كاملاً مرّة واحدة:  Supabase ← SQL Editor ← New query ← Run
--  آمن لإعادة التشغيل (يحدّث الموجود دون حذف بيانات).
-- ════════════════════════════════════════════════════════════════

-- امتداد التشفير (لتجزئة الـ PIN بأمان)
create extension if not exists pgcrypto;

-- 1) جدول حسابات الزبائن
create table if not exists public.accounts (
  id            uuid primary key default gen_random_uuid(),
  phone         text unique not null,         -- رقم الهاتف بصيغة موحّدة (المفتاح)
  name          text,
  city          text default 'السماوة',
  area          text,
  address       text,
  notes         text,
  pin_hash      text not null,                -- الـ PIN مُجزّأ (لا يُخزَّن صريحاً أبداً)
  verified      boolean not null default false,  -- شارة التوثيق (اختياري لاحقاً)
  points        integer not null default 0,
  referral_code text unique,
  referred_by   uuid references public.accounts (id),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- نحرس الجدول بـ RLS ونمنع الوصول المباشر — كل العمليات تمرّ عبر دوال آمنة أدناه
alter table public.accounts enable row level security;
-- (لا سياسات للقراءة/الكتابة المباشرة → لا أحد يقرأ بيانات غيره عبر الـ API)

-- 2) توليد كود إحالة فريد
create or replace function public.gen_referral_code()
returns text language plpgsql security definer set search_path = public as $$
declare c text;
begin
  loop
    c := upper(substr(md5(random()::text), 1, 6));
    exit when not exists (select 1 from public.accounts where referral_code = c);
  end loop;
  return c;
end $$;

-- صيغة عرض آمنة للحساب (بلا pin_hash) تُعاد للعميل
create or replace function public._account_json(a public.accounts)
returns json language sql as $$
  select json_build_object(
    'id', a.id, 'phone', a.phone, 'name', a.name, 'city', a.city,
    'area', a.area, 'address', a.address, 'notes', a.notes,
    'verified', a.verified, 'points', a.points,
    'referral_code', a.referral_code, 'referred_by', a.referred_by
  );
$$;

-- 3) إنشاء حساب جديد (هاتف + PIN + بيانات) — يرجع الحساب أو خطأ
create or replace function public.account_signup(
  p_phone text, p_pin text, p_name text, p_area text, p_address text, p_ref text default null
) returns json language plpgsql security definer set search_path = public as $$
declare a public.accounts; inviter public.accounts;
begin
  if length(coalesce(p_pin,'')) < 4 then
    return json_build_object('ok', false, 'msg', 'الرمز السري يجب أن يكون 4 أرقام');
  end if;
  if exists (select 1 from public.accounts where phone = p_phone) then
    return json_build_object('ok', false, 'msg', 'هذا الرقم مسجّل مسبقاً — سجّل الدخول');
  end if;

  insert into public.accounts (phone, name, area, address, pin_hash, points, referral_code)
  values (p_phone, p_name, p_area, p_address,
          crypt(p_pin, gen_salt('bf')),    -- تجزئة آمنة
          1000,                            -- نقاط ترحيبية
          public.gen_referral_code())
  returning * into a;

  -- تطبيق كود الإحالة إن وُجد (يمنح الطرفين)
  if p_ref is not null and length(trim(p_ref)) > 0 then
    select * into inviter from public.accounts where referral_code = upper(trim(p_ref));
    if inviter.id is not null and inviter.id <> a.id then
      update public.accounts set referred_by = inviter.id, points = points + 5000, updated_at = now()
        where id = a.id returning * into a;
      update public.accounts set points = points + 5000, updated_at = now()
        where id = inviter.id;
    end if;
  end if;

  return json_build_object('ok', true, 'account', public._account_json(a));
end $$;

-- 4) تسجيل الدخول (هاتف + PIN) — يتحقّق من التجزئة
create or replace function public.account_login(p_phone text, p_pin text)
returns json language plpgsql security definer set search_path = public as $$
declare a public.accounts;
begin
  select * into a from public.accounts where phone = p_phone;
  if a.id is null then
    return json_build_object('ok', false, 'msg', 'لا يوجد حساب بهذا الرقم');
  end if;
  if a.pin_hash <> crypt(p_pin, a.pin_hash) then
    return json_build_object('ok', false, 'msg', 'الرمز السري غير صحيح');
  end if;
  return json_build_object('ok', true, 'account', public._account_json(a));
end $$;

-- 5) جلب الحساب بالـ id (لاستعادة الجلسة المحفوظة على الجهاز)
create or replace function public.account_get(p_id uuid)
returns json language plpgsql security definer set search_path = public as $$
declare a public.accounts;
begin
  select * into a from public.accounts where id = p_id;
  if a.id is null then return json_build_object('ok', false); end if;
  return json_build_object('ok', true, 'account', public._account_json(a));
end $$;

-- 6) تحديث بيانات الحساب (بالـ id كرمز جلسة — لا يطلب PIN كل مرة)
create or replace function public.account_update(
  p_id uuid, p_name text, p_area text, p_address text
) returns json language plpgsql security definer set search_path = public as $$
declare a public.accounts;
begin
  select * into a from public.accounts where id = p_id;
  if a.id is null then
    return json_build_object('ok', false, 'msg', 'غير مصرّح');
  end if;
  update public.accounts set
    name = coalesce(p_name, name),
    area = coalesce(p_area, area),
    address = coalesce(p_address, address),
    updated_at = now()
  where id = p_id returning * into a;
  return json_build_object('ok', true, 'account', public._account_json(a));
end $$;

-- اسمح للعميل (anon) باستدعاء هذه الدوال فقط (وليس الجدول مباشرة)
grant execute on function
  public.account_signup(text,text,text,text,text,text),
  public.account_login(text,text),
  public.account_get(uuid),
  public.account_update(uuid,text,text,text)
to anon, authenticated;
