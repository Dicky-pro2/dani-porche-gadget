import { MessageCircle } from 'lucide-react'
import type { Product } from '../../data/products'
import { createWhatsAppUrl } from '../../services/whatsappService'

export function WhatsAppOrderButton({ product, variant = '', quantity = 1, compact = false }: { product: Product; variant?: string; quantity?: number; compact?: boolean }) {
  return (
    <a className="button button-primary" href={createWhatsAppUrl(product, variant, quantity)} target="_blank" rel="noreferrer" aria-label={`Ask about ${product.name} on WhatsApp`}>
      <MessageCircle size={compact ? 14 : 16} />{compact ? 'Ask on WhatsApp' : 'Ask about this product'}
    </a>
  )
}
