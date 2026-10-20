export const routes = {
  home: '/',
  shop: '/shop',
  categories: '/#categories',
  about: '/about',
  support: '/support',
  admin: '/admin',
  adminLogin: '/admin/login',
  adminRegister: '/admin/register',
  adminProducts: 'products',
  adminCategories: 'categories',
  adminInventory: 'inventory',
  adminOrders: 'orders',
  adminReports: 'reports',
  productDetails: '/products/:slug',
}

export const productPath = (slug: string) => `/products/${slug}`
