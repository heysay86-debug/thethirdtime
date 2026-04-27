/**
 * card-renderer.ts
 * sharp + SVG overlay 방식으로 1080×1350 캐릭터 카드 PNG를 생성한다.
 *
 * 렌더링 파이프라인:
 *  1. 배경 JPEG (일간 오행별) → 1080×1350 리사이즈 + 어두운 오버레이
 *  2. 캐릭터 PNG (angel/devil/basic) → 중앙 배치
 *  3. SVG 텍스트 레이어 (칭호, 스탯 바, 레지스턴스, 스킬, 워터마크)
 *  4. 최종 PNG 버퍼 반환
 *
 * 에셋 경로 우선순위:
 *  CARD_ASSET_DIR 환경변수 > public/character|background 폴더
 */

import path from 'path';
import fs from 'fs';
import sharp from 'sharp';
import type { CharacterCardData } from './stat-mapper';
import { STAT_COLORS, ELEMENT_EMOJI } from './card-data';

// ── 상수 ──────────────────────────────────────────────────────────────────────

const CARD_W = 1080;
const CARD_H = 1350;

// 기본 색상
const C_DARK_NAVY  = '#3c4859';
const C_YELLOW     = '#f4dea6';
const C_WHITE      = '#ffffff';
const C_OVERLAY    = 'rgba(60,72,89,0.72)';

// 영역 Y 좌표
const TITLE_Y      = 80;
const CHAR_TOP     = 180;
const CHAR_H       = 480;
const STATS_TOP    = CHAR_TOP + CHAR_H + 30;
const RESIST_TOP   = STATS_TOP + 220;
const EXTRA_TOP    = RESIST_TOP + 90;
const BRAND_TOP    = EXTRA_TOP + 120;

// ── 에셋 경로 해석 ─────────────────────────────────────────────────────────────

function resolveAssetDir(): { char: string; bg: string } {
  const envDir = process.env.CARD_ASSET_DIR;
  if (envDir && fs.existsSync(path.join(envDir, 'character'))) {
    return {
      char: path.join(envDir, 'character'),
      bg:   path.join(envDir, 'background'),
    };
  }
  // 프로젝트 public 폴더 fallback
  const publicDir = path.join(process.cwd(), 'public');
  return {
    char: path.join(publicDir, 'character'),
    bg:   path.join(publicDir, 'background'),
  };
}

// ── SVG 생성 ──────────────────────────────────────────────────────────────────

