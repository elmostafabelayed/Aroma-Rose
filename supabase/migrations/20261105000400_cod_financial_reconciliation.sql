-- ==============================================================================
-- Aroma Rose — Mission 06.4: COD Financial Reconciliation Schema Migration
-- Migration: 20261105000400_cod_financial_reconciliation.sql
-- ==============================================================================
-- 1. Adds explicit payment remittance tracking columns to public.orders.
-- 2. Adds performance index on payment_status.
-- 3. Adds performance index on paid_at.
-- ==============================================================================

-- Add payment reconciliation audit columns to public.orders
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS payment_collected_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Performance indexes for financial reporting and payment status queries
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_paid_at ON public.orders(paid_at DESC);
