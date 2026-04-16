'use client';

import { Shield, Compass, Star } from 'lucide-react';

interface CoreJudgmentProps {
  summary: string;
  strengthReading: string;
  gyeokGukReading: string;
  yongSinReading: string;
}

export default function CoreJudgment({ summary, strengthReading, gyeokGukReading, yongSinReading }: CoreJudgmentProps) {
  return (
    <div className="w-full max-w-md mx-auto space-y-3">
      {/* 총평 */}
      <div className="bg-[#f696ff]/10 rounded-xl px-4 py-3 text-center">
        <p className="text-sm font-medium text-[#333]">{summary}</p>
      </div>

      {/* 3개 카드 */}
      <div className="space-y-2">
        <JudgmentCard
          icon={<Shield size={16} />}
          title="신강/신약"
          content={strengthReading}
        />
        <JudgmentCard
          icon={<Compass size={16} />}
          title="격국"
          content={gyeokGukReading}
        />
        <JudgmentCard
          icon={<Star size={16} />}
          title="용신"
          content={yongSinReading}
        />
      </div>
    </div>
  );
}

function JudgmentCard({ icon, title, content }: { icon: React.ReactNode; title: string; content: string }) {
  return (
    <div className="bg-white rounded-xl border border-[#E5E5E5] px-4 py-3">
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-[#f696ff]">{icon}</span>
        <span className="text-xs font-semibold text-[#333]">{title}</span>
      </div>
      <p className="text-sm text-[#333] leading-relaxed">{content}</p>
    </div>
  );
}
