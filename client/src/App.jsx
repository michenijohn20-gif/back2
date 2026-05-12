import { lazy, Suspense, useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import api, { setAuthToken } from "./lib/api.js";
import { useAuthStore } from "./store/authStore.js";

import { ErrorBoundary } from "./components/ErrorBoundary.jsx";
import { MainLayout } from "./components/layout/MainLayout.jsx";
import { TinyLink404 } from "./components/ErrorBoundary.jsx";
import { LoadingState } from "./components/LoadingState.jsx";

const page = (loader, exportName) =>
  lazy(() => loader().then((mod) => ({ default: mod[exportName] })));

const HomePage = page(() => import("./pages/HomePage.jsx"), "HomePage");
const ProductListPage = page(() => import("./pages/ProductListPage.jsx"), "ProductListPage");
const ProductDetailPage = page(() => import("./pages/ProductDetailPage.jsx"), "ProductDetailPage");
const SearchPage = page(() => import("./pages/SearchPage.jsx"), "SearchPage");
const CartPage = page(() => import("./pages/CartPage.jsx"), "CartPage");
const CheckoutPage = page(() => import("./pages/CheckoutPage.jsx"), "CheckoutPage");
const LoginPage = page(() => import("./pages/LoginPage.jsx"), "LoginPage");
const RegisterPage = page(() => import("./pages/RegisterPage.jsx"), "RegisterPage");
const ForgotPasswordPage = page(() => import("./pages/ForgotPasswordPage.jsx"), "ForgotPasswordPage");
const ResetPasswordPage = page(() => import("./pages/ResetPasswordPage.jsx"), "ResetPasswordPage");
const AccountPage = page(() => import("./pages/AccountPage.jsx"), "AccountPage");
const OrderDetailPage = page(() => import("./pages/OrderDetailPage.jsx"), "OrderDetailPage");
const AboutPage = page(() => import("./pages/StaticPages.jsx"), "AboutPage");
const ContactPage = page(() => import("./pages/StaticPages.jsx"), "ContactPage");
const FaqPage = page(() => import("./pages/StaticPages.jsx"), "FaqPage");
const PrivacyPage = page(() => import("./pages/StaticPages.jsx"), "PrivacyPage");
const TermsPage = page(() => import("./pages/StaticPages.jsx"), "TermsPage");
const SuccessPage = page(() => import("./pages/StaticPages.jsx"), "SuccessPage");

const AdminLoginPage = page(() => import("./pages/admin/AdminLoginPage.jsx"), "AdminLoginPage");
const AdminLayout = page(() => import("./pages/admin/AdminLayout.jsx"), "AdminLayout");
const AdminDashboardPage = page(() => import("./pages/admin/AdminDashboardPage.jsx"), "AdminDashboardPage");
const AdminOrdersPage = page(() => import("./pages/admin/AdminOrdersPage.jsx"), "AdminOrdersPage");
const AdminProductsPage = page(() => import("./pages/admin/AdminProductsPage.jsx"), "AdminProductsPage");
const AdminCategoriesPage = page(() => import("./pages/admin/AdminCategoriesPage.jsx"), "AdminCategoriesPage");
const AdminCustomersPage = page(() => import("./pages/admin/AdminCustomersPage.jsx"), "AdminCustomersPage");
const AdminCustomerDetailPage = page(() => import("./pages/admin/AdminCustomerDetailPage.jsx"), "AdminCustomerDetailPage");
const AdminSettingsPage = page(() => import("./pages/admin/AdminSettingsPage.jsx"), "AdminSettingsPage");

function AuthHydrate() {
  useEffect(() => {
    const run = async () => {
      useAuthStore.getState().hydrateToken();
      const token = useAuthStore.getState().accessToken;
      if (!token) return;
      setAuthToken(token);
      try {
        const { data } = await api.get("/api/auth/me");
        if (data.user) {
          useAuthStore.setState({ user: data.user });
        }
      } catch {
        useAuthStore.getState().logout();
      }
    };

    const timer = window.setTimeout(run, 50);
    return () => window.clearTimeout(timer);
  }, []);
  return null;
}

export default function App() {
  return (
    <HelmetProvider>
      <ErrorBoundary>
        <AuthHydrate />
        <Suspense fallback={<LoadingState label="Loading page..." className="px-4 py-10" />}>
          <Routes>
            <Route path="/admin/login" element={<AdminLoginPage />} />
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboardPage />} />
              <Route path="orders" element={<AdminOrdersPage />} />
              <Route path="products" element={<AdminProductsPage />} />
              <Route path="categories" element={<AdminCategoriesPage />} />
              <Route path="customers" element={<AdminCustomersPage />} />
              <Route path="customers/:id" element={<AdminCustomerDetailPage />} />
              <Route path="settings" element={<AdminSettingsPage />} />
              <Route path="*" element={<Navigate to="/admin" replace />} />
            </Route>

            <Route element={<MainLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/products" element={<ProductListPage />} />
              <Route path="/products/:slug" element={<ProductDetailPage />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/success" element={<SuccessPage />} />

              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />

              <Route path="/account" element={<AccountPage />} />
              <Route path="/account/orders/:orderNumber" element={<OrderDetailPage />} />

              <Route path="/about" element={<AboutPage />} />
              <Route path="/faq" element={<FaqPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />

              <Route path="*" element={<TinyLink404 />} />
            </Route>
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </HelmetProvider>
  );
}
