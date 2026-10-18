import { Link } from 'react-router-dom'
import { products } from '../../data/products'
import { Container } from '../common/Container'
import { SectionHeading } from '../common/SectionHeading'
import { ProductGrid } from '../products/ProductGrid'

export function FeaturedProducts() {
  return (
    <section className="section products-section">
      <Container>
        <SectionHeading kicker="A few good finds" title="Trending right now" description="A small preview of the kind of tech you'll find in store." action={<Link className="text-link" to="/shop">BROWSE THE SHOP <span>↗</span></Link>} />
        <ProductGrid products={products.slice(0, 4)} />
      </Container>
    </section>
  )
}
