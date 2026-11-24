import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

const listeners = new Set();
let activeCount = 0;

export function setGlobalLoading(delta) {
  activeCount = Math.max(0, activeCount + delta);
  listeners.forEach((fn) => fn(activeCount > 0));
}

export default function GlobalLoadingOverlay() {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    listeners.add(setLoading);
    return () => listeners.delete(setLoading);
  }, []);

  if (!loading) return null;

  return (
    <>
      <style>{`@keyframes nuvayaSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      <div
        aria-live="polite"
        aria-label="Loading"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 2000,
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            height: 3,
            width: '100%',
            background: 'linear-gradient(90deg, var(--brand-gold), var(--brand-plum), var(--brand-gold))',
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 10 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '7px 14px',
              borderRadius: 999,
              background: 'var(--brand-plum)',
              color: '#FAF6EE',
              border: '1px solid var(--brand-gold)',
              boxShadow: '0 8px 24px rgba(35, 16, 25, 0.22)',
              fontSize: '0.78rem',
              fontWeight: 700,
              letterSpacing: '0.04em',
            }}
          >
            <Loader2 size={15} color="var(--brand-gold)" style={{ animation: 'nuvayaSpin 0.85s linear infinite' }} />
            <span>Loading...</span>
          </div>
        </div>
      </div>
    </>
  );
}
