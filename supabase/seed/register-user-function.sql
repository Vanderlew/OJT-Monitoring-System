-- Run in Supabase SQL Editor → New query → Run
-- Fixes: RLS errors when using Add user in the admin portal

-- ---------------------------------------------------------------------------
-- 0) Required columns
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column if not exists auth_user_id uuid unique references auth.users(id) on delete set null;

alter table public.profiles
  add column if not exists deleted_at timestamptz;

-- ---------------------------------------------------------------------------
-- 1) Admin check (matches by auth uid OR login email)
-- ---------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    join public.roles r on r.id = p.role_id
    where (
      p.auth_user_id = auth.uid()
      or lower(trim(p.personal_email)) = lower(trim(auth.jwt() ->> 'email'))
    )
    and p.deleted_at is null
    and lower(trim(r.name)) = 'admin'
  );
$$;

grant execute on function public.is_admin() to authenticated;

create or replace function public.get_my_profile()
returns json
language sql
security definer
stable
set search_path = public
as $$
  select json_build_object(
    'id', p.id,
    'firstname', p.firstname,
    'lastname', p.lastname,
    'middle_name', p.middle_name,
    'suffix', p.suffix,
    'personal_email', p.personal_email,
    'role_id', p.role_id,
    'auth_user_id', p.auth_user_id,
    'roles', case when r.name is not null then json_build_object('name', r.name) else null end
  )
  from public.profiles p
  left join public.roles r on r.id = p.role_id
  where p.deleted_at is null
    and (
      p.auth_user_id = auth.uid()
      or lower(trim(p.personal_email)) = lower(trim(auth.jwt() ->> 'email'))
    )
  order by p.id
  limit 1;
$$;

grant execute on function public.get_my_profile() to authenticated;

-- ---------------------------------------------------------------------------
-- 2) Register user (admin-only; validates then inserts profile)
--    Uses SECURITY DEFINER so the insert succeeds under Supabase FORCE RLS.
--    Only runs after is_admin() passes — not a public bypass.
-- ---------------------------------------------------------------------------
create or replace function public.register_user_profile(
  p_firstname text,
  p_lastname text,
  p_email text,
  p_auth_user_id uuid,
  p_role_id bigint,
  p_status text default 'pending'
)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  new_id bigint;
  role_name text;
begin
  if not public.is_admin() then
    raise exception 'Forbidden: administrators only';
  end if;

  if trim(coalesce(p_firstname, '')) = ''
     or trim(coalesce(p_lastname, '')) = ''
     or trim(coalesce(p_email, '')) = '' then
    raise exception 'First name, last name, and email are required';
  end if;

  if p_auth_user_id is null then
    raise exception 'Auth user id is required';
  end if;

  select name into role_name from public.roles where id = p_role_id;

  if role_name is null then
    raise exception 'Selected role does not exist';
  end if;

  if lower(trim(role_name)) = 'admin' then
    raise exception 'The admin role cannot be assigned through registration';
  end if;

  if exists (
    select 1 from public.profiles
    where lower(trim(personal_email)) = lower(trim(p_email))
      and deleted_at is null
  ) then
    raise exception 'A user with this email already exists';
  end if;

  -- Required on Supabase when FORCE ROW LEVEL SECURITY is enabled on profiles
  set local row_security = off;

  insert into public.profiles (
    firstname,
    lastname,
    personal_email,
    auth_user_id,
    role_id,
    status
  )
  values (
    trim(p_firstname),
    trim(p_lastname),
    lower(trim(p_email)),
    p_auth_user_id,
    p_role_id,
    coalesce(nullif(trim(p_status), ''), 'pending')
  )
  returning id into new_id;

  return new_id;
end;
$$;

grant execute on function public.register_user_profile(text, text, text, uuid, bigint, text) to authenticated;

-- ---------------------------------------------------------------------------
-- 2b) Update user profile (admin-only)
-- ---------------------------------------------------------------------------
create or replace function public.update_user_profile(
  p_profile_id bigint,
  p_firstname text,
  p_lastname text,
  p_email text,
  p_role_id bigint,
  p_status text
)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  role_name text;
  target_role text;
