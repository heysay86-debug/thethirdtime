'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import BgmPlayer from '@/app/alt2/components/base/BgmPlayer';
import DialogueBox from '@/app/alt2/components/base/DialogueBox';
import type { DialogueLine } from '@/app/alt2/components/base/DialogueBox';
import ChoicePanel from '@/app/alt2/components/dialogue/ChoicePanel';

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
  '"좋은 궁합"의 기준은\n사람마다 다르네.',
  '정서적 유대를 원하는 사람,\n편안함을 원하는 사람,\n성장을 원하는 사람...',
  '자네가 생각하는\n"좋은 관계"란 무엇인가?',
  '같은 상대라도\n시기에 따라 관계의 질이\n변한다네.',
  '궁합은 고정된 운명이 아니야.\n숫자에 얽매이지 말고,\n이해의 도구로 사용하게.',
  '"이 사람이 당신의 운명이다"라고\n단정하는 곳은 조심하게.',
  '여기서는 그런 단정을 하지 않네.\n데이터를 보여줄 뿐,\n해석과 판단은 자네 몫이야.',
];

const RELATION_CHOICES = [
  { label: '연인 / 부부', action: 'couple' },
  { label: '부모 / 자녀', action: 'parent_child' },
  { label: '친구 / 동료', action: 'friend' },
  { label: '사업 파트너', action: 'business' },
  { label: '상사 / 부하', action: 'boss_sub' },
];

const SELF_STORAGE_KEY = 'thethirdtime_saju_input';

function delay(ms: number) { return new Promise(r => setTimeout(r, ms)); }

// ─── 메인 컴포넌트 ─────────────────────────────────────────

