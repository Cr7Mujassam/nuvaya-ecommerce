import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import axiosClient from '../api/axiosClient';

const CartContext = createContext(null);
const STORAGE_KEY = 'nuvaya_cart_refs_v1';

export function CartProvider({ children }) {
  const [cartRefs, setCartRefs] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; } catch { return []; }
  });
  const [hydratedItems, setHydratedItems] = useState([]);
  const [storeSettings, setStoreSettings] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cartRefs));
  }, [cartRefs]);

  const hydrate = useCallback(async () => {
    const [settingsRes, ...prodRes] = await Promise.all([
      axiosClient.get('/store/settings').catch(() => ({ data: null })),
      ...Array.from(new Set(cartRefs.map((i) => i.productId))).map((id) =>
        axiosClient.get(`/products/${id}`).catch(() => null)
      ),
    ]);
    if (settingsRes?.data) setStoreSettings(settingsRes.data);
    const map = new Map();
    prodRes.forEach((r) => { if (r?.data) map.set(r.data.id, r.data); });

    const resolved = cartRefs.map((ref) => {
      const product = map.get(ref.productId);
      if (!product) return null;
      const pack = ref.packId ? product.packs?.find((p) => p.id === ref.packId) : null;
      const orig = pack ? Number(pack.packPrice) : Number(product.basePrice);
      const eff = pack ? Number(pack.discountPrice || pack.packPrice) : Number(product.discountPrice || product.basePrice);
      const img = product.images?.find((im) => im.colorName?.toLowerCase() === ref.selectedColor?.toLowerCase())
        || product.images?.find((im) => im.primaryImage) || product.images?.[0];
      return {
        ...ref,
        product,
        pack,
        productName: product.name,
        imageUrl: img?.imageUrl || '',
        effectiveUnitPrice: eff,
        lineOriginalTotal: orig * ref.quantity,
        lineEffectiveTotal: eff * ref.quantity,
        lineDiscount: Math.max(0, (orig - eff) * ref.quantity),
      };
    }).filter(Boolean);
    setHydratedItems(resolved);
  }, [cartRefs]);

  useEffect(() => { hydrate(); }, [hydrate]);

  const addItem = (item) => {
    const key = `${item.productId}-${item.packId || 0}-${item.selectedColor || ''}-${(item.mixedColors || []).join('|')}-${item.selectedSize || ''}`;
    setCartRefs((prev) => {
      const idx = prev.findIndex((x) => x.key === key);
      if (idx > -1) {
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + (item.quantity || 1) };
        return next;
      }
      return [...prev, { ...item, key, quantity: item.quantity || 1 }];
    });
    setDrawerOpen(true);
  };

  const updateQuantity = (key, delta) => {
    setCartRefs((prev) => prev.map((x) => x.key === key ? { ...x, quantity: x.quantity + delta } : x).filter((x) => x.quantity > 0));
  };

  const removeItem = (key) => setCartRefs((prev) => prev.filter((x) => x.key !== key));
  const clearCart = () => { setCartRefs([]); localStorage.removeItem(STORAGE_KEY); };

  const subtotal = hydratedItems.reduce((s, i) => s + i.lineOriginalTotal, 0);
  const discounts = hydratedItems.reduce((s, i) => s + i.lineDiscount, 0);
  const net = subtotal - discounts;
  let deliveryCharges = hydratedItems.reduce((s, i) => {
    const t = i.product.deliveryChargeType;
    const f = Number(i.product.deliveryChargeAmount || 0);
    const pf = Number(i.pack?.packDeliveryCharge || 0);
    if (t === 'FREE') return s;
    if (t === 'FIXED_PER_PRODUCT') return s + f;
    if (t === 'PER_PACK_OPTION') return s + pf;
    if (t === 'PER_QUANTITY') return s + f * i.quantity;
    return s;
  }, 0);
  if (storeSettings?.freeDeliveryThresholdEnabled && net >= Number(storeSettings.freeDeliveryThreshold || 0)) {
    deliveryCharges = 0;
  }
  const totalAmount = net + deliveryCharges;

  return (
    <CartContext.Provider value={{
      items: hydratedItems, subtotal, discounts, deliveryCharges, totalAmount,
      storeSettings, drawerOpen, setDrawerOpen, addItem, updateQuantity, removeItem, clearCart
    }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
