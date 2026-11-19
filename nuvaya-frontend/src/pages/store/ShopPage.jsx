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
  const fabric = searchParams.get('fabric') || '';
  const search = searchParams.get('search') || '';

  const isHijabCategory =
    category.toLowerCase().includes('hijab') || Boolean(fabric);

  useEffect(() => {
    axiosClient.get('/categories').then((r) => setCategories(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    axiosClient.get('/products', {
      params: {
        category: category === 'hijabs' ? 'all' : category,
        search: category === 'hijabs' && !search ? 'hijab' : (search || undefined),
        fabric: fabric || undefined,
        color: color || undefined,
        sortBy: sort,
        size: 60
      }
    }).then((r) => setProducts(r.data.content || [])).catch(() => {});
  }, [category, fabric, search, color, sort]);

  const handleCategoryChange = (nextCategory) => {
    const nextParams = {};
    if (nextCategory && nextCategory !== 'all') nextParams.category = nextCategory;
    if (nextCategory.toLowerCase().includes('hijab') && fabric) {
      nextParams.fabric = fabric;
    }
    setSearchParams(nextParams);
  };

  const handleFabricChange = (nextFabric) => {
    const nextParams = {};
    if (category && category !== 'all') nextParams.category = category;
    else nextParams.category = 'hijabs';
    if (nextFabric) nextParams.fabric = nextFabric;
    setSearchParams(nextParams);
  };

  return (
    <div style={{ maxWidth: 1240, margin: '40px auto', padding: '0 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 30 }}>
        <div>
          <div style={{ fontSize: '0.7rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--brand-gold-dark)', fontWeight: 700 }}>
            CURATED CATALOG
          </div>
          <h1 style={{ fontSize: '2.5rem', color: 'var(--brand-plum)', lineHeight: 1.1 }}>
            {search ? `Results for "${search}"` : fabric ? `${fabric} Hijabs` : 'NUVAYA Collection'}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: 4 }}>{products.length} curated pieces</p>
        </div>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <select value={category} onChange={(e) => handleCategoryChange(e.target.value)} style={selectStyle}>
            <option value="all">All Categories</option>
            <option value="hijabs">All Hijabs</option>
            {categories.map((c) => (
              <option key={c.id} value={c.slug}>{c.name}</option>
            ))}
          </select>

          {isHijabCategory && (
            <select
              value={fabric}
              onChange={(e) => handleFabricChange(e.target.value)}
              style={{ ...selectStyle, borderColor: 'var(--brand-gold)', background: 'var(--bg-cream)', fontWeight: 600, color: 'var(--brand-plum)' }}
            >
              <option value="">Hijab Fabric: All Types</option>
              <option value="Jersey">Fabric: Jersey</option>
              <option value="Chiffon">Fabric: Chiffon</option>
              <option value="Stamble">Fabric: Stamble</option>
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
          No pieces matched this filter yet. Try switching the fabric or selecting All Categories.
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
