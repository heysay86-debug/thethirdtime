'use client';

interface SinsalRowProps {
  sinsalList: { name: string; position: string }[];
}

export default function SinsalRow({ sinsalList }: SinsalRowProps) {
  if (!sinsalList || sinsalList.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {sinsalList.map((sinsal, i) => (
        <span
          key={i}
          className="text-sm px-3 py-1"
          style={{
            color: '#688097',
            border: '1px solid rgba(104, 128, 151, 0.2)',
            borderRadius: 12,
          }}
        >
          {sinsal.name} <span style={{ fontSize: 11 }}>({sinsal.position})</span>
        </span>
      ))}
    </div>
  );
}