begin
  if not public.is_admin() then
    raise exception 'Forbidden: administrators only';
  end if;

  if not exists (
    select 1 from public.profiles
    where id = p_profile_id and deleted_at is null
  ) then
    raise exception 'User not found';
  end if;

  if trim(coalesce(p_firstname, '')) = ''
     or trim(coalesce(p_lastname, '')) = ''
     or trim(coalesce(p_email, '')) = '' then
    raise exception 'First name, last name, and email are required';
  end if;

  select r.name into target_role
  from public.profiles p
  join public.roles r on r.id = p.role_id
  where p.id = p_profile_id
    and p.deleted_at is null;

  select name into role_name from public.roles where id = p_role_id;
  if role_name is null then raise exception 'Selected role does not exist'; end if;

  if lower(trim(role_name)) = 'admin' and lower(trim(coalesce(target_role, ''))) <> 'admin' then
    raise exception 'The admin role cannot be assigned through this form';
  end if;

  if exists (
    select 1 from public.profiles
    where lower(trim(personal_email)) = lower(trim(p_email))
      and id <> p_profile_id
      and deleted_at is null
  ) then
    raise exception 'A user with this email already exists';
  end if;

  set local row_security = off;

  update public.profiles
  set
    firstname = trim(p_firstname),
    lastname = trim(p_lastname),
    personal_email = lower(trim(p_email)),
    role_id = p_role_id,
    status = coalesce(nullif(trim(p_status), ''), 'pending'),
    updated_at = now()
  where id = p_profile_id
    and deleted_at is null;

  return p_profile_id;
end;
$$;

grant execute on function public.update_user_profile(bigint, text, text, text, bigint, text) to authenticated;

-- ---------------------------------------------------------------------------
-- 2c) Soft-delete user profile (admin-only; sets deleted_at)
-- ---------------------------------------------------------------------------
create or replace function public.delete_user_profile(p_profile_id bigint)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  target_role text;
begin
  if not public.is_admin() then
    raise exception 'Forbidden: administrators only';
  end if;

  select r.name into target_role
  from public.profiles p
  join public.roles r on r.id = p.role_id
  where p.id = p_profile_id
    and p.deleted_at is null;

  if target_role is null then
    raise exception 'User not found';
  end if;

  if lower(trim(target_role)) = 'admin' then
    raise exception 'Admin accounts cannot be deleted';
  end if;

  if exists (
    select 1 from public.profiles p
    where p.id = p_profile_id
      and (
        p.auth_user_id = auth.uid()
        or lower(trim(p.personal_email)) = lower(trim(auth.jwt() ->> 'email'))
      )
  ) then
    raise exception 'You cannot delete your own account';
  end if;

  set local row_security = off;

  update public.profiles
  set
    deleted_at = now(),
    updated_at = now(),
    status = 'disabled'
  where id = p_profile_id
    and deleted_at is null;

  return p_profile_id;
end;
$$;

grant execute on function public.delete_user_profile(bigint) to authenticated;

-- ---------------------------------------------------------------------------
-- 3) RLS policies
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;

drop policy if exists "Profiles select for admin or self" on public.profiles;
create policy "Profiles select for admin or self"
  on public.profiles
  for select
  to authenticated
  using (
    deleted_at is null
    and (
      public.is_admin()
      or auth_user_id = auth.uid()
      or lower(trim(personal_email)) = lower(trim(auth.jwt() ->> 'email'))
    )
  );

drop policy if exists "Admins can insert profiles" on public.profiles;
create policy "Admins can insert profiles"
  on public.profiles
  for insert
  to authenticated
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- 4) Link YOUR admin account (update uid/email if yours differ)
-- ---------------------------------------------------------------------------
update public.profiles
set
  auth_user_id = '56ea44e6-9c49-42b7-b38b-0f9a98170aff',
  personal_email = 'rajiroperez@gmail.com',
  role_id = (select id from public.roles where name = 'admin')
where id = 1;

-- ---------------------------------------------------------------------------
-- 5) Reload API cache
-- ---------------------------------------------------------------------------
notify pgrst, 'reload schema';

-- Verify admin is recognized (run separately while logged in won't work here,
-- but this confirms the profile row is linked):
select p.id, p.personal_email, p.auth_user_id, r.name as role
from public.profiles p
left join public.roles r on r.id = p.role_id
where p.id = 1;
