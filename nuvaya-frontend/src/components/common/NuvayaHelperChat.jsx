import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { MessageSquare, X, Send, Sparkles } from 'lucide-react';
import { useCart } from '../../context/CartContext';

const QUICK_PROMPTS = [
  'COD rules & ₹35 fee',
  'Fast delivery (+₹40)',
  'Razorpay & payment help',
  'Track my order',
  'Premium vs Everyday Hijab',
];

function getAssistantReply(rawText, storeSettings) {
  const q = (rawText || '').toLowerCase().trim();
  const waNumber = (storeSettings?.whatsappNumber || import.meta.env.VITE_WHATSAPP_FALLBACK || '').replace(/\D/g, '');
  const waHref = waNumber ? `https://wa.me/${waNumber}` : null;

  if (q.includes('cod') || q.includes('cash on delivery') || q.includes('300') || q.includes('35')) {
    return {
      text: 'Cash on Delivery (COD) is available for orders below ₹300 and adds a nominal ₹35 COD fee on top of delivery charges. For orders of ₹300 or above, please complete checkout via Online Payment (Razorpay) or WhatsApp.',
      ctaLabel: 'Go to Checkout',
      ctaTo: '/checkout',
      waHref,
    };
  }

  if (q.includes('fast') || q.includes('express') || q.includes('delivery') || q.includes('shipping') || q.includes('40')) {
    return {
      text: 'At checkout, you can choose Standard Delivery or Fast Delivery (+₹40 added on top of standard delivery charges). Once dispatched, you can follow courier progress on the Track Order page.',
      ctaLabel: 'Track Order',
      ctaTo: '/track-order',
      waHref,
    };
  }

  if (q.includes('razorpay') || q.includes('pay') || q.includes('payment') || q.includes('upi') || q.includes('card') || q.includes('failed') || q.includes('transaction')) {
    return {
      text: 'We support instant Online Payment via Razorpay (UPI, GPay, PhonePe, Paytm, Cards, NetBanking), Cash on Delivery for orders under ₹300 (+₹35 nominal fee), and WhatsApp checkout. If a payment popup closes or fails, your order reference is saved so you can retry payment or switch methods without losing your details.',
      ctaLabel: 'Open Checkout',
      ctaTo: '/checkout',
      waHref,
    };
  }

  if (q.includes('track') || q.includes('status') || q.includes('order id') || q.includes('where is my')) {
    return {
      text: 'You can check live order and courier status anytime on the Track Order page using your Order ID (shown on your order confirmation screen).',
      ctaLabel: 'Track Order Status',
      ctaTo: '/track-order',
      waHref,
    };
  }

  if (q.includes('premium') || q.includes('everyday') || q.includes('hijab') || q.includes('pack') || q.includes('wishlist') || q.includes('feature') || q.includes('shop')) {
    return {
      text: 'NuVaya lets you browse curated collections including Premium Hijab and Everyday Hijab flags, select colors, sizes, and multi-piece packs on product pages, save favorites to your Wishlist, and check out with Standard or Fast Delivery (+₹40).',
      ctaLabel: 'Explore Shop',
      ctaTo: '/shop',
      waHref,
    };
  }

  return {
    text: 'I can help with payments & transactions (Razorpay, COD under ₹300 with +₹35 fee, WhatsApp checkout, order tracking) as well as store features (Standard/Fast Delivery +₹40, Premium & Everyday Hijabs, packs, and Wishlist). What would you like to check?',
    ctaLabel: 'Browse Catalog',
    ctaTo: '/shop',
    waHref,
  };
}

