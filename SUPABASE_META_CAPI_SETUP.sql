alter table public.orders
  add column if not exists meta_purchase_sent_at timestamptz,
  add column if not exists meta_purchase_event_id text,
  add column if not exists meta_purchase_response jsonb;

