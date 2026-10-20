export const routes = {
  home: "/",
  shop: "/shop",
  cart: "/cart",
  checkout: "/checkout",
  orderConfirmation: "/order/confirmation",
  categories: "/#categories",
  about: "/about",
  support: "/support",
  admin: "/admin",
  adminLogin: "/admin/login",
  adminRegister: "/admin/register",
  adminProducts: "products",
  adminCategories: "categories",
  adminInventory: "inventory",
  adminOrders: "orders",
  adminReports: "reports",
  productDetails: "/products/:slug",
};

export const productPath = (slug: string) => `/products/${slug}`;
