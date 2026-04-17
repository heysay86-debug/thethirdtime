'use client';

interface PeriodAnalysis {
  ganTenGod: string;
  jiTenGod: string;
  yongSinRelation: string;
  score: number;
  rating: string;
  jijiRelations?: { type: string; chars: string[] }[];
}

interface DaeunPeriod {
  startAge: number;
  endAge: number;
  gan: string;
  ji: string;
  analysis?: PeriodAnalysis;
}

interface DaeunTimelineProps {
  periods: DaeunPeriod[];
  currentAge: number;
  startAge?: number;
}

const HANJA_TO_HANGUL: Record<string, string> = {
  '甲': '갑', '乙': '을', '丙': '병', '丁': '정', '戊': '무',
  '己': '기', '庚': '경', '辛': '신', '壬': '임', '癸': '계',
  '子': '자', '丑': '축', '寅': '인', '卯': '묘', '辰': '진',
  '巳': '사', '午': '오', '未': '미', '申': '신', '酉': '유',
  '戌': '술', '亥': '해',
};

const RATING_COLOR: Record<string, string> = {
  '대길': '#a1c5ac',
  '길': '#a1c5ac',
  '평': '#688097',
  '흉': '#e9b8b7',
  '대흉': '#e9b8b7',
};

const RATING_EMOJI: Record<string, string> = {
  '대길': '◎',
  '길': '○',
  '평': '△',
  '흉': '▽',
  '대흉': '✕',
};

export default function DaeunTimeline({ periods, currentAge, startAge = 0 }: DaeunTimelineProps) {
  if (!periods || periods.length === 0) return null;

  // 길운 시기 추출
  const luckyPeriods = periods.filter(p => p.analysis && (p.analysis.rating === '대길' || p.analysis.rating === '길'));

  return (
    <div className="space-y-3">
      {/* 대운수 + 길운 요약 */}
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold" style={{ color: '#dde1e5' }}>
          대운수 : <span style={{ color: '#f0dfad' }}>{startAge}</span>
        </div>
        {luckyPeriods.length > 0 && (
          <div className="text-xs" style={{ color: '#a1c5ac' }}>
            길운 :{' '}
            {luckyPeriods.map(p => `${p.startAge}~${p.endAge}세`).join(', ')}
          </div>
        )}
      </div>

      {/* 타임라인 */}
      <div className="w-full overflow-x-auto pb-2 -mx-2 px-2">
        <div className="flex gap-2" style={{ minWidth: 'max-content' }}>
          {periods.map((period, i) => {
            const isCurrent = currentAge >= period.startAge && currentAge <= period.endAge;
            const isPast = currentAge > period.endAge;
            const analysis = period.analysis;
            const ratingColor = analysis ? (RATING_COLOR[analysis.rating] || '#688097') : '#688097';

            return (
              <div
                key={i}
                className="flex-shrink-0 text-center py-3 px-3"
                style={{
                  backgroundColor: 'rgba(104, 128, 151, 0.10)',
                  borderRadius: 12,
                  border: isCurrent ? '2px solid #f0dfad' : '1px solid transparent',
                  opacity: isPast ? 0.5 : 1,
                  transition: 'all 0.3s ease',
                  minWidth: 80,
                }}
              >
                {/* 간지 */}
                <div className="text-lg font-bold" style={{ color: '#dde1e5' }}>
                  {period.gan}{period.ji}
                </div>
                <div className="text-xs" style={{ color: 'rgba(221, 225, 229, 0.7)' }}>
                  {HANJA_TO_HANGUL[period.gan]}{HANJA_TO_HANGUL[period.ji]}
                </div>

                {/* 나이 */}
                <div className="text-[10px] mt-1" style={{ color: '#688097' }}>
                  {period.startAge}~{period.endAge}세
                </div>

                {/* 평가 */}
                {analysis && (
                  <div className="mt-1.5">
                    <span
                      className="text-[10px] font-semibold px-1.5 py-0.5"
                      style={{
                        color: ratingColor,
                        backgroundColor: `${ratingColor}15`,
                        borderRadius: 4,
                      }}
                    >
                      {RATING_EMOJI[analysis.rating]} {analysis.rating}
                    </span>
                  </div>
                )}

                {/* 십성 */}
                {analysis && (
                  <div className="text-[9px] mt-1" style={{ color: '#688097' }}>
                    {analysis.ganTenGod}·{analysis.jiTenGod}
                  </div>
                )}

                {/* 용신 관계 */}
                {analysis && analysis.yongSinRelation !== '중립' && (
                  <div
                    className="text-[9px] mt-0.5 font-semibold"
                    style={{
                      color: analysis.yongSinRelation === '희신' ? '#a1c5ac' : '#e9b8b7',
                    }}
                  >
                    {analysis.yongSinRelation}
                  </div>
                )}

                {/* 원국-대운 형충합 */}
                {analysis?.jijiRelations && analysis.jijiRelations.length > 0 && (
                  <div className="text-[8px] mt-1 space-y-0.5">
                    {analysis.jijiRelations.slice(0, 2).map((rel: any, j: number) => (
                      <div key={j} style={{ color: rel.type === '충' || rel.type === '형' ? '#e9b8b7' : '#a1c5ac' }}>
                        {rel.ji1}{rel.ji2}{rel.type}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
