import React, { useMemo, useState } from 'react';
import { Sparkles, Palette, Layers, ImagePlus, Check, Upload } from 'lucide-react';
import { FALLBACK_IMAGE, resolveAssetUrl } from '../../api/axiosClient';

const DEFAULT_POSES = [
  {
    id: 'pose-1',
    label: 'Pose 1: Full Walk Drape',
    subtitle: 'Full-length editorial street walk showing natural drape & flow',
    defaultPhoto: 'https://images.unsplash.com/photo-1583391733956-6c78276477e2?auto=format&fit=crop&w=800&q=85',
  },
  {
    id: 'pose-2',
    label: 'Pose 2: Soft Portrait Angle',
    subtitle: 'Close editorial framing highlighting fabric fall & color tone',
    defaultPhoto: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=800&q=85',
  },
  {
    id: 'pose-3',
    label: 'Pose 3: Modest Styling Look',
    subtitle: 'Graceful everyday posture for catalog & bundle previews',
    defaultPhoto: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=800&q=85',
  },
];

const FABRICS = [
  {
    name: 'Modal Jersey',
    tintOpacity: 0.42,
    blendMode: 'color',
    filterCss: 'contrast(1.04) saturate(1.06)',
    note: 'Soft stretch & smooth matte-satin fall',
  },
  {
    name: 'Matte Chiffon',
    tintOpacity: 0.34,
    blendMode: 'soft-light',
    filterCss: 'contrast(0.98) brightness(1.03) saturate(0.96)',
    note: 'Light, airy drape with delicate transparency',
  },
  {
    name: 'Classic Cotton',
    tintOpacity: 0.48,
    blendMode: 'multiply',
    filterCss: 'contrast(1.08) saturate(1.02)',
    note: 'Breathable crisp weave with natural matte depth',
  },
  {
    name: 'Korean Nidha',
    tintOpacity: 0.45,
    blendMode: 'hue',
    filterCss: 'contrast(1.06) brightness(1.02) saturate(1.12)',
    note: 'Fluid luxury drape with subtle silk sheen',
  },
  {
    name: 'Leopard / Textured Print',
    tintOpacity: 0.5,
    blendMode: 'overlay',
    filterCss: 'contrast(1.12) saturate(1.15)',
    note: 'Rich textured finish with bold visual depth',
  },
];

const QUICK_SWATCHES = [
  { name: 'Forest Emerald', hex: '#1B5E4A' },
  { name: 'Midnight Plum', hex: '#2C141F' },
  { name: 'Warm Mocha', hex: '#7B5E4B' },
  { name: 'Champagne Gold', hex: '#C5A065' },
  { name: 'Obsidian Black', hex: '#191817' },
  { name: 'Dusty Rose', hex: '#A96D75' },
];

