'use client';

import { useState, useEffect, useCallback } from 'react';
import StarField from './components/base/StarField';
import ZoneTransition from './components/base/ZoneTransition';
import SectionDivider from './components/base/SectionDivider';
import DotCharacter from './components/base/DotCharacter';
import PillarFrame from './components/base/PillarFrame';
import DialoguePlayer from './components/dialogue/DialoguePlayer';
import InputModal from './components/input/InputModal';
import PillarTable from './components/result/PillarTable';
import SinsalRow from './components/result/SinsalRow';
import DaeunTimeline from './components/result/DaeunTimeline';
import SeunCard from './components/result/SeunCard';
import OhengRelation from './components/result/OhengRelation';
import OhengRadar from './components/result/OhengRadar';
import InlineDialogue from './components/result/InlineDialogue';
import GunghamTeaser from './components/gungham/GunghamTeaser';
import UpsellDialogue from './components/upsell/UpsellDialogue';
import CtaButton from './components/upsell/CtaButton';
import type { DialogueLine } from './components/base/DialogueBox';

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

export default function Alt2Page() {
  const [phase, setPhase] = useState<Phase>('opening');
  const [pillarsOpen, setPillarsOpen] = useState(false);
  const [logoVisible, setLogoVisible] = useState(false);
  const [logoFading, setLogoFading] = useState(false);
  const [transitionPhase, setTransitionPhase] = useState<TransitionPhase>('idle');
  const [modalOpen, setModalOpen] = useState(false);
  const [engine, setEngine] = useState<any>(null);
  const [core, setCore] = useState<any>(null);
  const [introScript, setIntroScript] = useState<DialogueLine[]>([]);
  const [introInputFlow, setIntroInputFlow] = useState<DialogueLine[]>([]);
  const [upsellScript, setUpsellScript] = useState<DialogueLine[]>([]);
  const [resultComments, setResultComments] = useState<any>(null);
  const [bgOpacity, setBgOpacity] = useState(0);
  type ZoneBg = 'before' | 'after' | 'blackout' | 'inside_sun' | 'inside_moon' | 'past';
  const [zonaBg, setZonaBg] = useState<ZoneBg>('before');
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
    const t2 = setTimeout(() => setLogoFading(true), 2000);
    const t3 = setTimeout(() => setPillarsOpen(true), 2500);
    const t4 = setTimeout(() => {
      setLogoVisible(false);
      setPhase('dialogue');
    }, 4200);
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

  const handleSubmit = useCallback(async (input: any) => {
    setModalOpen(false);

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

    try {
      const apiPromise = fetch('/api/saju/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }).then(r => {
        if (!r.ok) throw new Error('API error');
        return r.json();
      });

      const [data] = await Promise.all([apiPromise, delay(500)]);
      setEngine(data.engine);
      setCore(data.core);

      // Phase 3: zoom in
      setTransitionPhase('zoom-in');
      await delay(400);

      setPhase('result');
      setTransitionPhase('idle');
      window.scrollTo({ top: 0 });
    } catch {
      alert('분석 중 오류가 발생했습니다. 다시 시도해주세요.');
      setPhase('dialogue');
      setTransitionPhase('idle');
    }
  }, []);

  const handleInputSubmit = useCallback(async (input: any) => {
    setPhase('transition');
    setTransitionPhase('zoom-out');
    await delay(400);

    setTransitionPhase('loading');
    const body: any = {
      birthDate: input.birthDate,
      calendar: input.calendar,
    };
    if (input.birthTime) body.birthTime = input.birthTime;
    if (input.calendar === 'lunar') body.isLeapMonth = input.isLeapMonth;
    if (input.birthCity) body.birthCity = input.birthCity;
    if (input.gender) body.gender = input.gender;

    try {
      const apiPromise = fetch('/api/saju/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }).then(r => {
        if (!r.ok) throw new Error('API error');
        return r.json();
      });

      const [data] = await Promise.all([apiPromise, delay(500)]);
      setEngine(data.engine);
      setCore(data.core);

      setTransitionPhase('zoom-in');
      await delay(400);

      setPhase('result');
      setTransitionPhase('idle');
      window.scrollTo({ top: 0 });
    } catch {
      alert('분석 중 오류가 발생했습니다. 다시 시도해주세요.');
      setPhase('dialogue');
      setTransitionPhase('idle');
    }
  }, []);

  const handleReset = useCallback(() => {
    setEngine(null);
    setCore(null);
    setPhase('dialogue');
    setBgOpacity(0);
    setZonaBg('before');
    setDotState({ direction: 'front', x: 50, y: 62, visible: true });
    window.scrollTo({ top: 0 });
  }, []);

  // Extract data for result components
  const ohengDistribution = engine?.pillars
    ? calcOhengDistribution(engine.pillars)
    : { 목: 0, 화: 0, 토: 0, 금: 0, 수: 0 };
  const daeunPeriods = engine?.daeun?.periods || [];
  const currentAge = engine?.daeun?.currentAge || 0;
  const sinsalList = engine?.sinsal || [];
  const relationsArr = engine?.relations?.summary || [];

  // Seun data
  const currentYear = new Date().getFullYear();
  const seunCurrent = engine?.daeun?.seun?.find?.((s: any) => s.year === currentYear);
  const seunNext = engine?.daeun?.seun?.find?.((s: any) => s.year === currentYear + 1);

  return (
    <div className="relative min-h-screen" style={{ background: '#1a1e24' }}>
      {/* Pillar Frame — always visible */}
      <PillarFrame isOpen={pillarsOpen} />

      {/* Opening: logo */}
      {phase === 'opening' && (
        <div
          className="fixed inset-0 flex items-center justify-center"
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
        </div>
      )}

      {/* Fixed background layers */}
      <div className="fixed inset-0 flex justify-center" style={{ zIndex: 0 }}>
        <div className="relative w-full h-full" style={{ maxWidth: 440 }}>
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

      {/* ZONE A: RPG Dialogue */}
      {phase === 'dialogue' && introScript.length > 0 && (
        <div className="relative" style={{ zIndex: 10, minHeight: '100vh' }}>
          <DialoguePlayer
            script={introScript}
            inputFlow={introInputFlow}
            onComplete={() => {}}
            onAction={handleAction}
            onInputSubmit={handleInputSubmit}
            onBgChange={(bg) => setZonaBg(bg)}
            onDotMove={(state) => setDotState(prev => ({ ...prev, ...state }))}
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
          <div className="max-w-[440px] mx-auto pt-8 pb-16 space-y-8" style={{ paddingLeft: 38, paddingRight: 38 }}>
            {/* Reset button */}
            <button
              onClick={handleReset}
              className="text-sm font-medium"
              style={{ color: '#688097' }}
            >
              ← 다시하기
            </button>

            {/* ⑤ Pillar Table */}
            <PillarTable
              pillars={engine.pillars}
              tenGods={engine.tenGods}
              jijanggan={engine.jijanggan}
              relations={relationsArr}
            />

            {/* ⑥ Sinsal */}
            <SinsalRow sinsalList={sinsalList} />

            {/* Inline comment after pillars + core.summary */}
            <InlineDialogue
              lines={[
                ...(resultComments?.after_pillar_table || []),
                ...(core?.summary ? [{
                  character: 'speak',
                  name: '안내자',
                  text: core.summary,
                  style: 'normal' as const,
                }] : []),
              ]}
              autoPlay
            />

            {/* ⑦ Daeun Timeline */}
            {daeunPeriods.length > 0 && (
              <DaeunTimeline periods={daeunPeriods} currentAge={currentAge} />
            )}

            {/* ⑧ Seun */}
            <SeunCard currentYear={seunCurrent} nextYear={seunNext} />

            {/* Inline comment after seun */}
            {resultComments?.after_seun && (
              <InlineDialogue lines={resultComments.after_seun} autoPlay />
            )}

            <SectionDivider icon="star" />

            {/* ⑨ Oheng Relation */}
            <OhengRelation />

            {/* ⑩ Oheng Radar */}
            <OhengRadar distribution={ohengDistribution} />

            {/* Inline comment after oheng + core.strengthReading */}
            <InlineDialogue
              lines={[
                ...(resultComments?.after_oheng || []),
                ...(core?.strengthReading ? [{
                  character: 'flash',
                  name: '안내자',
                  text: core.strengthReading,
                  style: 'emphasis' as const,
                }] : []),
              ]}
              autoPlay
            />

            <SectionDivider icon="stamp" />

            {/* ⑪-b Gungham Teaser */}
            <GunghamTeaser onSelect={(mode) => {
              // TODO: implement gungham modal
              alert(`궁합 ${mode}인 기능은 준비 중입니다`);
            }} />

            {/* ZONE C: Upsell */}
            <div id="upsell-section" className="space-y-6 pt-8">
              <UpsellDialogue
                script={upsellScript}
                previewData={core}
              />
              <CtaButton
                label="구름 너머의 이야기를 만나보세요"
                price="₩9,900"
                onClick={() => alert('결제 기능은 준비 중입니다')}
              />
            </div>

            {/* Free section end comment */}
            {resultComments?.free_section_end && (
              <InlineDialogue lines={resultComments.free_section_end} autoPlay />
            )}

            {/* Footer */}
            <footer className="text-center pt-8 pb-16">
              <p className="text-xs" style={{ color: '#688097' }}>
                제3의시간 — 사주팔자 분석 서비스
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
