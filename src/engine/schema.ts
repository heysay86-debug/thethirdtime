/**
 * 사주 엔진 출력 JSON 스키마 (Zod)
 *
 * M8~M13 전체 결과를 하나의 구조화 JSON으로 통합.
 * LLM 게이트웨이(Phase 2)에 전달할 엔진 출력 포맷.
 */

import { z } from 'zod';

// ── 기둥 ──

const PillarSchema = z.object({
  gan: z.string().length(1),
  ji: z.string().length(1),
});

// ── 십성 ──

const TenGodNameSchema = z.enum([
  '비견', '겁재', '식신', '상관', '편재', '정재', '편관', '정관', '편인', '정인',
]);

const TenGodsSchema = z.object({
  yearGan: TenGodNameSchema,
  monthGan: TenGodNameSchema,
  dayGan: z.literal('비견'),
  hourGan: TenGodNameSchema.nullable(),
  yearJi: TenGodNameSchema,
  monthJi: TenGodNameSchema,
  dayJi: TenGodNameSchema,
  hourJi: TenGodNameSchema.nullable(),
});

// ── 지장간 ──

const JijangganEntrySchema = z.object({
  stem: z.string().length(1),
  role: z.enum(['여기', '중기', '정기']),
  days: z.number(),
  strength: z.number(),
});

const JijangganSchema = z.object({
  year: z.array(JijangganEntrySchema),
  month: z.array(JijangganEntrySchema),
  day: z.array(JijangganEntrySchema),
  hour: z.array(JijangganEntrySchema).nullable(),
});

// ── 신강/신약 ──

const StrengthLevelSchema = z.enum(['극강', '신강', '중화', '신약', '극약']);

const CheonganHapSchema = z.object({
  stem1: z.string(),
  stem2: z.string(),
  position1: z.string(),
  position2: z.string(),
  hwaElement: z.string(),
});

const JijiRelationSchema = z.object({
  type: z.enum(['충', '형', '해', '파', '합']),
  ji1: z.string(),
  ji2: z.string(),
  position1: z.string(),
  position2: z.string(),
});

const DayMasterStrengthSchema = z.object({
  level: StrengthLevelSchema,
  score: z.number().min(0).max(100),
  wolryeong: z.enum(['득령', '실령', '중립']),
  details: z.object({
    wolryeongScore: z.number(),
    deukjiScore: z.number(),
    deukseScore: z.number(),
    seolgiPenalty: z.number(),
  }),
  cheonganHaps: z.array(CheonganHapSchema),
  monthDamage: z.array(JijiRelationSchema),
});

// ── 격국 ──

const GyeokGukTypeSchema = z.enum([
  '정관격', '편관격', '정인격', '편인격',
  '식신격', '상관격', '정재격', '편재격',
  '건록격', '양인격',
  '종강격', '종왕격', '종아격', '종재격', '종살격',
  '화격', '중화격',
]);

const GyeokGukSchema = z.object({
  type: GyeokGukTypeSchema,
  category: z.enum(['내격', '외격']),
  state: z.enum(['성격', '파격', '약화']),
  breakCauses: z.array(z.string()),
  weakenedBy: z.array(z.string()),
  basis: z.object({
    method: z.enum(['투출', '본기', '건록', '양인', '종격', '화격']),
    sourceStem: z.string().nullable(),
    sourcePosition: z.string().nullable(),
  }),
  monthMainTenGod: TenGodNameSchema,
  strengthLevel: StrengthLevelSchema,
  warnings: z.array(z.string()),
});

// ── 용신 ──

const ElementSchema = z.enum(['木', '火', '土', '金', '水']);

const MethodResultSchema = z.object({
  applicable: z.boolean(),
  primary: ElementSchema.nullable(),
  secondary: ElementSchema.nullable(),
  reasoning: z.string(),
});

const YongSinSchema = z.object({
  methods: z.object({
    eokbu: MethodResultSchema,
    johu: MethodResultSchema,
    tonggwan: MethodResultSchema,
    byeongyak: MethodResultSchema,
    jeonwang: MethodResultSchema,
  }),
  final: z.object({
    primary: ElementSchema,
    secondary: ElementSchema.nullable(),
    xiSin: z.array(ElementSchema),
    giSin: z.array(ElementSchema),
    method: z.string(),
    reasoning: z.string(),
  }),
});

// ── 출생 정보 ──

