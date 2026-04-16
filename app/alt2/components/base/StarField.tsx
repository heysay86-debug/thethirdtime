'use client';

import { useState, useEffect } from 'react';

interface Star {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
}

export default function StarField() {
  const [stars, setStars] = useState<Star[]>([]);

  useEffect(() => {
    const count = 25;
    const generated: Star[] = [];
    for (let i = 0; i < count; i++) {
      generated.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: 2 + Math.random() * 2,
        duration: 2 + Math.random() * 3,
        delay: Math.random() * 3,
      });
    }
    setStars(generated);
  }, []);

  return (
    <>
      <style jsx>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 0.8; }
        }
      `}</style>
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
        {stars.map(star => (
          <div
            key={star.id}
            style={{
              position: 'absolute',
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: star.size,
              height: star.size,
              borderRadius: '50%',
              backgroundColor: '#dde1e5',
              animation: `twinkle ${star.duration}s ease-in-out ${star.delay}s infinite`,
              willChange: 'opacity',
            }}
          />
        ))}
      </div>
    </>
  );
}
