'use client';

interface OhengRadarProps {
  distribution: Record<string, number>;
}

const LABELS = ['목', '화', '토', '금', '수'] as const;

export default function OhengRadar({ distribution }: OhengRadarProps) {
  const cx = 150, cy = 150;
  const maxR = 100;
  const maxVal = Math.max(...LABELS.map(l => distribution[l]), 1);

  const getPoint = (index: number, value: number) => {
    const angle = (index * 72 - 90) * (Math.PI / 180);
    const r = (value / maxVal) * maxR;
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  };

  // Grid lines
  const gridLevels = [0.25, 0.5, 0.75, 1];

  // Data polygon
  const dataPoints = LABELS.map((_, i) => getPoint(i, distribution[LABELS[i]]));
  const dataPath = dataPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ') + 'Z';

  // Axis labels
  const labelPos = LABELS.map((_, i) => getPoint(i, maxVal + 20 / maxR * maxVal));

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

        {/* Axes */}
        {LABELS.map((_, i) => {
          const p = getPoint(i, maxVal);
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
          const lx = cx + (maxR + 24) * Math.cos(angle);
          const ly = cy + (maxR + 24) * Math.sin(angle);
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
              {label} {distribution[label]}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
