import { ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { productPath } from '../../constants/routes'
import type { Product } from '../../data/products'
import { WhatsAppOrderButton } from './WhatsAppOrderButton'

export function ProductCard({ product }: { product: Product }) {
  return (
    <article className="product-card">
      <Link className="product-image-wrap" to={productPath(product.slug)} aria-label={`View ${product.name}`}>
        {product.badge && <span className="product-label">{product.badge}</span>}
        <img src={product.image} alt={product.name} width="900" height="600" loading="lazy" />
      </Link>
      <div className="product-meta">
        <div className="product-brand">{product.brand}</div>
        <Link to={productPath(product.slug)} className="product-name">{product.name}</Link>
        <div className="product-price">Price on request</div>
        <div className="prototype-note">Sample listing · confirm price & availability</div>
        <div className="card-actions">
          <WhatsAppOrderButton compact product={product} />
          <Link className="icon-button" to={productPath(product.slug)} aria-label={`View ${product.name}`}><ArrowUpRight size={15} /></Link>
        </div>
      </div>
    </article>
  )
}
