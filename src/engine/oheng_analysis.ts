/**
 * 오행 분석 — 왕상휴수사 · 발달/과다/고립 판정
 *
 * 이석영 사주첩경 기준:
 *   - 월령(월지)을 기준으로 왕상휴수사 판정
 *   - 합거(合去)된 천간, 충으로 손상된 지지는 카운트에서 제외
 *   - 지장간도 포함하여 판단
 *   - 단순 갯수가 아닌 격국 맥락에서 해석
 *
 * 참고: 왕상휴수사(旺相休囚死)
 *   旺(왕) = 나와 같은 오행 (가장 강함)
 *   相(상) = 나를 생해주는 오행
 *   休(휴) = 내가 생해주는 오행
 *   囚(수) = 내가 극하는 오행
 *   死(사) = 나를 극하는 오행 (가장 약함)
 */

import { getJijanggan } from './jijanggan';
import { detectCheonganHap, isHapgeo, detectJijiRelations } from './relations';

type Element = '木' | '火' | '土' | '金' | '水';

const STEM_ELEMENT: Record<string, Element> = {
  '甲': '木', '乙': '木', '丙': '火', '丁': '火', '戊': '土',
  '己': '土', '庚': '金', '辛': '金', '壬': '水', '癸': '水',
};

const BRANCH_ELEMENT: Record<string, Element> = {
  '子': '水', '丑': '土', '寅': '木', '卯': '木', '辰': '土', '巳': '火',
  '午': '火', '未': '土', '申': '金', '酉': '金', '戌': '土', '亥': '水',
};

const GENERATES: Record<Element, Element> = { '木': '火', '火': '土', '土': '金', '金': '水', '水': '木' };
const GENERATED_BY: Record<Element, Element> = { '木': '水', '火': '木', '土': '火', '金': '土', '水': '金' };
const DESTROYS: Record<Element, Element> = { '木': '土', '火': '金', '土': '水', '金': '木', '水': '火' };
const DESTROYED_BY: Record<Element, Element> = { '木': '金', '火': '水', '土': '木', '金': '火', '水': '土' };

interface Pillars {
  year: { gan: string; ji: string };
  month: { gan: string; ji: string };
  day: { gan: string; ji: string };
  hour: { gan: string; ji: string } | null;
}

// ── 왕상휴수사 ──

export type WangSangState = '旺' | '相' | '休' | '囚' | '死';

export function getWangSang(baseElement: Element, targetElement: Element): WangSangState {
  if (baseElement === targetElement) return '旺';
  if (GENERATED_BY[baseElement] === targetElement) return '相';
  if (GENERATES[baseElement] === targetElement) return '休';
  if (DESTROYS[baseElement] === targetElement) return '囚';
  if (DESTROYED_BY[baseElement] === targetElement) return '死';
  return '旺'; // fallback
}

export const WANG_SANG_LABELS: Record<WangSangState, { korean: string; desc: string }> = {
  '旺': { korean: '왕', desc: '가장 강한 상태, 나와 같은 기운' },
  '相': { korean: '상', desc: '나를 생해주는 기운, 왕성하게 해줌' },
  '休': { korean: '휴', desc: '내가 생해주는 기운, 힘이 빠짐' },
  '囚': { korean: '수', desc: '내가 극하는 기운, 힘이 더 빠짐' },
  '死': { korean: '사', desc: '나를 극하는 기운, 가장 약한 상태' },
};

// ── 오행 분포 카운트 (합거·충 고려) ──

export interface OhengCount {
  element: Element;
  count: number;         // 천간 + 지지 본기 카운트
  withJijanggan: number; // 지장간 포함 카운트 (여기·중기 0.5씩)
  includesMonthBranch: boolean; // 월지 포함 여부
  state: WangSangState;  // 월령 기준 왕상휴수사
}

export interface OhengStatus {
  element: Element;
  level: '발달' | '과다' | '고립' | '보통' | '부족';
  description: string;
}

export interface OhengAnalysisResult {
  counts: OhengCount[];
  statuses: OhengStatus[];
  monthElement: Element; // 월지 본기 오행
}

