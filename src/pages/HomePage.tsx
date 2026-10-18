import { BadgeCheck, Box, MessageCircle } from 'lucide-react'
import { CategorySection } from '../components/home/CategorySection'
import { FeaturedProducts } from '../components/home/FeaturedProducts'
import { HeroSection } from '../components/home/HeroSection'
import { NewArrivals } from '../components/home/NewArrivals'
import { PromoBanner } from '../components/home/PromoBanner'
import { TrustSection } from '../components/home/TrustSection'
import { siteConfig } from '../constants/siteConfig'

export function HomePage() {
  return (
    <>
      <HeroSection />
      <div className="ticker" aria-label={siteConfig.prototypeLabel}>
        <span><BadgeCheck size={15} /> A CURATED SAMPLE COLLECTION</span>
        <span><Box size={15} /> AVAILABILITY CONFIRMED DIRECTLY</span>
        <span><MessageCircle size={15} /> FRIENDLY WHATSAPP ENQUIRIES</span>
      </div>
      <CategorySection />
      <FeaturedProducts />
      <NewArrivals />
      <TrustSection />
      <PromoBanner />
    </>
  )
}
