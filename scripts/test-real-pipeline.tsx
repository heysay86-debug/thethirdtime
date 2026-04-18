/**
 * 실제 파이프라인 통합 테스트
 *
 * 엔진(analyzeSaju) → LLM(Phase1+Phase2) → PDF 렌더링
 * mock 데이터 없이 전체 프로세스를 실행한다.
 */

import React from 'react';
import { renderToFile } from '@react-pdf/renderer';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

// .env 로드
dotenv.config({ path: path.join(__dirname, '..', '.env') });

import { analyzeSaju } from '../src/engine/analyze';
import { SajuGateway, CoreJudgment, Phase2Sections } from '../src/gateway/gateway';
import SajuReport from '../src/pdf/SajuReport';
import type { SajuResult } from '../src/engine/schema';
import type { InterpretationResult } from '../src/gateway/prompts/schema';

const OUTPUT_DIR = path.join(__dirname, 'output');
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// ── 테스트 입력 (고정 샘플: 1986-09-15 01:17 남명 서울) ──

const TEST_INPUT = {
  birthDate: '1991-01-08',
  birthTime: '21:30',
  calendar: 'solar' as const,
  birthCity: '서울',
  gender: 'M' as const,
};

const USER_NAME = '샘플3';
const ANALYSIS_DATE = '2026. 4. 18';

// ── Phase1 + Phase2 결과를 InterpretationResult로 합성 ──

function mergeInterpretation(
  core: CoreJudgment,
  sections: Phase2Sections,
): InterpretationResult {
  return {
    summary: core.summary,
    sections: {
      basics: sections.basics,
      coreJudgment: {
        strengthReading: core.strengthReading,
        gyeokGukReading: core.gyeokGukReading,
        yongSinReading: core.yongSinReading,
      },
      pillarAnalysis: sections.pillarAnalysis,
      ohengAnalysis: sections.ohengAnalysis,
      sipseongAnalysis: sections.sipseongAnalysis,
      relations: sections.relations,
      daeunReading: sections.daeunReading,
      overallReading: sections.overallReading,
    },
  };
}

// ── 메인 ──

async function main() {
  console.log('=== 실제 파이프라인 통합 테스트 ===\n');

  // 1. 엔진 계산
  console.log('[1/4] 엔진 계산 중...');
  const engineStart = Date.now();
  const sajuResult: SajuResult = analyzeSaju(TEST_INPUT);
  const engineMs = Date.now() - engineStart;
  console.log(`  완료 (${engineMs}ms)`);
  console.log(`  4기둥: ${sajuResult.pillars.year.gan}${sajuResult.pillars.year.ji} ${sajuResult.pillars.month.gan}${sajuResult.pillars.month.ji} ${sajuResult.pillars.day.gan}${sajuResult.pillars.day.ji} ${sajuResult.pillars.hour?.gan ?? '?'}${sajuResult.pillars.hour?.ji ?? '?'}`);
  console.log(`  신강약: ${sajuResult.strength.level} (${sajuResult.strength.score}점)`);
  console.log(`  격국: ${sajuResult.gyeokGuk.type} (${sajuResult.gyeokGuk.state})`);
  console.log(`  용신: ${sajuResult.yongSin.final.primary} / 희신: ${sajuResult.yongSin.final.secondary}`);
  console.log(`  대운: ${sajuResult.daeun ? sajuResult.daeun.periods.length + '개 대운' : 'null'}`);
  console.log(`  세운: ${sajuResult.seun.length}개\n`);

  // 2. LLM Phase 1
  console.log('[2/4] LLM Phase 1 (핵심 판단)...');
  const gateway = new SajuGateway();
  const phase1 = await gateway.analyzePhase1(sajuResult);
  console.log(`  완료 (${phase1.elapsedMs}ms, in:${phase1.usage.inputTokens} out:${phase1.usage.outputTokens})`);
  console.log(`  총평: ${phase1.core.summary.slice(0, 80)}...\n`);

  // 3. LLM Phase 2
  console.log('[3/4] LLM Phase 2 (전체 해석)...');
  let chunkCount = 0;
  const phase2 = await gateway.analyzePhase2(sajuResult, phase1.core, () => { chunkCount++; });
  console.log(`  완료 (${phase2.elapsedMs}ms, ttft:${phase2.timeToFirstTokenMs}ms, chunks:${chunkCount})`);
  console.log(`  토큰: in:${phase2.usage.inputTokens} out:${phase2.usage.outputTokens}\n`);

  // 4. PDF 렌더링
  console.log('[4/4] PDF 렌더링...');
  const interpretation = mergeInterpretation(phase1.core, phase2.sections);

  // UTC 날짜 계산 (태양계 배치도용)
  const [y, m, d] = TEST_INPUT.birthDate.split('-').map(Number);
  const [hh, mm] = TEST_INPUT.birthTime.split(':').map(Number);
  // KST → UTC (서울 UTC+9)
  const birthDateUtc = new Date(Date.UTC(y, m - 1, d, hh - 9, mm));

  const outPath = path.join(OUTPUT_DIR, 'report-real.pdf');
  const doc = React.createElement(SajuReport, {
    userName: USER_NAME,
    analysisDate: ANALYSIS_DATE,
    birthDateUtc,
    birthTimeKnown: true,
    sajuResult,
    interpretation,
    gender: '남',
  });

  await renderToFile(doc as any, outPath);
  const stat = fs.statSync(outPath);
  console.log(`  완료 → ${outPath} (${(stat.size / 1024).toFixed(1)} KB)\n`);

  // 요약
  const totalMs = engineMs + phase1.elapsedMs + phase2.elapsedMs;
  console.log('=== 완료 ===');
  console.log(`총 소요: 엔진 ${engineMs}ms + Phase1 ${phase1.elapsedMs}ms + Phase2 ${phase2.elapsedMs}ms = ${totalMs}ms`);
  console.log(`총 토큰: in:${phase1.usage.inputTokens + phase2.usage.inputTokens} out:${phase1.usage.outputTokens + phase2.usage.outputTokens}`);
}

main().catch(err => {
  console.error('실패:', err.message || err);
  if (err.stack) console.error(err.stack);
  process.exit(1);
});
