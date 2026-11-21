import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Trash2, Upload, Package, ShoppingBag, Settings,
  LayoutDashboard, LogOut, Sparkles, AlertTriangle, CheckCircle2, ExternalLink, Pencil, X, Star, BadgeCheck, MessageSquareReply
} from 'lucide-react';
import axiosClient, { FALLBACK_IMAGE, resolveAssetUrl } from '../../api/axiosClient';

const emptyProductForm = {
  name: '',
  sku: '',
  categoryId: '',
  fabric: '',
  description: '',
  specifications: '',
  availableSizesText: 'Standard',
  basePrice: '',
  discountPrice: '',
  stockQuantity: 50,
  status: 'ACTIVE',
  featured: true,
  newArrival: true,
  bestSeller: false,
  deliveryChargeType: 'FREE',
  deliveryChargeAmount: 0,
  colors: [{ name: 'Black', hexCode: '#191817', inStock: true }],
  images: [],
  packs: [],
};

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [orders, setOrders] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [reviewFilter, setReviewFilter] = useState('ALL');
  const [replyDrafts, setReplyDrafts] = useState({});
  const [trackingDrafts, setTrackingDrafts] = useState({});
  const [settings, setSettings] = useState(null);
  const [tab, setTab] = useState('overview');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);
  const [form, setForm] = useState(emptyProductForm);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newImageColor, setNewImageColor] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const formRef = useRef(null);
  const navigate = useNavigate();

  const loadAll = async () => {
    try {
      const [dashRes, prodRes, catRes, ordRes, setRes, revRes] = await Promise.all([
        axiosClient.get('/admin/dashboard'),
        axiosClient.get('/admin/products?size=100'),
        axiosClient.get('/categories'),
        axiosClient.get('/admin/orders'),
        axiosClient.get('/store/settings'),
        axiosClient.get('/admin/reviews?size=100').catch(() => ({ data: { content: [] } })),
      ]);
      setStats(dashRes.data);
      setProducts(prodRes.data.content || []);
      setCategories(catRes.data || []);
      setOrders(ordRes.data.content || []);
      setSettings(setRes.data);
      setReviews(revRes.data?.content || []);
      if (catRes.data?.length && !form.categoryId) {
        setForm((prev) => ({ ...prev, categoryId: catRes.data[0].id }));
      }
    } catch {
      navigate('/admin/login');
    }
  };

  useEffect(() => { loadAll(); }, []);

  const resetForm = () => {
    setEditingProductId(null);
    setForm({ ...emptyProductForm, categoryId: categories[0]?.id || '' });
    setNewImageUrl('');
    setNewImageColor('');
  };

  const openNewProductForm = () => {
    resetForm();
    setTab('products');
    setShowAddForm(true);
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
  };

  const handleEditProduct = (product) => {
    const matchedCat =
      categories.find((c) => c.id === product.categoryId || c.name === product.categoryName)?.id ||
      categories[0]?.id ||
      '';

    setEditingProductId(product.id);
    setForm({
      name: product.name || '',
      sku: product.sku || '',
      categoryId: matchedCat,
      fabric: product.fabric || '',
      description: product.description || '',
      specifications: product.specifications || '',
      availableSizesText: (product.availableSizes && product.availableSizes.length > 0)
        ? product.availableSizes.join(', ')
        : 'Standard',
      basePrice: product.basePrice ?? '',
      discountPrice: product.discountPrice ?? '',
      stockQuantity: product.stockQuantity ?? 50,
      status: product.status || 'ACTIVE',
      featured: Boolean(product.featured),
      newArrival: Boolean(product.newArrival),
      bestSeller: Boolean(product.bestSeller),
      deliveryChargeType: product.deliveryChargeType || 'FREE',
      deliveryChargeAmount: product.deliveryChargeAmount ?? 0,
      colors: product.colors?.length
        ? product.colors.map((c) => ({ name: c.name, hexCode: c.hexCode || '#191817', inStock: c.inStock ?? true }))
        : [{ name: 'Black', hexCode: '#191817', inStock: true }],
      images: product.images?.length
        ? product.images.map((im, idx) => ({
            imageUrl: im.imageUrl,
            colorName: im.colorName || '',
            primaryImage: Boolean(im.primaryImage ?? idx === 0),
          }))
        : [],
      packs: product.packs?.length
        ? product.packs.map((pk) => ({
            packName: pk.packName || 'Pack of 3',
            pieceCount: pk.pieceCount || 3,
            packPrice: pk.packPrice ?? '',
            discountPrice: pk.discountPrice ?? '',
            packDeliveryCharge: pk.packDeliveryCharge ?? 0,
            allowMixedColors: Boolean(pk.allowMixedColors),
            stockQuantity: pk.stockQuantity ?? 50,
          }))
        : [],
    });
    setTab('products');
    setShowAddForm(true);
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    try {
      const token = sessionStorage.getItem('nuvaya_admin_jwt');
      const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8083';
      const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
      const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'nuvaya_products';
      for (const file of files) {
        const fd = new FormData();
        fd.append('file', file);
        let uploadedUrl = null;
        if (cloudName) {
          fd.append('upload_preset', uploadPreset);
          const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: 'POST', body: fd });
          const data = await res.json();
          uploadedUrl = data.secure_url;
        } else {
          const res = await fetch(`${base}/api/v1/admin/uploads/image`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: fd,
          });
          const data = await res.json();
          uploadedUrl = data.imageUrl;
        }
        if (uploadedUrl) {
          setForm((prev) => ({
            ...prev,
            images: [
              ...prev.images,
              {
                imageUrl: uploadedUrl,
                colorName: newImageColor || prev.colors[0]?.name || '',
                primaryImage: prev.images.length === 0,
              },
            ],
          }));
        }
      }
    } catch {
      alert('Image upload failed (max 5MB JPG/PNG/WebP).');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const addImageByUrl = () => {
    if (!newImageUrl.trim()) return;
    setForm((prev) => ({
      ...prev,
      images: [
        ...prev.images,
        {
          imageUrl: newImageUrl.trim(),
          colorName: newImageColor || prev.colors[0]?.name || '',
          primaryImage: prev.images.length === 0,
        },
      ],
    }));
    setNewImageUrl('');
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        sku: form.sku,
        categoryId: Number(form.categoryId),
        fabric: form.fabric,
        description: form.description,
        specifications: form.specifications,
        availableSizes: form.availableSizesText.split(',').map((s) => s.trim()).filter(Boolean),
        basePrice: Number(form.basePrice),
        discountPrice: form.discountPrice ? Number(form.discountPrice) : null,
        stockQuantity: Number(form.stockQuantity),
        status: form.status,
        featured: form.featured,
        newArrival: form.newArrival,
        bestSeller: form.bestSeller,
        deliveryChargeType: form.deliveryChargeType,
        deliveryChargeAmount: Number(form.deliveryChargeAmount || 0),
        colors: form.colors.filter((c) => c.name.trim()),
        images: form.images.map((im, idx) => ({
          ...im,
          primaryImage: idx === 0 ? true : Boolean(im.primaryImage),
        })),
        packs: form.packs.map((pk) => ({
          packName: pk.packName,
          pieceCount: Number(pk.pieceCount),
          packPrice: Number(pk.packPrice),
          discountPrice: pk.discountPrice ? Number(pk.discountPrice) : null,
          packDeliveryCharge: Number(pk.packDeliveryCharge || 0),
          allowMixedColors: Boolean(pk.allowMixedColors),
          stockQuantity: Number(pk.stockQuantity || 50),
        })),
      };

      if (editingProductId) {
        await axiosClient.put(`/admin/products/${editingProductId}`, payload);
      } else {
        await axiosClient.post('/admin/products', payload);
      }

      resetForm();
      setShowAddForm(false);
      await loadAll();
    } catch (err) {
      alert(err.response?.data?.message || 'Could not save product. Ensure SKU is unique and required fields are filled.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleProductStatus = async (product) => {
    const nextStatus = product.status === 'ACTIVE' ? 'DRAFT' : 'ACTIVE';
    const matchedCat =
      categories.find((c) => c.id === product.categoryId || c.name === product.categoryName)?.id ||
      categories[0]?.id;

    try {
      await axiosClient.put(`/admin/products/${product.id}`, {
        name: product.name,
        sku: product.sku,
        categoryId: Number(matchedCat),
        fabric: product.fabric || '',
        description: product.description || '',
        specifications: product.specifications || '',
        availableSizes: product.availableSizes?.length ? product.availableSizes : ['Standard'],
        basePrice: Number(product.basePrice),
        discountPrice: product.discountPrice ? Number(product.discountPrice) : null,
        stockQuantity: Number(product.stockQuantity ?? 0),
        status: nextStatus,
        featured: Boolean(product.featured),
        newArrival: Boolean(product.newArrival),
        bestSeller: Boolean(product.bestSeller),
        deliveryChargeType: product.deliveryChargeType || 'FREE',
        deliveryChargeAmount: Number(product.deliveryChargeAmount || 0),
        colors: (product.colors || []).map((c) => ({
          name: c.name,
          hexCode: c.hexCode || '#191817',
          inStock: c.inStock ?? true,
        })),
        images: (product.images || []).map((im, idx) => ({
          imageUrl: im.imageUrl,
          colorName: im.colorName || '',
          primaryImage: idx === 0 ? true : Boolean(im.primaryImage),
        })),
        packs: (product.packs || []).map((pk) => ({
          packName: pk.packName,
          pieceCount: Number(pk.pieceCount),
          packPrice: Number(pk.packPrice),
          discountPrice: pk.discountPrice ? Number(pk.discountPrice) : null,
          packDeliveryCharge: Number(pk.packDeliveryCharge || 0),
          allowMixedColors: Boolean(pk.allowMixedColors),
          stockQuantity: Number(pk.stockQuantity || 50),
        })),
      });
      await loadAll();
    } catch (err) {
      alert(err.response?.data?.message || 'Could not update product status.');
    }
  };

  const handleDeleteProduct = async (id, name) => {
    if (!window.confirm(`Delete "${name}" from NuVaya catalog?`)) return;
    if (editingProductId === id) {
      resetForm();
      setShowAddForm(false);
    }
    await axiosClient.delete(`/admin/products/${id}`);
    loadAll();
  };

  const updateOrderStatus = async (id, status, trackingId, courierPartner) => {
    await axiosClient.put(`/admin/orders/${id}/status`, {
      status,
      ...(trackingId !== undefined ? { trackingId } : {}),
      ...(courierPartner !== undefined ? { courierPartner } : {}),
    });
    loadAll();
  };

  const saveSettings = async (e) => {
    e.preventDefault();
    await axiosClient.put('/admin/store/settings', settings);
    alert('NuVaya store, social & contact settings saved!');
  };

  const handleReviewStatus = async (id, status) => {
    await axiosClient.put(`/admin/reviews/${id}/status`, { status });
    loadAll();
  };

  const handleReviewReply = async (id) => {
    const reply = replyDrafts[id] ?? '';
    await axiosClient.put(`/admin/reviews/${id}/reply`, { reply });
    loadAll();
  };

  const handleDeleteReview = async (id) => {
    if (!window.confirm('Delete this customer review permanently?')) return;
    await axiosClient.delete(`/admin/reviews/${id}`);
    loadAll();
  };

  const logout = () => {
    sessionStorage.removeItem('nuvaya_admin_jwt');
    navigate('/admin/login');
  };

  if (!stats) return <div style={{ padding: 60, textAlign: 'center', color: 'var(--brand-plum)' }}>Loading NuVaya Executive Studio...</div>;

  const totalRevenue = orders
    .filter((o) => o.status !== 'CANCELLED')
    .reduce((sum, o) => sum + Number(o.finalAmount || 0), 0);

  return (
    <div style={{ minHeight: '85vh', background: 'var(--bg-ivory)', paddingBottom: 60 }}>
      <div style={{ background: 'linear-gradient(135deg, #2C141F 0%, #451F30 65%, #2C141F 100%)', color: '#FAF6EE', borderBottom: '2px solid var(--brand-gold)', padding: '28px 20px' }}>
        <div style={{ maxWidth: 1220, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <img
              src="/nuvaya-logo.png"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
              alt="NuVaya"
              style={{ width: 62, height: 62, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--brand-gold)', boxShadow: '0 4px 16px rgba(0,0,0,0.35)' }}
            />
            <div>
              <div style={{ fontSize: '0.72rem', letterSpacing: '0.2em', color: 'var(--brand-gold)', fontWeight: 700, textTransform: 'uppercase' }}>
                NuVaya Command Center • Hyderabad
              </div>
              <h1 style={{ fontSize: '2.1rem', color: '#FAF6EE', lineHeight: 1.15 }}>Brand & Catalog Studio</h1>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <a href="/" target="_blank" rel="noreferrer" style={goldGhostBtn}>
              <ExternalLink size={15} /> Live Store
            </a>
            <button onClick={openNewProductForm} style={goldSolidBtn}>
              <Plus size={16} /> Add Product
            </button>
            <button onClick={logout} style={goldGhostBtn}>
              <LogOut size={15} /> Logout
            </button>
          </div>
        </div>

        <div style={{ maxWidth: 1220, margin: '22px auto 0', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {[
            { id: 'overview', label: 'Overview', icon: LayoutDashboard },
            { id: 'products', label: `Catalog (${products.length})`, icon: Package },
            { id: 'orders', label: `WhatsApp Orders (${orders.length})`, icon: ShoppingBag },
            { id: 'reviews', label: `Reviews (${reviews.length})`, icon: Star },
            { id: 'settings', label: 'Store, Social & Contact', icon: Settings },
          ].map(({ id, label, icon: Icon }) => {
            const active = tab === id;
            return (
              <button
                key={id}
                onClick={() => setTab(id)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 18px',
                  borderRadius: 10,
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.88rem',
                  border: active ? '1px solid var(--brand-gold)' : '1px solid rgba(197,160,101,0.3)',
                  background: active ? 'var(--brand-gold)' : 'rgba(255,255,255,0.06)',
                  color: active ? '#231019' : '#FAF6EE',
                }}
              >
                <Icon size={16} /> {label}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ maxWidth: 1220, margin: '30px auto', padding: '0 20px' }}>
        {tab === 'overview' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 18, marginBottom: 32 }}>
              {[
                { label: 'Catalog Products', value: stats.totalProducts, sub: `${stats.activeProducts} Active on store`, icon: Package, accent: '#2C141F' },
                { label: 'WhatsApp Orders', value: stats.totalOrders, sub: `${stats.pendingOrders} Awaiting confirmation`, icon: ShoppingBag, accent: '#9E7B43' },
                { label: 'Gross Order Value', value: `₹${totalRevenue.toLocaleString('en-IN')}`, sub: 'Excluding cancelled orders', icon: Sparkles, accent: '#1E6F50' },
                { label: 'Low / Out of Stock', value: stats.outOfStockProducts, sub: 'Items needing restock', icon: AlertTriangle, accent: '#9E2A2B' },
              ].map((card) => {
                const Icon = card.icon;
                return (
                  <div key={card.label} style={{ background: '#fff', padding: 22, borderRadius: 16, border: '1px solid var(--border-sand)', boxShadow: '0 6px 20px rgba(44,20,31,0.05)', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: card.accent }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.84rem', fontWeight: 600 }}>{card.label}</span>
                      <div style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--bg-cream)', display: 'grid', placeItems: 'center', color: card.accent }}>
                        <Icon size={18} />
                      </div>
                    </div>
                    <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--brand-plum)' }}>{card.value}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4 }}>{card.sub}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {tab === 'products' && (
          <div ref={formRef}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
              <h2 style={{ fontSize: '1.8rem', color: 'var(--brand-plum)' }}>NuVaya Product Catalog</h2>
              {showAddForm ? (
                <button
                  onClick={() => { resetForm(); setShowAddForm(false); }}
                  className="btn-outline"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
                >
                  <X size={16} /> Close Form
                </button>
              ) : (
                <button
                  onClick={openNewProductForm}
                  className="btn-primary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
                >
                  <Plus size={18} /> Add New Product
                </button>
              )}
            </div>

            {showAddForm && (
              <form onSubmit={handleSaveProduct} style={{ background: '#fff', padding: 28, borderRadius: 16, border: '1.5px solid var(--brand-gold)', marginBottom: 28, display: 'grid', gap: 18, boxShadow: '0 10px 30px rgba(44,20,31,0.08)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, borderBottom: '1px solid var(--border-sand)', paddingBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: '0.7rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--brand-gold-dark)', fontWeight: 700 }}>
                      {editingProductId ? `Editing Catalog Item #${editingProductId}` : 'New Catalog Entry'}
                    </div>
                    <h3 style={{ fontSize: '1.65rem', color: 'var(--brand-plum)' }}>
                      {editingProductId ? `Edit "${form.name}"` : 'Add New NuVaya Product'}
                    </h3>
                  </div>
                  {editingProductId && (
                    <button
                      type="button"
                      onClick={() => { resetForm(); setShowAddForm(false); }}
                      style={{ background: 'var(--bg-cream)', color: 'var(--brand-plum)', border: '1px solid var(--border-sand)', padding: '7px 14px', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem' }}
                    >
                      Cancel Edit
                    </button>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                  <div>
                    <label style={lbl}>Product Name *</label>
                    <input required placeholder="e.g. Premium Stamble Hijab" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={inp} />
                  </div>
                  <div>
                    <label style={lbl}>Unique SKU *</label>
                    <input required placeholder="e.g. NVY-HJ-STM-004" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} style={inp} />
                  </div>
                  <div>
                    <label style={lbl}>Category *</label>
                    <select required value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} style={inp}>
                      {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={lbl}>Fabric</label>
                    <input placeholder="e.g. Premium Chiffon / Jersey Cotton" value={form.fabric} onChange={(e) => setForm({ ...form, fabric: e.target.value })} style={inp} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12 }}>
                  <div>
                    <label style={lbl}>Base Price (₹) *</label>
                    <input required type="number" step="0.01" placeholder="399" value={form.basePrice} onChange={(e) => setForm({ ...form, basePrice: e.target.value })} style={inp} />
                  </div>
                  <div>
                    <label style={lbl}>Offer Price (₹)</label>
                    <input type="number" step="0.01" placeholder="299" value={form.discountPrice} onChange={(e) => setForm({ ...form, discountPrice: e.target.value })} style={inp} />
                  </div>
                  <div>
                    <label style={lbl}>Stock Quantity *</label>
                    <input required type="number" min="0" value={form.stockQuantity} onChange={(e) => setForm({ ...form, stockQuantity: e.target.value })} style={inp} />
                  </div>
                  <div>
                    <label style={lbl}>Visibility Status</label>
                    <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} style={inp}>
                      <option value="ACTIVE">ACTIVE (Visible on Store)</option>
                      <option value="DRAFT">DRAFT (Hidden)</option>
                      <option value="ARCHIVED">ARCHIVED</option>
                    </select>
                  </div>
                  <div>
                    <label style={lbl}>Sizes (comma-separated)</label>
                    <input placeholder="Standard or 52, 54, 56, 58" value={form.availableSizesText} onChange={(e) => setForm({ ...form, availableSizesText: e.target.value })} style={inp} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
                  <div>
                    <label style={lbl}>Description</label>
                    <textarea rows={2} placeholder="Soft drape, breathable all-season wear..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} style={inp} />
                  </div>
                  <div>
                    <label style={lbl}>Specifications</label>
                    <textarea rows={2} placeholder="185cm x 72cm | Opaque | Non-slip" value={form.specifications} onChange={(e) => setForm({ ...form, specifications: e.target.value })} style={inp} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, alignItems: 'center' }}>
                  <div>
                    <label style={lbl}>Delivery Rule</label>
                    <select value={form.deliveryChargeType} onChange={(e) => setForm({ ...form, deliveryChargeType: e.target.value })} style={inp}>
                      <option value="FREE">Free Delivery</option>
                      <option value="FIXED_PER_PRODUCT">Fixed Delivery Charge</option>
                      <option value="PER_PACK_OPTION">Per Pack Delivery Charge</option>
                      <option value="PER_QUANTITY">Per Quantity Charge</option>
                    </select>
                  </div>
                  <div>
                    <label style={lbl}>Delivery Fee (₹)</label>
                    <input type="number" value={form.deliveryChargeAmount} onChange={(e) => setForm({ ...form, deliveryChargeAmount: e.target.value })} style={inp} />
                  </div>
                  <div style={{ display: 'flex', gap: 16, paddingTop: 18, flexWrap: 'wrap' }}>
                    <label style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: '0.88rem' }}>
                      <input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} /> Featured
                    </label>
                    <label style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: '0.88rem' }}>
                      <input type="checkbox" checked={form.newArrival} onChange={(e) => setForm({ ...form, newArrival: e.target.checked })} /> New Arrival
                    </label>
                    <label style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: '0.88rem' }}>
                      <input type="checkbox" checked={form.bestSeller} onChange={(e) => setForm({ ...form, bestSeller: e.target.checked })} /> Best Seller
                    </label>
                  </div>
                </div>

                <div style={boxSection}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <strong>Color Variants</strong>
                    <button type="button" className="btn-outline" style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                      onClick={() => setForm({ ...form, colors: [...form.colors, { name: '', hexCode: '#7B5E4B', inStock: true }] })}>
                      + Add Color
                    </button>
                  </div>
                  <div style={{ display: 'grid', gap: 8 }}>
                    {form.colors.map((c, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                        <input placeholder="Color Name (e.g. Mocha)" value={c.name}
                          onChange={(e) => {
                            const next = [...form.colors];
                            next[idx].name = e.target.value;
                            setForm({ ...form, colors: next });
                          }} style={inp} />
                        <input type="color" value={c.hexCode}
                          onChange={(e) => {
                            const next = [...form.colors];
                            next[idx].hexCode = e.target.value;
                            setForm({ ...form, colors: next });
                          }} style={{ width: 46, height: 38, border: 'none', background: 'none', cursor: 'pointer' }} />
                        <button type="button" onClick={() => setForm({ ...form, colors: form.colors.filter((_, i) => i !== idx) })} style={{ background: 'none', border: 'none', color: '#9E2A2B', cursor: 'pointer' }}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={boxSection}>
                  <strong style={{ display: 'block', marginBottom: 10 }}>Product Photos (Select 2–4 Photos at Once or Paste URLs)</strong>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
                    <input placeholder="Tag color (optional, e.g. Mocha)" value={newImageColor} onChange={(e) => setNewImageColor(e.target.value)} style={{ ...inp, maxWidth: 200 }} />
                    <label className="btn-outline" style={{ padding: '9px 14px', fontSize: '0.84rem', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <Upload size={15} /> {uploading ? 'Uploading...' : 'Upload Photos'}
                      <input type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={handleFileUpload} hidden />
                    </label>
                    <input placeholder="Or paste https:// image URL..." value={newImageUrl} onChange={(e) => setNewImageUrl(e.target.value)} style={{ ...inp, flex: 1, minWidth: 200 }} />
                    <button type="button" className="btn-outline" style={{ padding: '9px 14px', fontSize: '0.84rem' }} onClick={addImageByUrl}>Add URL</button>
                  </div>
                  {form.images.length > 0 && (
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                      {form.images.map((im, idx) => (
                        <div key={idx} style={{ position: 'relative', width: 88, textAlign: 'center' }}>
                          <img
                            src={resolveAssetUrl(im.imageUrl)}
                            onError={(e) => { e.currentTarget.src = FALLBACK_IMAGE; }}
                            alt=""
                            style={{ width: 88, height: 106, objectFit: 'cover', borderRadius: 8, border: idx === 0 ? '2px solid var(--brand-plum)' : '1px solid var(--brand-gold)' }}
                          />
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            {idx === 0 ? 'Cover' : `#${idx + 1}`} {im.colorName || ''}
                          </div>
                          <button type="button" onClick={() => setForm({ ...form, images: form.images.filter((_, i) => i !== idx) })}
                            style={{ position: 'absolute', top: 4, right: 4, background: '#2C141F', color: '#fff', border: 'none', borderRadius: '50%', width: 20, height: 20, cursor: 'pointer', fontSize: '0.7rem' }}>
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div style={boxSection}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <strong>Bundle / Pack Options (Single, Pack of 3, Pack of 5)</strong>
                    <button type="button" className="btn-outline" style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                      onClick={() => setForm({
                        ...form,
                        packs: [...form.packs, { packName: 'Pack of 3', pieceCount: 3, packPrice: '', discountPrice: '', packDeliveryCharge: 0, allowMixedColors: true, stockQuantity: 50 }]
                      })}>
                      + Add Pack Option
                    </button>
                  </div>
                  <div style={{ display: 'grid', gap: 10 }}>
                    {form.packs.map((pk, idx) => (
                      <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1.4fr 0.7fr 1fr 1fr auto auto', gap: 8, alignItems: 'center' }}>
                        <input placeholder="Pack Name" value={pk.packName} onChange={(e) => { const n = [...form.packs]; n[idx].packName = e.target.value; setForm({ ...form, packs: n }); }} style={inp} />
                        <input type="number" min="1" placeholder="Pcs" value={pk.pieceCount} onChange={(e) => { const n = [...form.packs]; n[idx].pieceCount = e.target.value; setForm({ ...form, packs: n }); }} style={inp} />
                        <input type="number" placeholder="Pack Price ₹" value={pk.packPrice} onChange={(e) => { const n = [...form.packs]; n[idx].packPrice = e.target.value; setForm({ ...form, packs: n }); }} style={inp} />
                        <input type="number" placeholder="Offer ₹" value={pk.discountPrice} onChange={(e) => { const n = [...form.packs]; n[idx].discountPrice = e.target.value; setForm({ ...form, packs: n }); }} style={inp} />
                        <label style={{ fontSize: '0.78rem', display: 'flex', gap: 4, alignItems: 'center' }}>
                          <input type="checkbox" checked={pk.allowMixedColors} onChange={(e) => { const n = [...form.packs]; n[idx].allowMixedColors = e.target.checked; setForm({ ...form, packs: n }); }} /> Mix Colors
                        </label>
                        <button type="button" onClick={() => setForm({ ...form, packs: form.packs.filter((_, i) => i !== idx) })} style={{ background: 'none', border: 'none', color: '#9E2A2B', cursor: 'pointer' }}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <button type="submit" disabled={saving} className="btn-primary" style={{ padding: '13px 32px' }}>
                    {saving
                      ? 'Saving...'
                      : editingProductId
                        ? 'Save Changes to NuVaya Store'
                        : 'Publish Product to NuVaya Store'}
                  </button>
                  {editingProductId && (
                    <button
                      type="button"
                      onClick={() => { resetForm(); setShowAddForm(false); }}
                      className="btn-outline"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(295px, 1fr))', gap: 18 }}>
              {products.map((p) => {
                const img = p.images?.find((i) => i.primaryImage) || p.images?.[0];
                const isBeingEdited = editingProductId === p.id;
                return (
                  <div
                    key={p.id}
                    style={{
                      background: '#fff',
                      borderRadius: 14,
                      border: isBeingEdited ? '2px solid var(--brand-plum)' : '1px solid var(--border-sand)',
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column',
                      boxShadow: '0 6px 18px rgba(44,20,31,0.04)'
                    }}
                  >
                    <div style={{ display: 'flex', gap: 14, padding: 14 }}>
                      <img
                        src={resolveAssetUrl(img?.imageUrl)}
                        onError={(e) => { e.currentTarget.src = FALLBACK_IMAGE; }}
                        alt={p.name}
                        style={{ width: 76, height: 96, objectFit: 'cover', borderRadius: 10, border: '1px solid var(--border-sand)', flexShrink: 0 }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--brand-gold-dark)', fontWeight: 700, textTransform: 'uppercase' }}>{p.categoryName}</div>
                        <div style={{ fontWeight: 700, color: 'var(--brand-plum)', fontSize: '0.98rem', margin: '2px 0' }}>{p.name}</div>
                        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>SKU: {p.sku}</div>
                        <div style={{ fontWeight: 700, marginTop: 6 }}>
                          ₹{Number(p.discountPrice || p.basePrice).toLocaleString('en-IN')}
                          <span style={{ fontWeight: 400, fontSize: '0.78rem', color: 'var(--text-muted)', marginLeft: 8 }}>
                            • {p.images?.length || 0} photos • Stock: {p.stockQuantity}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div style={{ padding: '10px 14px', background: 'var(--bg-cream)', borderTop: '1px solid var(--border-sand)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={() => handleToggleProductStatus(p)}
                        title={p.status === 'ACTIVE' ? 'Click to set Inactive (hide from store)' : 'Click to set Active (show on store)'}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '5px 11px',
                          borderRadius: 999,
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          border: p.status === 'ACTIVE' ? '1px solid #A8DAB5' : '1px solid #E5B5B5',
                          background: p.status === 'ACTIVE' ? '#E6F4EA' : '#FDECEA',
                          color: p.status === 'ACTIVE' ? '#1E6F50' : '#9E2A2B',
                        }}
                      >
                        <span style={{
                          width: 7,
                          height: 7,
                          borderRadius: '50%',
                          background: p.status === 'ACTIVE' ? '#1E6F50' : '#9E2A2B'
                        }} />
                        {p.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                      </button>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          type="button"
                          onClick={() => handleEditProduct(p)}
                          style={{
                            background: '#FFFFFF',
                            color: 'var(--brand-plum)',
                            border: '1px solid var(--brand-gold)',
                            padding: '6px 12px',
                            borderRadius: 8,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                            fontWeight: 600,
                            fontSize: '0.8rem'
                          }}
                        >
                          <Pencil size={13} /> Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteProduct(p.id, p.name)}
                          style={{
                            background: '#FDECEA',
                            color: '#9E2A2B',
                            border: 'none',
                            padding: '6px 12px',
                            borderRadius: 8,
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                            fontWeight: 600,
                            fontSize: '0.8rem'
                          }}
                        >
                          <Trash2 size={14} /> Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {tab === 'orders' && (
          <div style={{ display: 'grid', gap: 14 }}>
            <h2 style={{ fontSize: '1.8rem', color: 'var(--brand-plum)', marginBottom: 6 }}>WhatsApp Customer Orders</h2>
            {orders.length === 0 ? (
              <div style={{ background: '#fff', padding: 32, borderRadius: 14, border: '1px solid var(--border-sand)', color: 'var(--text-muted)' }}>
                No orders yet. Once customers submit checkout to WhatsApp, their order reference and items appear here.
              </div>
            ) : orders.map((o) => (
              <div key={o.id} style={{ background: '#fff', padding: 20, borderRadius: 14, border: '1px solid var(--border-sand)', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <strong style={{ color: 'var(--brand-plum)', fontSize: '1.05rem' }}>{o.orderReference}</strong>
                    <span style={statusPill(o.status)}>{o.status}</span>
                  </div>
                  <div style={{ fontWeight: 600, marginTop: 4 }}>{o.customerName} • {o.customerMobile}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{o.deliveryAddress}, {o.city}, {o.state} - {o.pinCode}</div>
                  <div style={{ fontSize: '0.86rem', marginTop: 8, color: 'var(--brand-plum)' }}>
                    {o.items.map((it, idx) => (
                      <div key={idx}>• {it.productName} [{it.packName}] {it.selectedColor ? `(${it.selectedColor})` : ''} × {it.quantity}</div>
                    ))}
                  </div>
                </div>
                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 10, minWidth: 250 }}>
                  <div style={{ fontWeight: 700, fontSize: '1.2rem', color: 'var(--brand-plum)' }}>₹{Number(o.finalAmount).toLocaleString('en-IN')}</div>
                  <select value={o.status} onChange={(e) => updateOrderStatus(o.id, e.target.value)} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--brand-gold)', fontWeight: 600 }}>
                    {['PENDING', 'CONFIRMED', 'PACKED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map((st) => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                  <div style={{ background: 'var(--bg-cream)', padding: 10, borderRadius: 10, border: '1px solid var(--border-sand)', display: 'grid', gap: 6, textAlign: 'left' }}>
                    <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--brand-gold-dark)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      NimbusPost Shipment Tracking
                    </span>
                    <input
                      placeholder="NimbusPost AWB / Tracking ID"
                      value={trackingDrafts[o.id]?.trackingId !== undefined ? trackingDrafts[o.id].trackingId : (o.trackingId || '')}
                      onChange={(e) => setTrackingDrafts((prev) => ({
                        ...prev,
                        [o.id]: {
                          trackingId: e.target.value,
                          courierPartner: prev[o.id]?.courierPartner !== undefined ? prev[o.id].courierPartner : (o.courierPartner || ''),
                        },
                      }))}
                      style={{ padding: '7px 10px', borderRadius: 7, border: '1px solid var(--border-sand)', fontSize: '0.8rem' }}
                    />
                    <div style={{ display: 'flex', gap: 6 }}>
                      <input
                        placeholder="Courier (e.g. Delhivery)"
                        value={trackingDrafts[o.id]?.courierPartner !== undefined ? trackingDrafts[o.id].courierPartner : (o.courierPartner || '')}
                        onChange={(e) => setTrackingDrafts((prev) => ({
                          ...prev,
                          [o.id]: {
                            trackingId: prev[o.id]?.trackingId !== undefined ? prev[o.id].trackingId : (o.trackingId || ''),
                            courierPartner: e.target.value,
                          },
                        }))}
                        style={{ padding: '7px 10px', borderRadius: 7, border: '1px solid var(--border-sand)', fontSize: '0.8rem', flex: 1, minWidth: 0 }}
                      />
                      <button
                        type="button"
                        onClick={async () => {
                          const draft = trackingDrafts[o.id] || {};
                          const tid = draft.trackingId !== undefined ? draft.trackingId : (o.trackingId || '');
                          const cp = draft.courierPartner !== undefined ? draft.courierPartner : (o.courierPartner || '');
                          await updateOrderStatus(o.id, o.status, tid, cp);
                          alert(`Tracking details saved for ${o.orderReference}`);
                        }}
                        style={{ padding: '7px 12px', borderRadius: 7, border: 'none', background: 'var(--brand-plum)', color: '#FAF6EE', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}
                      >
                        Save AWB
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'reviews' && (
          <div style={{ display: 'grid', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <h2 style={{ fontSize: '1.8rem', color: 'var(--brand-plum)' }}>Customer Reviews &amp; Moderation</h2>
              <div style={{ display: 'flex', gap: 8 }}>
                {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setReviewFilter(st)}
                    style={{
                      padding: '7px 14px',
                      borderRadius: 8,
                      border: '1px solid var(--brand-gold)',
                      background: reviewFilter === st ? 'var(--brand-plum)' : '#fff',
                      color: reviewFilter === st ? '#FAF6EE' : 'var(--brand-plum)',
                      fontWeight: 600,
                      fontSize: '0.8rem',
                      cursor: 'pointer'
                    }}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {reviews.filter((r) => reviewFilter === 'ALL' || r.status === reviewFilter).length === 0 ? (
              <div style={{ background: '#fff', padding: 32, borderRadius: 14, border: '1px solid var(--border-sand)', color: 'var(--text-muted)' }}>
                No reviews in this filter yet.
              </div>
            ) : reviews
              .filter((r) => reviewFilter === 'ALL' || r.status === reviewFilter)
              .map((rev) => (
                <div key={rev.id} style={{ background: '#fff', padding: 20, borderRadius: 14, border: '1px solid var(--border-sand)', display: 'grid', gap: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <strong style={{ color: 'var(--brand-plum)', fontSize: '1rem' }}>{rev.customerName}</strong>
                        <span style={{ color: '#C6A163', fontWeight: 700 }}>{'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}</span>
                        {rev.verifiedPurchase && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#E6F4EA', color: '#1E6F50', padding: '2px 8px', borderRadius: 999, fontSize: '0.72rem', fontWeight: 700 }}>
                            <BadgeCheck size={13} /> Verified Purchase
                          </span>
                        )}
                        <span style={statusPill(rev.status === 'APPROVED' ? 'CONFIRMED' : rev.status === 'REJECTED' ? 'CANCELLED' : 'PENDING')}>
                          {rev.status}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--brand-gold-dark)', fontWeight: 600, marginTop: 2 }}>
                        Product: {rev.productName} • {rev.createdAt ? new Date(rev.createdAt).toLocaleDateString('en-IN') : ''}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {rev.status !== 'APPROVED' && (
                        <button type="button" onClick={() => handleReviewStatus(rev.id, 'APPROVED')} style={{ background: '#E6F4EA', color: '#1E6F50', border: '1px solid #A8DAB5', padding: '6px 12px', borderRadius: 8, fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}>
                          Approve
                        </button>
                      )}
                      {rev.status !== 'REJECTED' && (
                        <button type="button" onClick={() => handleReviewStatus(rev.id, 'REJECTED')} style={{ background: '#FDF3E1', color: '#9E7B43', border: '1px solid var(--brand-gold)', padding: '6px 12px', borderRadius: 8, fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}>
                          Reject
                        </button>
                      )}
                      <button type="button" onClick={() => handleDeleteReview(rev.id)} style={{ background: '#FDECEA', color: '#9E2A2B', border: 'none', padding: '6px 12px', borderRadius: 8, fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}>
                        Delete
                      </button>
                    </div>
                  </div>

                  <p style={{ fontSize: '0.92rem', color: 'var(--text-charcoal)' }}>{rev.comment}</p>

                  {rev.imageUrl && (
                    <img src={resolveAssetUrl(rev.imageUrl)} alt="Review" style={{ width: 76, height: 92, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--brand-gold)' }} />
                  )}

                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 4 }}>
                    <MessageSquareReply size={16} color="var(--brand-gold-dark)" />
                    <input
                      placeholder="Write official NuVaya Atelier reply..."
                      value={replyDrafts[rev.id] !== undefined ? replyDrafts[rev.id] : (rev.adminReply || '')}
                      onChange={(e) => setReplyDrafts({ ...replyDrafts, [rev.id]: e.target.value })}
                      style={inp}
                    />
                    <button type="button" onClick={() => handleReviewReply(rev.id)} className="btn-outline" style={{ padding: '9px 14px', whiteSpace: 'nowrap' }}>
                      Save Reply
                    </button>
                  </div>
                </div>
              ))}
          </div>
        )}

        {tab === 'settings' && settings && (
          <form onSubmit={saveSettings} style={{ maxWidth: 640, background: '#fff', padding: 28, borderRadius: 16, border: '1px solid var(--brand-gold)', display: 'grid', gap: 14 }}>
            <h2 style={{ fontSize: '1.7rem', color: 'var(--brand-plum)' }}>Store, Social & Footer Contact Details</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={lbl}>WhatsApp Business Number (with 91)</label>
                <input value={settings.whatsappNumber || ''} onChange={(e) => setSettings({ ...settings, whatsappNumber: e.target.value })} style={inp} />
              </div>
              <div>
                <label style={lbl}>Customer Support Phone</label>
                <input value={settings.storePhone || ''} onChange={(e) => setSettings({ ...settings, storePhone: e.target.value })} style={inp} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={lbl}>Store Support Email</label>
                <input value={settings.storeEmail || ''} onChange={(e) => setSettings({ ...settings, storeEmail: e.target.value })} style={inp} />
              </div>
              <div>
                <label style={lbl}>Free Delivery Threshold (₹)</label>
                <input type="number" value={settings.freeDeliveryThreshold || 0} onChange={(e) => setSettings({ ...settings, freeDeliveryThreshold: e.target.value })} style={inp} />
              </div>
            </div>
            <div>
              <label style={lbl}>Studio / Business Address (shown in Footer)</label>
              <input value={settings.storeAddress || ''} onChange={(e) => setSettings({ ...settings, storeAddress: e.target.value })} style={inp} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={lbl}>Instagram Profile URL</label>
                <input placeholder="https://instagram.com/nuvaya.in" value={settings.instagramUrl || ''} onChange={(e) => setSettings({ ...settings, instagramUrl: e.target.value })} style={inp} />
              </div>
              <div>
                <label style={lbl}>Facebook Page URL</label>
                <input placeholder="https://facebook.com/nuvaya.in" value={settings.facebookUrl || ''} onChange={(e) => setSettings({ ...settings, facebookUrl: e.target.value })} style={inp} />
              </div>
            </div>
            <div>
              <label style={lbl}>Top Announcement Banner</label>
              <input value={settings.announcementText || ''} onChange={(e) => setSettings({ ...settings, announcementText: e.target.value })} style={inp} />
            </div>
            <div style={{ marginTop: 10, padding: 20, borderRadius: 14, background: 'linear-gradient(135deg, #FAF5EC 0%, #F3E8D6 100%)', border: '1.5px solid var(--brand-gold)', display: 'grid', gap: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                <div>
                  <div style={{ fontSize: '0.68rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--brand-gold-dark)', fontWeight: 700 }}>
                    STOREFRONT PROMOTION CAMPAIGN
                  </div>
                  <h3 style={{ fontSize: '1.35rem', color: 'var(--brand-plum)' }}>Live Sale &amp; Offer Banner</h3>
                </div>

                <label style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '7px 14px',
                  borderRadius: 999,
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  background: settings.saleActive ? '#1E6F50' : '#FFFFFF',
                  color: settings.saleActive ? '#FFFFFF' : 'var(--brand-plum)',
                  border: settings.saleActive ? '1px solid #1E6F50' : '1px solid var(--border-sand)'
                }}>
                  <input
                    type="checkbox"
                    checked={Boolean(settings.saleActive)}
                    onChange={(e) => setSettings({ ...settings, saleActive: e.target.checked })}
                    style={{ accentColor: '#1E6F50' }}
                  />
                  {settings.saleActive ? 'SALE IS LIVE ON STORE' : 'Sale Hidden (Click to Go Live)'}
                </label>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={lbl}>Sale Type (Preset or Custom)</label>
                  <input
                    list="nuvaya-sale-types"
                    placeholder="e.g. EID FESTIVE SALE • LIVE NOW"
                    value={settings.saleType || ''}
                    onChange={(e) => setSettings({ ...settings, saleType: e.target.value })}
                    style={inp}
                  />
                  <datalist id="nuvaya-sale-types">
                    <option value="SALE IS LIVE • LIMITED TIME" />
                    <option value="EID & FESTIVE SALE LIVE" />
                    <option value="BUNDLE BONANZA • PACK OF 3 & 5" />
                    <option value="WEEKEND FLASH OFFER" />
                    <option value="NEW SEASON LAUNCH OFFER" />
                  </datalist>
                </div>
                <div>
                  <label style={lbl}>Discount / Offer Pill Badge</label>
                  <input
                    placeholder="e.g. FLAT 30% OFF + FREE SHIPPING"
                    value={settings.saleBadgeText || ''}
                    onChange={(e) => setSettings({ ...settings, saleBadgeText: e.target.value })}
                    style={inp}
                  />
                </div>
              </div>

              <div>
                <label style={lbl}>Sale Main Headline</label>
                <input
                  placeholder="e.g. Curated Hijab Bundles &amp; Korean Nidha Abayas at Festive Prices"
                  value={settings.saleTitle || ''}
                  onChange={(e) => setSettings({ ...settings, saleTitle: e.target.value })}
                  style={inp}
                />
              </div>

              <div>
                <label style={lbl}>Sale Description / Offer Details</label>
                <input
                  placeholder="e.g. Mix &amp; match your favorite everyday chiffon and jersey shades. Limited stock available."
                  value={settings.saleSubtitle || ''}
                  onChange={(e) => setSettings({ ...settings, saleSubtitle: e.target.value })}
                  style={inp}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={lbl}>Button Label</label>
                  <input
                    placeholder="e.g. Shop Sale Edit"
                    value={settings.saleCtaText || ''}
                    onChange={(e) => setSettings({ ...settings, saleCtaText: e.target.value })}
                    style={inp}
                  />
                </div>
                <div>
                  <label style={lbl}>Button Destination Link</label>
                  <select
                    value={settings.saleCtaLink || '/shop'}
                    onChange={(e) => setSettings({ ...settings, saleCtaLink: e.target.value })}
                    style={inp}
                  >
                    <option value="/shop">Entire Catalog (/shop)</option>
                    <option value="/shop?category=best-sellers">Value Packs &amp; Best Sellers</option>
                    <option value="/shop?category=hijabs">All Hijabs Collection</option>
                    <option value="/shop?category=premium-abayas">Premium Abayas Collection</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={lbl}>Sliding Sale Banner Photos (Paste multiple URLs separated by commas or upload multiple photos)</label>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                  <input
                    placeholder="https://nuvaya.co.in/campaigns/festive-sale-banner.png, https://..."
                    value={settings.saleBannerImageUrl || ''}
                    onChange={(e) => setSettings({ ...settings, saleBannerImageUrl: e.target.value })}
                    style={{ ...inp, flex: 1, minWidth: 220 }}
                  />
                  <label className="btn-outline" style={{ padding: '9px 14px', cursor: 'pointer', whiteSpace: 'nowrap', fontSize: '0.8rem' }}>
                    + Upload Slide Photo
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const fd = new FormData();
                        fd.append('file', file);
                        try {
                          const res = await axiosClient.post('/admin/media/upload', fd, {
                            headers: { 'Content-Type': 'multipart/form-data' },
                          });
                          if (res.data?.url) {
                            setSettings((prev) => {
                              const existing = (prev.saleBannerImageUrl || '').trim();
                              return {
                                ...prev,
                                saleBannerImageUrl: existing ? `${existing}, ${res.data.url}` : res.data.url,
                              };
                            });
                          }
                        } catch {
                          alert('Could not upload sale banner photo.');
                        }
                      }}
                    />
                  </label>
                </div>
                {settings.saleBannerImageUrl && (
                  <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10 }}>
                    {settings.saleBannerImageUrl
                      .split(/[,\n]+/)
                      .map((u) => u.trim())
                      .filter(Boolean)
                      .map((slideUrl, idx) => (
                        <div key={idx} style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', border: '1px solid var(--brand-gold)', height: 110 }}>
                          <img
                            src={resolveAssetUrl(slideUrl)}
                            alt={`Sale Slide ${idx + 1}`}
                            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                          />
                          <span style={{ position: 'absolute', top: 6, left: 6, background: 'rgba(35,16,25,0.85)', color: '#FAF6EE', fontSize: '0.65rem', fontWeight: 700, padding: '2px 7px', borderRadius: 999 }}>
                            Slide {idx + 1}
                          </span>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>

            <button type="submit" className="btn-primary" style={{ justifySelf: 'start', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <CheckCircle2 size={16} /> Save Store & Footer Details
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

const goldSolidBtn = {
  background: 'var(--brand-gold)',
  color: '#231019',
  border: 'none',
  padding: '10px 18px',
  borderRadius: 10,
  fontWeight: 700,
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
};

const goldGhostBtn = {
  background: 'rgba(255,255,255,0.08)',
  color: '#FAF6EE',
  border: '1px solid rgba(197,160,101,0.5)',
  padding: '10px 16px',
  borderRadius: 10,
  fontWeight: 600,
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
};

const statusPill = (status) => ({
  display: 'inline-block',
  fontSize: '0.7rem',
  fontWeight: 700,
  padding: '3px 9px',
  borderRadius: 20,
  background: status === 'DELIVERED' || status === 'CONFIRMED' ? '#E6F4EA' : status === 'CANCELLED' ? '#FDECEA' : '#FDF3E1',
  color: status === 'DELIVERED' || status === 'CONFIRMED' ? '#1E6F50' : status === 'CANCELLED' ? '#9E2A2B' : '#9E7B43',
});

const inp = { width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-sand)', fontFamily: 'inherit', fontSize: '0.9rem' };
const lbl = { display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 4, color: 'var(--text-muted)' };
const boxSection = { background: 'var(--bg-cream)', padding: 16, borderRadius: 12, border: '1px solid var(--border-sand)' };
