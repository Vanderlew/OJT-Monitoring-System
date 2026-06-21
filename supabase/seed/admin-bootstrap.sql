-- First-time admin setup (run in Supabase SQL Editor)
-- 1) Seed roles if you have not already (see roles.sql)
-- 2) Create the Auth user in Dashboard: Authentication → Users → Add user
--    Use the SAME email below. Check "Auto confirm user".
-- 3) Replace the email/name placeholders below, then run this script.

-- Optional but recommended: link Auth UUID to profiles
alter table public.profiles
  add column if not exists auth_user_id uuid unique references auth.users(id) on delete set null;

insert into public.profiles (
  firstname,
  lastname,
  personal_email,
  role_id,
  auth_user_id
)
select
  'System',                              -- change first name
  'Admin',                               -- change last name
  'admin@school.edu',                    -- MUST match Auth login email
  r.id,
  u.id
from public.roles r
cross join auth.users u
where r.name = 'admin'
  and u.email = 'admin@school.edu'       -- MUST match Auth user email
  and not exists (
    select 1 from public.profiles p where p.personal_email = 'admin@school.edu'
  );

-- Verify
select
  p.id,
  p.firstname,
  p.lastname,
  p.personal_email,
  p.role_id,
  r.name as role,
  p.auth_user_id
from public.profiles p
left join public.roles r on r.id = p.role_id
where p.personal_email = 'admin@school.edu';
