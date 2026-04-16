/**
 * 용신(用神) 추론 — 이석영 사주첩경 5법 병렬 출력
 *
 * 5가지 방법론을 모두 실행하고 종합하여 최종 용신을 도출한다.
 *   1. 억부용신 — 신강/신약 기준
 *   2. 조후용신 — 궁통보감 일간×월지 조후표
 *   3. 통관용신 — 두 오행 대립 시 중간 연결
 *   4. 병약용신 — 과다 오행 제어
 *   5. 전왕용신 — 종격 전용
 *
 * 출력은 "추정 용신"으로 표현. 확정적 단정 금지.
 */

import { StrengthLevel } from './day_master_strength';
import { GyeokGukType } from './gyeok_guk';
import { getMainStem, getJijanggan } from './jijanggan';
import { getTenGod } from './ten_gods';

// ── 오행 ──

type Element = '木' | '火' | '土' | '金' | '水';

const STEM_ELEMENT: Record<string, Element> = {
  '甲': '木', '乙': '木', '丙': '火', '丁': '火', '戊': '土',
  '己': '土', '庚': '金', '辛': '金', '壬': '水', '癸': '水',
};

const BRANCH_ELEMENT: Record<string, Element> = {
  '寅': '木', '卯': '木', '辰': '土', '巳': '火', '午': '火', '未': '土',
  '申': '金', '酉': '金', '戌': '土', '亥': '水', '子': '水', '丑': '土',
};

const GENERATES: Record<Element, Element> = { '木': '火', '火': '土', '土': '金', '金': '水', '水': '木' };
const GENERATED_BY: Record<Element, Element> = { '木': '水', '火': '木', '土': '火', '金': '土', '水': '金' };
const DESTROYS: Record<Element, Element> = { '木': '土', '火': '金', '土': '水', '金': '木', '水': '火' };
const DESTROYED_BY: Record<Element, Element> = { '木': '金', '火': '水', '土': '木', '金': '火', '水': '土' };

// ── 타입 ──

export interface MethodResult {
  applicable: boolean;
  primary: Element | null;
  secondary: Element | null;
  reasoning: string;
}

export interface YongSinResult {
  /** 5법 병렬 결과 */
  methods: {
    eokbu: MethodResult;    // 억부
    johu: MethodResult;     // 조후
    tonggwan: MethodResult; // 통관
    byeongyak: MethodResult; // 병약
    jeonwang: MethodResult; // 전왕
  };
  /** 최종 용신 (종합 판정) */
  final: {
    primary: Element;
    secondary: Element | null;
    xiSin: Element[];
    giSin: Element[];
    method: string;       // 최종 선택 근거 (예: "억부+조후 일치")
    reasoning: string;
  };
}

type Pillars = {
  year: { gan: string; ji: string };
  month: { gan: string; ji: string };
  day: { gan: string; ji: string };
  hour: { gan: string; ji: string } | null;
};

// ── 메인 ──

export function determineYongSin(
  dayStem: string,
  pillars: Pillars,
  strengthLevel: StrengthLevel,
  gyeokGukType: GyeokGukType,
): YongSinResult {
  const dayElement = STEM_ELEMENT[dayStem];

  const eokbu = calcEokbu(dayElement, strengthLevel);
  const johu = calcJohu(dayStem, pillars.month.ji);
  const tonggwan = calcTonggwan(dayElement, pillars);
  const byeongyak = calcByeongyak(dayElement, pillars);
  const jeonwang = calcJeonwang(dayElement, gyeokGukType);

  const methods = { eokbu, johu, tonggwan, byeongyak, jeonwang };
  const final = synthesize(dayElement, methods, strengthLevel);

  return { methods, final };
}

// ── 1. 억부용신 ──

