/**
 * 오행 분포 펜타곤 레이더 차트 — PDF용
 *
 * 웹용 OhengRadar.tsx (app/alt2/components/result/OhengRadar.tsx)와
 * 동일한 좌표 계산 로직을 사용하며, 렌더링만 @react-pdf/renderer의
 * Svg/Polygon/Circle/Line/Text 컴포넌트로 교체했다.
 *
 * 입력: distribution = { 목: n, 화: n, 토: n, 금: n, 수: n }
 */

import React from 'react';
import { Svg, Polygon, Circle, Line, Text as SvgText, G } from '@react-pdf/renderer';
import { View, Text } from '@react-pdf/renderer';
import { StyleSheet } from '@react-pdf/renderer';
import { colors, fontSize } from '../styles';

// ─── 상수 ────────────────────────────────────────────────────

const LABELS = ['목', '화', '토', '금', '수'] as const;

const OHAENG_COLORS: Record<string, string> = {
  목: colors.wood,
  화: colors.fire,
  토: colors.earth,
  금: colors.metal,
  수: colors.water,
};

/** SVG viewBox 크기 */
const SIZE = 200;
const CX = SIZE / 2;
const CY = SIZE / 2;
const MAX_R = 65;

/** 그리드 단계 (25%, 50%, 75%, 100%) */
const GRID_LEVELS = [0.25, 0.5, 0.75, 1];

// ─── 스타일 ──────────────────────────────────────────────────

const s = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 0.5,
    borderColor: colors.goldDim,
    borderRadius: 4,
    paddingVertical: 10,
  },
  title: {
    fontFamily: 'Paperlogy',
    fontSize: fontSize.xs,
    fontWeight: 600,
    color: colors.blueGray,
    letterSpacing: 1,
    marginBottom: 6,
    textAlign: 'center',
  },
});

// ─── 좌표 헬퍼 ──────────────────────────────────────────────

function getPoint(index: number, r: number): { x: number; y: number } {
  const angle = (index * 72 - 90) * (Math.PI / 180);
  return {
    x: CX + r * Math.cos(angle),
    y: CY + r * Math.sin(angle),
  };
}

function polygonPoints(indices: number[], r: number): string {
  return indices.map(i => {
    const p = getPoint(i, r);
    return `${p.x},${p.y}`;
  }).join(' ');
}

// ─── 컴포넌트 ────────────────────────────────────────────────

interface OhengRadarPdfProps {
  distribution: Record<string, number>;
}

export default function OhengRadarPdf({ distribution }: OhengRadarPdfProps) {
  const maxVal = Math.max(...LABELS.map(l => distribution[l] ?? 0), 1);
  const indices = LABELS.map((_, i) => i);

  // 데이터 폴리곤 꼭짓점
  const dataPointsStr = LABELS.map((label, i) => {
    const val = distribution[label] ?? 0;
    const r = (val / maxVal) * MAX_R;
    const p = getPoint(i, r);
    return `${p.x},${p.y}`;
  }).join(' ');

  // 데이터 점 좌표 배열
  const dataDots = LABELS.map((label, i) => {
    const val = distribution[label] ?? 0;
    const r = (val / maxVal) * MAX_R;
    return getPoint(i, r);
  });

  return (
    <View style={s.wrap}>
      <Text style={s.title}>오행 분포</Text>
      <Svg viewBox={`0 0 ${SIZE} ${SIZE}`} width={180} height={180}>
        {/* 그리드 폴리곤 */}
        {GRID_LEVELS.map(level => (
          <Polygon
            key={`grid-${level}`}
            points={polygonPoints(indices, level * MAX_R)}
            fill="none"
            stroke="rgba(104, 128, 151, 0.2)"
            strokeWidth={0.5}
          />
        ))}

        {/* 축선 (중심 → 꼭짓점) */}
        {indices.map(i => {
          const p = getPoint(i, MAX_R);
          return (
            <Line
              key={`axis-${i}`}
              x1={CX} y1={CY} x2={p.x} y2={p.y}
              stroke="rgba(104, 128, 151, 0.15)"
              strokeWidth={0.5}
            />
          );
        })}

        {/* 데이터 영역 (채움) */}
        <Polygon
          points={dataPointsStr}
          fill="rgba(160, 180, 200, 0.15)"
          stroke={colors.blueGray}
          strokeWidth={1}
        />

        {/* 데이터 점 */}
        {dataDots.map((p, i) => (
          <Circle
            key={`dot-${i}`}
            cx={p.x} cy={p.y} r={2.5}
            fill={OHAENG_COLORS[LABELS[i]]}
          />
        ))}

        {/* 라벨 (오행명 + 개수) */}
        {LABELS.map((label, i) => {
          const angle = (i * 72 - 90) * (Math.PI / 180);
          const lx = CX + (MAX_R + 18) * Math.cos(angle);
          const ly = CY + (MAX_R + 18) * Math.sin(angle);
          const val = distribution[label] ?? 0;
          // textAnchor 근사 — react-pdf SVG Text는 x,y 기준 왼쪽 정렬
          // 좌측 라벨은 약간 왼쪽으로 오프셋
          const xOff = Math.cos(angle) < -0.3 ? -12 : Math.cos(angle) > 0.3 ? -2 : -7;
          const yOff = 3;
          return (
            <SvgText
              key={`label-${label}`}
              x={lx + xOff}
              y={ly + yOff}
              fill={OHAENG_COLORS[label]}
              style={{ fontSize: 8, fontFamily: 'Paperlogy', fontWeight: 600 }}
            >
              {label} {val}
            </SvgText>
          );
        })}
      </Svg>
    </View>
  );
}
