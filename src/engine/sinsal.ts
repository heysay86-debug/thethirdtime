/**
 * 신살(神殺) 계산 모듈 — M14.6
 *
 * 이석영『사주첩경』기준 33종 신살 판정 (Layer 1: Engine/LLM용)
 * + 통용 기준 확장 + 추가 신살 (Layer 2: Display/UI용)
 *
 * A. 귀인성 8종: 천을귀인, 문창귀인, 문곡귀인, 천복귀인, 천주귀인, 태극귀인, 학당귀인, 천덕귀인, 월덕귀인
 * B. 살성·특수 10종: 역마살, 화개살, 백호살, 원진살, 괴강살, 양인살, 홍염살, 현침살, 귀문관살, 낙정관살
 * C. 록 관련 3종: 금여록, 암록, 협록
 * D. 공망 1종
 * E. 십이신살 12종 (대운·세운용): 겁살, 재살, 천살, 지살, 연살, 월살, 망신살, 장성살, 반안살, 역마살, 육해살, 화개살
 *
 * Layer 2 추가: 도화살, 고란살, 과숙살, 급각살
 */

// ── 상수 ──

const CHEONGAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'] as const;
const JIJI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'] as const;

type Pillar = { gan: string; ji: string };
type Pillars = {
  year: Pillar;
  month: Pillar;
  day: Pillar;
  hour: Pillar | null;
};

export interface SinsalEntry {
  name: string;
  position: string; // '연주' | '월주' | '일주' | '시주'
}

// ── Layer 2 types ──

export type SinsalCategory = 'sibiiSinsal' | 'gilsin' | 'hyungsin' | 'gita';

export interface DisplaySinsalEntry {
  name: string;
  position: string; // '연주' | '월주' | '일주' | '시주'
  category: SinsalCategory;
}

// ── 유틸 ──

function jiIdx(ji: string): number {
  return JIJI.indexOf(ji as typeof JIJI[number]);
}

function ganIdx(gan: string): number {
  return CHEONGAN.indexOf(gan as typeof CHEONGAN[number]);
}

/** 4주 지지 배열 반환 (시주 null이면 3주) */
function allJi(pillars: Pillars): { ji: string; pos: string }[] {
  const arr = [
    { ji: pillars.year.ji, pos: '연주' },
    { ji: pillars.month.ji, pos: '월주' },
    { ji: pillars.day.ji, pos: '일주' },
  ];
  if (pillars.hour) arr.push({ ji: pillars.hour.ji, pos: '시주' });
  return arr;
}

/** 4주 천간 배열 반환 */
function allGan(pillars: Pillars): { gan: string; pos: string }[] {
  const arr = [
    { gan: pillars.year.gan, pos: '연주' },
    { gan: pillars.month.gan, pos: '월주' },
    { gan: pillars.day.gan, pos: '일주' },
  ];
  if (pillars.hour) arr.push({ gan: pillars.hour.gan, pos: '시주' });
  return arr;
}

/** 4주의 모든 천간·지지 문자를 반환 */
function allGanJiChars(pillars: Pillars): { char: string; pos: string }[] {
  const arr: { char: string; pos: string }[] = [];
  const positions = [
    { pillar: pillars.year, pos: '연주' },
    { pillar: pillars.month, pos: '월주' },
    { pillar: pillars.day, pos: '일주' },
  ];
  if (pillars.hour) positions.push({ pillar: pillars.hour, pos: '시주' });

  for (const { pillar, pos } of positions) {
    arr.push({ char: pillar.gan, pos });
    arr.push({ char: pillar.ji, pos });
  }
  return arr;
}

// ══════════════════════════════════════════════
// A. 귀인성
// ══════════════════════════════════════════════

/**
 * 천을귀인(天乙貴人) — 일간 기준, 4주 지지 조회
 * 甲戊庚→丑未, 乙己→子申, 丙丁→亥酉, 壬癸→卯巳, 辛→午寅
 */
const CHEONUL_TABLE: Record<string, string[]> = {
  '甲': ['丑', '未'], '戊': ['丑', '未'], '庚': ['丑', '未'],
  '乙': ['子', '申'], '己': ['子', '申'],
  '丙': ['亥', '酉'], '丁': ['亥', '酉'],
  '壬': ['卯', '巳'], '癸': ['卯', '巳'],
  '辛': ['午', '寅'],
};

function findCheonulGwiin(dayStem: string, pillars: Pillars): SinsalEntry[] {
  const targets = CHEONUL_TABLE[dayStem] || [];
  return allJi(pillars)
    .filter(({ ji }) => targets.includes(ji))
    .map(({ pos }) => ({ name: '천을귀인', position: pos }));
}

