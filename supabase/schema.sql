-- ═══════════════════════════════════════════════════════════════════════════
--  Vaibhav & Mahak — guest database
--  Paste this whole file into the Supabase SQL editor and run it once.
--
--  Security model
--  --------------
--  The website ships with the *anon* key, which anyone can read out of the
--  page source. So the anon role is given NO direct access to the guests
--  table. Row Level Security is on with no permissive policy, which denies
--  everything by default.
--
--  Guests reach their own row only through get_my_details(), a SECURITY
--  DEFINER function that takes a phone number and returns at most one row.
--  That means a visitor can see a guest's details only if they already know
--  that guest's mobile number — they can never list the table.
-- ═══════════════════════════════════════════════════════════════════════════

create extension if not exists pgcrypto;

-- ───────────────────────────── guests ─────────────────────────────

create table if not exists public.guests (
  id            uuid primary key default gen_random_uuid(),

  -- 10 digits, no country code, no spaces. This is the lookup key.
  phone         text not null unique,
  name          text not null,
  salutation    text,
  side          text check (side in ('Bride', 'Groom', 'Both')) default 'Bride',
  grp           text,                       -- Family / Friends / Relatives / Colleagues
  city          text,
  adults        int  not null default 1,
  kids          int  not null default 0,
  diet          text default 'Veg',
  rsvp          text default 'Pending' check (rsvp in ('Pending','Yes','No','Maybe')),

  -- which functions this guest is invited to
  inv_haldi     boolean default false,
  inv_sangeet   boolean default false,
  inv_phere     boolean default false,
  inv_reception boolean default true,

  -- travel
  arrival       date,
  arrival_time  text,
  departure     date,
  mode          text,                       -- Flight / Train / Car / Bus
  travel_detail text,                       -- flight or train number
  pickup        text,                       -- what we've arranged for them

  -- stay
  needs_room    boolean default false,
  hotel         text,
  room_no       text,
  check_in      date,
  check_out     date,
  host_paid     boolean default false,

  -- reception
  table_no      text,

  -- a line written just for this guest, shown at the top of their portal
  message       text,
  notes         text,                       -- private; never sent to the portal

  updated_at    timestamptz not null default now(),
  created_at    timestamptz not null default now()
);

create index if not exists guests_phone_idx on public.guests (phone);

-- ───────────────────────────── photo albums ─────────────────────────────

create table if not exists public.albums (
  id         uuid primary key default gen_random_uuid(),
  title      text not null,
  function_id text,                          -- haldi / sangeet / phere / reception
  url        text not null,                  -- Google Photos / Drive shared link
  cover_url  text,
  photo_count int default 0,
  is_public  boolean default true,           -- false = only shown to invited guests
  sort_order int default 0,
  created_at timestamptz not null default now()
);

-- ───────────────────────────── announcements ─────────────────────────────
-- Short notes the couple can push to every guest's portal, newest first.

create table if not exists public.announcements (
  id         uuid primary key default gen_random_uuid(),
  title      text not null,
  body       text,
  is_live    boolean default true,
  created_at timestamptz not null default now()
);

-- ───────────────────────────── rsvp inbox ─────────────────────────────
-- Replies from the public form, from people who may not be in guests yet.

create table if not exists public.rsvps (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  phone         text,
  city          text,
  side          text,
  attending     text,
  adults        int default 0,
  kids          int default 0,
  functions     text[],
  diet          text,
  arrival       date,
  mode          text,
  travel_detail text,
  notes         text,
  merged        boolean default false,
  created_at    timestamptz not null default now()
);

-- ═══════════════════════ row level security ═══════════════════════
-- On, with no policies for anon. Everything must go through the
-- SECURITY DEFINER functions below.

alter table public.guests        enable row level security;
alter table public.albums        enable row level security;
alter table public.announcements enable row level security;
alter table public.rsvps         enable row level security;

-- Take away the blanket grants Supabase hands to anon by default.
revoke all on public.guests        from anon, authenticated;
revoke all on public.rsvps         from anon, authenticated;
revoke all on public.albums        from anon, authenticated;
revoke all on public.announcements from anon, authenticated;

-- ═══════════════════════ normalisation helper ═══════════════════════
-- Accepts +91 98765 43210, 098765-43210, 9876543210 → 9876543210

