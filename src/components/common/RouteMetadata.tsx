import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { getProduct } from '../../data/products'
import { siteConfig, siteOrigin } from '../../constants/siteConfig'

const defaultDescription = 'Thoughtfully selected smartphones, gadgets, and everyday tech from Dani Porshe Gadget.'

function setMeta(attribute: 'name' | 'property', key: string, content: string) {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`)
  if (!element) {
    element = document.createElement('meta')
    element.setAttribute(attribute, key)
    document.head.append(element)
  }
  element.content = content
}

export function RouteMetadata() {
  const { pathname } = useLocation()

  useEffect(() => {
    const isAdmin = pathname === '/admin' || pathname.startsWith('/admin/')
    const productMatch = pathname.match(/^\/products\/([^/]+)$/)
    const product = productMatch ? getProduct(decodeURIComponent(productMatch[1])) : undefined
    const pages: Record<string, { title: string; description: string }> = {
      '/': { title: 'Tech that moves you', description: defaultDescription },
      '/shop': { title: 'Shop electronics & gadgets', description: 'Browse the sample smartphone, audio, laptop, smartwatch, and accessory collection from Dani Porshe Gadget.' },
      '/about': { title: 'About us', description: 'Learn about Dani Porshe Gadget and our thoughtful approach to choosing everyday technology.' },
      '/support': { title: 'Support & contact', description: 'Ask Dani Porshe Gadget about products, availability, and how to order.' },
    }
    const page = isAdmin
      ? { title: 'Admin preview', description: 'Administration design preview for Dani Porshe Gadget.' }
      : product
        ? { title: product.name, description: product.description }
        : pages[pathname] ?? { title: 'Page not found', description: 'The requested Dani Porshe Gadget page could not be found.' }
    const title = `${page.title} | ${siteConfig.name}`
    const canonicalPath = product ? `/products/${product.slug}` : pathname
    const canonicalUrl = `${siteOrigin}${canonicalPath}`

    document.title = title
    setMeta('name', 'description', page.description)
    setMeta('name', 'robots', isAdmin ? 'noindex, nofollow' : 'index, follow')
    setMeta('property', 'og:title', title)
    setMeta('property', 'og:description', page.description)
    setMeta('property', 'og:url', canonicalUrl)
    setMeta('property', 'og:image', `${siteOrigin}/apple-touch-icon.png`)
    setMeta('name', 'twitter:title', title)
    setMeta('name', 'twitter:description', page.description)

    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
    if (!canonical) {
      canonical = document.createElement('link')
      canonical.rel = 'canonical'
      document.head.append(canonical)
    }
    canonical.href = canonicalUrl
  }, [pathname])

  return null
}