/**
 * 문창귀인(文昌貴人) — 일간 기준, 4주 지지 조회
 * 甲→巳, 乙→午, 丙→申, 丁→酉, 戊→申, 己→酉, 庚→亥, 辛→子, 壬→寅, 癸→卯
 */
const MUNCHANG_TABLE: Record<string, string> = {
  '甲': '巳', '乙': '午', '丙': '申', '丁': '酉', '戊': '申',
  '己': '酉', '庚': '亥', '辛': '子', '壬': '寅', '癸': '卯',
};

function findMunchangGwiin(dayStem: string, pillars: Pillars): SinsalEntry[] {
  const target = MUNCHANG_TABLE[dayStem];
  if (!target) return [];
  return allJi(pillars)
    .filter(({ ji }) => ji === target)
    .map(({ pos }) => ({ name: '문창귀인', position: pos }));
}

/**
 * 문곡귀인(文曲貴人) — 일간 기준, 4주 지지 조회
 * 甲→亥, 乙→子(또는 午), 丙→寅, 丁→卯, 戊→寅, 己→卯, 庚→巳, 辛→午, 壬→申, 癸→酉
 * (사주첩경 기준)
 */
const MUNGOK_TABLE: Record<string, string> = {
  '甲': '亥', '乙': '午', '丙': '寅', '丁': '卯', '戊': '寅',
  '己': '卯', '庚': '巳', '辛': '午', '壬': '申', '癸': '酉',
};

function findMungokGwiin(dayStem: string, pillars: Pillars): SinsalEntry[] {
  const target = MUNGOK_TABLE[dayStem];
  if (!target) return [];
  return allJi(pillars)
    .filter(({ ji }) => ji === target)
    .map(({ pos }) => ({ name: '문곡귀인', position: pos }));
}

/**
 * 천복귀인(天福貴人) — 일간 기준, 4주 지지 조회
 * 甲→酉, 乙→申, 丙→子, 丁→亥, 戊→卯, 己→寅, 庚→午, 辛→巳, 壬→酉, 癸→申
 */
const CHEONBOK_TABLE: Record<string, string> = {
  '甲': '酉', '乙': '申', '丙': '子', '丁': '亥', '戊': '卯',
  '己': '寅', '庚': '午', '辛': '巳', '壬': '酉', '癸': '申',
};

function findCheonbokGwiin(dayStem: string, pillars: Pillars): SinsalEntry[] {
  const target = CHEONBOK_TABLE[dayStem];
  if (!target) return [];
  return allJi(pillars)
    .filter(({ ji }) => ji === target)
    .map(({ pos }) => ({ name: '천복귀인', position: pos }));
}

/**
 * 천주귀인(天廚貴人) — 일간 기준, 4주 지지 조회
 * 실제로 천주귀인 = 식신이 건록하는 지지
 * 甲→丙의 록 巳, 乙→丁의 록 午, 丙→戊의 록 巳, 丁→己의 록 午,
 * 戊→庚의 록 申, 己→辛의 록 酉, 庚→壬의 록 亥, 辛→癸의 록 子,
 * 壬→甲의 록 寅, 癸→乙의 록 卯
 */
const CHEONJU_TABLE: Record<string, string> = {
  '甲': '巳', '乙': '午', '丙': '巳', '丁': '午',
  '戊': '申', '己': '酉', '庚': '亥', '辛': '子',
  '壬': '寅', '癸': '卯',
};

function findCheonjuGwiin(dayStem: string, pillars: Pillars): SinsalEntry[] {
  const target = CHEONJU_TABLE[dayStem];
  if (!target) return [];
  return allJi(pillars)
    .filter(({ ji }) => ji === target)
    .map(({ pos }) => ({ name: '천주귀인', position: pos }));
}

/**
 * 태극귀인(太極貴人) — 일간 기준, 4주 지지 조회
 * (사주첩경 기준: 일간의 오행이 장생·제왕하는 지지)
 */
const TAEGEUK_TABLE: Record<string, string[]> = {
  '甲': ['子', '午'], '己': ['子', '午'],
  '乙': ['卯', '酉'], '庚': ['卯', '酉'],
  '丙': ['寅', '亥'], '辛': ['寅', '亥'],
  '丁': ['巳', '午'], '壬': ['巳', '午'],
  '戊': ['丑', '未'], '癸': ['丑', '未'],
};

function findTaegeukGwiin(dayStem: string, pillars: Pillars): SinsalEntry[] {
  const targets = TAEGEUK_TABLE[dayStem] || [];
  return allJi(pillars)
    .filter(({ ji }) => targets.includes(ji))
    .map(({ pos }) => ({ name: '태극귀인', position: pos }));
}

