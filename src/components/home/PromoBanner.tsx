import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Container } from '../common/Container'

export function PromoBanner() {
  return (
    <section className="promo">
      <Container><div className="promo-inner"><div><div className="section-kicker">A note from the shop</div><h2>Your next favourite is out there.</h2><p>Browse the collection or ask us what is currently available.</p></div><Link className="button button-primary" to="/shop">EXPLORE THE SHOP <ArrowRight size={14} /></Link></div></Container>
    </section>
  )
}
