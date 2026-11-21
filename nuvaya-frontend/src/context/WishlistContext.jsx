import React, { createContext, useContext, useEffect, useState } from 'react';

const WishlistContext = createContext(null);
const STORAGE_KEY = 'nuvaya_wishlist_ids';

export function WishlistProvider({ children }) {
  const [wishlistIds, setWishlistIds] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed.map(Number) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(wishlistIds));
    } catch {
      // Ignore storage quota errors
    }
  }, [wishlistIds]);

  const isWishlisted = (productId) => wishlistIds.includes(Number(productId));

  const toggleWishlist = (productId) => {
    const id = Number(productId);
    setWishlistIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [id, ...prev]
    );
  };

  const removeFromWishlist = (productId) => {
    const id = Number(productId);
    setWishlistIds((prev) => prev.filter((item) => item !== id));
  };

  const clearWishlist = () => setWishlistIds([]);

  return (
    <WishlistContext.Provider
      value={{
        wishlistIds,
        wishlistCount: wishlistIds.length,
        isWishlisted,
        toggleWishlist,
        removeFromWishlist,
        clearWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) {
    return {
      wishlistIds: [],
      wishlistCount: 0,
      isWishlisted: () => false,
      toggleWishlist: () => {},
      removeFromWishlist: () => {},
      clearWishlist: () => {},
    };
  }
  return ctx;
}
