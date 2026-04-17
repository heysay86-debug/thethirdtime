'use client';

import { useState, useEffect } from 'react';
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
  const [danceFrame, setDanceFrame] = useState(1);

  // Dance animation: alternate dance1/dance2 every 0.5s
  useEffect(() => {
    if (phase !== 'loading') return;
    const interval = setInterval(() => {
      setDanceFrame(prev => prev === 1 ? 2 : 1);
    }, 500);
    return () => clearInterval(interval);
  }, [phase]);

  if (phase === 'idle' || phase === 'done') return null;

  const showOverlay = phase === 'zoom-out' || phase === 'loading' || phase === 'zoom-in';

  return (
    <div
      className="fixed inset-0"
      style={{
        zIndex: 50,
        backgroundColor: '#1a1e24',
        opacity: showOverlay ? 1 : 0,
        transition: 'opacity 0.4s',
      }}
    >
      {phase === 'loading' && (
        <div className="relative flex flex-col items-center justify-center min-h-screen">
          {/* 배경 이미지 */}
          <div className="absolute inset-0 flex justify-center">
            <img
              src="/background/timezone.jpeg"
              alt=""
              className="h-full object-cover"
              style={{ opacity: 0.4, maxWidth: 440, width: '100%' }}
            />
          </div>

          {/* 콘텐츠 */}
          <div className="relative flex flex-col items-center gap-6" style={{ zIndex: 1 }}>
            {/* 춤추는 캐릭터 */}
            <img
              src={`/character/dance${danceFrame}.png`}
              alt="복길"
              style={{
                height: '12vh',
                width: 'auto',
                imageRendering: 'pixelated',
                filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.5))',
              }}
            />

            <div
              style={{
                background: 'rgba(26, 30, 36, 0.85)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(104, 128, 151, 0.3)',
                borderRadius: 16,
                padding: 16,
                maxWidth: 340,
              }}
            >
              <div className="flex gap-3">
                <Portrait name={loadingPortrait} size="md" />
                <div className="flex-1">
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#f0dfad' }} className="mb-1">
                    복길
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
        </div>
      )}
    </div>
  );
}
