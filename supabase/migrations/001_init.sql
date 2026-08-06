-- =============================================================================
-- ELIAH PORTAL — Complete Database Init Script
-- Run this in the Supabase SQL Editor for your project.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 0. Extensions
-- ---------------------------------------------------------------------------
create extension if not exists "uuid-ossp";

-- ---------------------------------------------------------------------------
-- 1. Enums
-- ---------------------------------------------------------------------------
do $$ begin
  create type public.user_role as enum ('ADMIN', 'CLIENT');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.request_status as enum (
    'TODO',
    'IN_PROGRESS',
    'IN_REVIEW',
    'COMPLETED'
  );
exception when duplicate_object then null;
end $$;

-- ---------------------------------------------------------------------------
-- 2. Tables
-- ---------------------------------------------------------------------------

-- Organizations (one row per agency tenant + each client org)
create table if not exists public.organizations (
  id         uuid primary key default uuid_generate_v4(),
  name       text not null,
  slug       text unique,
  created_at timestamptz not null default now()
);

-- Users — mirrors auth.users, adds org + role
create table if not exists public.users (
  id         uuid primary key references auth.users (id) on delete cascade,
  org_id     uuid not null references public.organizations (id) on delete cascade,
  role       public.user_role not null default 'CLIENT',
  full_name  text not null default '',
  email      text not null,
  avatar_url text,
  created_at timestamptz not null default now()
);

-- Requests — core work-item table
create table if not exists public.requests (
  id           uuid primary key default uuid_generate_v4(),
  title        text not null,
  description  text,
  status       public.request_status not null default 'TODO',
  client_id    uuid not null references public.users (id) on delete cascade,
  org_id       uuid not null references public.organizations (id) on delete cascade,
  payment_link text,
  priority     text check (priority in ('LOW', 'MEDIUM', 'HIGH')) default 'MEDIUM',
  due_date     date,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Attachments — files uploaded to Supabase Storage
create table if not exists public.attachments (
  id          uuid primary key default uuid_generate_v4(),
  request_id  uuid not null references public.requests (id) on delete cascade,
  file_path   text not null,
  file_name   text not null,
  file_size   bigint,
  mime_type   text,
  uploaded_by uuid not null references public.users (id) on delete set null,
  created_at  timestamptz not null default now()
);

-- Notifications (in-app)
create table if not exists public.notifications (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references public.users (id) on delete cascade,
  org_id     uuid not null references public.organizations (id) on delete cascade,
  title      text not null,
  body       text,
  type       text not null default 'INFO', -- INFO | SUCCESS | WARNING | ERROR
  read       boolean not null default false,
  request_id uuid references public.requests (id) on delete cascade,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 3. Indexes
-- ---------------------------------------------------------------------------
create index if not exists idx_users_org_id      on public.users (org_id);
create index if not exists idx_requests_org_id   on public.requests (org_id);
create index if not exists idx_requests_client   on public.requests (client_id);
create index if not exists idx_requests_status   on public.requests (status);
create index if not exists idx_attachments_req   on public.attachments (request_id);
create index if not exists idx_notifications_user on public.notifications (user_id);

-- ---------------------------------------------------------------------------
-- 4. updated_at auto-update trigger
-- ---------------------------------------------------------------------------
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_requests_updated_at on public.requests;
create trigger set_requests_updated_at
  before update on public.requests
  for each row execute function public.handle_updated_at();

-- ---------------------------------------------------------------------------
-- 5. SECURITY DEFINER helpers (prevent RLS recursion)
-- ---------------------------------------------------------------------------

-- Returns the org_id of the currently-authenticated user
create or replace function public.get_my_org_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select org_id from public.users where id = auth.uid();
$$;

-- Returns the role of the currently-authenticated user
create or replace function public.get_my_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.users where id = auth.uid();
$$;

-- Returns true if the caller is an ADMIN
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select role = 'ADMIN' from public.users where id = auth.uid()), false);
$$;

-- ---------------------------------------------------------------------------
-- 6. Auth trigger — insert public.users row on signup
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  _org_id uuid;
  _full_name text;
  _role public.user_role;
