import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import axiosClient from '../../api/axiosClient';
import { useCart } from '../../context/CartContext';
import { buildWhatsAppCheckoutUrl } from '../../utils/whatsappBuilder';

export default function CheckoutPage() {
  const { items, subtotal, deliveryCharges, discounts, totalAmount, storeSettings, clearCart } = useCart();
  const navigate = useNavigate();
  const [form, setForm] = useState({ customerName: '', customerMobile: '', deliveryAddress: '', city: '', state: '', pinCode: '', orderNotes: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const { data: order } = await axiosClient.post('/orders', {
        ...form,
        items: items.map((i) => ({
          productId: i.productId,
          packId: i.packId || null,
          selectedColor: i.selectedColor || null,
          mixedColors: i.mixedColors || [],
          selectedSize: i.selectedSize || null,
          quantity: i.quantity,
        })),
      });

      const waUrl = buildWhatsAppCheckoutUrl({
        whatsappNumber: storeSettings?.whatsappNumber || import.meta.env.VITE_WHATSAPP_FALLBACK,
        orderReference: order.orderReference,
        customerName: order.customerName,
        customerMobile: order.customerMobile,
        deliveryAddress: order.deliveryAddress,
        city: order.city,
        state: order.state,
        pinCode: order.pinCode,
        orderNotes: order.orderNotes,
        items: order.items,
        subtotal: order.subtotal,
        deliveryCharges: order.deliveryCharges,
        discountAmount: order.discountAmount,
        finalAmount: order.finalAmount,
      });

      window.open(waUrl, '_blank', 'noopener,noreferrer');
      clearCart();
      navigate(`/order-submitted?ref=${order.orderReference}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Please check all required delivery fields.');
    } finally {
      setSubmitting(false);
    }
  };

  if (items.length === 0) return <div style={{ padding: 60, textAlign: 'center' }}>Your cart is empty.</div>;

  return (
    <div style={{ maxWidth: 1080, margin: '40px auto', padding: '0 20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 36 }}>
      <form onSubmit={handleSubmit} style={{ background: '#fff', padding: 28, borderRadius: 14, border: '1px solid var(--border-sand)' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: 16 }}>WhatsApp Checkout</h1>
        {error && <div style={{ background: '#FDECEA', color: '#9E2A2B', padding: 10, borderRadius: 8, marginBottom: 14 }}>{error}</div>}
        <div style={{ display: 'grid', gap: 12 }}>
          <input required placeholder="Full Name *" value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} style={inp} />
          <input required placeholder="Mobile Number *" value={form.customerMobile} onChange={(e) => setForm({ ...form, customerMobile: e.target.value })} style={inp} />
          <textarea required rows={3} placeholder="Full Delivery Address *" value={form.deliveryAddress} onChange={(e) => setForm({ ...form, deliveryAddress: e.target.value })} style={inp} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <input required placeholder="City *" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} style={inp} />
            <input required placeholder="State *" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} style={inp} />
          </div>
          <input required maxLength={6} placeholder="6-Digit PIN Code *" value={form.pinCode} onChange={(e) => setForm({ ...form, pinCode: e.target.value })} style={inp} />
          <textarea rows={2} placeholder="Optional Order Notes" value={form.orderNotes} onChange={(e) => setForm({ ...form, orderNotes: e.target.value })} style={inp} />
        </div>
        <p style={{ background: 'var(--bg-cream)', padding: 12, borderRadius: 8, fontSize: '0.82rem', marginTop: 16 }}>
          Note: Sending the WhatsApp message submits your order request with a unique reference ID and does not itself constitute payment confirmation or a confirmed order.
        </p>
        <button type="submit" disabled={submitting} style={{ width: '100%', marginTop: 16, padding: 14, background: '#1E6F50', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer' }}>
          <MessageCircle size={18} /> {submitting ? 'Creating Order...' : 'Confirm Order on WhatsApp'}
        </button>
      </form>

      <div style={{ background: 'var(--bg-cream)', padding: 28, borderRadius: 14, border: '1px solid var(--border-sand)', alignSelf: 'start' }}>
        <h2 style={{ fontSize: '1.6rem', marginBottom: 16 }}>Order Summary</h2>
        {items.map((i) => (
          <div key={i.key} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontSize: '0.92rem' }}>
            <span>{i.productName} ({i.pack?.packName || 'Single'}) × {i.quantity}</span>
            <strong>₹{i.lineEffectiveTotal.toLocaleString('en-IN')}</strong>
          </div>
        ))}
        <hr style={{ border: 'none', borderTop: '1px solid var(--border-sand)', margin: '14px 0' }} />
        <div style={{ display: 'grid', gap: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Subtotal</span><span>₹{subtotal.toLocaleString('en-IN')}</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Delivery Charges</span><span>{deliveryCharges === 0 ? 'FREE' : `₹${deliveryCharges}`}</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#1E6F50' }}><span>Discounts</span><span>-₹{discounts.toLocaleString('en-IN')}</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1.15rem', paddingTop: 8 }}><span>Total Payable</span><span>₹{totalAmount.toLocaleString('en-IN')}</span></div>
        </div>
      </div>
    </div>
  );
}

const inp = { width: '100%', padding: '11px 14px', borderRadius: 8, border: '1px solid var(--border-sand)', fontFamily: 'inherit' };
