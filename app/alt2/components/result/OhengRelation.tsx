'use client';

export default function OhengRelation() {
  const elements = [
    { name: '목', icon: 'mok_yang', angle: -90, color: '#22c55e' },
    { name: '화', icon: 'hwa_yang', angle: -18, color: '#ef4444' },
    { name: '토', icon: 'to_yang', angle: 54, color: '#a3803c' },
    { name: '금', icon: 'geum_yang', angle: 126, color: '#94a3b8' },
    { name: '수', icon: 'su_yang', angle: 198, color: '#3b82f6' },
  ];

  const r = 100;
  const cx = 150, cy = 150;

  const getPos = (angle: number) => ({
    x: cx + r * Math.cos((angle * Math.PI) / 180),
    y: cy + r * Math.sin((angle * Math.PI) / 180),
  });

  const getMidArrow = (from: { x: number; y: number }, to: { x: number; y: number }) => {
    const midX = (from.x + to.x) / 2;
    const midY = (from.y + to.y) / 2;
    const angleDeg = Math.atan2(to.y - from.y, to.x - from.x) * (180 / Math.PI);
    return { midX, midY, angleDeg };
  };

  return (
    <div className="flex justify-center">
      <svg viewBox="0 0 300 300" width={280} height={280}>
        {/* Sangsaeng (상생) lines - solid */}
        {elements.map((_, i) => {
          const from = getPos(elements[i].angle);
          const to = getPos(elements[(i + 1) % 5].angle);
          const { midX, midY, angleDeg } = getMidArrow(from, to);
          return (
            <g key={`saeng-${i}`}>
              <line
                x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                stroke="#a1c5ac" strokeWidth={1.5} opacity={0.5}
              />
              <polygon
                points="-5,-4 5,0 -5,4"
                fill="#a1c5ac"
                opacity={0.7}
                transform={`translate(${midX}, ${midY}) rotate(${angleDeg})`}
              />
            </g>
          );
        })}

        {/* Sanggeuk (상극) lines - dashed */}
        {[0, 1, 2, 3, 4].map(i => {
          const from = getPos(elements[i].angle);
          const to = getPos(elements[(i + 2) % 5].angle);
          const { midX, midY, angleDeg } = getMidArrow(from, to);
          return (
            <g key={`geuk-${i}`}>
              <line
                x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                stroke="#e9b8b7" strokeWidth={1} strokeDasharray="4 4" opacity={0.35}
              />
              <polygon
                points="-4,-3 4,0 -4,3"
                fill="#e9b8b7"
                opacity={0.5}
                transform={`translate(${midX}, ${midY}) rotate(${angleDeg})`}
              />
            </g>
          );
        })}

        {/* Element icons + labels */}
        {elements.map((el) => {
          const pos = getPos(el.angle);
          return (
            <g key={el.name}>
              <image
                href={`/icon/${el.icon}.svg`}
                x={pos.x - 16} y={pos.y - 16}
                width={32} height={32}
              />
              <text
                x={pos.x} y={pos.y + 28}
                textAnchor="middle"
                fill="#dde1e5"
                fontSize={12}
                fontWeight={600}
              >
                {el.name}
              </text>
            </g>
          );
        })}

        {/* Center labels */}
        <text x={cx} y={cy - 6} textAnchor="middle" fill="#a1c5ac" fontSize={11}>
          상생 →
        </text>
        <text x={cx} y={cx + 10} textAnchor="middle" fill="#e9b8b7" fontSize={11}>
          상극 - -
        </text>
      </svg>
    </div>
  );
}
