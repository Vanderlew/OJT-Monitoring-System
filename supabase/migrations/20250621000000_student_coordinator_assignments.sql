-- Student ↔ coordinator assignments (school year scoped)
-- Moves school_year_id off profiles into this link table.

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create or replace function public.current_profile_id()
returns bigint
language sql
security definer
stable
set search_path = public
as $$
  select p.id
  from public.profiles p
  where p.auth_user_id = auth.uid()
     or lower(trim(p.personal_email)) = lower(trim(auth.jwt() ->> 'email'))
  order by p.id
  limit 1;
$$;

grant execute on function public.current_profile_id() to authenticated;

create or replace function public.is_coordinator()
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
      and lower(trim(r.name)) = 'coordinator'
  );
$$;

grant execute on function public.is_coordinator() to authenticated;

create or replace function public.profile_has_role(p_profile_id bigint, p_role_name text)
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
    where p.id = p_profile_id
      and lower(trim(r.name)) = lower(trim(p_role_name))
  );
$$;

grant execute on function public.profile_has_role(bigint, text) to authenticated;

-- ---------------------------------------------------------------------------
-- student_coordinator_assignments
-- ---------------------------------------------------------------------------
create table if not exists public.student_coordinator_assignments (
  id bigint generated always as identity primary key,
  student_id bigint not null references public.profiles(id) on delete cascade,
  coordinator_id bigint not null references public.profiles(id) on delete restrict,
  school_year_id bigint not null references public.school_years(id) on delete restrict,
  status text not null default 'active'
    constraint student_coordinator_assignments_status_check
    check (status in ('active', 'ended')),
  assigned_at timestamptz not null default now(),
  ended_at timestamptz null,
  assigned_by bigint null references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz null,
  constraint student_coordinator_assignments_ended_check
    check (status = 'active' or ended_at is not null),
  constraint student_coordinator_assignments_distinct_pair
    check (student_id <> coordinator_id)
);

create index if not exists student_coordinator_assignments_coordinator_idx
  on public.student_coordinator_assignments (coordinator_id);

create index if not exists student_coordinator_assignments_student_idx
  on public.student_coordinator_assignments (student_id);

create index if not exists student_coordinator_assignments_school_year_idx
  on public.student_coordinator_assignments (school_year_id);

-- One active coordinator per student per school year
create unique index if not exists student_coordinator_assignments_active_unique
  on public.student_coordinator_assignments (student_id, school_year_id)
  where status = 'active';

-- ---------------------------------------------------------------------------
-- Admin: assign / end assignment
-- ---------------------------------------------------------------------------
create or replace function public.assign_student_coordinator(
  p_student_id bigint,
  p_coordinator_id bigint,
  p_school_year_id bigint
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  new_id bigint;
begin
  if not public.is_admin() then
    raise exception 'Forbidden: administrators only';
  end if;

  if p_student_id is null or p_coordinator_id is null or p_school_year_id is null then
    raise exception 'student_id, coordinator_id, and school_year_id are required';
  end if;

  if not public.profile_has_role(p_student_id, 'student') then
    raise exception 'Selected user is not a student';
  end if;

  if not public.profile_has_role(p_coordinator_id, 'coordinator') then
    raise exception 'Selected user is not a coordinator';
  end if;

  if not exists (select 1 from public.school_years sy where sy.id = p_school_year_id) then
    raise exception 'School year does not exist';
  end if;

  -- End any existing active assignment for this student in this school year
  update public.student_coordinator_assignments
  set
    status = 'ended',
    ended_at = now(),
    updated_at = now()
  where student_id = p_student_id
    and school_year_id = p_school_year_id
    and status = 'active';

  insert into public.student_coordinator_assignments (
    student_id,
    coordinator_id,
    school_year_id,
    status,
    assigned_by
  ) values (
    p_student_id,
    p_coordinator_id,
    p_school_year_id,
    'active',
    public.current_profile_id()
  )
  returning id into new_id;

  return json_build_object('success', true, 'assignment_id', new_id);
end;
$$;

grant execute on function public.assign_student_coordinator(bigint, bigint, bigint) to authenticated;

create or replace function public.end_student_coordinator_assignment(p_assignment_id bigint)
returns json
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Forbidden: administrators only';
  end if;

  update public.student_coordinator_assignments
  set
    status = 'ended',
    ended_at = now(),
    updated_at = now()
  where id = p_assignment_id
    and status = 'active';

  if not found then
    raise exception 'Active assignment not found';
  end if;

  return json_build_object('success', true);
end;
$$;

grant execute on function public.end_student_coordinator_assignment(bigint) to authenticated;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.student_coordinator_assignments enable row level security;

drop policy if exists "Admins manage student coordinator assignments"
  on public.student_coordinator_assignments;
create policy "Admins manage student coordinator assignments"
  on public.student_coordinator_assignments
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Coordinators read their assignments"
  on public.student_coordinator_assignments;
create policy "Coordinators read their assignments"
  on public.student_coordinator_assignments
  for select
  to authenticated
  using (
    coordinator_id = public.current_profile_id()
  );

drop policy if exists "Students read own coordinator assignment"
  on public.student_coordinator_assignments;
create policy "Students read own coordinator assignment"
  on public.student_coordinator_assignments
  for select
  to authenticated
  using (
    student_id = public.current_profile_id()
  );

-- ---------------------------------------------------------------------------
-- Remove school_year_id from profiles (now on assignments)
-- ---------------------------------------------------------------------------
alter table public.profiles
  drop constraint if exists profiles_school_year_id_fkey;

alter table public.profiles
  drop column if exists school_year_id;

notify pgrst, 'reload schema';
