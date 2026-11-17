import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FALLBACK_IMAGE, resolveAssetUrl } from '../../api/axiosClient';
import { useCart } from '../../context/CartContext';

export default function ProductCard({ product }) {
  const { addItem } = useCart();
  const [selectedColor, setSelectedColor] = useState(product.colors?.[0]?.name || '');
  const [isHovered, setIsHovered] = useState(false);
  const [slideIndex, setSlideIndex] = useState(0);

  const images = product.images || [];
  const colorImage = images.find((i) => i.colorName?.toLowerCase() === selectedColor?.toLowerCase());
  const defaultImage = colorImage || images.find((i) => i.primaryImage) || images[0];

  useEffect(() => {
    if (!isHovered || images.length <= 1) {
      setSlideIndex(0);
      return;
    }
    setSlideIndex(1);
    const interval = setInterval(() => {
      setSlideIndex((prev) => (prev + 1) % images.length);
    }, 1200);
    return () => clearInterval(interval);
  }, [isHovered, images.length]);

  const activeImage = isHovered && images.length > 1 ? images[slideIndex] : defaultImage;
  const displayPrice = product.discountPrice || product.basePrice;

  return (
    <div style={{ background: 'var(--surface-white)', borderRadius: 16, overflow: 'hidden', border: '1px solid var(--border-sand)', display: 'flex', flexDirection: 'column', boxShadow: '0 8px 24px rgba(44,20,31,0.05)' }}>
      <Link
        to={`/product/${product.id}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{ position: 'relative', display: 'block', aspectRatio: '3 / 4', background: 'var(--bg-cream)', overflow: 'hidden' }}
      >
        <img
          src={resolveAssetUrl(activeImage?.imageUrl)}
          onError={(e) => { e.currentTarget.src = FALLBACK_IMAGE; }}
          alt={product.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.35s ease' }}
        />

        <div style={{ position: 'absolute', top: 10, left: 10, display: 'flex', gap: 6 }}>
          {product.newArrival && <span style={badgeStyle('#2C141F')}>NEW</span>}
          {product.bestSeller && <span style={badgeStyle('#9E7B43')}>BEST SELLER</span>}
        </div>

        {images.length > 1 && (
          <div style={{ position: 'absolute', bottom: 10, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 5 }}>
            {images.map((img, idx) => {
              const active = activeImage?.imageUrl === img.imageUrl;
              return (
                <span
                  key={img.id || idx}
                  style={{
                    width: active ? 16 : 6,
                    height: 6,
                    borderRadius: 4,
                    background: active ? '#2C141F' : 'rgba(255,255,255,0.85)',
                    transition: 'all 0.25s ease',
                  }}
                />
              );
            })}
          </div>
        )}
      </Link>

      <div style={{ padding: 16, flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontSize: '0.73rem', color: 'var(--brand-gold-dark)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>{product.categoryName}</div>
        <Link to={`/product/${product.id}`} style={{ fontWeight: 600, fontSize: '1.02rem', margin: '4px 0 8px', color: 'var(--brand-plum)' }}>{product.name}</Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <span style={{ fontWeight: 700, fontSize: '1.08rem', color: 'var(--brand-plum)' }}>₹{Number(displayPrice).toLocaleString('en-IN')}</span>
          {product.discountPrice && (
            <span style={{ textDecoration: 'line-through', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
              ₹{Number(product.basePrice).toLocaleString('en-IN')}
            </span>
          )}
        </div>

        {product.colors?.length > 0 && (
          <div style={{ display: 'flex', gap: 7, marginBottom: 14 }}>
            {product.colors.map((c) => (
              <button
                key={c.id || c.name}
                title={c.name}
                onClick={() => {
                  setSelectedColor(c.name);
                  setIsHovered(false);
                }}
                style={{
                  width: 20, height: 20, borderRadius: '50%', background: c.hexCode, cursor: 'pointer',
                  border: selectedColor === c.name ? '2px solid var(--brand-plum)' : '1px solid var(--border-sand)',
                  outline: selectedColor === c.name ? '2px solid #fff' : 'none',
                }}
              />
            ))}
          </div>
        )}

        <button
          className="btn-primary"
          style={{ marginTop: 'auto', padding: '10px 14px', fontSize: '0.86rem' }}
          onClick={() => addItem({
            productId: product.id,
            packId: product.packs?.[0]?.id || null,
            selectedColor,
            selectedSize: product.availableSizes?.[0] || null,
            quantity: 1,
          })}
        >
          Add to Bag
        </button>
      </div>
    </div>
  );
}

const badgeStyle = (bg) => ({
  background: bg, color: '#FAF6EE', border: '1px solid rgba(197,160,101,0.6)', fontSize: '0.66rem', fontWeight: 700,
  padding: '4px 8px', borderRadius: 5, letterSpacing: '0.07em'
});
