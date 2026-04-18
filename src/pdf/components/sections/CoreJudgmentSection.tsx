/**
 * 04. 핵심 판단 — CoreJudgmentSection
 *
 * ┌──────────────────────────────────────┐
 * │ ① 신강/신약 판단                      │
 * │   레벨 바 (극약─신약─중화─신강─극강)  │
 * │   점수 분해 테이블 (월령·득지·득세)   │
 * │   LLM 해석문                          │
 * ├──────────────────────────────────────┤
 * │ ② 격국                                │
 * │   격국명·분류·상태·투출 근거           │
 * │   파격/약화 사유 (있을 경우)           │
 * │   LLM 해석문                          │
 * ├──────────────────────────────────────┤
 * │ ③ 용신                                │
 * │   용신·희신·기신 카드                  │
 * │   5법 비교 테이블                      │
 * │   LLM 해석문                          │
 * └──────────────────────────────────────┘
 */

import React from 'react';
import { View, Text } from '@react-pdf/renderer';
import { Svg, Rect, Circle, Line, G, Text as SvgText } from '@react-pdf/renderer';
import { StyleSheet } from '@react-pdf/renderer';
import PageLayout from '../PageLayout';
import { commonStyles, colors, fontSize } from '../../styles';
import { ohaengToKorean } from '../../utils/koreanReading';

import type { SajuResult } from '@engine/schema';
import type { InterpretationResult } from '../../../gateway/prompts/schema';

// ─── 상수 ────────────────────────────────────────────────────

const STRENGTH_LEVELS = ['극약', '신약', '중화', '신강', '극강'] as const;

const STRENGTH_COLOR: Record<string, string> = {
  극강: '#a83228', 신강: '#8a6820', 중화: '#2d6a40', 신약: '#1e4a7a', 극약: '#4a6275',
};

const GYEOK_STATE_COLOR: Record<string, string> = {
  성격: '#2d6a40', 파격: '#a83228', 약화: '#8a6820',
};

const OHAENG_ELEMENT_COLOR: Record<string, string> = {
  木: colors.wood, 火: colors.fire, 土: colors.earth, 金: colors.metal, 水: colors.water,
};

const WOLRYEONG_LABEL: Record<string, string> = {
  득령: '득령 (월지의 도움을 받음)',
  실령: '실령 (월지의 도움을 받지 못함)',
  중립: '중립',
};

// ─── 스타일 ───────────────────────────────────────────────────

