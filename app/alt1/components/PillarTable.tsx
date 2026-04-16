'use client';

interface Pillar {
  gan: string;
  ji: string;
}

interface PillarTableProps {
  pillars: {
    year: Pillar;
    month: Pillar;
    day: Pillar;
    hour: Pillar | null;
  };
  tenGods: {
    yearGan: string;
    monthGan: string;
    dayGan: string;
    hourGan: string | null;
    yearJi: string;
    monthJi: string;
    dayJi: string;
    hourJi: string | null;
  };
}

const ELEMENT_COLORS: Record<string, string> = {
  '甲': '#22c55e', '乙': '#22c55e',  // 木 green
  '丙': '#ef4444', '丁': '#ef4444',  // 火 red
  '戊': '#a3803c', '己': '#a3803c',  // 土 brown
  '庚': '#94a3b8', '辛': '#94a3b8',  // 金 silver
  '壬': '#3b82f6', '癸': '#3b82f6',  // 水 blue
  '子': '#3b82f6', '丑': '#a3803c', '寅': '#22c55e', '卯': '#22c55e',
  '辰': '#a3803c', '巳': '#ef4444', '午': '#ef4444', '未': '#a3803c',
  '申': '#94a3b8', '酉': '#94a3b8', '戌': '#a3803c', '亥': '#3b82f6',
};

const LABELS = ['시주', '일주', '월주', '연주'];

export default function PillarTable({ pillars, tenGods }: PillarTableProps) {
  const cols = [
    pillars.hour ? { p: pillars.hour, ganTg: tenGods.hourGan!, jiTg: tenGods.hourJi! } : null,
    { p: pillars.day, ganTg: tenGods.dayGan, jiTg: tenGods.dayJi },
    { p: pillars.month, ganTg: tenGods.monthGan, jiTg: tenGods.monthJi },
    { p: pillars.year, ganTg: tenGods.yearGan, jiTg: tenGods.yearJi },
  ];

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="grid grid-cols-4 gap-2">
        {cols.map((col, i) => (
          <div key={i} className="text-center">
            {/* 라벨 */}
            <div className="text-xs text-[#999] mb-1">{LABELS[i]}</div>

            {col ? (
              <div className="bg-white rounded-xl border border-[#E5E5E5] overflow-hidden">
                {/* 십성 (천간) */}
                <div className="text-[10px] text-[#999] py-1 bg-[#F8F8F8]">
                  {col.ganTg}
                </div>
                {/* 천간 */}
                <div
                  className="text-2xl font-bold py-2"
                  style={{ color: ELEMENT_COLORS[col.p.gan] ?? '#333' }}
                >
                  {col.p.gan}
                </div>
                {/* 지지 */}
                <div
                  className="text-2xl font-bold py-2 border-t border-[#F0F0F0]"
                  style={{ color: ELEMENT_COLORS[col.p.ji] ?? '#333' }}
                >
                  {col.p.ji}
                </div>
                {/* 십성 (지지) */}
                <div className="text-[10px] text-[#999] py-1 bg-[#F8F8F8]">
                  {col.jiTg}
                </div>
              </div>
            ) : (
              <div className="bg-[#F8F8F8] rounded-xl border border-[#E5E5E5] py-8 text-[#BBB] text-sm">
                미상
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
