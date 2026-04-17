'use client';

interface ParchmentCardProps {
  title: string;
  children: React.ReactNode;
}

export default function ParchmentCard({ title, children }: ParchmentCardProps) {
  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #d4c4a0 0%, #c9b88c 30%, #d6c69a 70%, #cabb8a 100%)',
        border: '2px solid #8b7355',
        padding: '16px 18px',
        position: 'relative',
        boxShadow: 'inset 0 0 20px rgba(100, 80, 50, 0.15), 0 2px 8px rgba(0, 0, 0, 0.3)',
      }}
    >
      <div
        style={{
          fontSize: 15,
          fontWeight: 700,
          fontFamily: '"Noto Sans KR", sans-serif',
          color: '#4a3728',
          marginBottom: 10,
          borderBottom: '1px solid rgba(139, 115, 85, 0.4)',
          paddingBottom: 6,
        }}
      >
        📜 {title}
      </div>

      <div>
        {typeof children === 'string' ? renderParchmentText(children) : children}
      </div>
    </div>
  );
}

function renderParchmentText(text: string) {
  // \n\n으로 큰 블록 분리 후, 각 블록 내부의 ## 소제목도 분리
  const blocks = text.split('\n\n');
  const elements: React.ReactNode[] = [];

  blocks.forEach((block, blockIdx) => {
    // 블록 내부에 ## 소제목이 포함된 경우 분리
    const lines = block.split('\n');
    let currentBody: string[] = [];

    lines.forEach((line, lineIdx) => {
      if (line.startsWith('## ')) {
        // 이전에 쌓인 본문이 있으면 먼저 렌더
        if (currentBody.length > 0) {
          elements.push(
            <p key={`${blockIdx}-body-${lineIdx}`} style={{
              fontSize: 13,
              lineHeight: 1.75,
              fontFamily: '"Pretendard Variable", "Pretendard", sans-serif',
              fontWeight: 400,
              color: '#3a2e1e',
              marginTop: elements.length > 0 ? 8 : 0,
              marginBottom: 0,
            }}>
              {currentBody.join(' ')}
            </p>
          );
          currentBody = [];
        }
        // 소제목 렌더
        elements.push(
          <div key={`${blockIdx}-h-${lineIdx}`} style={{
            fontSize: 13,
            fontWeight: 700,
            fontFamily: '"Noto Sans KR", sans-serif',
            color: '#4a3728',
            marginTop: elements.length > 0 ? 14 : 0,
            marginBottom: 4,
            borderBottom: '1px solid rgba(139, 115, 85, 0.2)',
            paddingBottom: 3,
          }}>
            {line.replace(/^##\s*/, '')}
          </div>
        );
      } else {
        currentBody.push(line);
      }
    });

    // 남은 본문
    if (currentBody.length > 0) {
      const bodyText = currentBody.join(' ').trim();
      if (bodyText) {
        elements.push(
          <p key={`${blockIdx}-body-end`} style={{
            fontSize: 13,
            lineHeight: 1.75,
            fontFamily: '"Pretendard Variable", "Pretendard", sans-serif',
            fontWeight: 400,
            color: '#3a2e1e',
            marginTop: elements.length > 0 ? 6 : 0,
            marginBottom: 0,
          }}>
            {bodyText}
          </p>
        );
      }
    }
  });

  return elements;
}
