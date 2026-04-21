'use client';

import { useState, useEffect, useCallback } from 'react';
import StarField from './components/base/StarField';
import ZoneTransition from './components/base/ZoneTransition';
import SectionDivider from './components/base/SectionDivider';
import DotCharacter from './components/base/DotCharacter';
import PillarFrame from './components/base/PillarFrame';
import BgmPlayer from './components/base/BgmPlayer';
import PdfLoadingOverlay from './components/PdfLoadingOverlay';
import DialoguePlayer from './components/dialogue/DialoguePlayer';
import InputModal from './components/input/InputModal';
import PillarTable from './components/result/PillarTable';
import ParchmentCard from './components/base/ParchmentCard';
import DaeunTimeline from './components/result/DaeunTimeline';
import SeunCard from './components/result/SeunCard';
import OhengRelation from './components/result/OhengRelation';
import OhengRadar from './components/result/OhengRadar';
import InlineDialogue from './components/result/InlineDialogue';
import GunghamUpsell from './components/gungham/GunghamUpsell';
import UpsellDialogue from './components/upsell/UpsellDialogue';
import CtaButton from './components/upsell/CtaButton';
import type { DialogueLine } from './components/base/DialogueBox';
import { getCurrentPrices } from './utils/pricing';

type Phase = 'opening' | 'dialogue' | 'transition' | 'result';
type TransitionPhase = 'idle' | 'zoom-out' | 'loading' | 'zoom-in' | 'done';

function delay(ms: number) { return new Promise(r => setTimeout(r, ms)); }

const GAN_OHENG: Record<string, string> = {
  '甲': '목', '乙': '목', '丙': '화', '丁': '화', '戊': '토',
  '己': '토', '庚': '금', '辛': '금', '壬': '수', '癸': '수',
};
const JI_OHENG: Record<string, string> = {
  '子': '수', '丑': '토', '寅': '목', '卯': '목', '辰': '토',
  '巳': '화', '午': '화', '未': '토', '申': '금', '酉': '금',
  '戌': '토', '亥': '수',
};

function calcOhengDistribution(pillars: any): Record<string, number> {
  const dist: Record<string, number> = { 목: 0, 화: 0, 토: 0, 금: 0, 수: 0 };
  const positions = ['year', 'month', 'day', 'hour'];
  for (const pos of positions) {
    const p = pillars[pos];
    if (!p) continue;
    const ganOh = GAN_OHENG[p.gan];
    const jiOh = JI_OHENG[p.ji];
    if (ganOh) dist[ganOh]++;
    if (jiOh) dist[jiOh]++;
  }
  return dist;
}

const DEFAULT_PRICES = { deep: '₩13,900', g2: '₩18,900', g3: '₩23,900' };

