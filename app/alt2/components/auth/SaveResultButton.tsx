'use client';

interface SaveResultButtonProps {
  onClick: () => void;
  saved?: boolean;
}

export default function SaveResultButton({ onClick, saved }: SaveResultButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={saved}
      style={{
        padding: '6px 12px',
        background: saved ? 'rgba(161,197,172,0.1)' : 'transparent',
        border: `1px solid ${saved ? 'rgba(161,197,172,0.3)' : 'rgba(221,225,229,0.25)'}`,
        borderRadius: 14,
        color: saved ? '#a1c5ac' : '#688097',
        fontSize: 12,
        cursor: saved ? 'default' : 'pointer',
        transition: 'all 0.2s',
      }}
    >
      {saved ? '저장됨' : '결과 저장'}
    </button>
  );
}