export default function GunghamPage() {
  const [phase, setPhase] = useState<Phase>('preamble');
  const [preambleIndex, setPreambleIndex] = useState(0);
  const [typingDone, setTypingDone] = useState(false);
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
  const [castStep, setCastStep] = useState(0);
  const [castFade, setCastFade] = useState(false);
  const [fromSaju, setFromSaju] = useState(false);
  const [keyboardOffset, setKeyboardOffset] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);

  // 모바일 키보드 보정
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const handleResize = () => {
      const offset = window.innerHeight - vv.height;
      setKeyboardOffset(offset > 50 ? offset : 0);
    };
    vv.addEventListener('resize', handleResize);
    return () => vv.removeEventListener('resize', handleResize);
  }, []);

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
    if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('from') === 'saju') {
      setFromSaju(true);
    }
  }, []);

  // ── 대화 모드 판별 ──
  const DIALOGUE_PHASES: Phase[] = ['preamble', 'relation_select', 'input_self', 'input_other', 'input_third', 'analyzing', 'perspective_questions'];
  const isDialogueMode = DIALOGUE_PHASES.includes(phase);

  // ── 현재 대사 라인 ──
  const currentLine: DialogueLine = useMemo(() => {
    switch (phase) {
      case 'preamble':
        return { character: 'angel', name: '복길', text: PREAMBLE_MESSAGES[preambleIndex] };
      case 'relation_select':
        return { character: 'angel', name: '복길', text: '어떤 관계를 살펴볼 건가?' };
      case 'input_self':
        return { character: 'angel', name: '복길', text: '먼저 자네에 대해 알려주게.\n이름과 생년월일을 적어주게나.' };
      case 'input_other':
        return { character: 'angel', name: '복길', text: '상대의 정보를 알려주게.' };
      case 'input_third':
        return { character: 'angel', name: '복길', text: '세 번째 사람의 정보를\n알려주게.' };
      case 'analyzing':
        return { character: 'angel', name: '복길', text: '두 여행자의 운명이\n교차하는 지점을\n살펴보고 있네...' };
      case 'perspective_questions':
        return { character: 'angel', name: '복길', text: perspectiveQuestions[currentQIndex]?.question || '...' };
      default:
        return { character: 'angel', name: '복길', text: '' };
    }
  }, [phase, preambleIndex, perspectiveQuestions, currentQIndex]);

  const dialogueKey = `${phase}-${preambleIndex}-${currentQIndex}`;

  // ── 타이핑 완료 콜백 (안정 참조) ──
  const handleTypingComplete = useCallback(() => {
    setTypingDone(true);
  }, []);

  // ── 탭 핸들러 ──
  const handleTap = useCallback(() => {
    if (!typingDone) return; // DialogueBox가 스킵 처리

    if (phase === 'preamble') {
      if (preambleIndex < PREAMBLE_MESSAGES.length - 1) {
        setPreambleIndex(prev => prev + 1);
        setTypingDone(false);
      } else {
        setPhase('relation_select');
        setTypingDone(false);
      }
    }
    // 다른 phase는 패널 인터랙션으로 진행
  }, [typingDone, phase, preambleIndex]);

  // ── 관계 선택 ──
  const handleRelationSelect = useCallback((action: string) => {
    setRelationType(action as RelationType);
    setTypingDone(false);
    if (fromSaju && selfInfo.name && selfInfo.birthDate) {
      setPhase('input_other');
    } else {
      setPhase('input_self');
    }
  }, [fromSaju, selfInfo]);

  // ── 인물 입력 완료 ──
  const handlePersonNext = useCallback((who: 'self' | 'other' | 'third') => {
    setTypingDone(false);
    if (who === 'self') {
      setPhase('input_other');
    } else if (who === 'other') {
      if (has3rd) {
        setPhase('input_third');
      } else {
        startCastAndAnalyze();
      }
    } else {
      startCastAndAnalyze();
    }
  }, [has3rd]);

  const handlePersonBack = useCallback((who: 'self' | 'other' | 'third') => {
    setTypingDone(false);
    if (who === 'self') setPhase('relation_select');
    else if (who === 'other') setPhase('input_self');
    else setPhase('input_other');
  }, []);

  // ── cast 시퀀스 + 분석 실행 ──
  const startCastAndAnalyze = useCallback(async () => {
    setCastStep(0);
    setCastFade(true);
    setPhase('cast');
    await delay(1000);
    setCastFade(false);
    setCastStep(1);
    await delay(500);
    setCastStep(2);
    await delay(500);

    setPhase('analyzing');
    setTypingDone(false);
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
      setTypingDone(false);
    }
  }, [selfInfo, otherInfo, thirdInfo, has3rd, relationType]);

  // ── 관점 질문 로드 ──
  const startPerspectiveQuestions = useCallback(async () => {
    try {
      const { PERSPECTIVE_QUESTIONS } = await import('@/src/engine/gungham');
      const key = relationType || 'couple';
      const questions = PERSPECTIVE_QUESTIONS[key] || PERSPECTIVE_QUESTIONS['couple'];
      setPerspectiveQuestions(questions);
      setCurrentQIndex(0);
      setPerspectiveAnswers({});
      setPhase('perspective_questions');
      setTypingDone(false);
    } catch {
      setPhase('result_final');
    }
  }, [relationType]);

  // ── 관점 답변 처리 ──
  const handlePerspectiveAnswer = useCallback((questionId: string, value: string) => {
    const newAnswers = { ...perspectiveAnswers, [questionId]: value };
    setPerspectiveAnswers(newAnswers);

    if (currentQIndex < perspectiveQuestions.length - 1) {
      setCurrentQIndex(prev => prev + 1);
      setTypingDone(false);
    } else {
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

  // ── 다시 하기 ──
  const handleRestart = useCallback(() => {
    setPhase('preamble');
    setPreambleIndex(0);
    setTypingDone(false);
    setResult(null);
    setPerspectiveResult(null);
    setRelationType(null);
    setOtherInfo({ name: '', birthDate: '', birthTime: '', gender: 'F', calendar: 'solar' });
    setThirdInfo({ name: '', birthDate: '', birthTime: '', gender: 'M', calendar: 'solar' });
    setHas3rd(false);
  }, []);

  const isResultPhase = phase === 'result_data' || phase === 'perspective_questions' || phase === 'result_final';
  const bgImage = isResultPhase ? '/background/mirror_after.jpeg' : '/background/mirror.jpeg';

  // ── 패널에 표시될 여부: 타이핑 끝 + 해당 phase ──
  const showPanel = typingDone && !['preamble', 'analyzing'].includes(phase);

  // 대화 진행 표시기 (▼): 프리앰블에서만
  const showIndicator = typingDone && phase === 'preamble';

  // ── 렌더링 ──
  return (
    <div style={{
      minHeight: '100vh',
      background: '#1a1e24',
      color: '#dde1e5',
      fontFamily: '"Pretendard Variable", sans-serif',
      position: 'relative',
      maxWidth: 440,
      margin: '0 auto',
      overflow: 'hidden',
    }}>
      <link href="https://fonts.googleapis.com/css2?family=Gaegu&display=swap" rel="stylesheet" />
      <BgmPlayer show src="/bgm/memorialfield.mp3" autoPlayFromMenu />

      {/* ── 배경 맵 + 캐릭터 ── */}
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
          {/* 복길 캐릭터 */}
          {phase === 'cast' ? (
            <div style={{
              position: 'absolute', top: '22%', left: '50%',
              transform: 'translateX(-50%)',
            }}>
              {/* sparkle */}
              <div style={{ position: 'absolute', inset: '-30px', pointerEvents: 'none' }}>
                {[...Array(8)].map((_, i) => (
                  <div key={i} style={{
                    position: 'absolute', width: 4, height: 4,
                    backgroundColor: '#f0dfad', borderRadius: '50%',
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
                  height: '16.8vh', width: 'auto',
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
                position: 'absolute', top: '25%', left: '50%',
                transform: 'translateX(-50%)',
                height: '6vh', width: 'auto',
                imageRendering: 'pixelated',
                filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.5))',
                animation: 'float-gentle 2s ease-in-out infinite',
                opacity: 0.85,
              }}
            />
          )}
        </div>
      </div>

      {/* ── 화면전환 플래시 ── */}
      {phase === 'analyzing' && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 50,
          background: 'rgba(240, 223, 173, 0.5)',
          animation: 'gungham-flash 1.5s ease-in-out',
          pointerEvents: 'none',
        }} />
      )}

      {/* ── 분석 중 스피너 (대화창 위에 표시) ── */}
      {phase === 'analyzing' && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          pointerEvents: 'none',
        }}>
          <div style={{
            width: 32, height: 32,
            border: '3px solid rgba(240,223,173,0.3)',
            borderTop: '3px solid #f0dfad',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }} />
        </div>
      )}

      {/* ── 상단 로고 ── */}
      {isDialogueMode && phase !== 'cast' && (
        <div
          className="fixed top-0 left-0 right-0 flex justify-center"
          style={{
            zIndex: 55,
            paddingTop: 'max(12px, env(safe-area-inset-top))',
            pointerEvents: 'none',
          }}
        >
          <img src="/icon/logo.svg" alt="" style={{ width: 90, opacity: 0.5, filter: 'brightness(0.7)' }} />
        </div>
      )}

      {/* ── 대화 모드: 하단 고정 대화창 ── */}
      {isDialogueMode && phase !== 'cast' && (
        <div className="fixed inset-0 flex flex-col justify-end" style={{ zIndex: 10 }}>

          {/* 탭 영역 */}
          <div className="flex-1" onClick={handleTap} />

          {/* 대화창 + 패널 */}
          <div
            className="w-full max-w-[440px] mx-auto space-y-2"
            style={{
              paddingBottom: keyboardOffset > 0 ? keyboardOffset + 8 : 'max(16px, env(safe-area-inset-bottom))',
              paddingLeft: 38, paddingRight: 38,
              transition: 'padding-bottom 0.15s ease',
            }}
          >
            {/* 패널: 선택지 / 입력 폼 */}
            {showPanel && phase === 'relation_select' && (
              <ChoicePanel choices={RELATION_CHOICES} onSelect={handleRelationSelect} />
            )}

            {showPanel && phase === 'input_self' && (
              <PersonInputPanel
                info={selfInfo}
                onChange={setSelfInfo}
                onNext={() => handlePersonNext('self')}
                onBack={() => handlePersonBack('self')}
                error={null}
              />
            )}

            {showPanel && phase === 'input_other' && (
              <PersonInputPanel
                info={otherInfo}
                onChange={setOtherInfo}
                onNext={() => handlePersonNext('other')}
                onBack={() => handlePersonBack('other')}
                error={error}
                extra3rd={
                  !has3rd ? (
                    <button onClick={() => setHas3rd(true)} style={btnLink}>
                      + 한 명 더 추가 (3인 분석)
                    </button>
                  ) : (
                    <button onClick={() => setHas3rd(false)} style={{ ...btnLink, color: '#ef4444' }}>
                      3인 분석 취소
                    </button>
                  )
                }
              />
            )}

            {showPanel && phase === 'input_third' && (
              <PersonInputPanel
                info={thirdInfo}
                onChange={setThirdInfo}
                onNext={() => handlePersonNext('third')}
                onBack={() => handlePersonBack('third')}
                error={null}
              />
            )}

            {showPanel && phase === 'perspective_questions' && perspectiveQuestions[currentQIndex] && (
              <PerspectiveChoicePanel
                question={perspectiveQuestions[currentQIndex]}
                questionNumber={currentQIndex + 1}
                totalQuestions={perspectiveQuestions.length}
                onAnswer={handlePerspectiveAnswer}
              />
            )}

            {/* 대화 상자 */}
            <DialogueBox
              key={dialogueKey}
              line={currentLine}
              typing
              onTypingComplete={handleTypingComplete}
              onTap={handleTap}
              showIndicator={showIndicator}
            />
          </div>
        </div>
      )}

      {/* ── 콘텐츠 모드: 스크롤 결과 ── */}
      {(phase === 'result_data' || phase === 'result_final') && (
        <div
          ref={contentRef}
          style={{
            position: 'relative', zIndex: 1,
            maxWidth: 440, margin: '0 auto',
            padding: '24px 20px 80px',
            display: 'flex', flexDirection: 'column', gap: 16,
            minHeight: '100vh',
            overflowY: 'auto',
          }}
        >
          {/* 로고 + 헤더 */}
          <div style={{ textAlign: 'center', paddingTop: 8 }}>
            <img src="/icon/logo.svg" alt="" style={{ width: 90, opacity: 0.5, filter: 'brightness(0.7)', margin: '0 auto 8px' }} />
            <h1 style={{
              fontSize: 20, fontWeight: 700, color: '#f0dfad',
              fontFamily: '"Gaegu", cursive', margin: 0,
            }}>
              3장 - 인연의 거울
            </h1>
            <p style={{ fontSize: 11, color: '#889', marginTop: 4 }}>궁합 분석</p>
          </div>

          {phase === 'result_data' && result && (
            <ResultDataSection result={result} onContinue={startPerspectiveQuestions} />
          )}

          {phase === 'result_final' && result && (
            <FinalResultSection result={result} perspectiveResult={perspectiveResult} onRestart={handleRestart} />
          )}
        </div>
      )}

      {/* ── 스타일 ── */}
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
        @keyframes gungham-flash {
          0% { opacity: 0; }
          40% { opacity: 1; }
          100% { opacity: 0; }
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
        @keyframes indicator-bounce {
          0%, 100% { transform: translateY(0); opacity: 0.5; }
          50% { transform: translateY(4px); opacity: 1; }
        }
        button:active {
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.3) !important;
        }
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

