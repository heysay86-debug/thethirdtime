'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import BgmPlayer from '@/app/alt2/components/base/BgmPlayer';

// ─── 타입 ───────────────────────────────────────────────────

type Phase =
  | 'preamble'
  | 'relation_select'
  | 'input_self'
  | 'input_other'
  | 'input_third'
  | 'cast'
  | 'analyzing'
  | 'result_data'
  | 'perspective_questions'
  | 'result_final';

type RelationType =
  | 'couple' | 'parent_child' | 'friend' | 'business' | 'boss_sub';

interface PersonInfo {
  name: string;
  birthDate: string;
  birthTime: string;
  gender: 'M' | 'F';
  calendar: 'solar' | 'lunar';
}

// ─── 상수 ───────────────────────────────────────────────────

const HANJA_TO_HANGUL: Record<string, string> = {
  '甲': '갑', '乙': '을', '丙': '병', '丁': '정', '戊': '무',
  '己': '기', '庚': '경', '辛': '신', '壬': '임', '癸': '계',
  '子': '자', '丑': '축', '寅': '인', '卯': '묘', '辰': '진',
  '巳': '사', '午': '오', '未': '미', '申': '신', '酉': '유',
  '戌': '술', '亥': '해',
};

const ELEMENT_COLORS: Record<string, string> = {
  '甲': '#22c55e', '乙': '#22c55e', '丙': '#ef4444', '丁': '#ef4444',
  '戊': '#a3803c', '己': '#a3803c', '庚': '#94a3b8', '辛': '#94a3b8',
  '壬': '#3b82f6', '癸': '#3b82f6',
  '子': '#3b82f6', '丑': '#a3803c', '寅': '#22c55e', '卯': '#22c55e',
  '辰': '#a3803c', '巳': '#ef4444', '午': '#ef4444', '未': '#a3803c',
  '申': '#94a3b8', '酉': '#94a3b8', '戌': '#a3803c', '亥': '#3b82f6',
};

const ELEMENT_HANGUL: Record<string, string> = {
  '木': '목', '火': '화', '土': '토', '金': '금', '水': '수',
};

const PREAMBLE_MESSAGES = [
  '"좋은 궁합"의 기준은 사람마다 다르네.\n\n정서적 유대를 원하는 사람, 실리적 도움을 원하는 사람, 편안함을 원하는 사람, 긴장감 속에서 성장하고 싶은 사람... 자네가 생각하는 "좋은 관계"란 무엇인가?',
  '지금 본인의 상태에 따라 맞는 상대가 달라진다네.\n\n힘든 시기라면 안정을 주는 사람이, 안정적이라면 자극을 주는 사람이 오히려 도움이 될 수 있어. 같은 상대라도 시기에 따라 관계의 질이 변한다네.',
  '궁합은 고정된 운명이 아니야.\n\n점수가 높아도 노력 없이 유지되는 관계는 없고, 점수가 낮아도 서로를 이해하면 더 깊은 관계가 될 수 있네. 숫자에 얽매이지 말고, 이해의 도구로 사용하게.',
  '"이 사람이 당신의 운명이다"라고 단정하는 곳은 조심하게.\n\n여기서는 그런 단정을 하지 않네. 데이터를 보여줄 뿐, 해석과 판단은 자네 몫이야.',
];

const RELATION_TYPES: { code: RelationType; label: string; desc: string; icon: string }[] = [
  { code: 'couple', label: '연인 / 부부', desc: '배우자궁 중심, 정서적 유대', icon: '/bokgil/couple.png' },
  { code: 'parent_child', label: '부모 / 자녀', desc: '세대 간 오행 흐름, 이해와 성장', icon: '/bokgil/family.png' },
  { code: 'friend', label: '친구 / 동료', desc: '동류 의식, 상호 보완', icon: '/bokgil/friend.png' },
  { code: 'business', label: '사업 파트너', desc: '재성-관성 교환, 시너지', icon: '/bokgil/business.png' },
  { code: 'boss_sub', label: '상사 / 부하', desc: '관성-인성 구도, 역할 분담', icon: '/bokgil/boss.png' },
];

const SELF_STORAGE_KEY = 'thethirdtime_saju_input';

function delay(ms: number) { return new Promise(r => setTimeout(r, ms)); }

// ─── 메인 컴포넌트 ─────────────────────────────────────────

