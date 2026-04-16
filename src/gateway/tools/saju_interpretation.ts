/**
 * Phase 2 — 전체 해석 tool 정의 (coreJudgment 제외)
 *
 * Phase 1에서 핵심 판단(summary·신강약·격국·용신)은 이미 제공.
 * Phase 2는 나머지 섹션만 작성.
 *
 * 참고:
 *   https://docs.anthropic.com/en/docs/agents-and-tools/tool-use/overview
 *   https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching
 */

const schoolPerspective = {
  type: 'object' as const,
  properties: {
    school: {
      type: 'string' as const,
      enum: ['자평진전', '적천수', '궁통보감', '명리정종', '사주첩경'],
      description: '유파명',
    },
    content: {
      type: 'string' as const,
      description: '해당 유파 관점의 해석 내용. 반드시 "~관점에서는" 형식으로 출처를 명시.',
    },
  },
  required: ['school', 'content'],
};

export const sajuInterpretationTool = {
  name: 'submit_saju_interpretation',
  description: '사주 상세 해석을 제출한다. 핵심 판단(신강약·격국·용신)은 이미 Phase 1에서 제공되었으므로 중복 서술하지 않는다.',
  input_schema: {
    type: 'object' as const,
    properties: {
      sections: {
        type: 'object' as const,
        properties: {
          basics: {
            type: 'object' as const,
            description: '[1] 사주팔자 제시',
            properties: {
              description: {
                type: 'string' as const,
                description: '4기둥 간지와 오행 구성을 자연어로 설명. 200자 내외.',
              },
            },
            required: ['description'],
          },
          pillarAnalysis: {
            type: 'object' as const,
            description: '[3] 주별 심층 분석. 각 기둥의 간지·십성·지장간 의미를 해석.',
            properties: {
              year: {
                type: 'string' as const,
                description: '연주 해석. 300자 내외. 조상궁·사회적 배경·초년운.',
              },
              month: {
                type: 'string' as const,
                description: '월주 해석. 300자 내외. 부모궁·사회활동·격국의 근거.',
              },
              day: {
                type: 'string' as const,
                description: '일주 해석. 300자 내외. 본인궁·배우자궁·일간 성격.',
              },
              hour: {
                anyOf: [
                  { type: 'string' as const, description: '시주 해석. 300자 내외. 자녀궁·말년운·직업적성.' },
                  { type: 'null' as const },
                ],
                description: '시주 해석. 시각 미상이면 null.',
              },
            },
            required: ['year', 'month', 'day', 'hour'],
          },
          ohengAnalysis: {
            type: 'object' as const,
            description: '[4] 오행 분석 + 조후. 궁통보감 관점을 반드시 포함.',
            properties: {
              distribution: {
                type: 'string' as const,
                description: '오행 분포 및 과부족 분석. 300자 내외.',
              },
              johu: {
                type: 'string' as const,
                description: '조후 분석. 300자 내외. 궁통보감 기준 일간x월지 조후용신 명시.',
              },
              perspectives: {
                type: 'array' as const,
                items: schoolPerspective,
                description: '유파별 보강 관점. 궁통보감 관점은 필수.',
              },
            },
            required: ['distribution', 'johu'],
          },
          sipseongAnalysis: {
            type: 'object' as const,
            description: '[5] 십성 분석. 명리정종 관점의 육친 분석을 포함 권장.',
            properties: {
              reading: {
                type: 'string' as const,
                description: '십성별 배치와 육친 관계 해석. 400자 내외.',
              },
              perspectives: {
                type: 'array' as const,
                items: schoolPerspective,
                description: '유파별 보강 관점. 의미 있을 때만 포함.',
              },
            },
            required: ['reading'],
          },
          relations: {
            type: 'object' as const,
            description: '[6] 형충파해합·천간합·신살',
            properties: {
              reading: {
                type: 'string' as const,
                description: '천간합·지지 형충파해합 해석. 300자 내외.',
              },
            },
            required: ['reading'],
          },
          daeunReading: {
            anyOf: [
              {
                type: 'object' as const,
                properties: {
                  overview: {
                    type: 'string' as const,
                    description: '대운 전체 흐름 개관. 400자 내외. 순행/역행, 시작 나이, 각 대운별 rating과 용신 관계를 포함하여 인생 전반의 운 흐름 서술.',
                  },
                  currentPeriod: {
                    type: 'string' as const,
                    description: '현재 대운(2026년 기준 나이 해당) 해석. 300자 내외. 해당 대운의 간지, 십성, 용신 관계, score, rating을 구체적으로.',
                  },
                  upcoming: {
                    type: 'string' as const,
                    description: '향후 10년 세운(seun) 흐름. 300자 내외. 각 세운의 rating과 주목할 해(대길/대흉)를 명시.',
                  },
                },
                required: ['overview', 'currentPeriod', 'upcoming'],
              },
              { type: 'null' as const },
            ],
            description: '[7] 대운 흐름. 중요: 입력 JSON의 daeun 필드가 null이 아니면 반드시 object를 반환하라. daeun.periods와 seun의 analysis 데이터를 활용.',
          },
          overallReading: {
            type: 'object' as const,
            description: '[8] 종합 해석. 이석영 기준 종합 후 현대적 적용과 유파 보강.',
            properties: {
              primary: {
                type: 'string' as const,
                description: '이석영 기준 종합 해석. 400자 내외.',
              },
              modernApplication: {
                type: 'string' as const,
                description: '현대적 적용. 300자 내외. 직업 적성, 성격 특성, 대인관계.',
              },
              perspectives: {
                type: 'array' as const,
                items: schoolPerspective,
                description: '유파별 보강 관점. 의미 있는 관점만 선택적 포함.',
              },
            },
            required: ['primary', 'modernApplication'],
          },
        },
        required: [
          'basics', 'pillarAnalysis',
          'ohengAnalysis', 'sipseongAnalysis', 'relations',
          'daeunReading', 'overallReading',
        ],
      },
    },
    required: ['sections'],
  },
} as const;

export const SAJU_TOOLS = [sajuInterpretationTool];