const s = StyleSheet.create({
  sectionBadge: {
    fontFamily: 'Paperlogy', fontSize: fontSize.xs, fontWeight: 300,
    color: colors.blueGray, letterSpacing: 1.5, marginBottom: 4,
  },
  titleDivider: {
    width: 32, height: 0.5, backgroundColor: colors.goldDim,
    marginTop: 8, marginBottom: 14,
  },

  // ── 서브섹션 ──
  subSection: {
    marginBottom: 20,
  },
  subTitle: {
    fontFamily: 'Paperlogy', fontSize: fontSize.md, fontWeight: 700,
    color: colors.darkBg, marginBottom: 10,
  },
  subDivider: {
    width: '100%', height: 0.5, backgroundColor: colors.goldDim, marginBottom: 14,
  },

  // ── 신강/신약 레벨 바 ──
  levelBarWrap: {
    marginBottom: 12, paddingHorizontal: 4,
  },

  // ── 점수 분해 ──
  scoreRow: {
    flexDirection: 'row', gap: 8, marginBottom: 10,
  },
  scoreCard: {
    flex: 1, backgroundColor: colors.ivoryLight,
    borderWidth: 0.5, borderColor: colors.goldDim, borderRadius: 4,
    paddingVertical: 8, paddingHorizontal: 10, alignItems: 'center',
  },
  scoreLabel: {
    fontFamily: 'Paperlogy', fontSize: fontSize.xs, fontWeight: 300,
    color: colors.blueGray, letterSpacing: 0.5, marginBottom: 3,
  },
  scoreValue: {
    fontFamily: 'Paperlogy', fontSize: fontSize.md, fontWeight: 700,
    color: colors.darkBg,
  },
  wolryeongText: {
    fontFamily: 'Paperlogy', fontSize: fontSize.xs, fontWeight: 400,
    color: colors.textMuted, marginBottom: 8,
  },

  // ── 격국 정보 카드 ──
  gyeokInfoWrap: {
    backgroundColor: colors.ivoryLight,
    borderWidth: 0.5, borderColor: colors.goldDim, borderRadius: 4,
    padding: 12, marginBottom: 10,
  },
  gyeokMainRow: {
    flexDirection: 'row', alignItems: 'baseline', gap: 10, marginBottom: 4,
  },
  gyeokType: {
    fontFamily: 'Paperlogy', fontSize: fontSize.lg, fontWeight: 700,
  },
  gyeokMeta: {
    fontFamily: 'Paperlogy', fontSize: fontSize.xs, fontWeight: 400,
    color: colors.textMuted,
  },
  gyeokBasisText: {
    fontFamily: 'Paperlogy', fontSize: fontSize.sm, fontWeight: 400,
    color: colors.textBody, marginTop: 4,
  },
  warningText: {
    fontFamily: 'Paperlogy', fontSize: fontSize.xs, fontWeight: 400,
    color: '#a83228', marginTop: 4,
  },

  // ── 용신 카드 ──
  yongsinRow: {
    flexDirection: 'row', gap: 8, marginBottom: 10,
  },
  yongsinCard: {
    flex: 1, backgroundColor: colors.ivoryLight,
    borderWidth: 0.5, borderColor: colors.goldDim, borderRadius: 4,
    paddingVertical: 10, paddingHorizontal: 12, alignItems: 'center',
  },
  yongsinLabel: {
    fontFamily: 'Paperlogy', fontSize: fontSize.xs, fontWeight: 300,
    color: colors.blueGray, letterSpacing: 0.8, marginBottom: 4,
  },
  yongsinValue: {
    fontFamily: 'Paperlogy', fontSize: fontSize.md, fontWeight: 700,
  },
  yongsinSub: {
    fontFamily: 'Paperlogy', fontSize: fontSize.xs, fontWeight: 300,
    color: colors.textMuted, marginTop: 2,
  },

  // ── 5법 비교 테이블 ──
  methodTable: {
    borderWidth: 0.5, borderColor: colors.goldDim, borderRadius: 4,
    overflow: 'hidden', marginBottom: 10,
  },
  methodRow: {
    flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: colors.goldDim,
  },
  methodRowLast: {
    flexDirection: 'row',
  },
  methodHeaderCell: {
    flex: 1, paddingVertical: 5, paddingHorizontal: 6, alignItems: 'center',
    backgroundColor: 'rgba(104, 128, 151, 0.06)',
  },
  methodHeaderText: {
    fontFamily: 'Paperlogy', fontSize: 7.5, fontWeight: 600,
    color: colors.blueGray, letterSpacing: 0.5,
  },
  methodCell: {
    flex: 1, paddingVertical: 5, paddingHorizontal: 6, alignItems: 'center',
  },
  methodCellText: {
    fontFamily: 'Paperlogy', fontSize: 8, fontWeight: 400,
    color: colors.textBody,
  },
  methodCellMuted: {
    fontFamily: 'Paperlogy', fontSize: 8, fontWeight: 300,
    color: colors.textMuted,
  },
  methodReasoningText: {
    fontFamily: 'Paperlogy', fontSize: fontSize.xs, fontWeight: 400,
    color: colors.textMuted, marginBottom: 10,
  },

  // ── LLM 해석문 ──
  interpretText: {
    fontFamily: 'Paperlogy', fontSize: fontSize.base, fontWeight: 400,
    color: colors.textBody, lineHeight: 1.85, marginBottom: 10,
  },
});

// ─── 신강/신약 레벨 바 SVG ───────────────────────────────────

function StrengthLevelBar({ level, score }: { level: string; score: number }) {
  const W = 460;
  const H = 40;
  const BAR_Y = 14;
  const BAR_H = 6;
  const SEGMENT_W = W / 5;

  const levelIdx = STRENGTH_LEVELS.indexOf(level as any);
  const markerX = (score / 100) * W;
  const levelColor = STRENGTH_COLOR[level] ?? colors.textBody;

  // 5구간 색상 (연한 버전)
  const SEGMENT_COLORS = ['#c0d0dc', '#b0c4d4', '#b0d4b8', '#d4c8a0', '#d4a8a0'];

  return (
    <View style={s.levelBarWrap}>
      <Svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
        {/* 5구간 배경 */}
        {STRENGTH_LEVELS.map((_, i) => (
          <Rect
            key={i}
            x={i * SEGMENT_W} y={BAR_Y}
            width={SEGMENT_W} height={BAR_H}
            fill={i === levelIdx ? levelColor : SEGMENT_COLORS[i]}
            rx={i === 0 ? 3 : 0}
            ry={i === 0 ? 3 : 0}
          />
        ))}

        {/* 구간 라벨 */}
        {STRENGTH_LEVELS.map((lbl, i) => (
          <SvgText
            key={`lbl-${i}`}
            x={i * SEGMENT_W + SEGMENT_W / 2}
            y={10}
            fill={i === levelIdx ? levelColor : colors.textMuted}
            style={{ fontSize: 7, fontFamily: 'Paperlogy', fontWeight: i === levelIdx ? 700 : 300 }}
          >
            {lbl}
          </SvgText>
        ))}

        {/* 마커 (현재 점수 위치) */}
        <Circle cx={markerX} cy={BAR_Y + BAR_H / 2} r={5} fill={levelColor} />
        <SvgText
          x={markerX - 8}
          y={BAR_Y + BAR_H + 14}
          fill={levelColor}
          style={{ fontSize: 8, fontFamily: 'Paperlogy', fontWeight: 700 }}
        >
          {score}점
        </SvgText>
      </Svg>
    </View>
  );
}

