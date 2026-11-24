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
        role="status"
        aria-live="polite"
        aria-label="Loading"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 2000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(35, 16, 25, 0.28)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
          pointerEvents: 'auto',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 10,
            padding: '22px 30px',
            borderRadius: 18,
            background: '#FAF6EE',
            color: 'var(--brand-plum)',
            border: '1.5px solid var(--brand-gold)',
            boxShadow: '0 20px 50px rgba(35, 16, 25, 0.28)',
          }}
        >
          <Loader2
            size={32}
            color="var(--brand-plum)"
            style={{ animation: 'nuvayaSpin 0.85s linear infinite' }}
          />
          <span
            style={{
              fontSize: '0.84rem',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            Loading...
          </span>
        </div>
      </div>
    </>
  );
}
