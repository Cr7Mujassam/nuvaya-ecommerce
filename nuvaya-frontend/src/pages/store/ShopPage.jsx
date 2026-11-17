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
  const search = searchParams.get('search') || '';

  useEffect(() => {
    axiosClient.get('/categories').then((r) => setCategories(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    axiosClient.get('/products', {
      params: { category, search, color: color || undefined, sort, size: 40 }
    }).then((r) => setProducts(r.data.content || [])).catch(() => {});
  }, [category, search, color, sort]);

  return (
    <div style={{ maxWidth: 1220, margin: '36px auto', padding: '0 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: '2.4rem' }}>{search ? `Results for "${search}"` : 'NUVAYA Collection'}</h1>
          <p style={{ color: 'var(--text-muted)' }}>{products.length} curated pieces</p>
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <select value={category} onChange={(e) => setSearchParams({ category: e.target.value })} style={selectStyle}>
            <option value="all">All Categories</option>
            {categories.map((c) => <option key={c.id} value={c.slug}>{c.name}</option>)}
          </select>
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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(255px, 1fr))', gap: 24 }}>
        {products.map((p) => <ProductCard key={p.id} product={p} />)}
      </div>
    </div>
  );
}

const selectStyle = { padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-sand)', background: '#fff', fontFamily: 'inherit' };