const panelInput: React.CSSProperties = {
  width: '100%', padding: '10px 14px',
  borderRadius: 16,
  backgroundColor: 'rgba(104,128,151,0.12)',
  border: '1px solid rgba(104,128,151,0.30)',
  color: '#dde1e5', fontSize: 14, outline: 'none',
  boxSizing: 'border-box',
};

const panelBtn: React.CSSProperties = {
  borderRadius: 16, padding: '10px 16px',
  fontSize: 14, fontWeight: 600, cursor: 'pointer', border: 'none',
};

const btnLink: React.CSSProperties = {
  background: 'none', border: 'none', cursor: 'pointer',
  fontSize: 12, color: '#688097', padding: '8px 0',
  width: '100%', textAlign: 'center',
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

// ─── 생년월일 분리 입력 ──────────────────────────────────────

function BirthDateInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [y, m, d] = value ? value.split('-') : ['', '', ''];
  const [year, setYear] = useState(y);
  const [month, setMonth] = useState(m);
  const [day, setDay] = useState(d);
  const monthRef = useRef<HTMLInputElement>(null);
  const dayRef = useRef<HTMLInputElement>(null);

  const emit = (yy: string, mm: string, dd: string) => {
    if (yy.length === 4 && mm.length >= 1 && dd.length >= 1) {
      onChange(`${yy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`);
    } else {
      onChange('');
    }
  };

  const handleYear = (v: string) => {
    const digits = v.replace(/\D/g, '').slice(0, 4);
    setYear(digits);
    emit(digits, month, day);
    if (digits.length === 4) monthRef.current?.focus();
  };

  const handleMonth = (v: string) => {
    let digits = v.replace(/\D/g, '').slice(0, 2);
    if (digits.length === 1 && parseInt(digits) > 1) digits = '0' + digits;
    setMonth(digits);
    emit(year, digits, day);
    if (digits.length === 2) dayRef.current?.focus();
  };

  const handleDay = (v: string) => {
    const digits = v.replace(/\D/g, '').slice(0, 2);
    setDay(digits);
    emit(year, month, digits);
  };

  const fieldStyle: React.CSSProperties = {
    ...panelInput,
    textAlign: 'center',
    padding: '10px 4px',
    fontSize: 16,
    letterSpacing: 1,
  };

  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
      <input
        type="text" inputMode="numeric" placeholder="1990"
        value={year} onChange={e => handleYear(e.target.value)}
        style={{ ...fieldStyle, flex: 2 }}
        onFocus={e => (e.target.style.borderColor = '#f0dfad')}
        onBlur={e => (e.target.style.borderColor = 'rgba(104,128,151,0.30)')}
      />
      <span style={{ color: '#556', fontSize: 14 }}>.</span>
      <input
        ref={monthRef}
        type="text" inputMode="numeric" placeholder="01"
        value={month} onChange={e => handleMonth(e.target.value)}
        style={{ ...fieldStyle, flex: 1 }}
        onFocus={e => (e.target.style.borderColor = '#f0dfad')}
        onBlur={e => (e.target.style.borderColor = 'rgba(104,128,151,0.30)')}
      />
      <span style={{ color: '#556', fontSize: 14 }}>.</span>
      <input
        ref={dayRef}
        type="text" inputMode="numeric" placeholder="01"
        value={day} onChange={e => handleDay(e.target.value)}
        style={{ ...fieldStyle, flex: 1 }}
        onFocus={e => (e.target.style.borderColor = '#f0dfad')}
        onBlur={e => (e.target.style.borderColor = 'rgba(104,128,151,0.30)')}
      />
    </div>
  );
}