function calcEokbu(dayElement: Element, level: StrengthLevel): MethodResult {
  if (level === '극강' || level === '신강') {
    const primary = GENERATES[dayElement];
    const secondary = DESTROYS[dayElement];
    return {
      applicable: true, primary, secondary,
      reasoning: `일간(${dayElement}) ${level} — 설기 ${primary}(식상) + ${secondary}(재성)`,
    };
  }
  if (level === '극약' || level === '신약') {
    const primary = GENERATED_BY[dayElement];
    const secondary = dayElement;
    return {
      applicable: true, primary, secondary,
      reasoning: `일간(${dayElement}) ${level} — 생조 ${primary}(인성) + ${secondary}(비겁)`,
    };
  }
  // 중화
  return {
    applicable: true, primary: dayElement, secondary: GENERATED_BY[dayElement],
    reasoning: `일간(${dayElement}) 중화 — 균형 유지, 일간+인성 보강`,
  };
}

// ── 2. 조후용신 (궁통보감 일간×월지 조후표) ──

interface JohuEntry {
  primary: string;      // 천간 (예: '丙')
  secondary?: string;   // 보조 천간
  reasoning: string;
}

/**
 * 궁통보감 조후표 — 일간(10) × 월지(12)
 * 각 일간이 해당 월에 가장 필요로 하는 천간(조후용신)
 */
