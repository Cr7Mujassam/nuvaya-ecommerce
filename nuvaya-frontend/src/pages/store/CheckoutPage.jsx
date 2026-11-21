import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Banknote, MessageCircle, ShieldCheck } from 'lucide-react';
import axiosClient from '../../api/axiosClient';
import { useCart } from '../../context/CartContext';
import { buildWhatsAppCheckoutUrl } from '../../utils/whatsappBuilder';

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function CheckoutPage() {
  const { items, subtotal, deliveryCharges, discounts, totalAmount, storeSettings, clearCart } = useCart();
  const navigate = useNavigate();
  const codEnabled = storeSettings?.codEnabled !== false;
  const onlineEnabled = storeSettings?.onlinePaymentEnabled !== false;
  const codFee = Number(storeSettings?.codHandlingFee || 0);

  const [paymentMethod, setPaymentMethod] = useState(onlineEnabled ? 'ONLINE' : codEnabled ? 'COD' : 'WHATSAPP');
  const [form, setForm] = useState({ customerName: '', customerMobile: '', deliveryAddress: '', city: '', state: '', pinCode: '', orderNotes: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const appliedCodFee = paymentMethod === 'COD' ? codFee : 0;
  const finalPayable = Number(totalAmount) + appliedCodFee;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const { data: order } = await axiosClient.post('/orders', {
        ...form,
        paymentMethod,
        items: items.map((i) => ({
          productId: i.productId,
          packId: i.packId || null,
          selectedColor: i.selectedColor || null,
          mixedColors: i.mixedColors || [],
          selectedSize: i.selectedSize || null,
          quantity: i.quantity,
        })),
      });

      if (paymentMethod === 'ONLINE') {
        const sdkLoaded = await loadRazorpayScript();
        if (!sdkLoaded) {
          throw new Error('Unable to load Razorpay payment checkout. Please check your internet connection or use Cash on Delivery.');
        }

        const { data: rzp } = await axiosClient.post(`/orders/${encodeURIComponent(order.orderReference)}/payment/razorpay/initiate`);

        const options = {
          key: rzp.keyId,
          amount: rzp.amount,
          currency: rzp.currency,
          name: 'NUVAYA Modest Luxury',
          description: `Order ${order.orderReference}`,
          order_id: rzp.razorpayOrderId,
          prefill: {
            name: order.customerName,
            contact: order.customerMobile,
          },
          theme: { color: '#231019' },
          handler: async (response) => {
            try {
              await axiosClient.post(`/orders/${encodeURIComponent(order.orderReference)}/payment/razorpay/verify`, {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              });
              clearCart();
              navigate(`/order-submitted?ref=${order.orderReference}&method=ONLINE&paid=1`);
            } catch (verifyErr) {
              setError(verifyErr.response?.data?.message || 'Payment verification failed. Contact support with Order ID ' + order.orderReference);
            }
          },
          modal: {
            ondismiss: () => {
              setSubmitting(false);
              setError(`Payment window closed. Your Order ID ${order.orderReference} is saved—click Pay Now to retry or switch to COD.`);
            },
          },
        };

        const rzpInstance = new window.Razorpay(options);
        rzpInstance.open();
        return;
      }

      if (paymentMethod === 'WHATSAPP') {
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
      }

      clearCart();
      navigate(`/order-submitted?ref=${order.orderReference}&method=${paymentMethod}`);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Please check all required delivery fields.');
    } finally {
      setSubmitting(false);
    }
  };

  if (items.length === 0) return <div style={{ padding: 60, textAlign: 'center' }}>Your cart is empty.</div>;

  return (
    <div style={{ maxWidth: 1100, margin: '40px auto', padding: '0 20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(330px, 1fr))', gap: 36 }}>
      <form onSubmit={handleSubmit} style={{ background: '#fff', padding: 28, borderRadius: 16, border: '1px solid var(--border-sand)' }}>
        <h1 style={{ fontSize: '2rem', color: 'var(--brand-plum)', marginBottom: 16 }}>Checkout &amp; Delivery</h1>
        {error && <div style={{ background: '#FDECEA', color: '#9E2A2B', padding: 12, borderRadius: 8, marginBottom: 14, fontSize: '0.88rem' }}>{error}</div>}

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

        {/* Payment Method Selector */}
        <div style={{ marginTop: 22 }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 800, letterSpacing: '0.14em', color: 'var(--brand-gold-dark)', textTransform: 'uppercase', marginBottom: 10 }}>
            Select Payment Method
          </div>
          <div style={{ display: 'grid', gap: 10 }}>
            {onlineEnabled && (
              <label
                onClick={() => setPaymentMethod('ONLINE')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '13px 16px',
                  borderRadius: 12,
                  border: paymentMethod === 'ONLINE' ? '2px solid var(--brand-plum)' : '1px solid var(--border-sand)',
                  background: paymentMethod === 'ONLINE' ? 'var(--bg-cream)' : '#fff',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <input type="radio" name="paymentMethod" checked={paymentMethod === 'ONLINE'} onChange={() => setPaymentMethod('ONLINE')} />
                  <CreditCard size={20} color="var(--brand-plum)" />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.94rem', color: 'var(--brand-plum)' }}>Pay Online (UPI, Cards, NetBanking)</div>
                    <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>Instant confirmation via GPay, PhonePe, Paytm, Visa/Mastercard</div>
                  </div>
                </div>
                <span style={{ fontSize: '0.68rem', fontWeight: 800, padding: '3px 8px', borderRadius: 999, background: '#E6F4EA', color: '#1E6F50' }}>INSTANT</span>
              </label>
            )}

            {codEnabled && (
              <label
                onClick={() => setPaymentMethod('COD')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '13px 16px',
                  borderRadius: 12,
                  border: paymentMethod === 'COD' ? '2px solid var(--brand-plum)' : '1px solid var(--border-sand)',
                  background: paymentMethod === 'COD' ? 'var(--bg-cream)' : '#fff',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <input type="radio" name="paymentMethod" checked={paymentMethod === 'COD'} onChange={() => setPaymentMethod('COD')} />
                  <Banknote size={20} color="var(--brand-plum)" />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.94rem', color: 'var(--brand-plum)' }}>Cash on Delivery (COD)</div>
                    <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                      {codFee > 0 ? `Pay in cash upon delivery (+₹${codFee} COD handling fee)` : 'Pay in cash when your parcel arrives at your doorstep'}
                    </div>
                  </div>
                </div>
              </label>
            )}

            <label
              onClick={() => setPaymentMethod('WHATSAPP')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '13px 16px',
                borderRadius: 12,
                border: paymentMethod === 'WHATSAPP' ? '2px solid #1E6F50' : '1px solid var(--border-sand)',
                background: paymentMethod === 'WHATSAPP' ? '#F3FAF6' : '#fff',
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <input type="radio" name="paymentMethod" checked={paymentMethod === 'WHATSAPP'} onChange={() => setPaymentMethod('WHATSAPP')} />
                <MessageCircle size={20} color="#1E6F50" />
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.94rem', color: '#1E6F50' }}>Order via WhatsApp Concierge</div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>Chat directly with our team to confirm &amp; pay</div>
                </div>
              </div>
            </label>
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          style={{
            width: '100%',
            marginTop: 20,
            padding: 15,
            background: paymentMethod === 'WHATSAPP' ? '#1E6F50' : 'var(--brand-plum)',
            color: '#FAF6EE',
            border: '1px solid var(--brand-gold)',
            borderRadius: 12,
            fontWeight: 700,
            fontSize: '0.96rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            cursor: 'pointer'
          }}
        >
          {submitting
            ? 'Processing Order...'
            : paymentMethod === 'ONLINE'
              ? `Pay ₹${finalPayable.toLocaleString('en-IN')} Securely Now`
              : paymentMethod === 'COD'
                ? `Place COD Order (₹${finalPayable.toLocaleString('en-IN')})`
                : 'Send Order on WhatsApp'}
        </button>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 12, fontSize: '0.76rem', color: 'var(--text-muted)' }}>
          <ShieldCheck size={15} color="#1E6F50" /> 256-bit SSL Encrypted Checkout • Trackable Pan-India Shipping
        </div>
      </form>

      <div style={{ background: 'var(--bg-cream)', padding: 28, borderRadius: 16, border: '1px solid var(--border-sand)', alignSelf: 'start' }}>
        <h2 style={{ fontSize: '1.6rem', color: 'var(--brand-plum)', marginBottom: 16 }}>Order Summary</h2>
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
          {appliedCodFee > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>COD Handling Fee</span><span>₹{appliedCodFee}</span></div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#1E6F50' }}><span>Discounts</span><span>-₹{discounts.toLocaleString('en-IN')}</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1.18rem', color: 'var(--brand-plum)', paddingTop: 8 }}>
            <span>Total Payable</span><span>₹{finalPayable.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

const inp = { width: '100%', padding: '11px 14px', borderRadius: 8, border: '1px solid var(--border-sand)', fontFamily: 'inherit' };
