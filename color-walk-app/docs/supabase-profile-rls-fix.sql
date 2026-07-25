-- Required for Color Walk web uploads.
-- Run this in Supabase Dashboard -> SQL Editor as a project administrator.
-- This file does not contain a service_role key and must not be used in the browser.

grant usage on schema public to authenticated;
grant select, insert, update on public.profiles to authenticated;

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_select_discoverable" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;

create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

create policy "profiles_select_discoverable"
on public.profiles
for select
to authenticated
using (is_discoverable = true);

create policy "profiles_insert_own"
on public.profiles
for insert
to authenticated
with check (auth.uid() = id);

create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

-- Backfill profiles for users who registered before the trigger existed.
insert into public.profiles (id, nickname, public_id, is_discoverable)
select
  users.id,
  coalesce(nullif(split_part(users.email, '@', 1), ''), 'Color Walker'),
  concat('walker-', substring(replace(users.id::text, '-', '') from 1 for 8)),
  true
from auth.users as users
on conflict (id) do nothing;

-- Create the matching public profile automatically for future registrations.
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, nickname, public_id, is_discoverable)
  values (
    new.id,
    coalesce(nullif(split_part(new.email, '@', 1), ''), 'Color Walker'),
    concat('walker-', substring(replace(new.id::text, '-', '') from 1 for 8)),
    true
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_auth_user();
