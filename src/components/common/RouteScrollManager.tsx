import { useLayoutEffect } from 'react'
import { useLocation } from 'react-router-dom'

export function RouteScrollManager() {
  const { pathname, hash } = useLocation()

  useLayoutEffect(() => {
    const scrollToLocation = () => {
      const targetId = hash ? decodeURIComponent(hash.slice(1)) : ''
      const target = targetId ? document.getElementById(targetId) : null
      const top = target ? target.getBoundingClientRect().top + window.scrollY : 0
      window.scrollTo({ top, behavior: 'auto' })
    }

    const frame = window.requestAnimationFrame(scrollToLocation)
    return () => window.cancelAnimationFrame(frame)
  }, [pathname, hash])

  return null
}
