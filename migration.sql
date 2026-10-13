-- =============================================
-- DASARI HERITAGE SAREES — SAFE MIGRATION SCRIPT
-- Run this in Supabase SQL Editor to add missing
-- columns and tables. This will NOT delete any
-- existing data or modify existing columns.
-- =============================================

-- Step 1: Add tracking_number column to orders (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'tracking_number'
  ) THEN
    ALTER TABLE public.orders ADD COLUMN tracking_number TEXT DEFAULT '';
  END IF;
END $$;

-- Step 2: Add courier_name column to orders (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'courier_name'
  ) THEN
    ALTER TABLE public.orders ADD COLUMN courier_name TEXT DEFAULT '';
  END IF;
END $$;

-- Step 3: Add updated_at column to orders (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.orders ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
END $$;

-- Step 4: Create order_status_history table (if not exists)
CREATE TABLE IF NOT EXISTS public.order_status_history (
  id BIGSERIAL PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  previous_status TEXT,
  new_status TEXT NOT NULL,
  changed_by TEXT NOT NULL DEFAULT 'system',
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 5: Add index for status history lookup
CREATE INDEX IF NOT EXISTS idx_status_history_order_id 
  ON public.order_status_history (order_id, changed_at ASC);

-- Step 6: Enable RLS on new table
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;

-- Done! Your database is now up to date.
-- Existing orders and data are untouched.
