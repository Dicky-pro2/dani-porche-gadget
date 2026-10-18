import { imageUrl } from '../constants/siteConfig'

export type Product = {
  slug: string
  name: string
  brand: string
  category: string
  image: string
  description: string
  reference: string
  badge?: string
  colors: string[]
  specs: string[]
}

export const products: Product[] = [
  {
    slug: 'nova-pro-smartphone',
    name: 'Nova Pro smartphone',
    brand: 'Dani selects',
    category: 'Smartphones',
    image: imageUrl('photo-1511707171634-5f897ff02aa9'),
    description: 'A refined everyday smartphone pick, selected for its considered design, bright display, and dependable performance.',
    reference: 'DPG-101',
    badge: 'Staff pick',
    colors: ['Graphite', 'Silver', 'Sage'],
    specs: ['Large immersive display', 'Multi-lens camera system', 'All-day battery design'],
  },
  {
    slug: 'studio-wireless-headphones',
    name: 'Studio wireless headphones',
    brand: 'Sound essentials',
    category: 'Audio & earbuds',
    image: imageUrl('photo-1505740420928-5e560c06d30e'),
    description: 'Comfort-focused wireless listening for commutes, work sessions, and everything in between.',
    reference: 'DPG-102',
    badge: 'Popular',
    colors: ['Black', 'Cream'],
    specs: ['Wireless listening', 'Over-ear comfort', 'Foldable travel design'],
  },
  {
    slug: 'everyday-smartwatch',
    name: 'Everyday smartwatch',
    brand: 'Connected living',
    category: 'Smartwatches',
    image: imageUrl('photo-1523275335684-37898b6baf30'),
    description: 'A clean, modern wearable to keep useful everyday information close at hand.',
    reference: 'DPG-103',
    colors: ['Black', 'Sand', 'Sage'],
    specs: ['Touch display', 'Activity tracking features', 'Interchangeable strap style'],
  },
  {
    slug: 'portable-power-bank',
    name: 'Portable power bank',
    brand: 'Power essentials',
    category: 'Power & charging',
    image: imageUrl('photo-1609091839311-d5365f9ff1c5'),
    description: 'A portable charging companion for days when your devices need a little extra power.',
    reference: 'DPG-104',
    colors: ['Graphite', 'White'],
    specs: ['Pocket-friendly profile', 'USB charging output', 'Travel-ready design'],
  },
  {
    slug: 'slim-laptop',
    name: 'Slim everyday laptop',
    brand: 'Work & create',
    category: 'Laptops & tablets',
    image: imageUrl('photo-1496181133206-80ce9b88a853'),
    description: 'A considered laptop choice for getting through work, study, and creative projects.',
    reference: 'DPG-105',
    colors: ['Silver', 'Space grey'],
    specs: ['Slim portable design', 'High-resolution display', 'Comfortable full-size keyboard'],
  },
  {
    slug: 'wireless-earbuds',
    name: 'Wireless earbuds',
    brand: 'Sound essentials',
    category: 'Audio & earbuds',
    image: imageUrl('photo-1606220945770-b5b6c2c55bf1'),
    description: 'Compact earbuds designed to make everyday listening easy at home or on the move.',
    reference: 'DPG-106',
    badge: 'New arrival',
    colors: ['White', 'Black'],
    specs: ['Compact charging case', 'Touch controls', 'Comfort-fit design'],
  },
  {
    slug: 'tablet-for-everyday',
    name: 'Everyday tablet',
    brand: 'Dani selects',
    category: 'Laptops & tablets',
    image: imageUrl('photo-1544244015-0df4b3ffc6b0'),
    description: 'A versatile tablet pick for browsing, reading, streaming, and staying productive.',
    reference: 'DPG-107',
    colors: ['Silver', 'Graphite'],
    specs: ['Bright touch display', 'Lightweight body', 'Front and rear cameras'],
  },
  {
    slug: 'phone-accessory-kit',
    name: 'Everyday tech accessories',
    brand: 'Useful extras',
    category: 'Accessories',
    image: imageUrl('photo-1523206489230-c012c64b2b48'),
    description: 'Useful finishing touches selected to help your everyday devices fit your routine.',
    reference: 'DPG-108',
    colors: ['Ask about available options'],
    specs: ['Useful everyday essentials', 'Device-friendly design', 'Ask us about available options'],
  },
]

export const getProduct = (slug: string) => products.find((product) => product.slug === slug)
