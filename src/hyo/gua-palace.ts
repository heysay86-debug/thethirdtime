/**
 * 64괘 팔궁(八宮) 체계 — 世應 · 지지 · 육친 산출
 *
 * 8궁: 건(金) 태(金) 이(火) 진(木) 손(木) 감(水) 간(土) 곤(土)
 * 각 궁에서 본궁→1세→2세→3세→4세→5세→유혼→귀혼 순서로 8괘 생성
 * 世 위치: 본궁=6, 1세=1, 2세=2, 3세=3, 4세=4, 5세=5, 유혼=4, 귀혼=3
 * 應 위치: (世+2)%6+1 (항상 3효 차이)
 */

// ─── 오행 ────────────────────────────────────────────────────

type Wuxing = '木' | '火' | '土' | '金' | '水';

const DIZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'] as const;
type Dizhi = typeof DIZHI[number];

export const DIZHI_WUXING: Record<Dizhi, Wuxing> = {
  '子': '水', '丑': '土', '寅': '木', '卯': '木', '辰': '土', '巳': '火',
  '午': '火', '未': '土', '申': '金', '酉': '金', '戌': '土', '亥': '水',
};

// ─── 팔궁 정의 ──────────────────────────────────────────────

interface PalaceInfo {
  name: string;
  wuxing: Wuxing;
  trigram: number[];
  innerDizhi: [Dizhi, Dizhi, Dizhi];
  outerDizhi: [Dizhi, Dizhi, Dizhi];
}

// ─── 팔궁 괘 생성 ───────────────────────────────────────────

// 궁에서 8괘 생성하고 lookup 테이블 구축
// key: "b0,b1,b2,b3,b4,b5" (괘 비트열)

export interface GuaPalaceInfo {
  palace: PalaceInfo;
  palaceIndex: number;  // 궁 내 순서 (0=본궁 ~ 7=귀혼)
  shi: number;          // 世 위치 (1~6, 초효~상효)
  ying: number;         // 應 위치 (1~6)
  // 6효 각각의 지지·육친
  yaoDizhi: [Dizhi, Dizhi, Dizhi, Dizhi, Dizhi, Dizhi]; // 초효~상효
  yaoLiuqin: [string, string, string, string, string, string]; // 육친
}

const SHI_POSITIONS = [6, 1, 2, 3, 4, 5, 4, 3]; // 본궁~귀혼

function flipBit(b: number): number { return b === 1 ? 0 : 1; }

function getLiuqin(palaceWuxing: Wuxing, yaoWuxing: Wuxing): string {
  // 오행 상생상극으로 육친 결정
  // 궁 오행이 '나', 효 오행이 '상대'
  const SHENG: Record<Wuxing, Wuxing> = { '木': '火', '火': '土', '土': '金', '金': '水', '水': '木' };
  const KE: Record<Wuxing, Wuxing> = { '木': '土', '火': '金', '土': '水', '金': '木', '水': '火' };

  if (palaceWuxing === yaoWuxing) return '兄'; // 형제
  if (SHENG[palaceWuxing] === yaoWuxing) return '孫'; // 자손 (내가 생)
  if (KE[palaceWuxing] === yaoWuxing) return '財'; // 처재 (내가 극)
  if (SHENG[yaoWuxing] === palaceWuxing) return '父'; // 부모 (나를 생)
  if (KE[yaoWuxing] === palaceWuxing) return '官'; // 관귀 (나를 극)
  return '?';
}

// 지지 배당: 각 효의 지지는 해당 효가 속한 소성괘(내/외)의 궁에서 가져옴
// 내괘(1~3효)의 소성괘 → 해당 궁의 innerDizhi
// 외괘(4~6효)의 소성괘 → 해당 궁의 outerDizhi
// 단, 본궁이 아닌 변화된 괘에서도 각 소성괘가 어느 궁에 해당하는지에 따라 지지가 결정됨

function trigramToIndex(t: number[]): number {
  return t[0] + t[1] * 2 + t[2] * 4;
}

// 8개 소성괘별 지지 배당 (양/음에 따라 다름)
// trigram index → PalaceInfo를 찾아서 지지 가져옴
// 실제로는 소성괘 자체의 지지 배당이 고정

interface TrigramDizhi {
  inner: [Dizhi, Dizhi, Dizhi];
  outer: [Dizhi, Dizhi, Dizhi];
}

const TRIGRAM_DIZHI: Record<number, TrigramDizhi> = {
  // index: trigramIndex([b0,b1,b2])
  // 7=건(111): 양, 子寅辰 / 午申戌
  7: { inner: ['子', '寅', '辰'], outer: ['午', '申', '戌'] },
  // 3=태(110): 음, 巳卯丑 / 亥酉未
  3: { inner: ['巳', '卯', '丑'], outer: ['亥', '酉', '未'] },
  // 5=리(101): 음, 卯丑亥 / 酉未巳
  5: { inner: ['卯', '丑', '亥'], outer: ['酉', '未', '巳'] },
  // 1=진(001): 양, 子寅辰 / 午申戌
  1: { inner: ['子', '寅', '辰'], outer: ['午', '申', '戌'] },
  // 6=손(011): 음, 丑亥酉 / 未巳卯
  6: { inner: ['丑', '亥', '酉'], outer: ['未', '巳', '卯'] },
  // 2=감(010): 양, 寅辰午 / 申戌子
  2: { inner: ['寅', '辰', '午'], outer: ['申', '戌', '子'] },
  // 4=간(100): 양, 辰午申 / 戌子寅
  4: { inner: ['辰', '午', '申'], outer: ['戌', '子', '寅'] },
  // 0=곤(000): 음, 未巳卯 / 丑亥酉
  0: { inner: ['未', '巳', '卯'], outer: ['丑', '亥', '酉'] },
};