// ─── 인물 입력 패널 (대화창 위에 표시) ──────────────────────

function PersonInputPanel({
  info, onChange, onNext, onBack, error, extra3rd,
}: {
  info: PersonInfo;
  onChange: (info: PersonInfo) => void;
  onNext: () => void;
  onBack: () => void;
  error: string | null;
  extra3rd?: React.ReactNode;
}) {
  const isValid = info.name.trim() && info.birthDate;

  return (
    <div className="fade-in" style={{
      maxHeight: '55vh', overflowY: 'auto',
      display: 'flex', flexDirection: 'column', gap: 8,
      paddingBottom: 4,
    }}>
      {/* 이름 */}
      <input
        type="text"
        value={info.name}
        onChange={e => onChange({ ...info, name: e.target.value })}
        placeholder="이름 (닉네임)"
        maxLength={20}
        style={panelInput}
        onFocus={e => (e.target.style.borderColor = '#f0dfad')}
        onBlur={e => (e.target.style.borderColor = 'rgba(104,128,151,0.30)')}
      />

      {/* 양/음력 + 생년월일 */}
      <div style={{ display: 'flex', gap: 6 }}>
        {(['solar', 'lunar'] as const).map(cal => (
          <button
            key={cal}
            type="button"
            onClick={() => onChange({ ...info, calendar: cal })}
            style={{
              ...panelBtn, flex: '0 0 auto', padding: '8px 14px', fontSize: 13,
              backgroundColor: info.calendar === cal ? '#dde1e5' : 'rgba(104,128,151,0.15)',
              color: info.calendar === cal ? '#3e4857' : '#688097',
            }}
          >
            {cal === 'solar' ? '양력' : '음력'}
          </button>
        ))}
      </div>

      <BirthDateInput
        value={info.birthDate}
        onChange={val => onChange({ ...info, birthDate: val })}
      />

      {/* 태어난 시각 */}
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <input
          type="time"
          value={info.birthTime === 'unknown' ? '' : info.birthTime}
          onChange={e => onChange({ ...info, birthTime: e.target.value })}
          placeholder="태어난 시각"
          style={{ ...panelInput, flex: 1, colorScheme: 'dark' }}
          disabled={info.birthTime === 'unknown'}
        />
        <button
          type="button"
          onClick={() => onChange({ ...info, birthTime: info.birthTime === 'unknown' ? '' : 'unknown' })}
          style={{
            ...panelBtn, flex: '0 0 auto', padding: '8px 12px', fontSize: 12,
            backgroundColor: info.birthTime === 'unknown' ? '#dde1e5' : 'rgba(104,128,151,0.15)',
            color: info.birthTime === 'unknown' ? '#3e4857' : '#688097',
          }}
        >
          모르겠어요
        </button>
      </div>

      {/* 성별 */}
      <div style={{ display: 'flex', gap: 6 }}>
        {(['M', 'F'] as const).map(g => (
          <button
            key={g}
            type="button"
            onClick={() => onChange({ ...info, gender: g })}
            style={{
              ...panelBtn, flex: 1,
              backgroundColor: info.gender === g ? '#dde1e5' : 'rgba(104,128,151,0.15)',
              color: info.gender === g ? '#3e4857' : '#688097',
            }}
          >
            {g === 'M' ? '남성' : '여성'}
          </button>
        ))}
      </div>

      {/* 에러 */}
      {error && (
        <div style={{ padding: 8, background: 'rgba(239,68,68,0.15)', borderRadius: 8, fontSize: 12, color: '#ef4444' }}>
          {error}
        </div>
      )}

      {/* 버튼 */}
      <div style={{ display: 'flex', gap: 6 }}>
        <button onClick={onBack} style={{ ...panelBtn, flex: '0 0 auto', backgroundColor: 'rgba(104,128,151,0.25)', color: '#dde1e5' }}>
          이전
        </button>
        <button
          onClick={onNext}
          disabled={!isValid}
          style={{
            ...panelBtn, flex: 1,
            backgroundColor: '#dde1e5', color: '#3e4857',
            opacity: isValid ? 1 : 0.5,
            cursor: isValid ? 'pointer' : 'default',
          }}
        >
          다음
        </button>
      </div>

      {extra3rd}
    </div>
  );
}

