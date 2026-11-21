import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Sparkles, Trash2 } from 'lucide-react';
import axiosClient from '../../api/axiosClient';
import { useWishlist } from '../../context/WishlistContext';
import ProductCard from '../../components/common/ProductCard';

export default function WishlistPage() {
  const { wishlistIds, clearWishlist } = useWishlist();
  const [savedProducts, setSavedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!wishlistIds.length) {
      setSavedProducts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    axiosClient
      .get('/products', { params: { size: 100 } })
      .then((res) => {
        const all = res.data?.content || [];
        const byId = new Map(all.map((p) => [Number(p.id), p]));
        const ordered = wishlistIds
          .map((id) => byId.get(Number(id)))
          .filter(Boolean);
        setSavedProducts(ordered);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [wishlistIds]);

  return (
    <div style={{ maxWidth: 1240, margin: '44px auto 72px', padding: '0 20px', minHeight: '60vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16, marginBottom: 32 }}>
        <div>
          <div style={{ fontSize: '0.7rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--brand-gold-dark)', fontWeight: 700 }}>
            YOUR CURATED FAVORITES
          </div>
          <h1 style={{ fontSize: '2.5rem', color: 'var(--brand-plum)', lineHeight: 1.1 }}>
            My Wishlist
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: 4 }}>
            {savedProducts.length} {savedProducts.length === 1 ? 'piece' : 'pieces'} saved for later
          </p>
        </div>

        {savedProducts.length > 0 && (
          <button
            type="button"
            onClick={clearWishlist}
            className="btn-outline"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.78rem' }}
          >
            <Trash2 size={14} /> Clear Wishlist
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ padding: 50, textAlign: 'center', color: 'var(--text-muted)' }}>
          Loading your saved favorites...
        </div>
      ) : savedProducts.length === 0 ? (
        <div style={{
          background: '#FFFFFF',
          borderRadius: 18,
          border: '1px solid rgba(198,161,99,0.4)',
          padding: '54px 24px',
          textAlign: 'center',
          maxWidth: 540,
          margin: '20px auto',
          boxShadow: '0 10px 28px -12px rgba(39,16,27,0.08)'
        }}>
          <div style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: 'var(--bg-cream)',
            border: '1px solid var(--brand-gold)',
            display: 'grid',
            placeItems: 'center',
            margin: '0 auto 16px',
            color: 'var(--brand-plum)'
          }}>
            <Heart size={24} />
          </div>
          <h2 style={{ fontSize: '1.75rem', color: 'var(--brand-plum)', marginBottom: 8 }}>
            Your Wishlist is Empty
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', lineHeight: 1.6, marginBottom: 24 }}>
            Tap the heart icon on any hijab, abaya, or bundle to save your favorite shades and styles right here.
          </p>
          <Link to="/shop" className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <Sparkles size={15} /> Explore NuVaya Collection
          </Link>
        </div>
      ) : (
        <div className="product-grid">
          {savedProducts.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
