import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import ProductCard from '../../components/common/ProductCard';
import axiosClient, { resolveAssetUrl } from '../../api/axiosClient';
import { Heart } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import ProductReviewsSection from '../../components/product/ProductReviewsSection';

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [selectedColor, setSelectedColor] = useState('');
  const [activeImageUrl, setActiveImageUrl] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedPack, setSelectedPack] = useState(null);
  const [mixedColors, setMixedColors] = useState([]);
  const [qty, setQty] = useState(1);
  const [buyingNow, setBuyingNow] = useState(false);
  const galleryRef = useRef(null);
  const inlineCtaRef = useRef(null);
  const relatedRef = useRef(null);
  const [pastInlineCta, setPastInlineCta] = useState(false);
  const [atRelatedSection, setAtRelatedSection] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    axiosClient.get(`/products/${id}`).then((r) => {
      const p = r.data;
      setProduct(p);
      const initColor = p.colors?.[0]?.name || '';
      setSelectedColor(initColor);
      const firstImg =
        p.images?.find((im) => im.colorName?.toLowerCase() === initColor.toLowerCase()) ||
        p.images?.find((im) => im.primaryImage) ||
        p.images?.[0];
      setActiveImageUrl(firstImg?.imageUrl || '');
      setSelectedSize(p.availableSizes?.[0] || '');
      const defaultPack = p.packs?.[0] || null;
      setSelectedPack(defaultPack);
      if (defaultPack?.allowMixedColors) {
        setMixedColors(Array(defaultPack.pieceCount).fill(initColor || 'Black'));
      }
      axiosClient.get("/products", { params: { size: 12, sortBy: "newest" } }).then((res) => {
        const all = (res.data?.content || []).filter((item) => String(item.id) !== String(p.id));
        const sameCat = all.filter((item) => item.categoryName && item.categoryName === p.categoryName);
        const others = all.filter((item) => item.categoryName !== p.categoryName);
        setRelatedProducts([...sameCat, ...others].slice(0, 8));
      }).catch(() => {});
    });
  }, [id]);

  useEffect(() => {
    const ctaEl = inlineCtaRef.current;
    const relEl = relatedRef.current;

    const ctaObs = ctaEl
      ? new IntersectionObserver(
          ([entry]) => {
            // Show floating bar only when inline buttons have scrolled ABOVE the top of viewport
            setPastInlineCta(!entry.isIntersecting && entry.boundingClientRect.top < 0);
          },
          { threshold: 0 }
        )
      : null;

    const relObs = relEl
      ? new IntersectionObserver(
          ([entry]) => {
            // Hide floating bar once You May Also Like / Footer area enters view
            setAtRelatedSection(entry.isIntersecting || entry.boundingClientRect.top < window.innerHeight);
          },
          { threshold: 0.05 }
        )
      : null;

    if (ctaObs && ctaEl) ctaObs.observe(ctaEl);
    if (relObs && relEl) relObs.observe(relEl);
    return () => {
      if (ctaObs) ctaObs.disconnect();
      if (relObs) relObs.disconnect();
    };
  }, [product, relatedProducts.length]);

  if (!product) return <div style={{ padding: 60, textAlign: 'center' }}>Loading product...</div>;

  const images = product.images || [];
  const currentIdx = Math.max(
    0,
    images.findIndex((im) => im.imageUrl === (activeImageUrl || images[0]?.imageUrl))
  );

  const scrollToImage = (idx) => {
    const target = images[idx];
    if (!target) return;
    setActiveImageUrl(target.imageUrl);
    if (target.colorName) setSelectedColor(target.colorName);
    if (galleryRef.current) {
      galleryRef.current.scrollTo({
        left: idx * galleryRef.current.clientWidth,
        behavior: 'smooth',
      });
    }
  };

  const handleGalleryScroll = () => {
    if (!galleryRef.current || !images.length) return;
    const width = galleryRef.current.clientWidth;
    if (!width) return;
    const idx = Math.round(galleryRef.current.scrollLeft / width);
    const target = images[idx];
    if (target && target.imageUrl !== activeImageUrl) {
      setActiveImageUrl(target.imageUrl);
      if (target.colorName) setSelectedColor(target.colorName);
    }
  };

  const handleColorSelect = (colorName) => {
    setSelectedColor(colorName);
    const idx = images.findIndex(
      (im) => im.colorName?.toLowerCase() === colorName.toLowerCase()
    );
    if (idx !== -1) {
      scrollToImage(idx);
    }
  };

  const handlePackSelect = (pack) => {
    setSelectedPack(pack);
    if (pack.allowMixedColors) {
      setMixedColors(Array(pack.pieceCount).fill(selectedColor || product.colors?.[0]?.name || 'Black'));
    } else {
      setMixedColors([]);
    }
  };

  const buildCartPayload = () => ({
    productId: product.id,
    packId: selectedPack?.id || null,
    selectedColor: selectedPack?.allowMixedColors ? 'Mixed Pack' : selectedColor,
    mixedColors: selectedPack?.allowMixedColors ? mixedColors : [],
    selectedSize,
    quantity: qty,
  });

  const handleBuyNow = async () => {
    if (buyingNow) return;
    setBuyingNow(true);
    try {
      await addItem(buildCartPayload());
      navigate('/checkout');
    } finally {
      setBuyingNow(false);
    }
  };

  const activePrice = selectedPack
    ? (selectedPack.discountPrice || selectedPack.packPrice)
    : (product.discountPrice || product.basePrice);

  return (
    <>
    <div style={{ maxWidth: 1160, margin: '24px auto', padding: '0 20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 44 }}>
      <div>
        <div style={{ position: 'relative', width: '100%', maxWidth: 480, aspectRatio: '4 / 5', borderRadius: 16, overflow: 'hidden', background: 'var(--bg-cream)', border: '1px solid var(--border-sand)' }}>
          <div
            ref={galleryRef}
            onScroll={handleGalleryScroll}
            className="no-scrollbar"
            style={{
              display: 'flex',
              width: '100%',
              height: '100%',
              overflowX: 'auto',
              scrollSnapType: 'x mandatory',
              scrollBehavior: 'smooth',
              WebkitOverflowScrolling: 'touch',
              scrollbarWidth: 'none',
            }}
          >
            {(images.length ? images : [{ imageUrl: '' }]).map((img, idx) => (
              <div
                key={img.id || idx}
                style={{
                  flex: '0 0 100%',
                  width: '100%',
                  height: '100%',
                  scrollSnapAlign: 'start',
                }}
              >
                <img
                  src={resolveAssetUrl(img.imageUrl)}
                  alt={img.colorName ? `${product.name} - ${img.colorName}` : `${product.name} ${idx + 1}`}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    objectPosition: 'center top',
                    display: 'block',
                  }}
                />
              </div>
            ))}
          </div>

          {images.length > 1 && (
            <div
              style={{
                position: 'absolute',
                bottom: 12,
                right: 12,
                padding: '4px 10px',
                borderRadius: 999,
                background: 'rgba(28, 22, 24, 0.72)',
                color: '#fff',
                fontSize: '0.75rem',
                fontWeight: 600,
                letterSpacing: '0.06em',
                pointerEvents: 'none',
              }}
            >
              {currentIdx + 1} / {images.length}
            </div>
          )}
        </div>

        {images.length > 1 && (
          <div style={{ display: 'flex', gap: 10, marginTop: 14, overflowX: 'auto', paddingBottom: 4 }}>
            {images.map((img, idx) => {
              const isSelected = idx === currentIdx;
              return (
                <button
                  key={img.id || idx}
                  type="button"
                  onClick={() => scrollToImage(idx)}
                  style={{
                    padding: 0,
                    borderRadius: 10,
                    overflow: 'hidden',
                    cursor: 'pointer',
                    flexShrink: 0,
                    border: isSelected ? '2px solid var(--luxury-black)' : '1px solid var(--border-sand)',
                    background: 'var(--bg-cream)',
                    width: 74,
                    height: 92,
                  }}
                >
                  <img
                    src={resolveAssetUrl(img.imageUrl)}
                    alt={img.colorName || `${product.name} ${idx + 1}`}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div>
        <div style={{ fontSize: '0.8rem', letterSpacing: '0.1em', color: 'var(--brand-soft-brown)', fontWeight: 700 }}>{product.parentCategoryName ? `${product.parentCategoryName} › ${product.categoryName}` : product.categoryName} • SKU: {product.sku}</div>
        <h1 style={{ fontSize: '2.15rem', margin: '4px 0 8px' }}>{product.name}</h1>
        <div style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 12 }}>₹{Number(activePrice).toLocaleString('en-IN')}</div>
        <p style={{ color: 'var(--text-muted)', marginBottom: 14, fontSize: '0.93rem', lineHeight: 1.55 }}>{product.description}</p>

        {product.colors?.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>Color: {selectedColor}</div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {product.colors.map((c) => (
                <button
                  key={c.id}
                  onClick={() => handleColorSelect(c.name)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', borderRadius: 20, cursor: 'pointer',
                    border: selectedColor === c.name ? '2px solid var(--luxury-black)' : '1px solid var(--border-sand)',
                    background: '#fff'
                  }}
                >
                  <span style={{ width: 16, height: 16, borderRadius: '50%', background: c.hexCode }} />
                  <span style={{ fontSize: '0.85rem' }}>{c.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {product.packs?.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>Select Bundle / Pack</div>
            <div style={{ display: 'grid', gap: 10 }}>
              {product.packs.map((pk) => {
                const isSelected = selectedPack?.id === pk.id;
                const price = pk.discountPrice || pk.packPrice;
                return (
                  <button
                    key={pk.id}
                    onClick={() => handlePackSelect(pk)}
                    style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px',
                      borderRadius: 10, cursor: 'pointer', textAlign: 'left',
                      border: isSelected ? '2px solid var(--luxury-black)' : '1px solid var(--border-sand)',
                      background: isSelected ? 'var(--bg-cream)' : '#fff'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600 }}>{pk.packName} ({pk.pieceCount} {pk.pieceCount === 1 ? 'Piece' : 'Pieces'})</div>
                      {pk.allowMixedColors && <div style={{ fontSize: '0.78rem', color: 'var(--brand-soft-brown)' }}>Choose individual colors for each piece</div>}
                    </div>
                    <div style={{ fontWeight: 700 }}>₹{Number(price).toLocaleString('en-IN')}</div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {selectedPack?.allowMixedColors && product.colors?.length > 0 && (
          <div style={{ background: 'var(--bg-cream)', padding: 14, borderRadius: 10, marginBottom: 20 }}>
            <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: 10 }}>Customize Your {selectedPack.pieceCount} Colors:</div>
            <div style={{ display: 'grid', gap: 8 }}>
              {mixedColors.map((chosen, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.86rem' }}>Piece #{i + 1}</span>
                  <select
                    value={chosen}
                    onChange={(e) => {
                      const copy = [...mixedColors];
                      copy[i] = e.target.value;
                      setMixedColors(copy);
                    }}
                    style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid var(--border-sand)' }}
                  >
                    {product.colors.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
              ))}
            </div>
          </div>
        )}

        {product.availableSizes?.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>Size</div>
            <div style={{ display: 'flex', gap: 10 }}>
              {product.availableSizes.map((sz) => (
                <button
                  key={sz}
                  onClick={() => setSelectedSize(sz)}
                  style={{
                    padding: '8px 16px', borderRadius: 8, cursor: 'pointer',
                    border: selectedSize === sz ? '2px solid var(--luxury-black)' : '1px solid var(--border-sand)',
                    background: '#fff'
                  }}
                >
                  {sz}
                </button>
              ))}
            </div>
          </div>
        )}

        <div ref={inlineCtaRef} style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 24 }}>
          <input
            type="number"
            min={1}
            max={20}
            value={qty}
            onChange={(e) => setQty(Math.max(1, Number(e.target.value)))}
            style={{ width: 68, padding: 12, borderRadius: 8, border: '1px solid var(--border-sand)', textAlign: 'center', fontWeight: 600 }}
          />
          <button
            type="button"
            className="btn-outline"
            style={{ flex: '1 1 170px', borderRadius: 999, padding: '13px 18px', fontWeight: 700, letterSpacing: '0.06em' }}
            onClick={() => addItem(buildCartPayload())}
          >
            Add to Shopping Bag
          </button>
          <button
            type="button"
            className="btn-primary"
            disabled={buyingNow}
            style={{ flex: '1 1 150px', padding: '13px 18px' }}
            onClick={handleBuyNow}
          >
            {buyingNow ? 'Opening Checkout...' : 'Buy Now'}
          </button>
          <button
            type="button"
            onClick={() => toggleWishlist(product.id)}
            aria-label="Save to Wishlist"
            title={isWishlisted(product.id) ? "Saved in Wishlist" : "Save to Wishlist"}
            style={{
              padding: '0 16px',
              minHeight: 46,
              borderRadius: 999,
              border: isWishlisted(product.id) ? '1.5px solid #9E2A2B' : '1px solid var(--brand-gold)',
              background: isWishlisted(product.id) ? '#FDECEA' : '#FFFFFF',
              color: isWishlisted(product.id) ? '#9E2A2B' : 'var(--brand-plum)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.85rem'
            }}
          >
            <Heart size={18} fill={isWishlisted(product.id) ? '#9E2A2B' : 'transparent'} />
          </button>
        </div>

        <div style={{ marginTop: 24, paddingTop: 18, borderTop: '1px solid var(--border-sand)', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
          <div><strong>Fabric:</strong> {product.fabric}</div>
          <div><strong>Specifications:</strong> {product.specifications}</div>
        </div>
      </div>
    </div>
      <ProductReviewsSection productId={product.id} />

      {relatedProducts.length > 0 && (
        <section ref={relatedRef} style={{ maxWidth: 1160, margin: "24px auto 64px", padding: "36px 20px 0", borderTop: "1px solid var(--border-sand)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 12, marginBottom: 24 }}>
            <div>
              <div style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.14em", color: "var(--brand-gold-dark)", textTransform: "uppercase" }}>
                Curated For You
              </div>
              <h2 style={{ fontSize: "1.9rem", color: "var(--brand-plum)", margin: "4px 0 0" }}>
                You May Also Like
              </h2>
            </div>
            <Link to="/shop" style={{ fontSize: "0.86rem", fontWeight: 700, color: "var(--brand-plum)", textDecoration: "underline", textUnderlineOffset: 4 }}>
              Explore Full Collection →
            </Link>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))", gap: 22 }}>
            {relatedProducts.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      )}
      {/* Flipkart-style Conditional Sticky Bar: shows after scrolling past CTA, hides at Similar Products */}
      {pastInlineCta && !atRelatedSection && (
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 950,
          background: "rgba(255, 255, 255, 0.97)",
          backdropFilter: "blur(10px)",
          borderTop: "1.5px solid var(--brand-gold)",
          boxShadow: "0 -6px 24px rgba(35, 16, 25, 0.12)",
          padding: "10px 18px",
        }}
      >
        <div
          style={{
            maxWidth: 1160,
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0, flex: "1 1 220px" }}>
            {images[0]?.imageUrl && (
              <img
                src={resolveAssetUrl(activeImageUrl || images[0].imageUrl)}
                alt={product.name}
                style={{ width: 42, height: 50, objectFit: "cover", borderRadius: 8, border: "1px solid var(--border-sand)", flexShrink: 0 }}
              />
            )}
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: "0.94rem", color: "var(--brand-plum)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {product.name}
              </div>
              <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 8 }}>
                <strong style={{ color: "var(--brand-plum)", fontSize: "0.96rem" }}>₹{Number(activePrice).toLocaleString("en-IN")}</strong>
                {selectedColor && <span>• {selectedColor}</span>}
                {selectedSize && <span>• {selectedSize}</span>}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10, flex: "1 1 320px", justifyContent: "flex-end" }}>
            <button
              type="button"
              className="btn-outline"
              style={{ flex: "1 1 160px", maxWidth: 210, borderRadius: 999, padding: "11px 16px", fontWeight: 700, fontSize: "0.82rem", letterSpacing: "0.05em", background: "#fff" }}
              onClick={() => addItem(buildCartPayload())}
            >
              Add to Shopping Bag
            </button>
            <button
              type="button"
              className="btn-primary"
              disabled={buyingNow}
              style={{ flex: "1 1 140px", maxWidth: 190, padding: "11px 18px", fontSize: "0.84rem" }}
              onClick={handleBuyNow}
            >
              {buyingNow ? "Opening..." : "Buy Now"}
            </button>
          </div>
        </div>
      </div>
      )}
    </>
  );
}