create or replace function public.norm_phone(p text)
returns text
language sql
immutable
as $$
  select case
    when d is null then null
    when length(d) > 10 then right(d, 10)
    else d
  end
  from (select regexp_replace(coalesce(p, ''), '\D', '', 'g') as d) s;
$$;

-- Keep stored numbers normalised no matter how they were typed or imported.
create or replace function public.guests_normalise()
returns trigger
language plpgsql
as $$
begin
  new.phone := public.norm_phone(new.phone);
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists guests_normalise_trg on public.guests;
create trigger guests_normalise_trg
  before insert or update on public.guests
  for each row execute function public.guests_normalise();

-- ═══════════════════════ the guest lookup ═══════════════════════
-- Returns at most one row, and deliberately omits `notes`.

create or replace function public.get_my_details(p_phone text)
returns table (
  name text, salutation text, side text, grp text, city text,
  adults int, kids int, diet text, rsvp text,
  inv_haldi boolean, inv_sangeet boolean,
  inv_phere boolean, inv_reception boolean,
  arrival date, arrival_time text, departure date,
  mode text, travel_detail text, pickup text,
  needs_room boolean, hotel text, room_no text,
  check_in date, check_out date, host_paid boolean,
  table_no text, message text
)
language sql
security definer
set search_path = public
as $$
  select g.name, g.salutation, g.side, g.grp, g.city,
         g.adults, g.kids, g.diet, g.rsvp,
         g.inv_haldi, g.inv_sangeet, g.inv_phere, g.inv_reception,
         g.arrival, g.arrival_time, g.departure,
         g.mode, g.travel_detail, g.pickup,
         g.needs_room, g.hotel, g.room_no,
         g.check_in, g.check_out, g.host_paid,
         g.table_no, g.message
  from public.guests g
  where g.phone = public.norm_phone(p_phone)
  limit 1;
$$;

-- ═══════════════════════ guest self-service RSVP ═══════════════════════
-- A guest who knows their own number may correct their own reply.
-- Note it cannot touch room_no, table_no or host_paid.

