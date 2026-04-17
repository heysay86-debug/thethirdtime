/**
 * 원국(原局) 합·충·형·해·파 관계 계산
 *
 * 4기둥(연·월·일·시) 천간 4자 + 지지 4자, 총 8자 사이의
 * 모든 이항(二項) 관계 및 삼합/방합을 반환한다.
 *
 * 반환 포맷: 섹션별 한글 병기 문자열 배열
 * 이 텍스트가 이후 LLM 섹션(형충파해합, 종합해석 등)의 시드 프롬프트로 쓰인다.
 *
 * 이론 기준: 이석영 사주첩경
 */

import { ganToKorean, jiToKorean, ohaengToKorean } from './koreanReading';

// ─── 위치명 ───────────────────────────────────────────────────

type PosKey = '연주' | '월주' | '일주' | '시주';

// ─── 천간합 ───────────────────────────────────────────────────
// 甲己合土, 乙庚合金, 丙辛合水, 丁壬合木, 戊癸合火

const CHEONGAN_HAP: Record<string, { partner: string; hwa: string }> = {
  甲: { partner: '己', hwa: '土' },  己: { partner: '甲', hwa: '土' },
  乙: { partner: '庚', hwa: '金' },  庚: { partner: '乙', hwa: '金' },
  丙: { partner: '辛', hwa: '水' },  辛: { partner: '丙', hwa: '水' },
  丁: { partner: '壬', hwa: '木' },  壬: { partner: '丁', hwa: '木' },
  戊: { partner: '癸', hwa: '火' },  癸: { partner: '戊', hwa: '火' },
};

// ─── 천간충 ───────────────────────────────────────────────────
// 甲庚, 乙辛, 丙壬, 丁癸 (陰陽 同列 7충)

const CHEONGAN_CHUNG: Record<string, string> = {
  甲: '庚', 庚: '甲',
  乙: '辛', 辛: '乙',
  丙: '壬', 壬: '丙',
  丁: '癸', 癸: '丁',
};

// ─── 지지 육합 ────────────────────────────────────────────────

const JIJI_HAP: Record<string, { partner: string; result: string }> = {
  子: { partner: '丑', result: '土' },  丑: { partner: '子', result: '土' },
  寅: { partner: '亥', result: '木' },  亥: { partner: '寅', result: '木' },
  卯: { partner: '戌', result: '火' },  戌: { partner: '卯', result: '火' },
  辰: { partner: '酉', result: '金' },  酉: { partner: '辰', result: '金' },
  巳: { partner: '申', result: '水' },  申: { partner: '巳', result: '水' },
  午: { partner: '未', result: '土' },  未: { partner: '午', result: '土' },
};

// ─── 지지충 ───────────────────────────────────────────────────

const JIJI_CHUNG: Record<string, string> = {
  子: '午', 午: '子',
  丑: '未', 未: '丑',
  寅: '申', 申: '寅',
  卯: '酉', 酉: '卯',
  辰: '戌', 戌: '辰',
  巳: '亥', 亥: '巳',
};

// ─── 지지해 (六害) ────────────────────────────────────────────

const JIJI_HAE: Record<string, string> = {
  子: '未', 未: '子',
  丑: '午', 午: '丑',
  寅: '巳', 巳: '寅',
  卯: '辰', 辰: '卯',
  申: '亥', 亥: '申',
  酉: '戌', 戌: '酉',
};

// ─── 지지파 (六破) ────────────────────────────────────────────

const JIJI_PA: Record<string, string> = {
  子: '酉', 酉: '子',
  午: '卯', 卯: '午',
  寅: '亥', 亥: '寅',
  巳: '申', 申: '巳',
  辰: '丑', 丑: '辰',
  未: '戌', 戌: '未',
};

// ─── 지지삼형 ─────────────────────────────────────────────────
// 寅巳申 무은지형, 丑未戌 지세지형, 子卯 무례지형

const SAMHYEONG_3: Array<Set<string>> = [
  new Set(['寅', '巳', '申']),
  new Set(['丑', '未', '戌']),
];

// 상형(相刑): 子卯
const SANGHYEONG: [string, string] = ['子', '卯'];

// 자형(自刑): 辰辰, 午午, 酉酉, 亥亥 (동일 자 2개 이상일 때)
const JAHYEONG = new Set(['辰', '午', '酉', '亥']);

// ─── 지지삼합 ─────────────────────────────────────────────────

const SAMHAP_GROUPS: Array<{ chars: [string, string, string]; result: string; name: string }> = [
  { chars: ['寅', '午', '戌'], result: '火', name: '인오술' },
  { chars: ['申', '子', '辰'], result: '水', name: '신자진' },
  { chars: ['亥', '卯', '未'], result: '木', name: '해묘미' },
  { chars: ['巳', '酉', '丑'], result: '金', name: '사유축' },
];

// ─── 지지방합 ─────────────────────────────────────────────────

