import { siteConfig } from '../constants/siteConfig'
import type { Product } from '../data/products'

export function createWhatsAppUrl(product: Product, variant = '', quantity = 1) {
  const details = [
    `Hello, I'm interested in ${product.name}.`,
    variant ? `Option: ${variant}.` : '',
    `Quantity: ${quantity}.`,
    `Product reference: ${product.reference}.`,
    'Could you please confirm current availability and price?',
  ].filter(Boolean).join(' ')
  const number = siteConfig.whatsappNumber.replace(/\D/g, '')
  return `https://wa.me/${number}?text=${encodeURIComponent(details)}`
}
