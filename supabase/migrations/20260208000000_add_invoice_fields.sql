-- Add missing columns to invoices
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS ocr_extracted JSONB;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS ocr_status TEXT;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS file_hash TEXT;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS justification TEXT;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS contract_id TEXT;

-- Update status check constraint for invoices
ALTER TABLE public.invoices DROP CONSTRAINT IF EXISTS invoices_status_check;
ALTER TABLE public.invoices ADD CONSTRAINT invoices_status_check CHECK (status IN ('uploaded', 'verified', 'tokenized', 'funded', 'paid', 'repaid'));

-- Add missing columns to investments
ALTER TABLE public.investments ADD COLUMN IF NOT EXISTS apy NUMERIC(5,2);
