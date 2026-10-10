-- =====================================================================
-- CarLog update: driver accounts + vehicle photos
-- For people who ALREADY ran the first version of schema.sql.
-- Run once: SQL Editor > New query > paste > Run. (Fresh installs: skip this, use schema.sql.)
-- Your existing vehicles, drivers and records are kept.
-- =====================================================================

alter table vehicles add column if not exists photo_path text;

alter table drivers add column if not exists phone text;
alter table drivers add column if not exists user_id uuid unique references auth.users (id) on delete set null;
alter table drivers add column if not exists status text not null default 'active' check (status in ('pending', 'active', 'removed'));
update drivers set status = case when is_active then 'active' else 'removed' end;
alter table drivers drop column is_active;

-- Old "first user becomes administrator" rule is replaced (see make_admin below)
drop trigger if exists on_auth_user_created_admin on auth.users;
drop function if exists make_first_user_admin();
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists take_vehicle(uuid, uuid);
drop function if exists return_vehicle(uuid, uuid);
drop view if exists movement_log;

drop policy if exists "admin reads vehicles" on vehicles;
drop policy if exists "admin adds vehicles" on vehicles;
drop policy if exists "admin edits vehicles" on vehicles;
drop policy if exists "admin reads drivers" on drivers;
drop policy if exists "admin adds drivers" on drivers;
drop policy if exists "admin edits drivers" on drivers;
drop policy if exists "admin reads movements" on movements;
drop policy if exists "see vehicles" on vehicles;
drop policy if exists "see drivers" on drivers;
drop policy if exists "see movements" on movements;
drop policy if exists "admin uploads vehicle photos" on storage.objects;
drop policy if exists "admin replaces vehicle photos" on storage.objects;
drop policy if exists "admin deletes vehicle photos" on storage.objects;

-- ---------- Who is this person? ----------
create or replace function is_admin() returns boolean
language sql security definer stable set search_path = public as $$
  select exists (select 1 from admins where user_id = auth.uid());
$$;

-- The driver record of the signed-in person, only if the administrator has approved them.
create or replace function current_driver_id() returns uuid
language sql security definer stable set search_path = public as $$
  select id from drivers where user_id = auth.uid() and status = 'active';
$$;

create or replace function my_profile()
returns table (role text, driver_id uuid, driver_name text)
language sql security definer stable set search_path = public as $$
  select 'admin'::text, null::uuid, null::text
   where exists (select 1 from admins where user_id = auth.uid())
  union all
  select case d.status when 'active' then 'driver' when 'pending' then 'pending' else 'none' end, d.id, d.name
    from drivers d
   where d.user_id = auth.uid()
     and not exists (select 1 from admins where user_id = auth.uid())
  limit 1;
$$;

-- ---------- Anyone who signs up becomes a PENDING driver ----------
create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into drivers (name, phone, user_id, status)
  values (
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), new.email, 'New driver'),
    nullif(trim(new.raw_user_meta_data ->> 'phone'), ''),
    new.id,
    'pending'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Run once, by you, in the SQL Editor to make the administrator:  select make_admin('you@example.com');
create or replace function make_admin(p_email text) returns text
language plpgsql security definer set search_path = public as $$
declare
  uid uuid;
begin
  select id into uid from auth.users where lower(email) = lower(trim(p_email));
  if uid is null then raise exception 'No user with that email. Create the user first (Authentication > Users).'; end if;
  insert into admins (user_id) values (uid) on conflict do nothing;
  delete from drivers where user_id = uid;
  return 'Done. ' || p_email || ' is now the administrator.';
end;
$$;
revoke execute on function make_admin(text) from public, anon, authenticated;

-- ---------- Take and return (the only way to write movements) ----------
-- Administrator: chooses the driver. Approved driver: always themselves.
create or replace function take_vehicle(p_vehicle uuid, p_driver uuid default null)
returns table (out_vehicle text, out_person text, out_at timestamptz)
language plpgsql security definer set search_path = public as $$
declare
  v vehicles;
  d drivers;
  m movements;
  who uuid;
begin
  if is_admin() then
    who := p_driver;
    if who is null then raise exception 'Choose who is taking it.'; end if;
  else
    who := current_driver_id();
    if who is null then raise exception 'Your account is not approved yet. Please ask the administrator.'; end if;
  end if;

  select * into v from vehicles where id = p_vehicle for update;
  if not found or not v.is_active then raise exception 'That vehicle is not on the list.'; end if;

  select * into d from drivers where id = who;
  if not found or d.status <> 'active' then raise exception 'That driver is not on the list.'; end if;

  if exists (select 1 from movements where vehicle_id = p_vehicle and returned_at is null) then
    raise exception 'This vehicle is already out. Use Return a Vehicle when it comes back.';
  end if;

  insert into movements (vehicle_id, driver_id) values (p_vehicle, who) returning * into m;
  return query select v.name, d.name, m.taken_at;
end;
$$;

create or replace function return_vehicle(p_movement uuid, p_returned_by uuid default null)
returns table (out_vehicle text, out_person text, out_at timestamptz)
language plpgsql security definer set search_path = public as $$
declare
  m movements;
  v vehicles;
  d drivers;
  who uuid;