/**
 * 학당귀인(學堂貴人) — 일간 기준, 4주 지지 조회
 * 일간 오행이 장생하는 지지
 * 甲→亥, 乙→午, 丙戊→寅, 丁己→酉, 庚→巳, 辛→子, 壬→申, 癸→卯
 */
const HAKDANG_TABLE: Record<string, string> = {
  '甲': '亥', '乙': '午', '丙': '寅', '丁': '酉', '戊': '寅',
  '己': '酉', '庚': '巳', '辛': '子', '壬': '申', '癸': '卯',
};

function findHakdangGwiin(dayStem: string, pillars: Pillars): SinsalEntry[] {
  const target = HAKDANG_TABLE[dayStem];
  if (!target) return [];
  return allJi(pillars)
    .filter(({ ji }) => ji === target)
    .map(({ pos }) => ({ name: '학당귀인', position: pos }));
}

/**
 * 천덕귀인(天德貴人) — 월지 기준, 4주 천간 조회
 * 사주첩경 기준 천간만 조회
 */
const CHEONDEOK_TABLE: Record<string, string> = {
  '寅': '丁', '卯': '辛', '辰': '壬', '巳': '辛',
  '午': '甲', '未': '癸', '申': '壬', '酉': '丙',
  '戌': '丙', '亥': '乙', '子': '己', '丑': '庚',
};

function findCheondeokGwiin(monthJi: string, pillars: Pillars): SinsalEntry[] {
  const target = CHEONDEOK_TABLE[monthJi];
  if (!target) return [];
  return allGan(pillars)
    .filter(({ gan }) => gan === target)
    .map(({ pos }) => ({ name: '천덕귀인', position: pos }));
}

/**
 * 월덕귀인(月德貴人) — 월지 기준, 4주 천간 조회
 * 寅午戌→丙, 申子辰→壬, 亥卯未→甲, 巳酉丑→庚
 */
const WOLDEOK_TABLE: Record<string, string> = {
  '寅': '丙', '午': '丙', '戌': '丙',
  '申': '壬', '子': '壬', '辰': '壬',
  '亥': '甲', '卯': '甲', '未': '甲',
  '巳': '庚', '酉': '庚', '丑': '庚',
};

function findWoldeokGwiin(monthJi: string, pillars: Pillars): SinsalEntry[] {
  const target = WOLDEOK_TABLE[monthJi];
  if (!target) return [];
  return allGan(pillars)
    .filter(({ gan }) => gan === target)
    .map(({ pos }) => ({ name: '월덕귀인', position: pos }));
}

// ══════════════════════════════════════════════
// B. 살성·특수
// ══════════════════════════════════════════════

/**
 * 역마살(驛馬殺) — 일지 기준, 나머지 지지 조회
 * 寅午戌→申, 申子辰→寅, 巳酉丑→亥, 亥卯未→巳
 */
const YEOKMA_TABLE: Record<string, string> = {
  '寅': '申', '午': '申', '戌': '申',
  '申': '寅', '子': '寅', '辰': '寅',
  '巳': '亥', '酉': '亥', '丑': '亥',
  '亥': '巳', '卯': '巳', '未': '巳',
};

function findYeokmaSal(dayJi: string, pillars: Pillars): SinsalEntry[] {
  const target = YEOKMA_TABLE[dayJi];
  if (!target) return [];
  return allJi(pillars)
    .filter(({ ji, pos }) => ji === target && pos !== '일주')
    .map(({ pos }) => ({ name: '역마살', position: pos }));
}

/**
 * 화개살(華蓋殺) — 일지 기준
 * 寅午戌→戌, 申子辰→辰, 巳酉丑→丑, 亥卯未→未
 */
const HWAGAE_TABLE: Record<string, string> = {
  '寅': '戌', '午': '戌', '戌': '戌',
  '申': '辰', '子': '辰', '辰': '辰',
  '巳': '丑', '酉': '丑', '丑': '丑',
  '亥': '未', '卯': '未', '未': '未',
};

function findHwagaeSal(dayJi: string, pillars: Pillars): SinsalEntry[] {
  const target = HWAGAE_TABLE[dayJi];
  if (!target) return [];
  return allJi(pillars)
    .filter(({ ji, pos }) => ji === target && pos !== '일주')
    .map(({ pos }) => ({ name: '화개살', position: pos }));
}

/**
 * 백호살(白虎殺) — 일주 간지 조합 (Layer 1: 사주첩경 기준 10개)
 */
const BAEKHO_ILJU: string[] = [
  '甲辰', '乙巳', '丙申', '丁未', '戊午', '己酉', '庚寅', '辛卯', '壬子', '癸丑',
];

/**
 * 백호살 확장 목록 (Layer 2: 통용 기준, 壬戌 포함)
 */
