alter table public.dpg_products
  add column if not exists reserved_stock integer not null default 0 check (reserved_stock >= 0);

create table if not exists public.dpg_orders (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  idempotency_key text not null unique,
  customer_name text not null check (char_length(customer_name) between 2 and 120),
  email text not null check (char_length(email) <= 254),
  phone text not null check (char_length(phone) between 7 and 32),
  address text not null check (char_length(address) between 4 and 300),
  city text not null check (char_length(city) between 2 and 100),
  state text not null check (char_length(state) between 2 and 100),
  delivery_notes text not null default '' check (char_length(delivery_notes) <= 500),
  items jsonb not null check (jsonb_typeof(items) = 'array' and jsonb_array_length(items) between 1 and 20),
  subtotal numeric(14, 2) not null check (subtotal >= 0),
  delivery_fee numeric(14, 2) not null default 0 check (delivery_fee >= 0),
  total numeric(14, 2) not null check (total > 0),
  currency text not null default 'NGN' check (currency = 'NGN'),
  payment_status text not null default 'pending' check (payment_status in ('pending', 'paid', 'failed', 'expired')),
  fulfillment_status text not null default 'unfulfilled' check (fulfillment_status in ('unfulfilled', 'processing', 'shipped', 'delivered')),
  provider text not null default 'paystack' check (provider = 'paystack'),
  provider_reference text not null unique,
  provider_transaction_id text,
  authorization_url text,
  authorization_lock_until timestamptz,
  reservation_expires_at timestamptz not null default (now() + interval '30 minutes'),
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists dpg_orders_created_at_idx on public.dpg_orders (created_at desc);
create index if not exists dpg_orders_payment_status_idx on public.dpg_orders (payment_status);
create index if not exists dpg_orders_fulfillment_status_idx on public.dpg_orders (fulfillment_status);

create table if not exists public.dpg_order_notifications (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.dpg_orders(id) on delete cascade,
  event_type text not null,
  status text not null default 'pending' check (status in ('pending', 'sending', 'sent')),
  attempts integer not null default 0,
  locked_until timestamptz,
  sent_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  unique (order_id, event_type)
);

create or replace function public.set_dpg_orders_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_dpg_orders_updated_at on public.dpg_orders;
create trigger set_dpg_orders_updated_at
before update on public.dpg_orders
for each row execute function public.set_dpg_orders_updated_at();

create or replace function public.prevent_reserved_dpg_product_delete()
returns trigger
language plpgsql
as $$
begin
  if old.reserved_stock > 0 then
    raise exception 'A product with pending checkouts cannot be deleted.' using errcode = 'P0001';
  end if;
  return old;
end;
$$;

drop trigger if exists prevent_reserved_dpg_product_delete on public.dpg_products;
create trigger prevent_reserved_dpg_product_delete
before delete on public.dpg_products
for each row execute function public.prevent_reserved_dpg_product_delete();

create or replace function public.release_dpg_order_reservation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  line_item jsonb;
begin
  if old.payment_status = 'pending' and new.payment_status in ('paid', 'failed', 'expired') then
    for line_item in select value from jsonb_array_elements(new.items)
    loop
      update public.dpg_products
      set reserved_stock = reserved_stock - (line_item ->> 'quantity')::integer,
          stock = case when new.payment_status = 'paid'
            then stock - (line_item ->> 'quantity')::integer
            else stock end
      where id = line_item ->> 'productId';
    end loop;
  end if;
  return new;
end;
$$;

drop trigger if exists release_dpg_order_reservation on public.dpg_orders;
create trigger release_dpg_order_reservation
after update of payment_status on public.dpg_orders
for each row execute function public.release_dpg_order_reservation();

create or replace function public.dpg_create_order(
  p_reference text,
  p_idempotency_key text,
  p_customer jsonb,
  p_items jsonb,
  p_delivery_fee numeric
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  existing_order public.dpg_orders%rowtype;
  item jsonb;
  product_row public.dpg_products%rowtype;
  order_items jsonb := '[]'::jsonb;
  subtotal numeric(14, 2) := 0;
  item_quantity integer;
  previous_item_quantity integer;
  item_option text;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_idempotency_key, 0));

  select * into existing_order
  from public.dpg_orders
  where idempotency_key = p_idempotency_key;
  if found then
    return to_jsonb(existing_order);
  end if;

  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) not between 1 and 20 then
    raise exception 'Invalid order items.' using errcode = '22023';
  end if;
  if p_delivery_fee < 0 then
    raise exception 'Invalid delivery fee.' using errcode = '22023';
  end if;

  for item in select value from jsonb_array_elements(p_items)
  loop
    item_quantity := (item ->> 'quantity')::integer;
    item_option := coalesce(item ->> 'option', '');
    if item_quantity < 1 or item_quantity > 99 then
      raise exception 'Invalid item quantity.' using errcode = '22023';
    end if;

    select * into product_row
    from public.dpg_products
    where id = item ->> 'productId' and is_published
    for update;
    if not found or product_row.price is null or product_row.price <= 0 then
      raise exception 'A selected product is unavailable.' using errcode = 'P0001';
    end if;
    select coalesce(sum((existing_item ->> 'quantity')::integer), 0)::integer
    into previous_item_quantity
    from jsonb_array_elements(order_items) as existing(existing_item)
    where existing_item ->> 'productId' = product_row.id;
    if product_row.stock - product_row.reserved_stock + previous_item_quantity < previous_item_quantity + item_quantity then
      raise exception 'Insufficient stock for %.', product_row.name using errcode = 'P0001';
    end if;
    if (item ->> 'unitPrice') is null or round((item ->> 'unitPrice')::numeric, 2) <> round(product_row.price, 2) then
      raise exception 'Price changed for %.', product_row.name using errcode = 'P0001';
    end if;
    if cardinality(product_row.colors) > 0 and item_option <> '' and not (item_option = any(product_row.colors)) then
      raise exception 'A selected product option is unavailable.' using errcode = 'P0001';
    end if;
    if cardinality(product_row.colors) > 0 and item_option = '' then
      raise exception 'Choose an option for %.', product_row.name using errcode = 'P0001';
    end if;

    update public.dpg_products set reserved_stock = reserved_stock + item_quantity where id = product_row.id;
    subtotal := subtotal + round(product_row.price, 2) * item_quantity;
    order_items := order_items || jsonb_build_array(jsonb_build_object(
      'productId', product_row.id,
      'reference', product_row.reference,
      'name', product_row.name,
      'option', item_option,
      'quantity', item_quantity,
      'unitPrice', round(product_row.price, 2)
    ));
  end loop;

  insert into public.dpg_orders (
    reference, idempotency_key, customer_name, email, phone, address, city, state,
    delivery_notes, items, subtotal, delivery_fee, total, provider_reference
  ) values (
    p_reference,
    p_idempotency_key,
    p_customer ->> 'name',
    lower(p_customer ->> 'email'),
    p_customer ->> 'phone',
    p_customer ->> 'address',
    p_customer ->> 'city',
    p_customer ->> 'state',
    coalesce(p_customer ->> 'deliveryNotes', ''),
    order_items,
    subtotal,
    p_delivery_fee,
    subtotal + p_delivery_fee,
    p_reference
  ) returning * into existing_order;

  return to_jsonb(existing_order);
