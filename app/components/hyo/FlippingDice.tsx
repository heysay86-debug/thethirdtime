'use client';

import { useState, useEffect } from 'react';

const DICE_DOTS: Record<number, [number, number][]> = {
  1: [[50,50]],
  2: [[25,25],[75,75]],
  3: [[25,25],[50,50],[75,75]],
  4: [[25,25],[75,25],[25,75],[75,75]],
  5: [[25,25],[75,25],[50,50],[25,75],[75,75]],
  6: [[25,25],[75,25],[25,50],[75,50],[25,75],[75,75]],
};

export default function FlippingDice({ spinning, resultVal, onStop, size = 64 }: {
  spinning: boolean;
  resultVal: number;
  onStop?: () => void;
  size?: number;
}) {
  const [displayVal, setDisplayVal] = useState(1);
  const [stopped, setStopped] = useState(false);

  useEffect(() => {
    if (!spinning || stopped) return;
    const duration = 2200;
    const start = performance.now();
    let frame: number;

    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const interval = 50 + progress * 300;
      if (progress < 1) {
        setDisplayVal(Math.floor(Math.random() * 6) + 1);
        frame = window.setTimeout(() => requestAnimationFrame(animate), interval);
      } else {
        setDisplayVal(resultVal);
        setStopped(true);
        onStop?.();
      }
    };
    frame = window.setTimeout(() => requestAnimationFrame(animate), 50);
    return () => clearTimeout(frame);
  }, [spinning]);

  const dots = DICE_DOTS[displayVal] || DICE_DOTS[1];
  const isShaking = spinning && !stopped;
  const dotSize = Math.max(6, size * 0.16);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <div style={{ fontSize: 10, color: '#667', marginBottom: 2 }}>동효</div>
      <div style={{
        width: size, height: size,
        borderRadius: size * 0.16,
        border: '2px solid rgba(240,223,173,0.3)',
        background: 'rgba(240,223,173,0.08)',
        position: 'relative',
        animation: isShaking ? 'dice-shake 0.1s infinite' : 'none',
      }}>
        {dots.map(([x, y], i) => (
          <div key={i} style={{
            position: 'absolute',
            left: `${x}%`, top: `${y}%`,
            transform: 'translate(-50%, -50%)',
            width: dotSize, height: dotSize,
            borderRadius: '50%',
            backgroundColor: stopped ? '#f0dfad' : '#aab4be',
            transition: 'background-color 0.3s',
          }} />
        ))}
      </div>
      {stopped && (
        <div style={{ fontSize: 13, color: '#f0dfad', fontWeight: 600 }}>
          {resultVal}효 변
        </div>
      )}
      <style>{`
        @keyframes dice-shake {
          0% { transform: rotate(0deg) scale(1); }
          25% { transform: rotate(-8deg) scale(1.05); }
          50% { transform: rotate(8deg) scale(0.95); }
          75% { transform: rotate(-4deg) scale(1.02); }
          100% { transform: rotate(0deg) scale(1); }
        }
      `}</style>
    </div>
  );
}
