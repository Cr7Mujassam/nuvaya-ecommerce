import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ShieldCheck, MessageCircle, ArrowRight, ChevronLeft, ChevronRight, Star, BadgeCheck, Quote } from 'lucide-react';
import axiosClient, { FALLBACK_IMAGE, resolveAssetUrl } from '../../api/axiosClient';
import ProductCard from '../../components/common/ProductCard';
import { useCart } from '../../context/CartContext';

export default function HomePage() {
  const { storeSettings } = useCart();
  const [saleSlideIdx, setSaleSlideIdx] = useState(0);
  const [salePaused, setSalePaused] = useState(false);

  const saleSlides = React.useMemo(() => {
    const raw = (storeSettings?.saleBannerImageUrl || '')
      .split(/[,\n]+/)
      .map((u) => u.trim())
      .filter(Boolean);
    return raw;
  }, [storeSettings?.saleBannerImageUrl]);

  useEffect(() => {
    setSaleSlideIdx(0);
  }, [saleSlides.length]);

  useEffect(() => {
    if (!storeSettings?.saleActive || saleSlides.length <= 1 || salePaused) return;
    const timer = setInterval(() => {
      setSaleSlideIdx((prev) => (prev + 1) % saleSlides.length);
    }, 3800);
    return () => clearInterval(timer);
  }, [storeSettings?.saleActive, saleSlides.length, salePaused]);
  const [featured, setFeatured] = useState([]);
  const [bestsellers, setBestsellers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [approvedReviews, setApprovedReviews] = useState([]);
  const [reviewSlideIdx, setReviewSlideIdx] = useState(0);
  const [reviewPaused, setReviewPaused] = useState(false);

  useEffect(() => {
    Promise.all([
      axiosClient.get('/products?sortBy=newest&size=12').catch(() => ({ data: { content: [] } })),
      axiosClient.get('/products/featured').catch(() => ({ data: [] })),
    ]).then(([newestRes, featRes]) => {
      const newest = newestRes.data?.content || [];
      const feat = featRes.data || [];
      const seen = new Set();
      const merged = [];
      for (const item of [...newest, ...feat]) {
        if (!seen.has(item.id)) {
          seen.add(item.id);
          merged.push(item);
        }
      }
      setFeatured(merged.slice(0, 12));
    });
    axiosClient.get('/products/bestsellers').then((r) => setBestsellers(r.data)).catch(() => {});
    axiosClient.get('/categories').then((r) => setCategories(r.data)).catch(() => {});
    axiosClient.get('/reviews/featured?limit=10').then((r) => setApprovedReviews(Array.isArray(r.data) ? r.data : [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (approvedReviews.length <= 1 || reviewPaused) return;
    const timer = setInterval(() => {
      setReviewSlideIdx((prev) => (prev + 1) % approvedReviews.length);
    }, 4200);
    return () => clearInterval(timer);
  }, [approvedReviews.length, reviewPaused]);

  const heroProductImg =
    featured.find((p) => p.images?.length > 0)?.images?.[0]?.imageUrl || FALLBACK_IMAGE;

  return (
    <div>
      {/* Top Priority Live Sale & Sliding Showcase Banner */}
      {storeSettings?.saleActive && (
        <section
          onMouseEnter={() => setSalePaused(true)}
          onMouseLeave={() => setSalePaused(false)}
          style={{
            background: 'linear-gradient(135deg, #1E0B14 0%, #381526 52%, #231019 100%)',
            borderBottom: '1.5px solid var(--brand-gold)',
            padding: '28px 20px 32px'
          }}
        >
          <div style={{
            maxWidth: 1240,
            margin: '0 auto',
            borderRadius: 22,
            overflow: 'hidden',
            background: 'rgba(255,255,255,0.03)',
            border: '1.5px solid rgba(198,161,99,0.75)',
            boxShadow: '0 26px 56px -14px rgba(0,0,0,0.45)',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))',
            alignItems: 'stretch'
          }}>
            <div style={{ padding: '36px 34px', display: 'flex', flexDirection: 'column', justifyContent: 'center', color: '#FBF8F3' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 7,
                  padding: '5px 13px',
                  borderRadius: 999,
                  background: 'rgba(198,161,99,0.22)',
                  border: '1px solid var(--brand-gold)',
                  color: 'var(--brand-gold)',
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase'
                }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#4ADE80', boxShadow: '0 0 8px #4ADE80' }} />
                  {storeSettings.saleType || 'SALE IS LIVE'}
                </span>

                {storeSettings.saleBadgeText && (
                  <span style={{
                    padding: '5px 12px',
                    borderRadius: 999,
                    background: 'var(--brand-gold)',
                    color: '#231019',
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase'
                  }}>
                    {storeSettings.saleBadgeText}
                  </span>
                )}
              </div>

              <h2 style={{ fontSize: 'clamp(1.9rem, 3.3vw, 2.85rem)', lineHeight: 1.1, fontWeight: 600, marginBottom: 12, color: '#FAF6EE' }}>
                {storeSettings.saleTitle || 'Exclusive Modest Fashion Offer — Live Now'}
              </h2>

              {storeSettings.saleSubtitle && (
                <p style={{ color: '#DFD1BE', fontSize: '0.96rem', lineHeight: 1.65, maxWidth: 510, marginBottom: 24 }}>
                  {storeSettings.saleSubtitle}
                </p>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                <Link
                  to={storeSettings.saleCtaLink || '/shop'}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '13px 28px',
                    borderRadius: 999,
                    background: 'var(--brand-gold)',
                    color: '#231019',
                    fontWeight: 800,
                    fontSize: '0.8rem',
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase'
                  }}
                >
                  {storeSettings.saleCtaText || 'Shop Offer Now'} <ArrowRight size={15} />
                </Link>
              </div>
            </div>

            {saleSlides.length > 0 && (
              <div style={{ position: 'relative', minHeight: 300, maxHeight: 410, overflow: 'hidden', background: '#16070E' }}>
                <div
                  style={{
                    display: 'flex',
                    height: '100%',
                    width: `${saleSlides.length * 100}%`,
                    transform: `translateX(-${(saleSlideIdx * 100) / saleSlides.length}%)`,
                    transition: 'transform 0.65s cubic-bezier(0.22, 1, 0.36, 1)'
                  }}
                >
                  {saleSlides.map((slideUrl, i) => (
                    <div key={i} style={{ width: `${100 / saleSlides.length}%`, height: '100%', flexShrink: 0 }}>
                      <img
                        src={resolveAssetUrl(slideUrl)}
                        onError={(e) => { e.currentTarget.src = FALLBACK_IMAGE; }}
                        alt={`${storeSettings.saleTitle || 'NuVaya Sale'} Slide ${i + 1}`}
                        style={{ width: '100%', height: '100%', maxHeight: 410, objectFit: 'cover', display: 'block' }}
                      />
                    </div>
                  ))}
                </div>

                {saleSlides.length > 1 && (
                  <>
                    <button
                      type="button"
                      aria-label="Previous Sale Slide"
                      onClick={() => setSaleSlideIdx((prev) => (prev - 1 + saleSlides.length) % saleSlides.length)}
                      style={{
                        position: 'absolute',
                        left: 12,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: 34,
                        height: 34,
                        borderRadius: '50%',
                        background: 'rgba(30,11,20,0.72)',
                        border: '1px solid var(--brand-gold)',
                        color: '#FAF6EE',
                        display: 'grid',
                        placeItems: 'center',
                        cursor: 'pointer'
                      }}
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <button
                      type="button"
                      aria-label="Next Sale Slide"
                      onClick={() => setSaleSlideIdx((prev) => (prev + 1) % saleSlides.length)}
                      style={{
                        position: 'absolute',
                        right: 12,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: 34,
                        height: 34,
                        borderRadius: '50%',
                        background: 'rgba(30,11,20,0.72)',
                        border: '1px solid var(--brand-gold)',
                        color: '#FAF6EE',
                        display: 'grid',
                        placeItems: 'center',
                        cursor: 'pointer'
                      }}
                    >
                      <ChevronRight size={18} />
                    </button>

                    <div style={{
                      position: 'absolute',
                      bottom: 12,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      display: 'flex',
                      gap: 7,
                      padding: '5px 10px',
                      borderRadius: 999,
                      background: 'rgba(30,11,20,0.68)'
                    }}>
                      {saleSlides.map((_, idx) => (
                        <button
                          key={idx}
                          type="button"
                          aria-label={`Go to slide ${idx + 1}`}
                          onClick={() => setSaleSlideIdx(idx)}
                          style={{
                            width: idx === saleSlideIdx ? 20 : 8,
                            height: 8,
                            borderRadius: 999,
                            border: 'none',
                            background: idx === saleSlideIdx ? 'var(--brand-gold)' : 'rgba(255,255,255,0.45)',
                            transition: 'all 0.3s ease',
                            cursor: 'pointer'
                          }}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </section>
      )}

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
              <Sparkles size={13} /> Starts at ₹169 • Free Pan-India Delivery Above ₹499
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
              <a href="#featured-catalog" className="btn-primary">
                Shop Collection From ₹169 <ArrowRight size={15} />
              </a>
              <Link to="/shop?bestSeller=true" className="btn-outline">
                Shop Best Sellers &amp; Packs
              </Link>
            </div>

            <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap', paddingTop: 22, borderTop: '1px solid rgba(198,161,99,0.35)' }}>
              {[
                { label: 'UPI, Cards & COD', sub: 'COD under ₹300 • Instant Razorpay' },
                { label: 'Bundle Savings', sub: 'Extra savings on Pack of 3 & 5' },
                { label: 'Fast Hyderabad Dispatch', sub: 'Live courier tracking included' },
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

      {/* Heartfelt Founder Trust Message & First-Order Pledge */}
      <section style={{ maxWidth: 1240, margin: '28px auto 12px', padding: '0 20px' }}>
        <div style={{
          background: 'linear-gradient(135deg, #FFFDF9 0%, #F7EFE2 100%)',
          border: '1.5px solid var(--brand-gold)',
          borderRadius: 20,
          padding: '28px 30px',
          boxShadow: '0 14px 34px -14px rgba(39,16,27,0.12)',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 24,
          alignItems: 'center'
        }}>
          <div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 12px',
              borderRadius: 999,
              background: 'rgba(39,16,27,0.06)',
              color: 'var(--brand-gold-dark)',
              fontSize: '0.68rem',
              fontWeight: 800,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              marginBottom: 10
            }}>
              <ShieldCheck size={14} /> A Personal Promise From Our Founders
            </div>
            <h2 style={{ fontSize: 'clamp(1.45rem, 2.6vw, 2rem)', color: 'var(--brand-plum)', lineHeight: 1.2, marginBottom: 10 }}>
              We’ve Just Begun — Give Us Just One Chance to Serve You
            </h2>
            <p style={{ color: 'var(--text-charcoal)', fontSize: '0.95rem', lineHeight: 1.7, margin: 0 }}>
              We know trusting a new online store takes a leap of faith. NuVaya was started in Hyderabad with a simple promise: honest, breathable fabrics, neat stitching, and genuine care in every single parcel. Because we are building our name one customer at a time, we personally inspect every piece before dispatch — and if anything ever feels less than promised, message us directly on WhatsApp and we will make it right.
            </p>
            <div style={{ marginTop: 12, fontSize: '0.82rem', fontWeight: 700, color: 'var(--brand-plum)' }}>
              — With gratitude, Team NuVaya (Hyderabad)
            </div>
          </div>

          <div style={{ display: 'grid', gap: 10 }}>
            {[
              { title: 'Hand-Checked Before Dispatch', desc: 'Every hijab & abaya is inspected for fabric softness, stitching, and shade accuracy before packing.' },
              { title: 'Real People, Direct WhatsApp Help', desc: 'Ask for live fabric videos or order updates anytime — no bots, just our Hyderabad team.' },
              { title: 'Tracked Delivery & Safe Checkout', desc: 'COD on orders under ₹300, instant Razorpay UPI/Cards, and live courier tracking link.' },
            ].map((pill) => (
              <div key={pill.title} style={{
                background: '#FFFFFF',
                padding: '12px 15px',
                borderRadius: 12,
                border: '1px solid rgba(198,161,99,0.45)'
              }}>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--brand-plum)' }}>✓ {pill.title}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2, lineHeight: 1.45 }}>{pill.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* High-Converting Bundle & Offer Strip */}
      <section style={{ maxWidth: 1240, margin: '20px auto 44px', padding: '0 20px' }}>
        <div style={{
          background: 'linear-gradient(135deg, #27101B 0%, #3E192B 100%)',
          border: '1.5px solid var(--brand-gold)',
          borderRadius: 18,
          padding: '22px 26px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
          color: '#FAF6EE'
        }}>
          <div>
            <div style={{ fontSize: '0.7rem', letterSpacing: '0.18em', color: 'var(--brand-gold)', fontWeight: 800, textTransform: 'uppercase' }}>
              MOST POPULAR WITH REPEAT BUYERS
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, marginTop: 3 }}>
              Unlock Free Pan-India Delivery on Orders ₹499+ &amp; Save More on Pack of 3 / Pack of 5 Combos
            </div>
          </div>
          <Link
            to="/shop"
            style={{
              padding: '11px 22px',
              borderRadius: 999,
              background: 'var(--brand-gold)',
              color: '#231019',
              fontWeight: 800,
              fontSize: '0.76rem',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              whiteSpace: 'nowrap'
            }}
          >
            Build Your Combo →
          </Link>
        </div>
      </section>

      {/* Featured & New Arrivals */}
      <section id="featured-catalog" style={{ maxWidth: 1240, margin: '36px auto 76px', padding: '0 20px' }}>
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

      {/* Rotating Customer Impressions Banner */}
      {approvedReviews.length > 0 && (() => {
        const activeRev = approvedReviews[reviewSlideIdx % approvedReviews.length];
        const stars = Math.max(1, Math.min(5, Number(activeRev.rating || 5)));
        return (
          <section
            onMouseEnter={() => setReviewPaused(true)}
            onMouseLeave={() => setReviewPaused(false)}
            style={{ maxWidth: 1240, margin: '0 auto 64px', padding: '0 20px' }}
          >
            <div style={{
              background: 'linear-gradient(135deg, #27101B 0%, #3B1829 55%, #231019 100%)',
              border: '1.5px solid var(--brand-gold)',
              borderRadius: 22,
              padding: '32px 30px',
              color: '#FAF6EE',
              boxShadow: '0 20px 44px -16px rgba(39,16,27,0.35)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 18 }}>
                <div>
                  <div style={{ fontSize: '0.68rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--brand-gold)', fontWeight: 800 }}>
                    VERIFIED CLIENT IMPRESSIONS
                  </div>
                  <h2 style={{ fontSize: 'clamp(1.5rem, 2.8vw, 2.1rem)', margin: '4px 0 0', color: '#FAF6EE' }}>
                    Loved by Women Across India
                  </h2>
                </div>

                {approvedReviews.length > 1 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button
                      type="button"
                      aria-label="Previous Review"
                      onClick={() => setReviewSlideIdx((prev) => (prev - 1 + approvedReviews.length) % approvedReviews.length)}
                      style={{ width: 34, height: 34, borderRadius: '50%', border: '1px solid var(--brand-gold)', background: 'rgba(255,255,255,0.08)', color: '#FAF6EE', display: 'grid', placeItems: 'center', cursor: 'pointer' }}
                    >
                      <ChevronLeft size={17} />
                    </button>
                    <button
                      type="button"
                      aria-label="Next Review"
                      onClick={() => setReviewSlideIdx((prev) => (prev + 1) % approvedReviews.length)}
                      style={{ width: 34, height: 34, borderRadius: '50%', border: '1px solid var(--brand-gold)', background: 'rgba(255,255,255,0.08)', color: '#FAF6EE', display: 'grid', placeItems: 'center', cursor: 'pointer' }}
                    >
                      <ChevronRight size={17} />
                    </button>
                  </div>
                )}
              </div>

              <div style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(198,161,99,0.4)',
                borderRadius: 16,
                padding: '24px 26px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 20,
                transition: 'all 0.35s ease'
              }}>
                <div style={{ flex: '1 1 320px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
                    <div style={{ display: 'inline-flex', gap: 3 }}>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Star key={n} size={16} fill={n <= stars ? '#C6A163' : 'transparent'} color="#C6A163" />
                      ))}
                    </div>
                    {activeRev.verifiedPurchase && (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        background: 'rgba(74, 222, 128, 0.16)',
                        border: '1px solid rgba(74, 222, 128, 0.45)',
                        color: '#86EFAC',
                        padding: '2px 10px',
                        borderRadius: 999,
                        fontSize: '0.7rem',
                        fontWeight: 700
                      }}>
                        <BadgeCheck size={13} /> Verified Buyer
                      </span>
                    )}
                  </div>

                  <p style={{ fontSize: 'clamp(1rem, 1.8vw, 1.2rem)', lineHeight: 1.65, color: '#FAF6EE', fontStyle: 'italic', margin: '0 0 14px' }}>
                    <Quote size={16} style={{ color: 'var(--brand-gold)', marginRight: 6, verticalAlign: 'text-top' }} />
                    {activeRev.comment}
                  </p>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                    <div>
                      <strong style={{ color: 'var(--brand-gold)', fontSize: '0.95rem' }}>{activeRev.customerName}</strong>
                      {activeRev.productName && (
                        <span style={{ color: '#DFD1BE', fontSize: '0.82rem', marginLeft: 8 }}>
                          • Purchased {activeRev.productName}
                        </span>
                      )}
                    </div>

                    {activeRev.productId && (
                      <Link
                        to={`/product/${activeRev.productId}`}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '7px 14px',
                          borderRadius: 999,
                          background: 'var(--brand-gold)',
                          color: '#231019',
                          fontSize: '0.74rem',
                          fontWeight: 800,
                          letterSpacing: '0.08em',
                          textTransform: 'uppercase'
                        }}
                      >
                        Shop This Piece <ArrowRight size={13} />
                      </Link>
                    )}
                  </div>
                </div>

                {activeRev.imageUrl && (
                  <img
                    src={resolveAssetUrl(activeRev.imageUrl)}
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    alt={activeRev.customerName}
                    style={{ width: 96, height: 118, objectFit: 'cover', borderRadius: 12, border: '1.5px solid var(--brand-gold)', flexShrink: 0 }}
                  />
                )}
              </div>

              {approvedReviews.length > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: 7, marginTop: 16 }}>
                  {approvedReviews.map((rv, idx) => {
                    const active = idx === (reviewSlideIdx % approvedReviews.length);
                    return (
                      <button
                        key={rv.id || idx}
                        type="button"
                        aria-label={`Review ${idx + 1}`}
                        onClick={() => setReviewSlideIdx(idx)}
                        style={{
                          width: active ? 22 : 8,
                          height: 8,
                          borderRadius: 999,
                          border: 'none',
                          background: active ? 'var(--brand-gold)' : 'rgba(255,255,255,0.35)',
                          cursor: 'pointer',
                          transition: 'all 0.25s ease'
                        }}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        );
      })()}

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