// ─── 관점 질문 선택 패널 ────────────────────────────────────

function PerspectiveChoicePanel({
  question, questionNumber, totalQuestions, onAnswer,
}: {
  question: any;
  questionNumber: number;
  totalQuestions: number;
  onAnswer: (questionId: string, value: string) => void;
}) {
  const choices = question.options.map((opt: any) => ({
    label: opt.label,
    action: opt.value,
    style: opt.value === 'neutral' ? 'secondary' as const : 'primary' as const,
  }));

  return (
    <div className="fade-in">
      <div style={{ textAlign: 'center', marginBottom: 6 }}>
        <span style={{ fontSize: 10, color: '#667' }}>
          질문 {questionNumber} / {totalQuestions}
        </span>
      </div>
      <ChoicePanel
        choices={choices}
        onSelect={(action) => onAnswer(question.id, action)}
      />
    </div>
  );
}

// ─── 결과 데이터 섹션 (스크롤 콘텐츠) ──────────────────────

function BokgilDialogue({ text }: { text: string }) {
  const line: DialogueLine = { character: 'angel', name: '복길', text };
  return <DialogueBox line={line} typing={false} showIndicator={false} portraitSize="lg" />;
}

function ResultDataSection({ result, onContinue }: { result: any; onContinue: () => void }) {
  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <BokgilDialogue text="두 사람의 사주를 나란히 놓고\n살펴보았네." />

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

      <BokgilDialogue text="데이터를 살펴보았으니,\n이제 자네의 관점에서\n해석해보겠네.\n\n몇 가지 질문에 답해주게." />

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

      <div style={infoRowStyle}>
        <div style={{ fontSize: 11, color: '#889', minWidth: 60 }}>용신 교환</div>
        <div style={{ fontSize: 12, color: '#c8cdd3' }}>
          {pair.yongSinExchange.description}
        </div>
      </div>

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
      {perspectiveResult && (
        <>
          <BokgilDialogue text={perspectiveResult.opening} />

          <div style={cardStyle}>
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
        </>
      )}

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

      {result.groupDynamics && (
        <GroupDynamicsCard dynamics={result.groupDynamics} />
      )}

      <div style={{
        padding: 12, background: 'rgba(97,129,153,0.1)',
        borderRadius: 8, fontSize: 11, color: '#889', lineHeight: 1.6,
      }}>
        이 점수가 관계의 전부가 아닙니다. 사주 궁합은 경향성을 보여줄 뿐,
        관계의 실제 모습은 서로의 노력과 이해에 달려 있습니다.
        &quot;이 사람이 운명이다&quot;라고 단정짓는 것은 조심하세요.
      </div>

      <button onClick={onRestart} style={btnSecondary}>
        다른 관계 살펴보기
      </button>

      <button onClick={() => window.location.href = '/'} style={btnTertiary}>
        메인 메뉴로 돌아가기
      </button>
    </div>
  );
}
