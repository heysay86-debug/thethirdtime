'use client';

interface CtaButtonProps {
  label: string;
  price?: string;
  originalPrice?: string;  // 프로모션 시 원가 (취소선)
  promotion?: string | null;  // 프로모션 이름
  onClick: () => void;
}

export default function CtaButton({ label, price, originalPrice, promotion, onClick }: CtaButtonProps) {
  return (
    <>
      <style jsx>{`
        @keyframes glow-pulse {
          0%, 100% { box-shadow: 0 0 12px rgba(240, 223, 173, 0.4), 0 0 24px rgba(240, 223, 173, 0.2); }
          50% { box-shadow: 0 0 20px rgba(240, 223, 173, 0.6), 0 0 40px rgba(240, 223, 173, 0.3); }
        }
      `}</style>
      {promotion && (
        <div className="text-center mb-2">
          <span
            className="text-xs font-semibold px-3 py-1 inline-block"
            style={{
              backgroundColor: '#e9b8b7',
              color: '#1a1e24',
              borderRadius: 12,
            }}
          >
            🎉 {promotion}
          </span>
        </div>
      )}
      <button
        onClick={onClick}
        className="w-full py-4 font-semibold text-base transition-transform active:scale-[1.02]"
        style={{
          backgroundColor: '#f0dfad',
          color: '#1a1e24',
          borderRadius: 20,
          animation: 'glow-pulse 2s ease-in-out infinite',
        }}
      >
        {label}
        {price && (
          <span className="ml-2 text-sm font-normal">
            —{' '}
            {originalPrice && (
              <span style={{ textDecoration: 'line-through', opacity: 0.4, marginRight: 4 }}>
                {originalPrice}
              </span>
            )}
            <span style={{ opacity: originalPrice ? 1 : 0.6 }}>{price}</span>
          </span>
        )}
      </button>
    </>
  );
}