const BAEKHO_ILJU_EXTENDED: string[] = [
  '甲辰', '乙未', '丙戌', '丁丑', '戊辰', '壬戌', '癸丑',
];

function findBaekhoSal(pillars: Pillars): SinsalEntry[] {
  const ilju = pillars.day.gan + pillars.day.ji;
  if (BAEKHO_ILJU.includes(ilju)) {
    return [{ name: '백호살', position: '일주' }];
  }
  return [];
}

function findBaekhoSalExtended(pillars: Pillars): SinsalEntry[] {
  const ilju = pillars.day.gan + pillars.day.ji;
  // Layer 2: either original or extended list
  if (BAEKHO_ILJU.includes(ilju) || BAEKHO_ILJU_EXTENDED.includes(ilju)) {
    return [{ name: '백호살', position: '일주' }];
  }
  return [];
}

/**
 * 원진살(怨嗔殺) — 일지 기준, 나머지 지지 조회
 */
const WONJIN_TABLE: Record<string, string> = {
  '子': '未', '丑': '午', '寅': '巳', '卯': '辰',
  '辰': '卯', '巳': '寅', '午': '丑', '未': '子',
  '申': '亥', '酉': '戌', '戌': '酉', '亥': '申',
};

function findWonjinSal(dayJi: string, pillars: Pillars): SinsalEntry[] {
  const target = WONJIN_TABLE[dayJi];
  if (!target) return [];
  return allJi(pillars)
    .filter(({ ji, pos }) => ji === target && pos !== '일주')
    .map(({ pos }) => ({ name: '원진살', position: pos }));
}

/**
 * 괴강살(魁罡殺) — 일주 간지 조합 (Layer 1: 사주첩경 기준 4개)
 */
const GOEGANG_ILJU: string[] = ['庚辰', '壬辰', '庚戌', '戊戌'];

/**
 * 괴강살 확장 목록 (Layer 2: 壬戌 추가)
 */
const GOEGANG_ILJU_EXTENDED: string[] = ['庚辰', '壬辰', '庚戌', '戊戌', '壬戌'];

function findGoegangSal(pillars: Pillars): SinsalEntry[] {
  const ilju = pillars.day.gan + pillars.day.ji;
  if (GOEGANG_ILJU.includes(ilju)) {
    return [{ name: '괴강살', position: '일주' }];
  }
  return [];
}

function findGoegangSalExtended(pillars: Pillars): SinsalEntry[] {
  const ilju = pillars.day.gan + pillars.day.ji;
  if (GOEGANG_ILJU_EXTENDED.includes(ilju)) {
    return [{ name: '괴강살', position: '일주' }];
  }
  return [];
}

/**
 * 양인살(羊刃殺) — 일간 기준, 4주 지지 조회
 * 일간의 록(祿)에서 한 자리 더 진행한 지지
 */
const YANGIN_TABLE: Record<string, string> = {
  '甲': '卯', '乙': '辰', '丙': '午', '丁': '未', '戊': '午',
  '己': '未', '庚': '酉', '辛': '戌', '壬': '子', '癸': '丑',
};

function findYanginSal(dayStem: string, pillars: Pillars): SinsalEntry[] {
  const target = YANGIN_TABLE[dayStem];
  if (!target) return [];
  return allJi(pillars)
    .filter(({ ji }) => ji === target)
    .map(({ pos }) => ({ name: '양인살', position: pos }));
}

/**
 * 홍염살(紅艶殺) — 일간 기준, 4주 지지 조회
 * 甲→午, 乙→申, 丙→寅, 丁→未, 戊→辰, 己→辰, 庚→戌, 辛→酉, 壬→子, 癸→申
 */
const HONGYEOM_TABLE: Record<string, string> = {
  '甲': '午', '乙': '申', '丙': '寅', '丁': '未', '戊': '辰',
  '己': '辰', '庚': '戌', '辛': '酉', '壬': '子', '癸': '申',
};

function findHongyeomSal(dayStem: string, pillars: Pillars): SinsalEntry[] {
  const target = HONGYEOM_TABLE[dayStem];
  if (!target) return [];
  return allJi(pillars)
    .filter(({ ji }) => ji === target)
    .map(({ pos }) => ({ name: '홍염살', position: pos }));
}

/**
 * 현침살(懸針殺) — 4주 천간·지지 중 甲, 辛, 卯, 午, 申이 있으면 해당
 * (세로 획이 뚫는 형상의 글자)
 */
const HYEONCHIM_CHARS = ['甲', '辛', '卯', '午', '申'];

function findHyeonchimSal(pillars: Pillars): SinsalEntry[] {
  const results: SinsalEntry[] = [];
  const seen = new Set<string>();

  for (const { char, pos } of allGanJiChars(pillars)) {
    if (HYEONCHIM_CHARS.includes(char) && !seen.has(pos)) {
      seen.add(pos);
      results.push({ name: '현침살', position: pos });
    }
  }

  return results;
}

