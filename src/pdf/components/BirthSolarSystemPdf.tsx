/**
 * PDF용 출생시점 태양계 행성 배치도
 *
 * @react-pdf/renderer의 Svg 컴포넌트 기반.
 * 브라우저용 BirthSolarSystem.tsx와 계산 로직(planetPositions.ts)을 공유하되,
 * 렌더링은 react-pdf SVG 컴포넌트로 완전히 재작성.
 *
 * react-pdf SVG 제약:
 * - radialGradient, filter(feGaussianBlur 등) 미지원 → 단색 + opacity 레이어로 대체
 * - useMemo 불필요 (서버에서 1회 렌더링)
 * - style prop은 react-pdf StyleSheet 객체 사용
 *
 * 이론적 한계 (리포트 본문에서 명시):
 * - 이 도식은 사주팔자 해석의 직접 근거가 아님
 * - 오행(수금화목토)이 5행성 이름에서 유래했다는 사실의 시각적 맥락 제공
 * - 천왕성·해왕성은 전통 명리 이론과 무관 (흐리게 표시)
 */

import React from 'react';
import { View, Text, Svg, Circle, Ellipse, G, Line } from '@react-pdf/renderer';
import { StyleSheet } from '@react-pdf/renderer';
import { calculatePlanetPositions, logScaleRadius, type PlanetPosition } from '../../../lib/planetPositions';
import { colors, fontSize } from '../styles';

interface BirthSolarSystemPdfProps {
  /** UTC 기준 Date 객체. KST 입력 시 -9h 변환 필요 */
  birthDateUtc: Date;
  /** SVG 크기(pt). react-pdf A4 기준 기본값 320 */
  size?: number;
}

const TILT_DEG = 15;
const Y_FLATTEN = Math.cos((TILT_DEG * Math.PI) / 180); // ≈ 0.966

// ── 오행별 행성 색상 ──
function ohaengColor(ohaeng?: string): string {
  switch (ohaeng) {
    case '水': return '#4a7dbe'; // 수 — 청
    case '金': return '#d4c99a'; // 금 — 백
    case '火': return '#c45c4a'; // 화 — 적
    case '木': return '#4a9060'; // 목 — 녹
    case '土': return '#c99a5e'; // 토 — 황
    default:   return '#888';
  }
}

