'use client';

import React from 'react';

interface BoardFrameProps {
  children: React.ReactNode;
}

/**
 * RPG bulletin board frame: wood border with parchment interior.
 * Uses layered box-shadows and borders to simulate a wooden frame
 * around a parchment surface.
 */
export default function BoardFrame({ children }: BoardFrameProps) {
  return (
    <div
      style={{
        position: 'relative',
        border: '4px solid #5c3d1e',
        borderRadius: 2,
        background: 'linear-gradient(135deg, #d4c4a0 0%, #c9b88c 30%, #d6c69a 70%, #cabb8a 100%)',
        boxShadow:
          'inset 0 0 0 2px #7a5630, inset 0 0 20px rgba(80, 55, 25, 0.2), 0 4px 16px rgba(0, 0, 0, 0.5)',
      }}
    >
      {/* Wood grain highlight on top and left edges */}
      <div
        style={{
          position: 'absolute',
          top: -4,
          left: -4,
          right: -4,
          height: 4,
          background: 'linear-gradient(90deg, #8b6914 0%, #a07830 50%, #8b6914 100%)',
          borderRadius: '2px 2px 0 0',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: -4,
          left: -4,
          right: -4,
          height: 4,
          background: 'linear-gradient(90deg, #4a2e10 0%, #5c3d1e 50%, #4a2e10 100%)',
          borderRadius: '0 0 2px 2px',
        }}
      />

      {/* Corner nails */}
      {(['topLeft', 'topRight', 'bottomLeft', 'bottomRight'] as const).map((corner) => {
        const isTop = corner.includes('top');
        const isLeft = corner.includes('Left');
        return (
          <div
            key={corner}
            style={{
              position: 'absolute',
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: 'radial-gradient(circle at 35% 35%, #c4a84f, #7a5a20)',
              border: '1px solid #5a3e10',
              top: isTop ? 4 : undefined,
              bottom: isTop ? undefined : 4,
              left: isLeft ? 4 : undefined,
              right: isLeft ? undefined : 4,
              zIndex: 2,
            }}
          />
        );
      })}

      {/* Inner parchment content */}
      <div style={{ padding: '20px 16px', position: 'relative', zIndex: 1 }}>
        {children}
      </div>
    </div>
  );
}