begin
  -- Org id may be passed via raw_user_meta_data (set during org-creation signup)
  _org_id    := (new.raw_user_meta_data ->> 'org_id')::uuid;
  _full_name := coalesce(new.raw_user_meta_data ->> 'full_name', '');
  _role      := coalesce((new.raw_user_meta_data ->> 'role')::public.user_role, 'CLIENT');

  if _org_id is null then
    -- Fallback: this should not happen in normal flows
    raise exception 'org_id is required in user metadata';
  end if;

  insert into public.users (id, org_id, role, full_name, email)
  values (new.id, _org_id, _role, _full_name, new.email);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- 7. Trigger: prevent CLIENT from writing payment_link or status
-- ---------------------------------------------------------------------------
create or replace function public.guard_client_request_write()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Only restrict CLIENT role
  if public.get_my_role() = 'CLIENT' then
    -- Reject attempts to change status
    if new.status is distinct from old.status then
      raise exception 'Clients are not allowed to change request status';
    end if;
    -- Reject attempts to change payment_link
    if new.payment_link is distinct from old.payment_link then
      raise exception 'Clients are not allowed to change payment_link';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists guard_client_request_fields on public.requests;
create trigger guard_client_request_fields
  before update on public.requests
  for each row execute function public.guard_client_request_write();

-- ---------------------------------------------------------------------------
-- 8. Enable Row-Level Security
-- ---------------------------------------------------------------------------
alter table public.organizations  enable row level security;
alter table public.users          enable row level security;
alter table public.requests       enable row level security;
alter table public.attachments    enable row level security;
alter table public.notifications  enable row level security;

-- ---------------------------------------------------------------------------
-- 9. RLS Policies — organizations
-- ---------------------------------------------------------------------------
drop policy if exists "org_select_own" on public.organizations;
create policy "org_select_own"
  on public.organizations for select
  using (id = public.get_my_org_id());

drop policy if exists "org_update_admin" on public.organizations;
create policy "org_update_admin"
  on public.organizations for update
  using (id = public.get_my_org_id() and public.is_admin());

-- ---------------------------------------------------------------------------
-- 10. RLS Policies — users
-- ---------------------------------------------------------------------------
-- Any authenticated user can view members of their own org
drop policy if exists "users_select_own_org" on public.users;
create policy "users_select_own_org"
  on public.users for select
  using (org_id = public.get_my_org_id());

-- Users can update their own profile row
drop policy if exists "users_update_own" on public.users;
create policy "users_update_own"
  on public.users for update
  using (id = auth.uid());

-- ADMIN can insert new users into their org (used by create-client server action)
drop policy if exists "users_insert_admin" on public.users;
create policy "users_insert_admin"
  on public.users for insert
  with check (org_id = public.get_my_org_id() and public.is_admin());

-- ADMIN can delete users in their org
drop policy if exists "users_delete_admin" on public.users;
create policy "users_delete_admin"
  on public.users for delete
  using (org_id = public.get_my_org_id() and public.is_admin());

-- ---------------------------------------------------------------------------
-- 11. RLS Policies — requests
-- ---------------------------------------------------------------------------
-- CLIENT: read only their own requests
drop policy if exists "requests_select_client" on public.requests;
create policy "requests_select_client"
  on public.requests for select
  using (
    (public.get_my_role() = 'CLIENT' and client_id = auth.uid())
    or
    (public.get_my_role() = 'ADMIN' and org_id = public.get_my_org_id())
  );

-- CLIENT: insert own requests
drop policy if exists "requests_insert_client" on public.requests;
create policy "requests_insert_client"
  on public.requests for insert
  with check (
    client_id = auth.uid()
    and org_id = public.get_my_org_id()
  );

-- CLIENT: update own requests (field restriction handled by trigger)
-- ADMIN: update any request in their org
drop policy if exists "requests_update" on public.requests;
create policy "requests_update"
  on public.requests for update
  using (
    (public.get_my_role() = 'CLIENT' and client_id = auth.uid())
    or
    (public.get_my_role() = 'ADMIN' and org_id = public.get_my_org_id())
  );

-- ADMIN only: delete requests
drop policy if exists "requests_delete_admin" on public.requests;
create policy "requests_delete_admin"
  on public.requests for delete
  using (public.get_my_role() = 'ADMIN' and org_id = public.get_my_org_id());

