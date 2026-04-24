'use client';

import { useState, useCallback } from 'react';
import { performSambyeon, getGuaName, type YaoResult } from '@/src/hyo/sicho';
import { trackEvent } from '@/src/analytics';
import { STAGES, START_POS, ALTAR_POS } from '@/src/hyo/stages';
import BgmPlayer from '@/app/alt2/components/base/BgmPlayer';
import { interpretCast, type GuaInterpretation, type YaoInterpretation } from '@/src/hyo/gua-lookup';
import { getGuaPalace, getPalaceLabel, liuqinKorean, type GuaPalaceInfo } from '@/src/hyo/gua-palace';
import { generateTraditionalReading } from '@/src/hyo/gua-reading';

type Phase = 'entrance' | 'intro' | 'split' | 'counting' | 'result' | 'complete';

// 효 심볼 렌더링
function YaoSymbol({ yao, size = 32 }: { yao: YaoResult; size?: number }) {
  const w = size;
  const h = size * 0.3;
  const gap = size * 0.15;
  const color = yao.isChanging ? '#f0dfad' : '#dde1e5';

  if (yao.isYang) {
    // 양효: 한 줄 (━━━)
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: h, gap: 0 }}>
        <div style={{ width: w, height: h * 0.4, backgroundColor: color, borderRadius: 2 }} />
        {yao.isChanging && (
          <div style={{
            position: 'absolute',
            width: h * 0.6, height: h * 0.12,
            backgroundColor: '#f0dfad',
            transform: 'rotate(-45deg)',
            borderRadius: 1,
          }} />
        )}
      </div>
    );
  }
  // 음효: 두 줄 (━ ━)
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: h, gap }}>
      <div style={{ width: w * 0.4, height: h * 0.4, backgroundColor: color, borderRadius: 2 }} />
      <div style={{ width: w * 0.4, height: h * 0.4, backgroundColor: color, borderRadius: 2 }} />
      {yao.isChanging && (
        <div style={{
          position: 'absolute',
          width: h * 0.6, height: h * 0.12,
          backgroundColor: '#f0dfad',
          transform: 'rotate(-45deg)',
          borderRadius: 1,
        }} />
      )}
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

