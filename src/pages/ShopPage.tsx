import { Search, SlidersHorizontal } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { categories } from '../constants/siteConfig'
import { products } from '../data/products'
import { Container } from '../components/common/Container'
import { ProductGrid } from '../components/products/ProductGrid'

export function ShopPage() {
  const [searchParams] = useSearchParams()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState(searchParams.get('category') ?? '')
  const [brand, setBrand] = useState('')
  const [sort, setSort] = useState('featured')
  const brands = [...new Set(products.map((product) => product.brand))]
  const filtered = useMemo(() => {
    const result = products.filter((product) =>
      (!category || product.category === category) &&
      (!brand || product.brand === brand) &&
      `${product.name} ${product.brand} ${product.category}`.toLowerCase().includes(search.toLowerCase()),
    )
    if (sort === 'name') result.sort((a, b) => a.name.localeCompare(b.name))
    if (sort === 'newest') result.sort((a, b) => Number(Boolean(b.badge?.includes('New'))) - Number(Boolean(a.badge?.includes('New'))))
    return result
  }, [brand, category, search, sort])

  return (
    <>
      <section className="page-hero"><Container><div className="breadcrumb">Home <span>/</span> Shop</div><div className="page-heading"><div className="section-kicker">Discover something useful</div><h1>The collection</h1><p>A sample catalogue for the Dani Porshe Gadget design preview. Ask us to confirm live pricing and availability.</p></div></Container></section>
      <Container>
        <div className="shop-layout">
          <aside className="filter-panel" aria-label="Product filters">
            <div className="filter-title"><span>Filters</span><SlidersHorizontal size={15} /></div>
            <div className="filter-group"><h3>Category</h3><label className="filter-option"><input type="radio" name="category" checked={!category} onChange={() => setCategory('')} /> All categories</label>{categories.map((item) => <label className="filter-option" key={item.name}><input type="radio" name="category" checked={category === item.name} onChange={() => setCategory(item.name)} /> {item.name}</label>)}</div>
            <div className="filter-group"><h3>Brand / collection</h3><label className="filter-option"><input type="radio" name="brand" checked={!brand} onChange={() => setBrand('')} /> All collections</label>{brands.map((item) => <label className="filter-option" key={item}><input type="radio" name="brand" checked={brand === item} onChange={() => setBrand(item)} /> {item}</label>)}</div>
            <div className="filter-group"><h3>Price</h3><span className="prototype-note">Price is confirmed by the shop. Please enquire for current details.</span></div>
          </aside>
          <div>
            <div className="shop-toolbar"><label className="search-field"><Search size={15} /><input aria-label="Search products" placeholder="Search products or brands" value={search} onChange={(event) => setSearch(event.target.value)} /></label><select aria-label="Sort products" value={sort} onChange={(event) => setSort(event.target.value)}><option value="featured">Sort: Featured</option><option value="name">Name: A to Z</option><option value="newest">Newest first</option></select></div>
            <p className="results-count">{filtered.length} sample {filtered.length === 1 ? 'product' : 'products'} · sample data only</p>
            <ProductGrid products={filtered} />
          </div>
        </div>
      </Container>
    </>
  )
}