/**
 * 귀문관살(鬼門關殺) — 일지 기준
 */
const GWIMUNGWAN_TABLE: Record<string, string> = {
  '子': '酉', '丑': '午', '寅': '未', '卯': '申',
  '辰': '巳', '巳': '辰', '午': '丑', '未': '寅',
  '申': '卯', '酉': '子', '戌': '亥', '亥': '戌',
};

function findGwimungwanSal(dayJi: string, pillars: Pillars): SinsalEntry[] {
  const target = GWIMUNGWAN_TABLE[dayJi];
  if (!target) return [];
  return allJi(pillars)
    .filter(({ ji, pos }) => ji === target && pos !== '일주')
    .map(({ pos }) => ({ name: '귀문관살', position: pos }));
}

/**
 * 낙정관살(落井關殺) — 일간(天干) 기준
 * 甲己→巳, 乙庚→子, 丙辛→申, 丁壬→戌, 戊癸→卯
 * 4주 지지 중 해당 지지가 있으면 낙정관살
 */
const NAKJEONG_TABLE: Record<string, string> = {
  '甲': '巳', '己': '巳',
  '乙': '子', '庚': '子',
  '丙': '申', '辛': '申',
  '丁': '戌', '壬': '戌',
  '戊': '卯', '癸': '卯',
};

function findNakjeongSal(dayStem: string, pillars: Pillars): SinsalEntry[] {
  const target = NAKJEONG_TABLE[dayStem];
  if (!target) return [];
  return allJi(pillars)
    .filter(({ ji }) => ji === target)
    .map(({ pos }) => ({ name: '낙정관살', position: pos }));
}

// ══════════════════════════════════════════════
// C. 록(祿) 관련
// ══════════════════════════════════════════════

/**
 * 금여록(金輿祿) — 일간 기준, 4주 지지 조회
 * 甲→辰, 乙→巳, 丙→未, 丁→申, 戊→未, 己→申, 庚→戌, 辛→亥, 壬→丑, 癸→寅
 */
const GEUMYEO_TABLE: Record<string, string> = {
  '甲': '辰', '乙': '巳', '丙': '未', '丁': '申', '戊': '未',
  '己': '申', '庚': '戌', '辛': '亥', '壬': '丑', '癸': '寅',
};

function findGeumyeorok(dayStem: string, pillars: Pillars): SinsalEntry[] {
  const target = GEUMYEO_TABLE[dayStem];
  if (!target) return [];
  return allJi(pillars)
    .filter(({ ji }) => ji === target)
    .map(({ pos }) => ({ name: '금여록', position: pos }));
}

/**
 * 암록(暗祿) — 일간의 건록 지지와 암합(지지 속 천간끼리 합)하는 지지
 * 정확한 조견표 — 일간의 건록 천간이 지장간에 포함된 지지
 */
const AMROK_TABLE: Record<string, string[]> = {
  '甲': ['亥'],       // 亥 중 甲木 여기
  '乙': ['辰'],       // 辰 중 乙木 중기
  '丙': ['寅'],       // 寅 중 丙火 중기 (건록 巳와 다른 위치)
  '丁': ['未'],       // 未 중 丁火 중기
  '戊': ['寅'],       // 寅 중 戊土 여기
  '己': ['酉'],       // 酉는 논쟁 — 己의 여기가 있는 丑·未·戌 중 택일
  '庚': ['巳'],       // 巳 중 庚金 중기
  '辛': ['辰'],       // 辰 중 辛金 여기
  '壬': ['巳'],       // 巳 중 壬水 여기(이설)
  '癸': ['丑'],       // 丑 중 癸水 중기
};

function findAmrok(dayStem: string, pillars: Pillars): SinsalEntry[] {
  const targets = AMROK_TABLE[dayStem] || [];
  return allJi(pillars)
    .filter(({ ji }) => targets.includes(ji))
    .map(({ pos }) => ({ name: '암록', position: pos }));
}

/**
 * 협록(夾祿) — 일간의 건록 지지를 양옆에서 끼고 있는 지지
 * 협록 = 건록의 앞뒤 지지가 4주에 모두 있을 때 성립
 */
const ROK_TABLE: Record<string, number> = {
  '甲': 2, '乙': 3, '丙': 5, '丁': 6, '戊': 5,
  '己': 6, '庚': 8, '辛': 9, '壬': 11, '癸': 0,
};