const JOHU_TABLE: Record<string, Record<string, JohuEntry>> = {
  '甲': {
    '寅': { primary: '丙', secondary: '癸', reasoning: '초봄 아직 한냉, 丙火로 온난+癸水로 자윤' },
    '卯': { primary: '丙', secondary: '癸', reasoning: '중봄 목왕, 丙火로 설기+癸水 보조' },
    '辰': { primary: '壬', secondary: '庚', reasoning: '늦봄 토습, 壬水로 자윤+庚金으로 정리' },
    '巳': { primary: '癸', secondary: '丁', reasoning: '초여름 열기, 癸水로 냉각 필수' },
    '午': { primary: '癸', secondary: '丁', reasoning: '한여름 극열, 癸水 조후 최우선' },
    '未': { primary: '癸', secondary: '丙', reasoning: '늦여름 습열, 癸水로 냉각' },
    '申': { primary: '丙', secondary: '丁', reasoning: '초가을 금왕극목, 丙丁火로 금제어' },
    '酉': { primary: '丙', secondary: '丁', reasoning: '중가을 금성, 丙丁火로 온난+금제어' },
    '戌': { primary: '壬', secondary: '甲', reasoning: '늦가을 건조, 壬水로 자윤+甲木 보강' },
    '亥': { primary: '丙', secondary: '丁', reasoning: '초겨울 한냉, 丙火로 온난 필수' },
    '子': { primary: '丙', secondary: '丁', reasoning: '한겨울 극한, 丙火 조후 최우선' },
    '丑': { primary: '丙', secondary: '丁', reasoning: '늦겨울 한냉건조, 丙火로 온기' },
  },
  '乙': {
    '寅': { primary: '丙', secondary: '癸', reasoning: '초봄 한냉, 丙火 온난+癸水 자윤' },
    '卯': { primary: '丙', secondary: '癸', reasoning: '중봄 을목 강, 丙火 설기' },
    '辰': { primary: '癸', secondary: '丙', reasoning: '늦봄, 癸水 자윤+丙火 보조' },
    '巳': { primary: '癸', reasoning: '초여름, 癸水 냉각' },
    '午': { primary: '癸', secondary: '丙', reasoning: '한여름 극열, 癸水 조후 필수' },
    '未': { primary: '癸', secondary: '丙', reasoning: '늦여름 습열, 癸水 냉각' },
    '申': { primary: '丙', secondary: '癸', reasoning: '초가을 금극목, 丙火로 금제어' },
    '酉': { primary: '丙', secondary: '癸', reasoning: '중가을 금성, 丙火 보호' },
    '戌': { primary: '癸', secondary: '丙', reasoning: '늦가을, 癸水 자윤' },
    '亥': { primary: '丙', secondary: '戊', reasoning: '초겨울 한냉, 丙火 온난' },
    '子': { primary: '丙', reasoning: '한겨울, 丙火 조후 필수' },
    '丑': { primary: '丙', reasoning: '늦겨울 한냉, 丙火 온기' },
  },
  '丙': {
    '寅': { primary: '壬', secondary: '庚', reasoning: '봄 화세 성장, 壬水로 제어' },
    '卯': { primary: '壬', reasoning: '중봄 목생화, 壬水 제어' },
    '辰': { primary: '壬', secondary: '甲', reasoning: '늦봄, 壬水 제어+甲木 조력' },
    '巳': { primary: '壬', secondary: '庚', reasoning: '초여름 화왕, 壬水 냉각 필수' },
    '午': { primary: '壬', reasoning: '한여름 극열, 壬水 조후 최우선' },
    '未': { primary: '壬', secondary: '庚', reasoning: '늦여름 습열, 壬水 냉각' },
    '申': { primary: '壬', secondary: '甲', reasoning: '초가을, 壬水+甲木 보조' },
    '酉': { primary: '壬', secondary: '甲', reasoning: '중가을 금왕, 壬水 설기+甲木 생화' },
    '戌': { primary: '壬', secondary: '甲', reasoning: '늦가을, 壬水+甲木' },
    '亥': { primary: '甲', secondary: '壬', reasoning: '초겨울 수극화, 甲木 통관' },
    '子': { primary: '甲', secondary: '壬', reasoning: '한겨울 극한 수극화, 甲木 통관 필수' },
    '丑': { primary: '甲', secondary: '壬', reasoning: '늦겨울, 甲木 통관' },
  },
  '丁': {
    '寅': { primary: '甲', secondary: '庚', reasoning: '초봄, 甲木 생화+庚金 정리' },
    '卯': { primary: '甲', secondary: '庚', reasoning: '중봄, 甲木 생화' },
    '辰': { primary: '甲', secondary: '壬', reasoning: '늦봄, 甲木 생화+壬水 자윤' },
    '巳': { primary: '壬', secondary: '甲', reasoning: '초여름 화왕, 壬水 제어' },
    '午': { primary: '壬', secondary: '甲', reasoning: '한여름 극열, 壬水 조후' },
    '未': { primary: '壬', secondary: '甲', reasoning: '늦여름, 壬水 냉각' },
    '申': { primary: '甲', secondary: '壬', reasoning: '초가을, 甲木 생화' },
    '酉': { primary: '甲', secondary: '庚', reasoning: '중가을, 甲木 생화 필수' },
    '戌': { primary: '甲', secondary: '壬', reasoning: '늦가을, 甲木+壬水' },
    '亥': { primary: '甲', secondary: '庚', reasoning: '초겨울, 甲木 생화 필수' },
    '子': { primary: '甲', secondary: '庚', reasoning: '한겨울 극한, 甲木 생화 최우선' },
    '丑': { primary: '甲', secondary: '庚', reasoning: '늦겨울, 甲木 생화' },
  },
  '戊': {
    '寅': { primary: '丙', secondary: '甲', reasoning: '초봄 목극토, 丙火 통관' },
    '卯': { primary: '丙', secondary: '甲', reasoning: '중봄 목극토, 丙火 통관' },
    '辰': { primary: '甲', secondary: '丙', reasoning: '늦봄 토왕, 甲木 소토+丙火 보조' },
    '巳': { primary: '壬', secondary: '甲', reasoning: '초여름, 壬水 냉각' },
    '午': { primary: '壬', secondary: '甲', reasoning: '한여름 토조, 壬水 자윤 필수' },
    '未': { primary: '癸', secondary: '甲', reasoning: '늦여름 토습, 癸水+甲木' },
    '申': { primary: '丙', secondary: '癸', reasoning: '초가을, 丙火 온기' },
    '酉': { primary: '丙', secondary: '癸', reasoning: '중가을, 丙火 온기+癸水 자윤' },
    '戌': { primary: '甲', secondary: '壬', reasoning: '늦가을 토왕, 甲木 소토' },
    '亥': { primary: '丙', secondary: '甲', reasoning: '초겨울, 丙火 온난' },
    '子': { primary: '丙', secondary: '甲', reasoning: '한겨울 한냉, 丙火 조후 필수' },
    '丑': { primary: '丙', secondary: '甲', reasoning: '늦겨울, 丙火 온기' },
  },
  '己': {
    '寅': { primary: '丙', secondary: '甲', reasoning: '초봄, 丙火 온난+甲木 소토' },
    '卯': { primary: '丙', secondary: '甲', reasoning: '중봄, 丙火+甲木' },
    '辰': { primary: '甲', secondary: '癸', reasoning: '늦봄 토왕, 甲木 소토+癸水' },
    '巳': { primary: '癸', secondary: '丙', reasoning: '초여름, 癸水 냉각' },
    '午': { primary: '癸', secondary: '丙', reasoning: '한여름 토조, 癸水 조후 필수' },
    '未': { primary: '癸', secondary: '丙', reasoning: '늦여름 토습열, 癸水 냉각' },
    '申': { primary: '丙', secondary: '癸', reasoning: '초가을, 丙火+癸水' },
    '酉': { primary: '丙', secondary: '癸', reasoning: '중가을, 丙火 온기' },
    '戌': { primary: '甲', secondary: '癸', reasoning: '늦가을 토왕, 甲木 소토' },
    '亥': { primary: '丙', secondary: '甲', reasoning: '초겨울, 丙火 온난' },
    '子': { primary: '丙', secondary: '甲', reasoning: '한겨울, 丙火 필수' },
    '丑': { primary: '丙', secondary: '甲', reasoning: '늦겨울, 丙火 온기' },
  },
  '庚': {
    '寅': { primary: '丙', secondary: '甲', reasoning: '초봄, 丙火 단련(연금)+甲木' },
    '卯': { primary: '丁', secondary: '甲', reasoning: '중봄, 丁火 정련' },
    '辰': { primary: '甲', secondary: '丁', reasoning: '늦봄 토생금, 甲木+丁火 정련' },
    '巳': { primary: '壬', secondary: '戊', reasoning: '초여름 화극금, 壬水 냉각' },
    '午': { primary: '壬', secondary: '癸', reasoning: '한여름 극열 화극금, 壬水 조후 필수' },
    '未': { primary: '壬', secondary: '癸', reasoning: '늦여름, 壬水 냉각' },
    '申': { primary: '丁', secondary: '甲', reasoning: '초가을 금왕, 丁火 정련+甲木 연료' },
    '酉': { primary: '丁', secondary: '甲', reasoning: '중가을 금왕, 丁火 정련 필수' },
    '戌': { primary: '甲', secondary: '壬', reasoning: '늦가을, 甲木+壬水' },
    '亥': { primary: '丁', secondary: '甲', reasoning: '초겨울, 丁火 온난+정련' },
    '子': { primary: '丁', secondary: '丙', reasoning: '한겨울, 丁火 온기 필수' },
    '丑': { primary: '丁', secondary: '丙', reasoning: '늦겨울, 丁火 온기' },
  },
  '辛': {
    '寅': { primary: '壬', secondary: '甲', reasoning: '초봄, 壬水 세금(洗金)+甲木' },
    '卯': { primary: '壬', secondary: '甲', reasoning: '중봄, 壬水 세금' },
    '辰': { primary: '壬', secondary: '甲', reasoning: '늦봄, 壬水+甲木' },
    '巳': { primary: '壬', secondary: '癸', reasoning: '초여름 화극금, 壬水 냉각' },
    '午': { primary: '壬', secondary: '癸', reasoning: '한여름 극열, 壬水 조후 필수' },
    '未': { primary: '壬', secondary: '癸', reasoning: '늦여름, 壬水 냉각' },
    '申': { primary: '壬', secondary: '甲', reasoning: '초가을 금왕, 壬水 설기' },
    '酉': { primary: '壬', secondary: '甲', reasoning: '중가을 금왕, 壬水 설기 필수' },
    '戌': { primary: '壬', secondary: '甲', reasoning: '늦가을, 壬水+甲木' },
    '亥': { primary: '丙', secondary: '壬', reasoning: '초겨울, 丙火 온난' },
    '子': { primary: '丙', secondary: '壬', reasoning: '한겨울, 丙火 온기 필수' },
    '丑': { primary: '丙', secondary: '壬', reasoning: '늦겨울 한냉, 丙火 온기' },
  },
  '壬': {
    '寅': { primary: '庚', secondary: '丙', reasoning: '초봄 목설수, 庚金 생수+丙火 온기' },
    '卯': { primary: '庚', secondary: '丙', reasoning: '중봄 목설수, 庚金 보강' },
    '辰': { primary: '甲', secondary: '庚', reasoning: '늦봄 토극수, 甲木 제토+庚金 생수' },
    '巳': { primary: '壬', secondary: '庚', reasoning: '초여름 화열, 壬水 비겁 보강+庚金 생수' },
    '午': { primary: '庚', secondary: '壬', reasoning: '한여름 극열, 庚金 생수+壬水 보강 필수' },
    '未': { primary: '庚', secondary: '辛', reasoning: '늦여름 토극수, 庚辛金 생수' },
    '申': { primary: '甲', secondary: '庚', reasoning: '초가을 금왕생수, 甲木 설기 필수' },
    '酉': { primary: '甲', secondary: '庚', reasoning: '중가을 금왕, 甲木 설기+庚金 보조' },
    '戌': { primary: '甲', secondary: '丙', reasoning: '늦가을, 甲木 설기+丙火 온기' },
    '亥': { primary: '丙', secondary: '甲', reasoning: '초겨울 수왕, 丙火 온난+甲木 설기' },
    '子': { primary: '丙', secondary: '甲', reasoning: '한겨울 극한 수왕, 丙火 조후 최우선' },
    '丑': { primary: '丙', secondary: '甲', reasoning: '늦겨울 한냉, 丙火 온기+甲木 설기' },
  },
  '癸': {
    '寅': { primary: '辛', secondary: '丙', reasoning: '초봄 목설수, 辛金 생수+丙火 온기' },
    '卯': { primary: '庚', secondary: '辛', reasoning: '중봄 목설수, 庚辛金 생수' },
    '辰': { primary: '丙', secondary: '辛', reasoning: '늦봄 토극수, 丙火 온기+辛金 생수' },
    '巳': { primary: '辛', secondary: '壬', reasoning: '초여름, 辛金 생수' },
    '午': { primary: '庚', secondary: '辛', reasoning: '한여름, 庚辛金 생수 필수' },
    '未': { primary: '庚', secondary: '辛', reasoning: '늦여름, 庚辛金 생수' },
    '申': { primary: '丁', secondary: '甲', reasoning: '초가을 금왕, 丁火 제금+甲木 생화' },
    '酉': { primary: '丁', secondary: '丙', reasoning: '중가을 금왕, 丁火 제금' },
    '戌': { primary: '辛', secondary: '丙', reasoning: '늦가을, 辛金 생수+丙火' },
    '亥': { primary: '丙', secondary: '辛', reasoning: '초겨울 수왕, 丙火 온난' },
    '子': { primary: '丙', secondary: '辛', reasoning: '한겨울, 丙火 조후 최우선' },
    '丑': { primary: '丙', secondary: '辛', reasoning: '늦겨울, 丙火 온기' },
  },
};

