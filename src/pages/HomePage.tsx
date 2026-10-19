import { BadgeCheck, Box, MessageCircle } from 'lucide-react'
import { CategorySection } from '../components/home/CategorySection'
import { FeaturedProducts } from '../components/home/FeaturedProducts'
import { HeroSection } from '../components/home/HeroSection'
import { NewArrivals } from '../components/home/NewArrivals'
import { PromoBanner } from '../components/home/PromoBanner'
import { TrustSection } from '../components/home/TrustSection'

export function HomePage() {
  return (
    <>
      <HeroSection />
      <div className="ticker" aria-label="Dani Porshe Gadget product catalogue">
        <span><BadgeCheck size={15} /> A CURATED COLLECTION</span>
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
