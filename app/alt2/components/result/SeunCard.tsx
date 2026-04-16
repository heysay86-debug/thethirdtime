'use client';

interface SeunYear {
  year: number;
  gan: string;
  ji: string;
  reading?: string;
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

export default function SeunCard({ currentYear, nextYear }: SeunCardProps) {
  const years = [currentYear, nextYear].filter(Boolean) as SeunYear[];
  if (years.length === 0) return null;

  return (
    <div className="grid grid-cols-2 gap-3">
      {years.map((yr) => (
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
          {yr.reading && (
            <div className="text-xs mt-2" style={{ color: '#a1c5ac', lineHeight: 1.5 }}>
              {yr.reading}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
