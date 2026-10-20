# Dani Porshe Gadget

A responsive React, TypeScript, and Vite storefront with product data in Supabase, hosted Paystack checkout, and a protected owner administration area. WhatsApp remains available for general enquiries.

## Local development

Install dependencies with `npm install`. Copy `.env.example` to `.env.local` and set `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, and `VITE_SITE_URL`. Keep `.env.local` and other local environment files out of shared ZIP archives; only `.env.example` is safe to share. Run `npx vercel dev` to serve the Vite application together with the serverless API routes. `npm run dev` starts Vite only, so `/api/*` routes are not available through that command.

Use `npm run build` to type-check and create a production bundle, `npm run lint` to run ESLint, and `npm run test:api` to exercise validation, session, origin, and API authorization behavior.

## Supabase setup

Create a Supabase project, then run [`supabase/migrations/20261020000000_create_dpg_products_and_storage.sql`](./supabase/migrations/20261020000000_create_dpg_products_and_storage.sql) followed by [`supabase/migrations/20261020120000_create_dpg_orders.sql`](./supabase/migrations/20261020120000_create_dpg_orders.sql) in the Supabase SQL Editor. The migrations create the product and order tables, stock reservation/payment RPCs, Row Level Security policies, and a public `product-images` Storage bucket with a 4 MB limit and JPEG, PNG, and WebP MIME allow-list.

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

- `SUPABASE_URL` — Supabase project URL. The API also accepts `VITE_SUPABASE_URL`.
- `SUPABASE_PUBLISHABLE_KEY` — public Supabase publishable key. The API also accepts `VITE_SUPABASE_PUBLISHABLE_KEY`; use one pair consistently.
- `VITE_SITE_URL` — canonical HTTPS storefront origin, used for metadata and the sitemap.

The existing admin product APIs continue to use the admin's Supabase access token. Order processing also requires `SUPABASE_SERVICE_ROLE_KEY` as a server-only Vercel setting for the narrowly scoped, private order/payment RPCs; never prefix it with `VITE_` or expose it in frontend code. The one-time admin-role and legacy import scripts also use this key only in a trusted local shell.

## Checkout setup

This storefront is NGN-priced and hosted on Vercel, so checkout uses [Paystack's hosted transaction flow](https://paystack.com/docs/api/transaction/). The app sends customers to Paystack; it never collects raw card details. The server initializes transactions in kobo, verifies the transaction reference, amount, and currency, and validates `charge.success` webhooks with Paystack's HMAC-SHA512 signature before marking an order paid. A browser return alone never confirms payment. Admin email notifications use [Resend's email API](https://resend.com/docs/api-reference/emails/send-email) and idempotency keys.

Apply both Supabase migrations in order before deploying. Confirm each sellable product has a positive NGN price with no more than two decimal places, correct available stock, and any options in its `colors` list. `DELIVERY_FEE_NGN` is a server-only fixed delivery fee and defaults to `0`; redeploy after changing it. Customer checkout details and price snapshots are stored in `dpg_orders`; failed or provider-confirmed abandoned transactions release stock, while a verified successful transaction reduces stock.

Configure these server-only variables in Vercel Production and Preview (and in `.env.local` when using `npx vercel dev`):

- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service-role secret. Required by server order processing; never expose it to the browser.
- `PAYSTACK_SECRET_KEY` — Paystack test secret key for Preview/sandbox and the live secret key only when intentionally enabling Production payments.
- `DELIVERY_FEE_NGN` — fixed NGN delivery fee, such as `0` or `2500`.
- `CRON_SECRET` — long random value used to authorize Vercel's scheduled reconciliation route. Vercel sends it as a bearer token when configured.
- `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `ADMIN_NOTIFICATION_EMAIL` — optional but recommended. Verify the sending domain in Resend and use a sender on that domain. Without all three, order emails are disabled; payment/order status remains available in admin.

In the Paystack dashboard, use **test mode** first. Configure the webhook URL as `https://<your-preview-domain>/api/paystack/webhook` and subscribe to `charge.success`. The webhook uses the same Paystack secret key for HMAC verification; set the matching test key in the Preview environment. The return URL is passed per transaction by the app. Do not use live credentials until the Preview flow, webhook, stock transitions, and admin order list have been checked end to end. Use Paystack's [official test payment instructions](https://paystack.com/docs/payments/test-payments/) for sandbox payment methods.

Safe sandbox test: create a low-stock test product with an NGN price; place an order with a valid test email and delivery address; use a Paystack test payment method from the official Paystack testing guide; confirm the order is first pending and then paid after server verification; check stock and the admin Orders page; retry the same checkout after refresh and confirm there is one order/reference; test a failed or abandoned payment and confirm stock is released only after provider verification. Also send a signed test webhook from Paystack and verify that replaying it does not duplicate stock changes or email notifications.

The Vercel cron in `vercel.json` runs every 15 minutes. It checks expired reservations with Paystack before settling them and retries pending notification delivery. Vercel Cron availability depends on the deployment plan; if unavailable, invoke the endpoint from a trusted scheduler with `Authorization: Bearer <CRON_SECRET>`.

## Security and storage

Product image uploads are sent through the authenticated `/api/admin/upload` route. The server checks the administrator session and request origin, enforces the 4 MB limit, matches the declared MIME type against the JPEG/PNG/WebP file signature, and uploads to a UUID-based path without overwriting existing files. The bucket is public because the storefront displays product images without authentication; only admins can create, update, or delete objects under `products/`.

The browser continues to call the existing Vercel API routes rather than connecting directly to Supabase. API routes use the public publishable key and, for admin operations, the current administrator's user access token. No service-role credential is used by API handlers or frontend code.

## Deployment and SEO

Keep the project root at the repository root so Vercel discovers the `api/` functions. The existing [`vercel.json`](./vercel.json) rewrites `/sitemap.xml` to the dynamic sitemap endpoint and sends other non-API paths to the React application; the migration preserves those rewrites. The sitemap includes static storefront pages and currently published product URLs. Admin routes are marked `noindex, nofollow`; this is not a substitute for authentication.

The fallback canonical origin is `https://dani-porche-gadget.vercel.app`. Set `VITE_SITE_URL` explicitly before deploying to another domain.
