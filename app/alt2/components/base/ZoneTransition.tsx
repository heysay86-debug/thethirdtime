'use client';

import { useEffect } from 'react';
import Portrait from './Portrait';

interface ZoneTransitionProps {
  phase: 'idle' | 'zoom-out' | 'loading' | 'zoom-in' | 'done';
  loadingPortrait?: string;
  loadingText?: string;
}

export default function ZoneTransition({
  phase,
  loadingPortrait = 'magician',
  loadingText = '시간의 문을 열고 있어요...',
}: ZoneTransitionProps) {
  if (phase === 'idle' || phase === 'done') return null;

  const showOverlay = phase === 'zoom-out' || phase === 'loading' || phase === 'zoom-in';
  const overlayOpacity = phase === 'loading' ? 1 : phase === 'zoom-out' ? 1 : 0;

  return (
    <div
      className="fixed inset-0"
      style={{
        zIndex: 50,
        backgroundColor: '#3e4857',
        opacity: showOverlay ? 1 : 0,
        transition: 'opacity 0.4s',
      }}
    >
      {phase === 'loading' && (
        <div className="flex flex-col items-center justify-center min-h-screen gap-6">
          <Portrait name={loadingPortrait} size="lg" />

          <div
            style={{
              background: 'rgba(62, 72, 87, 0.92)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(104, 128, 151, 0.4)',
              borderRadius: 16,
              padding: 16,
              maxWidth: 340,
            }}
          >
            <div className="flex gap-3">
              <Portrait name={loadingPortrait} size="md" />
              <div className="flex-1">
                <div style={{ fontSize: 12, fontWeight: 600, color: '#f0dfad' }} className="mb-1">
                  안내자
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-gaegu), "Gaegu", cursive',
                    fontSize: 18,
                    color: '#dde1e5',
                    lineHeight: 1.65,
                  }}
                >
                  {loadingText}
                </div>
              </div>
            </div>
          </div>

          {/* Dot loading animation */}
          <div className="flex gap-2">
            {[0, 1, 2].map(i => (
              <div
                key={i}
                className="w-2 h-2 rounded-full"
                style={{
                  backgroundColor: '#dde1e5',
                  animation: `bounce 1s ease-in-out ${i * 0.15}s infinite`,
                }}
              />
            ))}
          </div>
          <style jsx>{`
            @keyframes bounce {
              0%, 80%, 100% { transform: translateY(0); opacity: 0.3; }
              40% { transform: translateY(-8px); opacity: 1; }
            }
          `}</style>
        </div>
      )}
    </div>
  );
}