export default function ModelHijabCustomizer({
  fabricValue,
  colors = [],
  onSelectFabric,
  onAddColorToProduct,
  onAttachImageToProduct,
}) {
  const [poseId, setPoseId] = useState('pose-1');
  const [posePhotos, setPosePhotos] = useState({
    'pose-1': DEFAULT_POSES[0].defaultPhoto,
    'pose-2': DEFAULT_POSES[1].defaultPhoto,
    'pose-3': DEFAULT_POSES[2].defaultPhoto,
  });
  const [fabricName, setFabricName] = useState(fabricValue || 'Modal Jersey');
  const [hijabColor, setHijabColor] = useState(colors?.[0]?.hexCode || '#1B5E4A');
  const [colorLabel, setColorLabel] = useState(colors?.[0]?.name || 'Forest Emerald');
  const [tintIntensity, setTintIntensity] = useState(42);
  const [attachedMsg, setAttachedMsg] = useState('');

  const activePose = useMemo(
    () => DEFAULT_POSES.find((p) => p.id === poseId) || DEFAULT_POSES[0],
    [poseId]
  );

  const activeFabric = useMemo(
    () => FABRICS.find((f) => f.name.toLowerCase() === (fabricName || '').toLowerCase()) || FABRICS[0],
    [fabricName]
  );

  const currentPhotoUrl = resolveAssetUrl(posePhotos[activePose.id] || activePose.defaultPhoto);

  const handleFabricPick = (name) => {
    setFabricName(name);
    onSelectFabric?.(name);
  };

  const handleSwatchPick = (name, hex) => {
    setColorLabel(name);
    setHijabColor(hex);
  };

  const handlePoseFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setPosePhotos((prev) => ({ ...prev, [activePose.id]: reader.result }));
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleAttachCurrent = () => {
    onAttachImageToProduct?.({
      imageUrl: currentPhotoUrl,
      colorName: `${colorLabel} • ${activeFabric.name}`,
      primaryImage: false,
    });
    setAttachedMsg(`Attached ${activePose.label.split(':')[0]} (${colorLabel} • ${activeFabric.name}) to Product Photos!`);
    setTimeout(() => setAttachedMsg(''), 2500);
  };

  const overlayAlpha = Math.min(0.85, Math.max(0.08, (Number(tintIntensity) || 40) / 100));

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #FAF5EC 0%, #F4E8D6 100%)',
        padding: 18,
        borderRadius: 14,
        border: '1.5px solid var(--brand-gold)',
        display: 'grid',
        gap: 16,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Sparkles size={18} color="var(--brand-gold-dark)" />
          <div>
            <strong style={{ color: 'var(--brand-plum)', fontSize: '1rem' }}>
              Real Model Hijab Customizer (Poses, Fabric &amp; Color)
            </strong>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Adjust hijab shade and fabric look on a real model photo or upload your own pose image
            </div>
          </div>
        </div>
        {attachedMsg && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              background: '#E6F4EA',
              color: '#1E6F50',
              border: '1px solid #A8DAB5',
              padding: '5px 11px',
              borderRadius: 999,
              fontSize: '0.76rem',
              fontWeight: 700,
            }}
          >
            <Check size={14} /> {attachedMsg}
          </span>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 18, alignItems: 'start' }}>
        {/* Real Photographic Model Stage */}
        <div style={{ background: '#fff', padding: 12, borderRadius: 12, border: '1px solid var(--border-sand)', textAlign: 'center' }}>
          <div
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: 270,
              aspectRatio: '3 / 4',
              margin: '0 auto',
              borderRadius: 10,
              overflow: 'hidden',
              background: 'var(--bg-cream)',
            }}
          >
            <img
              src={currentPhotoUrl}
              onError={(e) => { e.currentTarget.src = FALLBACK_IMAGE; }}
              alt={`${activePose.label} in ${colorLabel}`}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: 'center top',
                filter: activeFabric.filterCss,
                display: 'block',
              }}
            />
            <div
              style={{
                position: 'absolute',
                inset: 0,
                backgroundColor: hijabColor,
                opacity: overlayAlpha,
                mixBlendMode: activeFabric.blendMode,
                pointerEvents: 'none',
                transition: 'all 0.2s ease',
              }}
            />
            <div
              style={{
                position: 'absolute',
                bottom: 8,
                left: 8,
                right: 8,
                display: 'flex',
                justifyContent: 'space-between',
                gap: 6,
                background: 'rgba(28, 14, 21, 0.72)',
                color: '#FAF6EE',
                padding: '5px 9px',
                borderRadius: 8,
                fontSize: '0.68rem',
                fontWeight: 600,
              }}
            >
              <span>{activeFabric.name}</span>
              <span>{colorLabel}</span>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
            {DEFAULT_POSES.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPoseId(p.id)}
                style={{
                  padding: '6px 10px',
                  borderRadius: 8,
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: poseId === p.id ? '1.5px solid var(--brand-plum)' : '1px solid var(--border-sand)',
                  background: poseId === p.id ? 'var(--brand-plum)' : '#fff',
                  color: poseId === p.id ? '#FAF6EE' : 'var(--brand-plum)',
                }}
              >
                {p.label.split(':')[0]}
              </button>
            ))}
          </div>
          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: 6 }}>{activePose.subtitle}</div>
        </div>

        {/* Controls: Fabric, Color, & Pose Photo */}
        <div style={{ display: 'grid', gap: 14 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', fontWeight: 700, color: 'var(--brand-plum)', marginBottom: 6 }}>
              <Layers size={14} /> Select Fabric Finish
            </div>
            <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
              {FABRICS.map((fab) => {
                const selected = activeFabric.name === fab.name;
                return (
                  <button
                    key={fab.name}
                    type="button"
                    onClick={() => handleFabricPick(fab.name)}
                    style={{
                      padding: '6px 11px',
                      borderRadius: 8,
                      fontSize: '0.76rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      border: selected ? '1.5px solid var(--brand-plum)' : '1px solid var(--border-sand)',
                      background: selected ? '#fff' : 'rgba(255,255,255,0.65)',
                      color: 'var(--brand-plum)',
                    }}
                  >
                    {fab.name}
                  </button>
                );
              })}
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: 4 }}>{activeFabric.note}</div>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', fontWeight: 700, color: 'var(--brand-plum)', marginBottom: 6 }}>
              <Palette size={14} /> Adjust Hijab Color &amp; Tone
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 8 }}>
              {QUICK_SWATCHES.map((sw) => (
                <button
                  key={sw.name}
                  type="button"
                  title={sw.name}
                  onClick={() => handleSwatchPick(sw.name, sw.hex)}
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    background: sw.hex,
                    cursor: 'pointer',
                    border: hijabColor.toLowerCase() === sw.hex.toLowerCase() ? '2.5px solid var(--brand-plum)' : '1px solid rgba(0,0,0,0.2)',
                  }}
                />
              ))}
              <input
                type="color"
                aria-label="Custom hijab color"
                value={hijabColor}
                onChange={(e) => setHijabColor(e.target.value)}
                style={{ width: 34, height: 28, border: 'none', background: 'none', cursor: 'pointer' }}
              />
              <input
                placeholder="Color name (e.g. Forest Emerald)"
                value={colorLabel}
                onChange={(e) => setColorLabel(e.target.value)}
                style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid var(--border-sand)', fontSize: '0.8rem', maxWidth: 155 }}
              />
              {onAddColorToProduct && (
                <button
                  type="button"
                  className="btn-outline"
                  style={{ padding: '6px 10px', fontSize: '0.74rem' }}
                  onClick={() => onAddColorToProduct({ name: colorLabel.trim() || 'Custom Shade', hexCode: hijabColor, inStock: true })}
                >
                  + Add Color Variant
                </button>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', minWidth: 85 }}>Color Depth: {tintIntensity}%</span>
              <input
                type="range"
                min={10}
                max={75}
                value={tintIntensity}
                onChange={(e) => setTintIntensity(Number(e.target.value))}
                style={{ flex: 1 }}
              />
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--brand-plum)', marginBottom: 4 }}>
              Pose Photo Source (URL or Upload Real Model Photo)
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <input
                placeholder="Paste model photo URL or Google Drive link..."
                value={posePhotos[activePose.id] || ''}
                onChange={(e) => setPosePhotos((prev) => ({ ...prev, [activePose.id]: e.target.value }))}
                style={{ flex: 1, minWidth: 180, padding: '7px 10px', borderRadius: 8, border: '1px solid var(--border-sand)', fontSize: '0.78rem' }}
              />
              <label className="btn-outline" style={{ padding: '7px 11px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: 5, cursor: 'pointer', background: '#fff' }}>
                <Upload size={13} /> Upload Pose
                <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePoseFileUpload} hidden />
              </label>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', paddingTop: 4 }}>
            <button
              type="button"
              className="btn-primary"
              style={{ padding: '9px 14px', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: 6 }}
              onClick={handleAttachCurrent}
            >
              <ImagePlus size={15} /> Attach Pose Photo to Catalog
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
