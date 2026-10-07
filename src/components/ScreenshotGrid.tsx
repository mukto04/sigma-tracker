'use client';

import React, { useEffect, useMemo, useState } from 'react';

type ScreenshotItem = {
  id: string;
  imageUrl: string;
  createdAt: Date | string;
};

export function ScreenshotGrid({ screenshots }: { screenshots: ScreenshotItem[] }) {
  const [currentIndex, setCurrentIndex] = useState<number | null>(null);
  const [loadedImages, setLoadedImages] = useState<Record<string, string>>({});

  const imageSources = useMemo(() => {
    return screenshots.map((screenshot) => ({
      id: screenshot.id,
      url: screenshot.imageUrl,
    }));
  }, [screenshots]);

  useEffect(() => {
    let cancelled = false;
    const objectUrls: string[] = [];

    async function loadImages() {
      const entries = await Promise.all(
        imageSources.map(async (item) => {
          if (!item.url || item.url.startsWith('data:') || item.url.startsWith('blob:')) {
            return [item.id, item.url] as const;
          }

          try {
            const res = await fetch(item.url, { credentials: 'include', cache: 'no-store' });
            if (!res.ok) return [item.id, item.url] as const;
            const blob = await res.blob();
            if (!blob.type.startsWith('image/')) return [item.id, item.url] as const;
            const objectUrl = URL.createObjectURL(blob);
            objectUrls.push(objectUrl);
            return [item.id, objectUrl] as const;
          } catch {
            return [item.id, item.url] as const;
          }
        })
      );

      if (!cancelled) {
        setLoadedImages(Object.fromEntries(entries));
      }
    }

    loadImages();

    return () => {
      cancelled = true;
      objectUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [imageSources]);

  if (screenshots.length === 0) {
    return (
      <div style={{ padding: '3rem', backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', textAlign: 'center', color: '#64748b' }}>
        No screenshots captured for the selected date.
      </div>
    );
  }

  const handleNext = React.useCallback((e?: React.MouseEvent | KeyboardEvent) => {
    e?.stopPropagation?.();
    if (currentIndex !== null && currentIndex < screenshots.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  }, [currentIndex, screenshots.length]);

  const handlePrev = React.useCallback((e?: React.MouseEvent | KeyboardEvent) => {
    e?.stopPropagation?.();
    if (currentIndex !== null && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  }, [currentIndex]);

  React.useEffect(() => {
    if (currentIndex === null) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') handleNext(e);
      if (e.key === 'ArrowLeft') handlePrev(e);
      if (e.key === 'Escape') setCurrentIndex(null);
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, handleNext, handlePrev]);

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {screenshots.map((s, idx) => (
          <div key={s.id} style={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
            <img
              loading="lazy"
              src={loadedImages[s.id] || s.imageUrl} 
              alt="Screenshot" 
              style={{ width: '100%', height: 'auto', display: 'block', cursor: 'pointer', transition: 'opacity 0.2s' }} 
              onClick={() => setCurrentIndex(idx)}
              onMouseOver={(e) => (e.currentTarget.style.opacity = '0.8')}
              onMouseOut={(e) => (e.currentTarget.style.opacity = '1')}
            />
            <div style={{ padding: '1rem', borderTop: '1px solid #e2e8f0', fontSize: '0.875rem', color: '#64748b' }}>
              Captured at: {new Date(s.createdAt).toLocaleTimeString()}
            </div>
          </div>
        ))}
      </div>

      {currentIndex !== null && (
        <div 
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.9)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem'
          }}
          onClick={() => setCurrentIndex(null)}
        >
          {currentIndex > 0 && (
            <button
              onClick={handlePrev}
              style={{
                position: 'absolute',
                left: '20px',
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                color: 'white',
                fontSize: '24px',
                cursor: 'pointer',
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10000
              }}
            >
              ❮
            </button>
          )}

          <img 
            src={loadedImages[screenshots[currentIndex].id] || screenshots[currentIndex].imageUrl} 
            alt="Full screen screenshot" 
            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: '8px' }} 
            onClick={(e) => e.stopPropagation()}
          />

          {currentIndex < screenshots.length - 1 && (
            <button
              onClick={handleNext}
              style={{
                position: 'absolute',
                right: '20px',
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                color: 'white',
                fontSize: '24px',
                cursor: 'pointer',
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10000
              }}
            >
              ❯
            </button>
          )}

          <button 
            onClick={() => setCurrentIndex(null)}
            style={{
              position: 'absolute',
              top: '20px',
              right: '30px',
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              color: 'white',
              fontSize: '24px',
              cursor: 'pointer',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ✕
          </button>
          
          <div style={{ position: 'absolute', bottom: '20px', color: 'white', fontSize: '14px', background: 'rgba(0,0,0,0.5)', padding: '5px 15px', borderRadius: '20px' }}>
            {new Date(screenshots[currentIndex].createdAt).toLocaleTimeString()} ({currentIndex + 1} / {screenshots.length})
          </div>
        </div>
      )}
    </>
  );
}
