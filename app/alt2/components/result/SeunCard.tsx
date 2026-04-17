'use client';

interface PeriodAnalysis {
  ganTenGod: string;
  jiTenGod: string;
  yongSinRelation: string;
  score: number;
  rating: string;
}

interface SeunYear {
  year: number;
  gan: string;
  ji: string;
  analysis?: PeriodAnalysis;
}

interface SeunCardProps {
  currentYear?: SeunYear;
  nextYear?: SeunYear;
}

const HANJA_TO_HANGUL: Record<string, string> = {
  '甲': '갑', '乙': '을', '丙': '병', '丁': '정', '戊': '무',
  '己': '기', '庚': '경', '辛': '신', '壬': '임', '癸': '계',
  '子': '자', '丑': '축', '寅': '인', '卯': '묘', '辰': '진',
  '巳': '사', '午': '오', '未': '미', '申': '신', '酉': '유',
  '戌': '술', '亥': '해',
};

const RATING_COLOR: Record<string, string> = {
  '대길': '#a1c5ac', '길': '#a1c5ac', '평': '#688097', '흉': '#e9b8b7', '대흉': '#e9b8b7',
};

export default function SeunCard({ currentYear, nextYear }: SeunCardProps) {
  const years = [currentYear, nextYear].filter(Boolean) as SeunYear[];
  if (years.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="text-sm font-semibold" style={{ color: '#dde1e5' }}>
        세운 (올해 · 내년)
      </div>
      <div className="grid grid-cols-2 gap-3">
        {years.map((yr) => {
          const a = yr.analysis;
          const ratingColor = a ? (RATING_COLOR[a.rating] || '#688097') : '#688097';

          return (
            <div
              key={yr.year}
              className="p-4 text-center"
              style={{
                backgroundColor: 'rgba(104, 128, 151, 0.15)',
                borderRadius: 16,
              }}
            >
              <div className="text-xs mb-1" style={{ color: '#688097' }}>{yr.year}년</div>
              <div className="text-xl font-bold" style={{ color: '#dde1e5' }}>
                {yr.gan}{yr.ji}
              </div>
              <div className="text-sm" style={{ color: 'rgba(221, 225, 229, 0.7)' }}>
                {HANJA_TO_HANGUL[yr.gan]}{HANJA_TO_HANGUL[yr.ji]}
              </div>

              {a && (
                <div className="mt-2 space-y-1">
                  {/* 평가 */}
                  <span
                    className="text-[10px] font-semibold px-2 py-0.5 inline-block"
                    style={{
                      color: ratingColor,
                      backgroundColor: `${ratingColor}15`,
                      borderRadius: 4,
                    }}
                  >
                    {a.rating} ({a.score}점)
                  </span>

                  {/* 십성 */}
                  <div className="text-[10px]" style={{ color: '#688097' }}>
                    {a.ganTenGod}·{a.jiTenGod}
                  </div>

                  {/* 용신 관계 */}
                  {a.yongSinRelation !== '중립' && (
                    <div
                      className="text-[10px] font-semibold"
                      style={{ color: a.yongSinRelation === '희신' ? '#a1c5ac' : '#e9b8b7' }}
                    >
                      {a.yongSinRelation}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
