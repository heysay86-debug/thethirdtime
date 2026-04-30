'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { performSambyeon, getGuaName, collectEntropy, type YaoResult, type YaoValue } from '@/src/hyo/sicho';
import { trackEvent } from '@/src/analytics';
import { STAGES, START_POS, ALTAR_POS } from '@/src/hyo/stages';
import BgmPlayer from '@/app/alt2/components/base/BgmPlayer';
import { interpretCast, type GuaInterpretation, type YaoInterpretation } from '@/src/hyo/gua-lookup';
import { getGuaPalace, getPalaceLabel, liuqinKorean, type GuaPalaceInfo } from '@/src/hyo/gua-palace';
import { generateTraditionalReading } from '@/src/hyo/gua-reading';
import { analyzeLiuYao, type LiuYaoAnalysis, type CategoryAssessment, type Verdict } from '@/src/hyo/liuyao';
import { getYearPillar } from '@/src/engine/pillar_year';
import { getMonthPillar } from '@/src/engine/pillar_month';
import { getIljinByDate } from '@/src/engine/data/iljin_adapter';
import { getHourPillar } from '@/src/engine/pillar_hour';

type Phase = 'entrance' | 'intro' | 'split' | 'counting' | 'result' | 'incantation' | 'preview' | 'complete' | 'dice_reroll';

// 픽셀 도트 1개
// 시초 나뭇가지 탭 — 좌우 분리 애니메이션
function SichoSplitVisual({ onClick }: { onClick: (e: React.MouseEvent | React.TouchEvent) => void }) {
  const [splitting, setSplitting] = useState(false);
  const branchHeights = useRef(
    Array.from({ length: 49 }, () => 28 + Math.floor(Math.random() * 8))
  );

  const handleTap = (e: React.MouseEvent | React.TouchEvent) => {
    if (splitting) return;
    setSplitting(true);
    setTimeout(() => {
      onClick(e);
    }, 400);
  };

  return (
    <>
      <div
        onClick={handleTap}
        onTouchStart={handleTap}
        style={{
          display: 'flex', justifyContent: 'center',
          padding: '16px 0', cursor: 'pointer',
        }}
      >
        {/* 왼쪽 묶음 */}
        <div style={{
          display: 'flex', gap: 2,
          transform: splitting ? 'translateX(-30px)' : 'translateX(0)',
          transition: 'transform 400ms ease-out',
        }}>
          {branchHeights.current.slice(0, 25).map((h, i) => (
            <div key={i} style={{
              width: 2, height: h,
              backgroundColor: '#c4a86a', borderRadius: 1,
              opacity: 0.6 + (i % 3) * 0.15,
            }} />
          ))}
        </div>
        {/* 간격 */}
        <div style={{ width: splitting ? 20 : 0, transition: 'width 400ms ease-out' }} />
        {/* 오른쪽 묶음 */}
        <div style={{
          display: 'flex', gap: 2,
          transform: splitting ? 'translateX(30px)' : 'translateX(0)',
          transition: 'transform 400ms ease-out',
        }}>
          {branchHeights.current.slice(25).map((h, i) => (
            <div key={i} style={{
              width: 2, height: h,
              backgroundColor: '#c4a86a', borderRadius: 1,
              opacity: 0.6 + (i % 3) * 0.15,
            }} />
          ))}
        </div>
      </div>
      <div style={{ fontSize: 11, color: '#889', marginTop: 4, textAlign: 'center' }}>탭하여 나누기</div>
    </>
  );
}

// ─── 주사위 미니게임 (변효 0개 시) ────────────────────────────

const TRIGRAM_LABELS = ['건(天)', '태(澤)', '리(火)', '진(雷)', '손(風)', '감(水)', '간(山)', '곤(地)'];
const TRIGRAM_BITS: number[][] = [
  [1,1,1], // 건
  [1,1,0], // 태
  [1,0,1], // 리
  [0,0,1], // 진
  [1,1,0].reverse(), // 손 = [0,1,1]
  [0,1,0], // 감
  [1,0,0], // 간
  [0,0,0], // 곤
];
// 정확한 소성괘 비트 (초효부터, LSB)
const TRIGRAM_TO_BITS: number[][] = [
  [1,1,1], // 1=건
  [0,1,1], // 2=태
  [1,0,1], // 3=리
  [1,0,0], // 4=진
  [0,1,1], // 5=손 — 수정: trigramIndex 기준
  [0,1,0], // 6=감
  [0,0,1], // 7=간 — 수정
  [0,0,0], // 8=곤
];

function DiceRerollGame({ onComplete }: {
  onComplete: (yaos: YaoResult[]) => void;
}) {
  const [rolling, setRolling] = useState(false);
  const [done, setDone] = useState(false);
  const [d8a, setD8a] = useState(1); // 상괘
  const [d8b, setD8b] = useState(1); // 하괘
  const [d6, setD6] = useState(1);   // 동효 위치
  const [displayA, setDisplayA] = useState(1);
  const [displayB, setDisplayB] = useState(1);
  const [display6, setDisplay6] = useState(1);

  const handleRoll = useCallback(() => {
    if (rolling || done) return;
    setRolling(true);

    // 최종 값 결정
    const arr8 = new Uint8Array(2);
    const arr6 = new Uint8Array(1);
    crypto.getRandomValues(arr8);
    crypto.getRandomValues(arr6);
    const finalA = (arr8[0] % 8) + 1;
    const finalB = (arr8[1] % 8) + 1;
    const final6 = (arr6[0] % 6) + 1;
    setD8a(finalA);
    setD8b(finalB);
    setD6(final6);

    // 슬롯머신 애니메이션
    let count = 0;
    const interval = setInterval(() => {
      setDisplayA(Math.floor(Math.random() * 8) + 1);
      setDisplayB(Math.floor(Math.random() * 8) + 1);
      setDisplay6(Math.floor(Math.random() * 6) + 1);
      count++;
      if (count > 15) {
        clearInterval(interval);
        setDisplayA(finalA);
        setDisplayB(finalB);
        setDisplay6(final6);
        setRolling(false);
        setDone(true);

        // 괘 조립
        setTimeout(() => {
          // sicho.ts의 trigramIndex와 동일한 매핑 사용
          // d8 1~8 → 건태리진손감간곤 → trigramIndex 7,3,5,1,6,2,4,0
          const trigramIndexMap = [7, 3, 5, 1, 6, 2, 4, 0]; // d8값 1~8 → trigramIndex
          const upperIdx = trigramIndexMap[finalA - 1];
          const lowerIdx = trigramIndexMap[finalB - 1];

          // trigramIndex → 비트 (LSB first)
          const toBits = (idx: number): number[] => [idx & 1, (idx >> 1) & 1, (idx >> 2) & 1];
          const lowerBits = toBits(lowerIdx);
          const upperBits = toBits(upperIdx);
          const gua = [...lowerBits, ...upperBits]; // 6비트

          // 동효 위치 (1~6, 0-indexed = final6 - 1)
          const changingIdx = final6 - 1;

          // yaos 생성
          const newYaos: YaoResult[] = gua.map((bit, i) => {
            const isChanging = i === changingIdx;
            const isYang = bit === 1;
            if (isChanging) {
              return {
                value: (isYang ? 9 : 6) as YaoValue,
                isYang, isChanging: true,
                label: isYang ? '노양' : '노음',
              };
            }
            return {
              value: (isYang ? 7 : 8) as YaoValue,
              isYang, isChanging: false,
              label: isYang ? '소양' : '소음',
            };
          });

          onComplete(newYaos);
        }, 800);
      }
    }, 80);
  }, [rolling, done, onComplete]);

  // 주사위 스타일
  const diceBase: React.CSSProperties = {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: 700, fontSize: 24, color: '#f0dfad',
    border: '2px solid rgba(240,223,173,0.3)',
    backgroundColor: 'rgba(240,223,173,0.08)',
    cursor: 'pointer',
  };

  const d8Style: React.CSSProperties = {
    ...diceBase,
    width: 64, height: 64,
    borderRadius: 8,
    transform: 'rotate(45deg)',
  };

  const d6Style: React.CSSProperties = {
    ...diceBase,
    width: 56, height: 56,
    borderRadius: 10,
  };

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{
        fontFamily: '"Gaegu", cursive', fontSize: 16,
        color: '#c8cdd3', lineHeight: 1.7, marginBottom: 24,
        whiteSpace: 'pre-line',
      }}>
        {'기운이 고요하여\n해석에 의미가 발생하지 않네.\n\n다른 방법으로 다시 여쭤보겠네.'}
      </div>

      <div
        onClick={handleRoll}
        style={{
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          gap: 20, padding: '24px 0', cursor: 'pointer',
        }}
      >
        {/* 팔각주사위 1 (상괘) */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <div style={d8Style}>
            <span style={{ transform: 'rotate(-45deg)' }}>{displayA}</span>
          </div>
          <span style={{ fontSize: 10, color: '#667' }}>
            {done ? TRIGRAM_LABELS[d8a - 1] : '상괘'}
          </span>
        </div>

        {/* 팔각주사위 2 (하괘) */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <div style={d8Style}>
            <span style={{ transform: 'rotate(-45deg)' }}>{displayB}</span>
          </div>
          <span style={{ fontSize: 10, color: '#667' }}>
            {done ? TRIGRAM_LABELS[d8b - 1] : '하괘'}
          </span>
        </div>

        {/* 육각주사위 (동효) */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <div style={d6Style}>
            {display6}
          </div>
          <span style={{ fontSize: 10, color: '#667' }}>
            {done ? `${d6}효 변` : '동효'}
          </span>
        </div>
      </div>

      {!done && !rolling && (
        <div style={{ fontSize: 12, color: '#889', marginTop: 8 }}>
          탭하여 주사위를 굴리세요
        </div>
      )}
      {done && (
        <div style={{ fontSize: 12, color: '#f0dfad', marginTop: 8 }}>
          괘를 읽고 있습니다...
        </div>
      )}
    </div>
  );
}

function Dot({ color, glow }: { color: string; glow?: boolean }) {
  return (
    <div style={{
      width: 4, height: 4,
      backgroundColor: color,
      boxShadow: glow ? `0 0 4px ${color}, 0 0 8px ${color}` : undefined,
    }} />
  );
}

// 효 심볼 렌더링 — 픽셀아트 스타일
function YaoSymbol({ yao, size = 32 }: { yao: YaoResult; size?: number }) {
  const dotCount = Math.max(5, Math.floor(size / 6));
  const halfDots = Math.floor(dotCount * 0.4);
  const gapDots = Math.max(2, dotCount - halfDots * 2);

  const baseColor = yao.isChanging ? '#f0dfad' : '#aab4be';
  const glowColor = '#f0dfad';
  const isGlow = yao.isChanging;

  // 양효 기준 totalWidth를 공통으로 사용 → 양/음 동일 너비
  const totalWidth = dotCount * 4 + (dotCount - 1) * 2;

  const changingDot = yao.isChanging ? (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
      width: 6, height: 6, borderRadius: '50%',
      backgroundColor: glowColor,
      boxShadow: `0 0 6px ${glowColor}, 0 0 12px ${glowColor}`,
      animation: 'pixel-pulse 1.5s ease-in-out infinite',
    }} />
  ) : null;

  if (yao.isYang) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: totalWidth, height: size * 0.25, position: 'relative',
      }}>
        <div style={{ display: 'flex', gap: 2 }}>
          {Array.from({ length: dotCount }).map((_, i) => (
            <Dot key={i} color={baseColor} glow={isGlow} />
          ))}
        </div>
        {changingDot}
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      width: totalWidth, height: size * 0.25, position: 'relative',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
        <div style={{ display: 'flex', gap: 2 }}>
          {Array.from({ length: halfDots }).map((_, i) => (
            <Dot key={`l${i}`} color={baseColor} glow={isGlow} />
          ))}
        </div>
        <div style={{ width: gapDots * 6 }} />
        <div style={{ display: 'flex', gap: 2 }}>
          {Array.from({ length: halfDots }).map((_, i) => (
            <Dot key={`r${i}`} color={baseColor} glow={isGlow} />
          ))}
        </div>
      </div>
      {changingDot}
    </div>
  );
}

