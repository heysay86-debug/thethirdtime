'use client';

import { useState, useEffect, useRef } from 'react';

const TRIGRAM_LABELS = ['건', '태', '리', '진', '손', '감', '간', '곤'];
const TRIGRAM_SYMBOLS = ['☰', '☱', '☲', '☳', '☴', '☵', '☶', '☷'];
const TRIGRAM_ELEMENTS = ['天', '澤', '火', '雷', '風', '水', '山', '地'];

export { TRIGRAM_LABELS, TRIGRAM_SYMBOLS, TRIGRAM_ELEMENTS };

export default function BaguaWheel({ label, spinning, resultIdx, onStop, size = 130 }: {
  label: string;
  spinning: boolean;
  resultIdx: number;
  onStop?: () => void;
  size?: number;
}) {
  const [rotation, setRotation] = useState(0);
  const [stopped, setStopped] = useState(false);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!spinning || stopped) return;
    const targetBase = -resultIdx * 45;
    const fullSpins = 360 * (3 + Math.random() * 2);
    const target = fullSpins + ((targetBase % 360) + 360) % 360;
    const duration = 2500;
    const start = performance.now();
    const startRot = rotation;

    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setRotation(startRot + target * eased);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        setStopped(true);
        onStop?.();
      }
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [spinning]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <div style={{ fontSize: 10, color: '#667', marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 12, color: '#f0dfad', lineHeight: 1 }}>▼</div>
      <div style={{
        width: size, height: size,
        borderRadius: '50%',
        border: '2px solid rgba(240,223,173,0.3)',
        background: 'rgba(240,223,173,0.05)',
        position: 'relative',
        overflow: 'hidden',
        transform: `rotate(${rotation}deg)`,
      }}>
        {TRIGRAM_SYMBOLS.map((sym, i) => {
          const angle = i * 45;
          const isSelected = stopped && i === resultIdx;
          return (
            <div key={i} style={{
              position: 'absolute',
              width: '100%', height: '100%',
              display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
              transform: `rotate(${angle}deg)`,
              paddingTop: size * 0.06,
            }}>
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                transform: `rotate(-${angle + rotation}deg)`,
              }}>
                <span style={{
                  fontSize: isSelected ? size * 0.17 : size * 0.12,
                  color: isSelected ? '#f0dfad' : '#889',
                  transition: 'all 0.3s',
                  textShadow: isSelected ? '0 0 8px rgba(240,223,173,0.5)' : 'none',
                }}>{sym}</span>
                <span style={{
                  fontSize: size * 0.07,
                  color: isSelected ? '#f0dfad' : '#667',
                }}>{TRIGRAM_LABELS[i]}</span>
              </div>
            </div>
          );
        })}
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: size * 0.28, height: size * 0.28, borderRadius: '50%',
          background: 'rgba(26,30,36,0.9)',
          border: '1px solid rgba(240,223,173,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontSize: size * 0.08, color: '#667' }}>☯</span>
        </div>
      </div>
      {stopped && (
        <div style={{ fontSize: 13, color: '#f0dfad', fontWeight: 600 }}>
          {TRIGRAM_SYMBOLS[resultIdx]} {TRIGRAM_LABELS[resultIdx]}({TRIGRAM_ELEMENTS[resultIdx]})
        </div>
      )}
    </div>
  );
}
