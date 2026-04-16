'use client';

interface SectionDividerProps {
  icon?: string;
}

export default function SectionDivider({ icon }: SectionDividerProps) {
  return (
    <div className="flex items-center gap-3 my-8">
      <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(104, 128, 151, 0.25)' }} />
      {icon ? (
        <img src={`/icon/${icon}.svg`} alt="" style={{ width: 20, height: 20, opacity: 0.5 }} />
      ) : (
        <div
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            backgroundColor: 'rgba(104, 128, 151, 0.4)',
          }}
        />
      )}
      <div className="flex-1 h-px" style={{ backgroundColor: 'rgba(104, 128, 151, 0.25)' }} />
    </div>
  );
}
