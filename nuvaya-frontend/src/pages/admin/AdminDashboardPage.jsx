import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Trash2, Upload, Package, ShoppingBag, Settings,
  LayoutDashboard, Layers, LogOut, Sparkles, AlertTriangle, CheckCircle2, ExternalLink, Pencil, X, Star, BadgeCheck, MessageSquareReply, Wallet
} from 'lucide-react';
import axiosClient, { FALLBACK_IMAGE, resolveAssetUrl } from '../../api/axiosClient';

const emptyProductForm = {
  name: '',
  sku: '',
  mainCategoryId: '',
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
  premiumHijab: false,
  everydayHijab: false,
  deliveryChargeType: 'FREE',
  deliveryChargeAmount: 0,
  colors: [{ name: 'Black', hexCode: '#191817', inStock: true }],
  images: [],
  packs: [],
};

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState({ todayRequests: 0, uniqueVisitorsToday: 0, last7DaysRequests: 0, totalRequests: 0, topPages: [], recentRequests: [] });
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [newCatForm, setNewCatForm] = useState({ name: '', parentCategoryId: '', description: '' });
  const [savingCat, setSavingCat] = useState(false);
  const [orders, setOrders] = useState([]);
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('ALL');

  const getOrderItemImage = (it) => {
    if (it.imageUrl) return it.imageUrl;
    const prod = (products || []).find((pr) =>
      (it.productId && String(pr.id) === String(it.productId)) ||
      (it.sku && pr.sku && String(pr.sku).trim().toLowerCase() === String(it.sku).trim().toLowerCase())
    );
    if (!prod) return "";
    const colorName = String(it.selectedColor || "").trim().toLowerCase();
    if (colorName && Array.isArray(prod.colors)) {
      const matchedColor = prod.colors.find((c) =>
        String(c.name || c.colorName || "").trim().toLowerCase() === colorName
      );
      if (matchedColor) {
        const cImg = matchedColor.imageUrl || matchedColor.image || (Array.isArray(matchedColor.imageUrls) && matchedColor.imageUrls[0]);
        if (cImg) return cImg;
      }
    }
    if (prod.mainImage) return prod.mainImage;
    if (Array.isArray(prod.imageUrls) && prod.imageUrls.length > 0) return prod.imageUrls[0];
    if (Array.isArray(prod.images) && prod.images.length > 0) {
      const first = prod.images[0];
      return typeof first === "string" ? first : (first.url || first.imageUrl || "");
    }
    return "";
  };

  const [reviews, setReviews] = useState([]);
  const [reviewFilter, setReviewFilter] = useState('ALL');
  const [replyDrafts, setReplyDrafts] = useState({});
  const [trackingDrafts, setTrackingDrafts] = useState({});
  const [settings, setSettings] = useState(null);
  const [testingEmail, setTestingEmail] = useState(false);
  const [testEmailResult, setTestEmailResult] = useState(null);
  const todayIso = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
  const [ledgerEntries, setLedgerEntries] = useState([]);
  const [ledgerForm, setLedgerForm] = useState({
    entryDate: todayIso,
    entryType: 'EXPENSE',
    founderName: 'Mujassam',
    category: 'Fabric & Sourcing',
    title: '',
    amount: '',
    notes: '',
  });
  const [founderFilter, setFounderFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('');
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
      const [dashRes, prodRes, catRes, ordRes, setRes, revRes, anaRes, ledRes] = await Promise.all([
        axiosClient.get('/admin/dashboard'),
        axiosClient.get('/admin/products?size=100'),
        axiosClient.get('/categories'),
        axiosClient.get('/admin/orders'),
        axiosClient.get('/store/settings'),
        axiosClient.get('/admin/reviews?size=100').catch(() => ({ data: { content: [] } })),
        axiosClient.get('/admin/analytics').catch(() => ({ data: { todayRequests: 0, uniqueVisitorsToday: 0, last7DaysRequests: 0, totalRequests: 0, topPages: [], recentRequests: [] } })),
        axiosClient.get('/admin/ledger').catch(() => ({ data: [] })),
      ]);
      setStats(dashRes.data);
      setProducts(prodRes.data.content || []);
      setCategories(catRes.data || []);
      setOrders(ordRes.data.content || []);
      setSettings(setRes.data);
      setReviews(revRes.data?.content || []);
      if (anaRes?.data) setAnalytics(anaRes.data);
      if (Array.isArray(ledRes?.data)) setLedgerEntries(ledRes.data);
      if (catRes.data?.length && !form.mainCategoryId && !form.categoryId) {
        const roots = catRes.data.filter((c) => !c.parentCategoryId);
        const firstRoot = roots[0] || catRes.data[0];
        const firstChild = catRes.data.find((c) => String(c.parentCategoryId) === String(firstRoot.id));
        setForm((prev) => ({
          ...prev,
          mainCategoryId: String(firstRoot.id),
          categoryId: firstChild ? String(firstChild.id) : String(firstRoot.id),
        }));
      }
    } catch {
      navigate('/admin/login');
    }
  };

  useEffect(() => { loadAll(); }, []);

  const mainCategories = categories.filter((c) => !c.parentCategoryId);
  const subCategoriesFor = (parentId) =>
    categories.filter((c) => String(c.parentCategoryId) === String(parentId));

  const resetForm = () => {
    setEditingProductId(null);
    const firstRoot = mainCategories[0] || categories[0];
    const firstChild = firstRoot ? subCategoriesFor(firstRoot.id)[0] : null;
    setForm({
      ...emptyProductForm,
      mainCategoryId: firstRoot ? String(firstRoot.id) : '',
      categoryId: firstChild ? String(firstChild.id) : (firstRoot ? String(firstRoot.id) : ''),
    });
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
    const matchedObj =
      categories.find((c) => String(c.id) === String(product.categoryId) || c.name === product.categoryName) ||
      categories[0];
    const resolvedMainId = matchedObj?.parentCategoryId ? String(matchedObj.parentCategoryId) : String(matchedObj?.id || '');
    const resolvedSubId = matchedObj?.parentCategoryId ? String(matchedObj.id) : '';

    setEditingProductId(product.id);
    setForm({
      name: product.name || '',
      sku: product.sku || '',
      mainCategoryId: resolvedMainId,
      categoryId: resolvedSubId || resolvedMainId,
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
      premiumHijab: Boolean(product.premiumHijab),
      everydayHijab: Boolean(product.everydayHijab),
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

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!newCatForm.name.trim() || savingCat) return;
    setSavingCat(true);
    try {
      await axiosClient.post('/admin/categories', {
        name: newCatForm.name.trim(),
        parentCategoryId: newCatForm.parentCategoryId ? Number(newCatForm.parentCategoryId) : null,
        description: newCatForm.description.trim(),
      });
      setNewCatForm({ name: '', parentCategoryId: newCatForm.parentCategoryId, description: '' });
      await loadAll();
    } catch (err) {
      alert(err.response?.data?.message || 'Could not create category.');
    } finally {
      setSavingCat(false);
    }
  };

  const handleDeleteCategory = async (cat) => {
    if (!window.confirm(`Delete "${cat.name}"?`)) return;
    try {
      await axiosClient.delete(`/admin/categories/${cat.id}`);
      await loadAll();
    } catch (err) {
      alert(err.response?.data?.message || 'Could not delete category.');
    }
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
        premiumHijab: Boolean(form.premiumHijab),
        everydayHijab: Boolean(form.everydayHijab),
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
      premiumHijab: Boolean(product.premiumHijab),
      everydayHijab: Boolean(product.everydayHijab),
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

  const deleteOrder = async (orderId, ref) => {
    if (!window.confirm(`Permanently delete order ${ref}? This cannot be undone.`)) return;
    try {
      await axiosClient.delete(`/admin/orders/${orderId}`);
      setOrders((prev) => prev.filter((item) => item.id !== orderId));
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete order");
    }
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

  const handleAddLedgerEntry = async (e) => {
    e.preventDefault();
    const numAmt = Number(ledgerForm.amount);
    if (!ledgerForm.title.trim() || !numAmt || numAmt <= 0) return;
    try {
      const { data } = await axiosClient.post('/admin/ledger', {
        entryDate: ledgerForm.entryDate || todayIso,
        entryType: ledgerForm.entryType || 'EXPENSE',
        founderName: ledgerForm.founderName || 'Mujassam',
        category: ledgerForm.category || 'General',
        title: ledgerForm.title.trim(),
        amount: numAmt,
        notes: ledgerForm.notes.trim(),
      });
      setLedgerEntries((prev) =>
        [data, ...prev].sort((a, b) => String(b.entryDate).localeCompare(String(a.entryDate)) || b.id - a.id)
      );
      setLedgerForm((prev) => ({
        ...prev,
        title: '',
        amount: '',
        notes: '',
      }));
    } catch (err) {
      alert(err.response?.data?.message || 'Could not save ledger entry to database.');
    }
  };

  const handleDeleteLedgerEntry = async (id) => {
    if (!window.confirm('Delete this investment/expense record from database?')) return;
    try {
      await axiosClient.delete(`/admin/ledger/${id}`);
      setLedgerEntries((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      alert(err.response?.data?.message || 'Could not delete record.');
    }
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
            { id: 'categories', label: `Categories (${categories.length})`, icon: Layers },
            { id: 'orders', label: `WhatsApp Orders (${orders.length})`, icon: ShoppingBag },
            { id: 'reviews', label: `Reviews (${reviews.length})`, icon: Star },
            { id: 'expenses', label: `Invest & Expenses (${ledgerEntries.length})`, icon: Wallet },
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
                { label: 'Website Requests (Today)', value: analytics.todayRequests ?? 0, sub: `${analytics.uniqueVisitorsToday ?? 0} Unique visitors • ${analytics.totalRequests ?? 0} total`, icon: ExternalLink, accent: '#1B4965' },
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

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20 }}>
              <div style={{ background: "#fff", padding: 22, borderRadius: 16, border: "1px solid var(--border-sand)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <h3 style={{ margin: 0, color: "var(--brand-plum)", fontSize: "1.1rem" }}>Top Visited Pages (7 Days)</h3>
                  <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--brand-gold-dark)" }}>{analytics.last7DaysRequests ?? 0} Requests</span>
                </div>
                {(analytics.topPages || []).length === 0 ? (
                  <div style={{ color: "var(--text-muted)", fontSize: "0.86rem" }}>Visitor traffic will appear here as shoppers browse nuvaya.co.in.</div>
                ) : (
                  <div style={{ display: "grid", gap: 8 }}>
                    {analytics.topPages.map((pg) => (
                      <div key={pg.path} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", borderRadius: 10, background: "var(--bg-cream)", fontSize: "0.86rem" }}>
                        <span style={{ fontWeight: 600, color: "var(--brand-plum)", wordBreak: "break-all" }}>{pg.path}</span>
                        <span style={{ fontWeight: 700, color: "#1E6F50", marginLeft: 10 }}>{pg.views}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ background: "#fff", padding: 22, borderRadius: 16, border: "1px solid var(--border-sand)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <h3 style={{ margin: 0, color: "var(--brand-plum)", fontSize: "1.1rem" }}>Latest Incoming Requests</h3>
                  <button type="button" onClick={loadAll} style={{ padding: "4px 10px", borderRadius: 8, border: "1px solid var(--border-sand)", background: "var(--bg-cream)", fontSize: "0.76rem", fontWeight: 700, cursor: "pointer" }}>Refresh</button>
                </div>
                {(analytics.recentRequests || []).length === 0 ? (
                  <div style={{ color: "var(--text-muted)", fontSize: "0.86rem" }}>No requests logged yet.</div>
                ) : (
                  <div style={{ display: "grid", gap: 7, maxHeight: 240, overflowY: "auto" }}>
                    {analytics.recentRequests.map((req) => (
                      <div key={req.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 10px", borderRadius: 8, border: "1px solid var(--border-sand)", fontSize: "0.8rem" }}>
                        <span style={{ fontWeight: 600, color: "var(--brand-plum)" }}>{req.path}</span>
                        <span style={{ color: "var(--text-muted)", fontSize: "0.74rem" }}>{String(req.visitedAt).replace("T", " ").slice(0, 16)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
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
                    <label style={lbl}>Main Category *</label>
                    <select
                      required
                      value={form.mainCategoryId || ''}
                      onChange={(e) => {
                        const nextMain = e.target.value;
                        const kids = subCategoriesFor(nextMain);
                        setForm({
                          ...form,
                          mainCategoryId: nextMain,
                          categoryId: kids[0] ? String(kids[0].id) : nextMain,
                        });
                      }}
                      style={inp}
                    >
                      {(mainCategories.length ? mainCategories : categories).map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={lbl}>Sub-Category</label>
                    <select
                      value={subCategoriesFor(form.mainCategoryId).some((sc) => String(sc.id) === String(form.categoryId)) ? String(form.categoryId) : ''}
                      onChange={(e) => {
                        const subVal = e.target.value;
                        setForm({
                          ...form,
                          categoryId: subVal || form.mainCategoryId,
                        });
                      }}
                      style={inp}
                    >
                      <option value="">-- Direct under Main Category --</option>
                      {subCategoriesFor(form.mainCategoryId).map((sc) => (
                        <option key={sc.id} value={sc.id}>{sc.name}</option>
                      ))}
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
                    <label style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: '0.88rem', fontWeight: 600, color: 'var(--brand-plum)' }}>
                      <input type="checkbox" checked={Boolean(form.premiumHijab)} onChange={(e) => setForm({ ...form, premiumHijab: e.target.checked })} /> Premium Hijab
                    </label>
                    <label style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: '0.88rem', fontWeight: 600, color: 'var(--brand-plum)' }}>
                      <input type="checkbox" checked={Boolean(form.everydayHijab)} onChange={(e) => setForm({ ...form, everydayHijab: e.target.checked })} /> Everyday Hijab
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

        {tab === 'categories' && (
          <div style={{ display: 'grid', gap: 24 }}>
            <div style={{ background: '#fff', padding: 26, borderRadius: 16, border: '1.5px solid var(--brand-gold)' }}>
              <div style={{ fontSize: '0.72rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--brand-gold-dark)', fontWeight: 700 }}>
                Catalog Taxonomy
              </div>
              <h2 style={{ fontSize: '1.75rem', color: 'var(--brand-plum)', marginBottom: 16 }}>
                Add Main Category or Sub-Category
              </h2>
              <form onSubmit={handleCreateCategory} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, alignItems: 'end' }}>
                <div>
                  <label style={lbl}>Parent Category (leave blank for Main Category)</label>
                  <select
                    value={newCatForm.parentCategoryId}
                    onChange={(e) => setNewCatForm({ ...newCatForm, parentCategoryId: e.target.value })}
                    style={inp}
                  >
                    <option value="">None (Create as Main Category — e.g. Hijabs, Abayas)</option>
                    {mainCategories.map((mc) => (
                      <option key={mc.id} value={mc.id}>Under: {mc.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={lbl}>{newCatForm.parentCategoryId ? 'Sub-Category Name *' : 'Main Category Name *'}</label>
                  <input
                    required
                    placeholder={newCatForm.parentCategoryId ? 'e.g. Cotton Hijabs / Korean Nidha Abaya' : 'e.g. Hijabs / Abayas / Accessories'}
                    value={newCatForm.name}
                    onChange={(e) => setNewCatForm({ ...newCatForm, name: e.target.value })}
                    style={inp}
                  />
                </div>
                <div>
                  <label style={lbl}>Short Description (Optional)</label>
                  <input
                    placeholder="Shown on collection header..."
                    value={newCatForm.description}
                    onChange={(e) => setNewCatForm({ ...newCatForm, description: e.target.value })}
                    style={inp}
                  />
                </div>
                <button type="submit" disabled={savingCat} className="btn-primary" style={{ height: 44 }}>
                  {savingCat ? 'Saving...' : newCatForm.parentCategoryId ? '+ Add Sub-Category' : '+ Add Main Category'}
                </button>
              </form>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 18 }}>
              {mainCategories.map((mc) => {
                const kids = subCategoriesFor(mc.id);
                return (
                  <div key={mc.id} style={{ background: '#fff', padding: 20, borderRadius: 16, border: '1px solid var(--border-sand)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 10, borderBottom: '1px solid var(--border-sand)' }}>
                      <div>
                        <span style={{ fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.12em', color: 'var(--brand-gold-dark)', textTransform: 'uppercase' }}>Main Category</span>
                        <h3 style={{ margin: '2px 0 0', color: 'var(--brand-plum)', fontSize: '1.25rem' }}>{mc.name}</h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteCategory(mc)}
                        title="Delete Main Category"
                        style={{ background: '#FDECEA', color: '#9E2A2B', border: 'none', borderRadius: 8, padding: '6px 10px', cursor: 'pointer' }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                    <div style={{ marginTop: 12 }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8 }}>
                        Sub-Categories ({kids.length})
                      </div>
                      {kids.length === 0 ? (
                        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>No sub-categories added yet.</div>
                      ) : (
                        <div style={{ display: 'grid', gap: 6 }}>
                          {kids.map((sc) => (
                            <div key={sc.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 12px', borderRadius: 10, background: 'var(--bg-cream)' }}>
                              <span style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--brand-plum)' }}>{sc.name}</span>
                              <button
                                type="button"
                                onClick={() => handleDeleteCategory(sc)}
                                style={{ background: 'transparent', color: '#9E2A2B', border: 'none', cursor: 'pointer', padding: 4 }}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {tab === 'orders' && (() => {
          const q = orderSearch.trim().toLowerCase();
          const filteredOrders = orders.filter((o) => {
            if (orderStatusFilter !== 'ALL' && o.status !== orderStatusFilter) return false;
            if (!q) return true;
            const refMatch = String(o.orderReference || '').toLowerCase().includes(q);
            const custMatch = String(o.customerName || '').toLowerCase().includes(q) || String(o.customerMobile || '').toLowerCase().includes(q);
            const itemMatch = (o.items || []).some((it) =>
              String(it.sku || '').toLowerCase().includes(q) ||
              String(it.productName || '').toLowerCase().includes(q) ||
              String(it.selectedColor || '').toLowerCase().includes(q)
            );
            return refMatch || custMatch || itemMatch;
          });

          return (
            <div style={{ display: 'grid', gap: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                <h2 style={{ fontSize: '1.8rem', color: 'var(--brand-plum)', margin: 0 }}>Customer Orders & Packing Desk</h2>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                  <input
                    type="text"
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    placeholder="Search SKU, item, order ID, or customer..."
                    style={{ padding: '9px 14px', borderRadius: 10, border: '1px solid var(--border-sand)', background: '#fff', minWidth: 270, fontSize: '0.88rem' }}
                  />
                  <select
                    value={orderStatusFilter}
                    onChange={(e) => setOrderStatusFilter(e.target.value)}
                    style={{ padding: '9px 12px', borderRadius: 10, border: '1px solid var(--border-sand)', background: '#fff', fontWeight: 600, fontSize: '0.86rem' }}
                  >
                    {['ALL', 'PENDING', 'CONFIRMED', 'PACKED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map((st) => (
                      <option key={st} value={st}>{st === 'ALL' ? 'All Statuses' : st}</option>
                    ))}
                  </select>
                </div>
              </div>
              {filteredOrders.length === 0 ? (
                <div style={{ background: '#fff', padding: 32, borderRadius: 14, border: '1px solid var(--border-sand)', color: 'var(--text-muted)' }}>
                  {orders.length === 0
                    ? 'No orders yet. Once customers submit checkout to WhatsApp, their order reference and items appear here.'
                    : `No orders match "${orderSearch}".`}
                </div>
              ) : filteredOrders.map((o) => (
                <div key={o.id} style={{ background: '#fff', padding: 20, borderRadius: 14, border: '1px solid var(--border-sand)', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                      <strong style={{ color: 'var(--brand-plum)', fontSize: '1.05rem' }}>{o.orderReference}</strong>
                      <span style={statusPill(o.status)}>{o.status}</span>
                      {o.paymentMethod && <span style={{ fontSize: '0.68rem', fontWeight: 800, padding: '3px 9px', borderRadius: 999, background: o.paymentStatus === 'PAID' ? '#E6F4EA' : '#FFF4E5', color: o.paymentStatus === 'PAID' ? '#1E6F50' : '#9A5B13' }}>{o.paymentMethod} • {o.paymentStatus || 'PENDING'}</span>}
                    </div>
                    <div style={{ fontWeight: 600, marginTop: 4 }}>{o.customerName} • <a href={`https://wa.me/91${String(o.customerMobile || "").replace(/\D/g, "").slice(-10)}?text=${encodeURIComponent(`Assalamu Alaikum ${o.customerName}, your NUVAYA order *${o.orderReference}* status is *${o.status}*.${o.trackingId ? ` Tracking AWB: ${o.trackingId}` : ""} Track live: https://nuvaya.co.in/track-order?ref=${o.orderReference}`)}`} target="_blank" rel="noreferrer" style={{ color: "#1E6F50", fontWeight: 600, textDecoration: "underline" }} title="Send Free WhatsApp Status Update">{o.customerMobile} (WhatsApp)</a>{o.customerEmail ? ` • ${o.customerEmail}` : ''}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{o.deliveryAddress}, {o.city}, {o.state} - {o.pinCode}</div>
                    <div style={{ fontSize: '0.86rem', marginTop: 10, color: 'var(--brand-plum)', display: 'grid', gap: 5 }}>
                      {(o.items || []).map((it, idx) => {
                        const skuText = it.sku || `PRD-${it.productId}`;
                        const itemImg = getOrderItemImage(it);
                        const isMatch = q && (
                          String(it.sku || '').toLowerCase().includes(q) ||
                          String(it.productName || '').toLowerCase().includes(q) ||
                          String(it.selectedColor || '').toLowerCase().includes(q)
                        );
                        return (
                          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', padding: isMatch ? '6px 10px' : '2px 0', borderRadius: 8, background: isMatch ? '#FFF8E7' : 'transparent', border: isMatch ? '1px solid var(--brand-gold)' : 'none' }}>
                            {itemImg && (
                              <img
                                src={itemImg}
                                alt={`${skuText} - ${it.productName}`}
                                style={{
                                  width: isMatch ? 54 : 36,
                                  height: isMatch ? 54 : 36,
                                  objectFit: 'cover',
                                  borderRadius: 7,
                                  border: isMatch ? '2px solid var(--brand-gold)' : '1px solid var(--border-sand)',
                                  flexShrink: 0,
                                  background: '#FAF6F0'
                                }}
                              />
                            )}
                            <span style={{ fontFamily: 'monospace', fontSize: '0.76rem', fontWeight: 700, padding: '2px 7px', borderRadius: 5, background: '#F4EFEA', color: 'var(--brand-plum)', border: '1px solid var(--border-sand)' }}>
                              SKU: {skuText}
                            </span>
                            <span>
                              <strong>{it.productName}</strong> [{it.packName}] {it.selectedColor ? `(${it.selectedColor})` : ''} × <strong>{it.quantity}</strong>
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 10, minWidth: 250 }}>
                  <div style={{ fontWeight: 700, fontSize: '1.2rem', color: 'var(--brand-plum)' }}>₹{Number(o.finalAmount).toLocaleString('en-IN')}</div>
                  <select value={o.status} onChange={(e) => updateOrderStatus(o.id, e.target.value)} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--brand-gold)', fontWeight: 600 }}>
                    {['PENDING', 'CONFIRMED', 'PACKED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map((st) => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => deleteOrder(o.id, o.orderReference)}
                    style={{
                      padding: "6px 10px",
                      borderRadius: 8,
                      border: "1px solid #F5C2C7",
                      background: o.status === "CANCELLED" ? "#FDECEA" : "#FFF",
                      color: "#842029",
                      fontSize: "0.78rem",
                      fontWeight: 700,
                      cursor: "pointer"
                    }}
                  >
                    Delete Order
                  </button>
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
          );
        })()}

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

        {tab === 'expenses' && (() => {
          const sumBy = (type, founder = null) =>
            ledgerEntries
              .filter((x) => x.entryType === type && (!founder || x.founderName === founder))
              .reduce((sum, x) => sum + Number(x.amount || 0), 0);

          const totalInvested = sumBy('INVESTMENT');
          const totalSpent = sumBy('EXPENSE');
          const netBalance = totalInvested - totalSpent;

          const faizanInvested = sumBy('INVESTMENT', 'Faizan');
          const faizanSpent = sumBy('EXPENSE', 'Faizan');

          const mujassamInvested = sumBy('INVESTMENT', 'Mujassam');
          const mujassamSpent = sumBy('EXPENSE', 'Mujassam');

          const sharedInvested = sumBy('INVESTMENT', 'Shared');
          const sharedSpent = sumBy('EXPENSE', 'Shared');

          const filteredEntries = ledgerEntries.filter((item) => {
            const matchFounder = founderFilter === 'ALL' || item.founderName === founderFilter;
            const matchType = typeFilter === 'ALL' || item.entryType === typeFilter;
            const matchDate = !dateFilter || String(item.entryDate) === dateFilter;
            return matchFounder && matchType && matchDate;
          });

          return (
            <div style={{ display: 'grid', gap: 20 }}>
              {/* Overall & Per-Founder Investment vs Expenditure Summary */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(215px, 1fr))', gap: 16 }}>
                {[
                  {
                    label: 'Total Capital Invested',
                    value: `₹${totalInvested.toLocaleString('en-IN')}`,
                    sub: `Faizan ₹${faizanInvested.toLocaleString('en-IN')} • Mujassam ₹${mujassamInvested.toLocaleString('en-IN')}`,
                    accent: '#1E6F50',
                  },
                  {
                    label: 'Total Brand Expenditure',
                    value: `₹${totalSpent.toLocaleString('en-IN')}`,
                    sub: `Faizan ₹${faizanSpent.toLocaleString('en-IN')} • Mujassam ₹${mujassamSpent.toLocaleString('en-IN')}`,
                    accent: '#9E2A2B',
                  },
                  {
                    label: 'Net Capital Balance',
                    value: `₹${netBalance.toLocaleString('en-IN')}`,
                    sub: netBalance >= 0 ? 'Invested minus Expenditure' : 'Expenditure exceeds Invested',
                    accent: '#2C141F',
                  },
                  {
                    label: 'Faizan Contribution',
                    value: `₹${(faizanInvested + faizanSpent).toLocaleString('en-IN')}`,
                    sub: `Invested ₹${faizanInvested.toLocaleString('en-IN')} • Spent ₹${faizanSpent.toLocaleString('en-IN')}`,
                    accent: '#1B4965',
                  },
                  {
                    label: 'Mujassam Contribution',
                    value: `₹${(mujassamInvested + mujassamSpent).toLocaleString('en-IN')}`,
                    sub: `Invested ₹${mujassamInvested.toLocaleString('en-IN')} • Spent ₹${mujassamSpent.toLocaleString('en-IN')}`,
                    accent: '#9E7B43',
                  },
                  {
                    label: 'Shared / Joint Entries',
                    value: `₹${(sharedInvested + sharedSpent).toLocaleString('en-IN')}`,
                    sub: `Invested ₹${sharedInvested.toLocaleString('en-IN')} • Spent ₹${sharedSpent.toLocaleString('en-IN')}`,
                    accent: '#6D5B62',
                  },
                ].map((c) => (
                  <div key={c.label} style={{ background: '#fff', padding: 18, borderRadius: 14, border: '1px solid var(--border-sand)', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: c.accent }} />
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>{c.label}</div>
                    <div style={{ fontSize: '1.65rem', fontWeight: 700, color: 'var(--brand-plum)', marginTop: 5 }}>{c.value}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>{c.sub}</div>
                  </div>
                ))}
              </div>

              {/* Add Investment or Expenditure Form (Saved in Database) */}
              <form onSubmit={handleAddLedgerEntry} style={{ background: '#fff', padding: 24, borderRadius: 16, border: '1.5px solid var(--brand-gold)', display: 'grid', gap: 14 }}>
                <div>
                  <div style={{ fontSize: '0.7rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--brand-gold-dark)', fontWeight: 700 }}>
                    DATABASE-BACKED FOUNDER CAPITAL &amp; EXPENSE LEDGER
                  </div>
                  <h2 style={{ fontSize: '1.6rem', color: 'var(--brand-plum)', margin: '2px 0 0' }}>
                    Record Investment or Expenditure — Faizan &amp; Mujassam
                  </h2>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(165px, 1fr))', gap: 12 }}>
                  <div>
                    <label style={lbl}>Entry Type *</label>
                    <select
                      value={ledgerForm.entryType}
                      onChange={(e) => {
                        const nextType = e.target.value;
                        setLedgerForm({
                          ...ledgerForm,
                          entryType: nextType,
                          category: nextType === 'INVESTMENT' ? 'Seed Capital' : 'Fabric & Sourcing',
                        });
                      }}
                      style={inp}
                    >
                      <option value="EXPENSE">Expenditure (Expense)</option>
                      <option value="INVESTMENT">Capital Investment</option>
                    </select>
                  </div>
                  <div>
                    <label style={lbl}>Date *</label>
                    <input type="date" required value={ledgerForm.entryDate} onChange={(e) => setLedgerForm({ ...ledgerForm, entryDate: e.target.value })} style={inp} />
                  </div>
                  <div>
                    <label style={lbl}>Founder *</label>
                    <select value={ledgerForm.founderName} onChange={(e) => setLedgerForm({ ...ledgerForm, founderName: e.target.value })} style={inp}>
                      <option value="Faizan">Faizan</option>
                      <option value="Mujassam">Mujassam</option>
                      <option value="Shared">Shared (Faizan &amp; Mujassam)</option>
                    </select>
                  </div>
                  <div>
                    <label style={lbl}>Category</label>
                    <select value={ledgerForm.category} onChange={(e) => setLedgerForm({ ...ledgerForm, category: e.target.value })} style={inp}>
                      {ledgerForm.entryType === 'INVESTMENT' ? (
                        <>
                          <option value="Seed Capital">Seed Capital</option>
                          <option value="Inventory Fund">Inventory Fund</option>
                          <option value="Marketing Fund">Marketing Fund</option>
                          <option value="Operations Fund">Operations Fund</option>
                        </>
                      ) : (
                        <>
                          <option value="Fabric & Sourcing">Fabric &amp; Sourcing</option>
                          <option value="Packaging & Labels">Packaging &amp; Labels</option>
                          <option value="Shipping & Courier">Shipping &amp; Courier</option>
                          <option value="Ads & Marketing">Ads &amp; Marketing</option>
                          <option value="Domain & Hosting">Domain &amp; Hosting</option>
                          <option value="Other">Other</option>
                        </>
                      )}
                    </select>
                  </div>
                  <div>
                    <label style={lbl}>Amount (₹) *</label>
                    <input type="number" min="1" step="0.01" required placeholder="e.g. 5000" value={ledgerForm.amount} onChange={(e) => setLedgerForm({ ...ledgerForm, amount: e.target.value })} style={inp} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                  <div>
                    <label style={lbl}>{ledgerForm.entryType === 'INVESTMENT' ? 'Investment Purpose / Source *' : 'Expense Item / Purpose *'}</label>
                    <input
                      required
                      placeholder={ledgerForm.entryType === 'INVESTMENT' ? 'e.g. Initial stock capital deposit' : 'e.g. Modal Jersey rolls / Custom pouches / Meta ads'}
                      value={ledgerForm.title}
                      onChange={(e) => setLedgerForm({ ...ledgerForm, title: e.target.value })}
                      style={inp}
                    />
                  </div>
                  <div>
                    <label style={lbl}>Notes (Optional)</label>
                    <input placeholder="UPI ref, bank transfer note, vendor name..." value={ledgerForm.notes} onChange={(e) => setLedgerForm({ ...ledgerForm, notes: e.target.value })} style={inp} />
                  </div>
                </div>

                <div>
                  <button type="submit" className="btn-primary" style={{ padding: '11px 24px' }}>
                    {ledgerForm.entryType === 'INVESTMENT' ? '+ Save Investment to Database' : '+ Save Expenditure to Database'}
                  </button>
                </div>
              </form>

              {/* Date-Wise Ledger History */}
              <div style={{ background: '#fff', padding: 22, borderRadius: 16, border: '1px solid var(--border-sand)', display: 'grid', gap: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                  <h3 style={{ margin: 0, color: 'var(--brand-plum)', fontSize: '1.25rem' }}>
                    Date-Wise Investment &amp; Expenditure Ledger ({filteredEntries.length})
                  </h3>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    {['ALL', 'INVESTMENT', 'EXPENSE'].map((tp) => (
                      <button
                        key={tp}
                        type="button"
                        onClick={() => setTypeFilter(tp)}
                        style={{
                          padding: '6px 11px',
                          borderRadius: 8,
                          border: '1px solid var(--brand-gold)',
                          background: typeFilter === tp ? '#1E6F50' : '#fff',
                          color: typeFilter === tp ? '#fff' : 'var(--brand-plum)',
                          fontWeight: 700,
                          fontSize: '0.75rem',
                          cursor: 'pointer',
                        }}
                      >
                        {tp === 'ALL' ? 'All Types' : tp === 'INVESTMENT' ? 'Investments' : 'Expenses'}
                      </button>
                    ))}
                    {['ALL', 'Faizan', 'Mujassam', 'Shared'].map((f) => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => setFounderFilter(f)}
                        style={{
                          padding: '6px 11px',
                          borderRadius: 8,
                          border: '1px solid var(--brand-gold)',
                          background: founderFilter === f ? 'var(--brand-plum)' : '#fff',
                          color: founderFilter === f ? '#FAF6EE' : 'var(--brand-plum)',
                          fontWeight: 700,
                          fontSize: '0.75rem',
                          cursor: 'pointer',
                        }}
                      >
                        {f}
                      </button>
                    ))}
                    <input
                      type="date"
                      value={dateFilter}
                      onChange={(e) => setDateFilter(e.target.value)}
                      style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid var(--border-sand)', fontSize: '0.78rem' }}
                    />
                    {dateFilter && (
                      <button type="button" onClick={() => setDateFilter('')} style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid var(--border-sand)', background: 'var(--bg-cream)', fontSize: '0.75rem', cursor: 'pointer' }}>
                        Clear Date
                      </button>
                    )}
                  </div>
                </div>

                {filteredEntries.length === 0 ? (
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', padding: '12px 0' }}>
                    No investment or expense records found for the selected filter.
                  </div>
                ) : (
                  <div style={{ display: 'grid', gap: 10 }}>
                    {filteredEntries.map((ex) => {
                      const isInv = ex.entryType === 'INVESTMENT';
                      return (
                        <div key={ex.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, padding: '12px 16px', borderRadius: 12, background: isInv ? '#F2FBF6' : 'var(--bg-cream)', border: isInv ? '1px solid #B7DFC1' : '1px solid var(--border-sand)' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                              <span style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--brand-gold-dark)' }}>{ex.entryDate}</span>
                              <span style={{ fontWeight: 800, fontSize: '0.7rem', padding: '2px 9px', borderRadius: 999, background: isInv ? '#1E6F50' : '#9E2A2B', color: '#fff' }}>
                                {isInv ? 'INVESTMENT' : 'EXPENSE'}
                              </span>
                              <span style={{ fontWeight: 800, fontSize: '0.72rem', padding: '2px 9px', borderRadius: 999, background: '#2C141F', color: '#FAF6EE' }}>{ex.founderName}</span>
                              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>{ex.category}</span>
                            </div>
                            <div style={{ fontWeight: 700, color: 'var(--brand-plum)', fontSize: '0.98rem', marginTop: 4 }}>{ex.title}</div>
                            {ex.notes && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2 }}>{ex.notes}</div>}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <span style={{ fontWeight: 800, fontSize: '1.1rem', color: isInv ? '#1E6F50' : 'var(--brand-plum)' }}>
                              {isInv ? '+' : '−'}₹{Number(ex.amount).toLocaleString('en-IN')}
                            </span>
                            <button type="button" onClick={() => handleDeleteLedgerEntry(ex.id)} style={{ background: '#FDECEA', color: '#9E2A2B', border: 'none', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', fontSize: '0.76rem', fontWeight: 700 }}>
                              Delete
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })()}

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
            <button type="button" className="btn-outline" disabled={testingEmail} style={{marginLeft:10}} onClick={async()=>{setTestingEmail(true);setTestEmailResult(null);try{const {data}=await axiosClient.post("/admin/test-email");setTestEmailResult(data);}catch(e){setTestEmailResult({sent:false,error:e.response?.data?.message||e.message});}finally{setTestingEmail(false);}}}>{testingEmail?"Testing SMTP...":"Send Test Email"}</button>
            {testEmailResult&&(<div style={{marginTop:10,padding:12,borderRadius:10,fontSize:"0.84rem",background:testEmailResult.sent?"#E6F4EA":"#FDECEA",color:testEmailResult.sent?"#1E6F50":"#842029",border:`1px solid ${testEmailResult.sent?"#B7DFC1":"#F5C2C7"}`}}>{testEmailResult.sent?`Success! Sent from ${testEmailResult.from} to ${testEmailResult.to}`:`SMTP Error (${testEmailResult.host||"SMTP"}:${testEmailResult.port||"587"}): ${testEmailResult.error}`}</div>)}
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
