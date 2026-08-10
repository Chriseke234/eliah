# RECOVERY & ARCHITECTURE AUDIT DOCUMENT

**Project**: Custom White-Label Agency Platform (Eliah Portal)  
**Date**: August 10, 2026  
**Status**: Stable Build Baseline Achieved | Incremental Refactor Phase Initiated  

---

## 1. Executive Summary & Business Architecture

The platform is designed as a **reusable multi-tenant white-label agency software framework**.
- **Business Model**: Each agency gets a dedicated, branded instance/organization to manage its own clients.
- **Client Relationship**: The agency owns client relationships, payment links, and branding.
- **Payment Handling**: The platform does **NOT** process or hold client payments. Agencies configure external payment links (e.g. Stripe, Paystack, Flutterwave) per request, and clients click "Pay Now" to complete payments on external provider pages.

---

## 2. Full Codebase Audit Findings

### A. Current Architecture & Build Status
- **Framework**: Next.js 16.3 (App Router with `@/src/app` structure).
- **TypeScript & Lint**: `npm run build` succeeds cleanly.
- **State & Router**: Uses Next.js App Router with Server Components for layout & data fetching, and Client Components for interactive UI (Kanban, modals, sidebars).
- **Auth & SSR**: Uses `@supabase/ssr` (`createBrowserClient`, `createServerClient`, and `updateSession`).
- **Middleware**: Located in `src/proxy.ts` (Next.js 16 proxy convention) enforcing auth guards and role-based redirects.

### B. Functional Audit: What Works
- [x] **Base Multi-Tenant Schema**: `organizations`, `users`, `requests`, `attachments`, `notifications` tables with foreign keys and cascade rules.
- [x] **Database Security & RLS**: `get_my_org_id()`, `get_my_role()`, `is_admin()` SECURITY DEFINER functions preventing recursive RLS.
- [x] **Database Triggers**:
  - `on_auth_user_created` trigger syncing `auth.users` to `public.users`.
  - `guard_client_request_write` trigger blocking CLIENT role from altering `status` or `payment_link`.
  - `notify_on_request_update` trigger auto-generating in-app notifications on status changes or payment link assignment.
- [x] **Auth Flows**: Agency Signup (`signUpWithOrg`), Client Creation (`createClientAccount`), Sign In (`/login`), and Sign Out.
- [x] **Client Dashboard**: `/app/client` viewing requests, request stats, and submitting new requests.
- [x] **Admin Workspace**: `/app/admin` with interactive Kanban board, status updates, payment link management, request drawer, and client management (`/app/admin/clients`).

### C. Gaps & Weaknesses Identified
1. **White-Label & Branding System**:
   - `organizations` table lacks explicit branding columns (`logo_url`, `primary_color`, `secondary_color`, `favicon_url`).
   - UI sidebar and headers currently fall back to hardcoded default brand name / colors instead of dynamically resolving org branding.
2. **Type Safety & Type Casts**:
   - Explicit `as any` casts in `src/app/actions/auth.ts`, `requests.ts`, `attachments.ts` due to missing DB helper types for inserts/updates.
3. **Storage Bucket & Policies**:
   - `request-attachments` storage bucket RLS policies in `001_init.sql` are commented out and require explicit execution in migration `002_storage_and_branding.sql`.
4. **Auditability & Request Activity**:
   - `request_activity` table does not yet exist to record full audit logs (status transitions, attachment uploads, payment link additions).
5. **Client Invitation & Onboarding**:
   - Admin client creation currently creates a password directly; an invitation link / email reset flow needs clean UX handling.

---

## 3. Sequential Refactor Roadmap

```text
Phase 0: Repository Audit & Baseline Verification (Completed)
 ↓
Phase 1: Database Migration (Branding & Storage RLS & Activity Log)
 ↓
Phase 2: Type Safety & Data Access Layer (`lib/queries` & Cleaned Server Actions)
 ↓
Phase 3: White-Label Branding System Architecture
 ↓
Phase 4: Client & Admin UX Polish (Responsive Kanban, Drawer, Notifications)
 ↓
Phase 5: Production Security & Multi-Tenancy Hardening
```

---

## 4. Verification & Quality Gates

Every milestone must satisfy:
1. `npm run build` succeeds with zero errors.
2. Multi-tenant isolation verified (Org A cannot see Org B data).
3. RLS and server-side role guards strictly enforced.
4. Mobile, tablet, and desktop responsiveness validated.
5. No mock data or exposed service-role keys.
