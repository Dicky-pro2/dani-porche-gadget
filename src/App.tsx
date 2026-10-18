import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AdminAuthProvider } from './admin/AdminAuth'
import { AdminLayout } from './admin/layouts/AdminLayout'
import { AdminDashboardPage } from './admin/pages/AdminDashboardPage'
import { AdminLoginPage } from './admin/pages/AdminLoginPage'
import { AdminManagementPage } from './admin/pages/AdminManagementPage'
import { ProtectedRoute } from './admin/ProtectedRoute'
import { Footer } from './components/layout/Footer'
import { Navbar } from './components/layout/Navbar'
import { AboutPage } from './pages/AboutPage'
import { HomePage } from './pages/HomePage'
import { NotFoundPage } from './pages/NotFoundPage'
import { ProductDetailsPage } from './pages/ProductDetailsPage'
import { ShopPage } from './pages/ShopPage'
import { SupportPage } from './pages/SupportPage'
import { routes } from './constants/routes'
import './App.css'

function StorefrontLayout() {
  return (
    <div className="store-shell">
      <Navbar />
      <main>
        <Routes>
          <Route path={routes.home} element={<HomePage />} />
          <Route path={routes.shop} element={<ShopPage />} />
          <Route path={routes.productDetails} element={<ProductDetailsPage />} />
          <Route path={routes.about} element={<AboutPage />} />
          <Route path={routes.support} element={<SupportPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AdminAuthProvider>
        <Routes>
          <Route path={routes.adminLogin} element={<AdminLoginPage />} />
          <Route
            path={routes.admin}
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminDashboardPage />} />
            <Route path={routes.adminProducts} element={<AdminManagementPage section="Products" />} />
            <Route path={routes.adminCategories} element={<AdminManagementPage section="Categories" />} />
            <Route path={routes.adminInventory} element={<AdminManagementPage section="Inventory" />} />
            <Route path={routes.adminOrders} element={<AdminManagementPage section="Orders" />} />
            <Route path={routes.adminReports} element={<AdminManagementPage section="Reports" />} />
          </Route>
          <Route path="/*" element={<StorefrontLayout />} />
        </Routes>
      </AdminAuthProvider>
    </BrowserRouter>
  )
}

export default App
