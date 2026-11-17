import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Instagram, Facebook, MapPin, Phone, Mail, MessageCircle, X } from 'lucide-react';
import { useCart } from '../../context/CartContext';

const LEGAL_DOCS = {
  terms: {
    title: 'Terms & Conditions',
    sections: [
      {
        heading: '1. Order Submission & Confirmation',
        body: 'Placing an order through NuVaya generates a unique Order Reference ID and initiates a WhatsApp concierge session. Submission of an order request does not constitute automatic payment confirmation; an order is confirmed once verified by the NuVaya team.',
      },
      {
        heading: '2. Product Colors & Fabrics',
        body: 'We photograph every hijab, abaya, and accessory under natural lighting. Minor variations in shade may occur due to device screen calibration.',
      },
      {
        heading: '3. Pricing & Bundles',
        body: 'All prices are listed in Indian Rupees (INR). Pack of 3 and Pack of 5 bundle discounts apply automatically to eligible multi-piece selections.',
      },
    ],
  },
  shipping: {
    title: 'Shipping & Exchange Policy',
    sections: [
      {
        heading: '1. Pan-India Dispatch',
        body: 'Orders are dispatched from our studio in Narsingi, Hyderabad within 24–48 business hours. Standard delivery takes 3–6 business days across India.',
      },
      {
        heading: '2. Hygiene & Exchange Eligibility',
        body: 'Due to hygiene standards for modest wear and hijabs, exchanges are accepted within 48 hours of delivery only for unused, unwashed items with original tags intact or in case of transit damage (unboxing video required).',
      },
    ],
  },
  privacy: {
    title: 'Privacy Policy',
    sections: [
      {
        heading: '1. Customer Information',
        body: 'NuVaya collects your name, mobile number, and delivery address solely to process, ship, and support your orders via WhatsApp and courier partners.',
      },
      {
        heading: '2. Data Protection',
        body: 'We never sell, rent, or share your personal contact information with third-party marketers.',
      },
    ],
  },
};

