# Eliah Portal — Multi-Tenant B2B Client Portal

A production-ready, multi-tenant client portal built with Next.js 14, Supabase, and Tailwind CSS for productized agencies.

## Features

- 🏢 **Multi-tenancy** — organizations fully isolated via PostgreSQL RLS
- 🔐 **Role-based access** — ADMIN and CLIENT roles with server-enforced permissions
- 📋 **Request management** — clients submit requests; admins manage them via a kanban board
- 📁 **File attachments** — upload to Supabase Storage with signed URL access
- 💳 **Payment links** — admins add payment links; clients see a Pay Now button
- 🔔 **Notifications** — automatic in-app notifications on request updates
- 📱 **Fully responsive** — mobile, tablet, and desktop layouts

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 App Router, React, TypeScript |
| Styling | Tailwind CSS, Shadcn/ui |
| Icons | Lucide React |
| Backend | Supabase (Auth, PostgreSQL, Storage) |
| Auth | @supabase/ssr (NOT deprecated auth-helpers) |
| DnD | @hello-pangea/dnd |
| Deployment | Vercel |

---

## Manual Setup Steps

### 1. Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. Copy your **Project URL** and **anon public key** from **Settings → API**.
3. Copy your **service_role secret key** from the same page (keep this secret!).

### 2. Environment Variables

```bash
cp .env.local.example .env.local
```

Fill in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJh...
SUPABASE_SERVICE_ROLE_KEY=eyJh...
```

### 3. Run the Database Migration

1. Open your Supabase project → **SQL Editor**
2. Paste and run the contents of `supabase/migrations/001_init.sql`
3. Verify all tables appear in **Table Editor**: `organizations`, `users`, `requests`, `attachments`, `notifications`

### 4. Create the Storage Bucket

1. Go to **Storage** in your Supabase dashboard
2. Click **Create bucket** → name it `request-attachments`
3. Set it to **Private** (not public)
4. Set file size limit to `50MB`
5. Add allowed MIME types:
   - `image/jpeg`, `image/png`, `image/webp`
   - `application/pdf`
   - `application/msword`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
   - `video/mp4`, `video/quicktime`
6. Go to **Storage → Policies** and add the two storage RLS policies from the SQL file comments

### 5. Install Dependencies & Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Auth Flow

### Agency Signup (`/signup`)
1. Fill in agency name, your name, email, password
2. This creates: an `organizations` row + your Supabase Auth user + a `users` row with `role = ADMIN`
3. You're redirected to `/app/admin`

### Creating Client Accounts
1. Log in as ADMIN → go to **Clients** page
2. Click **Add Client** → enter their name, email, and a temporary password
3. Share the temporary password with the client; they can change it after login

### Login (`/login`)
- Supabase handles email/password auth
- Middleware automatically redirects to `/app/admin` or `/app/client` based on role

---

## Regenerating Types

After making schema changes, regenerate TypeScript types:

```bash
npx supabase gen types typescript --project-id <your-project-id> > src/lib/database.types.ts
```

---

## Deployment to Vercel

1. Push this repo to GitHub
2. Connect to Vercel and import the project
3. Add all environment variables under **Settings → Environment Variables**
4. Deploy — Vercel handles the rest

---

## Security Notes

- **RLS is the primary security layer** — all data access is controlled by PostgreSQL Row-Level Security policies
- `SECURITY DEFINER` helper functions prevent recursion in RLS policies
- A trigger prevents CLIENT users from writing `status` or `payment_link` even via direct API calls
- The `service_role` key is only used server-side (in Server Actions) and never exposed to the client
- File paths in Storage include the user ID as a prefix, scoping uploads to the requesting user

---

## Project Structure

```
src/
├── middleware.ts           # Route protection & role-based redirects
├── lib/
│   ├── database.types.ts   # TypeScript types for Supabase schema
│   ├── utils.ts            # Shared utilities
│   └── supabase/
│       ├── client.ts       # Browser client
│       ├── server.ts       # Server client + admin client
│       └── middleware.ts   # Middleware session refresh
├── app/
│   ├── (auth)/             # Login + Signup pages
│   ├── app/
│   │   ├── layout.tsx      # Protected shell with sidebar
│   │   ├── client/         # Client dashboard
│   │   └── admin/          # Admin workspace + clients
│   └── actions/            # Server Actions (auth, requests, attachments)
└── components/
    ├── auth/               # LoginForm, SignupForm
    ├── nav/                # Sidebar, MobileNav
    ├── ui/                 # StatusBadge, EmptyState, ErrorState, Skeletons
    ├── client/             # RequestList, RequestCard, NewRequestModal
    └── admin/              # KanbanBoard, KanbanCard, RequestDrawer, ClientTable
```
