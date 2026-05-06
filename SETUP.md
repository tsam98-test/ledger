# Ledger — Personal Expense Tracker
## Complete Setup & Deployment Guide

---

## Prerequisites

- Node.js 18+ installed
- A free [Supabase](https://supabase.com) account
- A free [Vercel](https://vercel.com) account
- Git installed

---

## Step 1 — Clone & Install

```bash
# Install dependencies
cd expense-tracker
npm install
```

---

## Step 2 — Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) → **New project**
2. Choose a name (e.g. `ledger`), a strong database password, and your nearest region
3. Wait ~2 minutes for provisioning

### Get your API keys

In your project dashboard → **Project Settings** → **API**:

| Key | Where to use |
|-----|-------------|
| `Project URL` | `NEXT_PUBLIC_SUPABASE_URL` |
| `anon public` key | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |

> ⚠️ **Never** copy the `service_role` key into your frontend or `.env.local`.

---

## Step 3 — Run the Database Setup SQL

1. In Supabase → **SQL Editor** → **New query**
2. Paste the entire contents of `sql/setup.sql`
3. Click **Run**

You should see: `Success. No rows returned.`

### Verify tables were created

In Supabase → **Table Editor**, you should see:
- `expenses`
- `budgets`

### Verify RLS is enabled

```sql
SELECT relname, relrowsecurity
FROM pg_class
WHERE relname IN ('expenses', 'budgets');
```

Both should show `relrowsecurity = true`.

---

## Step 4 — Create Your User Account

1. In Supabase → **Authentication** → **Users** → **Invite user**
2. Enter your email address
3. Check your email for the confirmation link
4. Click the link — this sets your account as confirmed

> Alternatively, enable "Email confirmation" in Auth settings and sign up through the app.

### Disable public signups (important for private app)

In Supabase → **Authentication** → **Providers** → **Email**:
- Turn **OFF** "Enable sign ups"

This prevents anyone else from creating an account. Only you (already invited) can log in.

---

## Step 5 — Local Development

Create `.env.local` in the project root:

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

Start the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and log in with your credentials.

---

## Step 6 — Deploy to Vercel

### Option A — Vercel CLI (recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Follow prompts:
# - Link to existing project? No → create new
# - Project name: ledger (or your choice)
# - Directory: ./
# - Override settings? No

# Set env vars
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY

# Deploy to production
vercel --prod
```

### Option B — Vercel Dashboard

1. Push your project to GitHub/GitLab/Bitbucket
2. Go to [vercel.com](https://vercel.com) → **New Project**
3. Import your repository
4. In **Environment Variables**, add:
   - `NEXT_PUBLIC_SUPABASE_URL` = your project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your anon key
5. Click **Deploy**

### Update Supabase allowed URLs

In Supabase → **Authentication** → **URL Configuration**:
- **Site URL**: `https://your-app.vercel.app`
- **Redirect URLs**: `https://your-app.vercel.app/**`

---

## Security Checklist

- [x] RLS enabled on all tables
- [x] Policies use `auth.uid() = user_id` 
- [x] Only anon key in frontend (no service role key)
- [x] All secrets in environment variables
- [x] Security headers set in `next.config.js`
- [x] Input validation on all forms
- [x] `noindex` meta tag (private app not indexed)
- [x] Generic auth error messages (no info leakage)
- [ ] Disable public sign-ups in Supabase Auth ← **do this!**
- [ ] Enable MFA on your Supabase account

---

## CSV Import Format

Your CSV file must have these headers (case-insensitive):

```csv
Date,Amount,Category,Payment Method,Notes
2024-01-15,45.50,Food & Dining,Credit Card,Lunch
2024-01-16,9.99,Subscriptions,Credit Card,Netflix
```

**Valid categories:**
Food & Dining, Transportation, Shopping, Entertainment, Healthcare,
Utilities, Housing, Education, Personal Care, Travel, Subscriptions, Other

**Valid payment methods:**
Cash, Credit Card, Debit Card, Bank Transfer, Digital Wallet, Other

**Date format:** `YYYY-MM-DD` (e.g. `2024-01-15`)

---

## Data Backup Strategy

### Manual backup via Supabase

In Supabase → **Database** → **Backups** (available on Pro plan).

### Free-tier backup (automated)

Add this SQL to run periodically, or use a cron job to call the export endpoint:

```sql
-- Run in SQL Editor to get a backup snapshot
COPY (
  SELECT * FROM public.expenses ORDER BY date DESC
) TO STDOUT WITH CSV HEADER;
```

### App-level backup

Use the **Export CSV** button on the Expenses page — this exports all currently-filtered expenses. For a full backup, clear all filters first then export.

---

## Project Structure

```
expense-tracker/
├── app/
│   ├── (auth)/login/         # Login page
│   ├── (dashboard)/
│   │   ├── page.tsx          # Dashboard
│   │   ├── expenses/         # Expenses page
│   │   ├── budgets/          # Budgets page
│   │   └── layout.tsx        # Auth-protected layout
│   ├── globals.css
│   └── layout.tsx
├── components/
│   ├── layout/               # Sidebar, MobileNav
│   ├── dashboard/            # DashboardClient
│   ├── expenses/             # ExpensesClient, Modals
│   └── budgets/              # BudgetsClient
├── lib/
│   ├── supabase/
│   │   ├── client.ts         # Browser client
│   │   └── server.ts         # Server client
│   └── utils.ts              # Helpers
├── types/index.ts            # TypeScript types
├── sql/setup.sql             # DB schema + RLS
├── middleware.ts             # Auth guard
└── .env.example
```

---

## Troubleshooting

**Login redirect loop**
→ Make sure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set correctly.

**"new row violates row-level security policy"**
→ Make sure you're logged in and the `user_id` in the insert matches `auth.uid()`.

**Charts not rendering**
→ Make sure `recharts` is installed: `npm install recharts`

**Build fails on Vercel**
→ Ensure both env vars are set in the Vercel project settings before deploying.

**Date inputs look unstyled**
→ Browser-native date inputs vary. The app uses them intentionally for compatibility.
