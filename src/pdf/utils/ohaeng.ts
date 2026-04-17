/**
 * 오행 유틸리티 — PDF 컴포넌트 공용
 *
 * 천간/지지 → 오행 매핑, 색상, 십성 카테고리
 */

export type Ohaeng = '木' | '火' | '土' | '金' | '水';

const GAN_TO_OHAENG: Record<string, Ohaeng> = {
  甲: '木', 乙: '木',
  丙: '火', 丁: '火',
  戊: '土', 己: '土',
  庚: '金', 辛: '金',
  壬: '水', 癸: '水',
};

const JI_TO_OHAENG: Record<string, Ohaeng> = {
  子: '水', 丑: '土', 寅: '木', 卯: '木',
  辰: '土', 巳: '火', 午: '火', 未: '土',
  申: '金', 酉: '金', 戌: '土', 亥: '水',
};

export function ganToOhaeng(gan: string): Ohaeng {
  return GAN_TO_OHAENG[gan] ?? '土';
}

export function jiToOhaeng(ji: string): Ohaeng {
  return JI_TO_OHAENG[ji] ?? '土';
}

/** 오행 텍스트 색상 */
export function ohaengColor(o: Ohaeng): string {
  switch (o) {
    case '木': return '#2d6a40';
    case '火': return '#a83228';
    case '土': return '#8a6820';
    case '金': return '#4a6275';
    case '水': return '#1e4a7a';
  }
}

/** 오행 연한 배경 틴트 */
export function ohaengBgColor(o: Ohaeng): string {
  switch (o) {
    case '木': return 'rgba(45,106,64,0.08)';
    case '火': return 'rgba(168,50,40,0.08)';
    case '土': return 'rgba(138,104,32,0.08)';
    case '金': return 'rgba(74,98,117,0.08)';
    case '水': return 'rgba(30,74,122,0.08)';
  }
}

/** 오행 테두리/강조 색상 */
export function ohaengAccentColor(o: Ohaeng): string {
  switch (o) {
    case '木': return 'rgba(45,106,64,0.35)';
    case '火': return 'rgba(168,50,40,0.35)';
    case '土': return 'rgba(138,104,32,0.35)';
    case '金': return 'rgba(74,98,117,0.35)';
    case '水': return 'rgba(30,74,122,0.35)';
  }
}

/** 십성 카테고리 */
export type SipseongCategory = 'bigyeon' | 'sik' | 'jae' | 'gwan' | 'in';

export function sipseongCategory(name: string): SipseongCategory {
  switch (name) {
    case '비견': case '겁재': return 'bigyeon';
    case '식신': case '상관': return 'sik';
    case '편재': case '정재': return 'jae';
    case '편관': case '정관': return 'gwan';
    case '편인': case '정인': return 'in';
    default: return 'bigyeon';
  }
}

/** 십성 텍스트 색상 */
export function sipseongColor(name: string): string {
  const cat = sipseongCategory(name);
  switch (cat) {
    case 'bigyeon': return '#1e4a7a';
    case 'sik':     return '#2d6a40';
    case 'jae':     return '#8a6820';
    case 'gwan':    return '#a83228';
    case 'in':      return '#5a3a7a';
  }
}
