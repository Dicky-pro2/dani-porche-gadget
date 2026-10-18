import { Link } from 'react-router-dom'
import { routes } from '../../constants/routes'
import { Container } from '../common/Container'
import { BrandLogo } from '../common/BrandLogo'
import { siteConfig } from '../../constants/siteConfig'

export function Footer() {
  return (
    <footer className="site-footer">
      <Container>
        <div className="footer-grid">
          <div className="footer-brand">
            <BrandLogo />
            <p>Thoughtfully selected tech and everyday essentials. Find your next favourite thing with us.</p>
          </div>
          <div><h2 className="footer-heading">Explore</h2><div className="footer-links"><Link to={routes.shop}>Shop all</Link><Link to={routes.categories}>Categories</Link><Link to={routes.about}>Our story</Link></div></div>
          <div><h2 className="footer-heading">Help</h2><div className="footer-links"><Link to={routes.support}>Contact & support</Link><Link to={routes.support}>Ordering information</Link><Link to={routes.support}>Privacy & policies</Link></div></div>
          <div><h2 className="footer-heading">Get in touch</h2><div className="footer-links"><a href={`mailto:${siteConfig.contactEmail}`}>Contact the shop</a><a href="https://wa.me/?text=Hello%2C%20I%27d%20like%20to%20ask%20about%20your%20products." target="_blank" rel="noreferrer">WhatsApp enquiry</a><span>Contact details to be confirmed</span></div></div>
        </div>
        <div className="footer-bottom"><span>© {new Date().getFullYear()} {siteConfig.name}</span><span>Prototype catalogue · Content subject to confirmation</span></div>
      </Container>
    </footer>
  )
}
