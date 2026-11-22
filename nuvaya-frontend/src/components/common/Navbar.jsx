import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Search, User, Menu, X, ChevronDown, Heart } from 'lucide-react';
import { useWishlist } from '../../context/WishlistContext';
import { useCart } from '../../context/CartContext';
import axiosClient from '../../api/axiosClient';

export default function Navbar() {
  const { items, storeSettings, setDrawerOpen } = useCart();
  const { wishlistCount } = useWishlist();
  const [search, setSearch] = useState('');
  const [mobileMenu, setMobileMenu] = useState(false);
  const [openDropdownSlug, setOpenDropdownSlug] = useState(null);
  const [categories, setCategories] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    axiosClient.get('/categories').then((r) => setCategories(r.data || [])).catch(() => {});
  }, []);

  const mainCategories = categories.filter((c) => !c.parentCategoryId);
  const subCategoriesFor = (parentId) =>
    categories.filter((c) => String(c.parentCategoryId) === String(parentId));

  // Show up to 4 primary categories directly; group any additional ones into "More ▾" so navbar never overflows
  const visibleMainCategories = mainCategories.slice(0, 4);
  const overflowMainCategories = mainCategories.slice(4);

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
      background: 'rgba(251, 248, 243, 0.94)',
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

      {/* Primary Header Row: Logo + Desktop Nav + Search & Action Icons (never overflows right) */}
      <div style={{
        maxWidth: 1280,
        margin: '0 auto',
        padding: '12px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 14
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <button className="nav-mobile-btn" onClick={() => setMobileMenu(!mobileMenu)} aria-label="Toggle Menu">
            {mobileMenu ? <X size={24} /> : <Menu size={24} />}
          </button>

          <Link to="/" style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start', flexShrink: 0 }}>
            <span className="crest-font" style={{ fontSize: '1.55rem', fontWeight: 600, letterSpacing: '0.24em', color: 'var(--brand-plum)', lineHeight: 1 }}>
              NUVAYA
            </span>
            <span style={{ fontSize: '0.54rem', letterSpacing: '0.3em', color: 'var(--brand-gold-dark)', fontWeight: 700, textTransform: 'uppercase', marginTop: 4 }}>
              Modest Luxury
            </span>
          </Link>
        </div>

        {/* Center Navigation: single-line nowrap items + automatic "More ▾" overflow bucket */}
        <nav
          className="nav-desktop-links"
          style={{
            alignItems: 'center',
            justifyContent: 'center',
            gap: 18,
            flex: '1 1 auto',
            minWidth: 0,
            fontSize: '0.76rem',
            letterSpacing: '0.09em',
            whiteSpace: 'nowrap'
          }}
        >
          <Link to="/shop" style={{ whiteSpace: 'nowrap' }}>All Collections</Link>

          {visibleMainCategories.length > 0 ? (
            visibleMainCategories.map((mc) => {
              const kids = subCategoriesFor(mc.id);
              if (kids.length === 0) {
                return (
                  <Link key={mc.id} to={`/shop?category=${encodeURIComponent(mc.slug)}`} style={{ whiteSpace: 'nowrap' }}>
                    {mc.name}
                  </Link>
                );
              }
              return (
                <div
                  key={mc.id}
                  style={{ position: 'relative', flexShrink: 0 }}
                  onMouseEnter={() => setOpenDropdownSlug(mc.slug)}
                  onMouseLeave={() => setOpenDropdownSlug(null)}
                >
                  <Link
                    to={`/shop?category=${encodeURIComponent(mc.slug)}`}
                    onClick={() => setOpenDropdownSlug(null)}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}
                  >
                    {mc.name} <ChevronDown size={13} />
                  </Link>

                  {openDropdownSlug === mc.slug && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      paddingTop: 10,
                      minWidth: 220,
                      zIndex: 50
                    }}>
                      <div style={{
                        background: '#FFFFFF',
                        border: '1px solid rgba(198,161,99,0.55)',
                        borderRadius: 12,
                        padding: '8px 0',
                        boxShadow: '0 16px 36px rgba(39,16,27,0.14)',
                        display: 'grid',
                        maxHeight: '65vh',
                        overflowY: 'auto'
                      }}>
                        <Link
                          to={`/shop?category=${encodeURIComponent(mc.slug)}`}
                          onClick={() => setOpenDropdownSlug(null)}
                          style={{
                            padding: '9px 16px',
                            fontSize: '0.75rem',
                            letterSpacing: '0.1em',
                            fontWeight: 700,
                            color: 'var(--brand-plum)',
                            display: 'block',
                            borderBottom: '1px solid var(--border-sand)',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          All {mc.name}
                        </Link>
                        {kids.map((sc) => (
                          <Link
                            key={sc.id}
                            to={`/shop?category=${encodeURIComponent(mc.slug)}&subCategory=${encodeURIComponent(sc.slug)}`}
                            onClick={() => setOpenDropdownSlug(null)}
                            style={{
                              padding: '9px 16px',
                              fontSize: '0.75rem',
                              letterSpacing: '0.08em',
                              color: 'var(--brand-plum)',
                              display: 'block',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {sc.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <>
              <Link to="/shop?category=hijabs" style={{ whiteSpace: 'nowrap' }}>Hijabs</Link>
              <Link to="/shop?category=abayas" style={{ whiteSpace: 'nowrap' }}>Abayas</Link>
            </>
          )}

          {overflowMainCategories.length > 0 && (
            <div
              style={{ position: 'relative', flexShrink: 0 }}
              onMouseEnter={() => setOpenDropdownSlug('__more__')}
              onMouseLeave={() => setOpenDropdownSlug(null)}
            >
              <button
                type="button"
                onClick={() => setOpenDropdownSlug(openDropdownSlug === '__more__' ? null : '__more__')}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  font: 'inherit',
                  color: 'inherit',
                  letterSpacing: 'inherit',
                  textTransform: 'uppercase',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: 0,
                  whiteSpace: 'nowrap'
                }}
              >
                More <ChevronDown size={13} />
              </button>

              {openDropdownSlug === '__more__' && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  paddingTop: 10,
                  minWidth: 230,
                  zIndex: 50
                }}>
                  <div style={{
                    background: '#FFFFFF',
                    border: '1px solid rgba(198,161,99,0.55)',
                    borderRadius: 12,
                    padding: '8px 0',
                    boxShadow: '0 16px 36px rgba(39,16,27,0.14)',
                    display: 'grid',
                    maxHeight: '65vh',
                    overflowY: 'auto'
                  }}>
                    {overflowMainCategories.map((mc) => {
                      const kids = subCategoriesFor(mc.id);
                      return (
                        <React.Fragment key={mc.id}>
                          <Link
                            to={`/shop?category=${encodeURIComponent(mc.slug)}`}
                            onClick={() => setOpenDropdownSlug(null)}
                            style={{
                              padding: '9px 16px',
                              fontSize: '0.75rem',
                              letterSpacing: '0.09em',
                              fontWeight: 700,
                              color: 'var(--brand-plum)',
                              display: 'block',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {mc.name}
                          </Link>
                          {kids.map((sc) => (
                            <Link
                              key={sc.id}
                              to={`/shop?category=${encodeURIComponent(mc.slug)}&subCategory=${encodeURIComponent(sc.slug)}`}
                              onClick={() => setOpenDropdownSlug(null)}
                              style={{
                                padding: '7px 16px 7px 26px',
                                fontSize: '0.72rem',
                                letterSpacing: '0.08em',
                                color: 'var(--brand-gold-dark)',
                                display: 'block',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              ↳ {sc.name}
                            </Link>
                          ))}
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          <Link to="/shop?category=new-arrivals" style={{ whiteSpace: 'nowrap' }}>New Arrivals</Link>
          <Link to="/shop?category=best-sellers" style={{ whiteSpace: 'nowrap' }}>Bundles</Link>
          <Link to="/track-order" style={{ whiteSpace: 'nowrap' }}>Track Order</Link>
        </nav>

        {/* Right Action Cluster: locked flexShrink: 0 so icons NEVER get pushed off-screen */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <form onSubmit={handleSearch} className="nav-desktop-search" style={{ width: 155 }}>
            <Search size={14} color="var(--brand-gold-dark)" style={{ flexShrink: 0 }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              style={{ border: 'none', background: 'transparent', outline: 'none', paddingLeft: 6, fontSize: '0.8rem', color: 'var(--brand-plum)', width: '100%' }}
            />
          </form>
          <Link to="/wishlist" title="My Wishlist" aria-label="My Wishlist" style={{ position: 'relative', color: 'var(--brand-plum)', display: 'inline-flex', padding: 5 }}>
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
          <Link to="/admin/login" title="Admin Atelier" style={{ color: 'var(--brand-plum)', display: 'inline-flex', padding: 5 }}>
            <User size={19} strokeWidth={1.8} />
          </Link>
          <button onClick={() => setDrawerOpen(true)} aria-label="Shopping Bag" style={{ position: 'relative', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--brand-plum)', display: 'inline-flex', padding: 5 }}>
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
        <div style={{ background: 'var(--bg-ivory)', padding: '18px 22px 26px', borderTop: '1px solid var(--border-sand)', display: 'grid', gap: 14, color: 'var(--brand-plum)', fontWeight: 600, fontSize: '0.86rem', letterSpacing: '0.08em', textTransform: 'uppercase', maxHeight: '78vh', overflowY: 'auto' }}>
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
          {mainCategories.map((mc) => {
            const kids = subCategoriesFor(mc.id);
            return (
              <React.Fragment key={mc.id}>
                <Link to={`/shop?category=${encodeURIComponent(mc.slug)}`} onClick={() => setMobileMenu(false)}>
                  {mc.name}
                </Link>
                {kids.map((sc) => (
                  <Link
                    key={sc.id}
                    to={`/shop?category=${encodeURIComponent(mc.slug)}&subCategory=${encodeURIComponent(sc.slug)}`}
                    onClick={() => setMobileMenu(false)}
                    style={{ paddingLeft: 14, fontSize: '0.8rem', color: 'var(--brand-gold-dark)' }}
                  >
                    ↳ {sc.name}
                  </Link>
                ))}
              </React.Fragment>
            );
          })}
          <Link to="/shop?category=new-arrivals" onClick={() => setMobileMenu(false)}>New Arrivals</Link>
          <Link to="/shop?category=best-sellers" onClick={() => setMobileMenu(false)}>Bundles (Pack of 3 & 5)</Link>
          <Link to="/track-order" onClick={() => setMobileMenu(false)}>Track Order</Link>
          <Link to="/wishlist" onClick={() => setMobileMenu(false)}>My Wishlist ({wishlistCount})</Link>
        </div>
      )}
    </header>
  );
}
