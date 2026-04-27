/**
 * 사주 전체 분석 통합 함수
 *
 * 입력: 생년월일시 + 옵션
 * 출력: SajuResult (M8~M14.5 전체 통합 JSON)
 */

import { calculateSaju, SajuInput } from './saju';
import { calculateTenGods } from './ten_gods';
import { calculateAllJijanggan } from './jijanggan';
import { analyzeDayMasterStrength } from './day_master_strength';
import { determineGyeokGuk } from './gyeok_guk';
import { determineYongSin } from './yong_sin';
import { calculateDaeun, calculateSeUn } from './daeun';
import { calculateSinsal } from './sinsal';
import { calculateTwelveStages } from './twelve_stages';
import { SajuResultSchema, SajuResult } from './schema';
import { analyzeOheng } from './oheng_analysis';
import { detectJijiHap, detectCheonganChung } from './relations';
import { analyzeLove } from './love_reading';
import { analyzeMoney } from './money_reading';
import { analyzeBusiness } from './business_reading';

export function analyzeSaju(input: SajuInput): SajuResult {
  // M8: 4기둥
  const saju = calculateSaju(input);
  const pillars = {
    year: saju.yearPillar,
    month: saju.monthPillar,
    day: saju.dayPillar,
    hour: saju.hourPillar,
  };

  const dayStem = saju.dayPillar.gan;

  // M9: 십성
  const tenGods = calculateTenGods(dayStem, pillars);

  // M10: 지장간
  const jijanggan = calculateAllJijanggan(pillars);

  // 십이운성
  const twelveStages = calculateTwelveStages(dayStem, pillars);

  // M11: 신강/신약
  const strength = analyzeDayMasterStrength(dayStem, pillars);

  // M12: 격국
  const gyeokGuk = determineGyeokGuk(dayStem, pillars);

  // M13: 용신
  const yongSin = determineYongSin(dayStem, pillars, strength.level, gyeokGuk.type);

  // M14.6: 신살
  const sinsal = calculateSinsal(pillars);

  // M14.5: 대운/세운 (분석 포함)
  const yongSinElement = yongSin.final.primary as '木' | '火' | '土' | '金' | '水';

  let daeun = null;
  if (input.gender) {
    const [y, m, d] = saju.birth.solar.split('-').map(Number);
    const hh = input.birthTime ? parseInt((saju.birth.adjustedTime ?? input.birthTime).split(':')[0]) : 12;
    const mm = input.birthTime ? parseInt((saju.birth.adjustedTime ?? input.birthTime).split(':')[1]) : 0;
    const adjustedBirthDate = new Date(y, m - 1, d, hh, mm);

    daeun = calculateDaeun(
      pillars.year.gan,
      pillars.month.gan,
      pillars.month.ji,
      input.gender,
      adjustedBirthDate,
      pillars,
      yongSinElement,
    );
  }

  // 세운: 올해부터 10년
  const currentYear = new Date().getFullYear();
  const seun = calculateSeUn(currentYear, currentYear + 9, pillars, yongSinElement);

  // 오행 분석
  const ohengAnalysis = analyzeOheng(pillars);

  // 지지합
  const jijiHap = detectJijiHap(pillars);

  // 천간충
  const cheonganChung = detectCheonganChung(pillars);

  // 번외편: 연애운, 금전운, 사업운
  const readingInput = {
    pillars,
    tenGods,
    sinsal,
    twelveStages,
    yongSin,
    strength,
    daeun,
    seun,
  };

  const loveReading = input.gender ? analyzeLove(readingInput, input.gender) : undefined;
  const moneyReading = analyzeMoney(readingInput);
  const businessReading = analyzeBusiness(readingInput);

  const result: SajuResult = {
    pillars,
    birth: saju.birth,
    tenGods,
    jijanggan,
    twelveStages,
    strength,
    gyeokGuk,
    yongSin,
    sinsal,
    daeun,
    seun,
    ohengAnalysis,
    jijiHap,
    cheonganChung,
    loveReading,
    moneyReading,
    businessReading,
  };

  // Zod 검증
  SajuResultSchema.parse(result);

  return result;
}
