'use client';

/**
 * 왕상휴수사 시각화 + 발달/과다/고립 상태 카드
 *
 * 오행 5개의 힘 상태를 바 차트로 표시하고,
 * 주목할 오행(발달/과다/고립/부족)을 카드로 풀어 설명한다.
 */

interface OhengCount {
  element: string;
  count: number;
  withJijanggan: number;
  includesMonthBranch: boolean;
  state: string;
}

interface OhengStatus {
  element: string;
  level: string;
  description: string;
}

interface OhengWangSangProps {
  counts: OhengCount[];
  statuses: OhengStatus[];
  monthElement: string;
}

const ELEMENT_COLORS: Record<string, string> = {
  '木': '#4ade80',
  '火': '#f87171',
  '土': '#d4a853',
  '金': '#94a3b8',
  '水': '#60a5fa',
};

const ELEMENT_KOREAN: Record<string, string> = {
  '木': '목', '火': '화', '土': '토', '金': '금', '水': '수',
};

const STATE_LABELS: Record<string, { korean: string; color: string; width: number }> = {
  '旺': { korean: '왕', color: '#f0dfad', width: 100 },
  '相': { korean: '상', color: '#a1c5ac', width: 80 },
  '休': { korean: '휴', color: '#889', width: 55 },
  '囚': { korean: '수', color: '#667', width: 35 },
  '死': { korean: '사', color: '#556', width: 20 },
};

const LEVEL_BADGE: Record<string, { label: string; bg: string; color: string }> = {
  '발달': { label: '발달', bg: 'rgba(74,222,128,0.12)', color: '#4ade80' },
  '과다': { label: '과다', bg: 'rgba(248,113,113,0.12)', color: '#f87171' },
  '고립': { label: '고립', bg: 'rgba(248,113,113,0.15)', color: '#f87171' },
  '부족': { label: '부족', bg: 'rgba(136,153,170,0.1)', color: '#889' },
};

export default function OhengWangSang({ counts, statuses, monthElement }: OhengWangSangProps) {
  const notableStatuses = statuses.filter(s => s.level !== '보통');

  return (
    <div>
      {/* 월령 기준 표시 */}
      <div style={{
        fontSize: 11, color: '#889', marginBottom: 12, textAlign: 'center',
      }}>
        월령 기준: <span style={{ color: ELEMENT_COLORS[monthElement], fontWeight: 600 }}>
          {ELEMENT_KOREAN[monthElement]}({monthElement})
        </span>
      </div>

      {/* 왕상휴수사 바 차트 */}
      <svg viewBox="0 0 320 180" width="100%" style={{ maxWidth: 360 }}>
        {counts.map((c, i) => {
          const stateInfo = STATE_LABELS[c.state] || STATE_LABELS['休'];
          const y = 8 + i * 34;
          const barWidth = stateInfo.width * 2;
          const elColor = ELEMENT_COLORS[c.element];

          return (
            <g key={c.element}>
              {/* 오행 라벨 */}
              <text x={28} y={y + 16} textAnchor="middle" fill={elColor} fontSize={15} fontWeight={700}>
                {c.element}
              </text>
              <text x={28} y={y + 28} textAnchor="middle" fill="#667" fontSize={9}>
                {ELEMENT_KOREAN[c.element]}
              </text>

              {/* 바 배경 */}
              <rect x={56} y={y + 4} width={200} height={16} rx={3}
                fill="rgba(104,128,151,0.08)"
              />

              {/* 바 */}
              <rect x={56} y={y + 4} width={barWidth} height={16} rx={3}
                fill={stateInfo.color}
                opacity={0.6}
              />

              {/* 카운트 */}
              <text x={56 + barWidth + 6} y={y + 16} fill={stateInfo.color} fontSize={11} fontWeight={600}>
                {c.count}개
              </text>

              {/* 왕상 라벨 */}
              <text x={310} y={y + 16} textAnchor="end" fill={stateInfo.color} fontSize={11}>
                {c.state}({stateInfo.korean})
              </text>

              {/* 월지 포함 표시 */}
              {c.includesMonthBranch && (
                <circle cx={48} cy={y + 14} r={3} fill="#f0dfad" />
              )}
            </g>
          );
        })}
      </svg>

      {/* 범례 */}
      <div style={{
        display: 'flex', justifyContent: 'center', gap: 12, marginTop: 8,
        fontSize: 10, color: '#667',
      }}>
        <span>
          <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#f0dfad', marginRight: 3, verticalAlign: 'middle' }} />
          월지 포함
        </span>
        <span>旺(왕) &gt; 相(상) &gt; 休(휴) &gt; 囚(수) &gt; 死(사)</span>
      </div>

      {/* 발달/과다/고립 상태 카드 */}
      {notableStatuses.length > 0 && (
        <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {notableStatuses.map(s => {
            const badge = LEVEL_BADGE[s.level];
            const elColor = ELEMENT_COLORS[s.element];
            return (
              <div key={s.element} style={{
                padding: '10px 12px',
                background: badge?.bg || 'rgba(104,128,151,0.08)',
                border: `1px solid ${badge?.color || '#556'}22`,
                borderRadius: 10,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: elColor }}>{s.element}</span>
                  <span style={{
                    fontSize: 10, padding: '1px 6px',
                    background: badge?.bg, color: badge?.color,
                    borderRadius: 4, fontWeight: 600,
                  }}>
                    {s.level}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: '#b8bcc0', lineHeight: 1.6 }}>
                  {s.description}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
