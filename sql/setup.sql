-- ============================================================
-- LEDGER — EXPENSE TRACKER
-- Supabase SQL Setup Script
-- Run this entire script in the Supabase SQL Editor
-- ============================================================

-- ============================================================
-- 1. EXPENSES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.expenses (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount          NUMERIC(10, 2) NOT NULL CHECK (amount > 0 AND amount <= 999999.99),
  category        TEXT NOT NULL,
  payment_method  TEXT NOT NULL,
  date            DATE NOT NULL,
  notes           TEXT CHECK (char_length(notes) <= 500),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 2. BUDGETS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.budgets (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month      TEXT NOT NULL,             -- Format: 'YYYY-MM'
  amount     NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, month)                -- One budget per user per month
);

-- ============================================================
-- 3. INDEXES (performance)
-- ============================================================
CREATE INDEX IF NOT EXISTS expenses_user_id_idx    ON public.expenses (user_id);
CREATE INDEX IF NOT EXISTS expenses_date_idx        ON public.expenses (date DESC);
CREATE INDEX IF NOT EXISTS expenses_user_date_idx   ON public.expenses (user_id, date DESC);
CREATE INDEX IF NOT EXISTS expenses_category_idx    ON public.expenses (user_id, category);
CREATE INDEX IF NOT EXISTS budgets_user_month_idx   ON public.budgets  (user_id, month DESC);

-- ============================================================
-- 4. ENABLE ROW LEVEL SECURITY (CRITICAL)
-- ============================================================
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets  ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 5. RLS POLICIES — EXPENSES
-- Users can only access their own data.
-- ============================================================

-- Drop existing policies if re-running
DROP POLICY IF EXISTS "expenses_select_own"  ON public.expenses;
DROP POLICY IF EXISTS "expenses_insert_own"  ON public.expenses;
DROP POLICY IF EXISTS "expenses_update_own"  ON public.expenses;
DROP POLICY IF EXISTS "expenses_delete_own"  ON public.expenses;

-- SELECT: only own rows
CREATE POLICY "expenses_select_own"
  ON public.expenses
  FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT: only own rows, and user_id must match auth.uid()
CREATE POLICY "expenses_insert_own"
  ON public.expenses
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: only own rows
CREATE POLICY "expenses_update_own"
  ON public.expenses
  FOR UPDATE
  USING      (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE: only own rows
CREATE POLICY "expenses_delete_own"
  ON public.expenses
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- 6. RLS POLICIES — BUDGETS
-- ============================================================

DROP POLICY IF EXISTS "budgets_select_own"  ON public.budgets;
DROP POLICY IF EXISTS "budgets_insert_own"  ON public.budgets;
DROP POLICY IF EXISTS "budgets_update_own"  ON public.budgets;
DROP POLICY IF EXISTS "budgets_delete_own"  ON public.budgets;

CREATE POLICY "budgets_select_own"
  ON public.budgets
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "budgets_insert_own"
  ON public.budgets
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "budgets_update_own"
  ON public.budgets
  FOR UPDATE
  USING      (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "budgets_delete_own"
  ON public.budgets
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- 7. OPTIONAL: verify RLS is ON for both tables
-- ============================================================
-- SELECT relname, relrowsecurity
-- FROM pg_class
-- WHERE relname IN ('expenses', 'budgets');

-- ============================================================
-- 8. SEED DATA (optional — remove before production)
-- Uncomment and replace <YOUR_USER_ID> with your auth.uid()
-- to pre-populate some test data.
-- ============================================================
/*
DO $$
DECLARE
  uid UUID := '<YOUR_USER_ID>';  -- Replace this
BEGIN
  INSERT INTO public.expenses (user_id, amount, category, payment_method, date, notes) VALUES
    (uid, 45.50,  'Food & Dining',  'Credit Card',   CURRENT_DATE - 1,  'Lunch with colleague'),
    (uid, 120.00, 'Shopping',       'Debit Card',    CURRENT_DATE - 3,  'Groceries'),
    (uid, 9.99,   'Subscriptions',  'Credit Card',   CURRENT_DATE - 5,  'Netflix'),
    (uid, 60.00,  'Transportation', 'Digital Wallet', CURRENT_DATE - 7, 'Monthly transit pass'),
    (uid, 200.00, 'Utilities',      'Bank Transfer',  CURRENT_DATE - 10, 'Electricity bill');

  INSERT INTO public.budgets (user_id, month, amount) VALUES
    (uid, TO_CHAR(CURRENT_DATE, 'YYYY-MM'), 2000.00);
END $$;
*/