const BRANCH_KOREAN: Record<string, string> = {
  '子': '자', '丑': '축', '寅': '인', '卯': '묘', '辰': '진', '巳': '사',
  '午': '오', '未': '미', '申': '신', '酉': '유', '戌': '술', '亥': '해',
};

function calcJohu(dayStem: string, monthJi: string): MethodResult {
  const stemKr = dayStem;
  const entry = JOHU_TABLE[dayStem]?.[monthJi];

  if (!entry) {
    return { applicable: false, primary: null, secondary: null, reasoning: '조후표 데이터 없음' };
  }

  const primaryElement = STEM_ELEMENT[entry.primary];
  const secondaryElement = entry.secondary ? STEM_ELEMENT[entry.secondary] : null;

  return {
    applicable: true,
    primary: primaryElement,
    secondary: secondaryElement,
    reasoning: `궁통보감 ${stemKr}일간 ${BRANCH_KOREAN[monthJi]}월: ${entry.primary}${entry.secondary ? '/' + entry.secondary : ''} — ${entry.reasoning}`,
  };
}

// ── 3. 통관용신 ──

function calcTonggwan(dayElement: Element, pillars: Pillars): MethodResult {
  const counts = countElements(pillars);
  const keMeElement = DESTROYED_BY[dayElement];

  if (counts[keMeElement] >= 3) {
    const tonggwan = GENERATED_BY[dayElement];
    return {
      applicable: true, primary: tonggwan, secondary: null,
      reasoning: `${keMeElement}(관살) ${counts[keMeElement]}개 과다 — ${tonggwan}(인성)이 통관: ${keMeElement}->${tonggwan}->${dayElement}`,
    };
  }

  return { applicable: false, primary: null, secondary: null, reasoning: '오행 대립 없음, 통관 불필요' };
}