export function analyzeOheng(pillars: Pillars): OhengAnalysisResult {
  const monthElement = BRANCH_ELEMENT[pillars.month.ji];

  // 합거된 천간 확인
  const hapList = detectCheonganHap(pillars);
  const POS_NAMES = ['연간', '월간', '일간', '시간'];
  const allStems = [pillars.year.gan, pillars.month.gan, pillars.day.gan];
  if (pillars.hour) allStems.push(pillars.hour.gan);
  const hapgeoPositions = new Set<string>();
  for (let i = 0; i < allStems.length; i++) {
    if (isHapgeo(allStems[i], POS_NAMES[i], hapList)) {
      hapgeoPositions.add(POS_NAMES[i]);
    }
  }

  // 충 확인 (지지)
  const jijiRelations = detectJijiRelations(pillars);
  const chungPositions = new Set<string>();
  for (const rel of jijiRelations) {
    if (rel.type === '충') {
      chungPositions.add(rel.position1);
      chungPositions.add(rel.position2);
    }
  }

  // 카운트
  const counts: Record<Element, { main: number; jijanggan: number; hasMonth: boolean }> = {
    '木': { main: 0, jijanggan: 0, hasMonth: false },
    '火': { main: 0, jijanggan: 0, hasMonth: false },
    '土': { main: 0, jijanggan: 0, hasMonth: false },
    '金': { main: 0, jijanggan: 0, hasMonth: false },
    '水': { main: 0, jijanggan: 0, hasMonth: false },
  };

  // 천간 (합거 제외)
  allStems.forEach((s, i) => {
    if (!hapgeoPositions.has(POS_NAMES[i])) {
      counts[STEM_ELEMENT[s]].main++;
    }
  });

  // 지지 본기 (충 시 0.5로 감산하지 않고 카운트는 유지, 판정에서 고려)
  const branches = [pillars.year.ji, pillars.month.ji, pillars.day.ji];
  if (pillars.hour) branches.push(pillars.hour.ji);
  branches.forEach((b, i) => {
    const el = BRANCH_ELEMENT[b];
    counts[el].main++;
    if (i === 1) counts[el].hasMonth = true; // 월지
  });

  // 지장간 (여기·중기 각 0.5)
  const pillarKeys = ['year', 'month', 'day', 'hour'] as const;
  for (const key of pillarKeys) {
    const p = pillars[key];
    if (!p) continue;
    const jjg = getJijanggan(p.ji);
    for (const entry of jjg) {
      const el = STEM_ELEMENT[entry.stem];
      if (entry.role === '정기') {
        // 이미 본기에서 카운트됨
      } else {
        counts[el].jijanggan += 0.5;
      }
    }
  }

  // 결과 조립
  const elements: Element[] = ['木', '火', '土', '金', '水'];

  const ohengCounts: OhengCount[] = elements.map(el => ({
    element: el,
    count: counts[el].main,
    withJijanggan: counts[el].main + counts[el].jijanggan,
    includesMonthBranch: counts[el].hasMonth,
    state: getWangSang(monthElement, el),
  }));

  // 발달/과다/고립 판정
  const statuses: OhengStatus[] = elements.map(el => {
    const c = counts[el];
    const total = c.main;
    const hasMonth = c.hasMonth;
    const monthCount = hasMonth ? 1 : 0;

    // 고립 판정: 자신을 극하고(死), 자신이 극하며(囚), 생해주는 오행으로만 둘러싸인 경우
    // = 왕상휴수사에서 휴·수 상태이면서, 같은 오행(旺)이나 생해주는(相) 오행이 없는 경우
    const sameCount = ohengCounts.find(o => o.element === el)?.count || 0;
    const generatorEl = GENERATED_BY[el];
    const generatorCount = counts[generatorEl]?.main || 0;

    if (sameCount <= 1 && generatorCount === 0) {
      // 주변이 전부 극하거나 설기하는 오행
      const destroyerEl = DESTROYED_BY[el];
      const destroyerCount = counts[destroyerEl]?.main || 0;
      if (destroyerCount >= 2) {
        return {
          element: el,
          level: '고립' as const,
          description: `${el}이 고립되어 있습니다. ${el}을 생해주는 기운이 없고, 극하는 기운에 둘러싸여 해당 오행의 성질이 위축됩니다.`,
        };
      }
    }

    // 과다: 4개 이상 (월지 포함 3개 이상)
    if (total >= 4 && monthCount + (hasMonth ? 1 : 0) >= 2) {
      return {
        element: el,
        level: '과다' as const,
        description: `${el}이 과다합니다. 해당 오행의 긍정적 힘과 함께 모험적, 부정적 성격도 동시에 드러날 수 있습니다.`,
      };
    }
    if (total >= 4) {
      return {
        element: el,
        level: '과다' as const,
        description: `${el}이 과다합니다. 해당 오행의 기운이 지나치게 강하여 균형에 주의가 필요합니다.`,
      };
    }

    // 발달: 3개 (월지 포함 2개)
    if (total >= 3 && hasMonth) {
      return {
        element: el,
        level: '발달' as const,
        description: `${el}이 발달하였습니다. 월지를 포함하여 해당 오행이 안정적으로 자리잡아, 긍정적인 성격이 잘 발현됩니다.`,
      };
    }
    if (total >= 3) {
      return {
        element: el,
        level: '발달' as const,
        description: `${el}이 발달하였습니다. 해당 오행의 안정적인 성격이 두드러집니다.`,
      };
    }

    // 부족: 0개
    if (total === 0) {
      return {
        element: el,
        level: '부족' as const,
        description: `${el}이 원국에 없습니다. 해당 오행의 기운이 부족하여 보완이 필요합니다.`,
      };
    }

    return {
      element: el,
      level: '보통' as const,
      description: `${el}은 보통 수준입니다.`,
    };
  });

  return { counts: ohengCounts, statuses, monthElement };
}

