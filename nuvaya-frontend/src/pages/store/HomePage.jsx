import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axiosClient, { FALLBACK_IMAGE, resolveAssetUrl } from '../../api/axiosClient';
import ProductCard from '../../components/common/ProductCard';

export default function HomePage() {
  const [featured, setFeatured] = useState([]);
  const [bestsellers, setBestsellers] = useState([]);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    axiosClient.get('/products/featured').then((r) => setFeatured(r.data)).catch(() => {});
    axiosClient.get('/products/bestsellers').then((r) => setBestsellers(r.data)).catch(() => {});
    axiosClient.get('/categories').then((r) => setCategories(r.data)).catch(() => {});
  }, []);

  // Use the first featured product's uploaded image as the hero showcase, with clean fallback
  const heroProductImg =
    featured.find((p) => p.images?.length > 0)?.images?.[0]?.imageUrl || FALLBACK_IMAGE;

  return (
    <div>
      <section style={{ background: 'linear-gradient(135deg, #F3EAD9 0%, #E6D8C0 100%)', padding: '64px 20px', borderBottom: '1px solid var(--border-sand)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 40, alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: '0.8rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--brand-gold-dark)', fontWeight: 700 }}>
              NUVAYA MODEST LUXURY • HYDERABAD
            </span>
            <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', lineHeight: 1.1, margin: '14px 0 18px', color: 'var(--brand-plum)' }}>
              Effortless Drape. Modern Modesty.
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', maxWidth: 500, marginBottom: 28 }}>
              Discover breathable modal-cotton jersey hijabs, featherlight matte chiffons, Korean Nidha abayas, and curated Pack of 3 & 5 bundles crafted for everyday grace.
            </p>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              <Link to="/shop" className="btn-primary">Shop Now</Link>
              <Link to="/shop?category=premium-abayas" className="btn-outline">Explore Collections</Link>
            </div>
          </div>
          <div style={{ borderRadius: 20, overflow: 'hidden', border: '2px solid var(--brand-gold)', boxShadow: '0 20px 45px rgba(44,20,31,0.16)', background: 'var(--bg-cream)' }}>
            <img
              src={resolveAssetUrl(heroProductImg)}
              onError={(e) => { e.currentTarget.src = FALLBACK_IMAGE; }}
              alt="NUVAYA Luxury Modest Collection"
              style={{ width: '100%', height: 460, objectFit: 'cover', display: 'block' }}
            />
          </div>
        </div>
      </section>

      <section style={{ maxWidth: 1200, margin: '56px auto', padding: '0 20px' }}>
        <h2 style={{ fontSize: '2rem', marginBottom: 18, color: 'var(--brand-plum)' }}>Shop by Category</h2>
        <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 10 }}>
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={`/shop?category=${cat.slug}`}
              style={{
                padding: '10px 20px', borderRadius: 30, background: 'var(--bg-cream)',
                border: '1px solid var(--brand-gold)', whiteSpace: 'nowrap', fontWeight: 600, fontSize: '0.9rem', color: 'var(--brand-plum)'
              }}
            >
              {cat.name}
            </Link>
          ))}
        </div>
      </section>

      <section style={{ maxWidth: 1200, margin: '56px auto', padding: '0 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 24 }}>
          <h2 style={{ fontSize: '2.1rem', color: 'var(--brand-plum)' }}>Featured & New Arrivals</h2>
          <Link to="/shop" style={{ color: 'var(--brand-gold-dark)', fontWeight: 700 }}>View All →</Link>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(255px, 1fr))', gap: 24 }}>
          {featured.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>

      <section style={{ background: 'var(--bg-cream)', padding: '64px 20px', borderTop: '1px solid var(--border-sand)', borderBottom: '1px solid var(--border-sand)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <h2 style={{ fontSize: '2.1rem', marginBottom: 24, color: 'var(--brand-plum)' }}>Best Sellers</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(255px, 1fr))', gap: 24 }}>
            {bestsellers.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </div>
      </section>

      <section style={{ maxWidth: 1200, margin: '64px auto', padding: '0 20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24 }}>
        {[
          { title: 'Breathable Luxury Fabrics', desc: 'Modal jersey, matte georgette chiffon, and Korean Nidha tailored for Indian weather.' },
          { title: 'Mix & Match Value Packs', desc: 'Build custom Pack of 3 and Pack of 5 hijab bundles in your favorite shades.' },
          { title: 'Direct WhatsApp Concierge', desc: 'Instant order verification and personalized styling assistance on WhatsApp.' },
        ].map((item) => (
          <div key={item.title} style={{ background: 'var(--surface-white)', padding: 26, borderRadius: 14, border: '1px solid var(--brand-gold)' }}>
            <h3 style={{ fontSize: '1.45rem', marginBottom: 8, color: 'var(--brand-plum)' }}>{item.title}</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>{item.desc}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