// ── 4. 병약용신 ──

function calcByeongyak(dayElement: Element, pillars: Pillars): MethodResult {
  const counts = countElements(pillars);

  for (const [element, count] of Object.entries(counts) as [Element, number][]) {
    if (count >= 4 && element !== dayElement) {
      const cure = DESTROYED_BY[element];
      return {
        applicable: true, primary: cure, secondary: null,
        reasoning: `${element} 오행 과다(${count}개) — ${cure}로 제어하여 균형 회복`,
      };
    }
  }

  return { applicable: false, primary: null, secondary: null, reasoning: '과다 오행 없음, 병약 불필요' };
}

// ── 5. 전왕용신 ──

function calcJeonwang(dayElement: Element, gyeokGukType: GyeokGukType): MethodResult {
  if (gyeokGukType === '종강격' || gyeokGukType === '종왕격') {
    return {
      applicable: true, primary: dayElement, secondary: GENERATED_BY[dayElement],
      reasoning: `${gyeokGukType} — 강한 비겁/인성을 따름: ${dayElement}(비겁)+${GENERATED_BY[dayElement]}(인성)`,
    };
  }
  if (gyeokGukType === '종아격') {
    const s = GENERATES[dayElement];
    return { applicable: true, primary: s, secondary: DESTROYS[dayElement],
      reasoning: `종아격 — 식상을 따름: ${s}(식상)+${DESTROYS[dayElement]}(재성)` };
  }
  if (gyeokGukType === '종재격') {
    const j = DESTROYS[dayElement];
    return { applicable: true, primary: j, secondary: GENERATES[dayElement],
      reasoning: `종재격 — 재성을 따름: ${j}(재성)+${GENERATES[dayElement]}(식상)` };
  }
  if (gyeokGukType === '종살격') {
    const g = DESTROYED_BY[dayElement];
    return { applicable: true, primary: g, secondary: DESTROYS[dayElement],
      reasoning: `종살격 — 관살을 따름: ${g}(관살)+${DESTROYS[dayElement]}(재성)` };
  }

  return { applicable: false, primary: null, secondary: null, reasoning: '종격 아님' };
}