function buildSVG(card: CharacterCardData): string {
  const {
    title, className, element, stats, resistance, skill,
    gyeokGukType, gyeokGukState, strengthScore,
  } = card;

  // 스탯 바 6개
  const statRows = [
    { key: 'STR', label: '힘  STR', val: stats.str },
    { key: 'INT', label: '지  INT', val: stats.int },
    { key: 'WIS', label: '혜  WIS', val: stats.wis },
    { key: 'DEX', label: '민  DEX', val: stats.dex },
    { key: 'CHA', label: '매  CHA', val: stats.cha },
    { key: 'LUK', label: '운  LUK', val: stats.luk },
  ];

  const BAR_X     = 80;
  const BAR_W     = 780;
  const BAR_H     = 24;
  const BAR_TRACK = '#1e2533';

  const statBarsSVG = statRows.map((row, i) => {
    const y = STATS_TOP + i * 36;
    const fillW = Math.round((row.val / 20) * BAR_W);
    const color = STAT_COLORS[row.key] ?? C_YELLOW;
    return `
      <text x="${BAR_X}" y="${y}" font-size="22" fill="${C_WHITE}" font-family="'Noto Sans KR', 'Apple Gothic', sans-serif" font-weight="600">${row.label}</text>
      <rect x="${BAR_X + 140}" y="${y - 18}" width="${BAR_W}" height="${BAR_H}" rx="12" fill="${BAR_TRACK}" />
      <rect x="${BAR_X + 140}" y="${y - 18}" width="${fillW}" height="${BAR_H}" rx="12" fill="${color}" opacity="0.9" />
      <text x="${BAR_X + 140 + BAR_W + 12}" y="${y}" font-size="22" fill="${C_YELLOW}" font-family="monospace" font-weight="700">${String(row.val).padStart(2, ' ')}</text>
    `;
  }).join('');

  // 오행 레지스턴스
  const elements = ['木', '火', '土', '金', '水'] as const;
  const resistCols = elements.map((el, i) => {
    const pct = resistance[el];
    const emoji = ELEMENT_EMOJI[el];
    const x = 80 + i * 192;
    const fillH = Math.round((pct / 100) * 50);
    return `
      <text x="${x + 40}" y="${RESIST_TOP + 20}" font-size="26" fill="${C_WHITE}" text-anchor="middle">${emoji}</text>
      <rect x="${x + 15}" y="${RESIST_TOP + 28}" width="50" height="50" rx="6" fill="#1e2533" />
      <rect x="${x + 15}" y="${RESIST_TOP + 28 + (50 - fillH)}" width="50" height="${fillH}" rx="6" fill="${C_YELLOW}" opacity="0.8" />
      <text x="${x + 40}" y="${RESIST_TOP + 95}" font-size="18" fill="${C_WHITE}" text-anchor="middle" font-family="monospace">${pct}%</text>
    `;
  }).join('');

  // 구분선
  const divider = (y: number) =>
    `<line x1="60" y1="${y}" x2="${CARD_W - 60}" y2="${y}" stroke="${C_YELLOW}" stroke-width="1" opacity="0.3" />`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${CARD_W}" height="${CARD_H}" xmlns="http://www.w3.org/2000/svg">
  <!-- 반투명 오버레이 -->
  <rect width="${CARD_W}" height="${CARD_H}" fill="${C_OVERLAY}" />

  <!-- 상단 패널: 칭호 + 클래스 + 속성 -->
  <rect x="40" y="${TITLE_Y - 10}" width="${CARD_W - 80}" height="90" rx="12" fill="rgba(0,0,0,0.45)" />
  <text x="${CARD_W / 2}" y="${TITLE_Y + 28}" font-size="26" fill="${C_YELLOW}"
        text-anchor="middle" font-family="'Noto Sans KR','Apple Gothic',sans-serif" font-weight="700">${escXml(title)}</text>
  <text x="${CARD_W / 2}" y="${TITLE_Y + 62}" font-size="20" fill="${C_WHITE}"
        text-anchor="middle" font-family="'Noto Sans KR','Apple Gothic',sans-serif">${escXml(element)}</text>

  ${divider(TITLE_Y + 82)}

  <!-- 스탯 영역 -->
  <rect x="40" y="${STATS_TOP - 30}" width="${CARD_W - 80}" height="230" rx="12" fill="rgba(0,0,0,0.40)" />
  ${statBarsSVG}

  ${divider(STATS_TOP + 210)}

  <!-- 오행 레지스턴스 -->
  <rect x="40" y="${RESIST_TOP - 5}" width="${CARD_W - 80}" height="108" rx="12" fill="rgba(0,0,0,0.35)" />
  ${resistCols}

  ${divider(RESIST_TOP + 110)}

  <!-- 스킬 / 격국 / 신강도 -->
  <rect x="40" y="${EXTRA_TOP - 5}" width="${CARD_W - 80}" height="108" rx="12" fill="rgba(0,0,0,0.40)" />
  <text x="80" y="${EXTRA_TOP + 32}" font-size="22" fill="${C_YELLOW}"
        font-family="'Noto Sans KR','Apple Gothic',sans-serif">🔮 장착 스킬: ${escXml(skill)}</text>
  <text x="80" y="${EXTRA_TOP + 64}" font-size="22" fill="${C_WHITE}"
        font-family="'Noto Sans KR','Apple Gothic',sans-serif">📜 격국: ${escXml(gyeokGukType)} (${escXml(gyeokGukState)})</text>
  <text x="80" y="${EXTRA_TOP + 96}" font-size="22" fill="${C_WHITE}"
        font-family="'Noto Sans KR','Apple Gothic',sans-serif">⚖️ 신강도: ${strengthScore}/100</text>

  ${divider(EXTRA_TOP + 112)}

  <!-- 브랜드 워터마크 -->
  <rect x="40" y="${BRAND_TOP - 5}" width="${CARD_W - 80}" height="70" rx="12" fill="rgba(0,0,0,0.50)" />
  <text x="${CARD_W / 2}" y="${BRAND_TOP + 28}" font-size="26" fill="${C_YELLOW}"
        text-anchor="middle" font-family="'Noto Sans KR','Apple Gothic',sans-serif" font-weight="700">제3의시간</text>
  <text x="${CARD_W / 2}" y="${BRAND_TOP + 56}" font-size="18" fill="${C_WHITE}"
        text-anchor="middle" font-family="'Noto Sans KR','Apple Gothic',sans-serif">ttt.betterdan.net</text>
</svg>`;
}

function escXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ── 메인 렌더 함수 ─────────────────────────────────────────────────────────────

/**
 * CharacterCardData를 받아 1080×1350 PNG 버퍼를 반환한다.
 * @throws 에셋 파일을 찾지 못한 경우 Error
 */
export async function renderCard(card: CharacterCardData): Promise<Buffer> {
  const { char: charDir, bg: bgDir } = resolveAssetDir();

  // ── 1. 배경 이미지 ──
  const bgFile = path.join(bgDir, card.backgroundFile);
  if (!fs.existsSync(bgFile)) {
    throw new Error(`배경 이미지를 찾을 수 없습니다: ${bgFile}`);
  }

  const bgResized = await sharp(bgFile)
    .resize(CARD_W, CARD_H, { fit: 'cover', position: 'centre' })
    .png()
    .toBuffer();

  // ── 2. 캐릭터 이미지 (캐릭터 높이 CHAR_H) ──
  const charFile = path.join(charDir, `${card.characterType}.png`);
  let charComposite: sharp.OverlayOptions | null = null;

  if (fs.existsSync(charFile)) {
    const charResized = await sharp(charFile)
      .resize({ height: CHAR_H, fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();

    // 캐릭터 X 중앙 정렬
    const charMeta = await sharp(charResized).metadata();
    const charW = charMeta.width ?? 400;
    const charLeft = Math.round((CARD_W - charW) / 2);

    charComposite = {
      input: charResized,
      top: CHAR_TOP,
      left: charLeft,
    };
  }

  // ── 3. SVG 오버레이 ──
  const svgBuf = Buffer.from(buildSVG(card));

  // ── 4. 합성 ──
  const composites: sharp.OverlayOptions[] = [];
  if (charComposite) composites.push(charComposite);
  composites.push({ input: svgBuf, top: 0, left: 0 });

  const output = await sharp(bgResized)
    .composite(composites)
    .png({ compressionLevel: 8 })
    .toBuffer();

  return output;
}
