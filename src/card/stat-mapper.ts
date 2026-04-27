/**
 * stat-mapper.ts
 * SajuResult → CharacterCardData 변환
 *
 * 변환 규칙 출처: 03-cowork-character-card.md
 */

import type { SajuResult } from '@/src/engine/schema';
import {
  CLASS_TABLE,
  getTitlePrefix,
  SKILL_TABLE,
  ELEMENT_BADGE,
  BACKGROUND_TABLE,
  GAN_TO_OHENG,
  GILSIN_SET,
  HYUNGSAL_SET,
  INSEONG_SET,
  GWANSEONG_SET,
  SIKSANG_SET,
  JAESEONG_SET,
  type OhengElement,
} from './card-data';

// ── 출력 타입 ─────────────────────────────────────────────────────────────────

export interface CharacterCardData {
  /** "★★ 숙련된 비밀의 마법사" */
  title: string;
  /** "비밀의 마법사" */
  className: string;
  /** "💧 수(水) — 물의 기운" */
  element: string;
  /** "水" */
  elementKey: OhengElement;

  /** 캐릭터 파일 선택 */
  characterType: 'angel' | 'devil' | 'basic';
  /** "su_yang.jpeg" */
  backgroundFile: string;

  /** 6개 스탯 (1~20) */
  stats: {
    str: number;
    int: number;
    wis: number;
    dex: number;
    cha: number;
    luk: number;
  };

  /** 오행 레지스턴스 (0~100, 합계 ≈ 100) */
  resistance: {
    木: number;
    火: number;
    土: number;
    金: number;
    水: number;
  };

  /** "흐르는 지혜" */
  skill: string;
  /** "편인격" */
  gyeokGukType: string;
  /** "성격" */
  gyeokGukState: string;
  /** 0~100 */
  strengthScore: number;
}

// ── 내부 헬퍼 ─────────────────────────────────────────────────────────────────

/** 십성 기반 스탯 산출: (개수 / 8) × 14 + 3, 최소 3 최대 17, 신살 보너스 후 최대 20 cap */
function tenGodStat(count: number, bonus: number): number {
  const base = Math.round((count / 8) * 14 + 3);
  const clamped = Math.min(17, Math.max(3, base));
  return Math.min(20, clamped + bonus);
}

/** score(0~100) → 1~20 선형 매핑 (반올림) */
function scoreStat(score: number): number {
  return Math.min(20, Math.max(1, Math.round((score / 100) * 19 + 1)));
}

/** 십성 8자리 목록에서 특정 집합에 속하는 개수 계산 */
function countTenGods(tenGods: SajuResult['tenGods'], targetSet: Set<string>): number {
  const all = [
    tenGods.yearGan,
    tenGods.monthGan,
    tenGods.dayGan,
    tenGods.hourGan,
    tenGods.yearJi,
    tenGods.monthJi,
    tenGods.dayJi,
    tenGods.hourJi,
  ];
  return all.filter(v => v !== null && targetSet.has(v as string)).length;
}

/** 현재 대운 스코어 추출 (생일 기준 현재 나이로 추정하기 어려우므로 첫 번째 대운 스코어 사용) */
function getCurrentDaeunScore(daeun: SajuResult['daeun']): number {
  if (!daeun || daeun.periods.length === 0) return 50;
  // 첫 번째 대운을 기준으로 사용 (향후 실제 현재 나이 계산으로 개선 가능)
  return daeun.periods[0].analysis.score;
}

/** 신살 이름 목록에서 특정 집합 해당 여부 */
function hasSinsal(sinsal: SajuResult['sinsal'], nameSet: Set<string>): boolean {
  return sinsal.some(s => nameSet.has(s.name));
}

/** 길신/흉살 비율로 캐릭터 타입 결정 */
function resolveCharacterType(sinsal: SajuResult['sinsal']): 'angel' | 'devil' | 'basic' {
  const total = sinsal.length;
  if (total === 0) return 'basic';

  const gilCount = sinsal.filter(s => GILSIN_SET.has(s.name)).length;
  const hyungCount = sinsal.filter(s => HYUNGSAL_SET.has(s.name)).length;

  const gilRatio = gilCount / total;
  const hyungRatio = hyungCount / total;

  if (gilRatio >= 0.7) return 'angel';
  if (hyungRatio >= 0.7) return 'devil';
  return 'basic';
}