// ── 종합 ──

function synthesize(
  dayElement: Element,
  methods: YongSinResult['methods'],
  strengthLevel: StrengthLevel,
): YongSinResult['final'] {
  // 1. 전왕 적용 시 무조건 우선
  if (methods.jeonwang.applicable && methods.jeonwang.primary) {
    return buildFinal(methods.jeonwang.primary, methods.jeonwang.secondary, dayElement,
      '전왕', methods.jeonwang.reasoning);
  }

  // 2. 병약 적용 시 높은 우선순위
  if (methods.byeongyak.applicable && methods.byeongyak.primary) {
    return buildFinal(methods.byeongyak.primary, methods.byeongyak.secondary, dayElement,
      '병약', methods.byeongyak.reasoning);
  }

  // 3. 억부와 조후 종합
  const eokbu = methods.eokbu;
  const johu = methods.johu;

  if (johu.applicable && johu.primary && eokbu.primary) {
    if (johu.primary === eokbu.primary) {
      // 억부와 조후 일치 — 확신도 높음
      return buildFinal(johu.primary, eokbu.secondary ?? johu.secondary, dayElement,
        '억부+조후 일치', `${eokbu.reasoning} / ${johu.reasoning}`);
    }

    // 불일치 시: 조후 우선 (사주첩경 기준 조후를 억부보다 우선시)
    // 다만 통관이 적용되면 통관을 고려
    if (methods.tonggwan.applicable && methods.tonggwan.primary) {
      return buildFinal(methods.tonggwan.primary, johu.primary, dayElement,
        '통관+조후', `${methods.tonggwan.reasoning} / 조후: ${johu.reasoning}`);
    }

    return buildFinal(johu.primary, eokbu.primary, dayElement,
      '조후 우선(억부 보조)', `조후: ${johu.reasoning} / 억부: ${eokbu.reasoning}`);
  }

  // 4. 통관 적용
  if (methods.tonggwan.applicable && methods.tonggwan.primary) {
    return buildFinal(methods.tonggwan.primary, eokbu.primary, dayElement,
      '통관', methods.tonggwan.reasoning);
  }

  // 5. 억부만
  return buildFinal(eokbu.primary!, eokbu.secondary, dayElement,
    '억부', eokbu.reasoning);
}

