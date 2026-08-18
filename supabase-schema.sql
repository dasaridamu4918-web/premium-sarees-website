-- =============================================
-- DASARI HERITAGE SAREES - ORDER MANAGEMENT SCHEMA
-- Execute this script in your Supabase SQL Editor
-- =============================================

CREATE TABLE IF NOT EXISTS public.orders (
  id TEXT PRIMARY KEY,                                      -- e.g. 'DH20260001'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
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
  notes TEXT DEFAULT ''
);

-- Index for fast lookups and admin dashboard filters
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_order_status ON public.orders (order_status);
CREATE INDEX IF NOT EXISTS idx_orders_customer_phone ON public.orders (mobile_number);

-- Enable Row Level Security
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Note: In Vercel serverless API routes, the backend uses SUPABASE_SERVICE_ROLE_KEY
-- which securely bypasses RLS while protecting table from direct unauthenticated public access.
