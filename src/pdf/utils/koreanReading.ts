/**
 * 한자 → 한글 읽기 유틸리티
 *
 * 규칙: 한자(漢字) 표기 시 반드시 한글 읽기를 괄호로 병기
 * 예) 壬水(임수), 丙寅(병인)년, 丁酉(정유)월, 壬戌(임술)일, 庚子(경자)시
 */

// ─── 천간 ─────────────────────────────────────────────────────

export const GAN_KOREAN: Record<string, string> = {
  甲: '갑', 乙: '을', 丙: '병', 丁: '정', 戊: '무',
  己: '기', 庚: '경', 辛: '신', 壬: '임', 癸: '계',
};

// ─── 지지 ─────────────────────────────────────────────────────

export const JI_KOREAN: Record<string, string> = {
  子: '자', 丑: '축', 寅: '인', 卯: '묘', 辰: '진',
  巳: '사', 午: '오', 未: '미', 申: '신', 酉: '유', 戌: '술', 亥: '해',
};

// ─── 오행 ─────────────────────────────────────────────────────

export const OHAENG_KOREAN: Record<string, string> = {
  木: '목', 火: '화', 土: '토', 金: '금', 水: '수',
};

// ─── 기본 변환 ────────────────────────────────────────────────

export const ganToKorean  = (g: string): string => GAN_KOREAN[g]    ?? g;
export const jiToKorean   = (j: string): string => JI_KOREAN[j]     ?? j;
export const ohaengToKorean = (o: string): string => OHAENG_KOREAN[o] ?? o;

// ─── 복합 표기 ────────────────────────────────────────────────

/** 간지 합독 — 壬戌 → "임술" */
export function ganjiReading(gan: string, ji: string): string {
  return ganToKorean(gan) + jiToKorean(ji);
}

/** 간지 병기 표기 — 壬戌 → "壬戌(임술)" */
export function ganjiLabel(gan: string, ji: string): string {
  return `${gan}${ji}(${ganjiReading(gan, ji)})`;
}

/** 일간+오행 표기 — 壬,水 → "壬水(임수)" */
export function ganOhaengLabel(gan: string, ohaeng: string): string {
  return `${gan}${ohaeng}(${ganToKorean(gan)}${ohaengToKorean(ohaeng)})`;
}

/** 천간 단독 병기 — 壬 → "壬(임)" */
export function ganLabel(g: string): string {
  return `${g}(${ganToKorean(g)})`;
}

/** 지지 단독 병기 — 戌 → "戌(술)" */
export function jiLabel(j: string): string {
  return `${j}(${jiToKorean(j)})`;
}

/** 오행 병기 — 木 → "木(목)" */
export function ohaengLabel(o: string): string {
  return `${o}(${ohaengToKorean(o)})`;
}

/**
 * 사주 소개 문장 생성
 * 예) 壬水(임수) 일간으로 태어난 이대운 님의 사주는
 *     丙寅(병인)년 丁酉(정유)월 壬戌(임술)일 庚子(경자)시의
 *     네 기둥으로 이루어져 있습니다.
 */
export function buildIntroSentence(
  userName: string,
  dayGan: string,
  dayGanOhaeng: string,
  year:  { gan: string; ji: string },
  month: { gan: string; ji: string },
  day:   { gan: string; ji: string },
  hour:  { gan: string; ji: string } | null,
): string {
  const dayMaster = ganToKorean(dayGan) + ohaengToKorean(dayGanOhaeng);
  const yearStr   = ganjiReading(year.gan,  year.ji)  + '년';
  const monthStr  = ganjiReading(month.gan, month.ji) + '월';
  const dayStr    = ganjiReading(day.gan,   day.ji)   + '일';
  const hourStr   = hour
    ? ganjiReading(hour.gan, hour.ji) + '시'
    : '시각 미상';
  const pillarsStr = `${yearStr} ${monthStr} ${dayStr} ${hourStr}`;

  return `${dayMaster} 일간으로 태어난 ${userName} 님의 사주는 ${pillarsStr}의 네 기둥으로 이루어져 있습니다.`;
}