// 궁 인덱스 → 궁 오행
const PALACE_WUXING: Record<number, Wuxing> = {
  7: '金', // 건
  3: '金', // 태
  5: '火', // 이
  1: '木', // 진
  6: '木', // 손
  2: '水', // 감
  4: '土', // 간
  0: '土', // 곤
};

const PALACE_NAME: Record<number, string> = {
  7: '건궁', 3: '태궁', 5: '이궁', 1: '진궁',
  6: '손궁', 2: '감궁', 4: '간궁', 0: '곤궁',
};

// ─── 전체 64괘 lookup 생성 ──────────────────────────────────

const GUA_PALACE_MAP = new Map<string, GuaPalaceInfo>();

function buildLookup() {
  if (GUA_PALACE_MAP.size > 0) return;

  const pureTrigramIndices = [7, 3, 5, 1, 6, 2, 4, 0]; // 건태이진손감간곤

  for (const pureIdx of pureTrigramIndices) {
    const pureTrigram = [
      pureIdx & 1,
      (pureIdx >> 1) & 1,
      (pureIdx >> 2) & 1,
    ];
    const palaceWuxing = PALACE_WUXING[pureIdx];
    const palaceName = PALACE_NAME[pureIdx];

    // 본궁괘: 상하 모두 같은 소성괘
    let gua = [...pureTrigram, ...pureTrigram]; // [b0..b5]

    for (let step = 0; step < 8; step++) {
      if (step > 0 && step <= 5) {
        // 1세~5세: step번째 효(1-indexed) 뒤집기
        gua[step - 1] = flipBit(gua[step - 1]);
      } else if (step === 6) {
        // 유혼: 4효(index 3)를 원래 값으로 복원
        gua[3] = pureTrigram[0]; // 외괘 첫효 = pureTrigram[0]
        // 아니, 4효는 외괘의 첫 효. 5세에서 4효는 이미 뒤집혀 있음.
        // 유혼 = 5세에서 4효만 원래로 복원
        // 5세 상태: [f0,f1,f2,f3,f4,p5] (f=flipped, p=pure)
        // 유혼: [f0,f1,f2,p3,f4,p5]
        gua[3] = pureTrigram[0];
      } else if (step === 7) {
        // 귀혼: 하괘(1~3효)를 원래로 복원
        gua[0] = pureTrigram[0];
        gua[1] = pureTrigram[1];
        gua[2] = pureTrigram[2];
      }

      const key = gua.join(',');
      const shi = SHI_POSITIONS[step];
      const ying = ((shi + 2) % 6) + 1;

      // 지지 산출: 내괘(0~2)와 외괘(3~5) 각각의 소성괘로 결정
      const innerTriIdx = trigramToIndex(gua.slice(0, 3));
      const outerTriIdx = trigramToIndex(gua.slice(3, 6));
      const innerDz = TRIGRAM_DIZHI[innerTriIdx].inner;
      const outerDz = TRIGRAM_DIZHI[outerTriIdx].outer;
      const yaoDizhi: [Dizhi, Dizhi, Dizhi, Dizhi, Dizhi, Dizhi] = [
        innerDz[0], innerDz[1], innerDz[2],
        outerDz[0], outerDz[1], outerDz[2],
      ];

      // 육친 산출: 궁 오행 vs 각 효 지지의 오행
      const yaoLiuqin = yaoDizhi.map(dz => getLiuqin(palaceWuxing, DIZHI_WUXING[dz])) as
        [string, string, string, string, string, string];

      GUA_PALACE_MAP.set(key, {
        palace: { name: palaceName, wuxing: palaceWuxing, trigram: pureTrigram,
                  innerDizhi: innerDz, outerDizhi: outerDz },
        palaceIndex: step,
        shi,
        ying,
        yaoDizhi,
        yaoLiuqin,
      });

      // 다음 step을 위해 gua 복사
      gua = [...gua];
    }
  }
}

// ─── 외부 API ────────────────────────────────────────────────

export function getGuaPalace(gua: number[]): GuaPalaceInfo | null {
  buildLookup();
  const key = gua.join(',');
  return GUA_PALACE_MAP.get(key) || null;
}

export function getPalaceLabel(index: number): string {
  const labels = ['본궁', '1세', '2세', '3세', '4세', '5세', '유혼', '귀혼'];
  return labels[index] || '?';
}

// 한글 육친명
export function liuqinKorean(lq: string): string {
  const map: Record<string, string> = {
    '父': '부모', '兄': '형제', '官': '관귀', '財': '처재', '孫': '자손',
  };
  return map[lq] || lq;
}