function findHyeoprok(dayStem: string, pillars: Pillars): SinsalEntry[] {
  const rokIdx = ROK_TABLE[dayStem];
  if (rokIdx === undefined) return [];

  const prevIdx = (rokIdx - 1 + 12) % 12;
  const nextIdx = (rokIdx + 1) % 12;
  const prevJi = JIJI[prevIdx];
  const nextJi = JIJI[nextIdx];

  const jiList = allJi(pillars).map(j => j.ji);

  // 협록은 건록의 양옆 지지가 모두 있어야 성립
  if (jiList.includes(prevJi) && jiList.includes(nextJi)) {
    const results: SinsalEntry[] = [];
    for (const { ji, pos } of allJi(pillars)) {
      if (ji === prevJi || ji === nextJi) {
        results.push({ name: '협록', position: pos });
      }
    }
    return results;
  }
  return [];
}

// ══════════════════════════════════════════════
// D. 공망
// ══════════════════════════════════════════════

/**
 * 공망(空亡) — 일주의 60갑자 순(旬)에서 빠진 2개 지지
 */
export function getGongmang(dayGan: string, dayJi: string): [string, string] {
  const gIdx = ganIdx(dayGan);
  const jIdx = jiIdx(dayJi);

  // 순두(旬頭): 해당 순의 시작 간지 인덱스
  const startJiIdx = ((jIdx - gIdx) % 12 + 12) % 12;

  // 공망 = 순두 지지에서 10, 11번째 지지
  const gm1 = JIJI[(startJiIdx + 10) % 12];
  const gm2 = JIJI[(startJiIdx + 11) % 12];

  return [gm1, gm2];
}

function findGongmang(pillars: Pillars): SinsalEntry[] {
  const [gm1, gm2] = getGongmang(pillars.day.gan, pillars.day.ji);
  const results: SinsalEntry[] = [];

  for (const { ji, pos } of allJi(pillars)) {
    if (pos === '일주') continue; // 일주 자체는 공망 대상 아님
    if (ji === gm1 || ji === gm2) {
      results.push({ name: '공망', position: pos });
    }
  }

  return results;
}

// ══════════════════════════════════════════════
// E. 십이신살 (대운·세운용, 연지 기준)
// ══════════════════════════════════════════════

/**
 * 십이신살 — 연지(年支) 기준 12지지 순환
 * 순서: 겁살→재살→천살→지살→연살→월살→망신살→장성살→반안살→역마살→육해살→화개살
 *
 * 연지별 겁살 시작점:
 * 寅午戌→亥, 申子辰→巳, 巳酉丑→寅, 亥卯未→申
 */
const SIBIISINSAL_NAMES = [
  '겁살', '재살', '천살', '지살', '연살', '월살',
  '망신살', '장성살', '반안살', '역마살', '육해살', '화개살',
] as const;

const SIBII_START: Record<string, number> = {
  // 겁살 시작 지지의 인덱스
  '寅': 11, '午': 11, '戌': 11,   // 亥=11
  '申': 5,  '子': 5,  '辰': 5,    // 巳=5
  '巳': 2,  '酉': 2,  '丑': 2,    // 寅=2
  '亥': 8,  '卯': 8,  '未': 8,    // 申=8
};

export interface SibiiSinsalEntry {
  name: string;
}

/**
 * 특정 지지(대운/세운)에 대해 연지 기준 십이신살 판정
 */
export function getSibiiSinsal(yearJi: string, targetJi: string): SibiiSinsalEntry[] {
  const startIdx = SIBII_START[yearJi];
  if (startIdx === undefined) return [];

  const targetIdx = jiIdx(targetJi);
  const results: SibiiSinsalEntry[] = [];

  for (let i = 0; i < 12; i++) {
    const jiPosition = (startIdx + i) % 12;
    if (jiPosition === targetIdx) {
      results.push({ name: SIBIISINSAL_NAMES[i] });
    }
  }

  return results;
}

/**
 * 원국에서도 십이신살 판정 (연지 기준으로 나머지 주 조회)
 */
function findSibiiSinsalInWonguk(pillars: Pillars): SinsalEntry[] {
  const yearJi = pillars.year.ji;
  const results: SinsalEntry[] = [];

  const targets = [
    { ji: pillars.month.ji, pos: '월주' },
    { ji: pillars.day.ji, pos: '일주' },
  ];
  if (pillars.hour) targets.push({ ji: pillars.hour.ji, pos: '시주' });

  for (const { ji, pos } of targets) {
    const sinsals = getSibiiSinsal(yearJi, ji);
    for (const s of sinsals) {
      results.push({ name: s.name, position: pos });
    }
  }

  return results;
}

// ══════════════════════════════════════════════
// F. Layer 2 추가 신살
// ══════════════════════════════════════════════

