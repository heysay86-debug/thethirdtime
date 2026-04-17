/**
 * 신살(神殺) 계산 모듈 — M14.6
 *
 * 이석영『사주첩경』기준 33종 신살 판정.
 *
 * A. 귀인성 8종: 천을귀인, 문창귀인, 문곡귀인, 천복귀인, 천주귀인, 태극귀인, 학당귀인, 천덕귀인, 월덕귀인
 * B. 살성·특수 10종: 역마살, 화개살, 백호살, 원진살, 괴강살, 양인살, 홍염살, 현침살, 귀문관살, 낙정관살
 * C. 록 관련 3종: 금여록, 암록, 협록
 * D. 공망 1종
 * E. 십이신살 12종 (대운·세운용): 겁살, 재살, 천살, 지살, 연살, 월살, 망신살, 장성살, 반안살, 역마살, 육해살, 화개살
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
 * 甲→巳, 乙→午, 丙→巳(또는 未), 丁→申, 戊→巳, 己→午, 庚→寅(또는 申), 辛→酉, 壬→亥, 癸→子
 * (일부 이설 있으나 사주첩경 주류 해석 따름)
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
 * 甲己→子午(또는 寅午), 乙庚→辰戌(또는 卯酉), 丙辛→卯酉(또는 寅亥),
 * 丁壬→巳酉(또는 巳午), 戊癸→辰戌(또는 丑未)
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
 * 寅월→丁, 卯월→申(→庚으로 보는 설도 있으나 천간이므로 丙辛 중 辛),
 * 정통: 寅→丁, 卯→辛, 辰→壬, 巳→辛, 午→甲(또는 亥), 未→癸,
 *       申→壬, 酉→丙(또는 辛), 戌→丙(또는 乙), 亥→乙(또는 甲),
 *       子→己(또는 巳), 丑→庚
 * 사주첩경 기준 천간만 조회:
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
 * 백호살(白虎殺) — 일지 기준
 * 子→午, 丑→未, 寅→申, 卯→辰, 辰→戌, 巳→酉, 午→子, 未→丑, 申→寅, 酉→巳, 戌→辰, 亥→卯
 * (일부 이설: 일지의 충 지지를 백호로 보는 설도 있음)
 * 사주첩경 기준: 甲辰·乙巳·丙申·丁未·戊午·庚寅·辛卯·壬子·癸丑·己酉(일주 조합)
 * → 일주 간지 조합으로 판정하는 방식 채택
 */
const BAEKHO_ILJU: string[] = [
  '甲辰', '乙巳', '丙申', '丁未', '戊午', '己酉', '庚寅', '辛卯', '壬子', '癸丑',
];

function findBaekhoSal(pillars: Pillars): SinsalEntry[] {
  const ilju = pillars.day.gan + pillars.day.ji;
  if (BAEKHO_ILJU.includes(ilju)) {
    return [{ name: '백호살', position: '일주' }];
  }
  return [];
}

/**
 * 원진살(怨嗔殺) — 일지 기준, 나머지 지지 조회
 * 子→未, 丑→午, 寅→巳, 卯→辰, 辰→卯, 巳→寅, 午→丑, 未→子, 申→亥, 酉→戌, 戌→酉, 亥→申
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
 * 괴강살(魁罡殺) — 일주 간지 조합
 * 庚辰, 壬辰, 庚戌, 戊戌 (4개)
 */
const GOEGANG_ILJU: string[] = ['庚辰', '壬辰', '庚戌', '戊戌'];

function findGoegangSal(pillars: Pillars): SinsalEntry[] {
  const ilju = pillars.day.gan + pillars.day.ji;
  if (GOEGANG_ILJU.includes(ilju)) {
    return [{ name: '괴강살', position: '일주' }];
  }
  return [];
}

/**
 * 양인살(羊刃殺) — 일간 기준, 4주 지지 조회
 * 일간의 록(祿)에서 한 자리 더 진행한 지지
 * 甲→卯, 乙→辰(또는 寅), 丙→午, 丁→未(또는 巳), 戊→午, 己→未(또는 巳),
 * 庚→酉, 辛→戌(또는 申), 壬→子, 癸→丑(또는 亥)
 * 사주첩경 기준 양간만 적용하는 설도 있으나, 음간도 포함하는 확장 해석 채택
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
 * 현침살(懸針殺) — 일간 특정 글자
 * 甲, 壬 (세로 획이 뚫는 형상)
 * 일간이 甲 또는 壬이면 현침살
 */
