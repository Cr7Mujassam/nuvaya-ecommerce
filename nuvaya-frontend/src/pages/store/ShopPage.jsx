import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import ProductCard from '../../components/common/ProductCard';

export default function ShopPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [sort, setSort] = useState('newest');
  const [color, setColor] = useState('');

  const category = searchParams.get('category') || 'all';
  const subCategory = searchParams.get('subCategory') || '';
  const fabric = searchParams.get('fabric') || '';
  const search = searchParams.get('search') || '';

  useEffect(() => {
    axiosClient.get('/categories').then((r) => setCategories(r.data || [])).catch(() => {});
  }, []);

  const mainCategories = categories.filter((c) => !c.parentCategoryId);
  const selectedMainObj =
    mainCategories.find((c) => c.slug === category) ||
    categories.find((c) => c.slug === category && !c.parentCategoryId) ||
    null;
  const subCategories = selectedMainObj
    ? categories.filter((c) => String(c.parentCategoryId) === String(selectedMainObj.id))
    : [];

  const activeSlug = subCategory || category;

  useEffect(() => {
    axiosClient.get('/products', {
      params: {
        category: activeSlug || 'all',
        search: search || undefined,
        fabric: fabric || undefined,
        color: color || undefined,
        sortBy: sort,
        size: 60
      }
    }).then((r) => setProducts(r.data.content || [])).catch(() => {});
  }, [activeSlug, fabric, search, color, sort]);

  const handleMainCategoryChange = (nextMainSlug) => {
    const nextParams = {};
    if (nextMainSlug && nextMainSlug !== 'all') nextParams.category = nextMainSlug;
    setSearchParams(nextParams);
  };

  const handleSubCategoryChange = (nextSubSlug) => {
    const nextParams = {};
    if (category && category !== 'all') nextParams.category = category;
    if (nextSubSlug) nextParams.subCategory = nextSubSlug;
    setSearchParams(nextParams);
  };

  const activeSubObj = subCategories.find((s) => s.slug === subCategory);
  const headingText = search
    ? `Results for "${search}"`
    : activeSubObj
      ? activeSubObj.name
      : selectedMainObj
        ? selectedMainObj.name
        : fabric
          ? `${fabric} Collection`
          : 'NUVAYA Collection';

  return (
    <div style={{ maxWidth: 1240, margin: '40px auto', padding: '0 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 30 }}>
        <div>
          <div style={{ fontSize: '0.7rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--brand-gold-dark)', fontWeight: 700 }}>
            {selectedMainObj && activeSubObj ? `${selectedMainObj.name} • ${activeSubObj.name}` : 'CURATED CATALOG'}
          </div>
          <h1 style={{ fontSize: '2.5rem', color: 'var(--brand-plum)', lineHeight: 1.1 }}>
            {headingText}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: 4 }}>{products.length} curated pieces</p>
        </div>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <select value={category} onChange={(e) => handleMainCategoryChange(e.target.value)} style={selectStyle}>
            <option value="all">All Categories</option>
            {(mainCategories.length ? mainCategories : categories).map((c) => (
              <option key={c.id} value={c.slug}>{c.name}</option>
            ))}
          </select>

          {subCategories.length > 0 && (
            <select
              value={subCategory}
              onChange={(e) => handleSubCategoryChange(e.target.value)}
              style={{ ...selectStyle, borderColor: 'var(--brand-gold)', background: 'var(--bg-cream)', fontWeight: 600, color: 'var(--brand-plum)' }}
            >
              <option value="">All {selectedMainObj?.name || 'Types'}</option>
              {subCategories.map((sc) => (
                <option key={sc.id} value={sc.slug}>{sc.name}</option>
              ))}
            </select>
          )}

          <select value={color} onChange={(e) => setColor(e.target.value)} style={selectStyle}>
            <option value="">All Colors</option>
            {['Black', 'Beige', 'Mocha', 'Olive', 'Chocolate', 'Dusty Rose', 'Warm Ivory'].map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <select value={sort} onChange={(e) => setSort(e.target.value)} style={selectStyle}>
            <option value="newest">Sort: Newest</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
          </select>
        </div>
      </div>

      {products.length === 0 ? (
        <div style={{ background: '#fff', padding: 44, borderRadius: 16, border: '1px solid var(--border-sand)', textAlign: 'center', color: 'var(--text-muted)' }}>
          No pieces matched this filter yet. Try switching the sub-category or selecting All Categories.
        </div>
      ) : (
        <div className="product-grid">
          {products.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      )}
    </div>
  );
}

const selectStyle = {
  padding: '10px 14px',
  borderRadius: 10,
  border: '1px solid var(--border-sand)',
  background: '#fff',
  fontFamily: 'inherit',
  fontSize: '0.86rem',
  color: 'var(--brand-plum)',
  cursor: 'pointer'
};