// 복사 버튼 컴포넌트
function CopyButton({ getText, label = '복사하기' }: { getText: () => string; label?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(getText());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const ta = document.createElement('textarea');
      ta.value = getText();
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
    trackEvent('hyo_copy');
  };

  return (
    <button
      onClick={handleCopy}
      style={{
        padding: '6px 14px',
        background: copied ? 'rgba(120, 200, 120, 0.15)' : 'rgba(240,223,173,0.08)',
        border: `1px solid ${copied ? 'rgba(120, 200, 120, 0.3)' : 'rgba(240,223,173,0.15)'}`,
        borderRadius: 14,
        color: copied ? '#8c8' : '#999',
        fontSize: 11,
        cursor: 'pointer',
        transition: 'all 0.2s',
      }}
    >
      {copied ? '복사됨!' : label}
    </button>
  );
}

// verdict 뱃지
const VERDICT_COLORS: Record<string, string> = {
  '대길': '#f0dfad',
  '길': '#97c6aa',
  '평': '#889',
  '흉': '#c9956a',
  '대흉': '#c96a6a',
};

function VerdictBadge({ verdict }: { verdict: Verdict }) {
  const color = VERDICT_COLORS[verdict] || '#889';
  return (
    <span style={{
      fontSize: 9, fontWeight: 700, color,
      padding: '1px 5px', borderRadius: 4,
      border: `1px solid ${color}44`,
      background: `${color}15`,
      letterSpacing: 0.5,
    }}>
      {verdict}
    </span>
  );
}

// 카드(밝은 배경)용 verdict 뱃지
const CARD_VERDICT_COLORS: Record<string, string> = {
  '대길': '#8a6a1e',
  '길': '#3a7a4a',
  '평': '#777',
  '흉': '#a06030',
  '대흉': '#a03030',
};

function CardVerdictBadge({ verdict }: { verdict: string }) {
  const color = CARD_VERDICT_COLORS[verdict] || '#777';
  return (
    <span style={{
      fontSize: 8, fontWeight: 700, color,
      padding: '1px 4px', borderRadius: 3,
      border: `1px solid ${color}44`,
      background: `${color}12`,
      letterSpacing: 0.5,
    }}>
      {verdict}
    </span>
  );
}

// 괘 해석 텍스트 포맷 — 총론 + 효사 + 카테고리 + 지괘 + 구조
function formatGuaText(
  bonGua: GuaInterpretation,
  changingYao: YaoInterpretation[],
  changedGua: GuaInterpretation | null,
  userQuestion: string,
  palaceInfo: ReturnType<typeof getGuaPalace>,
  yaos: YaoResult[],
): string {
  let text = `[${bonGua.name}]\n`;
  if (userQuestion) text += `"${userQuestion}"\n`;

  text += `\n── 총론 ──\n${bonGua.chongron}\n`;

  if (changingYao.length > 0) {
    text += `\n── 핵심 효사 ──\n`;
    for (const yao of changingYao) {
      const label = ['첫', '둘', '셋', '넷', '다섯', '여섯'][yao.yao - 1];
      text += `\n[${label}째 기운 → ${yao.byeonGuaName}]\n`;
      text += `${yao.general}\n`;
    }
  }

  // 카테고리
  const categorySource = getCategorySource(changingYao, bonGua, changedGua);
  if (categorySource) {
    text += `\n── 항목별 풀이 ──\n`;
    for (const [cat, val] of Object.entries(categorySource)) {
      text += `${cat}: ${val}\n`;
    }
  }

  if (changedGua && changingYao.length > 0) {
    text += `\n── 흘러가는 괘 ──\n${changedGua.name}\n${changedGua.chongron}\n`;
  }

  // 구조 정보
  if (palaceInfo) {
    text += `\n── 참고: 괘 구조 ──\n`;
    text += generateTraditionalReading(palaceInfo, bonGua.name, yaos);
    text += '\n';
  }

  text += `\n— 제3의시간 · 육효점 (ttt.betterdan.net/hyo)`;
  return text;
}

// 동효 개수별 카테고리 소스 결정
function getCategorySource(
  changingYao: YaoInterpretation[],
  bonGua: GuaInterpretation | null,
  changedGua: GuaInterpretation | null,
): Record<string, string> | null {
  const count = changingYao.length;

  if (count === 0) {
    // 본괘 초효 카테고리
    return bonGua?.yao?.[0]?.categories || null;
  }
  if (count === 1) {
    // 해당 동효 카테고리
    return changingYao[0].categories;
  }
  if (count === 2) {
    // 위쪽 동효 카테고리
    return changingYao[changingYao.length - 1].categories;
  }
  if (count === 3) {
    // 본괘 총론 기준 (초효)
    return bonGua?.yao?.[0]?.categories || null;
  }
  if (count === 6) {
    // 지괘 초효 카테고리
    return changedGua?.yao?.[0]?.categories || null;
  }
  // 4~5개: 지괘 해당 효 카테고리 — 지괘 초효 fallback
  return changedGua?.yao?.[0]?.categories || null;
}

