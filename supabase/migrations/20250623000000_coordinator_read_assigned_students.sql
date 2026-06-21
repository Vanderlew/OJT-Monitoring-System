-- Allow coordinators to read profiles of students actively assigned to them.

drop policy if exists "Coordinators read assigned students" on public.profiles;
create policy "Coordinators read assigned students"
  on public.profiles
  for select
  to authenticated
  using (
    deleted_at is null
    and exists (
      select 1
      from public.student_coordinator_assignments sca
      where sca.student_id = profiles.id
        and sca.coordinator_id = public.current_profile_id()
        and sca.status = 'active'
    )
  );

notify pgrst, 'reload schema';
