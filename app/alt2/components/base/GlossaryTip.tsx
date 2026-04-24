'use client';

import { useState, useRef, useEffect } from 'react';
import { GLOSSARY } from '../../data/glossary';

interface GlossaryTipProps {
  term: string;
  children?: React.ReactNode;
}

/**
 * 명리학 용어 툴팁
 *
 * 사용법: <GlossaryTip term="용신">용신</GlossaryTip>
 * 또는:   <GlossaryTip term="용신" />  (? 버튼만)
 */
export default function GlossaryTip({ term, children }: GlossaryTipProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  const desc = GLOSSARY[term];

  // 바깥 클릭 시 닫기
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent | TouchEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, [open]);

  if (!desc) return <>{children || term}</>;

  return (
    <span ref={ref} style={{ position: 'relative', display: 'inline' }}>
      {children || term}
      <span
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: 14, height: 14, marginLeft: 2,
          borderRadius: '50%',
          backgroundColor: open ? 'rgba(240,223,173,0.3)' : 'rgba(104,128,151,0.2)',
          color: open ? '#f0dfad' : '#8899aa',
          fontSize: 9, fontWeight: 700,
          cursor: 'pointer',
          verticalAlign: 'super',
          lineHeight: 1,
          transition: 'all 0.15s',
        }}
      >
        ?
      </span>
      {open && (
        <span
          style={{
            position: 'absolute',
            bottom: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            marginBottom: 6,
            padding: '8px 12px',
            backgroundColor: '#1a1e24',
            border: '1px solid rgba(240,223,173,0.25)',
            borderRadius: 8,
            boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
            fontSize: 12,
            lineHeight: 1.6,
            color: '#dde1e5',
            whiteSpace: 'normal',
            width: 220,
            zIndex: 100,
            animation: 'tipFadeIn 0.15s ease',
          }}
        >
          <span style={{ fontWeight: 700, color: '#f0dfad', fontSize: 11, display: 'block', marginBottom: 3 }}>
            {term}
          </span>
          {desc}
          <style>{`@keyframes tipFadeIn { from { opacity:0; transform:translateX(-50%) translateY(4px); } to { opacity:1; transform:translateX(-50%) translateY(0); } }`}</style>
        </span>
      )}
    </span>
  );
}
