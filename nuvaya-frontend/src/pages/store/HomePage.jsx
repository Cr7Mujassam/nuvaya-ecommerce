import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ShieldCheck, MessageCircle, ArrowRight } from 'lucide-react';
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

  const heroProductImg =
    featured.find((p) => p.images?.length > 0)?.images?.[0]?.imageUrl || FALLBACK_IMAGE;

  return (
    <div>
      {/* Editorial Hero Banner */}
      <section style={{
        background: 'radial-gradient(circle at 85% 20%, rgba(198,161,99,0.18) 0%, transparent 45%), linear-gradient(135deg, #FAF5EC 0%, #EFE4D2 100%)',
        padding: '72px 20px 80px',
        borderBottom: '1px solid var(--border-sand)'
      }}>
        <div style={{ maxWidth: 1240, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))', gap: 52, alignItems: 'center' }}>
          <div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 14px',
              borderRadius: 999,
              background: 'rgba(255,255,255,0.75)',
              border: '1px solid rgba(198,161,99,0.55)',
              fontSize: '0.7rem',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: 'var(--brand-gold-dark)',
              fontWeight: 700
            }}>
              <Sparkles size={13} /> Hyderabad Atelier • Signature Collection
            </div>

            <h1 style={{ fontSize: 'clamp(2.8rem, 5.4vw, 4.5rem)', lineHeight: 1.05, margin: '20px 0 22px', color: 'var(--brand-plum)', fontWeight: 600 }}>
              Effortless Drape.{' '}
              <span style={{ fontStyle: 'italic', fontWeight: 500, color: 'var(--brand-gold-dark)' }}>
                Modern Modesty.
              </span>
            </h1>

            <p style={{ color: 'var(--text-muted)', fontSize: '1.04rem', lineHeight: 1.75, maxWidth: 510, marginBottom: 32 }}>
              Thoughtfully tailored breathable modal jersey hijabs, featherlight matte chiffons, Korean Nidha abayas, and curated Pack of 3 &amp; 5 bundles crafted for everyday grace.
            </p>

            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 38 }}>
              <Link to="/shop" className="btn-primary">
                Shop Collection <ArrowRight size={15} />
              </Link>
              <Link to="/shop?category=best-sellers" className="btn-outline">
                Explore Value Packs
              </Link>
            </div>

            <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap', paddingTop: 22, borderTop: '1px solid rgba(198,161,99,0.35)' }}>
              {[
                { label: 'Breathable Weaves', sub: 'Modal, Chiffon & Nidha' },
                { label: 'Curated Bundles', sub: 'Save on Pack of 3 & 5' },
                { label: 'Pan-India Express', sub: 'Dispatched from Hyderabad' },
              ].map((stat) => (
                <div key={stat.label}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--brand-plum)', letterSpacing: '0.03em' }}>{stat.label}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{stat.sub}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ position: 'relative' }}>
            <div style={{
              borderRadius: '180px 180px 24px 24px',
              overflow: 'hidden',
              border: '1.5px solid var(--brand-gold)',
              padding: 10,
              background: 'rgba(255,255,255,0.55)',
              boxShadow: '0 28px 60px -15px rgba(39,16,27,0.22)'
            }}>
              <div style={{ borderRadius: '170px 170px 16px 16px', overflow: 'hidden', background: 'var(--bg-cream)' }}>
                <img
                  src={resolveAssetUrl(heroProductImg)}
                  onError={(e) => { e.currentTarget.src = FALLBACK_IMAGE; }}
                  alt="NUVAYA Luxury Modest Collection"
                  style={{ width: '100%', height: 500, objectFit: 'cover', display: 'block' }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Curated Category Strip */}
      <section style={{ maxWidth: 1240, margin: '64px auto 48px', padding: '0 20px' }}>
        <div style={{ textAlign: 'center', marginBottom: 26 }}>
          <div style={{ fontSize: '0.7rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--brand-gold-dark)', fontWeight: 700 }}>
            CURATED SILHOUETTES
          </div>
          <h2 style={{ fontSize: '2.35rem', color: 'var(--brand-plum)', marginTop: 4 }}>Shop by Category</h2>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
          <Link to="/shop" className="nv-cat-pill">All Pieces</Link>
          {categories.map((cat) => (
            <Link key={cat.id} to={`/shop?category=${cat.slug}`} className="nv-cat-pill">
              {cat.name}
            </Link>
          ))}
        </div>
      </section>

      {/* Featured & New Arrivals */}
      <section style={{ maxWidth: 1240, margin: '56px auto 76px', padding: '0 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 30, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontSize: '0.7rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--brand-gold-dark)', fontWeight: 700 }}>
              SEASONAL EDIT
            </div>
            <h2 style={{ fontSize: '2.45rem', color: 'var(--brand-plum)', lineHeight: 1.1 }}>Featured &amp; New Arrivals</h2>
          </div>
          <Link to="/shop" style={{ color: 'var(--brand-plum)', fontWeight: 700, fontSize: '0.8rem', letterSpacing: '0.14em', textTransform: 'uppercase', borderBottom: '1.5px solid var(--brand-gold)', paddingBottom: 3 }}>
            View Entire Catalog →
          </Link>
        </div>
        <div className="product-grid">
          {featured.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>

      {/* Editorial Atelier Banner */}
      <section style={{
        background: 'linear-gradient(135deg, #27101B 0%, #3A1728 50%, #1E0B14 100%)',
        color: '#FBF8F3',
        padding: '72px 20px',
        borderTop: '1.5px solid var(--brand-gold)',
        borderBottom: '1.5px solid var(--brand-gold)'
      }}>
        <div style={{ maxWidth: 920, margin: '0 auto', textAlign: 'center' }}>
          <div className="crest-font" style={{ fontSize: '0.75rem', letterSpacing: '0.28em', color: 'var(--brand-gold)', marginBottom: 14 }}>
            THE NUVAYA PROMISE
          </div>
          <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3.1rem)', fontWeight: 500, lineHeight: 1.2, marginBottom: 18 }}>
            “Designed for women who seek{' '}
            <span style={{ fontStyle: 'italic', color: 'var(--brand-gold)' }}>timeless poise</span>{' '}
            without compromising everyday comfort.”
          </h2>
          <p style={{ color: '#D7C9B8', maxWidth: 640, margin: '0 auto 30px', fontSize: '0.98rem' }}>
            Every shade in our palette is curated to complement South Asian skin tones—from warm sand and espresso to deep plum and midnight jet.
          </p>
          <Link to="/shop" style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '13px 30px',
            borderRadius: 999,
            border: '1px solid var(--brand-gold)',
            color: '#FBF8F3',
            fontSize: '0.78rem',
            fontWeight: 600,
            letterSpacing: '0.16em',
            textTransform: 'uppercase'
          }}>
            Discover the Atelier Edit <ArrowRight size={15} />
          </Link>
        </div>
      </section>

      {/* Best Sellers */}
      {bestsellers.length > 0 && (
        <section style={{ background: 'var(--bg-cream)', padding: '76px 20px', borderBottom: '1px solid var(--border-sand)' }}>
          <div style={{ maxWidth: 1240, margin: '0 auto' }}>
            <div style={{ marginBottom: 30 }}>
              <div style={{ fontSize: '0.7rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--brand-gold-dark)', fontWeight: 700 }}>
                MOST LOVED
              </div>
              <h2 style={{ fontSize: '2.45rem', color: 'var(--brand-plum)', lineHeight: 1.1 }}>Signature Best Sellers</h2>
            </div>
            <div className="product-grid">
              {bestsellers.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        </section>
      )}

      {/* Three Pillars of Luxury */}
      <section style={{ maxWidth: 1240, margin: '72px auto 12px', padding: '0 20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 26 }}>
        {[
          { icon: Sparkles, title: 'Breathable Luxury Weaves', desc: 'Featherlight matte chiffon, soft modal-cotton jersey, and fluid Korean Nidha tailored for Indian weather.' },
          { icon: ShieldCheck, title: 'Mix & Match Value Packs', desc: 'Curate your custom Pack of 3 and Pack of 5 hijab bundles in your favorite everyday shades.' },
          { icon: MessageCircle, title: 'Direct WhatsApp Concierge', desc: 'Instant order verification, fabric draping guidance, and personal support directly on WhatsApp.' },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.title} style={{
              background: 'var(--surface-white)',
              padding: '32px 28px',
              borderRadius: 18,
              border: '1px solid rgba(198,161,99,0.4)',
              boxShadow: '0 10px 28px -10px rgba(39,16,27,0.06)'
            }}>
              <div style={{
                width: 42,
                height: 42,
                borderRadius: '50%',
                background: 'var(--bg-cream)',
                border: '1px solid var(--brand-gold)',
                display: 'grid',
                placeItems: 'center',
                color: 'var(--brand-plum)',
                marginBottom: 16
              }}>
                <Icon size={18} />
              </div>
              <h3 style={{ fontSize: '1.55rem', marginBottom: 8, color: 'var(--brand-plum)' }}>{item.title}</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', lineHeight: 1.7 }}>{item.desc}</p>
            </div>
          );
        })}
      </section>
    </div>
  );
}