-- ---------------------------------------------------------------------------
-- 12. RLS Policies — attachments
-- ---------------------------------------------------------------------------
drop policy if exists "attachments_select" on public.attachments;
create policy "attachments_select"
  on public.attachments for select
  using (
    exists (
      select 1 from public.requests r
      where r.id = attachments.request_id
        and (
          (public.get_my_role() = 'CLIENT' and r.client_id = auth.uid())
          or
          (public.get_my_role() = 'ADMIN' and r.org_id = public.get_my_org_id())
        )
    )
  );

drop policy if exists "attachments_insert" on public.attachments;
create policy "attachments_insert"
  on public.attachments for insert
  with check (
    uploaded_by = auth.uid()
    and exists (
      select 1 from public.requests r
      where r.id = attachments.request_id
        and (
          (public.get_my_role() = 'CLIENT' and r.client_id = auth.uid())
          or
          (public.get_my_role() = 'ADMIN' and r.org_id = public.get_my_org_id())
        )
    )
  );

drop policy if exists "attachments_delete" on public.attachments;
create policy "attachments_delete"
  on public.attachments for delete
  using (
    uploaded_by = auth.uid()
    or public.is_admin()
  );

-- ---------------------------------------------------------------------------
-- 13. RLS Policies — notifications
-- ---------------------------------------------------------------------------
drop policy if exists "notifications_select_own" on public.notifications;
create policy "notifications_select_own"
  on public.notifications for select
  using (user_id = auth.uid());

drop policy if exists "notifications_update_own" on public.notifications;
create policy "notifications_update_own"
  on public.notifications for update
  using (user_id = auth.uid());

drop policy if exists "notifications_delete_own" on public.notifications;
create policy "notifications_delete_own"
  on public.notifications for delete
  using (user_id = auth.uid());

-- ADMIN can insert notifications for users in their org
drop policy if exists "notifications_insert_admin" on public.notifications;
create policy "notifications_insert_admin"
  on public.notifications for insert
  with check (org_id = public.get_my_org_id());

-- ---------------------------------------------------------------------------
-- 14. Notification trigger — create notification on request status change
-- ---------------------------------------------------------------------------
create or replace function public.notify_on_request_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Only fire when status actually changes
  if new.status is distinct from old.status then
    insert into public.notifications (user_id, org_id, title, body, type, request_id)
    values (
      new.client_id,
      new.org_id,
      'Request updated',
      'Your request "' || new.title || '" status changed to ' || new.status::text,
      'INFO',
      new.id
    );
  end if;

  -- Notify client when payment link is added
  if new.payment_link is distinct from old.payment_link and new.payment_link is not null then
    insert into public.notifications (user_id, org_id, title, body, type, request_id)
    values (
      new.client_id,
      new.org_id,
      'Payment link ready',
      'A payment link has been added for "' || new.title || '".',
      'SUCCESS',
      new.id
    );
  end if;

  return new;
end;
$$;

drop trigger if exists on_request_updated on public.requests;
create trigger on_request_updated
  after update on public.requests
  for each row execute function public.notify_on_request_update();

-- ---------------------------------------------------------------------------
-- 15. Storage Bucket & Policies
-- ---------------------------------------------------------------------------
-- Run via Supabase Dashboard or CLI — cannot be done in pure SQL migration
-- but included here for reference:

-- insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
-- values (
--   'request-attachments',
--   'request-attachments',
--   false,
--   52428800,  -- 50 MB
--   array['image/jpeg','image/png','image/webp','application/pdf',
--         'application/msword',
--         'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
--         'video/mp4','video/quicktime']
-- )
-- on conflict do nothing;

-- Storage RLS — CLIENT can upload to their own request folder
-- create policy "storage_insert_client"
--   on storage.objects for insert
--   with check (
--     bucket_id = 'request-attachments'
--     and auth.uid()::text = (storage.foldername(name))[1]
--   );

-- Storage RLS — Users can read objects in their org
-- create policy "storage_select_own_org"
--   on storage.objects for select
--   using (
--     bucket_id = 'request-attachments'
--     and exists (
--       select 1 from public.requests r
--       join public.users u on u.id = auth.uid()
--       where r.org_id = u.org_id
--         and r.id::text = (storage.foldername(name))[2]
--     )
--   );

-- =============================================================================
-- END OF MIGRATION
-- =============================================================================