export default function GunghamPage() {
  const [phase, setPhase] = useState<Phase>('preamble');
  const [preambleIndex, setPreambleIndex] = useState(0);
  const [relationType, setRelationType] = useState<RelationType | null>(null);
  const [selfInfo, setSelfInfo] = useState<PersonInfo>({ name: '', birthDate: '', birthTime: '', gender: 'M', calendar: 'solar' });
  const [otherInfo, setOtherInfo] = useState<PersonInfo>({ name: '', birthDate: '', birthTime: '', gender: 'F', calendar: 'solar' });
  const [thirdInfo, setThirdInfo] = useState<PersonInfo>({ name: '', birthDate: '', birthTime: '', gender: 'M', calendar: 'solar' });
  const [has3rd, setHas3rd] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [perspectiveAnswers, setPerspectiveAnswers] = useState<Record<string, string>>({});
  const [perspectiveResult, setPerspectiveResult] = useState<any>(null);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [perspectiveQuestions, setPerspectiveQuestions] = useState<any[]>([]);
  const [castStep, setCastStep] = useState(0); // 0=back, 1=right, 2=summon
  const [castFade, setCastFade] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const [fromSaju, setFromSaju] = useState(false);

  // localStorage에서 본인 정보 자동 채움
  useEffect(() => {
    try {
      const stored = localStorage.getItem(SELF_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setSelfInfo(prev => ({
          ...prev,
          name: parsed.name || prev.name,
          birthDate: parsed.birthDate || prev.birthDate,
          birthTime: parsed.birthTime || prev.birthTime,
          gender: parsed.gender || prev.gender,
          calendar: parsed.calendar || prev.calendar,
        }));
      }
    } catch { /* ignore */ }
    // ?from=saju일 때 표시
    if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('from') === 'saju') {
      setFromSaju(true);
    }
  }, []);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      containerRef.current?.scrollTo({ top: containerRef.current.scrollHeight, behavior: 'smooth' });
    }, 100);
  }, []);

  // ── cast 시퀀스 + 분석 실행 ──
  const startCastAndAnalyze = useCallback(async () => {
    // cast 시퀀스
    setCastStep(0);
    setCastFade(true);
    setPhase('cast');
    await delay(1000); // angel_back 디졸브 in + 유지

    setCastFade(false);
    setCastStep(1); // angel_right
    await delay(500);

    setCastStep(2); // angel_summon
    await delay(500);

    // 플래시 + 분석
    setPhase('analyzing');
    setError(null);

    const persons: any[] = [
      { ...selfInfo, birthTime: selfInfo.birthTime || undefined },
      { ...otherInfo, birthTime: otherInfo.birthTime || undefined },
    ];
    if (has3rd) {
      persons.push({ ...thirdInfo, birthTime: thirdInfo.birthTime || undefined });
    }

    const rt = has3rd
      ? (relationType === 'friend' ? 'friends' : relationType === 'parent_child' ? 'family' : 'team')
      : relationType;

    try {
      const res = await fetch('/api/saju/gungham', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ persons, relationType: rt }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: '분석 실패' }));
        throw new Error(errData.error || `HTTP ${res.status}`);
      }

      const data = await res.json();
      setResult(data);
      setPhase('result_data');
    } catch (e) {
      setError(e instanceof Error ? e.message : '분석 중 오류가 발생했습니다.');
      setPhase('input_other');
    }
  }, [selfInfo, otherInfo, thirdInfo, has3rd, relationType]);

  // ── 관점 질문 로드 ──
  const startPerspectiveQuestions = useCallback(async () => {
    try {
      // 관점 질문은 엔진에서 정적으로 정의됨
      const { PERSPECTIVE_QUESTIONS } = await import('@/src/engine/gungham');
      const key = relationType || 'couple';
      const questions = PERSPECTIVE_QUESTIONS[key] || PERSPECTIVE_QUESTIONS['couple'];
      setPerspectiveQuestions(questions);
      setCurrentQIndex(0);
      setPerspectiveAnswers({});
      setPhase('perspective_questions');
    } catch {
      // fallback
      setPhase('result_final');
    }
  }, [relationType]);

  // ── 관점 답변 처리 ──
  const handlePerspectiveAnswer = useCallback((questionId: string, value: string) => {
    const newAnswers = { ...perspectiveAnswers, [questionId]: value };
    setPerspectiveAnswers(newAnswers);

    if (currentQIndex < perspectiveQuestions.length - 1) {
      setCurrentQIndex(prev => prev + 1);
    } else {
      // 모든 질문 완료 -> 관점 해석 요청
      generatePerspective(newAnswers);
    }
  }, [perspectiveAnswers, currentQIndex, perspectiveQuestions]);

  const generatePerspective = useCallback(async (answers: Record<string, string>) => {
    try {
      const { generatePerspectiveInterpretation } = await import('@/src/engine/gungham');
      if (result && result.pairs.length > 0) {
        const answerArr = Object.entries(answers).map(([questionId, value]) => ({ questionId, value }));
        const rt = has3rd
          ? (relationType === 'friend' ? 'friends' : relationType === 'parent_child' ? 'family' : 'team')
          : relationType;
        const interp = generatePerspectiveInterpretation(result.pairs[0], rt as any, answerArr);
        setPerspectiveResult(interp);
      }
    } catch { /* ignore */ }
    setPhase('result_final');
  }, [result, relationType, has3rd]);

  const isResultPhase = phase === 'result_data' || phase === 'perspective_questions' || phase === 'result_final';
  const bgImage = isResultPhase ? '/background/mirror_after.jpeg' : '/background/mirror.jpeg';

  // ── 렌더링 ──
  return (
    <div
      ref={containerRef}
      style={{
        minHeight: '100vh',
        background: '#1a1e24',
        color: '#dde1e5',
        fontFamily: '"Pretendard Variable", sans-serif',
        overflowY: 'auto',
        position: 'relative',
        maxWidth: 440,
        margin: '0 auto',
        overflow: 'hidden',
      }}
    >
      <link href="https://fonts.googleapis.com/css2?family=Gaegu&display=swap" rel="stylesheet" />
      <BgmPlayer show src="/bgm/memorialfield.mp3" autoPlayFromMenu />

      {/* 배경 맵 + 캐릭터 */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, display: 'flex', justifyContent: 'center' }}>
        <div style={{ position: 'relative', height: '100%', maxWidth: 440, width: '100%' }}>
          <img
            src={bgImage}
            alt=""
            style={{
              height: '100%', width: '100%',
              objectFit: 'cover', opacity: 0.3,
              transition: 'opacity 0.8s ease',
            }}
          />
          {/* 복길 캐릭터 — 거울 위 하늘 */}
          {phase === 'cast' ? (
            <div style={{
              position: 'absolute',
              top: '22%',
              left: '50%',
              transform: 'translateX(-50%)',
            }}>
              {/* sparkle 이펙트 */}
              <div style={{
                position: 'absolute',
                inset: '-30px',
                pointerEvents: 'none',
              }}>
                {[...Array(8)].map((_, i) => (
                  <div key={i} style={{
                    position: 'absolute',
                    width: 4, height: 4,
                    backgroundColor: '#f0dfad',
                    borderRadius: '50%',
                    boxShadow: '0 0 6px #f0dfad, 0 0 12px rgba(240,223,173,0.5)',
                    left: `${20 + Math.cos(i * Math.PI / 4) * 45}%`,
                    top: `${20 + Math.sin(i * Math.PI / 4) * 45}%`,
                    animation: `sparkle-${i % 3} ${1 + (i % 3) * 0.3}s ease-in-out infinite`,
                    animationDelay: `${i * 0.15}s`,
                  }} />
                ))}
              </div>
              <img
                src={['/character/angel_back.png', '/character/angel_right.png', '/character/angel_summon.png'][castStep]}
                alt="복길"
                style={{
                  height: '14vh',
                  width: 'auto',
                  imageRendering: 'pixelated',
                  filter: 'drop-shadow(0 0 20px rgba(240,223,173,0.6)) drop-shadow(0 4px 12px rgba(0,0,0,0.5))',
                  opacity: castFade ? 0 : 1,
                  animation: castFade ? 'cast-fade-in 0.5s ease forwards' : undefined,
                }}
              />
            </div>
          ) : (
            <img
              src="/character/angel_dot.png"
              alt="복길"
              style={{
                position: 'absolute',
                top: '25%',
                left: '50%',
                transform: 'translateX(-50%)',
                height: '5vh',
                width: 'auto',
                imageRendering: 'pixelated',
                filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.5))',
                animation: 'float-gentle 2s ease-in-out infinite',
                opacity: 0.85,
              }}
            />
          )}
        </div>
      </div>

      {/* 화면전환 플래시 */}
      {phase === 'analyzing' && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 50,
          background: 'rgba(240, 223, 173, 0.5)',
          animation: 'gungham-flash 1.5s ease-in-out',
          pointerEvents: 'none',
        }} />
      )}
      <style>{`
        @keyframes gungham-flash {
          0% { opacity: 0; }
          40% { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes bounce-gentle {
          0%, 100% { transform: translateX(-50%) translateY(0); }
          50% { transform: translateX(-50%) translateY(-4px); }
        }
        @keyframes cast-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes float-gentle {
          0%, 100% { transform: translateX(-50%) translateY(0); }
          50% { transform: translateX(-50%) translateY(-6px); }
        }
        @keyframes sparkle-0 {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.8); }
        }
        @keyframes sparkle-1 {
          0%, 100% { opacity: 0.5; transform: scale(1.2); }
          50% { opacity: 0.2; transform: scale(0.6); }
        }
        @keyframes sparkle-2 {
          0%, 100% { opacity: 0.2; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.5); }
        }
      `}</style>

      <div style={{
        maxWidth: 440, margin: '0 auto',
        padding: '24px 20px 80px',
        display: 'flex', flexDirection: 'column', gap: 20,
        position: 'relative', zIndex: 1,
      }}>
        {/* 헤더 */}
        <div style={{ textAlign: 'center', paddingTop: 16 }}>
          <h1 style={{
            fontSize: 20, fontWeight: 700, color: '#f0dfad',
            fontFamily: '"Gaegu", cursive', margin: 0,
          }}>
            3장 - 인연의 거울
          </h1>
          <p style={{ fontSize: 11, color: '#889', marginTop: 4 }}>
            궁합 분석
          </p>
        </div>

        {/* ── 프리앰블 ── */}
        {phase === 'preamble' && (
          <PreambleSection
            index={preambleIndex}
            onNext={() => {
              if (preambleIndex < PREAMBLE_MESSAGES.length - 1) {
                setPreambleIndex(prev => prev + 1);
              } else {
                setPhase('relation_select');
              }
            }}
            isLast={preambleIndex >= PREAMBLE_MESSAGES.length - 1}
          />
        )}

        {/* ── 관계 유형 선택 ── */}
        {phase === 'relation_select' && (
          <RelationSelectSection
            onSelect={(rt) => {
              setRelationType(rt);
              if (fromSaju && selfInfo.name && selfInfo.birthDate) {
                setPhase('input_other');
              } else {
                setPhase('input_self');
              }
            }}
          />
        )}

        {/* ── 본인 정보 입력 ── */}
        {phase === 'input_self' && (
          <PersonInputSection
            title="본인 정보"
            subtitle="이미 사주풀이를 한 경우 자동으로 채워집니다"
            info={selfInfo}
            onChange={setSelfInfo}
            onNext={() => setPhase('input_other')}
            onBack={() => setPhase('relation_select')}
          />
        )}

        {/* ── 상대 정보 입력 ── */}
        {phase === 'input_other' && (
          <>
            <PersonInputSection
              title="상대 정보"
              subtitle={`${RELATION_TYPES.find(r => r.code === relationType)?.label || ''} 관계의 상대`}
              info={otherInfo}
              onChange={setOtherInfo}
              onNext={() => {
                if (has3rd) {
                  setPhase('input_third');
                } else {
                  startCastAndAnalyze();
                }
              }}
              onBack={() => setPhase('input_self')}
            />
            {!has3rd && (
              <button
                onClick={() => setHas3rd(true)}
                style={btnTertiary}
              >
                + 한 명 더 추가 (3인 분석)
              </button>
            )}
            {has3rd && (
              <button
                onClick={() => setHas3rd(false)}
                style={{ ...btnTertiary, color: '#ef4444' }}
              >
                3인 분석 취소
              </button>
            )}
            {error && (
              <div style={{ padding: 12, background: 'rgba(239,68,68,0.15)', borderRadius: 8, fontSize: 13, color: '#ef4444' }}>
                {error}
              </div>
            )}
          </>
        )}

        {/* ── 3인째 입력 ── */}
        {phase === 'input_third' && (
          <PersonInputSection
            title="세 번째 사람"
            subtitle="3인 관계 분석"
            info={thirdInfo}
            onChange={setThirdInfo}
            onNext={startCastAndAnalyze}
            onBack={() => setPhase('input_other')}
          />
        )}

        {/* ── 분석 중 ── */}
        {phase === 'analyzing' && (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <BokgilMessage text="두 여행자의 운명이\n교차하는 지점을 살펴보고 있네..." />
            <div style={{ marginTop: 24 }}>
              <div style={{
                width: 32, height: 32, margin: '0 auto',
                border: '3px solid rgba(240,223,173,0.3)',
                borderTop: '3px solid #f0dfad',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
              }} />
            </div>
          </div>
        )}

        {/* ── 1차 결과: 데이터 ── */}
        {phase === 'result_data' && result && (
          <ResultDataSection
            result={result}
            onContinue={startPerspectiveQuestions}
          />
        )}

        {/* ── 관점 질문 ── */}
        {phase === 'perspective_questions' && perspectiveQuestions.length > 0 && (
          <PerspectiveSection
            question={perspectiveQuestions[currentQIndex]}
            questionNumber={currentQIndex + 1}
            totalQuestions={perspectiveQuestions.length}
            onAnswer={handlePerspectiveAnswer}
          />
        )}

        {/* ── 2차 결과: 최종 해석 ── */}
        {phase === 'result_final' && result && (
          <FinalResultSection
            result={result}
            perspectiveResult={perspectiveResult}
            onRestart={() => {
              setPhase('preamble');
              setPreambleIndex(0);
              setResult(null);
              setPerspectiveResult(null);
              setRelationType(null);
              setOtherInfo({ name: '', birthDate: '', birthTime: '', gender: 'F', calendar: 'solar' });
              setThirdInfo({ name: '', birthDate: '', birthTime: '', gender: 'M', calendar: 'solar' });
              setHas3rd(false);
            }}
          />
        )}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fade-in { animation: fade-in 0.4s ease; }
      `}</style>
    </div>
  );
}

// ─── 스타일 상수 ─────────────────────────────────────────────

const cardStyle: React.CSSProperties = {
  background: 'rgba(92,61,30,0.2)',
  border: '1px solid rgba(240,223,173,0.12)',
  borderRadius: 12,
  padding: 16,
};

const btnPrimary: React.CSSProperties = {
  width: '100%', padding: '14px 16px', borderRadius: 12,
  fontSize: 14, fontWeight: 600,
  backgroundColor: '#f0dfad', color: '#2a1f14',
  border: 'none', cursor: 'pointer',
};

const btnSecondary: React.CSSProperties = {
  width: '100%', padding: '12px 16px', borderRadius: 12,
  fontSize: 14, fontWeight: 600,
  backgroundColor: 'rgba(104, 128, 151, 0.25)', color: '#dde1e5',
  border: 'none', cursor: 'pointer',
};

const btnTertiary: React.CSSProperties = {
  padding: '10px 16px', borderRadius: 8,
  fontSize: 12, fontWeight: 500,
  backgroundColor: 'transparent', color: '#889',
  border: '1px dashed rgba(136,153,170,0.3)', cursor: 'pointer',
  width: '100%',
};

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 12px',
  background: 'rgba(26,30,36,0.8)',
  border: '1px solid rgba(240,223,173,0.15)',
  borderRadius: 8, color: '#dde1e5',
  fontSize: 14, outline: 'none',
  boxSizing: 'border-box',
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  appearance: 'none' as const,
};

// ─── 복길 메시지 컴포넌트 ────────────────────────────────────

function BokgilMessage({ text }: { text: string }) {
  return (
    <div style={{
      ...cardStyle,
      display: 'flex', gap: 12, alignItems: 'flex-start',
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: '50%',
        background: 'rgba(240,223,173,0.1)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, overflow: 'hidden',
      }}>
        <img
          src="/character/angel.svg"
          alt="복길"
          style={{ width: 40, height: 40, objectFit: 'contain' }}
          onError={(e) => { (e.target as HTMLImageElement).src = '/bokgil/magician.png'; }}
        />
      </div>
      <div>
        <div style={{ fontSize: 11, color: '#f0dfad', fontWeight: 600, marginBottom: 4 }}>복길</div>
        <div style={{
          fontSize: 16, lineHeight: 1.7, color: '#dde1e5', whiteSpace: 'pre-line',
          fontFamily: '"Gaegu", cursive',
        }}>
          {text}
        </div>
      </div>
    </div>
  );
}

// ─── 프리앰블 섹션 ───────────────────────────────────────────

function PreambleSection({ index, onNext, isLast }: { index: number; onNext: () => void; isLast: boolean }) {
  return (
    <div className="fade-in" key={index}>
      <BokgilMessage text={PREAMBLE_MESSAGES[index]} />
      <div style={{ marginTop: 16 }}>
        <button onClick={onNext} style={btnPrimary}>
          {isLast ? '준비되었네' : '다음'}
        </button>
      </div>
      <div style={{ textAlign: 'center', marginTop: 8 }}>
        <span style={{ fontSize: 10, color: '#667' }}>
          {index + 1} / {PREAMBLE_MESSAGES.length}
        </span>
      </div>
    </div>
  );
}

// ─── 관계 유형 선택 ──────────────────────────────────────────

function RelationSelectSection({ onSelect }: { onSelect: (rt: RelationType) => void }) {
  return (
    <div className="fade-in">
      <BokgilMessage text="어떤 관계를 살펴볼 건가?" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
        {RELATION_TYPES.map(rt => (
          <button
            key={rt.code}
            onClick={() => onSelect(rt.code)}
            style={{
              ...cardStyle,
              display: 'flex', alignItems: 'center', gap: 12,
              cursor: 'pointer', textAlign: 'left',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(92,61,30,0.35)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(92,61,30,0.2)'; }}
          >
            <div style={{
              width: 44, height: 44, borderRadius: 8,
              background: 'rgba(240,223,173,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
              overflow: 'hidden',
            }}>
              <img
                src={rt.icon}
                alt={rt.label}
                style={{ width: 36, height: 36, objectFit: 'cover' }}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                  (e.target as HTMLImageElement).parentElement!.innerHTML = '<span style="font-size:20px">&#9734;</span>';
                }}
              />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#f0dfad' }}>{rt.label}</div>
              <div style={{ fontSize: 11, color: '#889', marginTop: 2 }}>{rt.desc}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── 인물 정보 입력 ──────────────────────────────────────────

function PersonInputSection({
  title, subtitle, info, onChange, onNext, onBack,
}: {
  title: string;
  subtitle?: string;
  info: PersonInfo;
  onChange: (info: PersonInfo) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const isValid = info.name.trim() && info.birthDate;

  return (
    <div className="fade-in">
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: '#f0dfad' }}>{title}</div>
        {subtitle && <div style={{ fontSize: 11, color: '#889', marginTop: 2 }}>{subtitle}</div>}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* 이름 */}
        <div>
          <label style={labelStyle}>이름 (닉네임)</label>
          <input
            type="text"
            value={info.name}
            onChange={e => onChange({ ...info, name: e.target.value })}
            placeholder="이름을 입력하세요"
            maxLength={20}
            style={inputStyle}
          />
        </div>

        {/* 양/음력 */}
        <div>
          <label style={labelStyle}>달력 유형</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {(['solar', 'lunar'] as const).map(cal => (
              <button
                key={cal}
                onClick={() => onChange({ ...info, calendar: cal })}
                style={{
                  flex: 1, padding: '8px 12px', borderRadius: 8,
                  fontSize: 13, fontWeight: 500,
                  background: info.calendar === cal ? 'rgba(240,223,173,0.2)' : 'rgba(26,30,36,0.5)',
                  color: info.calendar === cal ? '#f0dfad' : '#889',
                  border: `1px solid ${info.calendar === cal ? 'rgba(240,223,173,0.3)' : 'rgba(240,223,173,0.08)'}`,
                  cursor: 'pointer',
                }}
              >
                {cal === 'solar' ? '양력' : '음력'}
              </button>
            ))}
          </div>
        </div>

        {/* 생년월일 */}
        <div>
          <label style={labelStyle}>생년월일</label>
          <input
            type="date"
            value={info.birthDate}
            onChange={e => onChange({ ...info, birthDate: e.target.value })}
            style={{ ...inputStyle, colorScheme: 'dark' }}
          />
        </div>

        {/* 생시 */}
        <div>
          <label style={labelStyle}>태어난 시각 (선택)</label>
          <input
            type="time"
            value={info.birthTime}
            onChange={e => onChange({ ...info, birthTime: e.target.value })}
            style={{ ...inputStyle, colorScheme: 'dark' }}
          />
        </div>

        {/* 성별 */}
        <div>
          <label style={labelStyle}>성별</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {(['M', 'F'] as const).map(g => (
              <button
                key={g}
                onClick={() => onChange({ ...info, gender: g })}
                style={{
                  flex: 1, padding: '8px 12px', borderRadius: 8,
                  fontSize: 13, fontWeight: 500,
                  background: info.gender === g ? 'rgba(240,223,173,0.2)' : 'rgba(26,30,36,0.5)',
                  color: info.gender === g ? '#f0dfad' : '#889',
                  border: `1px solid ${info.gender === g ? 'rgba(240,223,173,0.3)' : 'rgba(240,223,173,0.08)'}`,
                  cursor: 'pointer',
                }}
              >
                {g === 'M' ? '남성' : '여성'}
              </button>
            ))}
          </div>
        </div>

        {/* 버튼 */}
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <button onClick={onBack} style={{ ...btnSecondary, flex: '0 0 auto', width: 80 }}>
            이전
          </button>
          <button
            onClick={onNext}
            disabled={!isValid}
            style={{
              ...btnPrimary, flex: 1,
              opacity: isValid ? 1 : 0.5,
              cursor: isValid ? 'pointer' : 'default',
            }}
          >
            다음
          </button>
        </div>
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 11, color: '#889',
  fontWeight: 500, marginBottom: 4,
};

// ─── 결과 데이터 섹션 ───────────────────────────────────────

function ResultDataSection({ result, onContinue }: { result: any; onContinue: () => void }) {
  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <BokgilMessage text="두 사람의 사주를 나란히 놓고 살펴보았네." />

      {/* 사주 나란히 표시 */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto' }}>
        {result.persons.map((person: any, idx: number) => (
          <MiniPillarCard key={idx} person={person} />
        ))}
      </div>

      {/* 쌍별 분석 */}
      {result.pairs.map((pair: any, idx: number) => (
        <PairCard key={idx} pair={pair} />
      ))}

      {/* 3인 그룹 역학 */}
      {result.groupDynamics && (
        <GroupDynamicsCard dynamics={result.groupDynamics} />
      )}

      <div style={{ marginTop: 8 }}>
        <BokgilMessage text="데이터를 살펴보았으니, 이제 자네의 관점에서 해석해보겠네. 몇 가지 질문에 답해주게." />
      </div>

      <button onClick={onContinue} style={btnPrimary}>
        관점 질문으로 넘어가기
      </button>
    </div>
  );
}

// ─── 미니 기둥 카드 ──────────────────────────────────────────

function MiniPillarCard({ person }: { person: any }) {
  const positions = ['hour', 'day', 'month', 'year'];
  const labels = ['시', '일', '월', '연'];

  return (
    <div style={{
      ...cardStyle, flex: 1, minWidth: 140,
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
    }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: '#f0dfad' }}>
        {person.name}
      </div>
      <div style={{ fontSize: 10, color: '#889' }}>
        일간 {ELEMENT_HANGUL[person.dayGanElement] || person.dayGanElement} | {person.strengthLevel}
      </div>

      <div style={{ display: 'flex', gap: 4 }}>
        {positions.map((pos, i) => {
          const pillar = person.pillars[pos];
          if (!pillar) return (
            <div key={pos} style={miniPillarCellStyle}>
              <div style={{ fontSize: 8, color: '#667' }}>{labels[i]}</div>
              <div style={{ fontSize: 11, color: '#556' }}>?</div>
              <div style={{ fontSize: 11, color: '#556' }}>?</div>
            </div>
          );
          return (
            <div key={pos} style={miniPillarCellStyle}>
              <div style={{ fontSize: 8, color: '#667' }}>{labels[i]}</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: ELEMENT_COLORS[pillar.gan] || '#ddd' }}>
                {HANJA_TO_HANGUL[pillar.gan] || pillar.gan}
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: ELEMENT_COLORS[pillar.ji] || '#ddd' }}>
                {HANJA_TO_HANGUL[pillar.ji] || pillar.ji}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ fontSize: 10, color: '#97c6aa' }}>
        용신: {ELEMENT_HANGUL[person.yongSinPrimary] || person.yongSinPrimary}
      </div>
    </div>
  );
}

const miniPillarCellStyle: React.CSSProperties = {
  width: 28, textAlign: 'center',
  display: 'flex', flexDirection: 'column', gap: 2,
};

// ─── 쌍별 카드 ──────────────────────────────────────────────

function PairCard({ pair }: { pair: any }) {
  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#f0dfad' }}>
          {pair.personA} & {pair.personB}
        </div>
        <ScoreBadge score={pair.score} rating={pair.rating} />
      </div>

      {/* 일간 관계 */}
      <div style={infoRowStyle}>
        <div style={{ fontSize: 11, color: '#889', minWidth: 60 }}>일간 관계</div>
        <div style={{ fontSize: 12, color: '#c8cdd3' }}>
          <span style={{
            color: pair.dayGanRelation.type === '상생' ? '#97c6aa'
              : pair.dayGanRelation.type === '비겁' ? '#f0dfad'
              : '#f2b6b6',
            fontWeight: 600,
          }}>
            {pair.dayGanRelation.type}
          </span>
          {' '}{pair.dayGanRelation.direction}
        </div>
      </div>

      {/* 용신 교환 */}
      <div style={infoRowStyle}>
        <div style={{ fontSize: 11, color: '#889', minWidth: 60 }}>용신 교환</div>
        <div style={{ fontSize: 12, color: '#c8cdd3' }}>
          {pair.yongSinExchange.description}
        </div>
      </div>

      {/* 지지 합충 */}
      {pair.jijiRelations.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <div style={{ fontSize: 11, color: '#889', marginBottom: 4 }}>지지 합충형파해</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {pair.jijiRelations.map((rel: any, i: number) => (
              <span key={i} style={{
                fontSize: 10, padding: '3px 6px', borderRadius: 4,
                background: rel.type === '합' ? 'rgba(151,198,170,0.15)' : 'rgba(242,182,182,0.15)',
                color: rel.type === '합' ? '#97c6aa' : '#f2b6b6',
                border: `1px solid ${rel.type === '합' ? 'rgba(151,198,170,0.3)' : 'rgba(242,182,182,0.3)'}`,
              }}>
                {rel.position1} {HANJA_TO_HANGUL[rel.ji1] || rel.ji1} {rel.type} {rel.position2} {HANJA_TO_HANGUL[rel.ji2] || rel.ji2}
                {rel.significance === 'high' && ' *'}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 해석 요약 */}
      <div style={{ marginTop: 12, fontSize: 12, color: '#a0a8b0', lineHeight: 1.6 }}>
        {pair.interpretation.summary}
      </div>
    </div>
  );
}

const infoRowStyle: React.CSSProperties = {
  display: 'flex', gap: 8, alignItems: 'flex-start',
  padding: '6px 0',
  borderBottom: '1px solid rgba(240,223,173,0.06)',
};

// ─── 점수 뱃지 ──────────────────────────────────────────────

function ScoreBadge({ score, rating }: { score: number; rating: string }) {
  const color = score >= 70 ? '#97c6aa' : score >= 50 ? '#f0dfad' : '#f2b6b6';
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      background: `rgba(${score >= 70 ? '151,198,170' : score >= 50 ? '240,223,173' : '242,182,182'},0.1)`,
      border: `1px solid ${color}33`,
      borderRadius: 10, padding: '6px 12px',
    }}>
      <div style={{ fontSize: 20, fontWeight: 700, color, lineHeight: 1 }}>{score}</div>
      <div style={{ fontSize: 9, color, marginTop: 2 }}>{rating}</div>
    </div>
  );
}

// ─── 그룹 역학 카드 ──────────────────────────────────────────

function GroupDynamicsCard({ dynamics }: { dynamics: any }) {
  return (
    <div style={{ ...cardStyle, borderColor: 'rgba(97,129,153,0.3)' }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: '#618199', marginBottom: 8 }}>
        그룹 역학
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ fontSize: 12, color: '#c8cdd3' }}>전체 점수</div>
        <ScoreBadge score={dynamics.overallScore} rating="" />
      </div>
      <div style={{ fontSize: 12, color: '#a0a8b0', lineHeight: 1.6, marginBottom: 4 }}>
        {dynamics.ohengBalance}
      </div>
      <div style={{ fontSize: 12, color: '#a0a8b0', lineHeight: 1.6, marginBottom: 4 }}>
        중심 인물: <span style={{ color: '#f0dfad', fontWeight: 600 }}>{dynamics.keyPerson}</span>
      </div>
      <div style={{ fontSize: 12, color: '#a0a8b0', lineHeight: 1.6 }}>
        {dynamics.description}
      </div>
    </div>
  );
}

// ─── 관점 질문 섹션 ──────────────────────────────────────────

function PerspectiveSection({
  question, questionNumber, totalQuestions, onAnswer,
}: {
  question: any;
  questionNumber: number;
  totalQuestions: number;
  onAnswer: (questionId: string, value: string) => void;
}) {
  return (
    <div className="fade-in" key={question.id}>
      <div style={{ textAlign: 'center', marginBottom: 8 }}>
        <span style={{ fontSize: 10, color: '#667' }}>
          질문 {questionNumber} / {totalQuestions}
        </span>
      </div>

      <BokgilMessage text={question.question} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
        {question.options.map((opt: any) => (
          <button
            key={opt.value}
            onClick={() => onAnswer(question.id, opt.value)}
            style={{
              ...cardStyle,
              cursor: 'pointer', textAlign: 'left',
              fontSize: 13, color: opt.value === 'neutral' ? '#889' : '#c8cdd3',
              transition: 'background 0.15s',
              fontStyle: opt.value === 'neutral' ? 'italic' : 'normal',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(92,61,30,0.35)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(92,61,30,0.2)'; }}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── 최종 해석 섹션 ──────────────────────────────────────────

function FinalResultSection({
  result, perspectiveResult, onRestart,
}: {
  result: any;
  perspectiveResult: any;
  onRestart: () => void;
}) {
  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* 관점 반영 해석 */}
      {perspectiveResult && (
        <div style={cardStyle}>
          <BokgilMessage text={perspectiveResult.opening} />

          {perspectiveResult.insights.map((insight: string, i: number) => (
            <div key={i} style={{
              fontSize: 13, color: '#c8cdd3', lineHeight: 1.7,
              padding: '8px 0',
              borderBottom: i < perspectiveResult.insights.length - 1 ? '1px solid rgba(240,223,173,0.06)' : 'none',
            }}>
              {insight}
            </div>
          ))}

          <div style={{
            marginTop: 12, fontSize: 13, color: '#f0dfad',
            fontFamily: '"Gaegu", cursive', lineHeight: 1.7,
          }}>
            {perspectiveResult.closing}
          </div>
        </div>
      )}

      {/* 강점/약점/조언 카드 */}
      {result.pairs.map((pair: any, idx: number) => (
        <div key={idx} style={cardStyle}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#f0dfad', marginBottom: 10 }}>
            {pair.personA} & {pair.personB} - 관계 해석
          </div>

          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 11, color: '#97c6aa', fontWeight: 600, marginBottom: 4 }}>강점</div>
            {pair.interpretation.strengths.map((s: string, i: number) => (
              <div key={i} style={{ fontSize: 12, color: '#c8cdd3', lineHeight: 1.6, paddingLeft: 8 }}>
                {s}
              </div>
            ))}
          </div>

          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 11, color: '#f2b6b6', fontWeight: 600, marginBottom: 4 }}>주의할 점</div>
            {pair.interpretation.weaknesses.map((w: string, i: number) => (
              <div key={i} style={{ fontSize: 12, color: '#c8cdd3', lineHeight: 1.6, paddingLeft: 8 }}>
                {w}
              </div>
            ))}
          </div>

          <div>
            <div style={{ fontSize: 11, color: '#618199', fontWeight: 600, marginBottom: 4 }}>조언</div>
            <div style={{ fontSize: 12, color: '#c8cdd3', lineHeight: 1.6, paddingLeft: 8 }}>
              {pair.interpretation.advice}
            </div>
          </div>
        </div>
      ))}

      {/* 3인 그룹 역학 (최종) */}
      {result.groupDynamics && (
        <GroupDynamicsCard dynamics={result.groupDynamics} />
      )}

      {/* 면책 문구 */}
      <div style={{
        padding: 12, background: 'rgba(97,129,153,0.1)',
        borderRadius: 8, fontSize: 11, color: '#889', lineHeight: 1.6,
      }}>
        이 점수가 관계의 전부가 아닙니다. 사주 궁합은 경향성을 보여줄 뿐,
        관계의 실제 모습은 서로의 노력과 이해에 달려 있습니다.
        "이 사람이 운명이다"라고 단정짓는 것은 조심하세요.
      </div>

      {/* 다시 하기 */}
      <button onClick={onRestart} style={btnSecondary}>
        다른 관계 살펴보기
      </button>

      {/* 메인으로 */}
      <button onClick={() => window.location.href = '/'} style={btnTertiary}>
        메인 메뉴로 돌아가기
      </button>
    </div>
  );
}
