/**
 * 다중 샘플 파이프라인 테스트
 */
import React from 'react';
import { renderToFile } from '@react-pdf/renderer';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config({ path: path.join(__dirname, '..', '.env') });

import { analyzeSaju } from '../src/engine/analyze';
import { SajuGateway, CoreJudgment, Phase2Sections } from '../src/gateway/gateway';
import SajuReport from '../src/pdf/SajuReport';
import type { SajuResult } from '../src/engine/schema';
import type { InterpretationResult } from '../src/gateway/prompts/schema';

const OUTPUT_DIR = path.join(__dirname, 'output');
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

function mergeInterpretation(core: CoreJudgment, sections: Phase2Sections): InterpretationResult {
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
  } as InterpretationResult;
}

const SAMPLES = [
  {
    input: { birthDate: '1980-01-19', birthTime: '17:45', calendar: 'solar' as const, birthCity: '서울', gender: 'F' as const },
    userName: '이현진',
    fileName: 'T3-00-A0010001',
  },
  {
    input: { birthDate: '1982-01-19', birthTime: '19:45', calendar: 'solar' as const, birthCity: '서울', gender: 'F' as const },
    userName: '이현정',
    fileName: 'T3-00-A0010002',
  },
];

async function processSample(sample: typeof SAMPLES[0], index: number) {
  console.log(`\n[${ index + 1}/${SAMPLES.length}] === ${sample.userName} ===`);

  // 엔진
  console.log('  엔진 계산...');
  const engine = analyzeSaju(sample.input);
  console.log(`  4기둥: ${engine.pillars.year.gan}${engine.pillars.year.ji} ${engine.pillars.month.gan}${engine.pillars.month.ji} ${engine.pillars.day.gan}${engine.pillars.day.ji} ${engine.pillars.hour ? engine.pillars.hour.gan + engine.pillars.hour.ji : '미상'}`);

  // Phase 1
  console.log('  Phase 1...');
  const gw = new SajuGateway();
  const phase1 = await gw.analyzePhase1(engine);
  console.log(`  총평: ${phase1.core.summary.slice(0, 50)}...`);

  // Phase 2
  console.log('  Phase 2...');
  const phase2 = await gw.analyzePhase2(engine, phase1.core);
  console.log(`  섹션: ${Object.keys(phase2.sections).length}개`);

  // PDF
  console.log('  PDF 렌더링...');
  const interpretation = mergeInterpretation(phase1.core, phase2.sections);
  const analysisDate = '2026. 4. 18';
  const birth = engine.birth;
  const [y, m, d] = (birth?.solar || '1990-01-01').split('-').map(Number);
  const [hh, mm] = (birth?.time || '12:00').split(':').map(Number);
  const birthDateUtc = new Date(Date.UTC(y, m - 1, d, hh - 9, mm));

  const outPath = path.join(OUTPUT_DIR, `${sample.fileName}.pdf`);
  await renderToFile(
    React.createElement(SajuReport, {
      userName: sample.userName,
      analysisDate,
      birthDateUtc,
      birthTimeKnown: true,
      gender: '여',
      sajuResult: engine,
      interpretation,
    }) as any,
    outPath
  );
  console.log(`  완료 → ${outPath}`);
}

async function main() {
  console.log('=== 다중 샘플 파이프라인 테스트 ===');
  for (let i = 0; i < SAMPLES.length; i++) {
    await processSample(SAMPLES[i], i);
  }
  console.log('\n=== 전체 완료 ===');
}

main().catch(console.error);
