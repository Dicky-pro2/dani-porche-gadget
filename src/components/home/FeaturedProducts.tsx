import { Link } from 'react-router-dom'
import { useProducts } from '../../hooks/useProducts'
import { Container } from '../common/Container'
import { SectionHeading } from '../common/SectionHeading'
import { ProductGrid } from '../products/ProductGrid'

export function FeaturedProducts() {
  const { products, loading, error } = useProducts()

  return (
    <section className="section products-section">
      <Container>
        <SectionHeading kicker="A few good finds" title="Trending right now" description="A selection of useful tech and everyday essentials." action={<Link className="text-link" to="/shop">BROWSE THE SHOP <span>↗</span></Link>} />
        {loading
          ? <div className="empty-state" role="status">Loading products…</div>
          : error
            ? <div className="empty-state" role="alert">{error}</div>
            : <ProductGrid products={products.slice(0, 4)} />}
      </Container>
    </section>
  )
}
