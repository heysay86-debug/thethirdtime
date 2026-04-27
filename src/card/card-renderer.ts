/**
 * card-renderer.ts
 * card-template.png 기반 캐릭터 카드 PNG 생성기 (1080×1440)
 *
 * 파이프라인:
 *  1. public/card/card-template.png 로드
 *  2. 캐릭터 PNG → 원형 클립 → 초상화 원에 합성
 *  3. SVG 오버레이: HP/MP·스탯·오행%·칭호 커버 + 실제 수치 텍스트
 *  4. PNG 버퍼 반환
 *
 * 좌표 교정 기준:
 *  - Python PIL 픽셀 스캔으로 각 수치 픽셀 아트 위치를 1px 단위로 확인
 *  - 좌열 스탯 숫자: x=713-735 (STR/DEX/WIS/SPD)
 *  - 우열 스탯 숫자: x=870-893 (INT/CHA/LUK)
 *  - HP 숫자: y=402-431 / MP 숫자: y=454-482 (x≈728-894)
 */

import path from 'path';
import fs from 'fs';
import sharp from 'sharp';
import type { CharacterCardData } from './stat-mapper';
import type { OhengElement } from './card-data';

// ── 치수 ──────────────────────────────────────────────────────────────────────

const CARD_W = 1080;
const CARD_H = 1440;

// ── 폰트 ──────────────────────────────────────────────────────────────────────

const FONT = "'Noto Sans KR','Apple Gothic',sans-serif";
const MONO = "'Courier New','DejaVu Sans Mono',monospace";

// ── 픽셀-정밀 좌표 ────────────────────────────────────────────────────────────

// 캐릭터 초상화 원 (변경 없음)
const CHAR_CX = 257;
const CHAR_CY = 430;
const CHAR_R  = 148;

// HP/MP: 템플릿 "195/120" / "26/30" 픽셀아트 위치
//   HP 픽셀아트 y=402-431, MP y=454-482, x=728-894
const HP_COVER = { x: 718, y: 400, w: 186, h: 86 }; // x=718-904, y=400-486 (양쪽 마진)
const HP_TX = 722;  const HP_TY = 428;   // HP 텍스트 baseline
const MP_TX = 722;  const MP_TY = 480;   // MP 텍스트 baseline

// 좌열 스탯 숫자 (STR/DEX/WIS/SPD) — 픽셀아트 x=713-735
const LC_X  = 711;   // 커버 rect 왼쪽 (2px 마진)
const LC_W  = 27;    // 커버 너비 (x=711-737)
const LC_TX = 714;   // 텍스트 x

// 우열 스탯 숫자 (INT/CHA/LUK) — 픽셀아트 x=870-893
const RC_X  = 868;   // 커버 rect 왼쪽
const RC_W  = 28;    // 커버 너비 (x=868-896)
const RC_TX = 871;   // 텍스트 x

// 각 스탯 행의 y 범위 (픽셀 아트 digit 위치, 2px 마진 포함)
// STR/INT 행: y=540-572
// DEX/CHA 행: y=592-623
// WIS/LUK 행: y=643-675
// SPD 행:    y=694-726
interface StatRow { cy: number; ch: number; ty: number; }
const ROWS: Record<'R1'|'R2'|'R3'|'R4', StatRow> = {
  R1: { cy: 540, ch: 32, ty: 568 },  // STR / INT
  R2: { cy: 592, ch: 31, ty: 619 },  // DEX / CHA
  R3: { cy: 643, ch: 32, ty: 671 },  // WIS / LUK
  R4: { cy: 694, ch: 32, ty: 722 },  // SPD (좌열 전용)
};

// 오행 레지스턴스 % (5개 아이콘 중앙)
const ELEM_XS: [number, number, number, number, number] = [152, 340, 528, 716, 904];
const ELEM_Y  = 815;

