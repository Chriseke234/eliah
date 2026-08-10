-- =============================================================================
-- ELIAH PORTAL — Migration 003: Allow Organization Creation During Signup
-- =============================================================================

-- Allow unauthenticated users to insert a new organization row during agency signup
drop policy if exists "org_insert_anon_signup" on public.organizations;
create policy "org_insert_anon_signup"
  on public.organizations for insert
  with check (true);

-- Allow selecting the newly inserted org during signup flow
drop policy if exists "org_select_anon_signup" on public.organizations;
create policy "org_select_anon_signup"
  on public.organizations for select
  using (
    id = public.get_my_org_id()
    or auth.uid() is null
  );
