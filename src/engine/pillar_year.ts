import { findJeolgi, jeolgiToDate } from './data/jeolip_adapter';

/** 천간 (0=甲, 1=乙, ..., 9=癸) */
const CHEONGAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'] as const;
/** 지지 (0=子, 1=丑, ..., 11=亥) */
const JIJI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'] as const;

export interface Pillar {
  gan: string;  // 천간 한자
  ji: string;   // 지지 한자
}

/**
 * 연주(年柱)를 산출한다.
 *
 * - 입춘 절입 시각 이전 출생이면 전년도 간지 사용
 * - 간지: 서기 4년 = 갑자년 기준, 60갑자 순환
 *
 * @param birthDate 양력 생년월일 Date 객체 (시각 포함, KST 가정)
 * @returns Pillar { gan, ji }
 */
export function getYearPillar(birthDate: Date): Pillar {
  const solarYear = birthDate.getFullYear();

  // 해당 연도 입춘 시각 조회
  const ipchun = findJeolgi(solarYear, '입춘');
  if (!ipchun) {
    throw new Error(`입춘 데이터 없음: ${solarYear}년 (지원 범위: 1900~2049)`);
  }
  const ipchunDate = jeolgiToDate(solarYear, ipchun);

  // 입춘 이전이면 전년도 기준
  const baseYear = birthDate < ipchunDate ? solarYear - 1 : solarYear;

  // 천간·지지 계산 (서기 4년 = 갑자년)
  const ganIdx = ((baseYear - 4) % 10 + 10) % 10;
  const jiIdx = ((baseYear - 4) % 12 + 12) % 12;

  return {
    gan: CHEONGAN[ganIdx],
    ji: JIJI[jiIdx],
  };
}
