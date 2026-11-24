import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useSearchParams, useLocation, Link } from 'react-router-dom';
import axiosClient from './api/axiosClient';
import { trackMetaPageView } from './utils/metaPixel';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import WishlistPage from './pages/store/WishlistPage';
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import GlobalLoadingOverlay from './components/common/GlobalLoadingOverlay';
import NuvayaHelperChat from './components/common/NuvayaHelperChat';
import CartDrawer from './components/cart/CartDrawer';
import HomePage from './pages/store/HomePage';
import ShopPage from './pages/store/ShopPage';
import ProductDetailPage from './pages/store/ProductDetailPage';
import CheckoutPage from './pages/store/CheckoutPage';
import AdminLoginPage from './pages/admin/AdminLoginPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import TrackOrderPage from './pages/store/TrackOrderPage';

function OrderSubmittedPage() {
  const [params] = useSearchParams();
  const method = params.get('method') || 'WHATSAPP';
  const paid = params.get('paid') === '1';
  return (
    <div style={{ maxWidth: 580, margin: '80px auto', padding: 34, background: '#fff', borderRadius: 18, border: '1.5px solid var(--brand-gold)', textAlign: 'center', boxShadow: '0 18px 40px rgba(39,16,27,0.08)' }}>
      <h1 style={{ fontSize: '2.2rem', marginBottom: 10, color: 'var(--brand-plum)' }}>
        {paid ? 'Payment Received & Order Confirmed' : method === 'COD' ? 'COD Order Placed' : 'Order Reference Created'}
      </h1>
      <p style={{ fontWeight: 700, color: 'var(--brand-gold-dark)', marginBottom: 12, fontSize: '1.05rem' }}>
        Order ID: {params.get('ref')}
      </p>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.93rem', marginBottom: 24, lineHeight: 1.6 }}>
        {paid
          ? 'Thank you! Your online payment has been verified and your order is confirmed. You can track live dispatch and NimbusPost courier updates anytime using your Order ID.'
          : method === 'COD'
            ? 'Your Cash on Delivery order is placed! Our team will verify your delivery address shortly and update your NimbusPost tracking ID on the Track Order page.'
            : 'Complete sending your prefilled message in WhatsApp. Please note that sending the WhatsApp message initiates order review with the NuVaya team and does not by itself constitute payment confirmation or a confirmed order.'}
      </p>
      <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
        <Link to={`/track-order?ref=${encodeURIComponent(params.get("ref") || "")}`} className="btn-primary">Track Order Status</Link>
        <Link to="/shop" className="btn-outline">Continue Shopping</Link>
      </div>
    </div>
  );
}

function ScrollToTop() {
  const { pathname, search } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname, search]);
  return null;
}

function PageViewTracker() {
  const location = useLocation();
  useEffect(() => {
    const fullPath = `${location.pathname}${location.search}`;
    if (location.pathname.startsWith("/admin")) return;
    trackMetaPageView();
    let vid = localStorage.getItem("nuvaya_vid");
    if (!vid) {
      vid = `v_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
      localStorage.setItem("nuvaya_vid", vid);
    }
    axiosClient.post("/store/track", {
      path: fullPath,
      visitorId: vid,
      referrer: document.referrer || ""
    }).catch(() => {});
  }, [location.pathname, location.search]);
  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <GlobalLoadingOverlay />
      <PageViewTracker />
      <WishlistProvider>
      <CartProvider>
        <Navbar />
        <CartDrawer />
        <main style={{ minHeight: '75vh' }}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/shop" element={<ShopPage />} />
            <Route path="/wishlist" element={<WishlistPage />} />
            <Route path="/product/:id" element={<ProductDetailPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/order-submitted" element={<OrderSubmittedPage />} />
            <Route path="/track-order" element={<TrackOrderPage />} />
            <Route path="/admin/login" element={<AdminLoginPage />} />
            <Route path="/admin" element={<AdminDashboardPage />} />
          </Routes>
        </main>
        <Footer />
        <NuvayaHelperChat />
      </CartProvider>
    </WishlistProvider>
    </BrowserRouter>
  );
}
