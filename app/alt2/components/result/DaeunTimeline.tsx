'use client';

interface DaeunPeriod {
  startAge: number;
  endAge: number;
  gan: string;
  ji: string;
}

interface DaeunTimelineProps {
  periods: DaeunPeriod[];
  currentAge: number;
}

const HANJA_TO_HANGUL: Record<string, string> = {
  '甲': '갑', '乙': '을', '丙': '병', '丁': '정', '戊': '무',
  '己': '기', '庚': '경', '辛': '신', '壬': '임', '癸': '계',
  '子': '자', '丑': '축', '寅': '인', '卯': '묘', '辰': '진',
  '巳': '사', '午': '오', '未': '미', '申': '신', '酉': '유',
  '戌': '술', '亥': '해',
};

export default function DaeunTimeline({ periods, currentAge }: DaeunTimelineProps) {
  if (!periods || periods.length === 0) return null;

  return (
    <div className="w-full overflow-x-auto pb-2 -mx-2 px-2">
      <div className="flex gap-2" style={{ minWidth: 'max-content' }}>
        {periods.map((period, i) => {
          const isCurrent = currentAge >= period.startAge && currentAge <= period.endAge;
          const isPast = currentAge > period.endAge;

          return (
            <div
              key={i}
              className="flex-shrink-0 text-center py-3 px-4"
              style={{
                backgroundColor: 'rgba(104, 128, 151, 0.10)',
                borderRadius: 12,
                border: isCurrent ? '2px solid #f0dfad' : '1px solid transparent',
                opacity: isPast ? 0.5 : 1,
                transform: isCurrent ? 'scale(1.05)' : 'scale(1)',
                transition: 'all 0.3s ease',
                minWidth: 72,
              }}
            >
              <div className="text-lg font-bold" style={{ color: '#dde1e5' }}>
                {period.gan}{period.ji}
              </div>
              <div className="text-xs" style={{ color: 'rgba(221, 225, 229, 0.7)' }}>
                {HANJA_TO_HANGUL[period.gan]}{HANJA_TO_HANGUL[period.ji]}
              </div>
              <div className="text-[10px] mt-1" style={{ color: '#688097' }}>
                {period.startAge}~{period.endAge}세
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
