/**
 * 유입채널 코드 정의
 *
 * URL 파라미터 ?ch=A002 형태로 유입 추적
 * 파라미터 없으면 A001 (직접 유입)
 */
export const CHANNELS: Record<string, string> = {
  A001: '직접 유입',       // URL 파라미터 없음 (직접 입력, 북마크, 자연 검색)
  A002: '인스타그램',
  A003: '카카오톡 공유',
  A004: '트위터/X',
  A005: '기타 광고',
  A006: '친구 공유 카드',   // 공유용 카드 내 링크로 유입
} as const;

export const DEFAULT_CHANNEL = 'A001';

export function isValidChannel(code: string): boolean {
  return code in CHANNELS;
}