const BANGHAP_GROUPS: Array<{ chars: [string, string, string]; result: string; name: string }> = [
  { chars: ['寅', '卯', '辰'], result: '木', name: '인묘진' },
  { chars: ['巳', '午', '未'], result: '火', name: '사오미' },
  { chars: ['申', '酉', '戌'], result: '金', name: '신유술' },
  { chars: ['亥', '子', '丑'], result: '水', name: '해자축' },
];

// ─── 타입 ─────────────────────────────────────────────────────

export interface RelationsResult {
  /** 천간합 문자열 목록 */
  cheonganHaps: string[];
  /** 천간충 문자열 목록 */
  cheonganChungs: string[];
  /** 지지합(육합) 문자열 목록 */
  jijiHaps: string[];
  /** 지지충 문자열 목록 */
  jijiChungs: string[];
  /** 지지형 문자열 목록 */
  jijiHyeongs: string[];
  /** 지지해 문자열 목록 */
  jijiHaes: string[];
  /** 지지파 문자열 목록 */
  jijiPas: string[];
  /** 삼합·방합·반합 문자열 목록 */
  jijiSamhaps: string[];
  /** 오행 분포 텍스트 (예: "목 1  화 2  토 1  금 2  수 2") */
  ohaengCount: string;
  /** 오행 분포 숫자 맵 (레이더 차트용) */
  ohaengDistribution: Record<string, number>;
}

// ─── 메인 함수 ───────────────────────────────────────────────

interface Pillar { gan: string; ji: string }

