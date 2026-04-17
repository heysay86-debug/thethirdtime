'use client';

import { useEffect, useRef, useState } from 'react';

interface PillarTableProps {
  pillars: {
    year: { gan: string; ji: string };
    month: { gan: string; ji: string };
    day: { gan: string; ji: string };
    hour: { gan: string; ji: string } | null;
  };
  tenGods: Record<string, string>;
  jijanggan?: Record<string, string[]>;
  relations?: string[];
  sinsalList?: { name: string; position: string }[];
  twelveStages?: { year: string; month: string; day: string; hour: string | null };
}

const HANJA_TO_HANGUL: Record<string, string> = {
  '甲': '갑', '乙': '을', '丙': '병', '丁': '정', '戊': '무',
  '己': '기', '庚': '경', '辛': '신', '壬': '임', '癸': '계',
  '子': '자', '丑': '축', '寅': '인', '卯': '묘', '辰': '진',
  '巳': '사', '午': '오', '未': '미', '申': '신', '酉': '유',
  '戌': '술', '亥': '해',
};

const ELEMENT_COLORS: Record<string, string> = {
  '甲': '#22c55e', '乙': '#22c55e',
  '丙': '#ef4444', '丁': '#ef4444',
  '戊': '#a3803c', '己': '#a3803c',
  '庚': '#94a3b8', '辛': '#94a3b8',
  '壬': '#3b82f6', '癸': '#3b82f6',
  '子': '#3b82f6', '丑': '#a3803c', '寅': '#22c55e', '卯': '#22c55e',
  '辰': '#a3803c', '巳': '#ef4444', '午': '#ef4444', '未': '#a3803c',
  '申': '#94a3b8', '酉': '#94a3b8', '戌': '#a3803c', '亥': '#3b82f6',
};

const LABELS = ['시주', '일주', '월주', '연주'];
const GAN_KEYS = ['hourGan', 'dayGan', 'monthGan', 'yearGan'];
const JI_KEYS = ['hourJi', 'dayJi', 'monthJi', 'yearJi'];

export default function PillarTable({ pillars, tenGods, jijanggan, relations, sinsalList, twelveStages }: PillarTableProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const cols = [
    { pillar: pillars.hour, label: '시주', ganKey: 'hourGan', jiKey: 'hourJi', posKey: 'hour', sinsalPos: '시주' },
    { pillar: pillars.day, label: '일주', ganKey: 'dayGan', jiKey: 'dayJi', posKey: 'day', sinsalPos: '일주' },
    { pillar: pillars.month, label: '월주', ganKey: 'monthGan', jiKey: 'monthJi', posKey: 'month', sinsalPos: '월주' },
    { pillar: pillars.year, label: '연주', ganKey: 'yearGan', jiKey: 'yearJi', posKey: 'year', sinsalPos: '연주' },
  ];

  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(24px)',
        transition: 'all 0.4s ease-out',
      }}
    >
      <div
        className="w-full grid grid-cols-4 gap-2 p-4"
        style={{
          backgroundColor: 'rgba(104, 128, 151, 0.10)',
          borderRadius: 16,
          backdropFilter: 'blur(8px)',
        }}
      >
        {cols.map((col, i) => (
          <div key={i} className="text-center">
            <div className="text-xs mb-2" style={{ color: '#688097', fontWeight: 600 }}>
              {col.label}
            </div>

            {col.pillar ? (
              <>
                {/* Gan sipseong */}
                <div className="text-[10px] mb-1" style={{ color: '#688097', fontWeight: 600 }}>
                  {tenGods[col.ganKey] || ''}
                </div>
                {/* Gan hanja */}
                <div
                  className="text-[28px] font-bold"
                  style={{ color: ELEMENT_COLORS[col.pillar.gan] ?? '#dde1e5' }}
                >
                  {col.pillar.gan}
                </div>
                {/* Gan hangul */}
                <div className="text-sm" style={{ color: 'rgba(221, 225, 229, 0.7)' }}>
                  {HANJA_TO_HANGUL[col.pillar.gan] || ''}
                </div>

                <div className="my-1 h-px" style={{ backgroundColor: 'rgba(104, 128, 151, 0.15)' }} />

                {/* Ji hanja */}
                <div
                  className="text-[28px] font-bold"
                  style={{ color: ELEMENT_COLORS[col.pillar.ji] ?? '#dde1e5' }}
                >
                  {col.pillar.ji}
                </div>
                {/* Ji hangul */}
                <div className="text-sm" style={{ color: 'rgba(221, 225, 229, 0.7)' }}>
                  {HANJA_TO_HANGUL[col.pillar.ji] || ''}
                </div>
                {/* Ji sipseong */}
                <div className="text-[10px] mt-1" style={{ color: '#688097', fontWeight: 600 }}>
                  {tenGods[col.jiKey] || ''}
                </div>

                {/* Jijanggan */}
                {jijanggan && jijanggan[col.pillar.ji] && (
                  <div className="text-[10px] mt-1" style={{ color: '#688097' }}>
                    {jijanggan[col.pillar.ji].join(' ')}
                  </div>
                )}

                {/* 십이운성 */}
                {twelveStages && (
                  <div className="text-[10px] mt-2 font-semibold" style={{ color: '#f0dfad' }}>
                    {twelveStages[col.posKey as keyof typeof twelveStages] || '-'}
                  </div>
                )}

                {/* 신살 */}
                {sinsalList && sinsalList.length > 0 && (() => {
                  const matching = sinsalList.filter(s => s.position === col.sinsalPos);
                  return matching.length > 0 ? (
                    <div className="text-[9px] mt-1 whitespace-pre-wrap" style={{ color: '#a1c5ac' }}>
                      {matching.map(s => s.name).join('\n')}
                    </div>
                  ) : null;
                })()}
              </>
            ) : (
              <div className="py-8 text-sm" style={{ color: '#688097' }}>미상</div>
            )}
          </div>
        ))}
      </div>

      {/* Relations (합충형해파) */}
      {relations && relations.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3 px-2">
          {relations.map((rel, i) => (
            <span
              key={i}
              className="text-xs px-2 py-1"
              style={{
                backgroundColor: 'rgba(233, 184, 183, 0.15)',
                color: '#e9b8b7',
                borderRadius: 8,
              }}
            >
              {rel}
            </span>
          ))}
        </div>
      )}

      {/* 참고사항 */}
      {sinsalList && sinsalList.length > 0 && (
        <p className="text-[10px] mt-3 px-1 text-center" style={{ color: '#688097' }}>
          ※ 타 서비스에서 제시하는 신살과 일부 다른 이유는 세부 리포트에서 확인 가능합니다
        </p>
      )}
    </div>
  );
}
