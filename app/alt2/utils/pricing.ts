/**
 * 프로모션 가격 시스템
 *
 * 서버사이드에서 현재 날짜를 확인하여 할인 기간이면 할인가를 반환.
 * promotions 배열에 스케줄을 추가하면 재배포 없이 자동 적용/복귀.
 *
 * 사용법:
 *   const prices = getCurrentPrices();
 *   // prices.deep  → "₩13,900" 또는 할인가
 *   // prices.g2    → "₩18,900" 또는 할인가
 *   // prices.g3    → "₩23,900" 또는 할인가
 */

interface Prices {
  deep: string;
  g2: string;
  g3: string;
}

interface Promotion {
  name: string;
  start: string;  // YYYY-MM-DD (KST 기준)
  end: string;     // YYYY-MM-DD (마지막 날 포함)
  prices: Prices;
}

const DEFAULT_PRICES: Prices = {
  deep: '₩13,900',
  g2: '₩18,900',
  g3: '₩23,900',
};

// ── 프로모션 스케줄 ──
// 여기에 추가하면 해당 기간 동안 자동 할인 적용
const PROMOTIONS: Promotion[] = [
  // 예시: 오픈 기념 할인
  // {
  //   name: '오픈 기념',
  //   start: '2026-05-15',
  //   end: '2026-05-22',
  //   prices: { deep: '₩9,900', g2: '₩13,900', g3: '₩18,900' },
  // },
];

export function getCurrentPrices(): Prices & { promotion: string | null } {
  const now = new Date();
  // KST 기준
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const today = kst.toISOString().slice(0, 10);

  for (const promo of PROMOTIONS) {
    if (today >= promo.start && today <= promo.end) {
      return { ...promo.prices, promotion: promo.name };
    }
  }

  return { ...DEFAULT_PRICES, promotion: null };
}
