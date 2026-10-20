# Dani Porshe Gadget

A responsive React, TypeScript, and Vite storefront with product data managed in CocoBase and a protected owner administration area. Customers can browse products and send an enquiry through WhatsApp; the site does not take payment or confirm orders.

## Local development

Install dependencies with `npm install`. Set `COCOBASE_API_KEY`, `COCOBASE_PRODUCTS_COLLECTION`, and `VITE_SITE_URL` in a local environment file. Run `npx vercel dev` to serve the Vite application together with the serverless API routes. `npm run dev` starts Vite only, so `/api/*` routes are not available through that command.

Use `npm run build` to type-check and create a production bundle, `npm run lint` to run ESLint, and `npm run test:api` to exercise validation and session helpers.

## CocoBase collection

The `products` collection (or the name set in `COCOBASE_PRODUCTS_COLLECTION`) stores each product in the document's `data` object:

| Field | Type | Notes |
| --- | --- | --- |
| `slug` | string | Unique lower-case URL slug |
| `name` | string | Required |
| `brand` | string | Required |
| `category` | string | Required; choose a category configured in the site |
| `description` | string | Required |
| `image` | string | Required public HTTPS image URL |
| `reference` | string | Product reference |
| `badge` | string or null | Optional card label |
| `colors` | string array | Product options |
| `specs` | string array | Product details |
| `price` | number or null | Nigerian Naira when set |
| `stock` | non-negative integer | Displayed as in stock, low stock (1–3), or out of stock |
| `isPublished` | boolean | Only published products appear in the public storefront |
| `createdAt`, `updatedAt` | ISO date strings | Set by the server on writes |

The public `GET /api/products` endpoint returns published products only and is cached for up to a minute. Admin endpoints are server-authenticated, read drafts, and are always marked `no-store`.

## Vercel environment variables

Set these variables in Vercel under **Settings → Environment Variables** for both **Production** and **Preview**:

- `COCOBASE_API_KEY` — server-only CocoBase API key. Do not prefix it with `VITE_`.
- `COCOBASE_PRODUCTS_COLLECTION` — collection name; use `products` unless you chose another collection.
- `VITE_SITE_URL` — the canonical HTTPS origin of the deployment. Admin write requests are accepted only when the `Origin` header's host matches the host the request was sent to. This variable is used only for canonical URLs, Open Graph tags and the sitemap.

The owner must have a CocoBase account with the `admin` role. Admin sign-in is proxied through the server; the CocoBase access token is kept in a `Secure`, `HttpOnly`, `SameSite=Strict` cookie. The server verifies the account and `admin` role on every protected request. Do not grant the `admin` role to public users.

The application keeps CocoBase credentials and all database writes server-side. Product image uploads use CocoBase's `uploadFile` SDK feature and accept JPEG, PNG, and WebP files up to 4 MB. Product data is validated server-side, including unique slugs, HTTPS image URLs, price, stock, and array limits. The storefront sends WhatsApp enquiries; an enquiry does not confirm an order.

Login failures are delayed and rate-limited to five failures per IP per 15 minutes. This in-memory limit is best-effort and applies per serverless function instance; use platform-level rate limiting for a stronger global limit.

## Deployment and SEO

Vercel serves the API routes in `api/`, rewrites `/sitemap.xml` to the dynamic sitemap endpoint, and sends other non-API paths to the React application. The sitemap contains static storefront pages and currently published product URLs. Admin routes are marked `noindex, nofollow`; this is not a substitute for authentication.

The fallback canonical origin is `https://dani-porche-gadget.vercel.app`. Set `VITE_SITE_URL` explicitly before deploying to a different domain.
