import { Container } from '../components/common/Container'
import { imageUrl } from '../constants/siteConfig'

export function AboutPage() {
  return (
    <>
      <section className="page-hero"><Container><div className="breadcrumb">Home <span>/</span> About</div><div className="page-heading"><div className="section-kicker">A little about us</div><h1>Good tech, thoughtfully found.</h1><p>A modern independent electronics shop, built around helping people find devices and everyday essentials that work for them.</p></div></Container></section>
      <Container><section className="about-block"><div><div className="section-kicker">Dani Porshe Gadget</div><h2>Useful things. A more personal way to shop.</h2><p>We believe buying technology should feel clear and considered. Our goal is to make it easier to explore the products you need and get answers from a real person before you decide.</p><p>Browse our current collection and contact the shop to confirm product details and availability.</p></div><img src={imageUrl('photo-1519389950473-47ba0277781c', 1000)} alt="A bright creative workspace with laptops and devices" width="1000" height="667" loading="lazy" /></section></Container>
    </>
  )
}
