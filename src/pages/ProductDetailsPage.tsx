import { ArrowLeft, Check, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Container } from '../components/common/Container'
import { ProductGrid } from '../components/products/ProductGrid'
import { WhatsAppOrderButton } from '../components/products/WhatsAppOrderButton'
import { getProduct, products } from '../data/products'

export function ProductDetailsPage() {
  const { slug = '' } = useParams()
  const product = getProduct(slug)
  const [variant, setVariant] = useState('')
  const [quantity, setQuantity] = useState(1)
  if (!product) return <Container><div className="empty-state" style={{ margin: '50px auto' }}>This sample product could not be found. <Link to="/shop">Return to the shop.</Link></div></Container>
  const related = products.filter((item) => item.slug !== product.slug && item.category === product.category).slice(0, 4)
  return (
    <>
      <Container>
        <div className="breadcrumb" style={{ paddingTop: 27 }}><Link to="/shop"><ArrowLeft size={12} /> Shop</Link><ChevronRight size={12} /> {product.name}</div>
        <div className="detail-layout">
          <div className="detail-image"><img src={product.image} alt={product.name} /></div>
          <div className="detail-copy">
            <div className="section-kicker">{product.brand} · sample listing</div>
            <h1>{product.name}</h1>
            <div className="detail-price">Price on request</div>
            <p>{product.description}</p>
            <div className="detail-note">This is prototype catalogue content, not a live stock listing. Message the shop to confirm current price, availability, and order details. Opening WhatsApp does not confirm an order.</div>
            <div className="detail-note"><Check size={13} /> Ask us to confirm current availability directly</div>
            <div className="variant-row"><label htmlFor="variant">Available option</label><select id="variant" value={variant} onChange={(event) => setVariant(event.target.value)}><option value="">Choose an option (optional)</option>{product.colors.map((color) => <option key={color} value={color}>{color}</option>)}</select></div>
            <div className="variant-row"><label htmlFor="quantity">Quantity</label><input className="quantity-input" id="quantity" type="number" min="1" max="99" value={quantity} onChange={(event) => setQuantity(Math.max(1, Number(event.target.value) || 1))} /></div>
            <div className="detail-actions"><WhatsAppOrderButton product={product} variant={variant} quantity={quantity} /><span className="prototype-note">Reference: {product.reference}</span></div>
            <div className="filter-group"><h3>Product details</h3>{product.specs.map((spec) => <div className="filter-option" key={spec}><Check size={13} /> {spec}</div>)}</div>
          </div>
        </div>
        {related.length > 0 && <section className="section products-section"><div className="section-kicker">Keep exploring</div><h2 style={{ font: '700 24px var(--font-display)', margin: '0 0 22px' }}>You may also like</h2><ProductGrid products={related} /></section>}
      </Container>
    </>
  )
}
