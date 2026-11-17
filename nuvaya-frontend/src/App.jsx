import React from 'react';
import { BrowserRouter, Routes, Route, useSearchParams, Link } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import CartDrawer from './components/cart/CartDrawer';
import HomePage from './pages/store/HomePage';
import ShopPage from './pages/store/ShopPage';
import ProductDetailPage from './pages/store/ProductDetailPage';
import CheckoutPage from './pages/store/CheckoutPage';
import AdminLoginPage from './pages/admin/AdminLoginPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';

function OrderSubmittedPage() {
  const [params] = useSearchParams();
  return (
    <div style={{ maxWidth: 560, margin: '80px auto', padding: 32, background: '#fff', borderRadius: 16, border: '1px solid var(--brand-gold)', textAlign: 'center' }}>
      <h1 style={{ fontSize: '2.2rem', marginBottom: 10, color: 'var(--brand-plum)' }}>Order Reference Created</h1>
      <p style={{ fontWeight: 700, color: 'var(--brand-gold-dark)', marginBottom: 12 }}>Reference: {params.get('ref')}</p>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', marginBottom: 24 }}>
        Complete sending your prefilled message in WhatsApp. Please note that sending the WhatsApp message initiates order review with the NuVaya team and does not by itself constitute payment confirmation or a confirmed order.
      </p>
      <Link to="/shop" className="btn-primary">Continue Shopping</Link>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <CartProvider>
        <Navbar />
        <CartDrawer />
        <main style={{ minHeight: '75vh' }}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/shop" element={<ShopPage />} />
            <Route path="/product/:id" element={<ProductDetailPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/order-submitted" element={<OrderSubmittedPage />} />
            <Route path="/admin/login" element={<AdminLoginPage />} />
            <Route path="/admin" element={<AdminDashboardPage />} />
          </Routes>
        </main>
        <Footer />
      </CartProvider>
    </BrowserRouter>
  );
}
