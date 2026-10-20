# Dani Porshe Gadget

A responsive React, TypeScript, and Vite storefront with product data in Supabase and a protected owner administration area. Customers can browse products and send an enquiry through WhatsApp; the site does not take payment or confirm orders.

## Local development

Install dependencies with `npm install`. Copy `.env.example` to `.env.local` and set `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, and `VITE_SITE_URL`. Run `npx vercel dev` to serve the Vite application together with the serverless API routes. `npm run dev` starts Vite only, so `/api/*` routes are not available through that command.

Use `npm run build` to type-check and create a production bundle, `npm run lint` to run ESLint, and `npm run test:api` to exercise validation, session, origin, and API authorization behavior.

## Supabase setup

Create a Supabase project, then run [`supabase/migrations/20261020000000_create_dpg_products_and_storage.sql`](./supabase/migrations/20261020000000_create_dpg_products_and_storage.sql) in the Supabase SQL Editor. The migration creates the dedicated `public.dpg_products` table, its indexes and Row Level Security policies, and a public `product-images` Storage bucket with a 4 MB limit and JPEG, PNG, and WebP MIME allow-list.

The migration is additive: it does not drop product rows or replace an existing bucket configuration. If `public.dpg_products` or the `product-images` bucket already exists, inspect its schema and settings before applying the migration; `create table if not exists` and `on conflict do nothing` intentionally leave existing objects unchanged.

Public users can select published products only. Administrator database and Storage operations require a Supabase Auth session whose **app metadata** contains `role: "admin"` (or a `roles` array containing `"admin"`). The same condition is checked in the Vercel API and enforced by RLS. Do not place the admin role in user-editable metadata.

### Administrator account

The `/admin/register` page lets people create a Supabase email/password account if email sign-ups are enabled in Supabase Auth. Registration creates an ordinary user only: it does not grant admin access or establish an admin session. The shop owner must promote the account before it can use protected admin features. The old CocoBase passwords and admin roles are not transferred.

To promote an account, find its user ID in Supabase **Authentication → Users**, then set the user's admin app metadata with the one-time local script:

1. Set `VITE_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in a trusted local shell. Never put the service-role key in a `VITE_` variable, client code, or Vercel project settings.
2. Run `node --env-file=.env.local scripts/set-admin-role.mjs <supabase-auth-user-uuid>`.
3. Sign in at `/admin/login` with that Supabase Auth account.

The Vercel API exchanges the password for Supabase Auth tokens, stores access and refresh tokens in `HttpOnly`, `Secure`, `SameSite=Strict` cookies, and validates the current user's admin app metadata on every protected request. Admin product and Storage calls use that user's access token with the public publishable key; the application does not need a service-role key at runtime.

## Product data and legacy export

The product schema preserves the fields used by the existing application: ID, slug, name, brand, category, description, image URL, reference, badge, colors, specifications, nullable price, stock, publication status, and creation/update timestamps. The public `/api/products` response shape remains `{ products }` or `{ product }`; admin routes continue to list, create, update, delete, and publish products.

If the CocoBase project becomes accessible, export its product documents before closing or changing it. The importer accepts a JSON array of documents in the shape returned by the existing backend (`{ id, data, created_at }`) or an object with a `documents` array. It validates records, preserves IDs and timestamps, and ignores already-imported IDs rather than overwriting destination rows.

1. Apply the SQL migration and configure `VITE_SUPABASE_URL`.
2. Set `SUPABASE_SERVICE_ROLE_KEY` only in a trusted local shell.
3. Run `node --env-file=.env.local scripts/import-cocobase-products.mjs <cocobase-export.json>`.
4. Review the import output and confirm products in the Supabase table before switching production traffic.

The importer does not delete or modify CocoBase data. It stops on malformed required product data instead of silently skipping it. Existing image URLs are retained. New uploads go to Supabase Storage; if an old image URL is no longer accessible, retrieve the original image and upload it again through the admin product form.

## Environment variables

Set these variables in Vercel for both **Production** and **Preview**:

- `VITE_SUPABASE_URL` — Supabase project URL.
- `VITE_SUPABASE_PUBLISHABLE_KEY` — public Supabase publishable key. The project uses this one public-key convention; do not also configure an anonymous-key variable.
- `VITE_SITE_URL` — canonical HTTPS storefront origin, used for metadata and the sitemap.

`SUPABASE_SERVICE_ROLE_KEY` is **not** required by the deployed application. Use it only in a trusted local shell for the one-time administrator-role setup or legacy data import scripts. Do not add it to Vercel or expose it to the browser.

## Security and storage

Product image uploads are sent through the authenticated `/api/admin/upload` route. The server checks the administrator session and request origin, enforces the 4 MB limit, matches the declared MIME type against the JPEG/PNG/WebP file signature, and uploads to a UUID-based path without overwriting existing files. The bucket is public because the storefront displays product images without authentication; only admins can create, update, or delete objects under `products/`.

The browser continues to call the existing Vercel API routes rather than connecting directly to Supabase. API routes use the public publishable key and, for admin operations, the current administrator's user access token. No service-role credential is used by API handlers or frontend code.

## Deployment and SEO

Keep the project root at the repository root so Vercel discovers the `api/` functions. The existing [`vercel.json`](./vercel.json) rewrites `/sitemap.xml` to the dynamic sitemap endpoint and sends other non-API paths to the React application; the migration preserves those rewrites. The sitemap includes static storefront pages and currently published product URLs. Admin routes are marked `noindex, nofollow`; this is not a substitute for authentication.

The fallback canonical origin is `https://dani-porche-gadget.vercel.app`. Set `VITE_SITE_URL` explicitly before deploying to another domain.