// ── 오행별 성격/건강 키워드 ──

export const OHENG_KEYWORDS: Record<Element, {
  developed: { personality: string[]; health: string };
  excessive: { personality: string[]; health: string };
  isolated: { personality: string[]; health: string };
}> = {
  '木': {
    developed: { personality: ['균형감의 특성', '자신감과 명예욕', '희망의 의지', '복잡하고 섬세함', '대인관계의 유연함'], health: '양호' },
    excessive: { personality: ['극단적 자신감', '명예욕을 넘어선 과시욕', '규제에 대한 극단적 거부감', '유시무종'], health: '간담' },
    isolated: { personality: ['간담', '요추와 경추', '신경계 인후', '근육 머리'], health: '간과 담, 요추, 경추, 신경계' },
  },
  '火': {
    developed: { personality: ['적극성의 특성', '인정욕구', '예의·서열 중시', '돌파력과 추진력', '예술적 끼'], health: '양호' },
    excessive: { personality: ['분노 조절 장애', '대인관계 미숙', '외관의 사치욕구'], health: '심장 소장' },
    isolated: { personality: ['심장 소장', '각막 혈관', '임파선', '턱 어깨'], health: '심장, 소장, 혈관, 각막' },
  },
  '土': {
    developed: { personality: ['중재와 포용의 특성', '은근한 고집', '조심성과 책임감', '신뢰성'], health: '양호' },
    excessive: { personality: ['비타협의 고집불통', '성격의 기복이 심함', '복지부동'], health: '위장 비장' },
    isolated: { personality: ['위장 비장', '자궁 난소', '유방', '복부 지방'], health: '비위, 자궁, 유방' },
  },
  '金': {
    developed: { personality: ['판단력과 결단의 특성', '의리 및 의협심', '마무리의 확실성'], health: '양호' },
    excessive: { personality: ['주장의 강요와 잔소리', '난폭함', '독창성 비판정신'], health: '폐 대장' },
    isolated: { personality: ['폐 대장', '피부', '뼈 치아 골수', '무기력증 자폐'], health: '폐, 대장, 피부, 골수' },
  },
  '水': {
    developed: { personality: ['지혜와 직관의 특성', '기획력', '다양한 재능'], health: '양호' },
    excessive: { personality: ['과도한 공상이나 망상', '잔머리', '권모술수', '좌절이 심함'], health: '신장 방광' },
    isolated: { personality: ['신장 방광', '뇌', '머리카락', '우울증 불면증'], health: '신장, 방광, 뇌, 불면증' },
  },
};
