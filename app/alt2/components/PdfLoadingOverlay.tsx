'use client';

import { useState, useEffect } from 'react';

const TIPS = [
  '사주는 운명이 아니라 경향성입니다.\n같은 사주도 환경과 선택에 따라 달라집니다.',
  '용신은 부족한 기운을 채우는 열쇠입니다.\n용신의 색상이나 방위를 생활에 활용해보세요.',
  '대운은 10년 주기로 바뀝니다.\n지금의 어려움도, 지금의 행운도 영원하지 않습니다.',
  '신강한 사주는 주관이 뚜렷하고,\n신약한 사주는 유연함이 장점입니다.',
  '격국은 삶의 큰 방향을 보여줍니다.\n직업 선택이나 대인관계의 단서가 됩니다.',
  '명리학은 수천 년간 축적된 동양 철학입니다.\n점술이 아닌, 자기 이해의 도구로 활용하세요.',
];

interface Props {
  visible: boolean;
  progress: 'generating' | 'done' | 'error';
}

export default function PdfLoadingOverlay({ visible, progress }: Props) {
  const [tipIndex, setTipIndex] = useState(0);
  const [dots, setDots] = useState('');

  // 팁 로테이션 (5초마다)
  useEffect(() => {
    if (!visible) return;
    setTipIndex(Math.floor(Math.random() * TIPS.length));
    const id = setInterval(() => {
      setTipIndex(prev => (prev + 1) % TIPS.length);
    }, 5000);
    return () => clearInterval(id);
  }, [visible]);

  // 로딩 점 애니메이션
  useEffect(() => {
    if (!visible || progress !== 'generating') return;
    const id = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);
    return () => clearInterval(id);
  }, [visible, progress]);

  if (!visible) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'linear-gradient(180deg, #1a1e24 0%, #252a31 50%, #1a1e24 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      fontFamily: '"Pretendard Variable", sans-serif',
      animation: 'fadeIn 0.3s ease',
    }}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes pulse { 0%,100% { opacity: 0.4; } 50% { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes progressBar { from { width: 0%; } to { width: 100%; } }
      `}</style>

      {/* 로고 영역 */}
      <div style={{ marginBottom: 48, textAlign: 'center' }}>
        <div style={{
          fontSize: 13, color: 'rgba(240,223,173,0.6)', letterSpacing: 3, marginBottom: 8,
        }}>
          제3의시간
        </div>
        <div style={{
          fontSize: 20, color: '#dde1e5', fontWeight: 600, letterSpacing: 1,
        }}>
          리포트를 준비하고 있습니다
        </div>
      </div>

      {/* 광고/프로모션 영역 (750x200 배너 자리) */}
      <div style={{
        width: '90%', maxWidth: 400, minHeight: 180,
        background: 'rgba(240,223,173,0.04)',
        border: '1px solid rgba(240,223,173,0.12)',
        borderRadius: 12,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '28px 24px',
        marginBottom: 48,
      }}>
        {/* 지금은 팁을 보여주고, 나중에 광고 네트워크로 교체 */}
        <div style={{
          fontSize: 11, color: 'rgba(240,223,173,0.5)', letterSpacing: 2, marginBottom: 16,
        }}>
          알고 계셨나요?
        </div>
        <div key={tipIndex} style={{
          fontSize: 14, color: '#dde1e5', lineHeight: 1.8, textAlign: 'center',
          whiteSpace: 'pre-line',
          animation: 'slideUp 0.4s ease',
        }}>
          {TIPS[tipIndex]}
        </div>
      </div>

      {/* 로딩 바 */}
      <div style={{ width: '80%', maxWidth: 300 }}>
        <div style={{
          fontSize: 12, color: progress === 'done' ? '#4ecdc4' : progress === 'error' ? '#e74c3c' : 'rgba(221,225,229,0.5)',
          textAlign: 'center', marginBottom: 8,
        }}>
          {progress === 'generating' && `리포트 생성 중${dots}`}
          {progress === 'done' && '리포트가 준비되었습니다!'}
          {progress === 'error' && '생성 중 오류가 발생했습니다'}
        </div>
        <div style={{
          height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.08)', overflow: 'hidden',
        }}>
          {progress === 'generating' && (
            <div style={{
              height: '100%', borderRadius: 2,
              background: 'linear-gradient(90deg, rgba(240,223,173,0.3), rgba(240,223,173,0.7))',
              animation: 'progressBar 12s ease-out forwards',
            }} />
          )}
          {progress === 'done' && (
            <div style={{ height: '100%', width: '100%', borderRadius: 2, background: '#4ecdc4' }} />
          )}
        </div>
      </div>
    </div>
  );
}
