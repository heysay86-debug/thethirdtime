'use client';

import Portrait from '../base/Portrait';
import DialogueBox from '../base/DialogueBox';

interface GunghamTeaserProps {
  onSelect: (mode: 2 | 3) => void;
}

export default function GunghamTeaser({ onSelect }: GunghamTeaserProps) {
  return (
    <div className="space-y-4">
      <DialogueBox
        line={{
          character: 'doin',
          name: '도인',
          text: '혼자만의 이야기가 아닌,\n누군가와의 이야기도 궁금하다면…',
          style: 'normal',
        }}
        typing={false}
      />

      <div className="flex gap-3">
        <button
          onClick={() => onSelect(2)}
          className="flex-1 py-3 text-sm font-semibold"
          style={{
            backgroundColor: '#dde1e5',
            color: '#3e4857',
            borderRadius: 16,
            boxShadow: '0 0 16px rgba(221, 225, 229, 0.3)',
          }}
        >
          2인 궁합 보기
        </button>
        <button
          onClick={() => onSelect(3)}
          className="flex-1 py-3 text-sm font-semibold"
          style={{
            backgroundColor: 'rgba(104, 128, 151, 0.25)',
            color: '#dde1e5',
            borderRadius: 16,
          }}
        >
          3인 궁합 보기
        </button>
      </div>
    </div>
  );
}
