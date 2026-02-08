-- Create tables for InvoPay

-- Invoices Table
create table public.invoices (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  buyer_name text not null,
  description text,
  amount_inr numeric not null,
  due_date date not null,
  status text check (status in ('pending', 'approved', 'tokenized', 'funded', 'repaid', 'overdue')) default 'pending',
  risk_score text,
  stellar_asset_code text,
  stellar_issuer text,
  stellar_tx_hash text,
  soroban_contract_id text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Pools Table (Linked to Invoices)
create table public.pools (
  id uuid default gen_random_uuid() primary key,
  invoice_id uuid references public.invoices(id) not null,
  contract_id text not null,
  total_supply numeric not null,
  yield_rate numeric not null,
  filled_amount numeric default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Investments Table
create table public.investments (
  id uuid default gen_random_uuid() primary key,
  pool_id uuid references public.pools(id) not null,
  investor_id uuid references auth.users(id) not null,
  amount_usdc numeric not null,
  transaction_hash text,
  timestamp timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Row Level Security (RLS)
alter table public.invoices enable row level security;
alter table public.pools enable row level security;
alter table public.investments enable row level security;

-- Policies
create policy "Users can view their own invoices" on public.invoices
  for select using (auth.uid() = user_id);

create policy "Users can insert their own invoices" on public.invoices
  for insert with check (auth.uid() = user_id);

create policy "Everyone can view pools" on public.pools
  for select using (true);

create policy "Investors can view their own investments" on public.investments
  for select using (auth.uid() = investor_id);

create policy "Investors can insert their own investments" on public.investments
  for insert with check (auth.uid() = investor_id);