const BirthInfoSchema = z.object({
  solar: z.string(),
  time: z.string().nullable(),
  adjustedTime: z.string().nullable(),
  city: z.string(),
  offsetMinutes: z.number(),
});

// ── 신살 ──

const SinsalEntrySchema = z.object({
  name: z.string(),
  position: z.string(),
});

const SibiiSinsalEntrySchema = z.object({
  name: z.string(),
});

// ── 대운/세운 ──

const PeriodAnalysisSchema = z.object({
  ganTenGod: TenGodNameSchema,
  jiTenGod: TenGodNameSchema,
  yongSinRelation: z.enum(['희신', '기신', '중립']),
  cheonganHaps: z.array(CheonganHapSchema),
  jijiRelations: z.array(JijiRelationSchema),
  score: z.number().min(0).max(100),
  rating: z.enum(['대길', '길', '평', '흉', '대흉']),
});

const DaeunPeriodSchema = z.object({
  index: z.number(),
  startAge: z.number(),
  endAge: z.number(),
  gan: z.string().length(1),
  ji: z.string().length(1),
  analysis: PeriodAnalysisSchema,
  sinsal: z.array(SibiiSinsalEntrySchema),
});

const DaeunSchema = z.object({
  direction: z.enum(['순행', '역행']),
  startAge: z.number(),
  periods: z.array(DaeunPeriodSchema),
}).nullable();

const SeUnYearSchema = z.object({
  year: z.number(),
  gan: z.string().length(1),
  ji: z.string().length(1),
  analysis: PeriodAnalysisSchema,
  sinsal: z.array(SibiiSinsalEntrySchema),
});

// ── 오행 분석 ──

const WangSangStateSchema = z.enum(['旺', '相', '休', '囚', '死']);

const OhengCountSchema = z.object({
  element: ElementSchema,
  count: z.number(),
  withJijanggan: z.number(),
  includesMonthBranch: z.boolean(),
  state: WangSangStateSchema,
});

const OhengStatusSchema = z.object({
  element: ElementSchema,
  level: z.enum(['발달', '과다', '고립', '보통', '부족']),
  description: z.string(),
});

const JijiHapSchema = z.object({
  type: z.enum(['육합', '삼합', '방합', '반합']),
  branches: z.array(z.string()),
  positions: z.array(z.string()),
  hwaElement: ElementSchema,
});

const CheonganChungSchema = z.object({
  stem1: z.string(),
  stem2: z.string(),
  position1: z.string(),
  position2: z.string(),
});

const OhengAnalysisSchema = z.object({
  counts: z.array(OhengCountSchema),
  statuses: z.array(OhengStatusSchema),
  monthElement: ElementSchema,
});

// ── 연애운 ──

const LoveReadingSchema = z.object({
  spouseHouse: z.object({
    dayJi: z.string(),
    branchType: z.enum(['생지', '왕지', '고지']),
    branchTypeLabel: z.string(),
    meetingStyle: z.string(),
    relationStyle: z.string(),
    dayJiLove: z.string(),
    goji: z.object({
      element: ElementSchema,
      stem: z.string(),
      desc: z.string(),
    }).optional(),
  }),
  loveStyle: z.object({
    dayGanElement: ElementSchema,
    dayGanLoveStyle: z.string(),
    spouseStarType: z.enum(['재성', '관성']),
    spouseStarElement: ElementSchema,
    jeongOrPyeon: z.enum(['jeong', 'pyeon']),
    jeongPyeonLabel: z.string(),
    jeongPyeonDesc: z.string(),
    hasDohwa: z.boolean(),
    hasHongyeom: z.boolean(),
    hasWonjin: z.boolean(),
    twelveStageDay: z.string(),
  }),
  idealPartner: z.object({
    element: ElementSchema,
    keywords: z.array(z.string()),
    personalityDesc: z.string(),
    yongsinElement: ElementSchema,
    yongsinDesc: z.string(),
    idealSajuFeatures: z.array(z.string()),
  }),
  timing: z.object({
    spouseStarDaeun: z.array(z.object({
      startAge: z.number(),
      endAge: z.number(),
      gan: z.string(),
      ji: z.string(),
      rating: z.string(),
    })),
    dohwaYears: z.array(z.number()),
  }),
});

// ── 금전운 ──

const JaeseongStrengthResultSchema = z.object({
  level: z.enum(['strong', 'moderate', 'weak']),
  count: z.number(),
  jijangganJeonggiCount: z.number(),
});