export default function Alt2Page() {
  const prices = getCurrentPrices();
  // URL 파라미터에서 유입채널 코드 추출 (?ch=A002)
  const [channel, setChannel] = useState('A001');
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ch = params.get('ch');
    if (ch) setChannel(ch);
  }, []);
  const [phase, setPhase] = useState<Phase>('opening');
  const [pillarsOpen, setPillarsOpen] = useState(false);
  const [logoVisible, setLogoVisible] = useState(false);
  const [logoFading, setLogoFading] = useState(false);
  const [transitionPhase, setTransitionPhase] = useState<TransitionPhase>('idle');
  const [modalOpen, setModalOpen] = useState(false);
  const [engine, setEngine] = useState<any>(null);
  const [core, setCore] = useState<any>(null);
  const [reportNo, setReportNo] = useState<string | null>(null);
  const [pdfProgress, setPdfProgress] = useState<'idle' | 'generating' | 'done' | 'error'>('idle');
  const [introScript, setIntroScript] = useState<DialogueLine[]>([]);
  const [introInputFlow, setIntroInputFlow] = useState<DialogueLine[]>([]);
  const [redoScript, setRedoScript] = useState<DialogueLine[]>([]);
  const [redoAfterInput, setRedoAfterInput] = useState<DialogueLine[]>([]);
  const [isRedo, setIsRedo] = useState(false);
  const [redoKey, setRedoKey] = useState(0);
  const [redoAfterInputActive, setRedoAfterInputActive] = useState(false);
  const [upsellScript, setUpsellScript] = useState<DialogueLine[]>([]);
  const [resultComments, setResultComments] = useState<any>(null);
  const [phase2Sections, setPhase2Sections] = useState<any>(null);
  const [phase2Loading, setPhase2Loading] = useState(false);
  const [bgOpacity, setBgOpacity] = useState(0);
  type ZoneBg = 'before' | 'after' | 'blackout' | 'inside_sun' | 'inside_moon' | 'past';
  const [zonaBg, setZonaBg] = useState<ZoneBg>('before');
  const [screenEffect, setScreenEffect] = useState<'shake' | 'flash' | 'cast' | null>(null);
  const [dotState, setDotState] = useState({
    direction: 'front' as 'front' | 'back' | 'left' | 'right',
    x: 50,
    y: 62,
    visible: true,
  });

  // Opening sequence
  useEffect(() => {
    if (phase !== 'opening') return;
    const t1 = setTimeout(() => setLogoVisible(true), 300);
    const t2 = setTimeout(() => setLogoFading(true), 2850);
    const t3 = setTimeout(() => setPillarsOpen(true), 3350);
    const t4 = setTimeout(() => {
      setLogoVisible(false);
      setPhase('dialogue');
    }, 5050);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, [phase]);

  // Load scripts
  useEffect(() => {
    fetch('/content/dialogue-intro.json')
      .then(r => r.json())
      .then(d => {
        setIntroScript(d.lines);
        setIntroInputFlow(d.inputFlow || []);
      })
      .catch(() => {});
    fetch('/content/dialogue-redo.json')
      .then(r => r.json())
      .then(d => {
        setRedoScript(d.lines);
        setRedoAfterInput(d.afterInput || []);
      })
      .catch(() => {});
    fetch('/content/dialogue-upsell.json')
      .then(r => r.json())
      .then(d => setUpsellScript(d.lines))
      .catch(() => {});
    fetch('/content/dialogue-result-comments.json')
      .then(r => r.json())
      .then(d => setResultComments(d.sections))
      .catch(() => {});
  }, []);

  // Scroll-based background opacity for ZONE C
  useEffect(() => {
    const handleScroll = () => {
      const el = document.getElementById('upsell-section');
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const windowH = window.innerHeight;
      if (rect.top < windowH && rect.bottom > 0) {
        const progress = 1 - (rect.top / windowH);
        setBgOpacity(Math.min(Math.max(progress, 0), 0.6));
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleAction = useCallback((action: string) => {
    if (action === 'open_input_modal') setModalOpen(true);
  }, []);

  const [redoInput, setRedoInput] = useState<any>(null);

  const handleSubmit = useCallback(async (input: any) => {
    setModalOpen(false);

    // redo 모드: 모달 닫고 afterInput 대화 표시
    if (isRedo) {
      setRedoInput(input);
      setRedoAfterInputActive(true);
      return;
    }

    // Phase 1: zoom out
    setPhase('transition');
    setTransitionPhase('zoom-out');
    await delay(400);

    // Phase 2: loading + API call
    setTransitionPhase('loading');
    const body: any = {
      birthDate: input.birthDate,
      calendar: input.calendar,
    };
    if (input.birthTime) body.birthTime = input.birthTime;
    if (input.calendar === 'lunar') body.isLeapMonth = input.isLeapMonth;
    if (input.birthCity) body.birthCity = input.birthCity;
    if (input.gender) body.gender = input.gender;
    if (input.name) body.name = input.name;
    body.channel = channel;

    try {
      const apiPromise = fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/saju/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }).then(r => {
        if (r.status === 503) throw new Error('busy');
        if (!r.ok) throw new Error('API error');
        return r.json();
      });

      const [data] = await Promise.all([apiPromise, delay(500)]);
      setEngine(data.engine);
      setCore(data.core);
      setReportNo(data.reportNo || null);

      // Phase 3: zoom in
      setTransitionPhase('zoom-in');
      await delay(400);

      setPhase('result');
      setTransitionPhase('idle');
      window.scrollTo({ top: 0 });
    } catch (e: any) {
      alert(e?.message === 'busy'
        ? '지금 다른 여행자의 운명을 읽고 있습니다. 잠시 후 다시 시도해주세요.'
        : '분석 중 오류가 발생했습니다. 다시 시도해주세요.');
      setPhase('dialogue');
      setTransitionPhase('idle');
      setZonaBg('before');
      setScreenEffect(null);
      setDotState({ direction: 'front', x: 50, y: 62, visible: true });
    }
  }, [isRedo]);

  const handleInputSubmit = useCallback(async (input: any) => {
    // redo 모드에서는 DialoguePlayer가 빈 input을 줄 수 있으므로 redoInput 사용
    const src = (isRedo && redoInput) ? redoInput : input;

    setPhase('transition');
    setTransitionPhase('zoom-out');
    await delay(400);

    setTransitionPhase('loading');
    const body: any = {
      birthDate: src.birthDate,
      calendar: src.calendar,
    };
    if (src.birthTime) body.birthTime = src.birthTime;
    if (src.calendar === 'lunar') body.isLeapMonth = src.isLeapMonth;
    if (src.birthCity) body.birthCity = src.birthCity;
    if (src.gender) body.gender = src.gender;
    if (src.name) body.name = src.name;
    body.channel = channel;

    try {
      const apiPromise = fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/saju/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }).then(r => {
        if (r.status === 503) throw new Error('busy');
        if (!r.ok) throw new Error('API error');
        return r.json();
      });

      const [data] = await Promise.all([apiPromise, delay(500)]);
      setEngine(data.engine);
      setCore(data.core);
      setReportNo(data.reportNo || null);

      setTransitionPhase('zoom-in');
      await delay(400);

      setPhase('result');
      setTransitionPhase('idle');
      window.scrollTo({ top: 0 });
    } catch (e: any) {
      alert(e?.message === 'busy'
        ? '지금 다른 여행자의 운명을 읽고 있습니다. 잠시 후 다시 시도해주세요.'
        : '분석 중 오류가 발생했습니다. 다시 시도해주세요.');
      setPhase('dialogue');
      setTransitionPhase('idle');
      setZonaBg('before');
      setScreenEffect(null);
      setDotState({ direction: 'front', x: 50, y: 62, visible: true });
    }
  }, [isRedo, redoInput]);

  const handleReset = useCallback(() => {
    setEngine(null);
    setCore(null);
    setReportNo(null);
    setPhase2Sections(null);
    setPhase2Loading(false);
    setIsRedo(true);
    setRedoKey(prev => prev + 1);
    setRedoAfterInputActive(false);
    setPhase('dialogue');
    setBgOpacity(0);
    setZonaBg('before');
    setDotState({ direction: 'front', x: 50, y: 62, visible: true });
    setScreenEffect(null);
    window.scrollTo({ top: 0 });
  }, []);

  // Extract data for result components
  const ohengDistribution = engine?.pillars
    ? calcOhengDistribution(engine.pillars)
    : { 목: 0, 화: 0, 토: 0, 금: 0, 수: 0 };
  const daeun = engine?.daeun;
  const daeunPeriods = daeun?.periods || [];
  const daeunStartAge = daeun?.startAge || 0;
  const currentAge = daeun?.currentAge || 0;
  const sinsalList = engine?.sinsal || [];
  const relationsArr = engine?.relations?.summary || [];

  // Seun data — engine.seun (최상위, engine.daeun.seun 아님)
  const seunList = engine?.seun || [];
  const currentYear = new Date().getFullYear();
  const seunCurrent = seunList.find?.((s: any) => s.year === currentYear);
  const seunNext = seunList.find?.((s: any) => s.year === currentYear + 1);

  return (
    <div className="relative min-h-screen" style={{ background: '#1a1e24' }}>
      {/* PDF 생성 오버레이 */}
      <PdfLoadingOverlay visible={pdfProgress !== 'idle'} progress={pdfProgress as any} />
      {/* Pillar Frame — always visible */}
      <PillarFrame isOpen={pillarsOpen} />
      <BgmPlayer show={phase !== 'opening'} />

      {/* Opening: logo */}
      {phase === 'opening' && (
        <div
          className="fixed inset-0 flex flex-col items-center justify-center gap-4"
          style={{ zIndex: 60 }}
        >
          <img
            src="/icon/logo.svg"
            alt="제3의시간"
            style={{
              width: '60%',
              maxWidth: 280,
              opacity: logoVisible ? (logoFading ? 0 : 1) : 0,
              transition: 'opacity 0.8s ease',
            }}
          />
          <p
            style={{
              color: '#688097',
              fontSize: 13,
              letterSpacing: 2,
              opacity: logoVisible ? (logoFading ? 0 : 1) : 0,
              transition: 'opacity 0.8s ease',
            }}
          >
            본격 RPG형 사주풀이
          </p>
        </div>
      )}

      {/* Screen effects CSS */}
      <style jsx global>{`
        @keyframes screen-shake {
          0%, 100% { transform: translate(0, 0); }
          10% { transform: translate(-3px, 2px); }
          20% { transform: translate(4px, -2px); }
          30% { transform: translate(-2px, 3px); }
          40% { transform: translate(3px, -3px); }
          50% { transform: translate(-4px, 1px); }
          60% { transform: translate(2px, -2px); }
          70% { transform: translate(-3px, 3px); }
          80% { transform: translate(4px, -1px); }
          90% { transform: translate(-2px, 2px); }
        }
      `}</style>

      {/* Cast overlay — 캐릭터 회전 + 방사형 밝기 */}
      {screenEffect === 'cast' && (
        <div
          className="fixed inset-0 flex items-center justify-center"
          style={{
            zIndex: 46,
            background: 'radial-gradient(circle, rgba(240,223,173,0.3) 0%, rgba(26,30,36,0) 70%)',
            pointerEvents: 'none',
          }}
        >
          <img
            src={`/character/${dotState.direction}.png`}
            alt=""
            style={{
              height: '30vh',
              width: 'auto',
              imageRendering: 'pixelated',
              filter: 'drop-shadow(0 0 40px rgba(240,223,173,0.6))',
              opacity: 1,
              animation: dotState.direction === 'back' ? 'cast-dissolve-in 0.3s ease-out' : 'none',
            }}
          />
        </div>
      )}
      <style jsx global>{`
        @keyframes cast-dissolve-in {
          from { opacity: 0; transform: scale(0.8); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>

      {/* Flash overlay */}
      <div
        className="fixed inset-0"
        style={{
          zIndex: 45,
          backgroundColor: '#fff',
          opacity: screenEffect === 'flash' ? 0.9 : 0,
          transition: screenEffect === 'flash' ? 'opacity 0.15s ease-in' : 'opacity 0.4s ease-out',
          pointerEvents: 'none',
        }}
      />

      {/* Fixed background layers */}
      <div className="fixed inset-0 flex justify-center" style={{ zIndex: 0 }}>
        <div
          className="relative w-full h-full"
          style={{
            maxWidth: 440,
            animation: screenEffect === 'shake' ? 'screen-shake 0.1s linear infinite' : 'none',
          }}
        >
          <StarField />

          {/* ZONE A: RPG 맵 배경 (4단계) */}
          {phase === 'dialogue' && (
            <>
              {(['before', 'after', 'inside_sun', 'inside_moon', 'past'] as const).map(bg => (
                <img
                  key={bg}
                  src={`/background/${bg}.${bg === 'before' ? 'jpg' : 'jpeg'}`}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover"
                  style={{
                    opacity: zonaBg === bg ? 1 : 0,
                    transition: 'opacity 0.7s ease',
                    objectPosition: 'bottom center',
                  }}
                />
              ))}

              {/* 암전 레이어 */}
              <div
                className="absolute inset-0"
                style={{
                  backgroundColor: '#1a1e24',
                  opacity: zonaBg === 'blackout' ? 1 : 0,
                  transition: 'opacity 0.5s ease',
                }}
              />

              {/* 하단 그라데이션 오버레이 */}
              <div
                className="absolute inset-0"
                style={{
                  background: 'linear-gradient(to top, rgba(62,72,87,0.85) 0%, rgba(62,72,87,0.3) 40%, rgba(62,72,87,0.15) 100%)',
                  zIndex: 1,
                }}
              />

              {/* 도트 캐릭터 (배경 컨테이너 내부) */}
              <DotCharacter
                direction={dotState.direction}
                size={10}
                x={dotState.x}
                y={dotState.y}
                bounce
                visible={dotState.visible}
              />
            </>
          )}

          {/* Silverlining background for ZONE C */}
          <img
            src="/background/silverlining.jpg"
            alt=""
            className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000"
            style={{ opacity: bgOpacity }}
            loading="lazy"
          />
        </div>
      </div>

      {/* 상단 로고 — dialogue/transition에서만 표시 */}
      {(phase === 'dialogue' || phase === 'transition') && (
        <div
          className="fixed top-0 left-0 right-0 flex justify-center"
          style={{
            zIndex: 55,
            paddingTop: 'max(12px, env(safe-area-inset-top))',
            pointerEvents: 'none',
          }}
        >
          <img
            src="/icon/logo.svg"
            alt=""
            style={{
              width: 90,
              opacity: phase === 'transition' ? 0.3 : 0.5,
              filter: phase === 'transition' ? 'none' : 'brightness(0.7)',
            }}
          />
        </div>
      )}

      {/* ZONE A: 대화창 뒤 하단 로고 워터마크 */}
      {phase === 'dialogue' && (
        <div
          className="fixed bottom-0 left-0 right-0 flex justify-center"
          style={{
            zIndex: 5,
            paddingBottom: 'max(32px, env(safe-area-inset-bottom))',
            pointerEvents: 'none',
          }}
        >
          <img
            src="/icon/logo.svg"
            alt=""
            style={{ width: 100, opacity: 0.15 }}
          />
        </div>
      )}

      {/* ZONE A: RPG Dialogue */}
      {phase === 'dialogue' && (isRedo ? redoScript.length > 0 : introScript.length > 0) && (
        <div className="relative" style={{ zIndex: 10, minHeight: '100vh' }}>
          <DialoguePlayer
            key={isRedo ? `redo-${redoKey}` : 'intro'}
            script={isRedo ? (redoAfterInputActive ? redoAfterInput : redoScript) : introScript}
            inputFlow={isRedo ? undefined : introInputFlow}
            onComplete={() => {}}
            onAction={handleAction}
            onInputSubmit={handleInputSubmit}
            onBgChange={(bg) => setZonaBg(bg)}
            onDotMove={(state) => setDotState(prev => ({ ...prev, ...state }))}
            onScreenEffect={setScreenEffect}
          />
        </div>
      )}

      {/* Zone Transition */}
      {phase === 'transition' && (
        <ZoneTransition
          phase={transitionPhase}
          loadingPortrait="magician"
          loadingText="시간의 문을 열고 있어요..."
        />
      )}

      {/* ZONE B + C: Results */}
      {phase === 'result' && engine && core && (
        <div className="relative" style={{ zIndex: 10 }}>
          <div style={{ background: '#2d3440', minHeight: '100vh' }}>
            <div className="max-w-[440px] mx-auto pt-8 pb-16 space-y-8" style={{ paddingLeft: 38, paddingRight: 38 }}>
              {/* 상단 로고 */}
              <div className="flex justify-center pt-2 pb-4">
                <img
                  src="/icon/logo.svg"
                  alt="제3의시간"
                  style={{ width: 100, opacity: 0.4 }}
                />
              </div>

              {/* Reset button */}
              <button
                onClick={handleReset}
                className="text-sm font-medium"
                style={{ color: '#688097' }}
              >
                ← 다시하기
              </button>

              {/* ① PillarTable (신살 통합) */}
              <PillarTable
                pillars={engine.pillars}
                tenGods={engine.tenGods}
                jijanggan={engine.jijanggan}
                relations={relationsArr}
                sinsalList={sinsalList}
                twelveStages={engine?.twelveStages}
              />

              {/* 복길 코멘트 + core.summary */}
              <InlineDialogue
                lines={[
                  ...(resultComments?.after_pillar_table || []),
                  ...(core?.summary ? [{
                    character: 'speak',
                    name: '복길',
                    text: core.summary,
                    style: 'normal' as const,
                  }] : []),
                ]}
                autoPlay
              />

              {/* 양피지 해설: 사주 원국 */}
              {resultComments?.parchment_pillar && (
                <ParchmentCard title="사주 원국 해설">
                  {resultComments.parchment_pillar}
                </ParchmentCard>
              )}

              {/* ② DaeunTimeline */}
              {daeunPeriods.length > 0 && (
                <DaeunTimeline periods={daeunPeriods} currentAge={currentAge} startAge={daeunStartAge} />
              )}

              {/* 양피지 해설: 대운 */}
              {resultComments?.parchment_daeun && (
                <ParchmentCard title="대운 해설">
                  {resultComments.parchment_daeun}
                </ParchmentCard>
              )}

              {/* ③ SeunCard */}
              <SeunCard currentYear={seunCurrent} nextYear={seunNext} />

              {/* 복길 코멘트: 세운 */}
              {resultComments?.after_seun && (
                <InlineDialogue lines={resultComments.after_seun} autoPlay />
              )}

              {/* 양피지 해설: 세운 */}
              {resultComments?.parchment_seun && (
                <ParchmentCard title="세운 해설">
                  {resultComments.parchment_seun}
                </ParchmentCard>
              )}

              <SectionDivider icon="star" />

              {/* ④ OhengRelation + OhengRadar */}
              <OhengRelation />
              <OhengRadar distribution={ohengDistribution} />

              {/* 복길 코멘트 + core.strengthReading */}
              <InlineDialogue
                lines={[
                  ...(resultComments?.after_oheng || []),
                  ...(core?.strengthReading ? [{
                    character: 'flash',
                    name: '복길',
                    text: core.strengthReading,
                    style: 'emphasis' as const,
                  }] : []),
                ]}
                autoPlay
              />

              {/* 양피지 해설: 오행 */}
              {resultComments?.parchment_oheng && (
                <ParchmentCard title="오행과 신강신약 해설">
                  {resultComments.parchment_oheng}
                </ParchmentCard>
              )}

              <SectionDivider icon="stamp" />

              {/* 궁합 업셀 */}
              <GunghamUpsell onPurchase={(count) => {
                alert(`${count}인 궁합 결제 기능은 준비 중입니다`);
              }} />

              <SectionDivider />
            </div>
          </div>

          {/* ZONE C: 심층 해석 업셀 — 투명 배경 (silverlining 비침) */}
          <div className="max-w-[440px] mx-auto space-y-8" style={{ paddingLeft: 38, paddingRight: 38 }}>
            <div id="upsell-section" className="space-y-6 pt-4">
                <UpsellDialogue
                  script={upsellScript}
                  previewData={core}
                />
                <CtaButton
                  label="구름 너머의 이야기를 만나보세요"
                  price={prices.deep}
                  originalPrice={prices.promotion ? DEFAULT_PRICES.deep : undefined}
                  promotion={prices.promotion}
                  onClick={async () => {
                    if (phase2Sections) return;
                    if (phase2Loading) { alert('리포트를 준비하고 있습니다. 잠시만 기다려주세요.'); return; }
                    setPhase2Loading(true);
                    try {
                      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/saju/interpret`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ engine, core }),
                      });
                      if (!res.ok || !res.body) throw new Error('API error');
                      const reader = res.body.getReader();
                      const decoder = new TextDecoder();
                      let buffer = '';
                      let eventType = '';
                      while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;
                        buffer += decoder.decode(value, { stream: true });
                        const lines = buffer.split('\n');
                        buffer = lines.pop() ?? '';
                        for (const line of lines) {
                          if (line.startsWith('event: ')) eventType = line.slice(7).trim();
                          else if (line.startsWith('data: ') && eventType) {
                            const data = JSON.parse(line.slice(6));
                            if (eventType === 'done' && data.sections) {
                              setPhase2Sections(data.sections);
                            }
                            eventType = '';
                          }
                        }
                      }
                    } catch { alert('해석 생성 중 오류가 발생했습니다.'); }
                    setPhase2Loading(false);
                  }}
                />
              </div>

              {/* Phase 2 로딩 중 */}
              {phase2Loading && !phase2Sections && (
                <div className="text-center py-8">
                  <div className="w-8 h-8 rounded-full animate-spin mx-auto mb-3"
                    style={{ border: '2px solid rgba(221,225,229,0.2)', borderTopColor: '#dde1e5' }} />
                  <p className="text-sm" style={{ color: '#688097' }}>심층 해석을 생성하고 있습니다...</p>
                </div>
              )}

              {/* Phase 2 전체 해석 결과 */}
              {phase2Sections && (
                <div className="space-y-6 pt-4">
                  <InlineDialogue lines={[{
                    character: 'excite', name: '복길',
                    text: '구름 너머의 이야기가\n펼쳐지고 있네!',
                    style: 'emphasis' as const,
                  }]} autoPlay />

                  {phase2Sections.basics?.description && (
                    <ParchmentCard title="사주팔자 개요">
                      {phase2Sections.basics.description}
                    </ParchmentCard>
                  )}

                  {phase2Sections.pillarAnalysis && (
                    <>
                      {phase2Sections.pillarAnalysis.year && (
                        <ParchmentCard title="연주 분석">{phase2Sections.pillarAnalysis.year}</ParchmentCard>
                      )}
                      {phase2Sections.pillarAnalysis.month && (
                        <ParchmentCard title="월주 분석">{phase2Sections.pillarAnalysis.month}</ParchmentCard>
                      )}
                      {phase2Sections.pillarAnalysis.day && (
                        <ParchmentCard title="일주 분석">{phase2Sections.pillarAnalysis.day}</ParchmentCard>
                      )}
                      {phase2Sections.pillarAnalysis.hour && (
                        <ParchmentCard title="시주 분석">{phase2Sections.pillarAnalysis.hour}</ParchmentCard>
                      )}
                    </>
                  )}

                  {phase2Sections.ohengAnalysis?.distribution && (
                    <ParchmentCard title="오행 분포 분석">{phase2Sections.ohengAnalysis.distribution}</ParchmentCard>
                  )}
                  {phase2Sections.ohengAnalysis?.johu && (
                    <ParchmentCard title="조후 분석">{phase2Sections.ohengAnalysis.johu}</ParchmentCard>
                  )}

                  {phase2Sections.sipseongAnalysis?.reading && (
                    <ParchmentCard title="십성 분석">{phase2Sections.sipseongAnalysis.reading}</ParchmentCard>
                  )}

                  {phase2Sections.relations?.reading && (
                    <ParchmentCard title="형충파해합 · 신살">{phase2Sections.relations.reading}</ParchmentCard>
                  )}

                  {phase2Sections.daeunReading && (
                    <>
                      {phase2Sections.daeunReading.overview && (
                        <ParchmentCard title="대운 흐름">{phase2Sections.daeunReading.overview}</ParchmentCard>
                      )}
                      {phase2Sections.daeunReading.currentPeriod && (
                        <ParchmentCard title="현재 대운 · 세운">{phase2Sections.daeunReading.currentPeriod}</ParchmentCard>
                      )}
                      {phase2Sections.daeunReading.upcoming && (
                        <ParchmentCard title="향후 전망">{phase2Sections.daeunReading.upcoming}</ParchmentCard>
                      )}
                    </>
                  )}

                  {phase2Sections.overallReading?.primary && (
                    <ParchmentCard title="종합 분석">{phase2Sections.overallReading.primary}</ParchmentCard>
                  )}
                  {phase2Sections.overallReading?.modernApplication && (
                    <ParchmentCard title="현대적 적용">{phase2Sections.overallReading.modernApplication}</ParchmentCard>
                  )}

                  {/* PDF 다운로드 버튼 */}
                  <div className="text-center pt-4">
                    <button
                      className="px-8 py-3 text-sm font-semibold"
                      style={{
                        backgroundColor: '#f0dfad',
                        color: '#1a1e24',
                        borderRadius: 20,
                      }}
                      onClick={async () => {
                        if (pdfProgress === 'generating') return;
                        setPdfProgress('generating');
                        try {
                          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/saju/pdf`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              engine,
                              core,
                              sections: phase2Sections,
                              userName: '분석 대상자',
                              reportNo,
                            }),
                          });
                          if (!res.ok) throw new Error('PDF 생성 실패');
                          const blob = await res.blob();
                          setPdfProgress('done');
                          await new Promise(r => setTimeout(r, 1200));
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = reportNo ? `${reportNo}.pdf` : 'saju-report.pdf';
                          a.click();
                          URL.revokeObjectURL(url);
                        } catch {
                          setPdfProgress('error');
                          await new Promise(r => setTimeout(r, 2000));
                        } finally {
                          setPdfProgress('idle');
                        }
                      }}
                    >
                      PDF 리포트 다운로드
                    </button>
                  </div>
                </div>
              )}

              {/* Free section end comment */}
              {!phase2Sections && resultComments?.free_section_end && (
                <InlineDialogue lines={resultComments.free_section_end} autoPlay />
              )}

              {/* Footer */}
              <footer className="text-center pt-8 pb-16">
                <img
                  src="/icon/logo.svg"
                  alt="제3의시간"
                  style={{
                    width: 120,
                    opacity: 0.3,
                    margin: '0 auto 12px',
                    display: 'block',
                  }}
                />
                <p className="text-xs" style={{ color: '#688097' }}>
                  시간의 마법사 복길이 분석한 사주팔자입니다
                </p>
                <button
                  onClick={handleReset}
                  className="mt-4 px-6 py-2.5 text-sm font-medium"
                  style={{
                    borderRadius: 20,
                    border: '1px solid rgba(221, 225, 229, 0.4)',
                    color: '#dde1e5',
                    backgroundColor: 'transparent',
                  }}
                >
                  다른 사주 분석하기
                </button>

                {/* 사업자 정보 링크 — 사업자 등록 후 opacity 조정 */}
                <div className="mt-6 flex justify-center gap-3" style={{ opacity: 0.01 }}>
                  <a href="/business" className="text-[9px]" style={{ color: '#688097' }}>사업자 정보</a>
                  <span className="text-[9px]" style={{ color: '#688097' }}>·</span>
                  <a href="/terms" className="text-[9px]" style={{ color: '#688097' }}>이용약관</a>
                  <span className="text-[9px]" style={{ color: '#688097' }}>·</span>
                  <a href="/privacy" className="text-[9px]" style={{ color: '#688097' }}>개인정보처리방침</a>
                </div>
              </footer>
          </div>
        </div>
      )}

      {/* Input Modal (Portal) */}
      <InputModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
