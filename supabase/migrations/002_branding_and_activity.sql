-- =============================================================================
-- ELIAH PORTAL — Migration 002: White-Label Branding & Request Activity Log
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Add Branding Columns to Organizations Table
-- ---------------------------------------------------------------------------
alter table public.organizations
  add column if not exists logo_url text,
  add column if not exists primary_color text default '#8b5cf6',
  add column if not exists secondary_color text default '#6366f1',
  add column if not exists favicon_url text;

-- ---------------------------------------------------------------------------
-- 2. Create Request Activity Audit Log Table
-- ---------------------------------------------------------------------------
create table if not exists public.request_activity (
  id          uuid primary key default uuid_generate_v4(),
  request_id  uuid not null references public.requests (id) on delete cascade,
  org_id      uuid not null references public.organizations (id) on delete cascade,
  actor_id    uuid references public.users (id) on delete set null,
  action_type text not null, -- 'CREATED' | 'STATUS_UPDATED' | 'PAYMENT_LINK_ADDED' | 'ATTACHMENT_ADDED' | 'PRIORITY_UPDATED'
  details     text,
  created_at  timestamptz not null default now()
);

-- Indexes for performance
create index if not exists idx_request_activity_req on public.request_activity (request_id);
create index if not exists idx_request_activity_org on public.request_activity (org_id);

-- Enable RLS
alter table public.request_activity enable row level security;

-- ---------------------------------------------------------------------------
-- 3. RLS Policies — request_activity
-- ---------------------------------------------------------------------------
drop policy if exists "activity_select" on public.request_activity;
create policy "activity_select"
  on public.request_activity for select
  using (
    org_id = public.get_my_org_id()
    and exists (
      select 1 from public.requests r
      where r.id = request_activity.request_id
        and (
          (public.get_my_role() = 'CLIENT' and r.client_id = auth.uid())
          or
          (public.get_my_role() = 'ADMIN' and r.org_id = public.get_my_org_id())
        )
    )
  );

drop policy if exists "activity_insert" on public.request_activity;
create policy "activity_insert"
  on public.request_activity for insert
  with check (org_id = public.get_my_org_id());

-- ---------------------------------------------------------------------------
-- 4. Storage Bucket Setup
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'request-attachments',
  'request-attachments',
  false,
  52428800,  -- 50 MB limit
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'video/mp4',
    'video/quicktime'
  ]
)
on conflict (id) do nothing;
