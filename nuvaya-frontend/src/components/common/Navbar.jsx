import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Search, User, Menu, X, ChevronDown, Heart } from 'lucide-react';
import { useWishlist } from '../../context/WishlistContext';
import { useCart } from '../../context/CartContext';

const HIJAB_FABRICS = [
  { label: 'All Hijabs', to: '/shop?category=hijabs' },
  { label: 'Jersey Hijabs', to: '/shop?category=hijabs&fabric=Jersey' },
  { label: 'Chiffon Hijabs', to: '/shop?category=hijabs&fabric=Chiffon' },
  { label: 'Stamble Hijabs', to: '/shop?category=hijabs&fabric=Stamble' },
];

export default function Navbar() {
  const { items, storeSettings, setDrawerOpen } = useCart();
  const { wishlistCount } = useWishlist();
  const [search, setSearch] = useState('');
  const [mobileMenu, setMobileMenu] = useState(false);
  const [hijabDropdown, setHijabDropdown] = useState(false);
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
      background: 'rgba(251, 248, 243, 0.9)',
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

        {/* Clean Wordmark-Only NUVAYA Logo */}
        <Link to="/" style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start' }}>
          <span className="crest-font" style={{ fontSize: '1.6rem', fontWeight: 600, letterSpacing: '0.24em', color: 'var(--brand-plum)', lineHeight: 1 }}>
            NUVAYA
          </span>
          <span style={{ fontSize: '0.56rem', letterSpacing: '0.32em', color: 'var(--brand-gold-dark)', fontWeight: 700, textTransform: 'uppercase', marginTop: 4 }}>
            Modest Luxury
          </span>
        </Link>

        <nav className="nav-desktop-links" style={{ alignItems: 'center' }}>
          <Link to="/shop">All Collections</Link>

          <div
            style={{ position: 'relative' }}
            onMouseEnter={() => setHijabDropdown(true)}
            onMouseLeave={() => setHijabDropdown(false)}
          >
            <Link
              to="/shop?category=hijabs"
              onClick={() => setHijabDropdown(false)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
            >
              Hijabs <ChevronDown size={13} />
            </Link>

            {hijabDropdown && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                paddingTop: 10,
                minWidth: 205,
                zIndex: 50
              }}>
                <div style={{
                  background: '#FFFFFF',
                  border: '1px solid rgba(198,161,99,0.55)',
                  borderRadius: 12,
                  padding: '8px 0',
                  boxShadow: '0 16px 36px rgba(39,16,27,0.14)',
                  display: 'grid'
                }}>
                  {HIJAB_FABRICS.map((item) => (
                    <Link
                      key={item.label}
                      to={item.to}
                      onClick={() => setHijabDropdown(false)}
                      style={{
                        padding: '9px 16px',
                        fontSize: '0.76rem',
                        letterSpacing: '0.1em',
                        color: 'var(--brand-plum)',
                        display: 'block'
                      }}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

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
          <Link to="/wishlist" title="My Wishlist" aria-label="My Wishlist" style={{ position: 'relative', color: 'var(--brand-plum)', display: 'inline-flex', padding: 6 }}>
            <Heart size={19} strokeWidth={1.8} fill={wishlistCount > 0 ? '#9E2A2B' : 'transparent'} color={wishlistCount > 0 ? '#9E2A2B' : 'var(--brand-plum)'} />
            {wishlistCount > 0 && (
              <span style={{
                position: 'absolute',
                top: 0,
                right: -2,
                background: '#9E2A2B',
                color: '#FBF8F3',
                border: '1px solid var(--brand-gold)',
                borderRadius: '50%',
                fontSize: '0.62rem',
                width: 17,
                height: 17,
                display: 'grid',
                placeItems: 'center',
                fontWeight: 700
              }}>
                {wishlistCount}
              </span>
            )}
          </Link>
          <Link to="/admin/login" title="Admin Atelier" style={{ color: 'var(--brand-plum)', display: 'inline-flex', padding: 6 }}>
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
        <div style={{ background: 'var(--bg-ivory)', padding: '18px 22px 26px', borderTop: '1px solid var(--border-sand)', display: 'grid', gap: 14, color: 'var(--brand-plum)', fontWeight: 600, fontSize: '0.86rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
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
          {HIJAB_FABRICS.map((item) => (
            <Link key={item.label} to={item.to} onClick={() => setMobileMenu(false)} style={{ paddingLeft: item.label === 'All Hijabs' ? 0 : 12, fontSize: item.label === 'All Hijabs' ? '0.86rem' : '0.8rem', color: item.label === 'All Hijabs' ? 'var(--brand-plum)' : 'var(--brand-gold-dark)' }}>
              {item.label}
            </Link>
          ))}
          <Link to="/shop?category=abayas" onClick={() => setMobileMenu(false)}>Abayas</Link>
          <Link to="/shop?category=new-arrivals" onClick={() => setMobileMenu(false)}>New Arrivals</Link>
          <Link to="/shop?category=best-sellers" onClick={() => setMobileMenu(false)}>Bundles (Pack of 3 & 5)</Link>
          <Link to="/wishlist" onClick={() => setMobileMenu(false)}>My Wishlist ({wishlistCount})</Link>
        </div>
      )}
    </header>
  );
}
