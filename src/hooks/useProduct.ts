import { useCallback, useEffect, useState } from 'react'
import { useProductsContext } from '../context/productsStore'
import type { Product } from '../data/products'

export function useProduct(slug: string) {
  const { products, loading, error, hasLoaded, getFallbackProduct, refetch: refetchProducts } = useProductsContext()
  const [fallback, setFallback] = useState<{ slug: string; product: Product | null } | null>(null)
  const [fallbackFailure, setFallbackFailure] = useState<{ slug: string; message: string } | null>(null)
  const product = products.find((item) => item.slug === slug) ?? (fallback?.slug === slug ? fallback.product : null)

  useEffect(() => {
    if (!slug || loading || hasLoaded) return
    let active = true
    getFallbackProduct(slug)
      .then((item) => {
        if (active) setFallback({ slug, product: item })
      })
      .catch((caught: unknown) => {
        if (active) setFallbackFailure({ slug, message: caught instanceof Error ? caught.message : 'Unable to load this product.' })
      })
    return () => {
      active = false
    }
  }, [getFallbackProduct, hasLoaded, loading, slug])

  const refetch = useCallback(async () => {
    if (slug && !hasLoaded) {
      const item = await getFallbackProduct(slug)
      setFallback({ slug, product: item })
      return
    }
    await refetchProducts()
  }, [getFallbackProduct, hasLoaded, refetchProducts, slug])

  return {
    product,
    loading: loading || (!hasLoaded && !(fallback?.slug === slug) && fallbackFailure?.slug !== slug),
    error: fallbackFailure?.slug === slug
      ? fallbackFailure.message
      : fallback?.slug === slug && fallback.product
        ? null
        : error,
    refetch,
  }
}