const MoneyReadingSchema = z.object({
  jaeseongGung: z.object({
    jaeseongElement: ElementSchema,
    primaryType: z.enum(['편재', '정재']).nullable(),
    pyeonjaeCount: z.number(),
    jeongjaeCount: z.number(),
    jaeseongStrength: JaeseongStrengthResultSchema,
    monthJiElement: ElementSchema,
    dayJiElement: ElementSchema,
  }),
  moneyStyle: z.object({
    dayGanElement: ElementSchema,
    earningStyle: z.string(),
    spendingStyle: z.string(),
    strengthJaeseong: z.object({
      label: z.string(),
      desc: z.string(),
    }),
    hasYeokma: z.boolean(),
    hasGwimungwan: z.boolean(),
    hasSiksangSaengjae: z.boolean(),
  }),
  timing: z.object({
    jaeseongDaeun: z.array(z.object({
      startAge: z.number(),
      endAge: z.number(),
      gan: z.string(),
      ji: z.string(),
      rating: z.string(),
    })),
    pyeonjaeSeunyears: z.array(z.number()),
    jeongjaeSeunyears: z.array(z.number()),
  }),
});

// ── 사업운 ──

const BusinessScoreBreakdownSchema = z.object({
  pyeonjae: z.number(),
  siksangSaengjae: z.number(),
  yeokma: z.number(),
  pyeongwanJehwa: z.number(),
  singang: z.number(),
  total: z.number(),
});

const BusinessReadingSchema = z.object({
  gwanJaeAnalysis: z.object({
    gwanseongElement: ElementSchema,
    gwanseongCount: z.number(),
    pyeongwanCount: z.number(),
    jeonggwanCount: z.number(),
    jaeseongElement: ElementSchema,
    jaeseongCount: z.number(),
    combination: z.enum(['관강재강', '관강재약', '관약재강', '관약재약']),
    combinationLabel: z.string(),
    combinationDesc: z.string(),
    businessScore: BusinessScoreBreakdownSchema,
  }),
  industryFit: z.object({
    yongsinElement: ElementSchema,
    recommended: z.array(z.string()),
    notRecommended: z.array(z.string()),
  }),
  timing: z.object({
    bestDaeun: z.array(z.object({
      startAge: z.number(),
      endAge: z.number(),
      gan: z.string(),
      ji: z.string(),
      rating: z.string(),
    })),
    cautionPeriods: z.array(z.object({
      type: z.enum(['비겁대운', '편관무제화']),
      startAge: z.number(),
      endAge: z.number(),
      gan: z.string(),
      ji: z.string(),
      reason: z.string(),
    })),
  }),
});

// ── 통합 스키마 ──

export const SajuResultSchema = z.object({
  /** 4기둥 */
  pillars: z.object({
    year: PillarSchema,
    month: PillarSchema,
    day: PillarSchema,
    hour: PillarSchema.nullable(),
  }),
  /** 출생 정보 */
  birth: BirthInfoSchema,
  /** 십성 */
  tenGods: TenGodsSchema,
  /** 지장간 */
  jijanggan: JijangganSchema,
  /** 십이운성 */
  twelveStages: z.object({
    year: z.string(),
    month: z.string(),
    day: z.string(),
    hour: z.string().nullable(),
  }),
  /** 신강/신약 */
  strength: DayMasterStrengthSchema,
  /** 격국 */
  gyeokGuk: GyeokGukSchema,
  /** 용신 */
  yongSin: YongSinSchema,
  /** 신살 (원국) */
  sinsal: z.array(SinsalEntrySchema),
  /** 대운 (성별 미입력 시 null) */
  daeun: DaeunSchema,
  /** 세운 (향후 10년) */
  seun: z.array(SeUnYearSchema),
  /** 오행 분석 (왕상휴수사 · 발달/과다/고립) */
  ohengAnalysis: OhengAnalysisSchema,
  /** 지지합 (육합·삼합·방합·반합) */
  jijiHap: z.array(JijiHapSchema),
  /** 천간충 */
  cheonganChung: z.array(CheonganChungSchema),
  /** 연애운 (성별 입력 시) */
  loveReading: LoveReadingSchema.optional(),
  /** 금전운 */
  moneyReading: MoneyReadingSchema.optional(),
  /** 사업운 */
  businessReading: BusinessReadingSchema.optional(),
});

export type SajuResult = z.infer<typeof SajuResultSchema>;