// 괘 해석 텍스트 포맷
function formatGuaText(
  bonGua: GuaInterpretation,
  changingYao: YaoInterpretation[],
  changedGua: GuaInterpretation | null,
): string {
  let text = `[육효점 결과]\n\n`;
  text += `괘: ${bonGua.name}\n\n`;
  text += `${bonGua.chongron}\n`;

  if (changingYao.length > 0) {
    text += `\n---\n`;
    for (const yao of changingYao) {
      const label = ['첫', '둘', '셋', '넷', '다섯', '여섯'][yao.yao - 1];
      text += `\n[${label}째 기운 → ${yao.byeonGuaName}]\n`;
      text += `${yao.general}\n\n`;
      for (const [cat, val] of Object.entries(yao.categories)) {
        text += `${cat}: ${val}\n`;
      }
    }
    if (changedGua) {
      text += `\n---\n흘러가는 괘: ${changedGua.name}\n${changedGua.chongron}\n`;
    }
  }

  text += `\n— 제3의시간 · 육효점 (ttt.betterdan.net/hyo)`;
  return text;
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

// 카테고리 아이콘 (제거됨)

function CompleteView({ guaInfo, castResult, yaos, onReset }: {
  guaInfo: { name: string; korean: string };
  castResult: ReturnType<typeof interpretCast>;
  yaos: YaoResult[];
  onReset: () => void;
}) {
  const [showDetail, setShowDetail] = useState(false);
  const [selectedYao, setSelectedYao] = useState<YaoInterpretation | null>(null);

  const bonGua = castResult.bonGua;
  const changingYao = castResult.changingYao;
  const changedGua = castResult.changedGua;
  const palaceInfo = getGuaPalace(castResult.originalGua);

  if (selectedYao) {
    // 효별 상세 카테고리 보기
    return (
      <>
        <div style={{ fontSize: 13, color: '#f0dfad', marginBottom: 4 }}>
          {['첫', '둘', '셋', '넷', '다섯', '여섯'][selectedYao.yao - 1] || selectedYao.yao}째 기운 · {selectedYao.byeonGuaName}
        </div>
        <div style={{
          fontSize: 13, lineHeight: 1.8, whiteSpace: 'pre-line', marginBottom: 12,
          color: '#ccc',
        }}>
          {selectedYao.general}
        </div>
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr', gap: 6,
          maxHeight: 280, overflowY: 'auto', width: '100%',
          padding: '8px 0',
        }}>
          {Object.entries(selectedYao.categories).map(([cat, val]) => (
            <div key={cat} style={{
              display: 'flex', gap: 8, alignItems: 'flex-start',
              padding: '6px 8px',
              background: 'rgba(240,223,173,0.05)',
              borderRadius: 8,
              fontSize: 12,
            }}>
              <span style={{ color: '#f0dfad', flexShrink: 0, minWidth: 48 }}>
                {cat.replace(/\(.*\)/, '')}
              </span>
              <span style={{ color: '#ccc' }}>{val}</span>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'center' }}>
          <button
            onClick={() => setSelectedYao(null)}
            style={{
              padding: '8px 20px',
              background: 'rgba(240,223,173,0.1)',
              border: '1px solid rgba(240,223,173,0.2)',
              borderRadius: 16,
              color: '#f0dfad',
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            돌아가기
          </button>
          <CopyButton
            getText={() => formatYaoText(selectedYao, bonGua?.name || '')}
            label="이 해석 복사"
          />
        </div>
        <div style={{ fontSize: 10, color: '#556', marginTop: 8, lineHeight: 1.5 }}>
          보관해두게. 기억이 흐려지거든 누군가에게 다시 물을 수 있도록.
        </div>
      </>
    );
  }

  if (showDetail && bonGua) {
    // 총론 + 변효 목록
    return (
      <>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#f0dfad', marginBottom: 4 }}>
          {bonGua.name}
        </div>
        <div style={{ fontSize: 11, color: '#889', marginBottom: 12 }}>
          {guaInfo.name}
          {palaceInfo && (
            <span style={{ marginLeft: 8, color: '#667' }}>
              {palaceInfo.palace.name}({palaceInfo.palace.wuxing}) · {getPalaceLabel(palaceInfo.palaceIndex)}
            </span>
          )}
        </div>

        {/* 괘 도표: 世應 · 지지 · 육친 */}
        {palaceInfo && (
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
              const bar = isYang ? '━━━━━' : '━━ ━━';
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ color: isShi ? '#f0dfad' : isYing ? '#8cb4ff' : '#556', width: 16, textAlign: 'center', fontSize: 11 }}>
                    {mark}
                  </span>
                  <span style={{ color: isYang ? '#dde1e5' : '#889', letterSpacing: 2 }}>{bar}</span>
                  <span style={{ color: '#f0dfad', width: 14, textAlign: 'center' }}>{palaceInfo.yaoDizhi[i]}</span>
                  <span style={{ color: '#999', fontSize: 11 }}>{liuqinKorean(palaceInfo.yaoLiuqin[i])}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* 정통 읽기 */}
        {palaceInfo && (
          <div style={{
            fontSize: 12, lineHeight: 1.9, whiteSpace: 'pre-line', marginBottom: 12,
            textAlign: 'left', color: '#b8bcc0',
            padding: '12px',
            background: 'rgba(240,223,173,0.04)',
            borderRadius: 10,
            borderLeft: '2px solid rgba(136, 153, 170, 0.3)',
          }}>
            {generateTraditionalReading(palaceInfo, bonGua.name, yaos)}
          </div>
        )}

        {/* 평서문 풀이 */}
        <div style={{
          fontSize: 13, lineHeight: 1.9, whiteSpace: 'pre-line', marginBottom: 16,
          textAlign: 'left', color: '#ccc',
          maxHeight: 200, overflowY: 'auto',
          padding: '12px',
          background: 'rgba(240,223,173,0.04)',
          borderRadius: 10,
          borderLeft: '2px solid rgba(240,223,173,0.3)',
        }}>
          {bonGua.chongron}
        </div>

        {changingYao.length > 0 && (
          <>
            <div style={{
              fontSize: 12, color: '#ccc', lineHeight: 1.7, marginBottom: 10,
              padding: '8px 10px',
              background: 'rgba(240,223,173,0.04)',
              borderRadius: 8,
            }}>
              {changingYao.length === 1
                ? '움직이는 기운이 하나 있네. 이것이 핵심 답이야.'
                : changingYao.length === 2
                ? '두 개의 기운이 움직이고 있어. 둘 다 읽어보되, 위쪽 기운을 더 눈여겨보게.'
                : `${changingYao.length}개의 기운이 요동치고 있군. 하나하나보다 전체 흐름을 느껴보게.`
              }
            </div>
            {changingYao.map((yao) => {
              const yaoLabel = ['첫', '둘', '셋', '넷', '다섯', '여섯'][yao.yao - 1] || yao.yao;
              return (
                <button
                  key={yao.yao}
                  onClick={() => setSelectedYao(yao)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    marginBottom: 6,
                    background: 'rgba(240,223,173,0.08)',
                    border: '1px solid rgba(240,223,173,0.15)',
                    borderRadius: 10,
                    color: '#dde1e5',
                    fontSize: 12,
                    cursor: 'pointer',
                    textAlign: 'left',
                    lineHeight: 1.6,
                  }}
                >
                  <span style={{ color: '#f0dfad', fontWeight: 600 }}>
                    {yaoLabel}째 기운
                  </span>
                  <span style={{ color: '#889', margin: '0 6px' }}>→</span>
                  <span>{yao.byeonGuaName}</span>
                  <div style={{ color: '#999', marginTop: 4, fontSize: 11 }}>
                    {yao.general.split('\n')[0]}
                  </div>
                </button>
              );
            })}

            {changedGua && (
              <div style={{
                marginTop: 8, padding: '10px 12px',
                background: 'rgba(240,223,173,0.04)',
                borderRadius: 10,
                fontSize: 12, color: '#999', lineHeight: 1.7,
              }}>
                기운이 흘러간 끝에는 <span style={{ color: '#f0dfad' }}>{changedGua.name}</span>의 모습이 기다리고 있네.
              </div>
            )}
          </>
        )}

        {changingYao.length === 0 && (
          <div style={{ fontSize: 12, color: '#999', lineHeight: 1.7, marginBottom: 8 }}>
            모든 기운이 고요하이. 위의 해석이 곧 자네의 답이야.
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
          <button
            onClick={() => setShowDetail(false)}
            style={{
              padding: '8px 16px',
              background: 'rgba(240,223,173,0.1)',
              border: '1px solid rgba(240,223,173,0.2)',
              borderRadius: 16,
              color: '#f0dfad',
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            돌아가기
          </button>
          {bonGua && (
            <CopyButton
              getText={() => formatGuaText(bonGua, changingYao, changedGua)}
              label="전체 복사"
            />
          )}
          <button
            onClick={onReset}
            style={{
              padding: '8px 16px',
              background: 'transparent',
              border: '1px solid rgba(240,223,173,0.15)',
              borderRadius: 16,
              color: '#889',
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            다시 점치기
          </button>
        </div>
        <div style={{ fontSize: 10, color: '#556', marginTop: 8, lineHeight: 1.5 }}>
          보관해두게. 오늘의 기억이 사라지거든 누군가에게 다시 물을 수 있도록 말이지.
        </div>
      </>
    );
  }

  // 첫 화면: 괘 이름 + 짧은 총론 + 해석 보기 버튼
  return (
    <>
      <div style={{ fontSize: 18, fontWeight: 700, color: '#f0dfad', marginBottom: 4 }}>
        {bonGua?.name || guaInfo.korean}
      </div>
      <div style={{ fontSize: 13, color: '#889', marginBottom: 16 }}>
        {guaInfo.name}
      </div>
      <div style={{ fontSize: 14, lineHeight: 1.8, marginBottom: 4 }}>
        여섯 가지의 기운이 모두 드러났네.
      </div>
      {changingYao.length === 1 && (
        <div style={{ fontSize: 12, color: '#f0dfad', lineHeight: 1.7, marginBottom: 12 }}>
          기운 하나가 뒤집히려 하고 있군.
          {'\n'}이것이 자네에게 보내는 핵심 메시지일세.
        </div>
      )}
      {changingYao.length === 2 && (
        <div style={{ fontSize: 12, color: '#f0dfad', lineHeight: 1.7, marginBottom: 12 }}>
          기운 둘이 움직이고 있어.
          {'\n'}두 이야기 모두 들어보되, 위쪽 기운에 더 귀 기울여보게.
        </div>
      )}
      {changingYao.length >= 3 && (
        <div style={{ fontSize: 12, color: '#f0dfad', lineHeight: 1.7, marginBottom: 12 }}>
          무려 {changingYao.length}개의 기운이 요동치고 있군.
          {'\n'}이럴 땐 개별 기운보다 전체 흐름을 읽는 게 좋겠어.
        </div>
      )}
      {changingYao.length === 0 && (
        <div style={{ fontSize: 12, color: '#999', lineHeight: 1.7, marginBottom: 12 }}>
          모든 기운이 제자리에 머물러 있네.
          {'\n'}지금 그대로의 뜻이 자네의 답일세.
        </div>
      )}
      <button
        onClick={() => setShowDetail(true)}
        style={{
          padding: '10px 24px',
          background: 'rgba(240, 223, 173, 0.15)',
          border: '1px solid rgba(240, 223, 173, 0.3)',
          borderRadius: 20,
          color: '#f0dfad',
          fontSize: 13,
          cursor: 'pointer',
          marginBottom: 8,
        }}
      >
        해석 보기
      </button>
      <button
        onClick={onReset}
        style={{
          padding: '8px 20px',
          background: 'transparent',
          border: '1px solid rgba(240, 223, 173, 0.15)',
          borderRadius: 20,
          color: '#889',
          fontSize: 12,
          cursor: 'pointer',
        }}
      >
        다시 점치기
      </button>
    </>
  );
}

export default function HyoPage() {
  const [stageIndex, setStageIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>('entrance');
  const [entranceStep, setEntranceStep] = useState(0);
  const [yaos, setYaos] = useState<YaoResult[]>([]);
  const [currentByeon, setCurrentByeon] = useState(0); // 0~2 (삼변)
  const [countingText, setCountingText] = useState('');
  const [gameComplete, setGameComplete] = useState(false);
  const [charPos, setCharPos] = useState(START_POS);
  const [isWalking, setIsWalking] = useState(false);

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
    { speaker: '복길', style: 'normal' as const, text: '사주는 타고난 그릇을 보는 것이라면,\n육효는 지금 이 순간의 물음에\n답을 구하는 것이야.' },
    { speaker: '복길', style: 'normal' as const, text: '마음속에 묻고 싶은 것 하나만\n품고 오게.' },
    { speaker: '복길', style: 'normal' as const, text: '준비가 되면,\n여섯 그루의 나무에서\n가지를 모아오게 될 걸세.' },
  ];

  // 시초 나누기 (탭)
  const handleSplit = useCallback(async () => {
    if (stageIndex === 0 && yaos.length === 0) trackEvent('hyo_start');
    setPhase('counting');

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
      setCharPos(ALTAR_POS);
      setGameComplete(true);
      setPhase('complete');
      trackEvent('hyo_complete');
    }
  }, [stageIndex]);

  // 괘 정보
  const guaInfo = gameComplete ? (() => {
    const originalGua = yaos.map(y => y.isYang ? 1 : 0);
    return getGuaName(originalGua);
  })() : null;

  // 괘 해석
  const castResult = gameComplete ? interpretCast(yaos) : null;

  return (
    <div style={{
      minHeight: '100vh',
      background: '#1a1e24',
      color: '#dde1e5',
      fontFamily: '"Pretendard Variable", sans-serif',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <BgmPlayer show src="/bgm/hyo.mp3" />

      {/* 배경 맵 + 캐릭터 */}
      <div style={{
        position: 'fixed', inset: 0,
        display: 'flex', justifyContent: 'center',
      }}>
        <div style={{ position: 'relative', height: '100%', maxWidth: 440, width: '100%' }}>
          <img
            src="/background/hyo.jpeg"
            alt=""
            style={{
              height: '100%',
              width: '100%',
              objectFit: 'cover',
              opacity: 0.35,
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
              src="/character/hyo.png"
              alt="복길"
              style={{
                height: '6vh',
                width: 'auto',
                imageRendering: 'pixelated',
                filter: `drop-shadow(0 3px 8px rgba(0,0,0,0.6))${isWalking ? ' brightness(1.3)' : ''}`,
                animation: 'bounce-gentle 1.2s ease-in-out infinite',
              }}
            />
          </div>
        </div>
      </div>

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
          {/* 탭 영역 (상단 빈 공간) */}
          <div className="flex-1" onClick={() => {
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
              const line = ENTRANCE_LINES[entranceStep];
              const isThought = line.style === 'thought';
              const isLast = entranceStep === ENTRANCE_LINES.length - 1;
              const advance = () => {
                if (isLast) runSpiritPath(STAGES[0].spiritPath, () => setPhase('intro'));
                else setEntranceStep(s => s + 1);
              };
              return (
                <div
                  onClick={advance}
                  style={{
                    background: 'rgba(20, 25, 35, 0.92)',
                    border: '2px solid #556677',
                    padding: '14px 16px',
                    cursor: 'pointer',
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
                    </div>
                    {!isThought && (
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
      {phase !== 'entrance' && !gameComplete && (
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
            background: 'rgba(26, 30, 36, 0.9)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(240, 223, 173, 0.2)',
            borderRadius: 16,
            padding: '20px 24px',
            maxWidth: 340,
            width: '100%',
            textAlign: 'center',
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
              <div
                onClick={handleSplit}
                style={{
                  display: 'flex', justifyContent: 'center', gap: 2,
                  padding: '16px 0',
                  cursor: 'pointer',
                  transition: 'transform 0.15s',
                }}
                onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.95)')}
                onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
              >
                {Array.from({ length: 49 }).map((_, i) => (
                  <div
                    key={i}
                    style={{
                      width: 2,
                      height: 28 + Math.random() * 8,
                      backgroundColor: '#c4a86a',
                      borderRadius: 1,
                      opacity: 0.6 + Math.random() * 0.4,
                    }}
                  />
                ))}
              </div>
              <div style={{ fontSize: 11, color: '#889', marginTop: 4 }}>탭하여 나누기</div>
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
              <div style={{ margin: '12px 0', position: 'relative' }}>
                <YaoSymbol yao={yaos[yaos.length - 1]} size={80} />
                <div style={{ fontSize: 11, color: '#889', marginTop: 6 }}>
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
            onReset={() => {
              setStageIndex(0);
              setPhase('intro');
              setYaos([]);
              setGameComplete(false);
              setCurrentByeon(0);
              setCountingText('');
              setCharPos(START_POS);
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