begin
  if is_admin() then
    who := p_returned_by;
    if who is null then raise exception 'Choose who returned it.'; end if;
  else
    who := current_driver_id();
    if who is null then raise exception 'Your account is not approved yet. Please ask the administrator.'; end if;
  end if;

  select * into m from movements where id = p_movement for update;
  if not found then raise exception 'That record was not found.'; end if;
  if m.returned_at is not null then raise exception 'This vehicle has already been returned.'; end if;

  select * into d from drivers where id = who;
  if not found or d.status = 'pending' then raise exception 'That person is not on the list.'; end if;

  update movements set returned_by = who, returned_at = now() where id = p_movement returning * into m;
  select * into v from vehicles where id = m.vehicle_id;
  return query select v.name, d.name, m.returned_at;
end;
$$;

-- ---------- What drivers and the administrator see on the dashboard ----------
create or replace function fleet_status()
returns table (id uuid, name text, plate_number text, photo_path text, is_out boolean,
               movement_id uuid, taken_by_id uuid, taken_by_name text, taken_at timestamptz)
language sql security definer stable set search_path = public as $$
  select v.id, v.name, v.plate_number, v.photo_path, (m.id is not null),
         m.id, d.id, d.name, m.taken_at
    from vehicles v
    left join movements m on m.vehicle_id = v.id and m.returned_at is null
    left join drivers d on d.id = m.driver_id
   where (v.is_active or m.id is not null)
     and (is_admin() or current_driver_id() is not null)
   order by v.name;
$$;

-- A driver's own trips (taken or returned by them)
create or replace function my_trips(p_limit int default 100)
returns table (id uuid, vehicle_name text, plate_number text, photo_path text, driver_name text,
               taken_at timestamptz, returned_by_name text, returned_at timestamptz, status text)
language sql security definer stable set search_path = public as $$
  select m.id, v.name, v.plate_number, v.photo_path, d.name, m.taken_at, r.name, m.returned_at,
         case when m.returned_at is null then 'Out' else 'Returned' end
    from movements m
    join vehicles v on v.id = m.vehicle_id
    join drivers d on d.id = m.driver_id
    left join drivers r on r.id = m.returned_by
   where current_driver_id() is not null
     and (m.driver_id = current_driver_id() or m.returned_by = current_driver_id())
   order by m.taken_at desc
   limit least(coalesce(p_limit, 100), 200);
$$;

revoke execute on function take_vehicle(uuid, uuid) from public, anon;
revoke execute on function return_vehicle(uuid, uuid) from public, anon;
revoke execute on function fleet_status() from public, anon;
revoke execute on function my_trips(int) from public, anon;
revoke execute on function my_profile() from public, anon;
grant execute on function take_vehicle(uuid, uuid) to authenticated;
grant execute on function return_vehicle(uuid, uuid) to authenticated;
grant execute on function fleet_status() to authenticated;
grant execute on function my_trips(int) to authenticated;
grant execute on function my_profile() to authenticated;

-- ---------- Readable history for the administrator ----------
create view movement_log with (security_invoker = true) as
select
  m.id,
  m.vehicle_id,
  v.name           as vehicle_name,
  v.plate_number,
  v.photo_path,
  m.driver_id,
  d.name           as driver_name,
  m.taken_at,
  m.returned_by,
  r.name           as returned_by_name,
  m.returned_at,
  case when m.returned_at is null then 'Out' else 'Returned' end as status
from movements m
join vehicles v on v.id = m.vehicle_id
join drivers d on d.id = m.driver_id
left join drivers r on r.id = m.returned_by;

-- ---------- Security rules ----------
alter table vehicles enable row level security;
alter table drivers enable row level security;
alter table movements enable row level security;
alter table admins enable row level security;

create policy "see vehicles" on vehicles for select using (is_admin() or current_driver_id() is not null);
create policy "admin adds vehicles" on vehicles for insert with check (is_admin());
create policy "admin edits vehicles" on vehicles for update using (is_admin()) with check (is_admin());

create policy "see drivers" on drivers for select using (is_admin() or user_id = auth.uid());
create policy "admin adds drivers" on drivers for insert with check (is_admin());
create policy "admin edits drivers" on drivers for update using (is_admin()) with check (is_admin());

-- Movements can be read, but never written or deleted directly: only take_vehicle / return_vehicle
-- can change them, so times are always the server's clock and history cannot be edited.
create policy "see movements" on movements for select using (
  is_admin() or driver_id = current_driver_id() or returned_by = current_driver_id()
);

-- admins table: no policies on purpose, nobody can read or change it from the app.

-- ---------- Vehicle photos ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('vehicle-photos', 'vehicle-photos', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "admin uploads vehicle photos" on storage.objects for insert
  with check (bucket_id = 'vehicle-photos' and is_admin());
create policy "admin replaces vehicle photos" on storage.objects for update
  using (bucket_id = 'vehicle-photos' and is_admin()) with check (bucket_id = 'vehicle-photos' and is_admin());
create policy "admin deletes vehicle photos" on storage.objects for delete
  using (bucket_id = 'vehicle-photos' and is_admin());

-- =====================================================================
-- =====================================================================

-- Done. Your existing administrator keeps working. Anyone who signs up from now on
-- waits as "pending" until you approve them in the app (Cars and drivers page).
