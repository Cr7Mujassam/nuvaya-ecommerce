import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';
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
    }, 1250);
    return () => clearInterval(interval);
  }, [isHovered, images.length]);

  const activeImage = isHovered && images.length > 1 ? images[slideIndex] : defaultImage;
  const displayPrice = product.discountPrice || product.basePrice;
  const discountPct =
    product.discountPrice && product.basePrice > product.discountPrice
      ? Math.round(((product.basePrice - product.discountPrice) / product.basePrice) * 100)
      : 0;

  return (
    <div className="nv-card">
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
          className="nv-card-img"
          style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.65s cubic-bezier(0.22, 1, 0.36, 1)' }}
        />

        <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {product.newArrival && <span style={badgeStyle('#27101B')}>NEW IN</span>}
          {product.bestSeller && <span style={badgeStyle('#9B773E')}>BESTSELLER</span>}
        </div>

        {discountPct > 0 && (
          <div style={{
            position: 'absolute',
            top: 12,
            right: 12,
            background: 'rgba(251, 248, 243, 0.92)',
            backdropFilter: 'blur(6px)',
            color: 'var(--brand-plum)',
            border: '1px solid var(--brand-gold)',
            fontSize: '0.66rem',
            fontWeight: 700,
            padding: '4px 9px',
            borderRadius: 999,
            letterSpacing: '0.06em'
          }}>
            SAVE {discountPct}%
          </div>
        )}

        {images.length > 1 && (
          <div style={{ position: 'absolute', bottom: 12, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 5 }}>
            {images.map((img, idx) => {
              const active = activeImage?.imageUrl === img.imageUrl;
              return (
                <span
                  key={img.id || idx}
                  style={{
                    width: active ? 18 : 6,
                    height: 5,
                    borderRadius: 999,
                    background: active ? '#27101B' : 'rgba(255,255,255,0.85)',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                    transition: 'all 0.25s ease',
                  }}
                />
              );
            })}
          </div>
        )}
      </Link>

      <div style={{ padding: '18px 18px 20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontSize: '0.68rem', color: 'var(--brand-gold-dark)', textTransform: 'uppercase', letterSpacing: '0.16em', fontWeight: 700 }}>
          {product.categoryName}
        </div>
        <Link
          to={`/product/${product.id}`}
          className="editorial"
          style={{ fontWeight: 600, fontSize: '1.28rem', lineHeight: 1.25, margin: '4px 0 8px', color: 'var(--brand-plum)' }}
        >
          {product.name}
        </Link>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 12 }}>
          <span style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--brand-plum)' }}>
            ₹{Number(displayPrice).toLocaleString('en-IN')}
          </span>
          {product.discountPrice && (
            <span style={{ textDecoration: 'line-through', color: 'var(--text-muted)', fontSize: '0.84rem' }}>
              ₹{Number(product.basePrice).toLocaleString('en-IN')}
            </span>
          )}
        </div>

        {product.colors?.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            {product.colors.map((c) => (
              <button
                key={c.id || c.name}
                title={c.name}
                onClick={() => {
                  setSelectedColor(c.name);
                  setIsHovered(false);
                }}
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  background: c.hexCode,
                  cursor: 'pointer',
                  border: selectedColor === c.name ? '2px solid var(--brand-plum)' : '1px solid rgba(39,16,27,0.22)',
                  boxShadow: selectedColor === c.name ? '0 0 0 2px #fff, 0 0 0 3.5px var(--brand-gold)' : 'none',
                  transition: 'all 0.2s ease'
                }}
              />
            ))}
          </div>
        )}

        <button
          className="btn-primary"
          style={{ marginTop: 'auto', padding: '11px 16px', width: '100%' }}
          onClick={() => addItem({
            productId: product.id,
            packId: product.packs?.[0]?.id || null,
            selectedColor,
            selectedSize: product.availableSizes?.[0] || null,
            quantity: 1,
          })}
        >
          <ShoppingBag size={14} /> Add to Bag
        </button>
      </div>
    </div>
  );
}

const badgeStyle = (bg) => ({
  background: bg,
  color: '#FBF8F3',
  border: '1px solid rgba(198,161,99,0.65)',
  fontSize: '0.62rem',
  fontWeight: 700,
  padding: '4px 10px',
  borderRadius: 999,
  letterSpacing: '0.12em'
});
