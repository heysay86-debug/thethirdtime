/**
 * LLM 해석문 출력 JSON 스키마 (Zod)
 *
 * Claude API가 JSON mode로 반환할 해석문 구조.
 * interpretation-policy.md [1]~[8] 섹션 기반.
 */

import { z } from 'zod';

const SchoolPerspectiveSchema = z.object({
  /** 유파명 */
  school: z.enum(['자평진전', '적천수', '궁통보감', '명리정종', '사주첩경']),
  /** 해석 내용 */
  content: z.string(),
});

export const InterpretationResultSchema = z.object({
  /** 한 줄 총평 */
  summary: z.string(),

  sections: z.object({
    /** [1] 사주팔자 제시 — 4기둥 한자+오행 설명 */
    basics: z.object({
      description: z.string(),
    }),

    /** [2] 핵심 판단 (이석영 기준) */
    coreJudgment: z.object({
      strengthReading: z.string(),
      gyeokGukReading: z.string(),
      yongSinReading: z.string(),
    }),

    /** [3] 주별 심층 분석 — 키워드 테이블로 자체 생성 (LLM 불필요) */
    pillarAnalysis: z.object({
      year: z.string(),
      month: z.string(),
      day: z.string(),
      hour: z.string().nullable(),
    }).optional(),

    /** [4] 오행 분석 + 조후 */
    ohengAnalysis: z.object({
      distribution: z.string(),
      johu: z.string(),
      perspectives: z.array(SchoolPerspectiveSchema).optional(),
    }),

    /** [5] 십성 분석 */
    sipseongAnalysis: z.object({
      reading: z.string(),
      perspectives: z.array(SchoolPerspectiveSchema).optional(),
    }),

    /** [6] 형충파해합 · 신살 */
    relations: z.object({
      reading: z.string(),
    }),

    /** [7] 대운 흐름 */
    daeunReading: z.object({
      overview: z.string(),
      currentPeriod: z.string(),
      upcoming: z.string(),
    }).nullable(),

    /** [8] 종합 해석 */
    overallReading: z.object({
      /** 이석영 기준 종합 */
      primary: z.string(),
      /** 현대적 적용 (직업·성향·관계) */
      modernApplication: z.string(),
      /** 유파별 보강 관점 */
      perspectives: z.array(SchoolPerspectiveSchema).optional(),
    }),
  }),
});

export type InterpretationResult = z.infer<typeof InterpretationResultSchema>;

// ── Phase 2 전용 스키마 (coreJudgment 제외) ──

export const Phase2SectionsSchema = z.object({
  basics: z.object({ description: z.string() }),
  pillarAnalysis: z.object({
    year: z.string(),
    month: z.string(),
    day: z.string(),
    hour: z.string().nullable(),
  }).optional(),
  ohengAnalysis: z.object({
    distribution: z.string(),
    johu: z.string(),
    perspectives: z.array(SchoolPerspectiveSchema).optional(),
  }),
  sipseongAnalysis: z.object({
    reading: z.string(),
    perspectives: z.array(SchoolPerspectiveSchema).optional(),
  }),
  relations: z.object({ reading: z.string() }),
  daeunReading: z.object({
    overview: z.string(),
    currentPeriod: z.string(),
    upcoming: z.string(),
  }).nullable(),
  overallReading: z.object({
    primary: z.string(),
    modernApplication: z.string(),
    perspectives: z.array(SchoolPerspectiveSchema).optional(),
  }),
});

export const Phase2ResultSchema = z.object({
  sections: Phase2SectionsSchema,
});

export type Phase2Result = z.infer<typeof Phase2ResultSchema>;
