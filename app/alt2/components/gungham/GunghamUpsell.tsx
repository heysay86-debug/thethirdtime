'use client';

import { useState } from 'react';
import InlineDialogue from '../result/InlineDialogue';
import CtaButton from '../upsell/CtaButton';
import type { DialogueLine } from '../base/DialogueBox';
import { getCurrentPrices } from '../../utils/pricing';

type GunghamStep = 'intro' | 'select_count' | 'offer' | 'declined';

interface GunghamUpsellProps {
  onPurchase?: (count: 2 | 3) => void;
}

const DEFAULT_G_PRICES = { 2: '₩18,900', 3: '₩23,900' };

const INTRO_LINES: DialogueLine[] = [
  { character: 'magician', name: '복길', text: '자네의 사주를 읽었으니,\n이제 다른 이와의 관계도\n들여다볼 수 있네.', style: 'normal' },
  { character: 'speak', text: '최대 세 사람의 관계까지\n살펴볼 수 있지.', style: 'normal' },
  { character: 'excite', text: '연인, 친구, 직장 상사,\n경쟁 상대...\n어떤 관계든 상관없어.', style: 'normal' },
];

const OFFER_LINES: Record<2 | 3, DialogueLine[]> = {
  2: [{ character: 'magician', name: '복길', text: '둘 사이의 인연을\n읽어보겠네.', style: 'normal' }],
  3: [{ character: 'magician', name: '복길', text: '세 사람의 얽힌 인연,\n흥미롭군.', style: 'normal' }],
};

const DECLINE_LINES: DialogueLine[] = [
  { character: 'doin', name: '복길', text: '언제든 마음이 바뀌면\n다시 찾아오게.', style: 'normal' },
];

const btnPrimary: React.CSSProperties = {
  width: '100%', padding: '12px 16px', borderRadius: 16, fontSize: 14, fontWeight: 600,
  backgroundColor: '#dde1e5', color: '#3e4857', border: 'none', cursor: 'pointer',
  boxShadow: '0 0 16px rgba(221, 225, 229, 0.3)',
};
const btnSecondary: React.CSSProperties = {
  width: '100%', padding: '12px 16px', borderRadius: 16, fontSize: 14, fontWeight: 600,
  backgroundColor: 'rgba(104, 128, 151, 0.25)', color: '#dde1e5', border: 'none', cursor: 'pointer',
};

export default function GunghamUpsell({ onPurchase }: GunghamUpsellProps) {
  const prices = getCurrentPrices();
  const gPrices = { 2: prices.g2, 3: prices.g3 };
  const [step, setStep] = useState<GunghamStep>('intro');
  const [personCount, setPersonCount] = useState<2 | 3>(2);

  return (
    <div className="space-y-4">
      {step === 'intro' && (
        <>
          <InlineDialogue
            lines={INTRO_LINES}
            autoPlay
            interactive={false}
          />
          <div className="flex flex-col gap-2 pt-2">
            <button style={btnPrimary} onClick={() => setStep('select_count')}>
              궁합을 알아보겠다
            </button>
            <button style={btnSecondary} onClick={() => setStep('declined')}>
              괜찮습니다
            </button>
          </div>
        </>
      )}

      {step === 'select_count' && (
        <div className="flex flex-col gap-2">
          <button style={btnPrimary} onClick={() => { setPersonCount(2); setStep('offer'); }}>
            2인 궁합 — 한 사람과의 관계
          </button>
          <button style={btnSecondary} onClick={() => { setPersonCount(3); setStep('offer'); }}>
            3인 궁합 — 두 사람과의 관계
          </button>
        </div>
      )}

      {step === 'offer' && (
        <div className="space-y-4">
          <InlineDialogue lines={OFFER_LINES[personCount]} autoPlay interactive={false} />
          <CtaButton
            label={`${personCount}인 궁합 분석`}
            price={gPrices[personCount]}
            originalPrice={prices.promotion ? DEFAULT_G_PRICES[personCount] : undefined}
            promotion={prices.promotion}
            onClick={() => onPurchase?.(personCount)}
          />
        </div>
      )}

      {step === 'declined' && (
        <InlineDialogue lines={DECLINE_LINES} autoPlay interactive={false} />
      )}
    </div>
  );
}
