/**
 * PDF 렌더링 테스트 스크립트 (실제 API 호출)
 *
 * 두 케이스 검증:
 * 1. 시주 있음 — 1986-09-15 01:17 KST (壬戌 일주, 丁酉 월주, 丙寅 연주)
 * 2. 시주 모름 — 1986-09-15 KST, 시각 미상
 *
 * 실행: npx tsx scripts/test-pdf-render.tsx
 * 출력: scripts/output/
 *
 * 환경 변수: ANTHROPIC_API_KEY (.env 파일)
 */

import 'dotenv/config';
import React from 'react';
import { renderToFile } from '@react-pdf/renderer';
import path from 'path';
import fs from 'fs';

import SajuReport from '../src/pdf/SajuReport';
import { analyzeSaju } from '../src/engine/analyze';
import { SajuGateway } from '../src/gateway/gateway';
import type { SajuInput } from '../src/engine/saju';
import type { InterpretationResult } from '../src/gateway/prompts/schema';

const OUTPUT_DIR = path.join(__dirname, 'output');
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// ── API 호출: 엔진 + LLM → InterpretationResult 조립 ──────────

async function runFullAnalysis(
  input: SajuInput,
  gateway: SajuGateway,
): Promise<{ sajuResult: ReturnType<typeof analyzeSaju>; interpretation: InterpretationResult }> {
  console.log('  [1/3] 사주 엔진 계산...');
  const sajuResult = analyzeSaju(input);
  console.log(`       완료 — 격국: ${sajuResult.gyeokGuk.type} / 강약: ${sajuResult.strength.level}`);

  console.log('  [2/3] Phase 1 (핵심 판단) LLM 호출...');
  const phase1 = await gateway.analyzePhase1(sajuResult);
  console.log(`       완료 — ${phase1.elapsedMs}ms / 토큰 ${phase1.usage.inputTokens}+${phase1.usage.outputTokens}`);
  console.log(`       summary: ${phase1.core.summary.slice(0, 60)}...`);

  console.log('  [3/3] Phase 2 (전체 해석) LLM 호출...');
  const phase2 = await gateway.analyzePhase2(sajuResult, phase1.core, (chunk) => {
    process.stdout.write('.');
  });
  console.log(`\n       완료 — ${phase2.elapsedMs}ms / 토큰 ${phase2.usage.inputTokens}+${phase2.usage.outputTokens}`);

  // InterpretationResult 조립 (Phase1 + Phase2)
  const interpretation: InterpretationResult = {
    summary: phase1.core.summary,
    sections: {
      basics: phase2.sections.basics,
      coreJudgment: {
        strengthReading: phase1.core.strengthReading,
        gyeokGukReading: phase1.core.gyeokGukReading,
        yongSinReading: phase1.core.yongSinReading,
      },
      pillarAnalysis: phase2.sections.pillarAnalysis,
      ohengAnalysis: phase2.sections.ohengAnalysis,
      sipseongAnalysis: phase2.sections.sipseongAnalysis,
      relations: phase2.sections.relations,
      daeunReading: phase2.sections.daeunReading,
      overallReading: phase2.sections.overallReading,
    },
  };

  return { sajuResult, interpretation };
}

// ── PDF 렌더 ──────────────────────────────────────────────────

async function renderCase(
  label: string,
  props: Parameters<typeof SajuReport>[0],
  filename: string,
) {
  const outPath = path.join(OUTPUT_DIR, filename);
  console.log('  PDF 렌더링...');
  const doc = React.createElement(SajuReport, props);
  await renderToFile(doc as any, outPath);
  const stat = fs.statSync(outPath);
  console.log(`  완료 → ${outPath} (${(stat.size / 1024).toFixed(1)} KB)`);
}

// ── 메인 ──────────────────────────────────────────────────────

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('오류: ANTHROPIC_API_KEY가 설정되지 않았습니다. .env 파일을 확인하세요.');
    process.exit(1);
  }

  const gateway = new SajuGateway();

  // ── 케이스 1: 시주 있음 ──────────────────────────────────────
  console.log('\n[ 케이스 1 — 시주 있음: 1986-09-15 01:17 KST ]');

  const input1: SajuInput = {
    birthDate: '1986-09-15',
    birthTime: '01:17',
    calendar: 'solar',
    birthCity: '서울',
    gender: 'M',
  };

  const { sajuResult: sajuResult1, interpretation: interp1 } = await runFullAnalysis(input1, gateway);

  await renderCase(
    '케이스1',
    {
      userName: '이대운',
      analysisDate: '2026. 4. 17',
      birthDateUtc: new Date('1986-09-14T16:17:00Z'), // 01:17 KST = 16:17 UTC 전날
      birthTimeKnown: true,
      sajuResult: sajuResult1,
      interpretation: interp1,
    },
    'report-with-hour.pdf',
  );

  // ── 케이스 2: 시주 모름 ──────────────────────────────────────
  console.log('\n[ 케이스 2 — 시주 모름: 1986-09-15 KST ]');

  const input2: SajuInput = {
    birthDate: '1986-09-15',
    // birthTime 생략 → 시주 없음
    calendar: 'solar',
    birthCity: '서울',
    gender: 'M',
  };

  const { sajuResult: sajuResult2, interpretation: interp2 } = await runFullAnalysis(input2, gateway);

  await renderCase(
    '케이스2',
    {
      userName: '이대운',
      analysisDate: '2026. 4. 17',
      birthDateUtc: new Date('1986-09-15T03:00:00Z'), // 정오 KST 기본값
      birthTimeKnown: false,
      sajuResult: sajuResult2,
      interpretation: interp2,
    },
    'report-no-hour.pdf',
  );

  console.log('\n✓ 전체 렌더링 완료');
}

main().catch((err) => {
  console.error('\n렌더링 실패:', err);
  process.exit(1);
});
