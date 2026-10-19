import { siteConfig } from '../constants/siteConfig'
import type { Product } from '../data/products'

export function createWhatsAppUrl(product: Product, variant = '', quantity = 1) {
  const details = [
    `Hello, I'm interested in ${product.name}.`,
    variant ? `Option: ${variant}.` : '',
    `Quantity: ${quantity}.`,
    `Product reference: ${product.reference}.`,
    product.price !== null ? `Listed price: ${formatPrice(product.price)}.` : '',
    'Could you please confirm current availability and price?',
  ].filter(Boolean).join(' ')
  const number = siteConfig.whatsappNumber.replace(/\D/g, '')
  return `https://wa.me/${number}?text=${encodeURIComponent(details)}`
}

export function createGeneralWhatsAppUrl(message: string) {
  const number = siteConfig.whatsappNumber.replace(/\D/g, '')
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`
}

export function formatPrice(price: number | null) {
  if (price === null) return 'Price on request'
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(price)
}

export function stockLabel(stock: number) {
  if (stock === 0) return 'Out of stock'
  if (stock <= 3) return 'Low stock'
  return 'In stock'
}
