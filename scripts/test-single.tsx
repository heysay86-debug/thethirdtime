import React from 'react';
import { renderToFile } from '@react-pdf/renderer';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.join(__dirname, '..', '.env') });

import { analyzeSaju } from '../src/engine/analyze';
import { SajuGateway } from '../src/gateway/gateway';
import SajuReport from '../src/pdf/SajuReport';
import type { InterpretationResult } from '../src/gateway/prompts/schema';

async function main() {
  const engine = analyzeSaju({ birthDate: '1991-01-08', birthTime: '21:30', calendar: 'solar', birthCity: '서울', gender: 'M' });
  console.log(`4기둥: ${engine.pillars.year.gan}${engine.pillars.year.ji} ${engine.pillars.month.gan}${engine.pillars.month.ji} ${engine.pillars.day.gan}${engine.pillars.day.ji} ${engine.pillars.hour?.gan}${engine.pillars.hour?.ji}`);

  const gw = new SajuGateway();
  console.log('Phase 1...');
  const p1 = await gw.analyzePhase1(engine);
  console.log('Phase 2...');
  const p2 = await gw.analyzePhase2(engine, p1.core);
  console.log('섹션:', Object.keys(p2.sections));

  const interpretation: InterpretationResult = {
    summary: p1.core.summary,
    sections: {
      basics: p2.sections.basics,
      coreJudgment: { strengthReading: p1.core.strengthReading, gyeokGukReading: p1.core.gyeokGukReading, yongSinReading: p1.core.yongSinReading },
      pillarAnalysis: p2.sections.pillarAnalysis,
      ohengAnalysis: p2.sections.ohengAnalysis,
      sipseongAnalysis: p2.sections.sipseongAnalysis,
      relations: p2.sections.relations,
      daeunReading: p2.sections.daeunReading,
      overallReading: p2.sections.overallReading,
    },
  } as InterpretationResult;

  const [y,m,d] = '1991-01-08'.split('-').map(Number);
  const birthDateUtc = new Date(Date.UTC(y, m-1, d, 21-9, 30));

  const outPath = path.join(__dirname, 'output', 'T3-00-A0010003.pdf');
  await renderToFile(React.createElement(SajuReport, {
    userName: '샘플3', analysisDate: '2026. 4. 18', birthDateUtc, birthTimeKnown: true, gender: '남', sajuResult: engine, interpretation,
  }) as any, outPath);
  console.log('완료 →', outPath);
}
main().catch(console.error);
