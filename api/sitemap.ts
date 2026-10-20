import type { IncomingMessage, ServerResponse } from 'node:http'
import { getProductsCollection, isCocobaseConfigured } from '../server/cocobase.js'
import { listProductDocuments, mapProduct } from '../server/products.js'

function escapeXml(value: string) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;')
}

export default async function handler(_request: IncomingMessage, response: ServerResponse) {
  response.setHeader('Content-Type', 'application/xml; charset=utf-8')
  response.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300')
  const origin = (process.env.VITE_SITE_URL || 'https://dani-porche-gadget.vercel.app').replace(/\/+$/, '')
  const paths = ['/', '/shop', '/about', '/support']

  try {
    if (!isCocobaseConfigured()) throw new Error('CocoBase is not configured.')
    const products = (await listProductDocuments(getProductsCollection()))
      .filter((document) => document.data.isPublished === true)
      .map(mapProduct)
      .filter((product) => product !== null)
    paths.push(...products.map((product) => `/products/${encodeURIComponent(product.slug)}`))
    const urls = paths.map((path) => `  <url><loc>${escapeXml(`${origin}${path}`)}</loc></url>`).join('\n')
    response.statusCode = 200
    response.end(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`)
  } catch (error) {
    console.error('Sitemap generation failed:', error)
    response.setHeader('Cache-Control', 'no-store')
    response.statusCode = 502
    response.end('<?xml version="1.0" encoding="UTF-8"?><error>Sitemap unavailable</error>')
  }
}
