import React, { useEffect, useState } from 'react';
import { Star, BadgeCheck, Upload, MessageSquareReply, CheckCircle2 } from 'lucide-react';
import axiosClient, { FALLBACK_IMAGE, resolveAssetUrl } from '../../api/axiosClient';

function StarRow({ value, size = 16, interactive = false, onSelect }) {
  const [hover, setHover] = useState(0);
  const activeVal = interactive && hover > 0 ? hover : value;
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= Math.round(activeVal);
        return (
          <button
            key={star}
            type="button"
            disabled={!interactive}
            onClick={() => interactive && onSelect?.(star)}
            onMouseEnter={() => interactive && setHover(star)}
            onMouseLeave={() => interactive && setHover(0)}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: interactive ? 'pointer' : 'default',
              display: 'inline-flex',
              color: filled ? '#C6A163' : '#D9CEBC'
            }}
            aria-label={`${star} star`}
          >
            <Star size={size} fill={filled ? '#C6A163' : 'transparent'} strokeWidth={1.8} />
          </button>
        );
      })}
    </div>
  );
}

export default function ProductReviewsSection({ productId }) {
  const [summary, setSummary] = useState({
    averageRating: 0,
    totalReviews: 0,
    ratingBreakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    reviews: [],
    hasMore: false,
  });
  const [sortBy, setSortBy] = useState('recent');
  const [page, setPage] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [orderReference, setOrderReference] = useState('');
  const [customerMobile, setCustomerMobile] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitNotice, setSubmitNotice] = useState('');
  const [submitError, setSubmitError] = useState('');

  const fetchReviews = async (nextPage = 0, append = false, nextSort = sortBy) => {
    try {
      const res = await axiosClient.get(`/products/${productId}/reviews`, {
        params: { sortBy: nextSort, page: nextPage, size: 5 },
      });
      const data = res.data;
      setSummary((prev) => ({
        ...data,
        reviews: append ? [...prev.reviews, ...(data.reviews || [])] : (data.reviews || []),
      }));
      setPage(nextPage);
    } catch {
      // Keep zero-state cleanly if backend is waking up
    }
  };

  useEffect(() => {
    fetchReviews(0, false, sortBy);
  }, [productId, sortBy]);

  const handleLoadMore = async () => {
    setLoadingMore(true);
    await fetchReviews(page + 1, true, sortBy);
    setLoadingMore(false);
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setSubmitError('');
    try {
      const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8083';
      const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
      const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'nuvaya_products';
      const fd = new FormData();
      fd.append('file', file);

      if (cloudName) {
        fd.append('upload_preset', uploadPreset);
        const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: 'POST', body: fd });
        const data = await res.json();
        if (data.secure_url) setImageUrl(data.secure_url);
      } else {
        const res = await fetch(`${base}/api/v1/products/reviews/upload-image`, { method: 'POST', body: fd });
        const data = await res.json();
        if (data.imageUrl) setImageUrl(data.imageUrl);
      }
    } catch {
      setSubmitError('Photo upload failed (max 5MB JPG/PNG/WebP).');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError('');
    setSubmitNotice('');
    try {
      await axiosClient.post(`/products/${productId}/reviews`, {
        customerName,
        rating,
        comment,
        imageUrl: imageUrl || null,
        orderReference: orderReference.trim() || null,
        customerMobile: customerMobile.trim() || null,
      });
      setCustomerName('');
      setRating(5);
      setComment('');
      setOrderReference('');
      setCustomerMobile('');
      setImageUrl('');
      setShowForm(false);
      setSubmitNotice('Thank you! Your review has been submitted and will appear once approved by the NuVaya Atelier team.');
    } catch (err) {
      setSubmitError(err.response?.data?.message || 'Unable to submit review. Please check your details and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const total = Number(summary.totalReviews || 0);
  const avg = Number(summary.averageRating || 0);

  return (
    <section style={{ maxWidth: 1160, margin: '64px auto 40px', padding: '44px 20px 0', borderTop: '1px solid var(--border-sand)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16, marginBottom: 28 }}>
        <div>
          <div style={{ fontSize: '0.7rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--brand-gold-dark)', fontWeight: 700 }}>
            CLIENT IMPRESSIONS
          </div>
          <h2 style={{ fontSize: '2.2rem', color: 'var(--brand-plum)', lineHeight: 1.1 }}>Customer Reviews &amp; Ratings</h2>
        </div>

        <button type="button" onClick={() => { setShowForm(!showForm); setSubmitNotice(''); }} className="btn-primary">
          {showForm ? 'Close Review Form' : 'Write a Review'}
        </button>
      </div>

      {submitNotice && (
        <div style={{ background: '#E6F4EA', border: '1px solid #A8DAB5', color: '#1E6F50', padding: '14px 18px', borderRadius: 12, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.9rem', fontWeight: 500 }}>
          <CheckCircle2 size={18} /> {submitNotice}
        </div>
      )}

      {/* Summary + 5-to-1 Star Breakdown */}
      <div style={{
        background: '#FFFFFF',
        borderRadius: 18,
        border: '1px solid rgba(198,161,99,0.4)',
        padding: '28px 26px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: 32,
        alignItems: 'center',
        marginBottom: 30,
        boxShadow: '0 10px 28px -12px rgba(39,16,27,0.08)'
      }}>
        <div style={{ textAlign: 'center', padding: '10px 0' }}>
          <div className="editorial" style={{ fontSize: '3.6rem', fontWeight: 700, color: 'var(--brand-plum)', lineHeight: 1 }}>
            {total > 0 ? avg.toFixed(1) : '0.0'}
            <span style={{ fontSize: '1.3rem', color: 'var(--text-muted)', fontWeight: 500 }}> / 5</span>
          </div>
          <div style={{ margin: '10px 0 8px' }}>
            <StarRow value={avg} size={20} />
          </div>
          <div style={{ fontSize: '0.86rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            {total === 0 ? 'No verified reviews yet' : `Based on ${total} approved ${total === 1 ? 'review' : 'reviews'}`}
          </div>
        </div>

        <div style={{ display: 'grid', gap: 9 }}>
          {[5, 4, 3, 2, 1].map((star) => {
            const count = Number(summary.ratingBreakdown?.[star] || 0);
            const pct = total > 0 ? Math.round((count / total) * 100) : 0;
            return (
              <div key={star} style={{ display: 'grid', gridTemplateColumns: '54px 1fr 48px', alignItems: 'center', gap: 10, fontSize: '0.84rem' }}>
                <span style={{ fontWeight: 600, color: 'var(--brand-plum)' }}>{star} ★</span>
                <div style={{ height: 8, borderRadius: 999, background: 'var(--bg-cream)', overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg, #9B773E, #C6A163)', borderRadius: 999, transition: 'width 0.35s ease' }} />
                </div>
                <span style={{ textAlign: 'right', color: 'var(--text-muted)', fontSize: '0.8rem' }}>{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Write a Review Form */}
      {showForm && (
        <form onSubmit={handleSubmit} style={{
          background: '#FFFFFF',
          borderRadius: 18,
          border: '1.5px solid var(--brand-gold)',
          padding: 28,
          marginBottom: 32,
          display: 'grid',
          gap: 16,
          boxShadow: '0 14px 36px rgba(39,16,27,0.08)'
        }}>
          <h3 style={{ fontSize: '1.65rem', color: 'var(--brand-plum)' }}>Share Your Experience</h3>

          {submitError && (
            <div style={{ background: '#FDECEA', color: '#9E2A2B', padding: '10px 14px', borderRadius: 10, fontSize: '0.86rem', fontWeight: 600 }}>
              {submitError}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
            <div>
              <label style={lbl}>Your Name *</label>
              <input required placeholder="e.g. Ayesha Siddiqui" value={customerName} onChange={(e) => setCustomerName(e.target.value)} style={inp} />
            </div>
            <div>
              <label style={lbl}>Your Rating *</label>
              <div style={{ paddingTop: 6 }}>
                <StarRow value={rating} size={24} interactive onSelect={setRating} />
              </div>
            </div>
          </div>

          <div>
            <label style={lbl}>Written Review *</label>
            <textarea
              required
              rows={3}
              placeholder="How did the fabric drape, breathability, and shade feel in person?"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              style={inp}
            />
          </div>

          {/* Optional Verified Purchase Credentials */}
          <div style={{ background: 'var(--bg-cream)', padding: 16, borderRadius: 12, border: '1px solid var(--border-sand)' }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--brand-plum)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
              <BadgeCheck size={16} color="#1E6F50" /> Verify Your Purchase (Optional)
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 10 }}>
              Enter your WhatsApp Order Reference ID and mobile number to display a <strong>Verified Purchase</strong> badge on your review.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
              <input
                placeholder="Order Reference (e.g. NVY-2026...)"
                value={orderReference}
                onChange={(e) => setOrderReference(e.target.value)}
                style={inp}
              />
              <input
                placeholder="Registered Mobile Number"
                value={customerMobile}
                onChange={(e) => setCustomerMobile(e.target.value)}
                style={inp}
              />
            </div>
          </div>

          {/* Optional Customer Photo Upload */}
          <div>
            <label style={lbl}>Upload Product Photo (Optional)</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <label className="btn-outline" style={{ padding: '9px 16px', fontSize: '0.76rem' }}>
                <Upload size={14} /> {uploading ? 'Uploading...' : 'Choose Photo'}
                <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhotoUpload} hidden />
              </label>
              {imageUrl && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <img src={resolveAssetUrl(imageUrl)} alt="Preview" style={{ width: 54, height: 66, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--brand-gold)' }} />
                  <button type="button" onClick={() => setImageUrl('')} style={{ background: 'none', border: 'none', color: '#9E2A2B', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
                    Remove
                  </button>
                </div>
              )}
            </div>
          </div>

          <div>
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? 'Submitting Review...' : 'Submit Review'}
            </button>
          </div>
        </form>
      )}

      {/* Sort & Reviews List */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
        <div style={{ fontWeight: 600, color: 'var(--brand-plum)', fontSize: '0.92rem' }}>
          Showing {summary.reviews.length} of {total} {total === 1 ? 'review' : 'reviews'}
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          style={{ padding: '9px 14px', borderRadius: 10, border: '1px solid var(--border-sand)', background: '#fff', fontFamily: 'inherit', fontSize: '0.85rem', color: 'var(--brand-plum)' }}
        >
          <option value="recent">Sort: Most Recent</option>
          <option value="highest">Sort: Highest Rated</option>
          <option value="lowest">Sort: Lowest Rated</option>
        </select>
      </div>

      {summary.reviews.length === 0 ? (
        <div style={{ background: '#FFFFFF', padding: 36, borderRadius: 16, border: '1px solid var(--border-sand)', textAlign: 'center', color: 'var(--text-muted)' }}>
          Be the first to share your thoughts on this NuVaya piece.
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 16 }}>
          {summary.reviews.map((rev) => (
            <div key={rev.id} style={{ background: '#FFFFFF', padding: '22px 24px', borderRadius: 16, border: '1px solid rgba(198,161,99,0.32)', boxShadow: '0 6px 20px -10px rgba(39,16,27,0.06)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10, marginBottom: 8 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <strong style={{ color: 'var(--brand-plum)', fontSize: '1rem' }}>{rev.customerName}</strong>
                    {rev.verifiedPurchase && (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        background: '#E6F4EA',
                        color: '#1E6F50',
                        border: '1px solid #B7E1C4',
                        padding: '2px 9px',
                        borderRadius: 999,
                        fontSize: '0.7rem',
                        fontWeight: 700
                      }}>
                        <BadgeCheck size={13} /> Verified Purchase
                      </span>
                    )}
                  </div>
                  <div style={{ marginTop: 4 }}>
                    <StarRow value={rev.rating} size={15} />
                  </div>
                </div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {rev.createdAt ? new Date(rev.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                </span>
              </div>

              <p style={{ color: 'var(--text-charcoal)', fontSize: '0.94rem', lineHeight: 1.65, marginTop: 8 }}>
                {rev.comment}
              </p>

              {rev.imageUrl && (
                <div style={{ marginTop: 12 }}>
                  <img
                    src={resolveAssetUrl(rev.imageUrl)}
                    onError={(e) => { e.currentTarget.src = FALLBACK_IMAGE; }}
                    alt="Customer review"
                    style={{ width: 96, height: 118, objectFit: 'cover', borderRadius: 10, border: '1px solid var(--brand-gold)' }}
                  />
                </div>
              )}

              {rev.adminReply && (
                <div style={{
                  marginTop: 14,
                  background: 'var(--bg-cream)',
                  borderLeft: '3px solid var(--brand-gold)',
                  padding: '12px 16px',
                  borderRadius: '0 10px 10px 0'
                }}>
                  <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--brand-plum)', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <MessageSquareReply size={14} color="var(--brand-gold-dark)" /> Response from NuVaya Atelier
                  </div>
                  <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>{rev.adminReply}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {summary.hasMore && (
        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <button type="button" onClick={handleLoadMore} disabled={loadingMore} className="btn-outline">
            {loadingMore ? 'Loading...' : 'Load More Reviews'}
          </button>
        </div>
      )}
    </section>
  );
}

const inp = { width: '100%', padding: '10px 12px', borderRadius: 9, border: '1px solid var(--border-sand)', fontFamily: 'inherit', fontSize: '0.9rem', background: '#fff' };
const lbl = { display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 5, color: 'var(--text-muted)' };
