create table if not exists public.dpg_products (
  id text primary key default gen_random_uuid()::text,
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null check (char_length(name) between 1 and 120),
  brand text not null check (char_length(brand) between 1 and 80),
  category text not null check (char_length(category) between 1 and 80),
  description text not null check (char_length(description) between 1 and 2000),
  image text not null check (image ~ '^https://'),
  reference text not null default '',
  badge text,
  colors text[] not null default '{}',
  specs text[] not null default '{}',
  price numeric check (price is null or price >= 0),
  stock integer not null default 0 check (stock >= 0),
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists dpg_products_published_created_at_idx
  on public.dpg_products (created_at desc)
  where is_published;

create index if not exists dpg_products_category_idx
  on public.dpg_products (category);

create index if not exists dpg_products_brand_idx
  on public.dpg_products (brand);

create or replace function public.set_dpg_products_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_dpg_products_updated_at on public.dpg_products;
create trigger set_dpg_products_updated_at
before update on public.dpg_products
for each row execute function public.set_dpg_products_updated_at();

create or replace function public.dpg_is_admin()
returns boolean
language sql
stable
as $$
  select
    coalesce(auth.jwt() -> 'app_metadata' ->> 'role' = 'admin', false)
    or coalesce((auth.jwt() -> 'app_metadata' -> 'roles') ? 'admin', false);
$$;

grant execute on function public.dpg_is_admin() to anon, authenticated;

alter table public.dpg_products enable row level security;

grant select on public.dpg_products to anon, authenticated;
grant insert, update, delete on public.dpg_products to authenticated;

drop policy if exists dpg_products_public_read on public.dpg_products;
create policy dpg_products_public_read
on public.dpg_products
for select
to anon, authenticated
using (is_published);

drop policy if exists dpg_products_admin_all on public.dpg_products;
create policy dpg_products_admin_all
on public.dpg_products
for all
to authenticated
using (public.dpg_is_admin())
with check (public.dpg_is_admin());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  true,
  4194304,
  array['image/jpeg', 'image/png', 'image/webp']::text[]
)
on conflict (id) do nothing;

drop policy if exists dpg_product_images_public_read on storage.objects;
create policy dpg_product_images_public_read
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'product-images');

drop policy if exists dpg_product_images_admin_insert on storage.objects;
create policy dpg_product_images_admin_insert
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'product-images'
  and (storage.foldername(name))[1] = 'products'
  and public.dpg_is_admin()
);

drop policy if exists dpg_product_images_admin_update on storage.objects;
create policy dpg_product_images_admin_update
on storage.objects
for update
to authenticated
using (
  bucket_id = 'product-images'
  and (storage.foldername(name))[1] = 'products'
  and public.dpg_is_admin()
)
with check (
  bucket_id = 'product-images'
  and (storage.foldername(name))[1] = 'products'
  and public.dpg_is_admin()
);

drop policy if exists dpg_product_images_admin_delete on storage.objects;
create policy dpg_product_images_admin_delete
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'product-images'
  and (storage.foldername(name))[1] = 'products'
  and public.dpg_is_admin()
);
