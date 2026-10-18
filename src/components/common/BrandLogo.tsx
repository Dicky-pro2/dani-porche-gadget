import { Link } from 'react-router-dom'
import { siteConfig } from '../../constants/siteConfig'

export function BrandLogo() {
  return (
    <Link className="brand-logo" to="/" aria-label={`${siteConfig.name} home`}>
      <img src="/dpg-logo.svg" alt={siteConfig.name} width="759" height="200" />
    </Link>
  )
}
