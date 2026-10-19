import { useProductsContext } from '../context/productsStore'

export function useProducts() {
  const { products, loading, error, refetch } = useProductsContext()
  return { products, loading, error, refetch }
}