export default function NuvayaHelperChat() {
  const location = useLocation();
  const { storeSettings } = useCart();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'bot',
      text: 'Hi! Need help with a payment/transaction, COD (< ₹300, +₹35 fee), Fast Delivery (+₹40), order tracking, or store features?',
      ctaLabel: 'Track Order',
      ctaTo: '/track-order',
    },
  ]);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  if (location.pathname.startsWith('/admin')) return null;

  const sendPrompt = (text) => {
    const clean = (text || '').trim();
    if (!clean) return;
    const reply = getAssistantReply(clean, storeSettings);
    setMessages((prev) => [
      ...prev,
      { id: `${Date.now()}-u`, role: 'user', text: clean },
      { id: `${Date.now()}-b`, role: 'bot', ...reply },
    ]);
    setInput('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendPrompt(input);
  };

  return (
    <>
      {open && (
        <div
          role="dialog"
          aria-label="NuVaya Helper Assistant"
          style={{
            position: 'fixed',
            bottom: 88,
            right: 20,
            width: 'min(360px, calc(100vw - 32px))',
            maxHeight: 'min(520px, calc(100vh - 120px))',
            background: '#fff',
            borderRadius: 16,
            border: '1.5px solid var(--brand-gold)',
            boxShadow: '0 20px 48px rgba(35, 16, 25, 0.2)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            zIndex: 999,
          }}
        >
          <div
            style={{
              background: 'var(--brand-plum)',
              color: '#FAF6EE',
              padding: '14px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Sparkles size={17} color="var(--brand-gold)" />
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.94rem', lineHeight: 1.2 }}>NuVaya Help Desk</div>
                <div style={{ fontSize: '0.72rem', opacity: 0.85 }}>Transactions, Delivery &amp; Features</div>
              </div>
            </div>
            <button
              type="button"
              aria-label="Close helper chat"
              onClick={() => setOpen(false)}
              style={{ background: 'transparent', border: 'none', color: '#FAF6EE', cursor: 'pointer', padding: 4 }}
            >
              <X size={18} />
            </button>
          </div>

          <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border-sand)', background: 'var(--bg-cream)', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {QUICK_PROMPTS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => sendPrompt(p)}
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  padding: '5px 9px',
                  borderRadius: 999,
                  border: '1px solid var(--border-sand)',
                  background: '#fff',
                  color: 'var(--brand-plum)',
                  cursor: 'pointer',
                }}
              >
                {p}
              </button>
            ))}
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {messages.map((m) => (
              <div
                key={m.id}
                style={{
                  alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '86%',
                  padding: '10px 12px',
                  borderRadius: 12,
                  fontSize: '0.84rem',
                  lineHeight: 1.45,
                  background: m.role === 'user' ? 'var(--brand-plum)' : 'var(--bg-cream)',
                  color: m.role === 'user' ? '#FAF6EE' : 'var(--brand-plum)',
                  border: m.role === 'user' ? 'none' : '1px solid var(--border-sand)',
                }}
              >
                <div>{m.text}</div>
                {m.role === 'bot' && (m.ctaTo || m.waHref) && (
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                    {m.ctaTo && (
                      <Link
                        to={m.ctaTo}
                        onClick={() => setOpen(false)}
                        style={{
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          padding: '5px 10px',
                          borderRadius: 8,
                          background: 'var(--brand-plum)',
                          color: '#FAF6EE',
                          textDecoration: 'none',
                        }}
                      >
                        {m.ctaLabel}
                      </Link>
                    )}
                    {m.waHref && (
                      <a
                        href={m.waHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          padding: '5px 10px',
                          borderRadius: 8,
                          background: '#1E6F50',
                          color: '#fff',
                          textDecoration: 'none',
                        }}
                      >
                        WhatsApp Support
                      </a>
                    )}
                  </div>
                )}
              </div>
            ))}
            <div ref={endRef} />
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', borderTop: '1px solid var(--border-sand)', padding: 8, gap: 6, background: '#fff' }}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about payments, COD, delivery..."
              style={{
                flex: 1,
                border: '1px solid var(--border-sand)',
                borderRadius: 9,
                padding: '8px 11px',
                fontSize: '0.84rem',
                fontFamily: 'inherit',
                outline: 'none',
              }}
            />
            <button
              type="submit"
              aria-label="Send message"
              style={{
                background: 'var(--brand-plum)',
                color: '#FAF6EE',
                border: '1px solid var(--brand-gold)',
                borderRadius: 9,
                padding: '0 12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Send size={15} />
            </button>
          </form>
        </div>
      )}

      <button
        type="button"
        aria-label="Open NuVaya Helper Assistant"
        onClick={() => setOpen((o) => !o)}
        style={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: 'var(--brand-plum)',
          color: '#FAF6EE',
          border: '1.5px solid var(--brand-gold)',
          boxShadow: '0 12px 28px rgba(35, 16, 25, 0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          zIndex: 999,
        }}
      >
        {open ? <X size={22} /> : <MessageSquare size={22} />}
      </button>
    </>
  );
}
