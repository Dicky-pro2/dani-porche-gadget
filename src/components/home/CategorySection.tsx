import { Link } from 'react-router-dom'
import { categories, imageUrl } from '../../constants/siteConfig'
import { Container } from '../common/Container'
import { SectionHeading } from '../common/SectionHeading'

export function CategorySection() {
  return (
    <section className="section" id="categories">
      <Container>
        <SectionHeading kicker="Find your thing" title="Shop by category" description="Explore useful tech for every part of your day." action={<Link className="text-link" to="/shop">ALL CATEGORIES <span>↗</span></Link>} />
        <div className="category-grid">
          {categories.map((category) => (
            <Link className="category-card" to={`/shop?category=${encodeURIComponent(category.name)}`} key={category.name}>
              <img src={imageUrl(category.image, 520)} alt="" width="520" height="347" loading="lazy" />
              <span>{category.name}</span>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  )
}
