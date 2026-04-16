/**
 * 격국(格局) 판단
 *
 * 이석영 사주첩경 기준, gyeokguk-checklist.md 판정 절차 준수.
 *
 * 판정 순서:
 *   1단계: 외격 성립 여부 (종격)
 *   2단계: 특수 내격 (건록격·양인격)
 *   3단계: 일반 내격 (월지 지장간 투출 기준)
 *   4단계: 파격·합거·충격·형해 검증
 */

import { getTenGod, TenGodName } from './ten_gods';
import { getMainStem, getJijanggan } from './jijanggan';
import { analyzeDayMasterStrength, StrengthLevel } from './day_master_strength';
import { detectCheonganHap, detectJijiRelations, getMonthBranchDamage } from './relations';

// TODO: 화격(化格) 판정 — 천간합화 + 월령 득 + 극 없음 조건 (실전 매우 드묾)
// TODO: 진종(眞從) vs 가종(假從) 구분 — 미약한 비겁·인성 유무에 따른 세분화

// ── 타입 ──

export type GyeokGukType =
  | '정관격' | '편관격' | '정인격' | '편인격'
  | '식신격' | '상관격' | '정재격' | '편재격'
  | '건록격' | '양인격'
  | '종강격' | '종왕격' | '종아격' | '종재격' | '종살격'
  | '화격'
  | '중화격';

export type GyeokState = '성격' | '파격' | '약화';

export interface GyeokGukResult {
  type: GyeokGukType;
  category: '내격' | '외격';
  state: GyeokState;
  breakCauses: string[];
  /** 약화 원인 (합거·형해 등). state가 '약화'일 때 채워짐 */
  weakenedBy: string[];
  basis: {
    method: '투출' | '본기' | '건록' | '양인' | '종격' | '화격';
    sourceStem: string | null;
    sourcePosition: string | null;
  };
  monthMainTenGod: TenGodName;
  strengthLevel: StrengthLevel;
  warnings: string[];
}

type Pillars = {
  year: { gan: string; ji: string };
  month: { gan: string; ji: string };
  day: { gan: string; ji: string };
  hour: { gan: string; ji: string } | null;
};

// ── 상수 테이블 ──

const STEM_YIN: Record<string, boolean> = {
  '甲': false, '乙': true, '丙': false, '丁': true, '戊': false,
  '己': true, '庚': false, '辛': true, '壬': false, '癸': true,
};

/** 건록 지지 -> 천간 */
const GEONROK_MAP: Record<string, string> = {
  '寅': '甲', '卯': '乙', '巳': '丙', '午': '丁',
  '辰': '戊', '戌': '戊', '丑': '己', '未': '己',
  '申': '庚', '酉': '辛', '亥': '壬', '子': '癸',
};

/** 양인: 양간 -> 양인 지지 */
const YANGIN_MAP: Record<string, string> = {
  '甲': '卯', '丙': '午', '戊': '午', '庚': '酉', '壬': '子',
};

/** 천간합 짝 */
const CHEONGAN_HAP: Record<string, string> = {
  '甲': '己', '己': '甲',
  '乙': '庚', '庚': '乙',
  '丙': '辛', '辛': '丙',
  '丁': '壬', '壬': '丁',
  '戊': '癸', '癸': '戊',
};

/** 천간합 화오행 */
const HAP_HWA_ELEMENT: Record<string, string> = {
  '甲己': '土', '乙庚': '金', '丙辛': '水', '丁壬': '木', '戊癸': '火',
};

/** 지지충 짝 */
const JIJI_CHUNG: Record<string, string> = {
  '子': '午', '午': '子', '丑': '未', '未': '丑',
  '寅': '申', '申': '寅', '卯': '酉', '酉': '卯',
  '辰': '戌', '戌': '辰', '巳': '亥', '亥': '巳',
};

// ── 메인 함수 ──

