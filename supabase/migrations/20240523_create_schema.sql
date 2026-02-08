-- Create Invoices Table
create table if not exists public.invoices (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  invoice_number text,
  buyer_name text not null,
  description text,
  amount_inr numeric not null,
  due_date date,
  status text check (status in ('uploaded', 'verified', 'tokenized', 'funded', 'repaid', 'paid')) default 'uploaded',
  risk_score text check (risk_score in ('low', 'medium', 'high')),
  interest_rate numeric,
  token_value numeric,
  stellar_tx_hash text,
  file_hash text,
  justification text,
  ocr_extracted jsonb,
  ocr_status text check (ocr_status in ('verified', 'manual_override', 'failed', 'pending')),
  created_at timestamptz default now()
);

-- Create Investments Table
create table if not exists public.investments (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  pool_id text not null, -- Can link to invoice_id if 1:1 mapping
  amount numeric not null,
  apy numeric,
  earned numeric default 0,
  status text default 'active',
  investor_key text,
  tx_hash text,
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.invoices enable row level security;
alter table public.investments enable row level security;

-- Policies for Invoices
create policy "Users can view their own invoices" 
on public.invoices for select 
using (auth.uid() = user_id);

create policy "Users can insert their own invoices" 
on public.invoices for insert 
with check (auth.uid() = user_id);

create policy "Users can update their own invoices" 
on public.invoices for update 
using (auth.uid() = user_id);

-- Policies for Investments
create policy "Users can view their own investments" 
on public.investments for select 
using (auth.uid() = user_id);

create policy "Users can insert their own investments" 
on public.investments for insert 
with check (auth.uid() = user_id);

-- Allow public read access to tokenized/funded invoices for the marketplace
create policy "Public view of marketplace invoices" 
on public.invoices for select 
using (status in ('tokenized', 'funded'));
