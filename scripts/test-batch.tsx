import React from 'react';
import { renderToFile } from '@react-pdf/renderer';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.join(__dirname, '..', '.env') });

import { analyzeSaju } from '../src/engine/analyze';
import { SajuGateway } from '../src/gateway/gateway';
import SajuReport from '../src/pdf/SajuReport';
import type { InterpretationResult } from '../src/gateway/prompts/schema';

const SAMPLES = [
  { input: { birthDate: '1986-09-15', birthTime: '01:17', calendar: 'solar' as const, birthCity: '서울', gender: 'M' as const }, userName: '이대운', gender: '남', fileName: 'T3-00-A0010004' },
];

async function run(s: typeof SAMPLES[0]) {
  console.log(`\n=== ${s.userName} (${s.input.birthDate} ${s.input.birthTime}) ===`);
  const engine = analyzeSaju(s.input);
  console.log(`4기둥: ${engine.pillars.year.gan}${engine.pillars.year.ji} ${engine.pillars.month.gan}${engine.pillars.month.ji} ${engine.pillars.day.gan}${engine.pillars.day.ji} ${engine.pillars.hour?.gan}${engine.pillars.hour?.ji}`);

  const gw = new SajuGateway();
  console.log('Phase 1...');
  const p1 = await gw.analyzePhase1(engine);
  console.log('Phase 2...');
  const p2 = await gw.analyzePhase2(engine, p1.core);

  const interp = { summary: p1.core.summary, sections: { basics: p2.sections.basics, coreJudgment: { strengthReading: p1.core.strengthReading, gyeokGukReading: p1.core.gyeokGukReading, yongSinReading: p1.core.yongSinReading }, ohengAnalysis: p2.sections.ohengAnalysis, sipseongAnalysis: p2.sections.sipseongAnalysis, relations: p2.sections.relations, daeunReading: p2.sections.daeunReading, overallReading: p2.sections.overallReading } } as InterpretationResult;

  const [y,m,d] = s.input.birthDate.split('-').map(Number);
  const [hh,mm] = s.input.birthTime.split(':').map(Number);
  const outPath = path.join(__dirname, 'output', `${s.fileName}.pdf`);
  await renderToFile(React.createElement(SajuReport, { userName: s.userName, analysisDate: '2026. 4. 18', birthDateUtc: new Date(Date.UTC(y,m-1,d,hh-9,mm)), birthTimeKnown: true, gender: s.gender, sajuResult: engine, interpretation: interp }) as any, outPath);
  console.log(`완료 → ${outPath}`);
}

async function main() {
  for (const s of SAMPLES) await run(s);
  console.log('\n=== 전체 완료 ===');
}
main().catch(console.error);
