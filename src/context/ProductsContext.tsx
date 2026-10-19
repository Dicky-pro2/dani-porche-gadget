import { useCallback, useEffect, useRef, useState, type PropsWithChildren } from 'react'
import type { Product } from '../data/products'
import { getProductBySlug, listPublishedProducts } from '../services/productsService'
import { ProductsContext } from './productsStore'

export function ProductsProvider({ children }: PropsWithChildren) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasLoaded, setHasLoaded] = useState(false)
  const lastFetchAt = useRef(0)
  const inflight = useRef<Promise<void> | null>(null)
  const fallbacks = useRef(new Map<string, Promise<Product | null>>())

  const runFetch = useCallback(() => {
    if (inflight.current) return inflight.current
    lastFetchAt.current = Date.now()
    const request = listPublishedProducts()
      .then((items) => {
        setProducts(items)
        setError(null)
        setHasLoaded(true)
      })
      .catch((caught: unknown) => {
        setError(caught instanceof Error ? caught.message : 'Unable to load products.')
        setHasLoaded(false)
      })
      .finally(() => {
        setLoading(false)
        inflight.current = null
      })
    inflight.current = request
    return request
  }, [])

  const refetch = useCallback(() => {
    setLoading(true)
    setError(null)
    return runFetch()
  }, [runFetch])

  const getFallbackProduct = useCallback((slug: string) => {
    const existing = fallbacks.current.get(slug)
    if (existing) return existing
    const request = getProductBySlug(slug).finally(() => fallbacks.current.delete(slug))
    fallbacks.current.set(slug, request)
    return request
  }, [])

  useEffect(() => {
    void runFetch()
  }, [runFetch])

  useEffect(() => {
    const handleFocus = () => {
      if (Date.now() - lastFetchAt.current >= 30_000) void runFetch()
    }
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [runFetch])

  return (
    <ProductsContext.Provider value={{ products, loading, error, hasLoaded, refetch, getFallbackProduct }}>
      {children}
    </ProductsContext.Provider>
  )
}
