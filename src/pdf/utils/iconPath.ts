/**
 * 천간·지지 아이콘 PNG 경로 매핑
 *
 * 파일 위치: public/icon/chungan/*.png, public/icon/jiji/*.png
 * 모든 파일 100×100px RGBA
 *
 * 주의: 辛(천간)과 申(지지)은 발음이 같아 파일명 충돌 방지를 위해
 *   "(천간)신.png" / "(지지)신.png" 로 구분.
 */

import path from 'path';

const ICON_DIR = path.join(process.cwd(), 'public/icon');

const GAN_FILENAME: Record<string, string> = {
  '甲': '갑.png',
  '乙': '을.png',
  '丙': '병.png',
  '丁': '정.png',
  '戊': '무.png',
  '己': '기.png',
  '庚': '경.png',
  '辛': '(천간)신.png',
  '壬': '임.png',
  '癸': '계.png',
};

const JI_FILENAME: Record<string, string> = {
  '子': '자.png',
  '丑': '축.png',
  '寅': '인.png',
  '卯': '묘.png',
  '辰': '진.png',
  '巳': '사.png',
  '午': '오.png',
  '未': '미.png',
  '申': '(지지)신.png',
  '酉': '유.png',
  '戌': '술.png',
  '亥': '해.png',
};

/** 천간 한자 → 아이콘 절대경로. 매핑 없으면 빈 문자열 반환. */
export function ganToIconPath(gan: string): string {
  const filename = GAN_FILENAME[gan];
  return filename ? path.join(ICON_DIR, 'chungan', filename) : '';
}

/** 지지 한자 → 아이콘 절대경로. 매핑 없으면 빈 문자열 반환. */
export function jiToIconPath(ji: string): string {
  const filename = JI_FILENAME[ji];
  return filename ? path.join(ICON_DIR, 'jiji', filename) : '';
}
