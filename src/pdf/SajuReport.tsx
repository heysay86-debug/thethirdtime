/**
 * 사주 분석 PDF 리포트 — 메인 Document
 *
 * @react-pdf/renderer의 <Document>로 전체 페이지를 조합한다.
 *
 * 페이지 구성:
 * 01. 표지 (CoverPage)
 * 02. 목차 (TocPage)
 * 03. 서문 — 독자에게 (PrefacePage)
 * 04. 출생시점 태양계 배치도 (SolarSystemPage)
 * 05. 사주팔자 개요 (BasicsSection)
 * 06~12. 본문 섹션 (TODO)
 * 13. 마무리 (ClosingPage)
 */

import React from 'react';
import { Document } from '@react-pdf/renderer';

// 폰트 등록 (사이드이펙트 import)
import './fonts';

// 페이지 컴포넌트
import CoverPage from './components/CoverPage';
import TocPage from './components/TocPage';
import PrefacePage from './components/PrefacePage';
import ClosingPage from './components/ClosingPage';
import SolarSystemPage from './components/SolarSystemPage';

// 본문 섹션
import BasicsSection from './components/sections/BasicsSection';
import CoreJudgmentSection from './components/sections/CoreJudgmentSection';
import PillarAnalysisSection from './components/sections/PillarAnalysisSection';
import OhengAnalysisSection from './components/sections/OhengAnalysisSection';
import SipseongAnalysisSection from './components/sections/SipseongAnalysisSection';
import TwelveStagesSection from './components/sections/TwelveStagesSection';
import RelationsSection from './components/sections/RelationsSection';
import DaeunSection from './components/sections/DaeunSection';
import OverallReadingSection from './components/sections/OverallReadingSection';

import type { SajuResult } from '@engine/schema';
import type { InterpretationResult } from '../gateway/prompts/schema';

export interface SajuReportProps {
  userName: string;
  analysisDate: string;
  /** UTC 기준 Date 객체. 태양계 배치도 계산에 사용 */
  birthDateUtc: Date;
  /** 시주(시각) 입력 여부. false면 캡션에 시각을 표시하지 않음 */
  birthTimeKnown?: boolean;
  /** 성별 ('남' | '여') */
  gender?: string;
  /** 사주 엔진 계산 결과. 본문 섹션 렌더링에 필요. null이면 본문 섹션 생략 */
  sajuResult?: SajuResult | null;
  /** LLM 해석 결과. 본문 섹션 렌더링에 필요. null이면 본문 섹션 생략 */
  interpretation?: InterpretationResult | null;
}

export default function SajuReport({
  userName,
  analysisDate,
  birthDateUtc,
  birthTimeKnown = true,
  gender = '남',
  sajuResult = null,
  interpretation = null,
}: SajuReportProps) {
  const hasBody = sajuResult != null && interpretation != null;

  return (
    <Document
      title={`사주 분석 리포트 — ${userName}`}
      author="제3의시간"
      subject="사주명리학 분석 리포트"
      creator="제3의시간 (thethirdtime.com)"
    >
      {/* 1. 표지 */}
      <CoverPage userName={userName} analysisDate={analysisDate} />

      {/* 2. 목차 */}
      <TocPage />

      {/* 3. 서문 */}
      <PrefacePage userName={userName} />

      {/* 4. 출생시점 태양계 배치도 */}
      <SolarSystemPage birthDateUtc={birthDateUtc} userName={userName} birthTimeKnown={birthTimeKnown} />

      {/* 5~12. 본문 섹션 */}
      {hasBody && (
        <>
          {/* 05. 사주팔자 개요 */}
          <BasicsSection sajuResult={sajuResult} interpretation={interpretation} userName={userName} gender={gender} />

          {/* 06. 핵심 판단 */}
          <CoreJudgmentSection sajuResult={sajuResult} interpretation={interpretation} />

          {/* 07. 주별 심층 분석 */}
          <PillarAnalysisSection sajuResult={sajuResult} interpretation={interpretation} />

          {/* 08. 오행 분석 */}
          <OhengAnalysisSection sajuResult={sajuResult} interpretation={interpretation} />

          {/* 09. 십성 분석 */}
          <SipseongAnalysisSection sajuResult={sajuResult} interpretation={interpretation} />

          {/* 09-b. 십이운성 분석 */}
          <TwelveStagesSection sajuResult={sajuResult} />

          {/* 10. 형충파해합 · 신살 */}
          <RelationsSection sajuResult={sajuResult} interpretation={interpretation} />

          {/* 11. 대운 흐름 */}
          {sajuResult.daeun && (
            <DaeunSection sajuResult={sajuResult} interpretation={interpretation} />
          )}

          {/* 12. 종합 해석 */}
          <OverallReadingSection sajuResult={sajuResult} interpretation={interpretation} />
        </>
      )}

      {/* 마무리 */}
      <ClosingPage analysisDate={analysisDate} />
    </Document>
  );
}
