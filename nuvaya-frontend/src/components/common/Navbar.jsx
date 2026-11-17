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
    <header style={{ position: 'sticky', top: 0, zIndex: 40, background: 'var(--bg-ivory)', borderBottom: '1px solid var(--brand-gold)', width: '100%' }}>
      {storeSettings?.announcementText && (
        <div style={{ background: 'var(--brand-plum)', color: '#F7F0E2', textAlign: 'center', fontSize: '0.76rem', padding: '7px 12px', letterSpacing: '0.03em', borderBottom: '1px solid rgba(197,160,101,0.35)' }}>
          {storeSettings.announcementText}
        </div>
      )}
      <div style={{ maxWidth: 1240, margin: '0 auto', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <button className="nav-mobile-btn" onClick={() => setMobileMenu(!mobileMenu)} aria-label="Toggle Menu">
          {mobileMenu ? <X size={24} /> : <Menu size={24} />}
        </button>

        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {!logoError && (
            <img
              src="/nuvaya-logo.png"
              alt="NuVaya Logo"
              onError={() => setLogoError(true)}
              style={{ width: 42, height: 42, objectFit: 'cover', borderRadius: '50%', border: '2px solid var(--brand-gold)' }}
            />
          )}
          <div>
            <div className="editorial" style={{ fontSize: '1.75rem', letterSpacing: '0.1em', color: 'var(--brand-plum)', lineHeight: 1 }}>
              NuVaya
            </div>
            <div style={{ fontSize: '0.58rem', letterSpacing: '0.2em', color: 'var(--brand-gold-dark)', fontWeight: 700, textTransform: 'uppercase' }}>
              Modest Luxury
            </div>
          </div>
        </Link>

        <nav className="nav-desktop-links">
          <Link to="/shop?category=hijabs">Hijabs</Link>
          <Link to="/shop?category=abayas">Abayas</Link>
          <Link to="/shop?category=new-arrivals">New Arrivals</Link>
          <Link to="/shop?category=best-sellers">Best Sellers</Link>
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <form onSubmit={handleSearch} className="nav-desktop-search">
            <Search size={15} color="var(--brand-plum)" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search hijabs, abayas..."
              style={{ border: 'none', background: 'transparent', outline: 'none', paddingLeft: 8, fontSize: '0.85rem', width: 145 }}
            />
          </form>
          <Link to="/admin/login" title="Admin Portal" style={{ color: 'var(--brand-plum)', display: 'inline-flex', padding: 4 }}><User size={20} /></Link>
          <button onClick={() => setDrawerOpen(true)} style={{ position: 'relative', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--brand-plum)', display: 'inline-flex', padding: 4 }}>
            <ShoppingBag size={21} />
            {totalCount > 0 && (
              <span style={{ position: 'absolute', top: -2, right: -4, background: 'var(--brand-plum)', color: '#FAF6EE', border: '1px solid var(--brand-gold)', borderRadius: '50%', fontSize: '0.68rem', width: 18, height: 18, display: 'grid', placeItems: 'center', fontWeight: 700 }}>
                {totalCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {mobileMenu && (
        <div style={{ background: 'var(--bg-cream)', padding: '16px 20px 22px', borderTop: '1px solid var(--border-sand)', display: 'grid', gap: 14, color: 'var(--brand-plum)', fontWeight: 600 }}>
          <form onSubmit={handleSearch} style={{ display: 'flex', alignItems: 'center', background: '#fff', padding: '9px 14px', borderRadius: 10, border: '1px solid var(--brand-gold)' }}>
            <Search size={16} color="var(--brand-plum)" />
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
          <Link to="/shop?category=best-sellers" onClick={() => setMobileMenu(false)}>Best Sellers (Pack of 3 & 5)</Link>
        </div>
      )}
    </header>
  );
}