// ─── 메인 컴포넌트 ────────────────────────────────────────────

interface CoreJudgmentSectionProps {
  sajuResult: SajuResult;
  interpretation: InterpretationResult;
}

export default function CoreJudgmentSection({ sajuResult, interpretation }: CoreJudgmentSectionProps) {
  const { strength, gyeokGuk, yongSin } = sajuResult;
  const { coreJudgment } = interpretation.sections;

  const levelColor = STRENGTH_COLOR[strength.level] ?? colors.textBody;
  const gyeokStateColor = GYEOK_STATE_COLOR[gyeokGuk.state] ?? colors.textBody;

  // 용신 오행 한글
  const primaryKr = ohaengToKorean(yongSin.final.primary);
  const secondaryKr = yongSin.final.secondary ? ohaengToKorean(yongSin.final.secondary) : null;
  const xiSinKr = yongSin.final.xiSin.map(e => ohaengToKorean(e)).join(' · ');
  const giSinKr = yongSin.final.giSin.map(e => ohaengToKorean(e)).join(' · ');

  // 5법 데이터
  const methods = [
    { key: '억부', data: yongSin.methods.eokbu },
    { key: '조후', data: yongSin.methods.johu },
    { key: '통관', data: yongSin.methods.tonggwan },
    { key: '병약', data: yongSin.methods.byeongyak },
    { key: '전왕', data: yongSin.methods.jeonwang },
  ];

  // 격국 투출 근거 텍스트
  const basisText = gyeokGuk.basis.sourceStem
    ? `판정 근거: ${gyeokGuk.basis.method} — ${gyeokGuk.basis.sourcePosition}의 ${gyeokGuk.basis.sourceStem}`
    : `판정 근거: ${gyeokGuk.basis.method}`;

  // 해석문 단락 분리 헬퍼
  const toParagraphs = (text: string) => text.split(/\n\n+/).map(p => p.trim()).filter(Boolean);

  return (
    <PageLayout showStamp>
      {/* 섹션 헤더 */}
      <Text style={s.sectionBadge}>04</Text>
      <Text style={commonStyles.sectionTitle}>핵심 판단</Text>
      <Text style={commonStyles.sectionSubtitle}>신강 / 신약 · 격국 · 용신</Text>
      <View style={s.titleDivider} />

      {/* ══════════════ ① 신강/신약 ══════════════ */}
      <View style={s.subSection}>
        <Text style={s.subTitle}>신강 / 신약</Text>

        {/* 레벨 바 */}
        <StrengthLevelBar level={strength.level} score={strength.score} />

        {/* 득령 여부 */}
        <Text style={s.wolryeongText}>
          월령: {WOLRYEONG_LABEL[strength.wolryeong] ?? strength.wolryeong}
        </Text>

        {/* 점수 분해 */}
        <View style={s.scoreRow}>
          <View style={s.scoreCard}>
            <Text style={s.scoreLabel}>월령</Text>
            <Text style={s.scoreValue}>{strength.details.wolryeongScore}</Text>
          </View>
          <View style={s.scoreCard}>
            <Text style={s.scoreLabel}>득지</Text>
            <Text style={s.scoreValue}>{strength.details.deukjiScore}</Text>
          </View>
          <View style={s.scoreCard}>
            <Text style={s.scoreLabel}>득세</Text>
            <Text style={s.scoreValue}>{strength.details.deukseScore}</Text>
          </View>
          {strength.details.seolgiPenalty !== 0 && (
            <View style={s.scoreCard}>
              <Text style={s.scoreLabel}>설기 감점</Text>
              <Text style={[s.scoreValue, { color: '#a83228' }]}>{strength.details.seolgiPenalty}</Text>
            </View>
          )}
        </View>

        {/* LLM 해석문 */}
        {toParagraphs(coreJudgment.strengthReading).map((p, i) => (
          <Text key={i} style={s.interpretText}>{p}</Text>
        ))}
      </View>

      <View style={s.subDivider} />

      {/* ══════════════ ② 격국 ══════════════ */}
      <View style={s.subSection}>
        <Text style={s.subTitle}>격국</Text>

        <View style={s.gyeokInfoWrap}>
          <View style={s.gyeokMainRow}>
            <Text style={[s.gyeokType, { color: gyeokStateColor }]}>{gyeokGuk.type}</Text>
            <Text style={s.gyeokMeta}>{gyeokGuk.category} · {gyeokGuk.state}</Text>
          </View>
          <Text style={s.gyeokBasisText}>{basisText}</Text>

          {/* 파격/약화 사유 */}
          {gyeokGuk.breakCauses.length > 0 && (
            <Text style={s.warningText}>파격 사유: {gyeokGuk.breakCauses.join(', ')}</Text>
          )}
          {gyeokGuk.weakenedBy.length > 0 && (
            <Text style={[s.warningText, { color: '#8a6820' }]}>약화 요인: {gyeokGuk.weakenedBy.join(', ')}</Text>
          )}
          {gyeokGuk.warnings.length > 0 &&
            gyeokGuk.warnings.map((w, i) => (
              <Text key={i} style={[s.warningText, { color: colors.blueGray }]}>※ {w}</Text>
            ))
          }
        </View>

        {/* LLM 해석문 */}
        {toParagraphs(coreJudgment.gyeokGukReading).map((p, i) => (
          <Text key={i} style={s.interpretText}>{p}</Text>
        ))}
      </View>

      <View style={s.subDivider} />

      {/* ══════════════ ③ 용신 ══════════════ */}
      <View style={s.subSection}>
        <Text style={s.subTitle}>용신</Text>

        {/* 용신·희신·기신 카드 */}
        <View style={s.yongsinRow}>
          <View style={s.yongsinCard}>
            <Text style={s.yongsinLabel}>용신</Text>
            <Text style={[s.yongsinValue, { color: OHAENG_ELEMENT_COLOR[yongSin.final.primary] ?? colors.textBody }]}>
              {primaryKr}
            </Text>
            {secondaryKr && <Text style={s.yongsinSub}>보조: {secondaryKr}</Text>}
          </View>
          <View style={s.yongsinCard}>
            <Text style={s.yongsinLabel}>희신</Text>
            <Text style={s.yongsinValue}>{xiSinKr}</Text>
          </View>
          <View style={s.yongsinCard}>
            <Text style={s.yongsinLabel}>기신</Text>
            <Text style={s.yongsinValue}>{giSinKr}</Text>
          </View>
          <View style={s.yongsinCard}>
            <Text style={s.yongsinLabel}>판정법</Text>
            <Text style={[s.yongsinValue, { fontSize: fontSize.sm }]}>{yongSin.final.method}</Text>
          </View>
        </View>

        {/* 판정 이유 */}
        <Text style={s.methodReasoningText}>
          판정 근거: {yongSin.final.reasoning}
        </Text>

        {/* 5법 비교 테이블 */}
        <View style={s.methodTable}>
          {/* 헤더 */}
          <View style={s.methodRow}>
            {methods.map(m => (
              <View key={m.key} style={s.methodHeaderCell}>
                <Text style={s.methodHeaderText}>{m.key}</Text>
              </View>
            ))}
          </View>
          {/* 적용 여부 */}
          <View style={s.methodRow}>
            {methods.map(m => (
              <View key={m.key} style={s.methodCell}>
                <Text style={m.data.applicable ? s.methodCellText : s.methodCellMuted}>
                  {m.data.applicable ? '적용' : '—'}
                </Text>
              </View>
            ))}
          </View>
          {/* 용신 */}
          <View style={s.methodRow}>
            {methods.map(m => (
              <View key={m.key} style={s.methodCell}>
                <Text style={m.data.primary ? s.methodCellText : s.methodCellMuted}>
                  {m.data.primary ? ohaengToKorean(m.data.primary) : '—'}
                </Text>
              </View>
            ))}
          </View>
          {/* 희신 */}
          <View style={s.methodRowLast}>
            {methods.map(m => (
              <View key={m.key} style={s.methodCell}>
                <Text style={m.data.secondary ? s.methodCellText : s.methodCellMuted}>
                  {m.data.secondary ? ohaengToKorean(m.data.secondary) : '—'}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* LLM 해석문 */}
        {toParagraphs(coreJudgment.yongSinReading).map((p, i) => (
          <Text key={i} style={s.interpretText}>{p}</Text>
        ))}
      </View>
    </PageLayout>
  );
}
