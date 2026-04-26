/**
 * 블로그용 도표 PNG 생성
 * 실행: npx tsx scripts/generate-blog-diagrams.ts
 */

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const OUT = path.join(process.cwd(), 'public', 'blog');

const JIJI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
const JIJI_KR = ['자', '축', '인', '묘', '진', '사', '오', '미', '신', '유', '술', '해'];

const BG = '#1a1e24';
const TEXT = '#dde1e5';
const GOLD = '#f4dea6';
const GREEN = '#97c6aa';
const PINK = '#f2b6b6';
const BLUE = '#618199';
const MUTED = '#556';

function jiji12Circle(cx: number, cy: number, r: number): { x: number; y: number }[] {
  return JIJI.map((_, i) => {
    const angle = (i * 30 - 90) * Math.PI / 180;
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  });
}

function circleBase(cx: number, cy: number, r: number, size: number): string {
  const pts = jiji12Circle(cx, cy, r);
  let svg = `<circle cx="${cx}" cy="${cy}" r="${r + 5}" fill="none" stroke="${MUTED}" stroke-width="0.5" stroke-dasharray="3,3"/>`;
  pts.forEach((p, i) => {
    svg += `<text x="${p.x}" y="${p.y}" text-anchor="middle" dominant-baseline="central" fill="${TEXT}" font-size="${size}" font-family="sans-serif" font-weight="700">${JIJI[i]}</text>`;
    const kr = jiji12Circle(cx, cy, r + 18);
    svg += `<text x="${kr[i].x}" y="${kr[i].y}" text-anchor="middle" dominant-baseline="central" fill="${MUTED}" font-size="${size - 3}" font-family="sans-serif">${JIJI_KR[i]}</text>`;
  });
  return svg;
}

function line(x1: number, y1: number, x2: number, y2: number, color: string, width = 1.5, dash = ''): string {
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${width}" ${dash ? `stroke-dasharray="${dash}"` : ''}/>`;
}

function polygon(points: { x: number; y: number }[], color: string, fillOpacity = 0.1): string {
  const pts = points.map(p => `${p.x},${p.y}`).join(' ');
  return `<polygon points="${pts}" fill="${color}" fill-opacity="${fillOpacity}" stroke="${color}" stroke-width="1.5"/>`;
}