/**
 * 도화살(桃花殺) — 년지 또는 일지 기준 삼합의 목욕지
 * 寅午戌→卯, 巳酉丑→午, 申子辰→酉, 亥卯未→子
 */
const DOHWA_TABLE: Record<string, string> = {
  '寅': '卯', '午': '卯', '戌': '卯',
  '巳': '午', '酉': '午', '丑': '午',
  '申': '酉', '子': '酉', '辰': '酉',
  '亥': '子', '卯': '子', '未': '子',
};

function findDohwaSal(pillars: Pillars): SinsalEntry[] {
  const results: SinsalEntry[] = [];
  const bases = [pillars.year.ji, pillars.day.ji];

  for (const baseJi of bases) {
    const target = DOHWA_TABLE[baseJi];
    if (!target) continue;
    for (const { ji, pos } of allJi(pillars)) {
      if (ji === target) {
        // Avoid duplicates (same name + position)
        if (!results.some(r => r.name === '도화살' && r.position === pos)) {
          results.push({ name: '도화살', position: pos });
        }
      }
    }
  }

  return results;
}

/**
 * 고란살(孤鸞殺) — 일주 기준
 */
const GORAN_ILJU: string[] = ['甲寅', '乙巳', '戊申', '戊子', '戊午', '辛亥'];

function findGoranSal(pillars: Pillars): SinsalEntry[] {
  const ilju = pillars.day.gan + pillars.day.ji;
  if (GORAN_ILJU.includes(ilju)) {
    return [{ name: '고란살', position: '일주' }];
  }
  return [];
}

/**
 * 과숙살(寡宿殺) — 년지 기준
 * 寅卯辰→丑, 巳午未→辰, 申酉戌→未, 亥子丑→戌
 */
const GWASUK_TABLE: Record<string, string> = {
  '寅': '丑', '卯': '丑', '辰': '丑',
  '巳': '辰', '午': '辰', '未': '辰',
  '申': '未', '酉': '未', '戌': '未',
  '亥': '戌', '子': '戌', '丑': '戌',
};

function findGwasukSal(pillars: Pillars): SinsalEntry[] {
  const target = GWASUK_TABLE[pillars.year.ji];
  if (!target) return [];
  return allJi(pillars)
    .filter(({ ji }) => ji === target)
    .map(({ pos }) => ({ name: '과숙살', position: pos }));
}

/**
 * 급각살(急脚殺) — 일지가 子, 丑, 또는 申이면 해당
 */
const GEUPGAK_JIJI = ['子', '丑', '申'];

function findGeupgakSal(pillars: Pillars): SinsalEntry[] {
  if (GEUPGAK_JIJI.includes(pillars.day.ji)) {
    return [{ name: '급각살', position: '일주' }];
  }
  return [];
}

// ══════════════════════════════════════════════
// 카테고리 매핑
// ══════════════════════════════════════════════

const CATEGORY_MAP: Record<string, SinsalCategory> = {
  // sibiiSinsal
  '겁살': 'sibiiSinsal',
  '재살': 'sibiiSinsal',
  '천살': 'sibiiSinsal',
  '지살': 'sibiiSinsal',
  '연살': 'sibiiSinsal',
  '월살': 'sibiiSinsal',
  '망신살': 'sibiiSinsal',
  '장성살': 'sibiiSinsal',
  '반안살': 'sibiiSinsal',
  '역마살': 'sibiiSinsal',
  '육해살': 'sibiiSinsal',
  '화개살': 'sibiiSinsal',

  // gilsin
  '천을귀인': 'gilsin',
  '문창귀인': 'gilsin',
  '문곡귀인': 'gilsin',
  '천복귀인': 'gilsin',
  '천주귀인': 'gilsin',
  '태극귀인': 'gilsin',
  '학당귀인': 'gilsin',
  '천덕귀인': 'gilsin',
  '월덕귀인': 'gilsin',
  '금여록': 'gilsin',
  '암록': 'gilsin',
  '협록': 'gilsin',

  // hyungsin
  '양인살': 'hyungsin',
  '괴강살': 'hyungsin',
  '백호살': 'hyungsin',
  '원진살': 'hyungsin',
  '귀문관살': 'hyungsin',
  '낙정관살': 'hyungsin',
  '홍염살': 'hyungsin',
  '현침살': 'hyungsin',
  '공망': 'hyungsin',
  '도화살': 'hyungsin',
  '고란살': 'hyungsin',
  '과숙살': 'hyungsin',
  '급각살': 'hyungsin',
};

function getCategory(name: string): SinsalCategory {
  return CATEGORY_MAP[name] || 'gita';
}

// ══════════════════════════════════════════════
// 통합 함수
// ══════════════════════════════════════════════