const HYEONCHIM_STEMS = ['甲', '壬'];

function findHyeonchimSal(dayStem: string): SinsalEntry[] {
  if (HYEONCHIM_STEMS.includes(dayStem)) {
    return [{ name: '현침살', position: '일주' }];
  }
  return [];
}

/**
 * 귀문관살(鬼門關殺) — 일지 기준
 * 子→酉, 丑→午, 寅→未, 卯→申, 辰→巳, 巳→辰, 午→丑, 未→寅, 申→卯, 酉→子, 戌→亥, 亥→戌
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
 * 낙정관살(落井關殺) — 일지 기준
 * 寅→巳, 巳→申, 申→寅 (삼합 역방향 충돌)
 * 卯→午, 午→酉, 酉→卯
 * 辰→未, 未→戌, 戌→辰
 * 丑→辰, 子→卯(또는 酉)
 * (사주첩경 기준: 일지와 시지의 특정 조합)
 * 간략화 조견표:
 */
const NAKJEONG_TABLE: Record<string, string[]> = {
  '寅': ['巳', '申'], '巳': ['申', '寅'], '申': ['寅', '巳'],
  '卯': ['午', '酉'], '午': ['酉', '卯'], '酉': ['卯', '午'],
  '辰': ['未', '戌'], '未': ['戌', '辰'], '戌': ['辰', '未'],
  '丑': ['辰', '戌'], '子': ['卯', '酉'], '亥': ['寅', '午'],
};

function findNakjeongSal(dayJi: string, pillars: Pillars): SinsalEntry[] {
  const targets = NAKJEONG_TABLE[dayJi] || [];
  return allJi(pillars)
    .filter(({ ji, pos }) => targets.includes(ji) && pos !== '일주')
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
 * 암록(暗祿) — 일간의 록(건록) 지지에 암합하는 지지
 * 건록: 甲→寅, 乙→卯, 丙→巳, 丁→午, 戊→巳, 己→午, 庚→申, 辛→酉, 壬→亥, 癸→子
 * 암록은 건록 지지와 암합(지지 속 천간끼리 합)하는 지지
 * 甲(록=寅)→亥(寅중甲과 亥중壬의 관계? → 이설 다양)
 * 실전 통용 조견표:
 * 甲→亥, 乙→申, 丙→寅(또는 申?), 丁→亥, 戊→寅, 己→亥, 庚→巳, 辛→寅, 壬→巳, 癸→午
 * (사주첩경 기준: 일간 기준 정록이 지지 속에 숨어 있는 경우)
 * 정확한 조견표 — 일간의 건록 천간이 지장간에 포함된 지지:
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
 * 건록: 甲→寅, 乙→卯, 丙→巳, 丁→午, 戊→巳, 己→午, 庚→申, 辛→酉, 壬→亥, 癸→子
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
    // 협록이 성립하는 주를 찾아서 반환 (양옆 지지가 있는 주 모두)
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
 * 60갑자를 10개씩 6순으로 나누면, 각 순에서 12지 중 2개가 빠짐
 */
export function getGongmang(dayGan: string, dayJi: string): [string, string] {
  const gIdx = ganIdx(dayGan);
  const jIdx = jiIdx(dayJi);

  // 순두(旬頭): 해당 순의 시작 간지 인덱스
  // 일간 인덱스 - (간인덱스 차이) = 순두의 지지 인덱스
  // 순두 간 = 甲, 순두 지지 = dayJi - (dayGan - 甲) = jIdx - gIdx
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
 * @param yearJi 연지 (원국의 연지)
 * @param targetJi 대운/세운의 지지
 * @returns 해당하는 십이신살 이름 배열
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
// 통합 함수
// ══════════════════════════════════════════════

/**
 * 원국 신살 전체 계산
 * @param pillars 4주
 * @returns 신살 배열
 */
export function calculateSinsal(pillars: Pillars): SinsalEntry[] {
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
  results.push(...findHyeonchimSal(dayStem));
  results.push(...findGwimungwanSal(dayJi, pillars));
  results.push(...findNakjeongSal(dayJi, pillars));

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
