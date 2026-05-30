# Agency OS — Complete Setup & Deployment Guide

## Prerequisites
- Node.js 20+
- A Supabase account (free tier works)
- A Netlify account (free tier works)
- A Resend account (for email — optional)

---

## Step 1: Supabase Setup

### 1.1 Create Project
1. Go to https://supabase.com/dashboard
2. Click "New Project"
3. Name it "agency-os", choose a region, set a strong DB password
4. Wait for provisioning (~2 minutes)

### 1.2 Run Database Migrations
1. In your Supabase dashboard, go to **SQL Editor**
2. Copy the entire contents of `supabase/migrations/001_initial_schema.sql`
3. Paste and click **Run**
4. Verify no errors in the output

### 1.3 Get API Keys
Go to **Settings → API** and note down:
- **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
- **anon public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **service_role secret key** → `SUPABASE_SERVICE_ROLE_KEY`

### 1.4 Configure Auth
1. Go to **Authentication → URL Configuration**
2. Set **Site URL** to your Netlify URL (e.g., `https://agency-os.netlify.app`)
3. Add to **Redirect URLs**:
   - `https://agency-os.netlify.app/auth/callback`
   - `http://localhost:3000/auth/callback` (for local dev)

### 1.5 Create Admin User
1. Go to **Authentication → Users**
2. Click "Add User" → "Create New User"
3. Enter your email and a strong password
4. This is your admin account

---

## Step 2: Local Development

```bash
# Clone and install
git clone <your-repo>
cd agency-os
npm install

# Set up environment
cp .env.example .env.local
# Fill in your Supabase credentials in .env.local

# Run development server
npm run dev
```

Open http://localhost:3000 — you'll be redirected to /login

---

## Step 3: Initialize Settings

After logging in:
1. Go to **Settings** (bottom of sidebar)
2. Fill in your agency name, address, email, GST, and bank details
3. These auto-populate your invoices

---

## Step 4: Deploy to Netlify

### 4.1 Push to GitHub
```bash
git init
git add .
git commit -m "Initial Agency OS"
git remote add origin https://github.com/yourname/agency-os
git push -u origin main
```

### 4.2 Connect to Netlify
1. Go to https://netlify.com → "Add New Site" → "Import from Git"
2. Select your GitHub repo
3. Build settings are auto-detected from `netlify.toml`

### 4.3 Set Environment Variables
In Netlify Dashboard → Site Settings → Environment Variables, add:
```
NEXT_PUBLIC_SUPABASE_URL    = https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJ...
SUPABASE_SERVICE_ROLE_KEY   = eyJ...
NEXT_PUBLIC_SITE_URL        = https://your-site.netlify.app
RESEND_API_KEY              = re_... (optional)
RESEND_FROM_EMAIL           = noreply@yourdomain.com (optional)
```

### 4.4 Deploy
Click "Deploy Site" — Netlify builds and deploys automatically.

---

## Step 5: Post-Deployment Checklist

- [ ] Can log in with admin credentials
- [ ] Settings page saves correctly
- [ ] Can create a client
- [ ] Can create an invoice (verify auto-numbering: INV-0001)
- [ ] Can download a PDF invoice
- [ ] Dashboard KPI cards show real data
- [ ] Goal forecast engine calculates correctly
- [ ] Kanban board drag-and-drop persists

---

## Database Schema Summary

| Table | Purpose |
|-------|---------|
| `settings` | Agency profile, bank details, invoice prefix |
| `clients` | CRM — client contacts and status |
| `services` | Service catalog with pricing |
| `client_services` | Client ↔ service subscriptions with renewal dates |
| `payments` | Payment records with status tracking |
| `invoices` | Invoice headers with auto-numbering |
| `invoice_items` | Line items for each invoice |
| `projects` | Project management |
| `tasks` | Task management with Kanban |
| `meetings` | Meeting scheduling and notes |
| `goals` | Revenue/business goals with forecasting |
| `reports` | Monthly client performance reports |
| `documents` | File storage references |
| `revenue_entries` | Revenue breakdown by source |
| `expenses` | Expense tracking for net profit |

---

## Key Features Built

### ✅ Fully Implemented
- Authentication (login, forgot password, reset)
- Protected routes via middleware
- Dashboard with 12 KPI cards from live DB
- Monthly business overview
- Revenue trend chart + donut chart by source
- Client CRM with CRUD, profile pages, tabs
- Invoice system with auto-numbering (INV-0001, INV-0002...)
- PDF invoice generation (pdf-lib, no server needed)
- Invoice status management (draft → sent → paid)
- Invoice duplication
- Payment recording with revenue entry sync
- Goal tracking with forecast engine
  - Avg daily revenue calculation
  - Estimated days to goal
  - Estimated completion date
- Kanban board with drag-and-drop (persists to DB)
- Task list view with status toggle
- Settings page with full agency profile
- Expiring clients widget
- Row Level Security on all tables
- Supabase Storage buckets

### 🔧 Extend Next (stub routes exist)
- Meetings CRUD (`/dashboard/meetings`)
- Projects list view (`/dashboard/projects`)
- Reports generator (`/dashboard/reports`)
- Document upload (`/dashboard/documents`)
- Analytics deep-dive (`/dashboard/analytics`)
- Revenue entries manager (`/dashboard/revenue`)
- Calendar view (`/dashboard/calendar`)
- Email invoices via Resend
