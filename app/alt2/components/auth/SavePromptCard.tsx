'use client';

interface SavePromptCardProps {
  onClick: () => void;
  saved?: boolean;
}

export default function SavePromptCard({ onClick, saved }: SavePromptCardProps) {
  if (saved) {
    return (
      <div style={{
        padding: '16px 20px',
        background: 'rgba(161,197,172,0.06)',
        border: '1px solid rgba(161,197,172,0.15)',
        borderRadius: 12,
        textAlign: 'center',
      }}>
        <div style={{ fontSize: 13, color: '#a1c5ac', marginBottom: 4 }}>
          시간의 서고에 보관되었습니다
        </div>
        <div style={{ fontSize: 11, color: '#667' }}>
          나중에 이메일로 다시 찾아볼 수 있어요.
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      style={{
        padding: '16px 20px',
        background: 'rgba(240,223,173,0.04)',
        border: '1px solid rgba(240,223,173,0.12)',
        borderRadius: 12,
        textAlign: 'center',
        cursor: 'pointer',
        transition: 'all 0.2s',
      }}
    >
      <div style={{ fontSize: 14, color: '#f0dfad', marginBottom: 6 }}>
        이 해석을 시간의 서고에 보관할까요?
      </div>
      <div style={{ fontSize: 11, color: '#889', lineHeight: 1.6 }}>
        이메일 하나면 충분해요. 언제든 다시 꺼내볼 수 있어요.
      </div>
    </div>
  );
}
