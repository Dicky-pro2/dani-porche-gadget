import { Link } from 'react-router-dom'
import logo from '../../assets/Dani-porche-logo.svg'
import { siteConfig } from '../../constants/siteConfig'

export function BrandLogo() {
  return (
    <Link className="brand-logo" to="/" aria-label={`${siteConfig.name} home`}>
      <img src={logo} alt={siteConfig.name} />
    </Link>
  )
}
