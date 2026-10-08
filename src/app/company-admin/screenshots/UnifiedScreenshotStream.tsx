'use client';

import React, { useState, useEffect, useCallback } from 'react';

interface ScreenshotItem {
  id: string;
  imageUrl: string;
  createdAt: string | Date;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
}

export function UnifiedScreenshotStream({ screenshots }: { screenshots: ScreenshotItem[] }) {
  const [currentIndex, setCurrentIndex] = useState<number | null>(null);
  const [unavailableImages, setUnavailableImages] = useState<Record<string, boolean>>({});
  const [zoom, setZoom] = useState(1);

  const updateZoom = useCallback((amount: number) => {
    setZoom((current) => Math.max(1, Math.min(4, Math.round((current + amount) * 100) / 100)));
  }, []);

  const handleNext = useCallback((e?: React.MouseEvent | KeyboardEvent) => {
    e?.stopPropagation?.();
    if (currentIndex !== null && currentIndex < screenshots.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setZoom(1);
    }
  }, [currentIndex, screenshots.length]);

  const handlePrev = useCallback((e?: React.MouseEvent | KeyboardEvent) => {
    e?.stopPropagation?.();
    if (currentIndex !== null && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setZoom(1);
    }
  }, [currentIndex]);

  useEffect(() => {
    if (currentIndex === null) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') handleNext(e);
      if (e.key === 'ArrowLeft') handlePrev(e);
      if (e.key === 'Escape') setCurrentIndex(null);
      if (e.key === '+' || e.key === '=') updateZoom(0.25);
      if (e.key === '-') updateZoom(-0.25);
      if (e.key === '0') setZoom(1);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, handleNext, handlePrev, updateZoom]);

  useEffect(() => {
    // Let the browser lazily request each thumbnail as it enters the viewport.
    // This prevents dozens of protected-image requests from firing at once.
    setUnavailableImages({});
  }, [screenshots]);

  if (screenshots.length === 0) {
    return (
      <div style={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '4rem 2rem', textAlign: 'center', color: '#64748b' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📷</div>
        <div style={{ fontSize: '1.125rem', fontWeight: 600, color: '#0f172a' }}>No screenshots captured</div>
        <div style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>No screenshots were taken for the selected employee or date range.</div>
      </div>
    );
  }

  const activeItem = currentIndex !== null ? screenshots[currentIndex] : null;

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
        {screenshots.map((item, idx) => (
          <div
            key={item.id}
            style={{
              backgroundColor: 'white',
              borderRadius: '10px',
              border: '1px solid #e2e8f0',
              overflow: 'hidden',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
              transition: 'transform 0.15s ease, box-shadow 0.15s ease',
              cursor: unavailableImages[item.id] ? 'not-allowed' : 'pointer',
            }}
            onClick={() => {
              if (!unavailableImages[item.id]) {
                setZoom(1);
                setCurrentIndex(idx);
              }
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 12px rgba(0, 0, 0, 0.08)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.04)';
            }}
          >
            {/* Image Preview */}
            <div style={{ position: 'relative', width: '100%', paddingTop: '56.25%', backgroundColor: '#0f172a', overflow: 'hidden' }}>
              {!unavailableImages[item.id] && <img
                loading="lazy"
                src={item.imageUrl}
                alt="Screenshot"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
                onError={() => setUnavailableImages((current) => ({ ...current, [item.id]: true }))}
              />}
              {unavailableImages[item.id] && <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', gap: '0.3rem', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '0.8125rem' }}>
                Preview unavailable
                <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Unable to load this capture. Refresh to try again.</span>
              </div>}
              <span
                style={{
                  position: 'absolute',
                  top: '8px',
                  right: '8px',
                  backgroundColor: 'rgba(0, 0, 0, 0.65)',
                  color: 'white',
                  backdropFilter: 'blur(4px)',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontSize: '0.6875rem',
                  fontWeight: 600,
                }}
              >
                {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            {/* Employee Footer */}
            <div style={{ padding: '0.875rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
                <div
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: '#eff6ff',
                    color: '#2563eb',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.6875rem',
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  {(item.user?.name || item.user?.email || 'User').substring(0, 2).toUpperCase()}
                </div>
                <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                  {item.user?.name || (item.user?.email ? item.user.email.split('@')[0] : 'User')}
                </div>
              </div>

              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                {new Date(item.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox Modal */}
      {activeItem && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.92)',
            zIndex: 99999,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '1.5rem',
          }}
          onClick={() => setCurrentIndex(null)}
        >
          {/* Top Bar inside Lightbox */}
          <div
            style={{
              position: 'absolute',
              top: '1rem',
              left: '1.5rem',
              right: '1.5rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              color: 'white',
              zIndex: 100000,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#2563eb', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.8125rem' }}>
                {(activeItem.user?.name || activeItem.user?.email || 'User').substring(0, 2).toUpperCase()}
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.9375rem' }}>{activeItem.user?.name || activeItem.user?.email || 'User'}</div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                  Captured at: {new Date(activeItem.createdAt).toLocaleString()}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8125rem', color: '#94a3b8' }}>
                {currentIndex! + 1} of {screenshots.length}
              </span>
              <button onClick={() => updateZoom(-0.25)} disabled={zoom <= 1} title="Zoom out" aria-label="Zoom out" style={{ background: 'rgba(255, 255, 255, 0.2)', border: 'none', color: 'white', width: '32px', height: '32px', borderRadius: '50%', cursor: zoom <= 1 ? 'not-allowed' : 'pointer', opacity: zoom <= 1 ? 0.45 : 1 }}>-</button>
              <button onClick={() => setZoom(1)} title="Reset zoom" aria-label="Reset zoom" style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.35)', color: 'white', borderRadius: '5px', padding: '0.35rem 0.45rem', cursor: 'pointer', fontSize: '0.75rem' }}>{Math.round(zoom * 100)}%</button>
              <button onClick={() => updateZoom(0.25)} disabled={zoom >= 4} title="Zoom in" aria-label="Zoom in" style={{ background: 'rgba(255, 255, 255, 0.2)', border: 'none', color: 'white', width: '32px', height: '32px', borderRadius: '50%', cursor: zoom >= 4 ? 'not-allowed' : 'pointer', opacity: zoom >= 4 ? 0.45 : 1 }}>+</button>
              <button
                onClick={() => setCurrentIndex(null)}
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: 'none',
                  color: 'white',
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  fontSize: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                ✕
              </button>
            </div>
          </div>

          {/* Navigation Arrows */}
          {currentIndex! > 0 && (
            <button
              onClick={handlePrev}
              style={{
                position: 'absolute',
                left: '1.5rem',
                background: 'rgba(255, 255, 255, 0.2)',
                border: 'none',
                color: 'white',
                fontSize: '24px',
                cursor: 'pointer',
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 100000,
              }}
            >
              ❮
            </button>
          )}

          {currentIndex! < screenshots.length - 1 && (
            <button
              onClick={handleNext}
              style={{
                position: 'absolute',
                right: '1.5rem',
                background: 'rgba(255, 255, 255, 0.2)',
                border: 'none',
                color: 'white',
                fontSize: '24px',
                cursor: 'pointer',
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 100000,
              }}
            >
              ❯
            </button>
          )}

          {/* Full Screen Image */}
          <div onWheel={(event) => { event.preventDefault(); updateZoom(event.deltaY < 0 ? 0.25 : -0.25); }} style={{ maxWidth: '90vw', maxHeight: '80vh', display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-start', overflow: 'auto', cursor: zoom > 1 ? 'zoom-out' : 'zoom-in' }}>
            <img
              src={activeItem.imageUrl}
              alt="Screenshot Full"
              style={{
                width: `${zoom * 100}%`,
                maxWidth: 'none',
                height: 'auto',
                borderRadius: '8px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
              }}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </>
  );
}
