-- Seed roles for OJT Monitoring System
-- Run in Supabase: SQL Editor → New query → paste → Run
--
-- Use lowercase names so they match the admin app (roles.name = 'admin', etc.)

insert into public.roles (name)
select v.name
from (
  values
    ('admin'),
    ('coordinator'),
    ('student'),
    ('supervisor')
) as v(name)
where not exists (
  select 1
  from public.roles r
  where lower(trim(r.name)) = lower(trim(v.name))
);

-- Verify (note each id — you need admin's id for your profile's role_id)
select id, name, created_at
from public.roles
order by id;
