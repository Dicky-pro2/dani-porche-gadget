import type { Product } from '../../data/products'
import { ProductCard } from './ProductCard'

export function ProductGrid({ products }: { products: Product[] }) {
  if (!products.length) return <div className="empty-state">No matching products. Try another search or filter.</div>
  return <div className="product-grid">{products.map((product) => <ProductCard key={product.slug} product={product} />)}</div>
}
