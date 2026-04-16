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
  /** 신강/신약 */
  strength: DayMasterStrengthSchema,
  /** 격국 */
  gyeokGuk: GyeokGukSchema,
  /** 용신 */
  yongSin: YongSinSchema,
  /** 대운 (성별 미입력 시 null) */
  daeun: DaeunSchema,
  /** 세운 (향후 10년) */
  seun: z.array(SeUnYearSchema),
});

export type SajuResult = z.infer<typeof SajuResultSchema>;
