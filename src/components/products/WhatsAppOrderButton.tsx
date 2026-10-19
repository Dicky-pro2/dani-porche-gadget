import { MessageCircle } from 'lucide-react'
import type { Product } from '../../data/products'
import { isWhatsAppConfigured } from '../../constants/siteConfig'
import { createWhatsAppUrl } from '../../services/whatsappService'

export function WhatsAppOrderButton({ product, variant = '', quantity = 1, compact = false }: { product: Product; variant?: string; quantity?: number; compact?: boolean }) {
  if (!isWhatsAppConfigured()) {
    if (!import.meta.env.DEV) return null
    return <button className="button button-primary" type="button" disabled><MessageCircle size={compact ? 14 : 16} />WhatsApp number not set</button>
  }
  return (
    <a className="button button-primary" href={createWhatsAppUrl(product, variant, quantity)} target="_blank" rel="noreferrer" aria-label={`Ask about ${product.name} on WhatsApp`}>
      <MessageCircle size={compact ? 14 : 16} />{product.stock === 0 ? "Ask when it's back" : compact ? 'Ask on WhatsApp' : 'Ask about this product'}
    </a>
  )
}