export function determineGyeokGuk(dayStem: string, pillars: Pillars): GyeokGukResult {
  const strength = analyzeDayMasterStrength(dayStem, pillars);
  const allTenGodInfo = collectTenGods(dayStem, pillars);
  const warnings: string[] = [];
  const weakenedBy: string[] = [];

  // 1단계: 외격
  const ogyeok = checkOgyeok(dayStem, pillars, strength.level, allTenGodInfo);
  if (ogyeok) {
    return { ...ogyeok, weakenedBy, strengthLevel: strength.level, warnings };
  }

  // 2단계: 특수 내격 (건록/양인)
  const special = checkSpecialNaegyeok(dayStem, pillars);
  if (special) {
    const breakResult = verifyBreak(special.type, dayStem, pillars, special.basis.sourceStem);
    return {
      ...special,
      ...breakResult,
      weakenedBy,
      strengthLevel: strength.level,
      warnings,
    };
  }

  // 3단계: 일반 내격 (투출 기준)
  const naegyeok = determineNaegyeok(dayStem, pillars);

  // 4단계: 파격/합거/충격/형해 검증
  const breakResult = verifyBreak(naegyeok.type, dayStem, pillars, naegyeok.basis.sourceStem);

  // 합거 검출
  if (naegyeok.basis.sourceStem) {
    const hapWarning = checkHapgeo(naegyeok.basis.sourceStem, naegyeok.basis.sourcePosition, dayStem, pillars);
    if (hapWarning) {
      warnings.push(hapWarning);
      weakenedBy.push(hapWarning);
    }
  }

  // 충격 검출
  const chungWarning = checkChung(pillars);
  if (chungWarning) warnings.push(chungWarning);

  // 월지 형/해 검출
  const jijiRelations = detectJijiRelations(pillars);
  const monthDamage = getMonthBranchDamage(jijiRelations);
  const hyeonghae = monthDamage.filter(d => d.type === '형' || d.type === '해');
  for (const d of hyeonghae) {
    const msg = `${d.ji1}${d.ji2}${d.type}(${d.position1}/${d.position2}): 월지 ${d.type}으로 격 약화`;
    warnings.push(msg);
    weakenedBy.push(msg);
  }

  // 파격이 아니고 약화 원인이 있으면 state를 '약화'로
  let finalState = breakResult.state;
  if (finalState !== '파격' && weakenedBy.length > 0) {
    finalState = '약화';
  }

  return {
    ...naegyeok,
    state: finalState,
    breakCauses: breakResult.breakCauses,
    weakenedBy,
    strengthLevel: strength.level,
    warnings,
  };
}

// ── 1단계: 외격 ──

interface TenGodCounts {
  bigeop: number; inseong: number; siksang: number; jae: number; gwan: number;
}

function collectTenGods(dayStem: string, pillars: Pillars): TenGodCounts {
  const otherStems = [pillars.year.gan, pillars.month.gan];
  if (pillars.hour) otherStems.push(pillars.hour.gan);

  const branches = [pillars.year.ji, pillars.month.ji, pillars.day.ji];
  if (pillars.hour) branches.push(pillars.hour.ji);

  const all: TenGodName[] = [];
  for (const stem of otherStems) {
    all.push(getTenGod(dayStem, stem));
  }
  for (const b of branches) {
    const ms = getMainStem(b);
    if (ms !== dayStem) all.push(getTenGod(dayStem, ms));
  }

  return {
    bigeop: all.filter(t => t === '비견' || t === '겁재').length,
    inseong: all.filter(t => t === '편인' || t === '정인').length,
    siksang: all.filter(t => t === '식신' || t === '상관').length,
    jae: all.filter(t => t === '편재' || t === '정재').length,
    gwan: all.filter(t => t === '편관' || t === '정관').length,
  };
}

function checkOgyeok(
  dayStem: string, pillars: Pillars, level: StrengthLevel, counts: TenGodCounts,
): Omit<GyeokGukResult, 'strengthLevel' | 'warnings'> | null {
  const monthMainTenGod = getMonthMainTenGod(dayStem, pillars);

  if (level === '극강') {
    if (counts.jae === 0 && counts.gwan === 0 && counts.siksang === 0) {
      const type: GyeokGukType = counts.inseong === 0 ? '종왕격' : '종강격';
      return {
        type, category: '외격', state: '성격', breakCauses: [], weakenedBy: [],
        basis: { method: '종격', sourceStem: null, sourcePosition: null },
        monthMainTenGod,
      };
    }
    return null;
  }

  if (level === '극약') {
    if (counts.bigeop > 0 || counts.inseong > 0) return null;

    let type: GyeokGukType;
    if (counts.siksang > counts.jae && counts.siksang > counts.gwan) {
      type = '종아격';
    } else if (counts.gwan > counts.jae) {
      type = '종살격';
    } else if (counts.jae > 0) {
      type = '종재격';
    } else {
      type = '종살격';
    }

    return {
      type, category: '외격', state: '성격', breakCauses: [], weakenedBy: [],
      basis: { method: '종격', sourceStem: null, sourcePosition: null },
      monthMainTenGod,
    };
  }

  return null;
}

// ── 2단계: 특수 내격 ──

function checkSpecialNaegyeok(
  dayStem: string, pillars: Pillars,
): Omit<GyeokGukResult, 'strengthLevel' | 'warnings' | 'state' | 'breakCauses' | 'weakenedBy'> | null {
  const monthJi = pillars.month.ji;
  const monthMainTenGod = getMonthMainTenGod(dayStem, pillars);

  if (GEONROK_MAP[monthJi] === dayStem) {
    return {
      type: '건록격', category: '내격',
      basis: { method: '건록', sourceStem: dayStem, sourcePosition: '월지' },
      monthMainTenGod,
    };
  }

  if (!STEM_YIN[dayStem] && YANGIN_MAP[dayStem] === monthJi) {
    return {
      type: '양인격', category: '내격',
      basis: { method: '양인', sourceStem: null, sourcePosition: '월지' },
      monthMainTenGod,
    };
  }

  return null;
}

