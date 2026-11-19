import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axiosClient, { resolveAssetUrl } from '../../api/axiosClient';
import { useCart } from '../../context/CartContext';
import ProductReviewsSection from '../../components/product/ProductReviewsSection';

export default function ProductDetailPage() {
  const { id } = useParams();
  const { addItem } = useCart();
  const [product, setProduct] = useState(null);
  const [selectedColor, setSelectedColor] = useState('');
  const [activeImageUrl, setActiveImageUrl] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedPack, setSelectedPack] = useState(null);
  const [mixedColors, setMixedColors] = useState([]);
  const [qty, setQty] = useState(1);

  useEffect(() => {
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
    });
  }, [id]);

  if (!product) return <div style={{ padding: 60, textAlign: 'center' }}>Loading product...</div>;

  const handleColorSelect = (colorName) => {
    setSelectedColor(colorName);
    const matchingImg = product.images?.find(
      (im) => im.colorName?.toLowerCase() === colorName.toLowerCase()
    );
    if (matchingImg) {
      setActiveImageUrl(matchingImg.imageUrl);
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

  const activePrice = selectedPack
    ? (selectedPack.discountPrice || selectedPack.packPrice)
    : (product.discountPrice || product.basePrice);

  return (
    <>
    <div style={{ maxWidth: 1160, margin: '40px auto', padding: '0 20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 44 }}>
      <div>
        <div style={{ borderRadius: 16, overflow: 'hidden', background: 'var(--bg-cream)', border: '1px solid var(--border-sand)' }}>
          <img
            src={resolveAssetUrl(activeImageUrl || product.images?.[0]?.imageUrl)}
            alt={product.name}
            style={{ width: '100%', maxHeight: 560, objectFit: 'cover', display: 'block' }}
          />
        </div>

        {product.images?.length > 1 && (
          <div style={{ display: 'flex', gap: 10, marginTop: 14, overflowX: 'auto', paddingBottom: 4 }}>
            {product.images.map((img, idx) => {
              const isSelected = (activeImageUrl || product.images[0]?.imageUrl) === img.imageUrl;
              return (
                <button
                  key={img.id || idx}
                  type="button"
                  onClick={() => {
                    setActiveImageUrl(img.imageUrl);
                    if (img.colorName) setSelectedColor(img.colorName);
                  }}
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
        <div style={{ fontSize: '0.8rem', letterSpacing: '0.1em', color: 'var(--brand-soft-brown)', fontWeight: 700 }}>{product.categoryName} • SKU: {product.sku}</div>
        <h1 style={{ fontSize: '2.4rem', margin: '6px 0 12px' }}>{product.name}</h1>
        <div style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: 16 }}>₹{Number(activePrice).toLocaleString('en-IN')}</div>
        <p style={{ color: 'var(--text-muted)', marginBottom: 20 }}>{product.description}</p>

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

        <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
          <input type="number" min={1} max={20} value={qty} onChange={(e) => setQty(Number(e.target.value))} style={{ width: 72, padding: 12, borderRadius: 8, border: '1px solid var(--border-sand)', textAlign: 'center' }} />
          <button
            className="btn-primary"
            style={{ flex: 1 }}
            onClick={() => addItem({
              productId: product.id,
              packId: selectedPack?.id || null,
              selectedColor: selectedPack?.allowMixedColors ? 'Mixed Pack' : selectedColor,
              mixedColors: selectedPack?.allowMixedColors ? mixedColors : [],
              selectedSize,
              quantity: qty,
            })}
          >
            Add to Shopping Bag
          </button>
        </div>

        <div style={{ marginTop: 24, paddingTop: 18, borderTop: '1px solid var(--border-sand)', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
          <div><strong>Fabric:</strong> {product.fabric}</div>
          <div><strong>Specifications:</strong> {product.specifications}</div>
        </div>
      </div>
    </div>
      <ProductReviewsSection productId={product.id} />
    </>
  );
}
