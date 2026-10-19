import { createContext, useContext } from 'react'
import type { Product } from '../data/products'

export type ProductsContextValue = {
  products: Product[]
  loading: boolean
  error: string | null
  hasLoaded: boolean
  refetch: () => Promise<void>
  getFallbackProduct: (slug: string) => Promise<Product | null>
}

export const ProductsContext = createContext<ProductsContextValue | null>(null)

export function useProductsContext() {
  const context = useContext(ProductsContext)
  if (!context) throw new Error('Product hooks must be used inside ProductsProvider.')
  return context
}
