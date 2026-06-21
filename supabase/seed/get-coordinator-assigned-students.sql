-- Returns assigned students with profile fields for the logged-in coordinator.
-- Run in Supabase SQL Editor (mobile app assigned students list).

create or replace function public.get_coordinator_assigned_students()
returns json
language sql
security definer
stable
set search_path = public
as $$
  select coalesce(json_agg(row_to_json(t)), '[]'::json)
  from (
    select
      sca.id as assignment_id,
      p.id as student_id,
      p.firstname,
      p.lastname,
      p.middle_name,
      p.suffix,
      p.personal_email,
      sy.start_date as school_year_start,
      sy.end_date as school_year_end
    from public.student_coordinator_assignments sca
    inner join public.profiles p on p.id = sca.student_id
    inner join public.school_years sy on sy.id = sca.school_year_id
    where public.is_coordinator()
      and sca.status = 'active'
      and sca.coordinator_id = public.current_profile_id()
      and p.deleted_at is null
    order by sca.assigned_at desc
  ) t;
$$;

grant execute on function public.get_coordinator_assigned_students() to authenticated;

notify pgrst, 'reload schema';
