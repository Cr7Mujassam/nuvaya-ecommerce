import React from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Trash2, Plus, Minus } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { resolveAssetUrl } from '../../api/axiosClient';

export default function CartDrawer() {
  const { items, subtotal, discounts, deliveryCharges, totalAmount, drawerOpen, setDrawerOpen, updateQuantity, removeItem } = useCart();
  const navigate = useNavigate();

  if (!drawerOpen) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(22,20,18,0.45)', zIndex: 60, display: 'flex', justifyContent: 'flex-end' }}>
      <div style={{ width: '100%', maxWidth: 420, background: 'var(--bg-ivory)', height: '100%', display: 'flex', flexDirection: 'column', padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 16, borderBottom: '1px solid var(--border-sand)' }}>
          <h3 style={{ fontSize: '1.5rem' }}>Your Shopping Bag</h3>
          <button onClick={() => setDrawerOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={22} /></button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 0' }}>
          {items.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: 60 }}>Your bag is currently empty.</p>
          ) : items.map((item) => (
            <div key={item.key} style={{ display: 'flex', gap: 12, paddingBottom: 14, marginBottom: 14, borderBottom: '1px solid var(--border-sand)' }}>
              <img src={resolveAssetUrl(item.imageUrl)} alt={item.productName} style={{ width: 68, height: 84, objectFit: 'cover', borderRadius: 8, background: 'var(--bg-beige)' }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: '0.94rem' }}>{item.productName}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {item.pack?.packName || 'Single'} {item.selectedColor ? `• ${item.selectedColor}` : ''}
                  {item.mixedColors?.length ? ` (${item.mixedColors.join(', ')})` : ''}
                </div>
                <div style={{ fontWeight: 600, marginTop: 4 }}>₹{item.lineEffectiveTotal.toLocaleString('en-IN')}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
                  <button onClick={() => updateQuantity(item.key, -1)} style={qtyBtn}><Minus size={13} /></button>
                  <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.key, 1)} style={qtyBtn}><Plus size={13} /></button>
                  <button onClick={() => removeItem(item.key)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#9E2A2B', cursor: 'pointer' }}><Trash2 size={15} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {items.length > 0 && (
          <div style={{ borderTop: '1px solid var(--border-sand)', paddingTop: 16 }}>
            <div style={{ display: 'grid', gap: 6, fontSize: '0.9rem', marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Subtotal</span><span>₹{subtotal.toLocaleString('en-IN')}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Delivery</span><span>{deliveryCharges === 0 ? 'FREE' : `₹${deliveryCharges}`}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#1E6F50' }}><span>Discounts</span><span>-₹{discounts.toLocaleString('en-IN')}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1.08rem', paddingTop: 8 }}><span>Total</span><span>₹{totalAmount.toLocaleString('en-IN')}</span></div>
            </div>
            <button
              className="btn-primary"
              style={{ width: '100%' }}
              onClick={() => { setDrawerOpen(false); navigate('/checkout'); }}
            >
              Proceed to Checkout
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const qtyBtn = { width: 26, height: 26, borderRadius: 6, border: '1px solid var(--border-sand)', background: '#fff', display: 'grid', placeItems: 'center', cursor: 'pointer' };
