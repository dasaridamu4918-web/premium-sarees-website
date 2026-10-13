-- =============================================
-- DASARI HERITAGE SAREES - ORDER MANAGEMENT SCHEMA
-- Execute this script in your Supabase SQL Editor
-- =============================================

CREATE TABLE IF NOT EXISTS public.orders (
  id TEXT PRIMARY KEY,                                      -- e.g. 'DH20260001'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  customer_name TEXT NOT NULL,
  mobile_number TEXT NOT NULL,
  email TEXT NOT NULL,
  address_line1 TEXT NOT NULL,
  address_line2 TEXT DEFAULT '',
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  pincode TEXT NOT NULL,
  items JSONB NOT NULL,                                     -- Array of [{id, name, img, price, qty, fabric}]
  subtotal NUMERIC(10,2) NOT NULL,
  delivery_charge NUMERIC(10,2) NOT NULL DEFAULT 0,
  final_total NUMERIC(10,2) NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'Payment Pending',   -- 'Payment Pending', 'Paid', 'Failed'
  order_status TEXT NOT NULL DEFAULT 'Pending',             -- 'Pending', 'Confirmed', 'Packed', 'Shipped', 'Delivered', 'Cancelled'
  tracking_number TEXT DEFAULT '',
  courier_name TEXT DEFAULT '',
  notes TEXT DEFAULT ''
);

-- Order status history table for tracking all status changes
CREATE TABLE IF NOT EXISTS public.order_status_history (
  id BIGSERIAL PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  previous_status TEXT,
  new_status TEXT NOT NULL,
  changed_by TEXT NOT NULL DEFAULT 'system',                -- 'system', 'admin'
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for fast lookups and admin dashboard filters
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_order_status ON public.orders (order_status);
CREATE INDEX IF NOT EXISTS idx_orders_customer_phone ON public.orders (mobile_number);
CREATE INDEX IF NOT EXISTS idx_status_history_order_id ON public.order_status_history (order_id, changed_at ASC);

-- Enable Row Level Security
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;

-- Note: In Vercel serverless API routes, the backend uses SUPABASE_SERVICE_ROLE_KEY
-- which securely bypasses RLS while protecting table from direct unauthenticated public access.