// ── 3단계: 일반 내격 ──

function determineNaegyeok(
  dayStem: string, pillars: Pillars,
): Omit<GyeokGukResult, 'strengthLevel' | 'warnings' | 'state' | 'breakCauses' | 'weakenedBy'> {
  const monthJi = pillars.month.ji;
  const monthJijanggan = getJijanggan(monthJi);
  const monthMainTenGod = getMonthMainTenGod(dayStem, pillars);

  type Candidate = { stem: string; position: string; jjgPriority: number };
  const candidates: Candidate[] = [];

  addCandidates(candidates, pillars.month.gan, '월간', monthJijanggan, dayStem);
  addCandidates(candidates, pillars.year.gan, '연간', monthJijanggan, dayStem);
  if (pillars.hour) {
    addCandidates(candidates, pillars.hour.gan, '시간', monthJijanggan, dayStem);
  }

  const positionPriority = (pos: string) => pos === '월간' ? 0 : 1;
  candidates.sort((a, b) => {
    const posDiff = positionPriority(a.position) - positionPriority(b.position);
    if (posDiff !== 0) return posDiff;
    return a.jjgPriority - b.jjgPriority;
  });

  if (candidates.length > 0) {
    const best = candidates[0];
    const tenGod = getTenGod(dayStem, best.stem);
    const type = tenGodToGyeokGuk(tenGod);
    if (type) {
      return {
        type, category: '내격',
        basis: { method: '투출', sourceStem: best.stem, sourcePosition: best.position },
        monthMainTenGod,
      };
    }
  }

  const mainStem = getMainStem(monthJi);
  if (mainStem !== dayStem) {
    const tenGod = getTenGod(dayStem, mainStem);
    const type = tenGodToGyeokGuk(tenGod);
    if (type) {
      return {
        type, category: '내격',
        basis: { method: '본기', sourceStem: mainStem, sourcePosition: null },
        monthMainTenGod,
      };
    }
  }

  return {
    type: '중화격', category: '내격',
    basis: { method: '본기', sourceStem: null, sourcePosition: null },
    monthMainTenGod,
  };
}

function addCandidates(
  candidates: { stem: string; position: string; jjgPriority: number }[],
  ganStem: string, position: string,
  monthJijanggan: ReturnType<typeof getJijanggan>, dayStem: string,
) {
  for (let i = monthJijanggan.length - 1; i >= 0; i--) {
    const entry = monthJijanggan[i];
    if (entry.stem === dayStem) continue;
    if (entry.stem === ganStem) {
      candidates.push({ stem: entry.stem, position, jjgPriority: monthJijanggan.length - 1 - i });
      break;
    }
  }
}

function tenGodToGyeokGuk(tenGod: TenGodName): GyeokGukType | null {
  const map: Partial<Record<TenGodName, GyeokGukType>> = {
    '정관': '정관격', '편관': '편관격', '정인': '정인격', '편인': '편인격',
    '식신': '식신격', '상관': '상관격', '정재': '정재격', '편재': '편재격',
  };
  return map[tenGod] ?? null;
}

// ── 4단계: 파격/합거/충격 ──

