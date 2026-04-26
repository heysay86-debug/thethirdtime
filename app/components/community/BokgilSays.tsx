'use client';

import React from 'react';

interface BokgilSaysProps {
  text: string;
}

const PIXEL_BORDER_SVG = `data:image/svg+xml,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24">
  <defs>
    <style>
      .outer { fill: #8899aa; }
      .inner { fill: #556677; }
      .bg { fill: rgba(20, 25, 35, 0.92); }
    </style>
  </defs>
  <rect x="3" y="3" width="18" height="18" class="bg"/>
  <rect x="3" y="0" width="18" height="1" class="outer"/>
  <rect x="3" y="23" width="18" height="1" class="outer"/>
  <rect x="0" y="3" width="1" height="18" class="outer"/>
  <rect x="23" y="3" width="1" height="18" class="outer"/>
  <rect x="2" y="1" width="1" height="1" class="outer"/>
  <rect x="1" y="2" width="1" height="1" class="outer"/>
  <rect x="21" y="1" width="1" height="1" class="outer"/>
  <rect x="22" y="2" width="1" height="1" class="outer"/>
  <rect x="2" y="22" width="1" height="1" class="outer"/>
  <rect x="1" y="21" width="1" height="1" class="outer"/>
  <rect x="21" y="22" width="1" height="1" class="outer"/>
  <rect x="22" y="21" width="1" height="1" class="outer"/>
  <rect x="3" y="2" width="18" height="1" class="inner"/>
  <rect x="3" y="21" width="18" height="1" class="inner"/>
  <rect x="2" y="3" width="1" height="18" class="inner"/>
  <rect x="21" y="3" width="1" height="18" class="inner"/>
</svg>
`)}`;

export default function BokgilSays({ text }: BokgilSaysProps) {
  return (
    <div
      style={{
        borderImage: `url("${PIXEL_BORDER_SVG}") 6 fill / 6px`,
        borderStyle: 'solid',
        padding: '14px 16px',
        imageRendering: 'pixelated',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: '#f0dfad',
              marginBottom: 4,
            }}
          >
            복길
          </div>
          <div
            style={{
              fontFamily: 'var(--font-gaegu), "Gaegu", cursive',
              fontSize: 17,
              color: '#dde1e5',
              lineHeight: 1.6,
              whiteSpace: 'pre-wrap',
            }}
          >
            {text}
          </div>
        </div>
        <img
          src="/character/bokgil.svg"
          alt="복길"
          style={{
            width: 64,
            height: 64,
            objectFit: 'contain',
            flexShrink: 0,
          }}
        />
      </div>
    </div>
  );
}
