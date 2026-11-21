import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PackageSearch, CheckCircle2, Truck, Clock, PackageCheck, ExternalLink, Copy, Check, AlertCircle } from 'lucide-react';
import axiosClient from '../../api/axiosClient';

const STEPS = [
  { key: 'PENDING', label: 'Order Placed', desc: 'Awaiting WhatsApp verification', icon: Clock },
  { key: 'CONFIRMED', label: 'Confirmed', desc: 'Order verified by NuVaya Atelier', icon: CheckCircle2 },
  { key: 'PACKED', label: 'Packed', desc: 'Quality checked & packed for dispatch', icon: PackageCheck },
  { key: 'SHIPPED', label: 'Shipped', desc: 'Handed over to courier partner', icon: Truck },
  { key: 'DELIVERED', label: 'Delivered', desc: 'Delivered to your doorstep', icon: CheckCircle2 },
];

export default function TrackOrderPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [orderIdInput, setOrderIdInput] = useState(searchParams.get('ref') || '');
  const [trackingData, setTrackingData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const fetchOrder = async (refToSearch) => {
    const clean = (refToSearch || '').trim();
    if (!clean) return;
    setLoading(true);
    setError('');
    setTrackingData(null);
    try {
      const res = await axiosClient.get(`/orders/track/${encodeURIComponent(clean)}`);
      setTrackingData(res.data);
      setSearchParams({ ref: clean });
    } catch (err) {
      setError(err.response?.data?.message || 'We could not find an order matching that Order ID. Please check your WhatsApp confirmation message.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initialRef = searchParams.get('ref');
    if (initialRef) {
      setOrderIdInput(initialRef);
      fetchOrder(initialRef);
    }
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchOrder(orderIdInput);
  };

  const copyTrackingId = () => {
    if (!trackingData?.trackingId) return;
    navigator.clipboard?.writeText(trackingData.trackingId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const rawStatus = (trackingData?.status || '').toUpperCase();
  const normalizedStatus = rawStatus === 'PROCESSING' ? 'PACKED' : rawStatus;
  const currentStepIndex = trackingData
    ? STEPS.findIndex((s) => s.key === normalizedStatus)
    : -1;

  return (
    <div style={{ maxWidth: 860, margin: '48px auto 80px', padding: '0 20px' }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <span style={{ fontSize: '0.72rem', letterSpacing: '0.24em', color: 'var(--brand-gold-dark)', fontWeight: 700, textTransform: 'uppercase' }}>
          NuVaya Concierge Dispatch
        </span>
        <h1 style={{ fontSize: 'clamp(1.9rem, 3.5vw, 2.6rem)', color: 'var(--brand-plum)', marginTop: 6, marginBottom: 10 }}>
          Track Your Order &amp; Shipment
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.94rem', maxWidth: 540, margin: '0 auto' }}>
          Enter your NuVaya Order ID (e.g. <strong>NVY-20261121-XXXXX</strong>) to view live confirmation status and your NimbusPost courier tracking number.
        </p>
      </div>

      <form
        onSubmit={handleSearch}
        style={{
          background: '#FFFFFF',
          padding: 16,
          borderRadius: 18,
          border: '1.5px solid var(--brand-gold)',
          boxShadow: '0 16px 36px rgba(39,16,27,0.07)',
          display: 'flex',
          gap: 12,
          flexWrap: 'wrap',
          marginBottom: 28
        }}
      >
        <div style={{ flex: 1, minWidth: 230, display: 'flex', alignItems: 'center', gap: 10, padding: '0 12px' }}>
          <PackageSearch size={20} color="var(--brand-gold-dark)" />
          <input
            value={orderIdInput}
            onChange={(e) => setOrderIdInput(e.target.value)}
            placeholder="Enter Order ID (e.g. NVY-20261121-A1B2C)"
            required
            style={{ width: '100%', border: 'none', outline: 'none', fontSize: '0.96rem', color: 'var(--brand-plum)', fontWeight: 600 }}
          />
        </div>
        <button type="submit" className="btn-primary" disabled={loading} style={{ padding: '12px 26px', borderRadius: 12 }}>
          {loading ? 'Searching...' : 'Track Order'}
        </button>
      </form>

      {error && (
        <div style={{ background: '#FDECEA', border: '1px solid #F5C2C7', color: '#842029', padding: 16, borderRadius: 14, display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
          <AlertCircle size={20} />
          <span style={{ fontSize: '0.92rem' }}>{error}</span>
        </div>
      )}

      {trackingData && (
        <div style={{ background: '#FFFFFF', borderRadius: 20, border: '1px solid var(--border-sand)', overflow: 'hidden', boxShadow: '0 20px 48px rgba(39,16,27,0.08)' }}>
          <div style={{ background: 'linear-gradient(135deg, #231019 0%, #3A1728 100%)', color: '#FAF6EE', padding: '24px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
            <div>
              <div style={{ fontSize: '0.7rem', letterSpacing: '0.18em', color: 'var(--brand-gold)', textTransform: 'uppercase', fontWeight: 700 }}>
                Order Reference
              </div>
              <div style={{ fontSize: '1.35rem', fontWeight: 700, marginTop: 2 }}>{trackingData.orderReference}</div>
              <div style={{ fontSize: '0.84rem', color: '#DFD1BE', marginTop: 4 }}>
                {trackingData.customerName} • Destination: {trackingData.city}, {trackingData.state} ({trackingData.pinCode})
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{
                display: 'inline-block',
                padding: '6px 14px',
                borderRadius: 999,
                background: rawStatus === 'CANCELLED' ? '#9E2A2B' : 'var(--brand-gold)',
                color: rawStatus === 'CANCELLED' ? '#FFF' : '#231019',
                fontWeight: 800,
                fontSize: '0.75rem',
                letterSpacing: '0.12em'
              }}>
                {rawStatus}
              </span>
              <div style={{ fontSize: '0.85rem', color: '#DFD1BE', marginTop: 6 }}>
                Total: ₹{Number(trackingData.finalAmount).toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          <div style={{ padding: '28px' }}>
            <div style={{
              background: 'var(--bg-cream)',
              border: '1.5px solid var(--brand-gold)',
              borderRadius: 16,
              padding: 20,
              marginBottom: 28,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 16
            }}>
              <div>
                <div style={{ fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.16em', color: 'var(--brand-gold-dark)', textTransform: 'uppercase' }}>
                  NimbusPost Courier Tracking
                </div>
                {trackingData.trackingId ? (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
                      <span style={{ fontSize: '1.22rem', fontWeight: 800, color: 'var(--brand-plum)', letterSpacing: '0.04em' }}>
                        {trackingData.trackingId}
                      </span>
                      <button
                        type="button"
                        onClick={copyTrackingId}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 8, border: '1px solid var(--brand-gold)', background: '#fff', color: 'var(--brand-plum)', fontSize: '0.74rem', fontWeight: 700, cursor: 'pointer' }}
                      >
                        {copied ? <><Check size={13} /> Copied</> : <><Copy size={13} /> Copy AWB</>}
                      </button>
                    </div>
                    {trackingData.courierPartner && (
                      <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginTop: 4 }}>
                        Courier Partner: <strong style={{ color: 'var(--brand-plum)' }}>{trackingData.courierPartner}</strong>
                      </div>
                    )}
                  </>
                ) : (
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: 6 }}>
                    {rawStatus === 'PENDING'
                      ? 'Your order is currently awaiting confirmation on WhatsApp. Once confirmed & dispatched, your NimbusPost AWB Tracking ID will appear right here.'
                      : 'Your order is confirmed! Our team is preparing your parcel and will update your NimbusPost AWB Tracking ID shortly.'}
                  </p>
                )}
              </div>

              {trackingData.trackingId && (
                <a
                  href={`https://ship.nimbuspost.com/shipping/tracking/${encodeURIComponent(trackingData.trackingId)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 20px', borderRadius: 12, fontSize: '0.8rem' }}
                >
                  Track Live on NimbusPost <ExternalLink size={15} />
                </a>
              )}
            </div>

            {rawStatus !== 'CANCELLED' && (
              <div style={{ marginBottom: 28 }}>
                <h3 style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--brand-gold-dark)', marginBottom: 16 }}>
                  Order Journey
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
                  {STEPS.map((step, idx) => {
                    const Icon = step.icon;
                    const completed = currentStepIndex >= idx;
                    const isCurrent = currentStepIndex === idx;
                    return (
                      <div
                        key={step.key}
                        style={{
                          padding: 15,
                          borderRadius: 14,
                          border: isCurrent
                            ? '2px solid var(--brand-gold)'
                            : completed
                              ? '1.5px solid #2F1422'
                              : '1px solid var(--border-sand)',
                          background: completed
                            ? 'linear-gradient(145deg, #231019 0%, #3A1728 100%)'
                            : '#FAFAFA',
                          color: completed ? '#FAF6EE' : 'var(--text-muted)',
                          boxShadow: isCurrent ? '0 10px 24px rgba(35,16,25,0.22)' : 'none',
                          opacity: completed ? 1 : 0.55,
                          transition: 'all 0.25s ease'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Icon size={19} color={completed ? 'var(--brand-gold)' : 'var(--text-muted)'} />
                          {completed && (
                            <span style={{
                              fontSize: '0.62rem',
                              fontWeight: 800,
                              letterSpacing: '0.08em',
                              textTransform: 'uppercase',
                              padding: '2px 7px',
                              borderRadius: 999,
                              background: isCurrent ? 'var(--brand-gold)' : 'rgba(198,161,99,0.22)',
                              color: isCurrent ? '#231019' : 'var(--brand-gold)'
                            }}>
                              {isCurrent ? 'Current' : 'Done'}
                            </span>
                          )}
                        </div>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: completed ? '#FFFFFF' : 'var(--brand-plum)', marginTop: 10 }}>
                          {step.label}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: completed ? '#DFD1BE' : 'var(--text-muted)', marginTop: 4, lineHeight: 1.4 }}>
                          {step.desc}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div>
              <h3 style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--brand-gold-dark)', marginBottom: 10 }}>
                Items in This Order
              </h3>
              <div style={{ display: 'grid', gap: 8 }}>
                {trackingData.items?.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 10, background: 'var(--bg-ivory)', fontSize: '0.88rem' }}>
                    <span>
                      <strong>{item.productName}</strong> ({item.packName}{item.selectedColor ? ` • ${item.selectedColor}` : ''}) × {item.quantity}
                    </span>
                    <span style={{ fontWeight: 700, color: 'var(--brand-plum)' }}>₹{Number(item.lineTotal).toLocaleString('en-IN')}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