/** 오행 레지스턴스 계산 (합계 100%) */
function calcResistance(ohengAnalysis: SajuResult['ohengAnalysis']): CharacterCardData['resistance'] {
  const elements: OhengElement[] = ['木', '火', '土', '金', '水'];
  const total = ohengAnalysis.counts.reduce((sum, c) => sum + c.withJijanggan, 0);

  if (total === 0) {
    return { 木: 20, 火: 20, 土: 20, 金: 20, 水: 20 };
  }

  const raw: Record<OhengElement, number> = { 木: 0, 火: 0, 土: 0, 金: 0, 水: 0 };
  for (const c of ohengAnalysis.counts) {
    if (elements.includes(c.element as OhengElement)) {
      raw[c.element as OhengElement] = c.withJijanggan;
    }
  }

  const result: CharacterCardData['resistance'] = { 木: 0, 火: 0, 土: 0, 金: 0, 水: 0 };
  let sum = 0;
  for (const el of elements) {
    result[el] = Math.round((raw[el] / total) * 100);
    sum += result[el];
  }

  // 반올림 오차 보정 (합계가 100이 되도록)
  const diff = 100 - sum;
  if (diff !== 0) {
    // 가장 큰 값에 오차 적용
    const maxEl = elements.reduce((a, b) => (result[a] >= result[b] ? a : b));
    result[maxEl] += diff;
  }

  return result;
}

// ── 메인 변환 함수 ─────────────────────────────────────────────────────────────

export function mapSajuToCard(result: SajuResult): CharacterCardData {
  const { pillars, tenGods, strength, gyeokGuk, yongSin, sinsal, daeun, ohengAnalysis } = result;

  // ── 일간 기반 속성 ──
  const dayGan = pillars.day.gan;
  const elementKey: OhengElement = GAN_TO_OHENG[dayGan] ?? '木';
  const element = ELEMENT_BADGE[elementKey];
  const backgroundFile = BACKGROUND_TABLE[dayGan] ?? 'mok_yang.jpeg';

  // ── 클래스명 / 칭호 ──
  const classEntry = CLASS_TABLE[gyeokGuk.type] ?? { className: '알 수 없는 자', description: '' };
  const titlePrefix = getTitlePrefix(strength.level, gyeokGuk.state);
  const title = `${titlePrefix} ${classEntry.className}`;

  // ── 캐릭터 타입 ──
  const characterType = resolveCharacterType(sinsal);

  // ── 신살 보너스 여부 ──
  const hasYeokma = hasSinsal(sinsal, new Set(['역마살']));
  const hasDoHwa = hasSinsal(sinsal, new Set(['도화살', '홍염살']));

  // ── 6개 스탯 ──
  const inseongCount = countTenGods(tenGods, INSEONG_SET);
  const gwanseongCount = countTenGods(tenGods, GWANSEONG_SET);
  const siksangCount = countTenGods(tenGods, SIKSANG_SET);
  const jaeseongCount = countTenGods(tenGods, JAESEONG_SET);

  const stats: CharacterCardData['stats'] = {
    str: scoreStat(strength.score),
    int: tenGodStat(inseongCount, 0),
    wis: tenGodStat(gwanseongCount, 0),
    dex: tenGodStat(siksangCount, hasYeokma ? 3 : 0),
    cha: tenGodStat(jaeseongCount, hasDoHwa ? 3 : 0),
    luk: scoreStat(getCurrentDaeunScore(daeun)),
  };

  // ── 오행 레지스턴스 ──
  const resistance = calcResistance(ohengAnalysis);

  // ── 용신 스킬 ──
  const yongSinElement: OhengElement = yongSin.final.primary as OhengElement;
  const skill = SKILL_TABLE[yongSinElement] ?? '알 수 없는 힘';

  return {
    title,
    className: classEntry.className,
    element,
    elementKey,
    characterType,
    backgroundFile,
    stats,
    resistance,
    skill,
    gyeokGukType: gyeokGuk.type,
    gyeokGukState: gyeokGuk.state,
    strengthScore: strength.score,
  };
}
