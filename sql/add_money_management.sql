-- ============================================================
-- ADD MONEY MANAGEMENT TABLES (50/15/25/10 allocation tracker)
-- Run this in Supabase SQL Editor
-- ============================================================

-- ============================================================
-- 1. MONEY_MONTHLY_ENTRIES
-- One row per user per month. Holds the only two buckets that
-- are manually tracked (Emergency contribution, Rewards), plus
-- an optional override for that month's income figure.
-- Growth and Essentials are never stored here — they are always
-- derived live from the investments/expenses tables.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.money_monthly_entries (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month            TEXT NOT NULL,                     -- Format: 'YYYY-MM'
  income_override  NUMERIC(12, 2) CHECK (income_override IS NULL OR income_override >= 0),
  emergency_actual NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (emergency_actual >= 0),
  rewards_actual   NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (rewards_actual >= 0),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, month)
);

CREATE INDEX IF NOT EXISTS money_monthly_entries_user_month_idx
  ON public.money_monthly_entries (user_id, month DESC);

ALTER TABLE public.money_monthly_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "money_monthly_entries_select_own" ON public.money_monthly_entries;
DROP POLICY IF EXISTS "money_monthly_entries_insert_own" ON public.money_monthly_entries;
DROP POLICY IF EXISTS "money_monthly_entries_update_own" ON public.money_monthly_entries;
DROP POLICY IF EXISTS "money_monthly_entries_delete_own" ON public.money_monthly_entries;

CREATE POLICY "money_monthly_entries_select_own"
  ON public.money_monthly_entries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "money_monthly_entries_insert_own"
  ON public.money_monthly_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "money_monthly_entries_update_own"
  ON public.money_monthly_entries FOR UPDATE
  USING      (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "money_monthly_entries_delete_own"
  ON public.money_monthly_entries FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- 2. MONEY_EMERGENCY_CYCLE
-- Exactly one active row per user. Tracks the locked 6-month
-- emergency-fund goal. The cumulative fund balance is NOT stored
-- here — it is always derived as SUM(emergency_actual) from
-- money_monthly_entries, so there is a single source of truth
-- and the balance can never drift out of sync with contributions.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.money_emergency_cycle (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  cycle_start_month TEXT NOT NULL,                    -- Format: 'YYYY-MM'
  locked_goal       NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (locked_goal >= 0),
  goal_source       TEXT NOT NULL DEFAULT 'auto' CHECK (goal_source IN ('auto', 'manual')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.money_emergency_cycle ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "money_emergency_cycle_select_own" ON public.money_emergency_cycle;
DROP POLICY IF EXISTS "money_emergency_cycle_insert_own" ON public.money_emergency_cycle;
DROP POLICY IF EXISTS "money_emergency_cycle_update_own" ON public.money_emergency_cycle;
DROP POLICY IF EXISTS "money_emergency_cycle_delete_own" ON public.money_emergency_cycle;

CREATE POLICY "money_emergency_cycle_select_own"
  ON public.money_emergency_cycle FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "money_emergency_cycle_insert_own"
  ON public.money_emergency_cycle FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "money_emergency_cycle_update_own"
  ON public.money_emergency_cycle FOR UPDATE
  USING      (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "money_emergency_cycle_delete_own"
  ON public.money_emergency_cycle FOR DELETE
  USING (auth.uid() = user_id);