function verifyBreak(
  type: GyeokGukType, dayStem: string, pillars: Pillars, _gyeokStem: string | null,
): { state: GyeokState; breakCauses: string[] } {
  const causes: string[] = [];

  // 천간합 검출 -> 합거된 천간 분리
  const cheonganHaps = detectCheonganHap(pillars);

  const otherGans: { stem: string; pos: string }[] = [
    { stem: pillars.year.gan, pos: '연간' },
    { stem: pillars.month.gan, pos: '월간' },
  ];
  if (pillars.hour) otherGans.push({ stem: pillars.hour.gan, pos: '시간' });

  const activeTenGods: TenGodName[] = [];
  const hapgeoTenGods: TenGodName[] = [];
  for (const g of otherGans) {
    const tenGod = getTenGod(dayStem, g.stem);
    const isHg = cheonganHaps.some(h =>
      (h.stem1 === g.stem && h.position1 === g.pos) ||
      (h.stem2 === g.stem && h.position2 === g.pos)
    );
    if (isHg) {
      hapgeoTenGods.push(tenGod);
    } else {
      activeTenGods.push(tenGod);
    }
  }

  // 파격: 활성 천간 기준. 합거에만 원인이 있으면 약화로 다운그레이드.
  let downgradeToWeakened = false;

  // 재극인 (정인격/편인격)
  if (type === '정인격' || type === '편인격') {
    const activeJae = activeTenGods.some(t => t === '편재' || t === '정재');
    const hapgeoJae = hapgeoTenGods.some(t => t === '편재' || t === '정재');
    if (activeJae) {
      causes.push('재극인(財克印): 재성이 인성을 극');
    } else if (hapgeoJae) {
      downgradeToWeakened = true;
    }
  }

  // 상관견관 (정관격)
  if (type === '정관격') {
    if (activeTenGods.includes('상관')) {
      causes.push('상관견관(傷官見官): 상관이 정관을 극');
    } else if (hapgeoTenGods.includes('상관')) {
      downgradeToWeakened = true;
    }
  }

  // 상관격 + 정관
  if (type === '상관격') {
    if (activeTenGods.includes('정관')) {
      causes.push('상관견관(傷官見官): 상관격에 정관이 노출');
    } else if (hapgeoTenGods.includes('정관')) {
      downgradeToWeakened = true;
    }
  }

  // 편인도식
  if (type === '식신격') {
    if (activeTenGods.includes('편인')) {
      causes.push('편인도식(偏印倒食): 편인이 식신을 극');
    } else if (hapgeoTenGods.includes('편인')) {
      downgradeToWeakened = true;
    }
  }

  // 비겁쟁재
  if (type === '정재격' || type === '편재격') {
    const activeBi = activeTenGods.some(t => t === '겁재' || t === '비견');
    const hapgeoBi = hapgeoTenGods.some(t => t === '겁재' || t === '비견');
    if (activeBi) {
      causes.push('비겁쟁재(比劫爭財): 비겁이 재성을 쟁탈');
    } else if (hapgeoBi) {
      downgradeToWeakened = true;
    }
  }

  // 편관무제
  if (type === '편관격') {
    const allTenGods = [...activeTenGods, ...hapgeoTenGods];
    const hasJehwa = allTenGods.includes('식신') || allTenGods.includes('정인') || allTenGods.includes('편인');
    if (!hasJehwa) {
      causes.push('편관무제(偏官無制): 칠살에 제화가 없음');
    }
  }

  if (causes.length > 0) {
    return { state: '파격', breakCauses: causes };
  }
  if (downgradeToWeakened) {
    return { state: '약화', breakCauses: [] };
  }
  return { state: '성격', breakCauses: [] };
}

/** 합거 확인: 격을 이루는 글자가 다른 천간과 합으로 묶이는지 */
function checkHapgeo(
  gyeokStem: string, sourcePosition: string | null,
  dayStem: string, pillars: Pillars,
): string | null {
  const hapPartner = CHEONGAN_HAP[gyeokStem];
  if (!hapPartner) return null;

  const allGans: { stem: string; pos: string }[] = [
    { stem: pillars.year.gan, pos: '연간' },
    { stem: pillars.month.gan, pos: '월간' },
    { stem: dayStem, pos: '일간' },
  ];
  if (pillars.hour) allGans.push({ stem: pillars.hour.gan, pos: '시간' });

  for (const g of allGans) {
    if (g.stem === hapPartner && g.pos !== sourcePosition) {
      const hapKey = [gyeokStem, hapPartner].sort().join('');
      const hwaElement = HAP_HWA_ELEMENT[hapKey];
      return `합거(合去): ${gyeokStem}${hapPartner}합 - 격 글자 ${gyeokStem}이(가) ${g.pos} ${hapPartner}과 합, 격 약화 (화오행: ${hwaElement || '?'})`;
    }
  }

  return null;
}

/** 충격 확인: 월지가 다른 지지에게 충을 당하는지 */
function checkChung(pillars: Pillars): string | null {
  const monthJi = pillars.month.ji;
  const chungPartner = JIJI_CHUNG[monthJi];
  if (!chungPartner) return null;

  const branches: { ji: string; pos: string }[] = [
    { ji: pillars.year.ji, pos: '연지' },
    { ji: pillars.day.ji, pos: '일지' },
  ];
  if (pillars.hour) branches.push({ ji: pillars.hour.ji, pos: '시지' });

  for (const b of branches) {
    if (b.ji === chungPartner) {
      return `충격(冲格): 월지 ${monthJi}이(가) ${b.pos} ${b.ji}과 ${monthJi}${b.ji}충 - 격 손상`;
    }
  }

  return null;
}

// ── 헬퍼 ──

function getMonthMainTenGod(dayStem: string, pillars: Pillars): TenGodName {
  const mainStem = getMainStem(pillars.month.ji);
  return mainStem === dayStem ? '비견' : getTenGod(dayStem, mainStem);
}
