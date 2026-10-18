import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { imageUrl } from '../../constants/siteConfig'
import { Container } from '../common/Container'

export function NewArrivals() {
  return (
    <section className="section new-arrivals">
      <Container>
        <div className="arrival-card">
          <div className="arrival-image"><img src={imageUrl('photo-1606220945770-b5b6c2c55bf1', 1000)} alt="Wireless earbuds, shown as an example of new arrivals" loading="lazy" /></div>
          <div className="arrival-copy">
            <div className="section-kicker">Just landed · sample preview</div>
            <h3>Fresh finds.<br />Everyday favourites.</h3>
            <p>Explore a rotating edit of useful new tech and accessories. Ask us for current availability and details.</p>
            <Link className="text-link" to="/shop">DISCOVER THE COLLECTION <ArrowRight size={14} /></Link>
          </div>
        </div>
      </Container>
    </section>
  )
}
