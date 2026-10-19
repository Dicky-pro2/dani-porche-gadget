import { ArrowRight } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useProducts } from '../../hooks/useProducts'
import { Button } from '../common/Button'

export function HeroSection() {
  const { products } = useProducts()
  const slides = useMemo(() => products.slice(0, 3), [products])
  const [activeIndex, setActiveIndex] = useState(0)
  const [nextIndex, setNextIndex] = useState<number | null>(null)
  const isTransitioning = useRef(false)
  const activeIndexRef = useRef(activeIndex)
  const transitionTimer = useRef<number | null>(null)

  const showSlide = useCallback((index: number) => {
    if (index === activeIndexRef.current || isTransitioning.current) return
    isTransitioning.current = true
    setNextIndex(index)
    transitionTimer.current = window.setTimeout(() => {
      activeIndexRef.current = index
      setActiveIndex(index)
      setNextIndex(null)
      isTransitioning.current = false
    }, 1000)
  }, [])

  useEffect(() => {
    const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)')
    let interval: number | null = null
    const syncAutoplay = () => {
      if (interval !== null) window.clearInterval(interval)
      interval = motionPreference.matches || slides.length < 2
        ? null
        : window.setInterval(() => showSlide((activeIndexRef.current + 1) % slides.length), 5200)
    }
    syncAutoplay()
    motionPreference.addEventListener('change', syncAutoplay)
    return () => {
      if (interval !== null) window.clearInterval(interval)
      motionPreference.removeEventListener('change', syncAutoplay)
      if (transitionTimer.current !== null) window.clearTimeout(transitionTimer.current)
    }
  }, [showSlide, slides.length])

  const activeProduct = slides[activeIndex] ?? slides[0]

  return (
    <section className="hero">
      <div className="hero-inner">
        <div className="hero-copy">
          <div className="eyebrow">Your next tech upgrade</div>
          <h1>TECH THAT<br /><span>MOVES YOU.</span></h1>
          <p>Discover smartphones, everyday essentials, and premium gadgets selected to keep you connected.</p>
          <div className="hero-actions">
            <Button to="/shop">EXPLORE COLLECTION <ArrowRight size={14} /></Button>
            <Link className="button button-link" to="/shop">VIEW LATEST ARRIVALS</Link>
          </div>
        </div>
        <div className="hero-visual" role="region" aria-label="Featured products" aria-roledescription="carousel">
          <div className="hero-disc" />
          {activeProduct && <img className={`hero-device${nextIndex !== null ? ' is-falling' : ''}`} src={activeProduct.image} alt={activeProduct.name} width="900" height="600" fetchPriority="high" />}
          {nextIndex !== null && slides[nextIndex] && <img className="hero-device is-arriving" src={slides[nextIndex].image} alt="" width="900" height="600" aria-hidden="true" />}
          <div className="hero-note"><strong>Made for your everyday</strong>Thoughtful tech, selected with care</div>
        </div>
      </div>
      {slides.length > 0 && <div className="hero-pagination" aria-label="Choose featured product">
        {slides.map((product, index) => (
          <button
            aria-label={`Show ${product.name}`}
            aria-current={index === activeIndex ? 'true' : undefined}
            className={index === activeIndex ? 'is-active' : ''}
            key={product.slug}
            onClick={() => showSlide(index)}
            type="button"
          />
        ))}
        <span>{String(activeIndex + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')}</span>
      </div>}
    </section>
  )
}