export function computeRelations(
  pillars: {
    year: Pillar;
    month: Pillar;
    day: Pillar;
    hour: Pillar | null;
  },
  ohaengOf: (gan: string, kind: 'gan' | 'ji') => string,
): RelationsResult {

  // ── 활성 기둥 목록 (시주 null 이면 제외) ──
  const entries: Array<{ pos: PosKey; gan: string; ji: string }> = [
    { pos: '연주', gan: pillars.year.gan,  ji: pillars.year.ji  },
    { pos: '월주', gan: pillars.month.gan, ji: pillars.month.ji },
    { pos: '일주', gan: pillars.day.gan,   ji: pillars.day.ji   },
    ...(pillars.hour ? [{ pos: '시주' as PosKey, gan: pillars.hour.gan, ji: pillars.hour.ji }] : []),
  ];

  const n = entries.length;

  // ── 천간합 ──
  const cheonganHaps: string[] = [];
  const seenCGHap = new Set<string>();
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const a = entries[i], b = entries[j];
      const info = CHEONGAN_HAP[a.gan];
      if (info && info.partner === b.gan) {
        const key = [a.gan, b.gan].sort().join('');
        if (!seenCGHap.has(key)) {
          seenCGHap.add(key);
          cheonganHaps.push(
            `${ganToKorean(a.gan)}${ganToKorean(b.gan)}합 → 화${ohaengToKorean(info.hwa)} — ${a.pos} × ${b.pos}`
          );
        }
      }
    }
  }

  // ── 천간충 ──
  const cheonganChungs: string[] = [];
  const seenCGChung = new Set<string>();
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const a = entries[i], b = entries[j];
      if (CHEONGAN_CHUNG[a.gan] === b.gan) {
        const key = [a.gan, b.gan].sort().join('');
        if (!seenCGChung.has(key)) {
          seenCGChung.add(key);
          cheonganChungs.push(
            `${ganToKorean(a.gan)}${ganToKorean(b.gan)}충 — ${a.pos} × ${b.pos}`
          );
        }
      }
    }
  }

  // ── 지지합 ──
  const jijiHaps: string[] = [];
  const seenJJHap = new Set<string>();
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const a = entries[i], b = entries[j];
      const info = JIJI_HAP[a.ji];
      if (info && info.partner === b.ji) {
        const key = [a.ji, b.ji].sort().join('');
        if (!seenJJHap.has(key)) {
          seenJJHap.add(key);
          jijiHaps.push(
            `${jiToKorean(a.ji)}${jiToKorean(b.ji)}합 → ${ohaengToKorean(info.result)} — ${a.pos} × ${b.pos}`
          );
        }
      }
    }
  }

  // ── 지지충 ──
  const jijiChungs: string[] = [];
  const seenJJChung = new Set<string>();
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const a = entries[i], b = entries[j];
      if (JIJI_CHUNG[a.ji] === b.ji) {
        const key = [a.ji, b.ji].sort().join('');
        if (!seenJJChung.has(key)) {
          seenJJChung.add(key);
          jijiChungs.push(
            `${jiToKorean(a.ji)}${jiToKorean(b.ji)}충 — ${a.pos} × ${b.pos}`
          );
        }
      }
    }
  }

  // ── 지지해 ──
  const jijiHaes: string[] = [];
  const seenJJHae = new Set<string>();
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const a = entries[i], b = entries[j];
      if (JIJI_HAE[a.ji] === b.ji) {
        const key = [a.ji, b.ji].sort().join('');
        if (!seenJJHae.has(key)) {
          seenJJHae.add(key);
          jijiHaes.push(
            `${jiToKorean(a.ji)}${jiToKorean(b.ji)}해 — ${a.pos} × ${b.pos}`
          );
        }
      }
    }
  }

  // ── 지지파 ──
  const jijiPas: string[] = [];
  const seenJJPa = new Set<string>();
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const a = entries[i], b = entries[j];
      if (JIJI_PA[a.ji] === b.ji) {
        const key = [a.ji, b.ji].sort().join('');
        if (!seenJJPa.has(key)) {
          seenJJPa.add(key);
          jijiPas.push(
            `${jiToKorean(a.ji)}${jiToKorean(b.ji)}파 — ${a.pos} × ${b.pos}`
          );
        }
      }
    }
  }

  // ── 지지형 ──
  const jijiHyeongs: string[] = [];
  const jiSet = entries.map(e => e.ji);

  // 삼형 (3자)
  for (const grp of SAMHYEONG_3) {
    const present = entries.filter(e => grp.has(e.ji));
    if (present.length >= 2) {
      // 2개 이상 있으면 불완전 삼형이라도 표기
      const kr = present.map(e => jiToKorean(e.ji)).join('') + '형';
      const posStr = present.map(e => e.pos).join(' × ');
      const suffix = present.length === 3 ? '' : ' (삼형 미완)';
      jijiHyeongs.push(`${kr}${suffix} — ${posStr}`);
    }
  }

  // 상형 子卯
  const zaIdx = entries.findIndex(e => e.ji === '子');
  const myoIdx = entries.findIndex(e => e.ji === '卯');
  if (zaIdx !== -1 && myoIdx !== -1) {
    jijiHyeongs.push(
      `자묘형 무례지형 — ${entries[zaIdx].pos} × ${entries[myoIdx].pos}`
    );
  }

  // 자형 (동일 지지 2개 이상)
  const jiCount: Record<string, number> = {};
  entries.forEach(e => { jiCount[e.ji] = (jiCount[e.ji] ?? 0) + 1; });
  for (const [ji, cnt] of Object.entries(jiCount)) {
    if (cnt >= 2 && JAHYEONG.has(ji)) {
      jijiHyeongs.push(`${jiToKorean(ji)}${jiToKorean(ji)}형 자형 — ${jiToKorean(ji)} 2개`);
    }
  }

  // ── 삼합 / 반합 / 방합 ──
  const jijiSamhaps: string[] = [];

  for (const grp of SAMHAP_GROUPS) {
    const present = entries.filter(e => grp.chars.includes(e.ji));
    if (present.length === 3) {
      jijiSamhaps.push(
        `${grp.name} 삼합 → ${ohaengToKorean(grp.result)}국 — ` +
        present.map(e => e.pos).join(' × ')
      );
    } else if (present.length === 2) {
      const center = grp.chars[1];
      const hasCenterInPresent = present.some(e => e.ji === center);
      const type = hasCenterInPresent ? '반합' : '반합(왕지 없음)';
      jijiSamhaps.push(
        `${grp.name} ${type} → ${ohaengToKorean(grp.result)}국 미완 — ` +
        present.map(e => e.pos).join(' × ')
      );
    }
  }

  for (const grp of BANGHAP_GROUPS) {
    const present = entries.filter(e => grp.chars.includes(e.ji));
    if (present.length === 3) {
      jijiSamhaps.push(
        `${grp.name} 방합 → ${ohaengToKorean(grp.result)}방 — ` +
        present.map(e => e.pos).join(' × ')
      );
    } else if (present.length === 2) {
      jijiSamhaps.push(
        `${grp.name} 방합 미완 — ` +
        present.map(e => e.pos).join(' × ')
      );
    }
  }

  // ── 오행 분포 카운트 ──
  const ohaengCnt: Record<string, number> = { 木: 0, 火: 0, 土: 0, 金: 0, 水: 0 };
  for (const e of entries) {
    const go = ohaengOf(e.gan, 'gan');
    const jo = ohaengOf(e.ji,  'ji');
    if (go in ohaengCnt) ohaengCnt[go]++;
    if (jo in ohaengCnt) ohaengCnt[jo]++;
  }
  const ohaengCount = ['木', '火', '土', '金', '水']
    .map(o => `${ohaengToKorean(o)} ${ohaengCnt[o]}`)
    .join('  ');

  // 한글 키 맵 (레이더 차트에서 웹과 동일한 인터페이스 유지)
  const ohaengDistribution: Record<string, number> = {
    목: ohaengCnt['木'], 화: ohaengCnt['火'], 토: ohaengCnt['土'],
    금: ohaengCnt['金'], 수: ohaengCnt['水'],
  };

  return {
    cheonganHaps,
    cheonganChungs,
    jijiHaps,
    jijiChungs,
    jijiHyeongs,
    jijiHaes,
    jijiPas,
    jijiSamhaps,
    ohaengCount,
    ohaengDistribution,
  };
}
