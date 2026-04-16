const JIJI_TIME: Record<string, string> = {
  '子': '00:30',
  '丑': '02:00',
  '寅': '04:00',
  '卯': '06:00',
  '辰': '08:00',
  '巳': '10:00',
  '午': '12:00',
  '未': '14:00',
  '申': '16:00',
  '酉': '18:00',
  '戌': '20:00',
  '亥': '22:00',
};

export function jijiToTime(jiji: string): string {
  return JIJI_TIME[jiji] || '';
}
