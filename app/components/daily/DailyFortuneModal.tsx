'use client';

import { useState, useCallback, useRef } from 'react';
import BaguaWheel from '@/app/components/hyo/BaguaWheel';
import FlippingDice from '@/app/components/hyo/FlippingDice';
import { getDailyFortune, type DailyFortune, type DailyScore } from '@/src/hyo/daily';

// ─── 점수 색상 ──────────────────────────────────────────────

function getScoreColor(score: number): string {
  if (score >= 80) return '#f0dfad';
  if (score >= 60) return '#97c6aa';
  if (score >= 40) return '#889';
  if (score >= 20) return '#c9956a';
  return '#c96a6a';
}

function getVerdictColor(verdict: string): string {
  const map: Record<string, string> = {
    '대길': '#f0dfad', '길': '#97c6aa', '평': '#889', '흉': '#c9956a', '대흉': '#c96a6a',
  };
  return map[verdict] || '#889';
}

// ─── 점수 바 ────────────────────────────────────────────────

function ScoreBar({ item }: { item: DailyScore }) {
  const color = getScoreColor(item.score);
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: '#f0dfad' }}>{item.label}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 18, fontWeight: 700, color }}>{item.score}</span>
          <span style={{
            fontSize: 10, fontWeight: 700, color: getVerdictColor(item.verdict),
            padding: '1px 6px', borderRadius: 4,
            border: `1px solid ${getVerdictColor(item.verdict)}44`,
          }}>
            {item.verdict}
          </span>
        </div>
      </div>
      <div style={{
        height: 6, borderRadius: 3,
        background: 'rgba(240,223,173,0.1)',
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%', width: `${item.score}%`,
          background: color, borderRadius: 3,
          transition: 'width 0.8s ease',
        }} />
      </div>
      <div style={{ fontSize: 11, color: '#889', marginTop: 4 }}>{item.detail}</div>
    </div>
  );
}

// ─── 메인 모달 ──────────────────────────────────────────────

