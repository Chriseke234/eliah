# Eliah Portal — Multi-Tenant White-Label Agency Platform

A production-ready, multi-tenant agency client portal framework built with Next.js 16, Supabase, and Tailwind CSS.

## Key Features

- 🏢 **Multi-tenancy & Isolation** — Organizations strictly isolated via PostgreSQL RLS (`org_id = get_my_org_id()`).
- 🎨 **White-Label Agency Branding** — Dynamic agency logo, custom accent colors, and branded client portals.
- 🔐 **Server-Enforced Authorization** — ADMIN and CLIENT roles with SECURITY DEFINER database triggers & RLS rules.
- 📋 **Request Workspace & Kanban** — Interactive drag-and-drop workspace for admins and streamlined client request submission.
- 📜 **Request Activity Audit Feed** — Real-time audit trail logging request creation, status changes, attachment uploads, and payment link updates.
- 📁 **Attachment Handling** — Storage bucket scoping with signed URL previews.
- 💳 **External Payment Link Display** — Agency admins configure external payment links (Stripe, Paystack, Flutterwave) without internal platform fee processing.
- 📱 **Fully Responsive** — Mobile, tablet, and desktop viewports supported.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 App Router, React 19, TypeScript |
| Styling | Tailwind CSS |
| Icons | Lucide React |
| Backend | Supabase (Auth, PostgreSQL, Storage) |
| Auth | `@supabase/ssr` |
| DnD | `@hello-pangea/dnd` |
| Deployment | Vercel |

---

## Setup Instructions

### 1. Environment Variables

Copy `.env.local.example` to `.env.local`:

```bash
cp .env.local.example .env.local
```

Set your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 2. Database Migrations

Run the SQL migration scripts in order in your Supabase SQL Editor:
1. `supabase/migrations/001_init.sql`
2. `supabase/migrations/002_branding_and_activity.sql`

### 3. Local Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Project Architecture

```
src/
├── proxy.ts                # Next.js 16 Proxy middleware for route protection & role redirects
├── lib/
│   ├── database.types.ts   # Database TypeScript interfaces & extended joined types
│   ├── utils.ts            # Formatting & utility helpers
│   ├── queries/            # Centralized Server Data Access Layer (DAL)
│   └── supabase/
│       ├── client.ts       # Browser Supabase client
│       ├── server.ts       # Server client & admin client
│       └── middleware.ts   # Session refresh middleware
├── app/
│   ├── (auth)/             # Login & Signup flows
│   ├── app/
│   │   ├── layout.tsx      # App shell with dynamic white-label sidebar navigation
│   │   ├── client/         # Client portal & request tracking
│   │   └── admin/          # Admin workspace, client management, & branding settings
│   └── actions/            # Server Actions (auth, requests, attachments, settings)
└── components/
    ├── auth/               # LoginForm, SignupForm
    ├── nav/                # Sidebar, MobileNav
    ├── ui/                 # StatusBadge, EmptyState, ErrorState, LoadingSkeleton
    ├── client/             # RequestList, RequestCard, NewRequestModal
    └── admin/              # KanbanBoard, KanbanCard, RequestDrawer, ClientTable, BrandingForm
```
