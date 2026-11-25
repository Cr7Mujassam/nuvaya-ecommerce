import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Banknote, MessageCircle, ShieldCheck } from 'lucide-react';
import axiosClient from '../../api/axiosClient';
import { useCart } from '../../context/CartContext';
import { buildWhatsAppCheckoutUrl } from '../../utils/whatsappBuilder';
import { trackMetaInitiateCheckout, trackMetaPurchase } from '../../utils/metaPixel';

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

const INDIAN_STATES = [
  "Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam",
  "Bihar", "Chandigarh", "Chhattisgarh", "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jammu and Kashmir",
  "Jharkhand", "Karnataka", "Kerala", "Ladakh", "Lakshadweep", "Madhya Pradesh",
  "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha",
  "Puducherry", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana",
  "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal"
];

export default function CheckoutPage() {
  const { items, subtotal, deliveryCharges, discounts, totalAmount, storeSettings, clearCart } = useCart();
  const navigate = useNavigate();

  const onlineEnabled = storeSettings?.onlinePaymentEnabled !== false;
  const codEnabled = storeSettings?.codEnabled !== false;
  const codFee = Number(storeSettings?.codHandlingFee || 0);

  const [deliveryType, setDeliveryType] = useState('STANDARD');
  const [paymentMethod, setPaymentMethod] = useState(onlineEnabled ? 'ONLINE' : codEnabled ? 'COD' : 'WHATSAPP');
  const [form, setForm] = useState({
    customerName: '',
    customerMobile: '',
    customerEmail: '',
    deliveryAddress: '',
    city: '',
    state: '',
    pinCode: '',
    orderNotes: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fastDeliveryFee = deliveryType === 'EXPRESS' ? 40 : 0;
  const effectiveDeliveryCharges = Number(deliveryCharges || 0) + fastDeliveryFee;
  const baseOrderTotal = Math.max(0, Number(subtotal || 0) - Number(discounts || 0)) + effectiveDeliveryCharges;
  const codEligible = codEnabled && baseOrderTotal < 300;
  const codNominalFee = (paymentMethod === 'COD' && codEligible) ? 35 : 0;
  const appliedCodFee = (paymentMethod === 'COD' && codEligible) ? (codFee + codNominalFee) : 0;
  const finalPayable = baseOrderTotal + appliedCodFee;

  useEffect(() => {
    if (paymentMethod === 'COD' && !codEligible) {
      setPaymentMethod(onlineEnabled ? 'ONLINE' : 'WHATSAPP');
    }
  }, [paymentMethod, codEligible, onlineEnabled]);
  const initiatedRef = useRef(false);

  useEffect(() => {
    if (items.length > 0 && !initiatedRef.current) {
      initiatedRef.current = true;
      trackMetaInitiateCheckout({
        value: finalPayable,
        contentIds: items.map((i) => i.productId),
        numItems: items.reduce((s, i) => s + i.quantity, 0),
      });
    }
  }, [items, finalPayable]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const { data: order } = await axiosClient.post('/orders', {
        ...form,
        deliveryType,
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
          throw new Error('Unable to load Razorpay payment checkout. Please check your connection or select Cash on Delivery.');
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
            ...(order.customerEmail ? { email: order.customerEmail } : {}),
          },
          theme: { color: '#231019' },
          handler: async (response) => {
            try {
              await axiosClient.post(`/orders/${encodeURIComponent(order.orderReference)}/payment/razorpay/verify`, {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              });
              trackMetaPurchase({
                value: Number(order.finalAmount ?? finalPayable),
                contentIds: (order.items || items).map((i) => i.productSku || i.productId),
                numItems: (order.items || items).reduce((s, i) => s + i.quantity, 0),
                orderId: order.orderReference,
              });
              clearCart();
              navigate(`/order-submitted?ref=${order.orderReference}&method=ONLINE&paid=1`);
            } catch (verifyErr) {
              setError(verifyErr.response?.data?.message || `Payment verification failed. Contact support with Order ID ${order.orderReference}`);
            }
          },
          modal: {
            ondismiss: () => {
              setSubmitting(false);
              setError(`Payment popup closed. Your Order ID ${order.orderReference} is saved—click Pay Now to retry or switch to Cash on Delivery.`);
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

      if (paymentMethod === 'COD') {
        trackMetaPurchase({
          value: Number(order.finalAmount ?? finalPayable),
          contentIds: (order.items || items).map((i) => i.productSku || i.productId),
          numItems: (order.items || items).reduce((s, i) => s + i.quantity, 0),
          orderId: order.orderReference,
        });
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
      <div style={{
        background: 'linear-gradient(135deg, #FFFDF9 0%, #F7EFE2 100%)',
        border: '1.5px solid var(--brand-gold)',
        borderRadius: 14,
        padding: '14px 18px',
        marginBottom: 18,
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12
      }}>
        <ShieldCheck size={22} color="#1E6F50" style={{ flexShrink: 0, marginTop: 2 }} />
        <div style={{ fontSize: '0.85rem', lineHeight: 1.55, color: 'var(--text-charcoal)' }}>
          <strong style={{ color: 'var(--brand-plum)' }}>New to NuVaya? Give us one chance to earn your trust.</strong> We’ve just started our Hyderabad modest-wear label, so every single order is hand-checked before dispatch, shipped with live tracking, and backed by direct WhatsApp support from our founders.
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ background: '#fff', padding: 28, borderRadius: 16, border: '1px solid var(--border-sand)' }}>
        <h1 style={{ fontSize: '2rem', color: 'var(--brand-plum)', marginBottom: 16 }}>Checkout &amp; Delivery</h1>
        {error && <div style={{ background: '#FDECEA', color: '#9E2A2B', padding: 12, borderRadius: 8, marginBottom: 14, fontSize: '0.88rem' }}>{error}</div>}

        <div style={{ display: 'grid', gap: 12 }}>
          <input required placeholder="Full Name *" value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} style={inp} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 10 }}>
            <input required placeholder="Mobile Number *" value={form.customerMobile} onChange={(e) => setForm({ ...form, customerMobile: e.target.value })} style={inp} />
            <input required type="email" placeholder="Email Address (for order updates) *" value={form.customerEmail} onChange={(e) => setForm({ ...form, customerEmail: e.target.value })} style={inp} />
          </div>
          <textarea required rows={3} placeholder="Full Delivery Address *" value={form.deliveryAddress} onChange={(e) => setForm({ ...form, deliveryAddress: e.target.value })} style={inp} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <input required placeholder="City *" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} style={inp} />
            <select required value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} style={{ ...inp, background: "#fff", color: form.state ? "inherit" : "#6b7280" }}>
              <option value="" disabled>Select State / UT *</option>
              {INDIAN_STATES.map((st) => (
                <option key={st} value={st} style={{ color: "#111" }}>{st}</option>
              ))}
            </select>
          </div>
          <input required maxLength={6} placeholder="6-Digit PIN Code *" value={form.pinCode} onChange={(e) => setForm({ ...form, pinCode: e.target.value })} style={inp} />
          <textarea rows={2} placeholder="Optional Order Notes" value={form.orderNotes} onChange={(e) => setForm({ ...form, orderNotes: e.target.value })} style={inp} />
        </div>

        <div style={{ marginTop: 20 }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 800, letterSpacing: '0.14em', color: 'var(--brand-gold-dark)', textTransform: 'uppercase', marginBottom: 10 }}>
            Delivery Option
          </div>
          {!codEligible && codEnabled && (
            <div style={{ fontSize: '0.78rem', color: 'var(--brand-plum)', background: 'var(--bg-cream)', border: '1px solid var(--border-sand)', padding: '8px 12px', borderRadius: 8, marginBottom: 8 }}>
              Cash on Delivery is available only for orders below ₹300. Please complete orders of ₹300 or above via Online Payment (Razorpay) or WhatsApp.
            </div>
          )}
          <div style={{ display: 'grid', gap: 10 }}>
            <div
              onClick={() => setDeliveryType('STANDARD')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                borderRadius: 12,
                border: deliveryType === 'STANDARD' ? '2px solid var(--brand-plum)' : '1px solid var(--border-sand)',
                background: deliveryType === 'STANDARD' ? 'var(--bg-cream)' : '#fff',
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input type="radio" name="deliveryType" checked={deliveryType === 'STANDARD'} onChange={() => setDeliveryType('STANDARD')} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--brand-plum)' }}>Standard Delivery</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Regular pan-India courier dispatch</div>
                </div>
              </div>
              <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--brand-plum)' }}>
                {Number(deliveryCharges || 0) === 0 ? 'FREE' : `₹${Number(deliveryCharges || 0)}`}
              </span>
            </div>

            <div
              onClick={() => setDeliveryType('EXPRESS')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                borderRadius: 12,
                border: deliveryType === 'EXPRESS' ? '2px solid var(--brand-plum)' : '1px solid var(--border-sand)',
                background: deliveryType === 'EXPRESS' ? 'var(--bg-cream)' : '#fff',
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input type="radio" name="deliveryType" checked={deliveryType === 'EXPRESS'} onChange={() => setDeliveryType('EXPRESS')} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--brand-plum)' }}>Fast Delivery (+₹40)</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Priority dispatch (+₹40 added to standard delivery)</div>
                </div>
              </div>
              <span style={{ fontWeight: 800, fontSize: '0.85rem', color: '#1E6F50' }}>
                +₹40
              </span>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 22 }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 800, letterSpacing: '0.14em', color: 'var(--brand-gold-dark)', textTransform: 'uppercase', marginBottom: 10 }}>
            Choose Payment Option
          </div>
          <div style={{ display: 'grid', gap: 10 }}>
            {onlineEnabled && (
              <div
                onClick={() => setPaymentMethod('ONLINE')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 16px',
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
                    <div style={{ fontWeight: 700, fontSize: '0.94rem', color: 'var(--brand-plum)' }}>Pay Online (Razorpay — UPI / Cards / NetBanking)</div>
                    <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>Instant confirmation via GPay, PhonePe, Paytm, Visa/Mastercard</div>
                  </div>
                </div>
                <span style={{ fontSize: '0.68rem', fontWeight: 800, padding: '3px 8px', borderRadius: 999, background: '#E6F4EA', color: '#1E6F50' }}>INSTANT</span>
              </div>
            )}

            {codEligible && (
              <div
                onClick={() => setPaymentMethod('COD')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 16px',
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
                      `Pay in cash on delivery (+₹${35 + codFee} nominal COD fee over delivery charges)`
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div
              onClick={() => setPaymentMethod('WHATSAPP')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 16px',
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
                  <div style={{ fontWeight: 700, fontSize: '0.94rem', color: '#1E6F50' }}>Pay &amp; Confirm via WhatsApp</div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>Checkout directly to WhatsApp to pay via UPI / chat with our team</div>
                </div>
              </div>
            </div>
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
              ? `Pay ₹${finalPayable.toLocaleString('en-IN')} with Razorpay`
              : paymentMethod === 'COD'
                ? `Place Cash on Delivery Order (₹${finalPayable.toLocaleString('en-IN')})`
                : 'Checkout to WhatsApp'}
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
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Delivery Charges{deliveryType === 'EXPRESS' ? ' (Fast +₹40)' : ''}</span><span>{effectiveDeliveryCharges === 0 ? 'FREE' : `₹${effectiveDeliveryCharges}`}</span></div>
          {appliedCodFee > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>COD Nominal Charge</span><span>₹{appliedCodFee}</span></div>
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
