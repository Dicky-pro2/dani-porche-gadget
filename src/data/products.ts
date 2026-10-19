export type Product = {
  id: string
  slug: string
  name: string
  brand: string
  category: string
  image: string
  description: string
  reference: string
  badge: string | null
  colors: string[]
  specs: string[]
  price: number | null
  stock: number
  isPublished: boolean
  createdAt: string
  updatedAt: string
}
