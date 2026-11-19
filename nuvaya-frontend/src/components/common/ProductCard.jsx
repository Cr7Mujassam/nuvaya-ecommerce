import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { FALLBACK_IMAGE, resolveAssetUrl } from '../../api/axiosClient';
import { useCart } from '../../context/CartContext';

export default function ProductCard({ product }) {
  const { addItem } = useCart();
  const navigate = useNavigate();
  const [selectedColor, setSelectedColor] = useState(product.colors?.[0]?.name || '');
  const [selectedPack, setSelectedPack] = useState(null);
  const [activeImgIdx, setActiveImgIdx] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const touchStartX = useRef(null);

  const images = product.images || [];
  const baseUnitPrice = Number(product.discountPrice || product.basePrice);
  const baseRegularPrice = Number(product.basePrice);

  // Build pack options: include Single (Pack of 1) + any configured packs (Pack of 3, 5, 6, etc.)
  const configuredPacks = product.packs || [];
  const hasPackOf1 = configuredPacks.some((pk) => Number(pk.pieceCount) === 1);
  const displayPacks = hasPackOf1
    ? configuredPacks
    : [
        {
          id: null,
          packName: 'Pack of 1',
          pieceCount: 1,
          packPrice: baseRegularPrice,
          discountPrice: product.discountPrice ? baseUnitPrice : null,
          allowMixedColors: false,
          isDefaultSingle: true,
        },
        ...configuredPacks,
      ];

  useEffect(() => {
    setSelectedPack(displayPacks[0] || null);
    setSelectedColor(product.colors?.[0]?.name || '');
    const primaryIdx = images.findIndex((i) => i.primaryImage);
    setActiveImgIdx(primaryIdx >= 0 ? primaryIdx : 0);
  }, [product.id]);

  const handleColorPick = (e, colorName) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedColor(colorName);
    const matchIdx = images.findIndex(
      (i) => i.colorName?.toLowerCase() === colorName?.toLowerCase()
    );
    if (matchIdx >= 0) {
      setActiveImgIdx(matchIdx);
    }
  };

  const prevPhoto = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (images.length <= 1) return;
    setActiveImgIdx((prev) => (prev - 1 + images.length) % images.length);
  };

  const nextPhoto = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (images.length <= 1) return;
    setActiveImgIdx((prev) => (prev + 1) % images.length);
  };

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    if (touchStartX.current === null || images.length <= 1) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(deltaX) > 35) {
      if (deltaX < 0) {
        setActiveImgIdx((prev) => (prev + 1) % images.length);
      } else {
        setActiveImgIdx((prev) => (prev - 1 + images.length) % images.length);
      }
    }
  };

  const currentImage = images[activeImgIdx] || images[0];

  const regularPrice = selectedPack
    ? Number(selectedPack.packPrice)
    : baseRegularPrice;
  const displayPrice = selectedPack
    ? Number(selectedPack.discountPrice || selectedPack.packPrice)
    : baseUnitPrice;

  const discountPct =
    regularPrice > displayPrice
      ? Math.round(((regularPrice - displayPrice) / regularPrice) * 100)
      : 0;

  const avgRating = Number(product.averageRating || 0);
  const reviewCount = Number(product.reviewCount || 0);

  return (
    <div
      className="nv-card"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Portrait Image Frame with Direct Multi-Photo Arrows, Dots & Touch Swipe */}
      <div
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{
          position: 'relative',
          aspectRatio: '3 / 4',
          background: 'var(--bg-cream)',
          overflow: 'hidden',
          userSelect: 'none'
        }}
      >
        <img
          src={resolveAssetUrl(currentImage?.imageUrl)}
          onError={(e) => { e.currentTarget.src = FALLBACK_IMAGE; }}
          alt={product.name}
          onClick={() => navigate(`/product/${product.id}`)}
          className="nv-card-img"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            cursor: 'pointer',
            transition: 'transform 0.65s cubic-bezier(0.22, 1, 0.36, 1)'
          }}
        />

        {/* Top Left Badges */}
        <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', flexDirection: 'column', gap: 5, pointerEvents: 'none' }}>
          {product.newArrival && <span style={badgeStyle('#27101B')}>NEW IN</span>}
          {product.bestSeller && <span style={badgeStyle('#9B773E')}>BESTSELLER</span>}
        </div>

        {/* Top Right Discount Pill */}
        {discountPct > 0 && (
          <div style={{
            position: 'absolute',
            top: 12,
            right: 12,
            background: 'rgba(251, 248, 243, 0.94)',
            backdropFilter: 'blur(6px)',
            color: 'var(--brand-plum)',
            border: '1px solid var(--brand-gold)',
            fontSize: '0.64rem',
            fontWeight: 700,
            padding: '4px 9px',
            borderRadius: 999,
            letterSpacing: '0.06em',
            pointerEvents: 'none'
          }}>
            SAVE {discountPct}%
          </div>
        )}

        {/* Direct Multi-Photo Controls */}
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={prevPhoto}
              aria-label="Previous photo"
              style={{
                ...arrowBtnStyle,
                left: 8,
                opacity: isHovered ? 1 : 0.92
              }}
            >
              <ChevronLeft size={17} />
            </button>
            <button
              type="button"
              onClick={nextPhoto}
              aria-label="Next photo"
              style={{
                ...arrowBtnStyle,
                right: 8,
                opacity: isHovered ? 1 : 0.92
              }}
            >
              <ChevronRight size={17} />
            </button>

            <div
              style={{
                position: 'absolute',
                bottom: 10,
                left: 0,
                right: 0,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: 6,
                zIndex: 3
              }}
            >
              {images.map((img, idx) => {
                const active = idx === activeImgIdx;
                return (
                  <button
                    key={img.id || idx}
                    type="button"
                    aria-label={`Photo ${idx + 1}`}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setActiveImgIdx(idx);
                    }}
                    style={{
                      width: active ? 20 : 8,
                      height: 8,
                      padding: 0,
                      border: 'none',
                      borderRadius: 999,
                      cursor: 'pointer',
                      background: active ? '#27101B' : 'rgba(255,255,255,0.92)',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.35)',
                      transition: 'all 0.22s ease',
                    }}
                  />
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Card Body */}
      <div style={{ padding: '16px 16px 18px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Category + Live Star Rating Row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: '0.66rem', color: 'var(--brand-gold-dark)', textTransform: 'uppercase', letterSpacing: '0.14em', fontWeight: 700 }}>
            {product.categoryName}
          </span>

          <Link
            to={`/product/${product.id}`}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.76rem', fontWeight: 700, color: 'var(--brand-plum)' }}
            title={`${avgRating.toFixed(1)} out of 5 (${reviewCount} reviews)`}
          >
            <Star
              size={13}
              fill={reviewCount > 0 ? '#C6A163' : 'transparent'}
              color="#C6A163"
            />
            <span>{avgRating.toFixed(1)}</span>
            <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>({reviewCount})</span>
          </Link>
        </div>

        {/* Product Title */}
        <Link
          to={`/product/${product.id}`}
          className="editorial"
          style={{ fontWeight: 600, fontSize: '1.25rem', lineHeight: 1.24, margin: '4px 0 8px', color: 'var(--brand-plum)' }}
        >
          {product.name}
        </Link>

        {/* Pack Selector Pills (Pack of 1, Pack of 3, Pack of 5, Pack of 6) */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
          {displayPacks.map((pk, idx) => {
            const isSelected = selectedPack?.packName === pk.packName;
            const pkPrice = Number(pk.discountPrice || pk.packPrice);
            return (
              <button
                key={pk.id || `pack-${idx}`}
                type="button"
                onClick={() => setSelectedPack(pk)}
                style={{
                  padding: '4px 9px',
                  borderRadius: 8,
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: isSelected ? '1.5px solid var(--brand-plum)' : '1px solid var(--border-sand)',
                  background: isSelected ? 'var(--bg-cream)' : '#FFFFFF',
                  color: 'var(--brand-plum)',
                  transition: 'all 0.2s ease'
                }}
              >
                {pk.packName} • ₹{pkPrice.toLocaleString('en-IN')}
              </button>
            );
          })}
        </div>

        {/* Active Price Display */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 10 }}>
          <span style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--brand-plum)' }}>
            ₹{displayPrice.toLocaleString('en-IN')}
          </span>
          {regularPrice > displayPrice && (
            <span style={{ textDecoration: 'line-through', color: 'var(--text-muted)', fontSize: '0.84rem' }}>
              ₹{regularPrice.toLocaleString('en-IN')}
            </span>
          )}
          {selectedPack && (
            <span style={{ fontSize: '0.72rem', color: 'var(--brand-gold-dark)', fontWeight: 600 }}>
              ({selectedPack.packName})
            </span>
          )}
        </div>

        {/* Color Swatches */}
        {product.colors?.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 14, flexWrap: 'wrap' }}>
            {product.colors.map((c) => (
              <button
                key={c.id || c.name}
                type="button"
                title={c.name}
                onClick={(e) => handleColorPick(e, c.name)}
                style={{
                  width: 19,
                  height: 19,
                  borderRadius: '50%',
                  background: c.hexCode,
                  cursor: 'pointer',
                  border: selectedColor === c.name ? '2px solid var(--brand-plum)' : '1px solid rgba(39,16,27,0.22)',
                  boxShadow: selectedColor === c.name ? '0 0 0 2px #fff, 0 0 0 3.2px var(--brand-gold)' : 'none',
                  transition: 'all 0.2s ease'
                }}
              />
            ))}
          </div>
        )}

        {/* Add to Bag CTA */}
        <button
          type="button"
          className="btn-primary"
          style={{ marginTop: 'auto', padding: '10px 14px', width: '100%' }}
          onClick={() => addItem({
            productId: product.id,
            packId: selectedPack?.id || null,
            selectedColor: selectedPack?.allowMixedColors ? 'Mixed Pack' : selectedColor,
            mixedColors: selectedPack?.allowMixedColors
              ? Array(selectedPack.pieceCount).fill(selectedColor || product.colors?.[0]?.name || 'Black')
              : [],
            selectedSize: product.availableSizes?.[0] || null,
            quantity: 1,
          })}
        >
          <ShoppingBag size={14} /> Add {selectedPack ? selectedPack.packName : 'Pack of 1'}
        </button>
      </div>
    </div>
  );
}

const arrowBtnStyle = {
  position: 'absolute',
  top: '50%',
  transform: 'translateY(-50%)',
  width: 30,
  height: 30,
  borderRadius: '50%',
  border: '1px solid rgba(198,161,99,0.75)',
  background: 'rgba(251, 248, 243, 0.94)',
  color: 'var(--brand-plum)',
  display: 'grid',
  placeItems: 'center',
  cursor: 'pointer',
  boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
  zIndex: 3,
  padding: 0,
};

const badgeStyle = (bg) => ({
  background: bg,
  color: '#FBF8F3',
  border: '1px solid rgba(198,161,99,0.65)',
  fontSize: '0.6rem',
  fontWeight: 700,
  padding: '4px 9px',
  borderRadius: 999,
  letterSpacing: '0.11em'
});
