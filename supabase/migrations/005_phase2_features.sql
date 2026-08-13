-- =============================================================================
-- Migration 005: Phase 2 Additive Tables & Automation Columns
-- =============================================================================

-- 1. Time Tracking Entries
CREATE TABLE IF NOT EXISTS public.request_time_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.requests(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  duration_seconds INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.request_time_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "time_entries_org_select" ON public.request_time_entries
  FOR SELECT USING (org_id = get_my_org_id());

CREATE POLICY "time_entries_org_insert" ON public.request_time_entries
  FOR INSERT WITH CHECK (org_id = get_my_org_id());

CREATE POLICY "time_entries_org_update" ON public.request_time_entries
  FOR UPDATE USING (org_id = get_my_org_id());

CREATE INDEX IF NOT EXISTS idx_time_entries_request_id ON public.request_time_entries(request_id);

-- 2. Request-Level Real-Time Chat & Scheduled Call Cards
CREATE TABLE IF NOT EXISTS public.request_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.requests(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  message TEXT NOT NULL,
  attachment_path TEXT,
  attachment_name TEXT,
  call_link TEXT,
  call_title TEXT,
  is_system BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for request_comments
ALTER TABLE public.request_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "comments_org_select" ON public.request_comments
  FOR SELECT USING (org_id = get_my_org_id());

CREATE POLICY "comments_org_insert" ON public.request_comments
  FOR INSERT WITH CHECK (org_id = get_my_org_id());

CREATE INDEX IF NOT EXISTS idx_request_comments_request_id ON public.request_comments(request_id);

-- 3. Additive Scoped Automation Settings for Organizations
ALTER TABLE public.organizations 
  ADD COLUMN IF NOT EXISTS auto_notify_client BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS auto_assign_enabled BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS default_assignee_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS auto_notify_agency BOOLEAN DEFAULT TRUE;

-- 4. Per-User Per-Request Chat Read/Unread Tracker
CREATE TABLE IF NOT EXISTS public.request_read_states (
  request_id UUID NOT NULL REFERENCES public.requests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  last_read_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (request_id, user_id)
);

ALTER TABLE public.request_read_states ENABLE ROW LEVEL SECURITY;

CREATE POLICY "read_states_user_all" ON public.request_read_states
  FOR ALL USING (user_id = auth.uid());
