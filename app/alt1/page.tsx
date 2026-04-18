'use client';

import { useState } from 'react';
import SajuForm from './components/SajuForm';
import PillarTable from './components/PillarTable';
import CoreJudgment from './components/CoreJudgment';
import InterpretationStream from './components/InterpretationStream';

type Phase = 'input' | 'loading' | 'phase1' | 'phase2';

export default function Home() {
  const [phase, setPhase] = useState<Phase>('input');
  const [engine, setEngine] = useState<any>(null);
  const [core, setCore] = useState<any>(null);

  const handleSubmit = async (data: any) => {
    setPhase('loading');

    try {
      const body: any = {
        birthDate: data.birthDate,
        calendar: data.calendar,
      };
      if (data.birthTime) body.birthTime = data.birthTime;
      if (data.calendar === 'lunar') body.isLeapMonth = data.isLeapMonth;
      if (data.birthCity) body.birthCity = data.birthCity;
      if (data.gender) body.gender = data.gender;

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/saju/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error ?? '분석 실패');
        setPhase('input');
        return;
      }

      const result = await res.json();
      setEngine(result.engine);
      setCore(result.core);
      setPhase('phase1');

      // Phase 2 자동 시작
      setTimeout(() => setPhase('phase2'), 500);
    } catch {
      alert('네트워크 오류. 다시 시도해주세요.');
      setPhase('input');
    }
  };

  const handleReset = () => {
    setPhase('input');
    setEngine(null);
    setCore(null);
  };

  return (
    <main className="max-w-lg mx-auto px-4 py-8 space-y-6">
      {/* 헤더 */}
      <header className="text-center">
        <h1 className="text-2xl font-bold text-[#222]">사주웹</h1>
        <p className="text-sm text-[#999] mt-1">사주팔자 분석 서비스</p>
      </header>

      {/* 입력 폼 */}
      {phase === 'input' && (
        <SajuForm onSubmit={handleSubmit} loading={false} />
      )}

      {/* 로딩 */}
      {phase === 'loading' && (
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-2 border-[#f696ff] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-[#999] mt-3">사주를 분석하고 있습니다...</p>
        </div>
      )}

      {/* Phase 1 결과 + Phase 2 */}
      {(phase === 'phase1' || phase === 'phase2') && engine && core && (
        <>
          {/* 4기둥 테이블 */}
          <PillarTable pillars={engine.pillars} tenGods={engine.tenGods} />

          {/* 핵심 판단 */}
          <CoreJudgment
            summary={core.summary}
            strengthReading={core.strengthReading}
            gyeokGukReading={core.gyeokGukReading}
            yongSinReading={core.yongSinReading}
          />

          {/* Phase 2 스트리밍 */}
          {phase === 'phase2' && (
            <InterpretationStream engine={engine} core={core} />
          )}

          {/* 다시하기 */}
          <div className="text-center pt-4">
            <button
              onClick={handleReset}
              className="px-6 py-2.5 rounded-xl border border-[#E5E5E5] text-sm text-[#333] font-medium"
            >
              다른 사주 분석하기
            </button>
          </div>
        </>
      )}
    </main>
  );
}