function formatDateKo(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getUTCFullYear()}.${pad(d.getUTCMonth() + 1)}.${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())} UTC`;
}

// 고정 시드 난수 (PDF는 매번 동일한 별 배치 필요)
function seededStars(size: number, count = 70) {
  let seed = 42;
  const rand = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
  return Array.from({ length: count }, () => ({
    x: rand() * size,
    y: rand() * size,
    r: rand() * 0.7 + 0.2,
    o: rand() * 0.4 + 0.15,
  }));
}

export default function BirthSolarSystemPdf({
  birthDateUtc,
  size = 320,
}: BirthSolarSystemPdfProps) {
  const planets = calculatePlanetPositions(birthDateUtc);
  const center = size / 2;
  const maxPixel = size * 0.42;

  const primary   = planets.filter((p) => p.isPrimary);
  const secondary = planets.filter((p) => !p.isPrimary && p.key !== 'Earth');
  const earth     = planets.find((p) => p.key === 'Earth');
  const stars     = seededStars(size);

  return (
    <View>
      <Svg
        viewBox={`0 0 ${size} ${size}`}
        style={{ width: size, height: size }}
      >
        {/* 배경 */}
        <Circle cx={center} cy={center} r={size / 2} fill="#060d1a" />

        {/* 배경 별 */}
        {stars.map((s, i) => (
          <Circle key={`star-${i}`} cx={s.x} cy={s.y} r={s.r} fill="#ffffff" opacity={s.o} />
        ))}

        {/* 궤도 타원 — 보조 행성 (점선 느낌: 짧은 선분 배열) */}
        {secondary.map((p) => {
          const rPx = logScaleRadius(p.semiMajorAxisAU, 30, maxPixel);
          return (
            <Ellipse
              key={`orbit-sec-${p.key}`}
              cx={center} cy={center}
              rx={rPx} ry={rPx * Y_FLATTEN}
              stroke="#2a3550"
              strokeWidth={0.4}
              fill="none"
            />
          );
        })}

        {/* 궤도 타원 — 5행성 + 지구 */}
        {[...primary, ...(earth ? [earth] : [])].map((p) => {
          const rPx = logScaleRadius(p.semiMajorAxisAU, 30, maxPixel);
          return (
            <Ellipse
              key={`orbit-pri-${p.key}`}
              cx={center} cy={center}
              rx={rPx} ry={rPx * Y_FLATTEN}
              stroke={p.isPrimary ? 'rgba(212,175,55,0.4)' : 'rgba(74,158,255,0.3)'}
              strokeWidth={p.isPrimary ? 0.6 : 0.4}
              fill="none"
            />
          );
        })}

        {/* 태양 — 광원 효과: 반투명 원 겹치기 */}
        <Circle cx={center} cy={center} r={14} fill="#ff8c00" opacity={0.15} />
        <Circle cx={center} cy={center} r={8}  fill="#ffb347" opacity={0.4} />
        <Circle cx={center} cy={center} r={4}  fill="#fff4d6" />

        {/* 천왕성·해왕성 (흐리게) */}
        {secondary.map((p) => {
          const actualR = Math.sqrt(p.x ** 2 + p.y ** 2);
          const theta = Math.atan2(p.y, p.x);
          const rPx = logScaleRadius(actualR, 30, maxPixel);
          const px = center + rPx * Math.cos(theta);
          const py = center + rPx * Math.sin(theta) * Y_FLATTEN;
          const cosT = Math.cos(theta);
          const lx = px + 10 * cosT;
          const ly = py + 10 * Math.sin(theta) * Y_FLATTEN;
          const anchor = cosT > 0.15 ? 'start' : cosT < -0.15 ? 'end' : 'middle';
          return (
            <G key={`sec-${p.key}`}>
              <Circle cx={px} cy={py} r={2} fill="#5a6a8a" opacity={0.6} />
              <Text
                x={lx} y={ly}
                textAnchor={anchor}
                style={{ fontSize: 6.5, fill: '#5a6a8a', fontFamily: 'Paperlogy', fontWeight: 300 }}
              >
                {p.nameKo}
              </Text>
            </G>
          );
        })}

        {/* 지구 */}
        {earth && (() => {
          const actualR = Math.sqrt(earth.x ** 2 + earth.y ** 2);
          const theta = Math.atan2(earth.y, earth.x);
          const rPx = logScaleRadius(actualR, 30, maxPixel);
          const px = center + rPx * Math.cos(theta);
          const py = center + rPx * Math.sin(theta) * Y_FLATTEN;
          const cosT = Math.cos(theta);
          const lx = px + 11 * cosT;
          const ly = py + 11 * Math.sin(theta) * Y_FLATTEN;
          const anchor = cosT > 0.15 ? 'start' : cosT < -0.15 ? 'end' : 'middle';
          return (
            <G key="earth">
              <Circle cx={px} cy={py} r={3} fill="#4a9eff" />
              <Text
                x={lx} y={ly}
                textAnchor={anchor}
                style={{ fontSize: 7, fill: '#88bbff', fontFamily: 'Paperlogy', fontWeight: 300 }}
              >
                지구
              </Text>
            </G>
          );
        })()}

        {/* 5행성 (강조) */}
        {primary.map((p) => {
          const actualR = Math.sqrt(p.x ** 2 + p.y ** 2);
          const theta = Math.atan2(p.y, p.x);
          const rPx = logScaleRadius(actualR, 30, maxPixel);
          const px = center + rPx * Math.cos(theta);
          const py = center + rPx * Math.sin(theta) * Y_FLATTEN;
          const r  = p.key === 'Jupiter' ? 5.5 : p.key === 'Saturn' ? 4.5 : 3.5;
          const offset = r + 11;
          const cosT = Math.cos(theta);
          const lx = px + offset * cosT;
          const ly = py + offset * Math.sin(theta) * Y_FLATTEN;
          const anchor = cosT > 0.15 ? 'start' : cosT < -0.15 ? 'end' : 'middle';
          const col = ohaengColor(p.ohaeng);
          return (
            <G key={`pri-${p.key}`}>
              <Circle cx={px} cy={py} r={r + 3} fill={col} opacity={0.2} />
              <Circle cx={px} cy={py} r={r}     fill={col} />
              <Text
                x={lx} y={ly}
                textAnchor={anchor}
                style={{ fontSize: 8, fill: '#e8d9a8', fontFamily: 'Paperlogy', fontWeight: 400 }}
              >
                {p.nameKo} {p.ohaeng}
              </Text>
            </G>
          );
        })}
      </Svg>
    </View>
  );
}
