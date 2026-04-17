/**
 * 십이운성 (Twelve Life Stages) - 일간 기준 지지별 생왕사절 판정
 * 이석영 사주첩경 기준
 *
 * 일간(天干)이 각 지지(地支)를 만났을 때의 생왕사절 단계를 판정한다.
 */

const STAGES = ['장생', '목욕', '관대', '건록', '제왕', '쇠', '병', '사', '묘', '절', '태', '양'] as const;
export type TwelveStageName = typeof STAGES[number];

/**
 * 일간별 십이운성 순서 매핑 (지지 순서: 子丑寅卯辰巳午未申酉戌亥)
 *
 * 각 배열은 子부터 亥까지의 운성을 순서대로 나열한 것이다.
 */
const EARTHLY_BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'] as const;

// 일간 → 지지(子~亥 순) → 운성
const STAGE_TABLE: Record<string, readonly TwelveStageName[]> = {
  '甲': ['목욕', '관대', '건록', '제왕', '쇠',  '병',  '사',  '묘',  '절',  '태',  '양',  '장생'],
  '乙': ['사',  '병',  '쇠',  '제왕', '건록', '관대', '목욕', '장생', '양',  '태',  '절',  '묘'],
  '丙': ['태',  '양',  '장생', '목욕', '관대', '건록', '제왕', '쇠',  '병',  '사',  '묘',  '절'],
  '丁': ['절',  '묘',  '사',  '병',  '쇠',  '제왕', '건록', '관대', '목욕', '장생', '양',  '태'],
  '戊': ['태',  '양',  '장생', '목욕', '관대', '건록', '제왕', '쇠',  '병',  '사',  '묘',  '절'],
  '己': ['절',  '묘',  '사',  '병',  '쇠',  '제왕', '건록', '관대', '목욕', '장생', '양',  '태'],
  '庚': ['사',  '묘',  '절',  '태',  '양',  '장생', '목욕', '관대', '건록', '제왕', '쇠',  '병'],
  '辛': ['장생', '양',  '태',  '절',  '묘',  '사',  '병',  '쇠',  '제왕', '건록', '관대', '목욕'],
  '壬': ['제왕', '쇠',  '병',  '사',  '묘',  '절',  '태',  '양',  '장생', '목욕', '관대', '건록'],
  '癸': ['건록', '관대', '목욕', '장생', '양',  '태',  '절',  '묘',  '사',  '병',  '쇠',  '제왕'],
};

/**
 * 일간과 지지로 십이운성을 판정한다.
 *
 * @param dayGan - 일간 (天干: 甲乙丙丁戊己庚辛壬癸)
 * @param ji - 지지 (地支: 子丑寅卯辰巳午未申酉戌亥)
 * @returns 해당 십이운성 이름
 * @throws 유효하지 않은 천간 또는 지지 입력 시
 */
export function getTwelveStage(dayGan: string, ji: string): TwelveStageName {
  const stages = STAGE_TABLE[dayGan];
  if (!stages) {
    throw new Error(`유효하지 않은 천간: ${dayGan}`);
  }

  const jiIndex = EARTHLY_BRANCHES.indexOf(ji as typeof EARTHLY_BRANCHES[number]);
  if (jiIndex === -1) {
    throw new Error(`유효하지 않은 지지: ${ji}`);
  }

  return stages[jiIndex];
}

/**
 * 4기둥 전체의 십이운성을 계산한다.
 *
 * @param dayGan - 일간 (天干)
 * @param pillars - 연월일시 4기둥의 지지 정보
 * @returns 각 기둥별 십이운성 (시주 없으면 null)
 */
export function calculateTwelveStages(
  dayGan: string,
  pillars: {
    year: { ji: string };
    month: { ji: string };
    day: { ji: string };
    hour: { ji: string } | null;
  },
): {
  year: TwelveStageName;
  month: TwelveStageName;
  day: TwelveStageName;
  hour: TwelveStageName | null;
} {
  return {
    year: getTwelveStage(dayGan, pillars.year.ji),
    month: getTwelveStage(dayGan, pillars.month.ji),
    day: getTwelveStage(dayGan, pillars.day.ji),
    hour: pillars.hour ? getTwelveStage(dayGan, pillars.hour.ji) : null,
  };
}