create or replace function public.update_my_rsvp(
  p_phone   text,
  p_rsvp    text,
  p_adults  int,
  p_kids    int,
  p_diet    text,
  p_notes   text default null
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  n text := public.norm_phone(p_phone);
  hit int;
begin
  if p_rsvp not in ('Yes', 'No', 'Maybe', 'Pending') then
    raise exception 'invalid rsvp value';
  end if;
  if p_adults < 0 or p_adults > 30 or p_kids < 0 or p_kids > 30 then
    raise exception 'implausible party size';
  end if;

  update public.guests g
     set rsvp   = p_rsvp,
         adults = p_adults,
         kids   = p_kids,
         diet   = coalesce(p_diet, g.diet),
         notes  = case
                    when p_notes is null or p_notes = '' then g.notes
                    else coalesce(g.notes || E'\n', '') || 'Guest: ' || left(p_notes, 500)
                  end
   where g.phone = n;

  get diagnostics hit = row_count;
  return hit > 0;
end;
$$;

-- ═══════════════════════ albums & announcements ═══════════════════════

create or replace function public.get_albums()
returns table (title text, function_id text, url text, cover_url text, photo_count int)
language sql
security definer
set search_path = public
as $$
  select a.title, a.function_id, a.url, a.cover_url, a.photo_count
  from public.albums a
  where a.is_public
  order by a.sort_order, a.created_at;
$$;

create or replace function public.get_announcements()
returns table (title text, body text, created_at timestamptz)
language sql
security definer
set search_path = public
as $$
  select n.title, n.body, n.created_at
  from public.announcements n
  where n.is_live
  order by n.created_at desc
  limit 8;
$$;

-- ═══════════════════════ public RSVP submission ═══════════════════════
-- Write-only: the caller gets back nothing but success, so the inbox
-- cannot be read by visitors.

create or replace function public.submit_rsvp(
  p_name text, p_phone text, p_city text, p_side text, p_attending text,
  p_adults int, p_kids int, p_functions text[], p_diet text,
  p_arrival date, p_mode text, p_travel_detail text, p_notes text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(trim(p_name), '') = '' then
    raise exception 'name is required';
  end if;

  insert into public.rsvps (
    name, phone, city, side, attending, adults, kids,
    functions, diet, arrival, mode, travel_detail, notes
  ) values (
    left(trim(p_name), 120), public.norm_phone(p_phone), left(coalesce(p_city, ''), 80),
    left(coalesce(p_side, ''), 20), left(coalesce(p_attending, ''), 80),
    greatest(0, least(30, coalesce(p_adults, 0))),
    greatest(0, least(30, coalesce(p_kids, 0))),
    p_functions, left(coalesce(p_diet, ''), 40), p_arrival,
    left(coalesce(p_mode, ''), 30), left(coalesce(p_travel_detail, ''), 120),
    left(coalesce(p_notes, ''), 1000)
  );

  -- If they're already on the list, mirror the reply onto their row.
  update public.guests g
     set rsvp = case
                  when p_attending ilike 'yes%' then 'Yes'
                  when p_attending ilike '%cannot%' then 'No'
                  else 'Maybe'
                end
   where g.phone = public.norm_phone(p_phone)
     and public.norm_phone(p_phone) is not null
     and public.norm_phone(p_phone) <> '';

  return true;
end;
$$;

-- ═══════════════════════ grants ═══════════════════════
-- Only these five functions are reachable with the anon key.

revoke all on function public.get_my_details(text)   from public;
revoke all on function public.update_my_rsvp(text, text, int, int, text, text) from public;
revoke all on function public.get_albums()           from public;
revoke all on function public.get_announcements()    from public;
revoke all on function public.submit_rsvp(text, text, text, text, text, int, int, text[], text, date, text, text, text) from public;

grant execute on function public.get_my_details(text)   to anon, authenticated;
grant execute on function public.update_my_rsvp(text, text, int, int, text, text) to anon, authenticated;
grant execute on function public.get_albums()           to anon, authenticated;
grant execute on function public.get_announcements()    to anon, authenticated;
grant execute on function public.submit_rsvp(text, text, text, text, text, int, int, text[], text, date, text, text, text) to anon, authenticated;

-- ═══════════════════════ sample rows ═══════════════════════
-- Replace these with the real guest list. Import a CSV from the planner
-- console (Guests → Export CSV) into the Table Editor, or edit by hand.

insert into public.guests (phone, name, salutation, side, grp, city, adults, kids, diet,
  inv_haldi, inv_sangeet, inv_phere, inv_reception,
  arrival, arrival_time, mode, pickup, needs_room, hotel, room_no,
  check_in, check_out, host_paid, table_no, message, rsvp)
values
  ('9876500001', 'Sharma Family', 'Shri & Smt.', 'Bride', 'Family', 'Delhi', 4, 2, 'Veg',
   true, true, true, true,
   '2027-02-01', '06:40', 'Flight', 'Innova at Udaipur airport, 07:00 — driver Kishan, 98290 00001',
   true, 'Hotel Fateh Niwas', '204', '2027-02-01', '2027-02-03', true, 'T-3',
   'Bua, your room is on the lake side as you asked. See you at the haldi!', 'Yes'),
  ('9876500002', 'Ankit Kalra', 'Shri', 'Bride', 'Friends', 'Bengaluru', 1, 0, 'Non-veg',
   true, true, true, true,
   '2027-02-01', '08:20', 'Train', 'Cab from Udaipur City station, 08:45',
   true, 'Hotel Fateh Niwas', '311', '2027-02-01', '2027-02-03', false, 'T-7',
   'You are on sangeet duty — three dances, no excuses.', 'Yes'),
  ('9876500003', 'Bhatnagar Family', 'Shri & Smt.', 'Groom', 'Family', 'Jaipur', 3, 1, 'Jain',
   true, true, true, true,
   '2027-02-01', '07:00', 'Car', 'Self-drive; parking reserved at the venue gate',
   true, 'Hotel Fateh Niwas', '108', '2027-02-01', '2027-02-03', true, 'T-1',
   'Jain thali arranged for all four of you at every meal.', 'Yes')
on conflict (phone) do nothing;

insert into public.announcements (title, body) values
  ('Save the date', 'Haldi and Sangeet on 1 February, Phere on 2 February at 11 am, Reception the same evening at 7 pm. All at one venue in Udaipur.')
on conflict do nothing;
