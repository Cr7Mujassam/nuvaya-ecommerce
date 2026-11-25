import React, { useMemo, useRef, useState } from 'react';
import { Sparkles, Palette, Layers, ImagePlus, Check } from 'lucide-react';

const POSES = [
  {
    id: 'front',
    label: 'Pose 1: Front Drape',
    subtitle: 'Centered modest drape & shoulder flow',
    drapeCurve: 'M 95 145 Q 150 112 205 145 L 228 295 Q 150 325 72 295 Z',
    foldPath1: 'M 112 152 Q 124 225 104 302',
    foldPath2: 'M 188 152 Q 176 225 196 302',
    headCutout: 'M 124 148 Q 150 124 176 148 Q 178 198 150 212 Q 122 198 124 148 Z',
  },
  {
    id: 'side',
    label: 'Pose 2: Side & Shoulder Wrap',
    subtitle: 'Angled profile showing cascading fabric tail',
    drapeCurve: 'M 88 142 Q 152 108 208 144 L 242 318 Q 155 335 76 286 Z',
    foldPath1: 'M 118 150 Q 135 230 115 304',
    foldPath2: 'M 178 148 Q 198 232 224 316',
    headCutout: 'M 122 146 Q 150 122 174 146 Q 176 196 148 210 Q 120 196 122 146 Z',
  },
  {
    id: 'closeup',
    label: 'Pose 3: Soft Drape Close-Up',
    subtitle: 'Detailed fabric weave, sheen & edge finish',
    drapeCurve: 'M 82 132 Q 150 96 218 132 L 236 322 Q 150 342 64 322 Z',
    foldPath1: 'M 106 142 Q 118 235 94 324',
    foldPath2: 'M 194 142 Q 182 235 206 324',
    headCutout: 'M 120 142 Q 150 116 180 142 Q 182 198 150 214 Q 118 198 120 142 Z',
  },
];

const FABRICS = [
  {
    name: 'Modal Jersey',
    opacity: 0.94,
    sheenOpacity: 0.14,
    strokeDash: 'none',
    note: 'Ultra-soft stretch & matte-satin flow',
  },
  {
    name: 'Matte Chiffon',
    opacity: 0.84,
    sheenOpacity: 0.22,
    strokeDash: '4 3',
    note: 'Featherlight airy drape with subtle sheen',
  },
  {
    name: 'Classic Cotton',
    opacity: 0.97,
    sheenOpacity: 0.06,
    strokeDash: '2 2',
    note: 'Breathable crisp weave for all-day comfort',
  },
  {
    name: 'Korean Nidha',
    opacity: 0.92,
    sheenOpacity: 0.28,
    strokeDash: 'none',
    note: 'Fluid luxury fall with soft silk luster',
  },
  {
    name: 'Leopard / Textured Print',
    opacity: 0.93,
    sheenOpacity: 0.16,
    strokeDash: '6 4',
    note: 'Statement textured drape with rich contrast',
  },
];

