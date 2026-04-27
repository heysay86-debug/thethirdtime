/**
 * card-data.ts
 * RPG 캐릭터 카드 상수 테이블
 *
 * 격국 → 클래스명/설명, 칭호 접두어, 용신 → 스킬명, 신살 분류 목록
 */

import { z } from 'zod';

// ── 격국 타입 (schema에서 추론) ──────────────────────────────────────────────

type GyeokGukType = z.infer<typeof import('@/src/engine/schema').SajuResultSchema>['gyeokGuk']['type'];

// ── 클래스 테이블 ─────────────────────────────────────────────────────────────

export interface ClassEntry {
  className: string;
  description: string;
}

export const CLASS_TABLE: Record<GyeokGukType, ClassEntry> = {
  정관격: { className: '질서의 수호자',   description: '규율과 명예를 따르는 기사' },
  편관격: { className: '그림자 기사',     description: '비정규 전투에 능한 암살자' },
  정인격: { className: '현자의 제자',     description: '지식과 지혜를 탐구하는 학자' },
  편인격: { className: '비밀의 마법사',   description: '비전의 지식을 다루는 술사' },
  식신격: { className: '대지의 요리사',   description: '풍요와 나눔의 달인' },
  상관격: { className: '자유의 음유시인', description: '재능과 표현의 예술가' },
  정재격: { className: '황금의 상인',     description: '안정적 부를 쌓는 경영가' },
  편재격: { className: '모험의 투자가',   description: '과감한 도전으로 부를 잡는 도박사' },
  건록격: { className: '자수성가의 전사', description: '스스로의 힘으로 일어서는 투사' },
  양인격: { className: '폭풍의 검사',     description: '압도적 기세의 전투광' },
  종강격: { className: '불굴의 방패',     description: '어떤 역경에도 꺾이지 않는 수호자' },
  종왕격: { className: '왕좌의 계승자',   description: '태어난 순간부터 리더' },
  종아격: { className: '천재의 방랑자',   description: '끝없는 재능의 유랑 예술가' },
  종재격: { className: '황금왕',          description: '재물의 흐름을 타고난 자' },
  종살격: { className: '운명의 집행자',   description: '권력의 정점에 서는 자' },
  화격:   { className: '변환의 마법사',   description: '오행이 뒤바뀌는 신비로운 술사' },
  중화격: { className: '균형의 현인',     description: '모든 힘을 고루 품은 지혜자' },
};

// ── 칭호 접두어 테이블 ────────────────────────────────────────────────────────

type StrengthLevel = '극강' | '신강' | '중화' | '신약' | '극약';
type GyeokGukState = '성격' | '파격' | '약화';

export function getTitlePrefix(
  strengthLevel: StrengthLevel,
  gyeokGukState: GyeokGukState,
): string {
  // 파격·약화는 상태 우선
  if (gyeokGukState === '파격') return '🔥 각성한';
  if (gyeokGukState === '약화') return '⚡ 시련의';

  // 성격: 신강약 레벨 기준
  switch (strengthLevel) {
    case '극강': return '★★★ 전설의';
    case '신강': return '★★ 숙련된';
    case '중화': return '★★ 균형잡힌';
    case '신약': return '★ 성장하는';
    case '극약': return '★ 잠재력의';
  }
}

// ── 용신 → 스킬명 ─────────────────────────────────────────────────────────────

export type OhengElement = '木' | '火' | '土' | '金' | '水';

export const SKILL_TABLE: Record<OhengElement, string> = {
  木: '생명의 나무',
  火: '불꽃 정화',
  土: '대지의 축복',
  金: '강철 의지',
  水: '흐르는 지혜',
};

// ── 속성 뱃지 ─────────────────────────────────────────────────────────────────

export const ELEMENT_BADGE: Record<OhengElement, string> = {
  木: '🌳 목(木) — 나무의 기운',
  火: '🔥 화(火) — 불의 기운',
  土: '⛰️ 토(土) — 흙의 기운',
  金: '⚔️ 금(金) — 쇠의 기운',
  水: '💧 수(水) — 물의 기운',
};

export const ELEMENT_EMOJI: Record<OhengElement, string> = {
  木: '🌳',
  火: '🔥',
  土: '⛰️',
  金: '⚔️',
  水: '💧',
};

// ── 일간(천간) → 배경 파일 매핑 ──────────────────────────────────────────────

export const BACKGROUND_TABLE: Record<string, string> = {
  甲: 'mok_yang.jpeg',
  乙: 'mok_yin.jpeg',
  丙: 'hwa_yang.jpeg',
  丁: 'hwa_yin.jpeg',
  戊: 'to_yang.jpeg',
  己: 'to_yin.jpeg',
  庚: 'keum_yang.jpeg',
  辛: 'keum_yin.jpeg',
  壬: 'su_yang.jpeg',
  癸: 'su_yin.jpeg',
};

// ── 일간 → 오행 ───────────────────────────────────────────────────────────────

export const GAN_TO_OHENG: Record<string, OhengElement> = {
  甲: '木', 乙: '木',
  丙: '火', 丁: '火',
  戊: '土', 己: '土',
  庚: '金', 辛: '金',
  壬: '水', 癸: '水',
};

// ── 신살 분류 ─────────────────────────────────────────────────────────────────

export const GILSIN_SET = new Set([
  '천을귀인', '문창귀인', '문곡귀인', '천복귀인', '천주귀인',
  '태극귀인', '학당귀인', '천덕귀인', '월덕귀인', '금여록', '암록', '협록',
]);

export const HYUNGSAL_SET = new Set([
  '역마살', '화개살', '백호살', '원진살', '괴강살', '양인살',
  '홍염살', '현침살', '귀문관살', '낙정관살', '공망',
]);

// ── 십성 그룹 ─────────────────────────────────────────────────────────────────

export const INSEONG_SET = new Set(['편인', '정인']);
export const GWANSEONG_SET = new Set(['편관', '정관']);
export const SIKSANG_SET = new Set(['식신', '상관']);
export const JAESEONG_SET = new Set(['편재', '정재']);

// ── 스탯 바 컬러 ─────────────────────────────────────────────────────────────

export const STAT_COLORS: Record<string, string> = {
  STR: '#f4dea6', // Yellow
  INT: '#618199', // Dark sky-blue
  WIS: '#97c6aa', // Green
  DEX: '#97c6aa', // Green
  CHA: '#f2b6b6', // Pink
  LUK: '#618199', // Dark sky-blue
};
