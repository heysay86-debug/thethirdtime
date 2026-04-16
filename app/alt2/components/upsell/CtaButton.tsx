'use client';

interface CtaButtonProps {
  label: string;
  price?: string;
  onClick: () => void;
}

export default function CtaButton({ label, price, onClick }: CtaButtonProps) {
  return (
    <button
      onClick={onClick}
      className="w-full py-4 font-semibold text-base transition-transform active:scale-[1.02]"
      style={{
        backgroundColor: '#dde1e5',
        color: '#3e4857',
        borderRadius: 20,
        boxShadow: '0 0 24px rgba(221, 225, 229, 0.3)',
      }}
    >
      {label}
      {price && (
        <span className="ml-2 text-sm font-normal" style={{ opacity: 0.7 }}>
          — {price}
        </span>
      )}
    </button>
  );
}
