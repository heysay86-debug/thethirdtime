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

  const [sharing, setSharing] = useState(false);

  const handleShare = useCallback(async () => {
    if (!fortune || sharing) return;
    setSharing(true);
    try {
      const res = await fetch('/api/hyo/daily-card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: fortune.date,
          dateGanji: fortune.dateGanji,
          guaName: fortune.guaName,
          jiGuaName: fortune.jiGuaName,
          guaBits: fortune.guaBits,
          changingYaoPos: fortune.changingYaoPos,
          scores: fortune.scores.map(s => ({ label: s.label, score: s.score, verdict: s.verdict })),
          totalScore: fortune.totalScore,
          totalVerdict: fortune.totalVerdict,
          jiGuaSummary: fortune.jiGuaSummary,
        }),
      });
      if (!res.ok) throw new Error('이미지 생성 실패');
      const blob = await res.blob();

      // 모바일 Web Share API로 이미지 공유 시도
      if (navigator.share && navigator.canShare) {
        const file = new File([blob], `오늘의운세-${fortune.date}.png`, { type: 'image/png' });
        const shareData = { files: [file], title: '오늘의 운세 - 제3의시간' };
        if (navigator.canShare(shareData)) {
          await navigator.share(shareData);
          setSharing(false);
          return;
        }
      }

      // Fallback: 다운로드
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `오늘의운세-${fortune.date}.png`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('이미지 생성에 실패했습니다.');
    }
    setSharing(false);
  }, [fortune, sharing]);

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
            {/* 헤더: 타이틀 + 날짜 한줄 우측 정렬 */}
            <div style={{
              display: 'flex', justifyContent: 'flex-end', alignItems: 'center',
              gap: 8, marginBottom: 12,
            }}>
              <span style={{
                fontSize: 16, fontWeight: 700, color: '#f0dfad',
                fontFamily: '"Gaegu", cursive',
              }}>
                오늘의 운세
              </span>
              <span style={{ fontSize: 11, color: '#889' }}>
                {fortune.date} {fortune.dateGanji}
              </span>
            </div>

            {/* 괘명 (2배 크기) */}
            <div style={{ textAlign: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 28, fontWeight: 700, color: '#f0dfad' }}>
                {fortune.guaName}
              </span>
              <span style={{ fontSize: 22, color: '#667', margin: '0 10px' }}>→</span>
              <span style={{ fontSize: 28, fontWeight: 700, color: '#f0dfad' }}>
                {fortune.jiGuaName}
              </span>
            </div>

            {/* 괘상 (CSS 효 표현) */}
            <div style={{
              display: 'flex', flexDirection: 'column-reverse',
              alignItems: 'center', gap: 6,
              padding: '12px 0', marginBottom: 16,
            }}>
              {fortune.guaBits.map((bit, i) => {
                const isChanging = i === fortune.changingYaoPos - 1;
                const barColor = isChanging ? '#f0dfad' : '#aab4be';
                return (
                  <div key={i} style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {bit === 1 ? (
                      <div style={{ width: 120, height: 8, backgroundColor: barColor, borderRadius: 2 }} />
                    ) : (
                      <div style={{ display: 'flex', gap: 12 }}>
                        <div style={{ width: 54, height: 8, backgroundColor: barColor, borderRadius: 2 }} />
                        <div style={{ width: 54, height: 8, backgroundColor: barColor, borderRadius: 2 }} />
                      </div>
                    )}
                    {isChanging && (
                      <div style={{
                        position: 'absolute', top: '50%', left: '50%',
                        transform: 'translate(-50%, -50%) rotate(-45deg)',
                        width: 2, height: 20,
                        backgroundColor: '#f0dfad',
                        borderRadius: 1,
                      }} />
                    )}
                  </div>
                );
              })}
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
              {sharing ? '이미지 생성 중...' : '이미지로 공유하기'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
