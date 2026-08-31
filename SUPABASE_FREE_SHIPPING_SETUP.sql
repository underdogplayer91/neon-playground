create extension if not exists pgcrypto;

create table if not exists public.checkout_voucher_claims (
  id uuid primary key default gen_random_uuid(),
  claim_session text not null unique,
  shipping_value integer not null default 20 check (shipping_value = 20),
  warranty_months integer not null default 6 check (warranty_months = 6),
  claimed_at timestamptz not null default now(),
  expires_at timestamptz not null,
  used_at timestamptz,
  order_reference text
);

alter table public.checkout_voucher_claims
  add column if not exists warranty_months integer not null default 6;

alter table public.checkout_voucher_claims enable row level security;

create index if not exists checkout_voucher_claims_order_idx
  on public.checkout_voucher_claims (order_reference);
