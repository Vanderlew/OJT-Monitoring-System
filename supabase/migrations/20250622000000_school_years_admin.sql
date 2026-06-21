-- Admin RLS for school_years (table already exists in Supabase)

alter table public.school_years enable row level security;

drop policy if exists "School years readable by authenticated" on public.school_years;
create policy "School years readable by authenticated"
  on public.school_years
  for select
  to authenticated
  using (deleted_at is null);

drop policy if exists "Admins manage school years" on public.school_years;
create policy "Admins manage school years"
  on public.school_years
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());
