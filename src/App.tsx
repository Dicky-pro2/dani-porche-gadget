import { BrowserRouter, Route, Routes } from "react-router-dom";
import { lazy, Suspense } from "react";
import { AdminAuthProvider } from "./admin/AdminAuth";
import { ProtectedRoute } from "./admin/ProtectedRoute";
import { Footer } from "./components/layout/Footer";
import { Navbar } from "./components/layout/Navbar";
import { AboutPage } from "./pages/AboutPage";
import { HomePage } from "./pages/HomePage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { ProductDetailsPage } from "./pages/ProductDetailsPage";
import { ShopPage } from "./pages/ShopPage";
import { SupportPage } from "./pages/SupportPage";
import { CartPage } from "./pages/CartPage";
import { CheckoutPage } from "./pages/CheckoutPage";
import { OrderConfirmationPage } from "./pages/OrderConfirmationPage";
import { routes } from "./constants/routes";
import { RouteMetadata } from "./components/common/RouteMetadata";
import { RouteScrollManager } from "./components/common/RouteScrollManager";
import { ProductsProvider } from "./context/ProductsContext";
import { CartProvider } from "./context/CartContext";
import "./App.css";

const AdminLayout = lazy(() =>
  import("./admin/layouts/AdminLayout").then((module) => ({
    default: module.AdminLayout,
  })),
);
const AdminDashboardPage = lazy(() =>
  import("./admin/pages/AdminDashboardPage").then((module) => ({
    default: module.AdminDashboardPage,
  })),
);
const AdminLoginPage = lazy(() =>
  import("./admin/pages/AdminLoginPage").then((module) => ({
    default: module.AdminLoginPage,
  })),
);
const AdminRegisterPage = lazy(() =>
  import("./admin/pages/AdminRegisterPage").then((module) => ({
    default: module.AdminRegisterPage,
  })),
);
const AdminManagementPage = lazy(() =>
  import("./admin/pages/AdminManagementPage").then((module) => ({
    default: module.AdminManagementPage,
  })),
);
const AdminOrdersPage = lazy(() =>
  import("./admin/pages/AdminOrdersPage").then((module) => ({
    default: module.AdminOrdersPage,
  })),
);
const AdminProductsPage = lazy(() =>
  import("./admin/pages/AdminProductsPage").then((module) => ({
    default: module.AdminProductsPage,
  })),
);
const AdminProductFormPage = lazy(() =>
  import("./admin/pages/AdminProductFormPage").then((module) => ({
    default: module.AdminProductFormPage,
  })),
);

function StorefrontLayout() {
  return (
    <div className="store-shell">
      <Navbar />
      <main>
        <Routes>
          <Route path={routes.home} element={<HomePage />} />
          <Route path={routes.shop} element={<ShopPage />} />
          <Route path={routes.cart} element={<CartPage />} />
          <Route path={routes.checkout} element={<CheckoutPage />} />
          <Route
            path={routes.orderConfirmation}
            element={<OrderConfirmationPage />}
          />
          <Route
            path={routes.productDetails}
            element={<ProductDetailsPage />}
          />
          <Route path={routes.about} element={<AboutPage />} />
          <Route path={routes.support} element={<SupportPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AdminAuthProvider>
        <ProductsProvider>
          <CartProvider>
            <RouteScrollManager />
            <RouteMetadata />
            <Routes>
              <Route
                path={routes.adminLogin}
                element={
                  <Suspense
                    fallback={<div className="admin-loading">Loading…</div>}
                  >
                    <AdminLoginPage />
                  </Suspense>
                }
              />
              <Route
                path={routes.adminRegister}
                element={
                  <Suspense
                    fallback={<div className="admin-loading">Loading…</div>}
                  >
                    <AdminRegisterPage />
                  </Suspense>
                }
              />
              <Route
                path={routes.admin}
                element={
                  <ProtectedRoute>
                    <Suspense
                      fallback={<div className="admin-loading">Loading…</div>}
                    >
                      <AdminLayout />
                    </Suspense>
                  </ProtectedRoute>
                }
              >
                <Route
                  index
                  element={
                    <Suspense
                      fallback={<div className="admin-loading">Loading…</div>}
                    >
                      <AdminDashboardPage />
                    </Suspense>
                  }
                />
                <Route
                  path={routes.adminProducts}
                  element={
                    <Suspense
                      fallback={<div className="admin-loading">Loading…</div>}
                    >
                      <AdminProductsPage />
                    </Suspense>
                  }
                />
                <Route
                  path={`${routes.adminProducts}/new`}
                  element={
                    <Suspense
                      fallback={<div className="admin-loading">Loading…</div>}
                    >
                      <AdminProductFormPage />
                    </Suspense>
                  }
                />
                <Route
                  path={`${routes.adminProducts}/:id`}
                  element={
                    <Suspense
                      fallback={<div className="admin-loading">Loading…</div>}
                    >
                      <AdminProductFormPage />
                    </Suspense>
                  }
                />
                <Route
                  path={routes.adminCategories}
                  element={
                    <Suspense
                      fallback={<div className="admin-loading">Loading…</div>}
                    >
                      <AdminManagementPage section="Categories" />
                    </Suspense>
                  }
                />
                <Route
                  path={routes.adminInventory}
                  element={
                    <Suspense
                      fallback={<div className="admin-loading">Loading…</div>}
                    >
                      <AdminManagementPage section="Inventory" />
                    </Suspense>
                  }
                />
                <Route
                  path={routes.adminOrders}
                  element={
                    <Suspense
                      fallback={<div className="admin-loading">Loading…</div>}
                    >
                      <AdminOrdersPage />
                    </Suspense>
                  }
                />
                <Route
                  path={routes.adminReports}
                  element={
                    <Suspense
                      fallback={<div className="admin-loading">Loading…</div>}
                    >
                      <AdminManagementPage section="Reports" />
                    </Suspense>
                  }
                />
              </Route>
              <Route path="/*" element={<StorefrontLayout />} />
            </Routes>
          </CartProvider>
        </ProductsProvider>
      </AdminAuthProvider>
    </BrowserRouter>
  );
}

export default App;
