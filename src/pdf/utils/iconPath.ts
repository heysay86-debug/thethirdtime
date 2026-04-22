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
  '甲': 'gap.png',
  '乙': 'eul.png',
  '丙': 'byeong.png',
  '丁': 'jeong.png',
  '戊': 'mu.png',
  '己': 'gi.png',
  '庚': 'gyeong.png',
  '辛': 'sin-chun.png',
  '壬': 'im.png',
  '癸': 'gye.png',
};

const JI_FILENAME: Record<string, string> = {
  '子': 'ja.png',
  '丑': 'chuk.png',
  '寅': 'in.png',
  '卯': 'myo.png',
  '辰': 'jin.png',
  '巳': 'sa.png',
  '午': 'o.png',
  '未': 'mi.png',
  '申': 'sin-ji.png',
  '酉': 'yu.png',
  '戌': 'sul.png',
  '亥': 'hae.png',
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