const QUICK_SWATCHES = [
  { name: 'Midnight Plum', hex: '#2C141F' },
  { name: 'Warm Mocha', hex: '#7B5E4B' },
  { name: 'Champagne Gold', hex: '#C5A065' },
  { name: 'Emerald Olive', hex: '#2D4F3E' },
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
  const [poseId, setPoseId] = useState('front');
  const [fabricName, setFabricName] = useState(fabricValue || 'Modal Jersey');
  const [hijabColor, setHijabColor] = useState(colors?.[0]?.hexCode || '#7B5E4B');
  const [colorLabel, setColorLabel] = useState(colors?.[0]?.name || 'Warm Mocha');
  const [attachedMsg, setAttachedMsg] = useState('');
  const svgRef = useRef(null);

  const activePose = useMemo(
    () => POSES.find((p) => p.id === poseId) || POSES[0],
    [poseId]
  );

  const activeFabric = useMemo(
    () => FABRICS.find((f) => f.name.toLowerCase() === (fabricName || '').toLowerCase()) || FABRICS[0],
    [fabricName]
  );

  const handleFabricPick = (name) => {
    setFabricName(name);
    onSelectFabric?.(name);
  };

  const handleSwatchPick = (name, hex) => {
    setColorLabel(name);
    setHijabColor(hex);
  };

  const renderSvgMarkup = (poseObj) => {
    const patternId = `nvy-weave-${poseObj.id}`;
    const sheenId = `nvy-sheen-${poseObj.id}`;
    return `
      <svg xmlns="http://www.w3.org/2000/svg" width="300" height="380" viewBox="0 0 300 380">
        <defs>
          <linearGradient id="bgGrad-${poseObj.id}" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#FAF5EC"/>
            <stop offset="100%" stop-color="#EFE4D2"/>
          </linearGradient>
          <linearGradient id="${sheenId}" x1="0" y1="0" x2="1" y2="0.8">
            <stop offset="0%" stop-color="#FFFFFF" stop-opacity="${activeFabric.sheenOpacity}"/>
            <stop offset="50%" stop-color="#FFFFFF" stop-opacity="0.02"/>
            <stop offset="100%" stop-color="#1E0B14" stop-opacity="0.16"/>
          </linearGradient>
          <pattern id="${patternId}" width="8" height="8" patternUnits="userSpaceOnUse">
            <path d="M 0 4 L 8 4 M 4 0 L 4 8" stroke="#FFFFFF" stroke-opacity="0.12" stroke-width="0.8"/>
            ${
              activeFabric.name.toLowerCase().includes('leopard')
                ? '<ellipse cx="4" cy="4" rx="2.2" ry="1.4" fill="#1E0B14" fill-opacity="0.22"/>'
                : ''
            }
          </pattern>
        </defs>
        <rect width="300" height="380" fill="url(#bgGrad-${poseObj.id})"/>
        <circle cx="150" cy="112" r="36" fill="#E6C3A5"/>
        <path d="M 88 292 Q 150 264 212 292 L 224 380 L 76 380 Z" fill="#2C141F"/>
        <path d="${poseObj.drapeCurve}" fill="${hijabColor}" fill-opacity="${activeFabric.opacity}"/>
        <path d="${poseObj.drapeCurve}" fill="url(#${patternId})"/>
        <path d="${poseObj.drapeCurve}" fill="url(#${sheenId})"/>
        <path d="${poseObj.foldPath1}" fill="none" stroke="#1E0B14" stroke-opacity="0.22" stroke-width="2" stroke-dasharray="${activeFabric.strokeDash}"/>
        <path d="${poseObj.foldPath2}" fill="none" stroke="#1E0B14" stroke-opacity="0.22" stroke-width="2" stroke-dasharray="${activeFabric.strokeDash}"/>
        <path d="${poseObj.headCutout}" fill="#E6C3A5" stroke="#C5A065" stroke-width="1.2"/>
        <circle cx="138" cy="162" r="2.2" fill="#2C141F"/>
        <circle cx="162" cy="162" r="2.2" fill="#2C141F"/>
        <path d="M 143 184 Q 150 189 157 184" fill="none" stroke="#9C6A5C" stroke-width="1.8" stroke-linecap="round"/>
        <rect x="14" y="14" width="272" height="352" rx="14" fill="none" stroke="#C5A065" stroke-opacity="0.55" stroke-width="1.2"/>
        <text x="26" y="36" fill="#2C141F" font-family="Georgia, serif" font-size="11" font-weight="700">${activeFabric.name}</text>
        <text x="26" y="51" fill="#7D6971" font-family="sans-serif" font-size="10">${colorLabel} • ${poseObj.label.split(':')[0]}</text>
      </svg>
    `;
  };

  const svgToDataUrl = (poseObj) => {
    const markup = renderSvgMarkup(poseObj).trim();
    return `data:image/svg+xml;utf8,${encodeURIComponent(markup)}`;
  };

  const handleAttachPose = (allThree = false) => {
    const targets = allThree ? POSES : [activePose];
    targets.forEach((p, idx) => {
      const dataUrl = svgToDataUrl(p);
      onAttachImageToProduct?.({
        imageUrl: dataUrl,
        colorName: `${colorLabel} (${activeFabric.name})`,
        primaryImage: idx === 0 && !allThree ? false : false,
      });
    });
    setAttachedMsg(
      allThree
        ? `Attached all 3 poses (${colorLabel} • ${activeFabric.name}) to Product Photos!`
        : `Attached ${activePose.label.split(':')[0]} (${colorLabel} • ${activeFabric.name}) to Product Photos!`
    );
    setTimeout(() => setAttachedMsg(''), 2500);
  };

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
              Dynamic Model Hijab Customizer (3 Poses + Fabric &amp; Color)
            </strong>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Preview hijab color and fabric weave across poses and attach directly to product photos
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
        {/* Live Model Preview Stage */}
        <div style={{ background: '#fff', padding: 12, borderRadius: 12, border: '1px solid var(--border-sand)', textAlign: 'center' }}>
          <img
            ref={svgRef}
            src={svgToDataUrl(activePose)}
            alt={`${activePose.label} in ${colorLabel}`}
            style={{ width: '100%', maxWidth: 260, aspectRatio: '300 / 380', objectFit: 'cover', borderRadius: 10, display: 'block', margin: '0 auto' }}
          />
          <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
            {POSES.map((p) => (
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

        {/* Controls: Fabric, Color, & Attach to Catalog */}
        <div style={{ display: 'grid', gap: 14 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', fontWeight: 700, color: 'var(--brand-plum)', marginBottom: 6 }}>
              <Layers size={14} /> Select Fabric Type
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
              <Palette size={14} /> Adjust Hijab Color
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
                placeholder="Color label (e.g. Mocha)"
                value={colorLabel}
                onChange={(e) => setColorLabel(e.target.value)}
                style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid var(--border-sand)', fontSize: '0.8rem', maxWidth: 140 }}
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
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', paddingTop: 4 }}>
            <button
              type="button"
              className="btn-primary"
              style={{ padding: '9px 14px', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: 6 }}
              onClick={() => handleAttachPose(false)}
            >
              <ImagePlus size={15} /> Attach {activePose.label.split(':')[0]} to Photos
            </button>
            <button
              type="button"
              className="btn-outline"
              style={{ padding: '9px 14px', fontSize: '0.78rem', background: '#fff' }}
              onClick={() => handleAttachPose(true)}
            >
              Attach All 3 Poses
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