/**
 * Layer 1: 원국 신살 전체 계산 (Engine/LLM용, 사주첩경 기준 33종)
 * @param pillars 4주
 * @returns 신살 배열
 */
export function calculateEngineSinsal(pillars: Pillars): SinsalEntry[] {
  const dayStem = pillars.day.gan;
  const dayJi = pillars.day.ji;
  const monthJi = pillars.month.ji;

  const results: SinsalEntry[] = [];

  // A. 귀인성
  results.push(...findCheonulGwiin(dayStem, pillars));
  results.push(...findMunchangGwiin(dayStem, pillars));
  results.push(...findMungokGwiin(dayStem, pillars));
  results.push(...findCheonbokGwiin(dayStem, pillars));
  results.push(...findCheonjuGwiin(dayStem, pillars));
  results.push(...findTaegeukGwiin(dayStem, pillars));
  results.push(...findHakdangGwiin(dayStem, pillars));
  results.push(...findCheondeokGwiin(monthJi, pillars));
  results.push(...findWoldeokGwiin(monthJi, pillars));

  // B. 살성·특수
  results.push(...findYeokmaSal(dayJi, pillars));
  results.push(...findHwagaeSal(dayJi, pillars));
  results.push(...findBaekhoSal(pillars));
  results.push(...findWonjinSal(dayJi, pillars));
  results.push(...findGoegangSal(pillars));
  results.push(...findYanginSal(dayStem, pillars));
  results.push(...findHongyeomSal(dayStem, pillars));
  results.push(...findHyeonchimSal(pillars));
  results.push(...findGwimungwanSal(dayJi, pillars));
  results.push(...findNakjeongSal(dayStem, pillars));

  // C. 록
  results.push(...findGeumyeorok(dayStem, pillars));
  results.push(...findAmrok(dayStem, pillars));
  results.push(...findHyeoprok(dayStem, pillars));

  // D. 공망
  results.push(...findGongmang(pillars));

  // E. 십이신살 (원국 내)
  results.push(...findSibiiSinsalInWonguk(pillars));

  return results;
}

/** Backward-compatible alias */
export const calculateSinsal = calculateEngineSinsal;

/**
 * Layer 2: Display/UI용 신살 계산 (통용 기준 확장 + 추가 신살 포함)
 * @param pillars 4주
 * @returns 카테고리가 포함된 신살 배열
 */
export function calculateDisplaySinsal(pillars: Pillars): DisplaySinsalEntry[] {
  const dayStem = pillars.day.gan;
  const dayJi = pillars.day.ji;
  const monthJi = pillars.month.ji;

  const raw: SinsalEntry[] = [];

  // A. 귀인성
  raw.push(...findCheonulGwiin(dayStem, pillars));
  raw.push(...findMunchangGwiin(dayStem, pillars));
  raw.push(...findMungokGwiin(dayStem, pillars));
  raw.push(...findCheonbokGwiin(dayStem, pillars));
  raw.push(...findCheonjuGwiin(dayStem, pillars));
  raw.push(...findTaegeukGwiin(dayStem, pillars));
  raw.push(...findHakdangGwiin(dayStem, pillars));
  raw.push(...findCheondeokGwiin(monthJi, pillars));
  raw.push(...findWoldeokGwiin(monthJi, pillars));

  // B. 살성·특수 (Layer 2 확장 테이블 사용)
  raw.push(...findYeokmaSal(dayJi, pillars));
  raw.push(...findHwagaeSal(dayJi, pillars));
  raw.push(...findBaekhoSalExtended(pillars));   // Layer 2 extended
  raw.push(...findWonjinSal(dayJi, pillars));
  raw.push(...findGoegangSalExtended(pillars));   // Layer 2 extended
  raw.push(...findYanginSal(dayStem, pillars));
  raw.push(...findHongyeomSal(dayStem, pillars));
  raw.push(...findHyeonchimSal(pillars));
  raw.push(...findGwimungwanSal(dayJi, pillars));
  raw.push(...findNakjeongSal(dayStem, pillars));

  // C. 록
  raw.push(...findGeumyeorok(dayStem, pillars));
  raw.push(...findAmrok(dayStem, pillars));
  raw.push(...findHyeoprok(dayStem, pillars));

  // D. 공망
  raw.push(...findGongmang(pillars));

  // E. 십이신살 (원국 내)
  raw.push(...findSibiiSinsalInWonguk(pillars));

  // F. Layer 2 추가 신살
  raw.push(...findDohwaSal(pillars));
  raw.push(...findGoranSal(pillars));
  raw.push(...findGwasukSal(pillars));
  raw.push(...findGeupgakSal(pillars));

  // 카테고리 할당
  return raw.map(entry => ({
    name: entry.name,
    position: entry.position,
    category: getCategory(entry.name),
  }));
}
