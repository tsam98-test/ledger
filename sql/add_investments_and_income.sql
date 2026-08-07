-- ============================================================
-- ADD INVESTMENTS TABLE
-- Run this in Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS public.investments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  category        TEXT NOT NULL,
  amount_invested NUMERIC(12, 2) NOT NULL CHECK (amount_invested > 0),
  current_value   NUMERIC(12, 2) NOT NULL CHECK (current_value >= 0),
  date            DATE NOT NULL,
  notes           TEXT CHECK (char_length(notes) <= 500),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS investments_user_id_idx   ON public.investments (user_id);
CREATE INDEX IF NOT EXISTS investments_date_idx       ON public.investments (date DESC);
CREATE INDEX IF NOT EXISTS investments_user_date_idx  ON public.investments (user_id, date DESC);

-- Enable RLS
ALTER TABLE public.investments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if re-running
DROP POLICY IF EXISTS "investments_select_own" ON public.investments;
DROP POLICY IF EXISTS "investments_insert_own" ON public.investments;
DROP POLICY IF EXISTS "investments_update_own" ON public.investments;
DROP POLICY IF EXISTS "investments_delete_own" ON public.investments;

-- RLS Policies
CREATE POLICY "investments_select_own"
  ON public.investments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "investments_insert_own"
  ON public.investments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "investments_update_own"
  ON public.investments FOR UPDATE
  USING      (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "investments_delete_own"
  ON public.investments FOR DELETE
  USING (auth.uid() = user_id);

-- Also run income table if you haven't already:
CREATE TABLE IF NOT EXISTS public.income (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount       NUMERIC(10, 2) NOT NULL CHECK (amount > 0 AND amount <= 9999999.99),
  source       TEXT NOT NULL,
  category     TEXT NOT NULL,
  date         DATE NOT NULL,
  notes        TEXT CHECK (char_length(notes) <= 500),
  is_recurring BOOLEAN NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS income_user_id_idx   ON public.income (user_id);
CREATE INDEX IF NOT EXISTS income_date_idx       ON public.income (date DESC);
CREATE INDEX IF NOT EXISTS income_user_date_idx  ON public.income (user_id, date DESC);

ALTER TABLE public.income ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "income_select_own" ON public.income;
DROP POLICY IF EXISTS "income_insert_own" ON public.income;
DROP POLICY IF EXISTS "income_update_own" ON public.income;
DROP POLICY IF EXISTS "income_delete_own" ON public.income;

CREATE POLICY "income_select_own"  ON public.income FOR SELECT  USING (auth.uid() = user_id);
CREATE POLICY "income_insert_own"  ON public.income FOR INSERT  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "income_update_own"  ON public.income FOR UPDATE  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "income_delete_own"  ON public.income FOR DELETE  USING (auth.uid() = user_id);
