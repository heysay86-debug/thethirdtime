/**
 * Phase 1 — 핵심 판단 tool 정의
 *
 * summary + coreJudgment 3개 필드만. 목표 output 500 토큰 이하.
 */

export const sajuCoreTool = {
  name: 'submit_saju_core',
  description: '사주 핵심 판단(신강약·격국·용신)을 간결하게 제출한다. 각 필드 150자 이내로 핵심만 서술.',
  input_schema: {
    type: 'object' as const,
    properties: {
      summary: {
        type: 'string' as const,
        description: '한 줄 총평. 30자 이내.',
      },
      strengthReading: {
        type: 'string' as const,
        description: '신강/신약 판단. 150자 이내. 월령 득실·천간합·형충 영향 핵심만.',
      },
      gyeokGukReading: {
        type: 'string' as const,
        description: '격국 판단. 150자 이내. 격국명·투출 근거·성격/파격/약화 상태.',
      },
      yongSinReading: {
        type: 'string' as const,
        description: '용신 추론. 150자 이내. 최종 용신 오행·방법(억부/조후)·희신/기신.',
      },
    },
    required: ['summary', 'strengthReading', 'gyeokGukReading', 'yongSinReading'],
  },
} as const;
