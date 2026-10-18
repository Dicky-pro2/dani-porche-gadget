import { Menu, Search, ShoppingBag, X } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { routes } from '../../constants/routes'
import { BrandLogo } from '../common/BrandLogo'

const links = [
  ['Home', routes.home],
  ['Shop', routes.shop],
  ['Categories', routes.categories],
  ['About', routes.about],
  ['Support', routes.support],
]

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  return (
    <header className="site-header">
      <div className="nav-inner">
          <BrandLogo />
          <nav className={`nav-links ${menuOpen ? 'mobile-open' : ''}`} aria-label="Main navigation">
            {links.map(([label, href]) => <Link onClick={() => setMenuOpen(false)} key={label} to={href}>{label}</Link>)}
          </nav>
          <div className="nav-actions">
            <Link className="icon-button" to="/shop" aria-label="Search products"><Search size={17} strokeWidth={1.7} /></Link>
            <Link className="icon-button" to="/shop" aria-label="Browse products"><ShoppingBag size={17} strokeWidth={1.7} /></Link>
            <button className="icon-button menu-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-label={menuOpen ? 'Close menu' : 'Open menu'} aria-expanded={menuOpen}>
              {menuOpen ? <X size={19} /> : <Menu size={19} />}
            </button>
          </div>
      </div>
    </header>
  )
}