async function saveSvg(name: string, svg: string, w: number, h: number) {
  const full = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect width="${w}" height="${h}" fill="${BG}"/>${svg}</svg>`;
  await sharp(Buffer.from(full)).png().toFile(path.join(OUT, `${name}.png`));
  console.log(`✓ ${name}.png`);
}

// ── 1. 삼합 ──
async function samhap() {
  const cx = 200, cy = 200, r = 130;
  const pts = jiji12Circle(cx, cy, r - 15);
  const SAMHAP = [
    { indices: [11, 3, 7], color: GREEN, label: '木' },   // 亥卯未
    { indices: [2, 6, 10], color: PINK, label: '火' },     // 寅午戌
    { indices: [5, 9, 1], color: BLUE, label: '金' },      // 巳酉丑
    { indices: [8, 0, 4], color: GOLD, label: '水' },      // 申子辰
  ];

  let svg = circleBase(cx, cy, r, 14);
  svg += `<text x="${cx}" y="30" text-anchor="middle" fill="${GOLD}" font-size="14" font-family="sans-serif" font-weight="700">지지 삼합(三合)</text>`;

  SAMHAP.forEach(s => {
    const tri = s.indices.map(i => pts[i]);
    svg += polygon(tri, s.color, 0.08);
    const midX = (tri[0].x + tri[1].x + tri[2].x) / 3;
    const midY = (tri[0].y + tri[1].y + tri[2].y) / 3;
    svg += `<text x="${midX}" y="${midY}" text-anchor="middle" dominant-baseline="central" fill="${s.color}" font-size="12" font-family="sans-serif" font-weight="700">${s.label}</text>`;
  });

  await saveSvg('samhap', svg, 400, 400);
}

// ── 2. 방합 ──
async function banghap() {
  const cx = 200, cy = 200, r = 130;
  const pts = jiji12Circle(cx, cy, r - 15);
  const BANGHAP = [
    { indices: [2, 3, 4], color: GREEN, label: '木(봄)' },
    { indices: [5, 6, 7], color: PINK, label: '火(여름)' },
    { indices: [8, 9, 10], color: BLUE, label: '金(가을)' },
    { indices: [11, 0, 1], color: GOLD, label: '水(겨울)' },
  ];

  let svg = circleBase(cx, cy, r, 14);
  svg += `<text x="${cx}" y="30" text-anchor="middle" fill="${GOLD}" font-size="14" font-family="sans-serif" font-weight="700">지지 방합(方合)</text>`;

  BANGHAP.forEach(s => {
    const tri = s.indices.map(i => pts[i]);
    svg += polygon(tri, s.color, 0.12);
    const midX = (tri[0].x + tri[1].x + tri[2].x) / 3;
    const midY = (tri[0].y + tri[1].y + tri[2].y) / 3;
    svg += `<text x="${midX}" y="${midY}" text-anchor="middle" dominant-baseline="central" fill="${s.color}" font-size="11" font-family="sans-serif" font-weight="600">${s.label}</text>`;
  });

  await saveSvg('banghap', svg, 400, 400);
}

// ── 3. 육합 ──
async function yukhap() {
  const cx = 200, cy = 200, r = 130;
  const pts = jiji12Circle(cx, cy, r - 15);
  const YUKHAP = [
    { a: 0, b: 1, color: GOLD },    // 子丑
    { a: 2, b: 11, color: GREEN },   // 寅亥
    { a: 3, b: 10, color: PINK },    // 卯戌
    { a: 4, b: 9, color: BLUE },     // 辰酉
    { a: 5, b: 8, color: GOLD },     // 巳申
    { a: 6, b: 7, color: PINK },     // 午未
  ];

  let svg = circleBase(cx, cy, r, 14);
  svg += `<text x="${cx}" y="30" text-anchor="middle" fill="${GOLD}" font-size="14" font-family="sans-serif" font-weight="700">지지 육합(六合)</text>`;

  YUKHAP.forEach(h => {
    svg += line(pts[h.a].x, pts[h.a].y, pts[h.b].x, pts[h.b].y, h.color, 2);
  });

  await saveSvg('yukhap', svg, 400, 400);
}

// ── 4. 오행 상생상극 ──
async function ohaeng() {
  const cx = 200, cy = 210, r = 100;
  const ELEMENTS = [
    { name: '木', color: '#4ade80', angle: -90 },
    { name: '火', color: '#f87171', angle: -18 },
    { name: '土', color: '#d4a853', angle: 54 },
    { name: '金', color: '#94a3b8', angle: 126 },
    { name: '水', color: '#60a5fa', angle: 198 },
  ];

  const pts = ELEMENTS.map(e => ({
    x: cx + r * Math.cos(e.angle * Math.PI / 180),
    y: cy + r * Math.sin(e.angle * Math.PI / 180),
  }));

  let svg = `<text x="${cx}" y="30" text-anchor="middle" fill="${GOLD}" font-size="14" font-family="sans-serif" font-weight="700">오행 상생상극</text>`;

  // 상생 (외곽, 실선)
  for (let i = 0; i < 5; i++) {
    const next = (i + 1) % 5;
    svg += line(pts[i].x, pts[i].y, pts[next].x, pts[next].y, GREEN, 1.5);
  }

  // 상극 (내부, 점선)
  for (let i = 0; i < 5; i++) {
    const target = (i + 2) % 5;
    svg += line(pts[i].x, pts[i].y, pts[target].x, pts[target].y, PINK, 1, '4,4');
  }

  // 오행 원
  ELEMENTS.forEach((e, i) => {
    svg += `<circle cx="${pts[i].x}" cy="${pts[i].y}" r="22" fill="${BG}" stroke="${e.color}" stroke-width="2"/>`;
    svg += `<text x="${pts[i].x}" y="${pts[i].y}" text-anchor="middle" dominant-baseline="central" fill="${e.color}" font-size="16" font-family="sans-serif" font-weight="700">${e.name}</text>`;
  });

  // 범례
  svg += `<text x="80" y="380" fill="${GREEN}" font-size="11" font-family="sans-serif">━ 상생</text>`;
  svg += `<text x="240" y="380" fill="${PINK}" font-size="11" font-family="sans-serif">┅ 상극</text>`;

  await saveSvg('ohaeng-cycle', svg, 400, 400);
}

// ── 5. 십신 상생상극 ──
async function sipsin() {
  const cx = 200, cy = 210, r = 100;
  const SIPSIN = [
    { name: '비겁', sub: '비견·겁재', color: '#4ade80', angle: -90 },
    { name: '식상', sub: '식신·상관', color: '#f87171', angle: -18 },
    { name: '재성', sub: '편재·정재', color: '#d4a853', angle: 54 },
    { name: '관성', sub: '편관·정관', color: '#94a3b8', angle: 126 },
    { name: '인성', sub: '편인·정인', color: '#60a5fa', angle: 198 },
  ];

  const pts = SIPSIN.map(e => ({
    x: cx + r * Math.cos(e.angle * Math.PI / 180),
    y: cy + r * Math.sin(e.angle * Math.PI / 180),
  }));

  let svg = `<text x="${cx}" y="30" text-anchor="middle" fill="${GOLD}" font-size="14" font-family="sans-serif" font-weight="700">십신 상생상극</text>`;

  // 상생
  for (let i = 0; i < 5; i++) {
    const next = (i + 1) % 5;
    svg += line(pts[i].x, pts[i].y, pts[next].x, pts[next].y, GREEN, 1.5);
  }
  // 상극
  for (let i = 0; i < 5; i++) {
    const target = (i + 2) % 5;
    svg += line(pts[i].x, pts[i].y, pts[target].x, pts[target].y, PINK, 1, '4,4');
  }

  SIPSIN.forEach((e, i) => {
    svg += `<circle cx="${pts[i].x}" cy="${pts[i].y}" r="28" fill="${BG}" stroke="${e.color}" stroke-width="2"/>`;
    svg += `<text x="${pts[i].x}" y="${pts[i].y - 4}" text-anchor="middle" dominant-baseline="central" fill="${e.color}" font-size="12" font-family="sans-serif" font-weight="700">${e.name}</text>`;
    svg += `<text x="${pts[i].x}" y="${pts[i].y + 10}" text-anchor="middle" dominant-baseline="central" fill="${MUTED}" font-size="7" font-family="sans-serif">${e.sub}</text>`;
  });

  svg += `<text x="80" y="380" fill="${GREEN}" font-size="11" font-family="sans-serif">━ 상생</text>`;
  svg += `<text x="240" y="380" fill="${PINK}" font-size="11" font-family="sans-serif">┅ 상극</text>`;

  await saveSvg('sipsin-cycle', svg, 400, 400);
}

// ── 실행 ──
async function main() {
  if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });
  await samhap();
  await banghap();
  await yukhap();
  await ohaeng();
  await sipsin();
  console.log('Done!');
}

main();
