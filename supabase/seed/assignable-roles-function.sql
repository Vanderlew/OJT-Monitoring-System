-- Run in Supabase: SQL Editor → New query → paste → Run
-- Fixes "No roles available" in the Add user modal.

-- ---------------------------------------------------------------------------
-- Assignable roles (excludes admin) — bypasses RLS for signed-in admins
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
      and lower(trim(r.name)) = 'admin'
  );
$$;

grant execute on function public.is_admin() to authenticated;

-- Current user's profile (sidebar name + role)
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
  where p.auth_user_id = auth.uid()
     or lower(trim(p.personal_email)) = lower(trim(auth.jwt() ->> 'email'))
  order by p.id
  limit 1;
$$;

grant execute on function public.get_my_profile() to authenticated;

create or replace function public.get_assignable_roles()
returns table (id bigint, name text)
language sql
security definer
stable
set search_path = public
as $$
  select r.id, r.name
  from public.roles r
  where lower(trim(r.name)) <> 'admin'
    and public.is_admin()
  order by r.id;
$$;

grant execute on function public.get_assignable_roles() to authenticated;

-- Register user profile after Auth account is created (Add user modal)
create or replace function public.register_user_profile(
  p_firstname text,
  p_lastname text,
  p_email text,
  p_auth_user_id uuid,
  p_role_id bigint,
  p_status text default 'pending'
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  role_name text;
  new_id bigint;
begin
  if not public.is_admin() then
    raise exception 'Forbidden: administrators only';
  end if;

  if trim(coalesce(p_firstname, '')) = ''
     or trim(coalesce(p_lastname, '')) = ''
     or trim(coalesce(p_email, '')) = ''
     or p_auth_user_id is null
     or p_role_id is null then
    raise exception 'Missing required fields';
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
  ) then
    raise exception 'A user with this email already exists';
  end if;

  insert into public.profiles (
    firstname,
    lastname,
    personal_email,
    auth_user_id,
    role_id,
    status
  ) values (
    trim(p_firstname),
    trim(p_lastname),
    lower(trim(p_email)),
    p_auth_user_id,
    p_role_id,
    coalesce(nullif(trim(p_status), ''), 'pending')
  )
  returning id into new_id;

  return json_build_object('success', true, 'profile_id', new_id);
end;
$$;

grant execute on function public.register_user_profile(text, text, text, uuid, bigint, text) to authenticated;

-- Optional: allow direct table reads too
alter table public.roles enable row level security;

drop policy if exists "Authenticated users can read roles" on public.roles;
create policy "Authenticated users can read roles"
  on public.roles
  for select
  to authenticated
  using (true);

-- Verify (should list supervisor, student, coordinator — not admin)
select * from public.get_assignable_roles();