end;
$$;

create or replace function public.dpg_set_order_authorization(p_reference text, p_authorization_url text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.dpg_orders
  set authorization_url = p_authorization_url, authorization_lock_until = null
  where provider_reference = p_reference and payment_status = 'pending' and authorization_url is null;
  if not found then return false; end if;
  return true;
end;
$$;

create or replace function public.dpg_claim_order_authorization(p_reference text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.dpg_orders
  set authorization_lock_until = now() + interval '2 minutes'
  where provider_reference = p_reference
    and payment_status = 'pending'
    and authorization_url is null
    and (authorization_lock_until is null or authorization_lock_until < now());
  return found;
end;
$$;

create or replace function public.dpg_release_order_authorization(p_reference text)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.dpg_orders
  set authorization_lock_until = null
  where provider_reference = p_reference and authorization_url is null;
$$;

create or replace function public.dpg_set_order_payment(
  p_reference text,
  p_status text,
  p_transaction_id text default null,
  p_paid_at timestamptz default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  order_row public.dpg_orders%rowtype;
begin
  if p_status not in ('paid', 'failed', 'expired') then
    raise exception 'Invalid payment state.' using errcode = '22023';
  end if;
  select * into order_row from public.dpg_orders where provider_reference = p_reference for update;
  if not found then return null; end if;

  if order_row.payment_status = 'pending' then
    update public.dpg_orders
    set payment_status = p_status,
        provider_transaction_id = coalesce(p_transaction_id, provider_transaction_id),
        paid_at = case when p_status = 'paid' then coalesce(p_paid_at, now()) else null end
    where id = order_row.id
    returning * into order_row;
  end if;
  return to_jsonb(order_row);
end;
$$;

create or replace function public.dpg_claim_order_notification(p_order_id uuid, p_event_type text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  notification_id uuid;
begin
  insert into public.dpg_order_notifications (order_id, event_type)
  values (p_order_id, p_event_type)
  on conflict (order_id, event_type) do nothing;

  update public.dpg_order_notifications
  set status = 'sending', attempts = attempts + 1, locked_until = now() + interval '2 minutes'
  where order_id = p_order_id
    and event_type = p_event_type
    and status <> 'sent'
    and (status = 'pending' or locked_until < now())
  returning id into notification_id;
  return notification_id;
end;
$$;

create or replace function public.dpg_finish_order_notification(p_notification_id uuid, p_sent boolean, p_error text default null)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.dpg_order_notifications
  set status = case when p_sent then 'sent' else 'pending' end,
      sent_at = case when p_sent then now() else sent_at end,
      locked_until = null,
      last_error = case when p_sent then null else left(p_error, 500) end
  where id = p_notification_id;
$$;

alter table public.dpg_orders enable row level security;
alter table public.dpg_order_notifications enable row level security;

revoke all on public.dpg_orders, public.dpg_order_notifications from anon, authenticated;
grant select, update on public.dpg_orders to authenticated;
grant select on public.dpg_order_notifications to authenticated;

drop policy if exists dpg_orders_admin_read on public.dpg_orders;
create policy dpg_orders_admin_read on public.dpg_orders
for select to authenticated using (public.dpg_is_admin());

drop policy if exists dpg_orders_admin_fulfillment_update on public.dpg_orders;

drop policy if exists dpg_order_notifications_admin_read on public.dpg_order_notifications;
create policy dpg_order_notifications_admin_read on public.dpg_order_notifications
for select to authenticated using (public.dpg_is_admin());

create or replace function public.dpg_update_order_fulfillment(p_order_id uuid, p_status text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  order_row public.dpg_orders%rowtype;
begin
  if not public.dpg_is_admin() then
    raise exception 'Administrator access required.' using errcode = '42501';
  end if;
  if p_status not in ('unfulfilled', 'processing', 'shipped', 'delivered') then
    raise exception 'Invalid fulfillment status.' using errcode = '22023';
  end if;

  update public.dpg_orders
  set fulfillment_status = p_status
  where id = p_order_id
    and (p_status = 'unfulfilled' or payment_status = 'paid')
  returning * into order_row;
  if not found then
    raise exception 'Order not found or payment is not complete.' using errcode = 'P0001';
  end if;
  return to_jsonb(order_row);
end;
$$;

create or replace function public.dpg_admin_update_product(p_id text, p_product jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  product_row public.dpg_products%rowtype;
  reserved_count integer;
begin
  if not public.dpg_is_admin() then
    raise exception 'Administrator access required.' using errcode = '42501';
  end if;
  select reserved_stock into reserved_count
  from public.dpg_products
  where id = p_id
  for update;
  if not found then return null; end if;

  update public.dpg_products
  set slug = p_product ->> 'slug',
      name = p_product ->> 'name',
      brand = p_product ->> 'brand',
      category = p_product ->> 'category',
      description = p_product ->> 'description',
      image = p_product ->> 'image',
      reference = p_product ->> 'reference',
      badge = nullif(p_product ->> 'badge', ''),
      colors = array(select jsonb_array_elements_text(coalesce(p_product -> 'colors', '[]'::jsonb))),
      specs = array(select jsonb_array_elements_text(coalesce(p_product -> 'specs', '[]'::jsonb))),
      price = nullif(p_product ->> 'price', '')::numeric,
      stock = (p_product ->> 'stock')::integer + reserved_count,
      is_published = (p_product ->> 'is_published')::boolean
  where id = p_id
  returning * into product_row;
  return to_jsonb(product_row);
end;
$$;

revoke update on public.dpg_orders from authenticated;
revoke update on public.dpg_products from authenticated;

revoke all on function public.dpg_create_order(text, text, jsonb, jsonb, numeric) from public, anon, authenticated;
revoke all on function public.dpg_set_order_authorization(text, text) from public, anon, authenticated;
revoke all on function public.dpg_claim_order_authorization(text) from public, anon, authenticated;
revoke all on function public.dpg_release_order_authorization(text) from public, anon, authenticated;
revoke all on function public.dpg_set_order_payment(text, text, text, timestamptz) from public, anon, authenticated;
revoke all on function public.dpg_claim_order_notification(uuid, text) from public, anon, authenticated;
revoke all on function public.dpg_finish_order_notification(uuid, boolean, text) from public, anon, authenticated;
grant execute on function public.dpg_create_order(text, text, jsonb, jsonb, numeric) to service_role;
grant execute on function public.dpg_set_order_authorization(text, text) to service_role;
grant execute on function public.dpg_claim_order_authorization(text) to service_role;
grant execute on function public.dpg_release_order_authorization(text) to service_role;
grant execute on function public.dpg_set_order_payment(text, text, text, timestamptz) to service_role;
grant execute on function public.dpg_claim_order_notification(uuid, text) to service_role;
grant execute on function public.dpg_finish_order_notification(uuid, boolean, text) to service_role;
revoke all on function public.dpg_update_order_fulfillment(uuid, text) from public, anon;
grant execute on function public.dpg_update_order_fulfillment(uuid, text) to authenticated;
revoke all on function public.dpg_admin_update_product(text, jsonb) from public, anon;
grant execute on function public.dpg_admin_update_product(text, jsonb) to authenticated;