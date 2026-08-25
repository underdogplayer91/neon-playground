alter table public.orders
  add column if not exists followup_email_sent_at timestamptz;

create index if not exists orders_pending_followup_idx
  on public.orders (created_at)
  where payment_status in ('unpaid', 'failed')
    and followup_email_sent_at is null;
