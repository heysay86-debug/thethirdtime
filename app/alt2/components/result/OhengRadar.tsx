'use client';

interface OhengCount {
  element: string;
  count: number;
  state: string; // 旺/相/休/囚/死
}

interface OhengRadarProps {
  counts?: OhengCount[];
  distribution?: Record<string, number>; // fallback
}

const LABELS = ['목', '화', '토', '금', '수'] as const;
const ELEMENT_MAP: Record<string, typeof LABELS[number]> = {
  '木': '목', '火': '화', '土': '토', '金': '금', '水': '수',
};

const STATE_VALUE: Record<string, number> = {
  '旺': 5, '相': 4, '休': 3, '囚': 2, '死': 1,
};

const STATE_LABEL: Record<string, string> = {
  '旺': '왕', '相': '상', '休': '휴', '囚': '수', '死': '사',
};

export default function OhengRadar({ counts, distribution }: OhengRadarProps) {
  const cx = 150, cy = 150;
  const maxR = 100;
  const maxVal = 5; // 왕이 최대값

  // counts가 있으면 왕상휴수사 기반, 없으면 개수 기반 fallback
  const stateMap: Record<string, { value: number; state: string }> = {};
  if (counts) {
    for (const c of counts) {
      const label = ELEMENT_MAP[c.element] || c.element;
      stateMap[label] = { value: STATE_VALUE[c.state] || 0, state: c.state };
    }
  }

  const useStates = counts && Object.keys(stateMap).length > 0;
  const values = LABELS.map(l => useStates ? (stateMap[l]?.value || 0) : (distribution?.[l] || 0));
  const effectiveMax = useStates ? maxVal : Math.max(...values, 1);

  const getPoint = (index: number, value: number) => {
    const angle = (index * 72 - 90) * (Math.PI / 180);
    const r = (value / effectiveMax) * maxR;
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  };

  const gridLevels = useStates ? [1/5, 2/5, 3/5, 4/5, 1] : [0.25, 0.5, 0.75, 1];
  const dataPoints = LABELS.map((_, i) => getPoint(i, values[i]));

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 300 300" width={280} height={280}>
        {/* Grid */}
        {gridLevels.map(level => {
          const points = LABELS.map((_, i) => {
            const angle = (i * 72 - 90) * (Math.PI / 180);
            const r = level * maxR;
            return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
          }).join(' ');
          return (
            <polygon
              key={level}
              points={points}
              fill="none"
              stroke="rgba(104, 128, 151, 0.25)"
              strokeWidth={1}
            />
          );
        })}

        {/* Grid labels (왕상휴수사) */}
        {useStates && (
          <>
            {[
              { label: '사', level: 1/5 },
              { label: '수', level: 2/5 },
              { label: '휴', level: 3/5 },
              { label: '상', level: 4/5 },
              { label: '왕', level: 1 },
            ].map(({ label, level }) => (
              <text
                key={label}
                x={cx + 8}
                y={cy - level * maxR + 4}
                fill="rgba(104, 128, 151, 0.4)"
                fontSize={9}
              >
                {label}
              </text>
            ))}
          </>
        )}

        {/* Axes */}
        {LABELS.map((_, i) => {
          const p = getPoint(i, effectiveMax);
          return (
            <line
              key={i}
              x1={cx} y1={cy} x2={p.x} y2={p.y}
              stroke="rgba(104, 128, 151, 0.2)"
              strokeWidth={1}
            />
          );
        })}

        {/* Data fill */}
        <polygon
          points={dataPoints.map(p => `${p.x},${p.y}`).join(' ')}
          fill="rgba(221, 225, 229, 0.15)"
          stroke="#dde1e5"
          strokeWidth={2}
        />

        {/* Data dots */}
        {dataPoints.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={4} fill="#dde1e5" />
        ))}

        {/* Labels */}
        {LABELS.map((label, i) => {
          const angle = (i * 72 - 90) * (Math.PI / 180);
          const lx = cx + (maxR + 28) * Math.cos(angle);
          const ly = cy + (maxR + 28) * Math.sin(angle);
          const state = stateMap[label];
          return (
            <text
              key={label}
              x={lx} y={ly}
              textAnchor="middle"
              dominantBaseline="central"
              fill="#dde1e5"
              fontSize={13}
              fontWeight={600}
            >
              {label} {useStates ? STATE_LABEL[state?.state] || '' : (distribution?.[label] || 0)}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