// 효별 해석 텍스트 포맷
function formatYaoText(yao: YaoInterpretation, bonGuaName: string): string {
  const label = ['첫', '둘', '셋', '넷', '다섯', '여섯'][yao.yao - 1];
  let text = `[육효점 · ${bonGuaName} · ${label}째 기운]\n\n`;
  text += `→ ${yao.byeonGuaName}\n\n`;
  text += `${yao.general}\n\n`;
  for (const [cat, val] of Object.entries(yao.categories)) {
    text += `${cat}: ${val}\n`;
  }
  text += `\n— 제3의시간 · 육효점 (ttt.betterdan.net/hyo)`;
  return text;
}

// 주문 나레이션 — 한 줄씩 아래→위 페이드인 후 디졸브
function IncantationNarration({ lines, onComplete }: { lines: string[]; onComplete: () => void }) {
  const [lineIndex, setLineIndex] = useState(0);
  const [showButton, setShowButton] = useState(false);
  const [animState, setAnimState] = useState<'entering' | 'visible' | 'exiting'>('entering');

  useEffect(() => {
    if (lineIndex >= lines.length) {
      setShowButton(true);
      return;
    }

    // entering → visible (0.8s)
    setAnimState('entering');
    const visibleTimer = setTimeout(() => setAnimState('visible'), 800);
    // visible → exiting (1.5s 후)
    const exitTimer = setTimeout(() => setAnimState('exiting'), 2300);
    // exiting → next line (0.8s 후)
    const nextTimer = setTimeout(() => setLineIndex(i => i + 1), 3100);

    return () => {
      clearTimeout(visibleTimer);
      clearTimeout(exitTimer);
      clearTimeout(nextTimer);
    };
  }, [lineIndex, lines.length]);

  const animStyle: React.CSSProperties = animState === 'entering'
    ? { opacity: 0, transform: 'translateY(20px)', transition: 'all 0.8s ease-out' }
    : animState === 'visible'
    ? { opacity: 1, transform: 'translateY(0)', transition: 'all 0.8s ease-out' }
    : { opacity: 0, transform: 'translateY(-10px)', transition: 'all 0.8s ease-in' };

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center"
      style={{ zIndex: 10, background: 'rgba(0,0,0,0.7)' }}
    >
      <div style={{
        minHeight: 80,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '0 32px',
      }}>
        {lineIndex < lines.length && (
          <div
            key={lineIndex}
            style={{
              fontSize: 20,
              lineHeight: 1.6,
              color: '#f0dfad',
              fontFamily: 'var(--font-gaegu), "Gaegu", cursive',
              textAlign: 'center',
              ...animStyle,
            }}
          >
            {lines[lineIndex]}
          </div>
        )}
      </div>

      {showButton && (
        <button
          onClick={onComplete}
          style={{
            marginTop: 40,
            padding: '12px 32px',
            background: 'rgba(240,223,173,0.1)',
            border: '1px solid rgba(240,223,173,0.3)',
            borderRadius: 20,
            color: '#f0dfad',
            fontSize: 14,
            cursor: 'pointer',
            opacity: 0,
            animation: 'narration-btn-in 1s ease 0.3s forwards',
          }}
        >
          괘를 열다
        </button>
      )}

      <style>{`
        @keyframes narration-btn-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

function CompleteView({ guaInfo, castResult, yaos, onReset, userQuestion, castDate }: {
  guaInfo: { name: string; korean: string };
  castResult: ReturnType<typeof interpretCast>;
  yaos: YaoResult[];
  onReset: () => void;
  userQuestion: string;
  castDate: Date;
}) {
  const [showStructure, setShowStructure] = useState(false);
  const categoryCardRef = useRef<HTMLDivElement>(null);

  const bonGua = castResult.bonGua;
  const changingYao = castResult.changingYao;
  const changedGua = castResult.changedGua;
  const palaceInfo = getGuaPalace(castResult.originalGua);

  // 동효 개수별 카테고리 소스
  const categories = getCategorySource(changingYao, bonGua, changedGua) || {};

  // 월건·일진 기반 기운 분석
  const liuyaoAnalysis: LiuYaoAnalysis | null = (() => {
    if (!palaceInfo || Object.keys(categories).length === 0) return null;
    try {
      return analyzeLiuYao(castDate, palaceInfo, yaos, Object.keys(categories));
    } catch {
      return null;
    }
  })();

  // 카테고리별 verdict 빠른 조회
  const verdictMap = new Map<string, CategoryAssessment>();
  liuyaoAnalysis?.assessments.forEach(a => verdictMap.set(a.category, a));

  // 카드용 총론 전문 — 지괘가 있으면 지괘 총론, 없으면 본괘 총론
  const cardChongronSource = (changedGua && changingYao.length > 0) ? changedGua : bonGua;
  const chongronSummary = cardChongronSource?.chongron || '';

  const jiName = changedGua?.name || bonGua?.name;
  const isSameGua = bonGua?.name === jiName;

  // 카드용 점일 표시 (서양식 + 동양식 병기)
  const castDateDisplay = (() => {
    const d = castDate;
    const western = `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} / ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    try {
      const yearP = getYearPillar(d);
      const monthP = getMonthPillar(d);
      const iljin = getIljinByDate(d);
      const hourP = getHourPillar(d, true);
      const dayStr = iljin ? iljin.hanja : '';
      const hourStr = hourP.known ? `${hourP.pillar.gan}${hourP.pillar.ji}` : '';
      const eastern = `${yearP.gan}${yearP.ji}년 ${monthP.gan}${monthP.ji}월 ${dayStr}일${hourStr ? ` ${hourStr}시` : ''}`;
      return { western, eastern };
    } catch {
      return { western, eastern: '' };
    }
  })();

  const handleDownloadCard = async (style: 'dark' | 'light' = 'dark') => {
    // 카테고리 데이터 조립
    const catItems = Object.entries(categories).map(([cat, val]) => {
      const { main, sub } = parseCatKey(cat);
      const verdict = verdictMap.get(cat)?.verdict;
      return { name: main, sub: sub || undefined, value: val, verdict };
    });

    try {
      const res = await fetch('/api/hyo/card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gua: bonGua?.name || '',
          ji: jiName || '',
          q: userQuestion,
          date: castDateDisplay.western,
          ganji: castDateDisplay.eastern,
          summary: chongronSummary.replace(/\n/g, '|'),
          cats: catItems,
          style,
        }),
      });
      if (!res.ok) throw new Error('카드 생성 실패');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `육효점-${bonGua?.name || '결과'}-${style}.png`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('카드 이미지 생성에 실패했습니다.');
    }
  };

  // 카테고리 키에서 괄호 분리
  function parseCatKey(cat: string): { main: string; sub: string | null } {
    const match = cat.match(/^(.+?)\((.+)\)$/);
    if (match) return { main: match[1], sub: match[2].replace(/,/g, ' · ') };
    return { main: cat, sub: null };
  }

  return (
    <>
      {/* 1. 유저 질문 리마인드 */}
      {userQuestion && (
        <div style={{
          fontSize: 13, color: '#a1c5ac', fontStyle: 'italic', marginBottom: 16,
          padding: '8px 12px',
          background: 'rgba(151, 198, 170, 0.08)',
          borderRadius: 8,
          borderLeft: '2px solid rgba(151, 198, 170, 0.3)',
        }}>
          &ldquo;{userQuestion}&rdquo;
        </div>
      )}

      {/* 2. 괘 이름 + 총론 전문 */}
      {bonGua && (
        <>
          <div style={{
            textAlign: 'center', marginBottom: 16, padding: '8px 0',
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 10, color: '#889' }}>본괘</div>
                <div style={{ fontSize: 18, color: '#f0dfad', fontWeight: 700 }}>{bonGua.name}</div>
              </div>
              {!isSameGua && (
                <>
                  <div style={{ fontSize: 16, color: '#889' }}>→</div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 10, color: '#889' }}>지괘</div>
                    <div style={{ fontSize: 18, color: '#f0dfad', fontWeight: 700 }}>{jiName}</div>
                  </div>
                </>
              )}
            </div>
            <div style={{ fontSize: 11, color: '#667', marginTop: 6 }}>
              {guaInfo.name}
            </div>
          </div>

          <div style={{
            fontSize: 13, lineHeight: 1.9, whiteSpace: 'pre-line', marginBottom: 20,
            textAlign: 'left', color: '#ccc',
            padding: '12px',
            background: 'rgba(240,223,173,0.04)',
            borderRadius: 10,
            borderLeft: '2px solid rgba(240,223,173,0.3)',
          }}>
            {bonGua.chongron}
          </div>
        </>
      )}

      {/* 3. 핵심 효사 + 동효 읽기 안내 */}
      {changingYao.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{
            fontSize: 12, color: '#f0dfad', letterSpacing: 1, marginBottom: 10,
            borderBottom: '1px solid rgba(240,223,173,0.15)',
            paddingBottom: 6,
          }}>
            핵심 풀이
          </div>

          {/* 읽기 안내 */}
          <div style={{
            fontSize: 12, color: '#ccc', lineHeight: 1.7, marginBottom: 12,
            padding: '8px 10px',
            background: 'rgba(240,223,173,0.04)',
            borderRadius: 8,
          }}>
            {changingYao.length === 1
              ? '움직이는 기운이 하나 있네. 아래의 효사가 핵심 답이야.'
              : changingYao.length === 2
              ? '두 개의 기운이 움직이고 있어. 둘 다 읽되, 위쪽 효사를 중심으로 보게.'
              : changingYao.length === 3
              ? '세 개의 기운이 요동치고 있군. 위의 본괘 총론과 아래의 지괘 총론을 함께 읽게.'
              : `${changingYao.length}개나 움직이고 있어. 아래의 지괘 총론을 중심으로 읽게.`
            }
          </div>

          {/* 효사 전문 표시 */}
          {changingYao.map((yao) => {
            const yaoLabel = ['첫', '둘', '셋', '넷', '다섯', '여섯'][yao.yao - 1] || yao.yao;
            return (
              <div
                key={yao.yao}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  marginBottom: 8,
                  background: 'rgba(240,223,173,0.06)',
                  border: '1px solid rgba(240,223,173,0.12)',
                  borderRadius: 10,
                  textAlign: 'left',
                  lineHeight: 1.7,
                }}
              >
                <div style={{ marginBottom: 6 }}>
                  <span style={{ color: '#f0dfad', fontWeight: 600, fontSize: 13 }}>
                    {yaoLabel}째 기운
                  </span>
                  <span style={{ color: '#889', margin: '0 6px', fontSize: 12 }}>→</span>
                  <span style={{ color: '#dde1e5', fontSize: 12 }}>{yao.byeonGuaName}</span>
                </div>
                <div style={{
                  color: '#ccc', fontSize: 12, whiteSpace: 'pre-line', lineHeight: 1.8,
                }}>
                  {yao.general}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 동효 0개 안내 */}
      {changingYao.length === 0 && (
        <div style={{
          fontSize: 12, color: '#ccc', lineHeight: 1.7, marginBottom: 16,
          padding: '10px 12px',
          background: 'rgba(240,223,173,0.04)',
          borderRadius: 8,
        }}>
          모든 기운이 고요하네. 변화 없이 이 괘의 뜻 그대로가 자네의 답이야.
          지금은 움직일 때가 아니라, 있는 그대로를 받아들일 때라는 뜻이지.
        </div>
      )}

      {/* 4. 오늘의 기운 + 17개 카테고리 전체 */}
      {Object.keys(categories).length > 0 && (
        <div style={{ marginBottom: 20 }}>
          {/* 오늘의 기운 요약 */}
          {liuyaoAnalysis && (
            <div style={{
              padding: '10px 12px', marginBottom: 12,
              background: 'rgba(97,129,153,0.1)',
              borderRadius: 8, borderLeft: '2px solid rgba(97,129,153,0.4)',
            }}>
              <div style={{ fontSize: 11, color: '#889', fontWeight: 600, marginBottom: 4 }}>
                오늘의 기운
              </div>
              <div style={{ fontSize: 11, color: '#a0a8b0', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
                {liuyaoAnalysis.summary}
              </div>
            </div>
          )}

          <div style={{
            fontSize: 12, color: '#f0dfad', letterSpacing: 1, marginBottom: 10,
            borderBottom: '1px solid rgba(240,223,173,0.15)',
            paddingBottom: 6,
          }}>
            항목별 풀이
          </div>
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr', gap: 4,
            width: '100%',
          }}>
            {Object.entries(categories).map(([cat, val]) => {
              const { main, sub } = parseCatKey(cat);
              const assessment = verdictMap.get(cat);
              return (
                <div key={cat} style={{
                  padding: '7px 10px',
                  background: 'rgba(240,223,173,0.05)',
                  borderRadius: 8,
                  fontSize: 12,
                }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    <div style={{ flexShrink: 0, minWidth: 52 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ color: '#f0dfad', fontWeight: 600 }}>{main}</span>
                        {assessment && (
                          <VerdictBadge verdict={assessment.verdict} />
                        )}
                      </div>
                      {sub && (
                        <div style={{ color: '#667', fontSize: 10, marginTop: 1 }}>{sub}</div>
                      )}
                    </div>
                    <span style={{ color: '#ccc', lineHeight: 1.6 }}>{val}</span>
                  </div>
                  {assessment && assessment.interpretation && (
                    <div style={{
                      marginTop: 6, paddingTop: 6,
                      borderTop: '1px solid rgba(240,223,173,0.06)',
                      fontSize: 11, color: '#889', lineHeight: 1.6,
                      whiteSpace: 'pre-line',
                    }}>
                      {assessment.interpretation}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. 지괘 총론 (동효 있을 때) */}
      {changedGua && changingYao.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{
            fontSize: 12, color: '#f0dfad', letterSpacing: 1, marginBottom: 10,
            borderBottom: '1px solid rgba(240,223,173,0.15)',
            paddingBottom: 6,
          }}>
            흘러가는 괘 &mdash; {changedGua.name}
          </div>
          <div style={{
            fontSize: 13, lineHeight: 1.9, whiteSpace: 'pre-line',
            textAlign: 'left', color: '#bbb',
            padding: '12px',
            background: 'rgba(240,223,173,0.04)',
            borderRadius: 10,
            borderLeft: '2px solid rgba(136, 153, 170, 0.3)',
          }}>
            {changedGua.chongron}
          </div>
        </div>
      )}

      {/* 6. 카드 이미지 + 전체 복사 + 다시 점치기 */}
      {Object.keys(categories).length > 0 && (
        <div
          ref={categoryCardRef}
          style={{
            background: '#f5f0e1',
            borderRadius: 12,
            padding: '20px 18px 16px',
            marginBottom: 12,
            width: '100%',
            boxSizing: 'border-box',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* 워터마크 엠블럼 */}
          <img
            src="/favicon-512.png"
            alt=""
            style={{
              position: 'absolute',
              right: -10,
              bottom: 30,
              width: 120,
              height: 120,
              opacity: 0.15,
              filter: 'saturate(0) brightness(0.7)',
              pointerEvents: 'none',
            }}
          />
          {/* 카드 상단: 괘 이름 + 질문 */}
          <div style={{ textAlign: 'center', marginBottom: 8 }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              marginBottom: 4,
            }}>
              <span style={{ fontSize: 16, fontWeight: 700, color: '#3a2e1e' }}>{bonGua?.name}</span>
              {!isSameGua && (
                <>
                  <span style={{ fontSize: 14, color: '#8a7a60' }}>→</span>
                  <span style={{ fontSize: 16, fontWeight: 700, color: '#3a2e1e' }}>{jiName}</span>
                </>
              )}
            </div>
            {/* 점일 표시 */}
            <div style={{ fontSize: 10, color: '#a89070', marginBottom: 4, lineHeight: 1.5 }}>
              {castDateDisplay.western}
              {castDateDisplay.eastern && (
                <span style={{ marginLeft: 6, color: '#8a7a60' }}>
                  {castDateDisplay.eastern}
                </span>
              )}
            </div>
            {userQuestion && (
              <div style={{ fontSize: 12, color: '#6a5a40', fontStyle: 'italic', marginBottom: 4 }}>
                &ldquo;{userQuestion}&rdquo;
              </div>
            )}
          </div>

          {/* 총론 요약 2~3줄 */}
          {chongronSummary && (
            <div style={{
              fontSize: 11, color: '#5a4e3e', lineHeight: 1.6,
              whiteSpace: 'pre-line',
              padding: '8px 10px',
              marginBottom: 10,
              background: 'rgba(139, 115, 85, 0.06)',
              borderRadius: 8,
              borderLeft: '2px solid rgba(139, 115, 85, 0.2)',
            }}>
              {chongronSummary}
            </div>
          )}

          {/* 카테고리 표 */}
          <table style={{
            width: '100%', borderCollapse: 'collapse',
            fontFamily: '"Pretendard Variable", sans-serif', fontSize: 12,
          }}>
            <tbody>
              {Object.entries(categories).map(([cat, val], i) => {
                const { main, sub } = parseCatKey(cat);
                const cardVerdict = verdictMap.get(cat)?.verdict;
                return (
                  <tr key={cat} style={{
                    borderBottom: i < Object.entries(categories).length - 1 ? '1px solid rgba(139, 115, 85, 0.1)' : 'none',
                  }}>
                    <td style={{
                      padding: '7px 10px', width: 70,
                      color: '#8a6a3e', fontWeight: 600,
                      verticalAlign: 'top',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        {main}
                        {cardVerdict && <CardVerdictBadge verdict={cardVerdict} />}
                      </div>
                      {sub && <div style={{ fontSize: 9, color: '#a89070', fontWeight: 400 }}>{sub}</div>}
                    </td>
                    <td style={{
                      padding: '7px 10px',
                      color: '#3a2e1e',
                      verticalAlign: 'top',
                    }}>
                      {val}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* 하단: 브랜딩 */}
          <div style={{
            marginTop: 16, paddingTop: 12,
            borderTop: '1px solid rgba(139, 115, 85, 0.15)',
            textAlign: 'center',
          }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <img src="/icon/logo.svg" alt="" style={{ height: 16, opacity: 0.5 }} />
              <span style={{ fontSize: 11, color: '#a89070', letterSpacing: 1 }}>제3의시간 · 육효점</span>
            </div>
          </div>
        </div>
      )}

      {/* 버튼 그룹 */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        <button
          onClick={() => handleDownloadCard('dark')}
          style={{
            padding: '8px 18px',
            background: 'rgba(240, 223, 173, 0.1)',
            border: '1px solid rgba(240, 223, 173, 0.2)',
            borderRadius: 16,
            color: '#f0dfad',
            fontSize: 12,
            cursor: 'pointer',
          }}
        >
          카드 저장 (어두운)
        </button>
        <button
          onClick={() => handleDownloadCard('light')}
          style={{
            padding: '8px 18px',
            background: 'rgba(240, 223, 173, 0.1)',
            border: '1px solid rgba(240, 223, 173, 0.2)',
            borderRadius: 16,
            color: '#f0dfad',
            fontSize: 12,
            cursor: 'pointer',
          }}
        >
          카드 저장 (밝은)
        </button>
        {bonGua && (
          <CopyButton
            getText={() => formatGuaText(bonGua, changingYao, changedGua, userQuestion, palaceInfo, yaos)}
            label="전체 복사"
          />
        )}
        <button
          onClick={onReset}
          style={{
            padding: '8px 18px',
            background: 'transparent',
            border: '1px solid rgba(240, 223, 173, 0.15)',
            borderRadius: 16,
            color: '#889',
            fontSize: 12,
            cursor: 'pointer',
          }}
        >
          다시 점치기
        </button>
      </div>

      {/* 7. 괘 구조 상세 — 접힘/아코디언 */}
      {palaceInfo && bonGua && (
        <div style={{ marginBottom: 16 }}>
          <button
            onClick={() => setShowStructure(prev => !prev)}
            style={{
              width: '100%',
              padding: '10px 14px',
              background: 'rgba(240,223,173,0.04)',
              border: '1px solid rgba(240,223,173,0.1)',
              borderRadius: 10,
              color: '#889',
              fontSize: 12,
              cursor: 'pointer',
              textAlign: 'left',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span>
              괘 구조 상세
              <span style={{ color: '#556', marginLeft: 8, fontSize: 11 }}>
                {palaceInfo.palace.name}({palaceInfo.palace.wuxing}) · {getPalaceLabel(palaceInfo.palaceIndex)}
              </span>
            </span>
            <span style={{ color: '#667', fontSize: 11 }}>
              {showStructure ? '▲' : '▼'}
            </span>
          </button>

          {showStructure && (
            <div style={{
              padding: '12px',
              background: 'rgba(240,223,173,0.03)',
              border: '1px solid rgba(240,223,173,0.08)',
              borderTop: 'none',
              borderRadius: '0 0 10px 10px',
            }}>
              {/* 괘 도표: 世應 · 지지 · 육친 */}
              <div style={{
                padding: '10px 12px',
                background: 'rgba(240,223,173,0.04)',
                borderRadius: 10,
                marginBottom: 12,
                fontFamily: 'monospace',
                fontSize: 12,
                lineHeight: 2,
              }}>
                {[5, 4, 3, 2, 1, 0].map(i => {
                  const isYang = castResult.originalGua[i] === 1;
                  const isShi = i + 1 === palaceInfo.shi;
                  const isYing = i + 1 === palaceInfo.ying;
                  const mark = isShi ? '世' : isYing ? '應' : '　';
                  const dotColor = isYang ? '#aab4be' : '#7a8490';
                  const dotCount = 7;
                  const halfDots = 3;
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, height: 18 }}>
                      <span style={{ color: isShi ? '#f0dfad' : isYing ? '#8cb4ff' : '#556', width: 16, textAlign: 'center', fontSize: 11, flexShrink: 0 }}>
                        {mark}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', width: 52, flexShrink: 0 }}>
                        {isYang ? (
                          <div style={{ display: 'flex', gap: 2 }}>
                            {Array.from({ length: dotCount }).map((_, j) => (
                              <div key={j} style={{ width: 4, height: 4, backgroundColor: dotColor }} />
                            ))}
                          </div>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            <div style={{ display: 'flex', gap: 2 }}>
                              {Array.from({ length: halfDots }).map((_, j) => (
                                <div key={`l${j}`} style={{ width: 4, height: 4, backgroundColor: dotColor }} />
                              ))}
                            </div>
                            <div style={{ width: 10 }} />
                            <div style={{ display: 'flex', gap: 2 }}>
                              {Array.from({ length: halfDots }).map((_, j) => (
                                <div key={`r${j}`} style={{ width: 4, height: 4, backgroundColor: dotColor }} />
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      <span style={{ color: '#f0dfad', width: 14, textAlign: 'center', fontSize: 12, flexShrink: 0 }}>{palaceInfo.yaoDizhi[i]}</span>
                      <span style={{ color: '#999', fontSize: 11 }}>{liuqinKorean(palaceInfo.yaoLiuqin[i])}</span>
                    </div>
                  );
                })}
              </div>

              {/* 정통 읽기 */}
              <div style={{
                fontSize: 12, lineHeight: 1.9, whiteSpace: 'pre-line',
                textAlign: 'left', color: '#b8bcc0',
                padding: '12px',
                background: 'rgba(240,223,173,0.04)',
                borderRadius: 10,
                borderLeft: '2px solid rgba(136, 153, 170, 0.3)',
              }}>
                {generateTraditionalReading(palaceInfo, bonGua.name, yaos)}
              </div>
            </div>
          )}
        </div>
      )}

      <div style={{ fontSize: 10, color: '#556', lineHeight: 1.5 }}>
        보관해두게. 오늘의 기억이 사라지거든 누군가에게 다시 물을 수 있도록 말이지.
      </div>
    </>
  );
}

export default function HyoPage() {
  const [stageIndex, setStageIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>('entrance');
  const [blocked, setBlocked] = useState(true);

  useEffect(() => {
    try {
      if (localStorage.getItem('thethirdtime_ch1_clear') === 'true') {
        setBlocked(false);
      }
    } catch {}
  }, []);
  const [entranceStep, setEntranceStep] = useState(0);
  const [yaos, setYaos] = useState<YaoResult[]>([]);
  const [currentByeon, setCurrentByeon] = useState(0); // 0~2 (삼변)
  const [countingText, setCountingText] = useState('');
  const [gameComplete, setGameComplete] = useState(false);
  const [charPos, setCharPos] = useState(START_POS);
  const [isWalking, setIsWalking] = useState(false);
  const [bubbleText, setBubbleText] = useState('');
  const [resultBg, setResultBg] = useState(false);
  const [bgFlash, setBgFlash] = useState(false);
  const [userQuestion, setUserQuestion] = useState('');
  const [castDate, setCastDate] = useState<Date>(new Date());
  const [showQuestionInput, setShowQuestionInput] = useState(false);

  const BUBBLE_MESSAGES = [
    '복잡한 계산은 내게 맡기게',
    '자네의 무의식이\n하늘과 공명하는 과정이야',
    '마음 속 질문에\n계속 집중해야 해',
    '서두르지 말게.\n하늘의 뜻은 천천히 열리는 법이야',
    '시초의 수가\n자네의 답을 품고 있다네',
    '너무 복잡한 질문은\n적중률만 떨어뜨릴 뿐이야',
  ];

  const stage = STAGES[stageIndex];

  // 신령 패스 실행: 나무들 사이를 왔다갔다한 뒤 콜백
  const runSpiritPath = useCallback(async (path: { x: number; y: number; duration: number }[], onDone?: () => void) => {
    setIsWalking(true);
    for (const step of path) {
      setCharPos({ x: step.x, y: step.y });
      await new Promise(r => setTimeout(r, step.duration));
    }
    setIsWalking(false);
    onDone?.();
  }, []);

  // 입장 대화 시퀀스
  const ENTRANCE_LINES = [
    { speaker: '', style: 'thought' as const, text: '어... 신전에서 봤던 차림이네...?' },
    { speaker: '복길', style: 'normal' as const, text: '오, 자네인가.\n여기까지 올 줄은 몰랐는데.' },
    { speaker: '', style: 'thought' as const, text: '복길이...? 분위기가 다르다.' },
    { speaker: '복길', style: 'normal' as const, text: '이 곳은 [운명의 제단]일세.\n[시간의 신전]에서 사주풀이를 통해\n자신의 그릇을 발견했다면,' },
    { speaker: '복길', style: 'normal' as const, text: '이 곳에서는 자네가 가진\n현재의 질문에 대한\n답을 구하는 곳이지.' },
    { speaker: '복길', style: 'normal' as const, text: '3천 년 전 주나라 때부터\n전해 내려온 점술이지.\n역경, 주역이라고도 부른다네.' },
    { speaker: '복길', style: 'normal' as const, text: '운명의 흐름은 시시각각 변화하지.\n그 변화의 흐름을 무작위추출의\n행위로 읽어내는 것이 육효라네.' },
    { speaker: '복길', style: 'normal' as const, text: '자네 마음 속 깊은 곳의 질문을\n하나 구체적으로 떠올려보게.' },
    { speaker: '복길', style: 'normal' as const, text: '마음을 비우고,\n자네가 원하는 질문 하나에\n집중하게.\n단, 너무 먼 미래의 일보다\n지금 눈 앞에 직면한\n궁금증이어야 하네.', action: 'question_input' as const },
    { speaker: '복길', style: 'normal' as const, text: '좋네. 그 질문을 마음에 품고,\n여섯 그루의 나무에서\n가지를 모아오게 될 걸세.' },
  ];

  // 시초 나누기 (탭) — 엔트로피 수집 포함
  const handleSplit = useCallback(async (e?: React.MouseEvent | React.TouchEvent) => {
    if (e) collectEntropy(e.nativeEvent as MouseEvent | TouchEvent);
    if (stageIndex === 0 && yaos.length === 0) trackEvent('hyo_start');
    setPhase('counting');
    setBubbleText(BUBBLE_MESSAGES[Math.floor(Math.random() * BUBBLE_MESSAGES.length)]);

    // 삼변 애니메이션
    const result = performSambyeon();

    for (let i = 0; i < 3; i++) {
      const step = result.steps[i];
      setCurrentByeon(i);
      setCountingText(`${i + 1}변: 좌 ${step.leftCount}개, 우 ${step.rightCount}개`);
      await new Promise(r => setTimeout(r, 800));
      setCountingText(`${i + 1}변: 나머지 좌 ${step.leftRemainder}, 우 ${step.rightRemainder} → ${step.removed}개 제거`);
      await new Promise(r => setTimeout(r, 800));
    }

    setCountingText(`남은 시초: ${result.remaining}개 → ${result.yao.label}(${result.yao.value})`);
    await new Promise(r => setTimeout(r, 1200));

    // 효 추가
    setBubbleText('');
    const newYaos = [...yaos, result.yao];
    setYaos(newYaos);
    setPhase('result');
  }, [yaos]);

  // 다음 스테이지로
  const handleNext = useCallback(() => {
    if (stageIndex < 5) {
      const nextStage = STAGES[stageIndex + 1];
      setCurrentByeon(0);
      setCountingText('');
      runSpiritPath(nextStage.spiritPath, () => {
        setStageIndex(stageIndex + 1);
        setPhase('intro');
      });
    } else {
      // 변효 0개 체크 → 주사위 미니게임
      const hasChanging = yaos.some(y => y.isChanging);
      if (!hasChanging) {
        setPhase('dice_reroll');
        return;
      }
      setCharPos(ALTAR_POS);
      setBgFlash(true);
      setTimeout(() => {
        setResultBg(true);
        setBgFlash(false);
        setCastDate(new Date());
        setPhase('incantation');
      }, 600);
      trackEvent('hyo_complete');
    }
  }, [stageIndex, yaos]);

  // 괘 정보
  const guaInfo = gameComplete ? (() => {
    const originalGua = yaos.map(y => y.isYang ? 1 : 0);
    return getGuaName(originalGua);
  })() : null;

  // 괘 해석
  const castResult = gameComplete ? interpretCast(yaos) : null;

  if (blocked) {
    return (
      <div style={{
        minHeight: '100vh', background: '#1a1e24', color: '#dde1e5',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        fontFamily: '"Pretendard Variable", sans-serif', padding: '40px 20px', textAlign: 'center',
      }}>
        <div style={{ fontSize: 14, color: '#f0dfad', marginBottom: 12 }}>
          이전 챕터를 먼저 완료해야 합니다
        </div>
        <div style={{ fontSize: 12, color: '#889', marginBottom: 24, lineHeight: 1.6 }}>
          사주풀이를 먼저 진행해주세요.
        </div>
        <a href="/" style={{
          padding: '10px 24px',
          background: 'rgba(240,223,173,0.1)',
          border: '1px solid rgba(240,223,173,0.3)',
          borderRadius: 20, color: '#f0dfad', fontSize: 13, textDecoration: 'none',
        }}>
          메인으로 돌아가기
        </a>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#1a1e24',
      color: '#dde1e5',
      fontFamily: '"Pretendard Variable", sans-serif',
      position: 'relative',
      overflow: 'hidden',
      maxWidth: 440,
      margin: '0 auto',
    }}>
      <BgmPlayer show src="/bgm/hyo.mp3" autoPlayFromMenu />

      {/* 배경 맵 + 캐릭터 */}
      <div style={{
        position: 'fixed', inset: 0,
        display: 'flex', justifyContent: 'center',
      }}>
        <div style={{ position: 'relative', height: '100%', maxWidth: 440, width: '100%' }}>
          <img
            src={resultBg ? '/background/hyo_result.jpeg' : '/background/hyo.jpeg'}
            alt=""
            style={{
              height: '100%',
              width: '100%',
              objectFit: 'cover',
              opacity: 0.35,
              transition: 'opacity 0.8s ease',
            }}
          />
          {/* 복길 캐릭터 — 신령 패스 이동 */}
          <div style={{
            position: 'absolute',
            left: `${charPos.x}%`,
            top: `${charPos.y}%`,
            transform: 'translate(-50%, -100%)',
            pointerEvents: 'none',
            transition: 'left 0.8s ease-in-out, top 0.8s ease-in-out',
            opacity: isWalking ? 0.6 : 1,
          }}>
            <img
              src="/character/doin_dot.png"
              alt="복길"
              style={{
                height: '5.1vh',
                width: 'auto',
                imageRendering: 'pixelated',
                filter: `drop-shadow(0 2px 6px rgba(0,0,0,0.6))${isWalking ? ' brightness(1.3)' : ''}`,
                animation: 'bounce-gentle 1.2s ease-in-out infinite',
              }}
            />
          </div>
        </div>
      </div>

      {/* 말풍선 — 대화창 위 독립 레이어 */}
      {bubbleText && (
        <div style={{
          position: 'fixed',
          left: '50%',
          top: '25%',
          transform: 'translateX(-50%)',
          zIndex: 12,
          padding: '10px 16px',
          backgroundColor: 'rgba(20, 25, 35, 0.95)',
          border: '1px solid rgba(240, 223, 173, 0.4)',
          borderRadius: 12,
          color: '#f0dfad',
          fontSize: 13,
          lineHeight: 1.6,
          whiteSpace: 'pre-line',
          textAlign: 'center',
          maxWidth: 220,
          pointerEvents: 'none',
          animation: 'bubble-float 0.5s ease-out',
          boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
        }}>
          {bubbleText}
        </div>
      )}
      <style>{`
        @keyframes bubble-float {
          from { opacity: 0; transform: translateX(-50%) translateY(10px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>

      {/* 화면전환 플래시 */}
      {bgFlash && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 50,
          background: 'rgba(240, 223, 173, 0.6)',
          animation: 'bg-flash 0.6s ease-out forwards',
          pointerEvents: 'none',
        }} />
      )}
      <style>{`
        @keyframes bg-flash {
          0% { opacity: 0; }
          30% { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>

      {/* 상단: 로고 + 진행 표시 */}
      <div style={{
        position: 'relative', zIndex: 10,
        padding: '16px 20px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <img src="/icon/logo.svg" alt="제3의시간" style={{ height: 20, opacity: 0.6 }} />
          <span style={{ fontSize: 12, color: '#889', letterSpacing: 1 }}>육효점</span>
        </div>
        <div style={{ fontSize: 11, color: '#889' }}>
          {gameComplete ? '완성' : `${stageIndex + 1} / 6효`}
        </div>
      </div>

      {/* ═══ 다이얼로그 섹션 (entrance) — alt2 스타일 하단 고정 ═══ */}
      {phase === 'entrance' && (
        <div
          className="fixed inset-0 flex flex-col justify-end"
          style={{ zIndex: 10 }}
        >
          {/* 탭 영역 (상단 빈 공간) — 질문 입력 중엔 비활성 */}
          <div className="flex-1" onClick={() => {
            if (showQuestionInput) return;
            const line = ENTRANCE_LINES[entranceStep] as any;
            if (line?.action === 'question_input') {
              setShowQuestionInput(true);
              return;
            }
            if (entranceStep < ENTRANCE_LINES.length - 1) setEntranceStep(s => s + 1);
            else runSpiritPath(STAGES[0].spiritPath, () => setPhase('intro'));
          }} />

          <div style={{
            width: '100%',
            maxWidth: 440,
            margin: '0 auto',
            paddingLeft: 38,
            paddingRight: 38,
            paddingBottom: 'max(16px, env(safe-area-inset-bottom))',
          }}>
            {(() => {
              const line = ENTRANCE_LINES[entranceStep] as any;
              const isThought = line.style === 'thought';
              const isLast = entranceStep === ENTRANCE_LINES.length - 1;
              const hasQuestionAction = line.action === 'question_input';
              const advance = () => {
                if (hasQuestionAction && !showQuestionInput) {
                  setShowQuestionInput(true);
                  return;
                }
                if (hasQuestionAction && showQuestionInput) {
                  setShowQuestionInput(false);
                  setEntranceStep(s => s + 1);
                  return;
                }
                if (isLast) runSpiritPath(STAGES[0].spiritPath, () => setPhase('intro'));
                else setEntranceStep(s => s + 1);
              };
              return (
                <div
                  onClick={showQuestionInput ? undefined : advance}
                  style={{
                    background: 'rgba(20, 25, 35, 0.92)',
                    border: '2px solid #556677',
                    padding: '14px 16px',
                    cursor: showQuestionInput ? 'default' : 'pointer',
                    position: 'relative',
                  }}
                >
                  <div style={{ display: 'flex', gap: 12 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {!isThought && (
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#f0dfad', marginBottom: 6 }}>
                          {line.speaker}
                        </div>
                      )}
                      <div style={{
                        fontSize: isThought ? 15 : 18,
                        lineHeight: 1.6,
                        whiteSpace: 'pre-wrap',
                        color: isThought ? '#a1c5ac' : '#dde1e5',
                        fontStyle: isThought ? 'italic' : undefined,
                        textAlign: isThought ? 'right' : undefined,
                        fontFamily: isThought
                          ? '"Pretendard Variable", sans-serif'
                          : 'var(--font-gaegu), "Gaegu", cursive',
                      }}>
                        {line.text}
                      </div>
                      {/* 질문 입력 필드 */}
                      {showQuestionInput && (
                        <div style={{ marginTop: 12 }} onClick={e => e.stopPropagation()}>
                          <input
                            type="text"
                            value={userQuestion}
                            onChange={e => setUserQuestion(e.target.value)}
                            placeholder="예) 이직해도 될까?"
                            maxLength={50}
                            autoFocus
                            style={{
                              width: '100%',
                              padding: '10px 12px',
                              fontSize: 16,
                              color: '#f0dfad',
                              backgroundColor: 'rgba(240, 223, 173, 0.08)',
                              border: '1px solid rgba(240, 223, 173, 0.3)',
                              borderRadius: 8,
                              outline: 'none',
                              fontFamily: '"Pretendard Variable", sans-serif',
                              boxSizing: 'border-box',
                            }}
                            onKeyDown={e => {
                              if (e.key === 'Enter' && userQuestion.trim()) advance();
                            }}
                          />
                          <button
                            onClick={() => { if (userQuestion.trim()) advance(); }}
                            style={{
                              marginTop: 8,
                              width: '100%',
                              padding: '10px 0',
                              fontSize: 14,
                              color: userQuestion.trim() ? '#f0dfad' : '#556',
                              backgroundColor: userQuestion.trim() ? 'rgba(240, 223, 173, 0.12)' : 'transparent',
                              border: '1px solid rgba(240, 223, 173, 0.2)',
                              borderRadius: 8,
                              cursor: userQuestion.trim() ? 'pointer' : 'default',
                              fontFamily: '"Pretendard Variable", sans-serif',
                            }}
                          >
                            이 질문으로 점치기
                          </button>
                        </div>
                      )}
                    </div>
                    {!isThought && !showQuestionInput && (
                      <div style={{ flexShrink: 0, width: 72, height: 72, overflow: 'hidden' }}>
                        <img src="/character/hyo.png" alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                      </div>
                    )}
                  </div>
                  <div style={{
                    position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)',
                    color: '#f0dfad', fontSize: 12,
                    animation: 'indicator-bounce 1s ease-in-out infinite',
                  }}>
                    ▼
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* ═══ 미니게임 섹션 (intro~result) — 기존 중앙 카드 ═══ */}
      {phase !== 'entrance' && phase !== 'dice_reroll' && !gameComplete && (
        <div style={{
          position: 'relative', zIndex: 10,
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center',
          minHeight: 'calc(100vh - 160px)',
          padding: '0 24px',
        }}>
          {/* 나무 이름 */}
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>{stage.treeEmoji}</div>
            <div style={{ fontSize: 14, color: '#f0dfad', letterSpacing: 1 }}>{stage.treeName}</div>
          </div>

          {/* 미니게임 카드 */}
          <div style={{
            background: phase === 'counting' ? 'rgba(26, 30, 36, 0.55)' : 'rgba(26, 30, 36, 0.9)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(240, 223, 173, 0.2)',
            borderRadius: 16,
            padding: '20px 24px',
            maxWidth: 340,
            width: '100%',
            textAlign: 'center',
            transition: 'background 0.5s ease',
          }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#f0dfad', marginBottom: 8 }}>
              복길
            </div>

          {phase === 'intro' && (
            <>
              <div style={{ fontSize: 15, lineHeight: 1.8, whiteSpace: 'pre-line', marginBottom: 16 }}>
                {stage.intro}
              </div>
              <button
                onClick={() => setPhase('split')}
                style={{
                  padding: '10px 24px',
                  background: 'rgba(240, 223, 173, 0.15)',
                  border: '1px solid rgba(240, 223, 173, 0.3)',
                  borderRadius: 20,
                  color: '#f0dfad',
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                준비됐네
              </button>
            </>
          )}

          {phase === 'split' && (
            <>
              <div style={{ fontSize: 15, lineHeight: 1.8, whiteSpace: 'pre-line', marginBottom: 16 }}>
                {stage.splitPrompt}
              </div>
              {/* 시초 묶음 — 탭 영역 */}
              <SichoSplitVisual onClick={handleSplit} />
            </>
          )}

          {phase === 'counting' && (
            <>
              <div style={{ fontSize: 14, lineHeight: 1.8, marginBottom: 12 }}>
                복길이 세고 있습니다...
              </div>
              <div style={{
                fontSize: 12, color: '#f0dfad', lineHeight: 1.8,
                padding: '8px 12px',
                background: 'rgba(240, 223, 173, 0.08)',
                borderRadius: 8,
              }}>
                {countingText}
              </div>
              {/* 점 로딩 */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 12 }}>
                {[0, 1, 2].map(i => (
                  <div
                    key={i}
                    style={{
                      width: 6, height: 6, borderRadius: '50%',
                      backgroundColor: i <= currentByeon ? '#f0dfad' : '#444',
                      transition: 'all 0.3s',
                    }}
                  />
                ))}
              </div>
            </>
          )}

          {phase === 'result' && (
            <>
              <div style={{ fontSize: 15, lineHeight: 1.8, whiteSpace: 'pre-line', marginBottom: 16 }}>
                {stage.complete}
              </div>
              {/* 현재 효 크게 표시 */}
              <div style={{ margin: '12px 0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <YaoSymbol yao={yaos[yaos.length - 1]} size={80} />
                <div style={{ fontSize: 11, color: '#889', marginTop: 6, textAlign: 'center' }}>
                  {yaos[yaos.length - 1].label} ({yaos[yaos.length - 1].value})
                </div>
              </div>
              <button
                onClick={handleNext}
                style={{
                  padding: '10px 24px',
                  background: 'rgba(240, 223, 173, 0.15)',
                  border: '1px solid rgba(240, 223, 173, 0.3)',
                  borderRadius: 20,
                  color: '#f0dfad',
                  fontSize: 13,
                  cursor: 'pointer',
                  marginTop: 8,
                }}
              >
                {stageIndex < 5 ? '다음 나무로' : '괘를 완성하다'}
              </button>
            </>
          )}

        </div>
        </div>
      )}

      {/* ═══ 주사위 미니게임 (변효 0개 시) ═══ */}
      {phase === 'dice_reroll' && (
        <div style={{
          position: 'relative', zIndex: 5,
          padding: '60px 24px',
          maxWidth: 440, margin: '0 auto',
        }}>
          <DiceRerollGame onComplete={(newYaos) => {
            setYaos(newYaos);
            setCastDate(new Date());
            setCharPos(ALTAR_POS);
            setBgFlash(true);
            setTimeout(() => {
              setResultBg(true);
              setBgFlash(false);
              setPhase('incantation');
            }, 600);
            trackEvent('hyo_complete');
          }} />
        </div>
      )}

      {/* ═══ 주문 섹션 (incantation) — 나레이션 방식 ═══ */}
      {phase === 'incantation' && (() => {
        const now = castDate;
        const dateTimeStr = `${now.getFullYear()}년 ${now.getMonth() + 1}월 ${now.getDate()}일 ${now.getHours()}시 ${String(now.getMinutes()).padStart(2, '0')}분`;

        const lines = [
          '천지신명의 크고 밝은 뜻이여',
          dateTimeStr,
          '내 앞에 나타난 여행자의 앞길을',
          '밝히는 등불이 되소서',
        ];

        return (
          <IncantationNarration
            lines={lines}
            onComplete={() => {
              setGameComplete(true);
              setPhase('preview');
            }}
          />
        );
      })()}

      {/* ═══ 프리뷰 섹션 (preview) — 읽는 법 안내 ═══ */}
      {phase === 'preview' && guaInfo && castResult && (() => {
        const changingCount = yaos.filter(y => y.isChanging).length;
        const bonName = castResult.bonGua?.name || '?';
        const jiName = castResult.changedGua?.name || bonName;
        const isSame = bonName === jiName;

        const readingGuide = changingCount === 0
          ? '움직이는 효가 없으니, 본괘의 총론이 곧 자네의 답이야.\n지금은 변화를 꾀할 때가 아니라,\n있는 그대로를 받아들일 때라는 뜻이지.'
          : changingCount === 1
          ? '움직이는 기운이 하나 있네.\n그 효의 효사가 핵심 답이야.\n지괘는 상황이 흘러갈 방향을 보여주네.'
          : changingCount === 2
          ? '두 개의 기운이 움직이고 있어.\n둘 다 읽되, 위쪽 효사를 중심으로 보게.\n지괘는 두 기운이 모두 변한 뒤의 최종 모습이야.'
          : changingCount === 3
          ? '세 개의 기운이 움직이고 있군.\n본괘 총론과 지괘 총론을 함께 읽게.\n효사는 세부 참고로 보면 되네.'
          : changingCount <= 5
          ? `${changingCount}개나 움직이고 있어.\n지괘 총론을 중심으로 읽고,\n움직이지 않은 효의 효사를 참고하게.`
          : '모든 효가 움직이고 있군.\n지괘의 총론이 자네의 답이야.\n본괘는 지나온 상황이라 보면 되네.';

        return (
          <div style={{
            position: 'relative', zIndex: 10,
            padding: '40px 24px 120px',
            maxWidth: 440,
            margin: '0 auto',
            textAlign: 'center',
          }}>
            {/* 괘 흐름: 본괘 → 지괘 */}
            <div style={{
              fontSize: 11, color: '#889', letterSpacing: 3, marginBottom: 24,
            }}>
              괘의 흐름
            </div>

            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16,
              marginBottom: 32,
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: '#889', marginBottom: 6 }}>본괘</div>
                <div style={{ fontSize: 20, color: '#f0dfad', fontWeight: 700 }}>{bonName}</div>
              </div>
              <div style={{ fontSize: 20, color: '#889' }}>→</div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: '#889', marginBottom: 6 }}>{isSame ? '(변화 없음)' : '지괘'}</div>
                <div style={{ fontSize: 20, color: isSame ? '#889' : '#f0dfad', fontWeight: 700 }}>{jiName}</div>
              </div>
            </div>

            {/* 동효 요약 */}
            {changingCount > 0 && (
              <div style={{
                fontSize: 12, color: '#ccc', marginBottom: 16,
              }}>
                동효 {changingCount}개
              </div>
            )}

            {/* 읽는 법 */}
            <div style={{
              padding: '16px 20px',
              background: 'rgba(240,223,173,0.06)',
              border: '1px solid rgba(240,223,173,0.15)',
              borderRadius: 12,
              fontSize: 13, color: '#ccc', lineHeight: 1.8,
              whiteSpace: 'pre-line',
              textAlign: 'left',
              marginBottom: 32,
            }}>
              <div style={{ fontSize: 11, color: '#f0dfad', marginBottom: 8, letterSpacing: 1 }}>읽는 법</div>
              {readingGuide}
            </div>

            <button
              onClick={() => setPhase('complete')}
              style={{
                padding: '12px 32px',
                background: 'rgba(240,223,173,0.12)',
                border: '1px solid rgba(240,223,173,0.3)',
                borderRadius: 20,
                color: '#f0dfad',
                fontSize: 14,
                cursor: 'pointer',
              }}
            >
              결과 확인
            </button>
          </div>
        );
      })()}

      {/* ═══ 결과 섹션 (complete) ═══ */}
      {phase === 'complete' && guaInfo && castResult && (
        <div style={{
          position: 'relative', zIndex: 10,
          padding: '0 24px 120px',
          maxWidth: 440,
          margin: '0 auto',
        }}>
          <CompleteView
            guaInfo={guaInfo}
            castResult={castResult}
            yaos={yaos}
            userQuestion={userQuestion}
            castDate={castDate}
            onReset={() => {
              setStageIndex(0);
              setPhase('intro');
              setYaos([]);
              setGameComplete(false);
              setCurrentByeon(0);
              setCountingText('');
              setCharPos(START_POS);
              setResultBg(false);
              setUserQuestion('');
            }}
          />
        </div>
      )}

      {/* 하단: 쌓이는 효 (효가 있을 때만 표시) */}
      {yaos.length > 0 && !gameComplete && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          zIndex: 20,
          display: 'flex', justifyContent: 'center',
          padding: '12px 0 24px',
          background: 'linear-gradient(transparent, rgba(26,30,36,0.95))',
        }}>
          <div style={{
            display: 'flex', flexDirection: 'column-reverse', alignItems: 'center', gap: 4,
          }}>
            {yaos.map((yao, i) => (
              <div key={i} style={{ opacity: 1, animation: 'fadeSlideUp 0.4s ease' }}>
                <YaoSymbol yao={yao} size={48} />
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`
        @keyframes pixel-pulse {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.4); }
        }
        @keyframes bounce-gentle {
          0%, 100% { transform: translateX(-50%) translateY(0); }
          50% { transform: translateX(-50%) translateY(-4px); }
        }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes indicator-bounce {
          0%, 100% { transform: translateY(0); opacity: 0.5; }
          50% { transform: translateY(4px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
