import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Search, User, Menu, X } from 'lucide-react';
import { useCart } from '../../context/CartContext';

export default function Navbar() {
  const { items, storeSettings, setDrawerOpen } = useCart();
  const [search, setSearch] = useState('');
  const [mobileMenu, setMobileMenu] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const navigate = useNavigate();

  const totalCount = items.reduce((sum, i) => sum + i.quantity, 0);

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(`/shop?search=${encodeURIComponent(search)}`);
    setMobileMenu(false);
  };

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 40,
      background: 'rgba(251, 248, 243, 0.88)',
      backdropFilter: 'blur(14px)',
      WebkitBackdropFilter: 'blur(14px)',
      borderBottom: '1px solid rgba(198, 161, 99, 0.35)',
      width: '100%'
    }}>
      {storeSettings?.announcementText && (
        <div style={{
          background: 'linear-gradient(90deg, #1E0C15 0%, #2F1422 50%, #1E0C15 100%)',
          color: '#F5ECDC',
          textAlign: 'center',
          fontSize: '0.72rem',
          fontWeight: 500,
          padding: '8px 12px',
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          borderBottom: '1px solid rgba(198,161,99,0.35)'
        }}>
          {storeSettings.announcementText}
        </div>
      )}
      <div style={{ maxWidth: 1260, margin: '0 auto', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <button className="nav-mobile-btn" onClick={() => setMobileMenu(!mobileMenu)} aria-label="Toggle Menu">
          {mobileMenu ? <X size={24} /> : <Menu size={24} />}
        </button>

        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {!logoError && (
            <img
              src="/nuvaya-logo.png"
              alt="NuVaya Logo"
              onError={() => setLogoError(true)}
              style={{ width: 42, height: 42, objectFit: 'cover', borderRadius: '50%', border: '1.5px solid var(--brand-gold)', boxShadow: '0 4px 12px rgba(39,16,27,0.12)' }}
            />
          )}
          <div>
            <div className="crest-font" style={{ fontSize: '1.45rem', fontWeight: 600, letterSpacing: '0.2em', color: 'var(--brand-plum)', lineHeight: 1.05 }}>
              NUVAYA
            </div>
            <div style={{ fontSize: '0.56rem', letterSpacing: '0.28em', color: 'var(--brand-gold-dark)', fontWeight: 700, textTransform: 'uppercase', marginTop: 2 }}>
              Modest Luxury
            </div>
          </div>
        </Link>

        <nav className="nav-desktop-links">
          <Link to="/shop">All Collections</Link>
          <Link to="/shop?category=hijabs">Hijabs</Link>
          <Link to="/shop?category=abayas">Abayas</Link>
          <Link to="/shop?category=new-arrivals">New Arrivals</Link>
          <Link to="/shop?category=best-sellers">Bundles</Link>
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <form onSubmit={handleSearch} className="nav-desktop-search">
            <Search size={14} color="var(--brand-gold-dark)" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search collection..."
              style={{ border: 'none', background: 'transparent', outline: 'none', paddingLeft: 8, fontSize: '0.82rem', color: 'var(--brand-plum)', width: 145 }}
            />
          </form>
          <Link to="/admin/login" title="Admin Atelier" style={{ color: 'var(--brand-plum)', display: 'inline-flex', padding: 6, borderRadius: '50%', transition: 'background 0.2s' }}>
            <User size={19} strokeWidth={1.8} />
          </Link>
          <button onClick={() => setDrawerOpen(true)} aria-label="Shopping Bag" style={{ position: 'relative', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--brand-plum)', display: 'inline-flex', padding: 6 }}>
            <ShoppingBag size={20} strokeWidth={1.8} />
            {totalCount > 0 && (
              <span style={{
                position: 'absolute',
                top: 0,
                right: -2,
                background: 'var(--brand-plum)',
                color: '#FBF8F3',
                border: '1px solid var(--brand-gold)',
                borderRadius: '50%',
                fontSize: '0.65rem',
                width: 18,
                height: 18,
                display: 'grid',
                placeItems: 'center',
                fontWeight: 700
              }}>
                {totalCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {mobileMenu && (
        <div style={{ background: 'var(--bg-ivory)', padding: '18px 22px 26px', borderTop: '1px solid var(--border-sand)', display: 'grid', gap: 15, color: 'var(--brand-plum)', fontWeight: 600, fontSize: '0.88rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          <form onSubmit={handleSearch} style={{ display: 'flex', alignItems: 'center', background: '#fff', padding: '10px 14px', borderRadius: 999, border: '1px solid var(--brand-gold)' }}>
            <Search size={16} color="var(--brand-gold-dark)" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search hijabs, abayas..."
              style={{ border: 'none', background: 'transparent', outline: 'none', paddingLeft: 8, fontSize: '0.9rem', width: '100%' }}
            />
          </form>
          <Link to="/shop" onClick={() => setMobileMenu(false)}>All Collections</Link>
          <Link to="/shop?category=hijabs" onClick={() => setMobileMenu(false)}>Hijabs</Link>
          <Link to="/shop?category=abayas" onClick={() => setMobileMenu(false)}>Abayas</Link>
          <Link to="/shop?category=new-arrivals" onClick={() => setMobileMenu(false)}>New Arrivals</Link>
          <Link to="/shop?category=best-sellers" onClick={() => setMobileMenu(false)}>Bundles (Pack of 3 & 5)</Link>
        </div>
      )}
    </header>
  );
}