export default function DailyFortuneModal({ onClose }: { onClose: () => void }) {
  const [phase, setPhase] = useState<'roulette' | 'result'>('roulette');
  const [spinning, setSpinning] = useState(false);
  const [resultA, setResultA] = useState(0);
  const [resultB, setResultB] = useState(0);
  const [resultD6, setResultD6] = useState(1);
  const [fortune, setFortune] = useState<DailyFortune | null>(null);
  const stoppedCount = useRef(0);

  const handleSpin = useCallback(() => {
    if (spinning) return;
    const arr = new Uint8Array(3);
    crypto.getRandomValues(arr);
    setResultA(arr[0] % 8);
    setResultB(arr[1] % 8);
    setResultD6((arr[2] % 6) + 1);
    stoppedCount.current = 0;
    setSpinning(true);
  }, [spinning]);

  const handleOneStop = useCallback(() => {
    stoppedCount.current++;
    if (stoppedCount.current >= 3) {
      setTimeout(() => {
        const result = getDailyFortune(resultA, resultB, resultD6, new Date());
        setFortune(result);
        setPhase('result');
      }, 600);
    }
  }, [resultA, resultB, resultD6]);

  const handleShare = useCallback(async () => {
    if (!fortune) return;
    const text = `오늘의 운세 (${fortune.date})\n${fortune.guaName} → ${fortune.jiGuaName}\n\n문서운 ${fortune.scores[0]?.score}점 | 재물운 ${fortune.scores[1]?.score}점\n연애운 ${fortune.scores[2]?.score}점 | 건강운 ${fortune.scores[3]?.score}점\n\n총운: ${fortune.totalScore}점 (${fortune.totalVerdict})\n\n제3의시간에서 확인하기\nhttps://www.betterdan.net`;

    if (navigator.share) {
      try {
        await navigator.share({ title: '오늘의 운세 - 제3의시간', text });
      } catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(text);
      alert('클립보드에 복사되었습니다!');
    }
  }, [fortune]);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.7)',
    }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        width: '90%', maxWidth: 400, maxHeight: '85vh',
        background: '#1a1e24',
        border: '1px solid rgba(240,223,173,0.15)',
        borderRadius: 16,
        padding: '24px 20px',
        overflowY: 'auto',
        position: 'relative',
      }}>
        {/* 닫기 */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: 12, right: 12,
            background: 'none', border: 'none', color: '#667',
            fontSize: 20, cursor: 'pointer',
          }}
        >
          ✕
        </button>

        {/* ── 룰렛 단계 ── */}
        {phase === 'roulette' && (
          <div style={{ textAlign: 'center' }} onClick={!spinning ? handleSpin : undefined}>
            <div style={{
              fontFamily: '"Gaegu", cursive', fontSize: 18,
              color: '#f0dfad', marginBottom: 8,
            }}>
              오늘의 운세
            </div>
            <div style={{ fontSize: 12, color: '#889', marginBottom: 20 }}>
              탭하여 팔괘를 돌리세요
            </div>

            <div style={{
              display: 'flex', justifyContent: 'center', alignItems: 'flex-start',
              gap: 12, cursor: spinning ? 'default' : 'pointer',
            }}>
              <BaguaWheel label="상괘" spinning={spinning} resultIdx={resultA} onStop={handleOneStop} size={100} />
              <BaguaWheel label="하괘" spinning={spinning} resultIdx={resultB} onStop={handleOneStop} size={100} />
              <FlippingDice spinning={spinning} resultVal={resultD6} onStop={handleOneStop} size={50} />
            </div>
          </div>
        )}

        {/* ── 결과 단계 ── */}
        {phase === 'result' && fortune && (
          <div>
            {/* 헤더 */}
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: '#889' }}>{fortune.date} {fortune.dateGanji}</div>
              <div style={{
                fontSize: 22, fontWeight: 700, color: '#f0dfad',
                fontFamily: '"Gaegu", cursive', marginTop: 4,
              }}>
                오늘의 운세
              </div>
              <div style={{ fontSize: 14, color: '#c8cdd3', marginTop: 4 }}>
                {fortune.guaName} → {fortune.jiGuaName}
              </div>
            </div>

            {/* 총운 */}
            <div style={{
              textAlign: 'center', padding: '16px 0', marginBottom: 16,
              borderTop: '1px solid rgba(240,223,173,0.1)',
              borderBottom: '1px solid rgba(240,223,173,0.1)',
            }}>
              <div style={{ fontSize: 11, color: '#889', marginBottom: 4 }}>총운</div>
              <div style={{
                fontSize: 42, fontWeight: 700,
                color: getScoreColor(fortune.totalScore),
                lineHeight: 1,
              }}>
                {fortune.totalScore}
              </div>
              <div style={{
                fontSize: 14, fontWeight: 700, marginTop: 4,
                color: getVerdictColor(fortune.totalVerdict),
              }}>
                {fortune.totalVerdict}
              </div>
            </div>

            {/* 4대 운세 */}
            <div style={{ marginBottom: 16 }}>
              {fortune.scores.map((s, i) => (
                <ScoreBar key={i} item={s} />
              ))}
            </div>

            {/* 지괘 해석 */}
            {fortune.jiGuaSummary && (
              <div style={{
                padding: '12px 14px', marginBottom: 16,
                background: 'rgba(240,223,173,0.05)',
                borderRadius: 10,
                borderLeft: '3px solid rgba(240,223,173,0.2)',
              }}>
                <div style={{ fontSize: 11, color: '#f0dfad', fontWeight: 600, marginBottom: 4 }}>
                  {fortune.jiGuaName} — 흘러가는 방향
                </div>
                <div style={{ fontSize: 13, color: '#a0a8b0', lineHeight: 1.7, whiteSpace: 'pre-line' }}>
                  {fortune.jiGuaSummary}
                </div>
              </div>
            )}

            {/* CTA: 2장 유도 */}
            <button
              onClick={() => { window.location.href = '/hyo'; }}
              style={{
                width: '100%', padding: '12px 16px', borderRadius: 12,
                fontSize: 13, fontWeight: 600,
                backgroundColor: '#f0dfad', color: '#2a1f14',
                border: 'none', cursor: 'pointer',
                marginBottom: 8,
              }}
            >
              2장에서 더 자세한 점괘 보기
            </button>

            {/* SNS 공유 */}
            <button
              onClick={handleShare}
              style={{
                width: '100%', padding: '10px 16px', borderRadius: 12,
                fontSize: 13, fontWeight: 600,
                backgroundColor: 'rgba(104, 128, 151, 0.25)', color: '#dde1e5',
                border: 'none', cursor: 'pointer',
              }}
            >
              공유하기
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