function buildFinal(
  primary: Element, secondary: Element | null, dayElement: Element,
  method: string, reasoning: string,
): YongSinResult['final'] {
  // 희신: 용신 + 용신을 생하는 오행
  const xiSin: Element[] = [primary];
  if (secondary && secondary !== primary) xiSin.push(secondary);
  const gen = GENERATED_BY[primary];
  if (gen && !xiSin.includes(gen)) xiSin.push(gen);

  // 기신: 용신을 극하는 오행 + 일간에 해로운 오행
  const giSin: Element[] = [DESTROYED_BY[primary]];
  if (primary !== dayElement && primary !== GENERATED_BY[dayElement]) {
    // 비겁/인성이 아닌 용신이면 비겁/인성이 기신
    const bi = dayElement;
    const in_ = GENERATED_BY[dayElement];
    if (!xiSin.includes(bi)) giSin.push(bi);
    if (!xiSin.includes(in_)) giSin.push(in_);
  }

  return {
    primary, secondary, xiSin: [...new Set(xiSin)], giSin: [...new Set(giSin)],
    method, reasoning,
  };
}

// ── 헬퍼 ──

function countElements(pillars: Pillars): Record<Element, number> {
  const counts: Record<Element, number> = { '木': 0, '火': 0, '土': 0, '金': 0, '水': 0 };
  const stems = [pillars.year.gan, pillars.month.gan, pillars.day.gan];
  if (pillars.hour) stems.push(pillars.hour.gan);
  const branches = [pillars.year.ji, pillars.month.ji, pillars.day.ji];
  if (pillars.hour) branches.push(pillars.hour.ji);
  for (const s of stems) counts[STEM_ELEMENT[s]]++;
  for (const b of branches) counts[BRANCH_ELEMENT[b]]++;
  return counts;
}