export default function Footer() {
  const { storeSettings } = useCart();
  const [activeDoc, setActiveDoc] = useState(null);

  const whatsapp = (storeSettings?.whatsappNumber || '918863090935').replace(/[^0-9]/g, '');
  const phone = storeSettings?.storePhone || '+91 7256083315';
  const email = storeSettings?.storeEmail || 'modest.fashion@nuvaya.co.in';
  const address = storeSettings?.storeAddress || 'Narsingi, Hyderabad, Telangana 500075, India';
  const instagramUrl = storeSettings?.instagramUrl || 'https://www.instagram.com/nuvaya.co.in/';
  const facebookUrl = storeSettings?.facebookUrl || 'https://www.facebook.com/profile.php?id=61596514134329';

  return (
    <>
      <footer style={{ background: 'linear-gradient(180deg, #2C141F 0%, #1D0C14 100%)', color: '#E8DEC8', borderTop: '2px solid var(--brand-gold)', marginTop: 72 }}>
        <div style={{ maxWidth: 1220, margin: '0 auto', padding: '56px 20px 40px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 36 }}>
          {/* Brand Column */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <img
                src="/nuvaya-logo.png"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                alt="NuVaya"
                style={{ width: 46, height: 46, borderRadius: '50%', objectFit: 'cover', border: '1.5px solid var(--brand-gold)' }}
              />
              <div>
                <div className="editorial" style={{ fontSize: '1.8rem', letterSpacing: '0.12em', color: '#FAF6EE', lineHeight: 1 }}>NuVaya</div>
                <div style={{ fontSize: '0.62rem', letterSpacing: '0.2em', color: 'var(--brand-gold)', fontWeight: 700 }}>MODEST LUXURY</div>
              </div>
            </div>
            <p style={{ fontSize: '0.88rem', color: '#CFC2B0', lineHeight: 1.7, marginBottom: 18 }}>
              Thoughtfully crafted hijabs, Korean Nidha abayas, and everyday modest essentials designed in Hyderabad for effortless grace.
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <a href={instagramUrl} target="_blank" rel="noreferrer" aria-label="NuVaya Instagram" style={socialBtn}>
                <Instagram size={18} />
              </a>
              <a href={facebookUrl} target="_blank" rel="noreferrer" aria-label="NuVaya Facebook" style={socialBtn}>
                <Facebook size={18} />
              </a>
              <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noreferrer" aria-label="NuVaya WhatsApp" style={socialBtn}>
                <MessageCircle size={18} />
              </a>
            </div>
          </div>

          {/* Collections Column */}
          <div>
            <h4 style={colHeading}>Collections</h4>
            <div style={linkList}>
              <Link to="/shop?category=hijabs">All Hijabs</Link>
              <Link to="/shop?category=jersey-hijabs">Modal Jersey Hijabs</Link>
              <Link to="/shop?category=chiffon-hijabs">Matte Chiffon Hijabs</Link>
              <Link to="/shop?category=premium-abayas">Premium Abayas</Link>
              <Link to="/shop?category=best-sellers">Pack of 3 & 5 Bundles</Link>
            </div>
          </div>

          {/* Policies & Terms Column */}
          <div>
            <h4 style={colHeading}>Policies & Legal</h4>
            <div style={linkList}>
              <button type="button" onClick={() => setActiveDoc(LEGAL_DOCS.terms)} style={textBtn}>
                Terms & Conditions
              </button>
              <button type="button" onClick={() => setActiveDoc(LEGAL_DOCS.shipping)} style={textBtn}>
                Shipping & Exchange Policy
              </button>
              <button type="button" onClick={() => setActiveDoc(LEGAL_DOCS.privacy)} style={textBtn}>
                Privacy Policy
              </button>
              <Link to="/admin/login" style={{ color: 'var(--brand-gold)', fontSize: '0.84rem', marginTop: 4 }}>
                Admin Portal
              </Link>
            </div>
          </div>

          {/* Address & Contact Column */}
          <div>
            <h4 style={colHeading}>Contact & Studio</h4>
            <div style={{ display: 'grid', gap: 12, fontSize: '0.88rem', color: '#CFC2B0' }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <MapPin size={17} color="var(--brand-gold)" style={{ flexShrink: 0, marginTop: 3 }} />
                <span>{address}</span>
              </div>
              <a href={`tel:${phone.replace(/\s+/g, '')}`} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <Phone size={16} color="var(--brand-gold)" />
                <span>{phone}</span>
              </a>
              <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noreferrer" style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <MessageCircle size={16} color="var(--brand-gold)" />
                <span>WhatsApp Concierge (+{whatsapp})</span>
              </a>
              <a href={`mailto:${email}`} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <Mail size={16} color="var(--brand-gold)" />
                <span>{email}</span>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Copyright Bar */}
        <div style={{ borderTop: '1px solid rgba(197,160,101,0.25)', padding: '18px 20px', textAlign: 'center', fontSize: '0.8rem', color: '#B5A695' }}>
          © {new Date().getFullYear()} NuVaya Modest Fashion (nuvaya.co.in). All Rights Reserved • Thank you for shopping with us.
        </div>
      </footer>

      {/* Legal / Terms Modal */}
      {activeDoc && (
        <div onClick={() => setActiveDoc(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(22,12,18,0.65)', zIndex: 80, display: 'grid', placeItems: 'center', padding: 20 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ maxWidth: 580, width: '100%', background: 'var(--bg-ivory)', borderRadius: 16, border: '1.5px solid var(--brand-gold)', padding: 28, boxShadow: '0 20px 50px rgba(0,0,0,0.35)', maxHeight: '82vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 14, borderBottom: '1px solid var(--border-sand)', marginBottom: 18 }}>
              <h3 style={{ fontSize: '1.7rem', color: 'var(--brand-plum)' }}>{activeDoc.title}</h3>
              <button onClick={() => setActiveDoc(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--brand-plum)' }}>
                <X size={22} />
              </button>
            </div>
            <div style={{ display: 'grid', gap: 16 }}>
              {activeDoc.sections.map((sec) => (
                <div key={sec.heading}>
                  <div style={{ fontWeight: 700, color: 'var(--brand-plum)', marginBottom: 4, fontSize: '0.95rem' }}>{sec.heading}</div>
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.65 }}>{sec.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const colHeading = {
  fontFamily: 'var(--font-editorial)',
  fontSize: '1.35rem',
  color: 'var(--brand-gold)',
  marginBottom: 14,
  letterSpacing: '0.04em',
};

const linkList = {
  display: 'grid',
  gap: 10,
  fontSize: '0.88rem',
  color: '#CFC2B0',
};

const textBtn = {
  background: 'none',
  border: 'none',
  color: '#CFC2B0',
  textAlign: 'left',
  fontSize: '0.88rem',
  fontFamily: 'inherit',
  cursor: 'pointer',
  padding: 0,
};

const socialBtn = {
  width: 38,
  height: 38,
  borderRadius: '50%',
  border: '1px solid var(--brand-gold)',
  background: 'rgba(197,160,101,0.12)',
  color: 'var(--brand-gold)',
  display: 'grid',
  placeItems: 'center',
};
