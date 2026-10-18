export const siteConfig = {
  name: 'Dani Porshe Gadget',
  whatsappNumber: '',
  contactEmail: 'hello@daniporshegadget.example',
  prototypeLabel: 'Design preview · sample catalogue',
}

export const categories = [
  { name: 'Smartphones', image: 'photo-1511707171634-5f897ff02aa9' },
  { name: 'Laptops & tablets', image: 'photo-1496181133206-80ce9b88a853' },
  { name: 'Audio & earbuds', image: 'photo-1505740420928-5e560c06d30e' },
  { name: 'Power & charging', image: 'photo-1609091839311-d5365f9ff1c5' },
  { name: 'Smartwatches', image: 'photo-1523275335684-37898b6baf30' },
  { name: 'Accessories', image: 'photo-1523206489230-c012c64b2b48' },
]

export const imageUrl = (photoId: string, width = 900) =>
  `https://images.unsplash.com/${photoId}?auto=format&fit=crop&w=${width}&q=85`