// 칭호 / 격국 패널
// "TITLE: FARMER" / "JOB: ADVENTURER" 픽셀아트 시작: y≈1018
const TITLE_COVER = { x: 88, y: 1010, w: 911, h: 158 };  // y=1010-1168
const TITLE_TX = 92; const TITLE_TY = 1068;
const CLASS_TX = 92; const CLASS_TY = 1112;

// ── 유틸 ──────────────────────────────────────────────────────────────────────

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ── 에셋 경로 ─────────────────────────────────────────────────────────────────

function resolveAssetPaths(): { template: string; charDir: string } {
  const envDir = process.env.CARD_ASSET_DIR;
  if (envDir) {
    const tpl = path.join(envDir, 'card', 'card-template.png');
    if (fs.existsSync(tpl)) {
      return { template: tpl, charDir: path.join(envDir, 'character') };
    }
  }
  const pub = path.join(process.cwd(), 'public');
  return {
    template: path.join(pub, 'card', 'card-template.png'),
    charDir:  path.join(pub, 'character'),
  };
}

// ── SVG 오버레이 빌더 ─────────────────────────────────────────────────────────

function buildSVG(card: CharacterCardData): string {
  const {
    stats, hp, mp, resistance,
    title, className, gyeokGukType, gyeokGukState,
    strengthScore, skill,
  } = card;

  const COVER_HP   = '#08101e';   // HP/MP 패널 어두운 배경
  const COVER_STAT = '#0d0814';   // 스탯 숫자 위 커버
  const COVER_TTL  = '#060610';    // 완전 불투명 — 투명도 사용 시 픽셀아트 텍스트가 비침

  // ── HP / MP 커버 + 텍스트 ──────────────────────────────────────────────────
  const hpmpSVG = `
  <!-- HP/MP 커버 -->
  <rect x="${HP_COVER.x}" y="${HP_COVER.y}" width="${HP_COVER.w}" height="${HP_COVER.h}" fill="${COVER_HP}"/>
  <!-- HP 수치 -->
  <text x="${HP_TX}" y="${HP_TY}" font-size="26" fill="#ff9090" font-family="${MONO}" font-weight="700">${hp}</text>
  <!-- MP 수치 -->
  <text x="${MP_TX}" y="${MP_TY}" font-size="26" fill="#88bbff" font-family="${MONO}" font-weight="700">${mp}</text>`;

  // ── 스탯 숫자 커버 + 텍스트 ───────────────────────────────────────────────
  // 좌열: STR(R1), DEX(R2), WIS(R3), SPD(R4)
  // 우열: INT(R1), CHA(R2), LUK(R3)
  const statPairs: Array<[string, number, string, number, string]> = [
    //  [row key, left value, left color, right value, right color]
    ['R1', stats.str, '#f4dea6', stats.int, '#f4dea6'],
    ['R2', stats.dex, '#f4dea6', stats.cha, '#f4dea6'],
    ['R3', stats.wis, '#f4dea6', stats.luk, '#f4dea6'],
  ];

  const statSVG = [
    // 좌열 3행
    ...statPairs.map(([rowKey, lv, lc, rv, rc]) => {
      const r = ROWS[rowKey as keyof typeof ROWS];
      return `
  <!-- 좌열 ${rowKey} 커버 -->
  <rect x="${LC_X}" y="${r.cy}" width="${LC_W}" height="${r.ch}" fill="${COVER_STAT}"/>
  <text x="${LC_TX}" y="${r.ty}" font-size="22" fill="${lc}" font-family="${MONO}" font-weight="700">${lv}</text>
  <!-- 우열 ${rowKey} 커버 -->
  <rect x="${RC_X}" y="${r.cy}" width="${RC_W}" height="${r.ch}" fill="${COVER_STAT}"/>
  <text x="${RC_TX}" y="${r.ty}" font-size="22" fill="${rc}" font-family="${MONO}" font-weight="700">${rv}</text>`;
    }),
    // SPD (좌열 전용, 신강도 표시)
    (() => {
      const r = ROWS.R4;
      return `
  <!-- SPD 행 → 신강도 -->
  <rect x="${LC_X}" y="${r.cy}" width="${LC_W}" height="${r.ch}" fill="${COVER_STAT}"/>
  <text x="${LC_TX}" y="${r.ty}" font-size="22" fill="#c8a0ff" font-family="${MONO}" font-weight="700">${strengthScore}</text>`;
    })(),
  ].join('');

  // ── 오행 레지스턴스 % ─────────────────────────────────────────────────────
  const elements: OhengElement[] = ['木', '火', '土', '金', '水'];
  const elemSVG = elements.map((el, i) =>
    `<text x="${ELEM_XS[i]}" y="${ELEM_Y}"
      font-size="26" fill="#ffe97d" font-family="${MONO}" font-weight="700"
      text-anchor="middle">${resistance[el]}%</text>`
  ).join('\n  ');

  // ── 칭호 / 격국 ───────────────────────────────────────────────────────────
  const titleSVG = `
  <!-- 칭호 커버 -->
  <rect x="${TITLE_COVER.x}" y="${TITLE_COVER.y}" width="${TITLE_COVER.w}" height="${TITLE_COVER.h}" fill="${COVER_TTL}" rx="4"/>
  <!-- 칭호 텍스트 -->
  <text x="${TITLE_TX}" y="${TITLE_TY}" font-size="36" fill="#f4dea6" font-family="${FONT}" font-weight="700">${esc(title)}</text>
  <!-- 격국·클래스·스킬 -->
  <text x="${CLASS_TX}" y="${CLASS_TY}" font-size="28" fill="#cceeff" font-family="${FONT}">${esc(gyeokGukType)} (${esc(gyeokGukState)}) · ${esc(className)} · 🔮 ${esc(skill)}</text>`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${CARD_W}" height="${CARD_H}" xmlns="http://www.w3.org/2000/svg">
  ${hpmpSVG}
  ${statSVG}
  <!-- 오행 레지스턴스 % -->
  ${elemSVG}
  ${titleSVG}
</svg>`;
}

// ── 원형 클립 캐릭터 ──────────────────────────────────────────────────────────

async function buildCircularChar(charFile: string): Promise<Buffer> {
  const diameter = CHAR_R * 2;
  const resized = await sharp(charFile)
    .resize(diameter, diameter, { fit: 'cover', position: 'centre' })
    .png()
    .toBuffer();

  const mask = Buffer.from(
    `<svg width="${diameter}" height="${diameter}">` +
    `<circle cx="${CHAR_R}" cy="${CHAR_R}" r="${CHAR_R}" fill="white"/>` +
    `</svg>`
  );

  return sharp(resized)
    .composite([{ input: mask, blend: 'dest-in' }])
    .png()
    .toBuffer();
}

// ── 메인 렌더 함수 ─────────────────────────────────────────────────────────────

/**
 * CharacterCardData를 받아 1080×1440 PNG 버퍼를 반환한다.
 * @throws 템플릿 파일 미발견 시 Error
 */
export async function renderCard(card: CharacterCardData): Promise<Buffer> {
  const { template: templatePath, charDir } = resolveAssetPaths();

  if (!fs.existsSync(templatePath)) {
    throw new Error(`카드 템플릿을 찾을 수 없습니다: ${templatePath}`);
  }

  const templateBuf = await sharp(templatePath)
    .resize(CARD_W, CARD_H, { fit: 'fill' })
    .png()
    .toBuffer();

  const composites: sharp.OverlayOptions[] = [];

  // 캐릭터 원형 클립
  const charFile = path.join(charDir, `${card.characterType}.png`);
  if (fs.existsSync(charFile)) {
    const circularChar = await buildCircularChar(charFile);
    composites.push({
      input: circularChar,
      top:  CHAR_CY - CHAR_R,
      left: CHAR_CX - CHAR_R,
    });
  }

  // SVG 오버레이
  const svgBuf = Buffer.from(buildSVG(card));
  composites.push({ input: svgBuf, top: 0, left: 0 });

  return sharp(templateBuf)
    .composite(composites)
    .png({ compressionLevel: 8 })
    .toBuffer();
}
