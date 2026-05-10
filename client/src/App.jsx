import { useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import api, { setAuthToken } from "./lib/api.js";
import { useAuthStore } from "./store/authStore.js";

import { ErrorBoundary } from "./components/ErrorBoundary.jsx";
import { MainLayout } from "./components/layout/MainLayout.jsx";

import { HomePage } from "./pages/HomePage.jsx";
import { ProductListPage } from "./pages/ProductListPage.jsx";
import { ProductDetailPage } from "./pages/ProductDetailPage.jsx";
import { SearchPage } from "./pages/SearchPage.jsx";
import { CartPage } from "./pages/CartPage.jsx";
import { CheckoutPage } from "./pages/CheckoutPage.jsx";
import { LoginPage } from "./pages/LoginPage.jsx";
import { RegisterPage } from "./pages/RegisterPage.jsx";
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage.jsx";
import { ResetPasswordPage } from "./pages/ResetPasswordPage.jsx";
import { AccountPage } from "./pages/AccountPage.jsx";
import { OrderDetailPage } from "./pages/OrderDetailPage.jsx";
import {
  AboutPage,
  ContactPage,
  FaqPage,
  PrivacyPage,
  TermsPage,
} from "./pages/StaticPages.jsx";
import { TinyLink404 } from "./components/ErrorBoundary.jsx";

import { AdminLoginPage } from "./pages/admin/AdminLoginPage.jsx";
import { AdminLayout } from "./pages/admin/AdminLayout.jsx";
import { AdminDashboardPage } from "./pages/admin/AdminDashboardPage.jsx";
import { AdminOrdersPage } from "./pages/admin/AdminOrdersPage.jsx";
import { AdminProductsPage } from "./pages/admin/AdminProductsPage.jsx";
import { AdminCategoriesPage } from "./pages/admin/AdminCategoriesPage.jsx";
import { AdminCustomersPage } from "./pages/admin/AdminCustomersPage.jsx";
import { AdminCustomerDetailPage } from "./pages/admin/AdminCustomerDetailPage.jsx";
import { AdminSettingsPage } from "./pages/admin/AdminSettingsPage.jsx";

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
      </ErrorBoundary>
    </HelmetProvider>
  );
}
