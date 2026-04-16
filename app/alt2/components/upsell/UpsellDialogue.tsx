'use client';

import InlineDialogue from '../result/InlineDialogue';
import type { DialogueLine } from '../base/DialogueBox';

interface UpsellDialogueProps {
  script: DialogueLine[];
  previewData?: {
    summary?: string;
    strengthReading?: string;
    gyeokGukReading?: string;
    yongSinReading?: string;
  };
}

export default function UpsellDialogue({ script, previewData }: UpsellDialogueProps) {
  return (
    <div className="space-y-6">
      <InlineDialogue lines={script} autoPlay interactive={false} />

      {/* Blurred preview - 격국 */}
      {previewData?.gyeokGukReading && (
        <div style={{
          filter: 'blur(6px)',
          opacity: 0.5,
          padding: 20,
          borderRadius: 16,
          background: 'rgba(104, 128, 151, 0.15)',
          userSelect: 'none',
          pointerEvents: 'none',
        }}>
          <p style={{ color: '#f0dfad', fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
            격국 분석
          </p>
          <p style={{ color: '#dde1e5', fontSize: 15, lineHeight: 1.6 }}>
            {previewData.gyeokGukReading}
          </p>
        </div>
      )}

      {/* Blurred preview - 용신 */}
      {previewData?.yongSinReading && (
        <div style={{
          filter: 'blur(6px)',
          opacity: 0.5,
          padding: 20,
          borderRadius: 16,
          background: 'rgba(104, 128, 151, 0.15)',
          marginTop: 12,
          userSelect: 'none',
          pointerEvents: 'none',
        }}>
          <p style={{ color: '#f0dfad', fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
            용신 분석
          </p>
          <p style={{ color: '#dde1e5', fontSize: 15, lineHeight: 1.6 }}>
            {previewData.yongSinReading}
          </p>
        </div>
      )}

      {/* Overlay text */}
      {(previewData?.gyeokGukReading || previewData?.yongSinReading) && (
        <div style={{ textAlign: 'center', marginTop: -60, marginBottom: 16 }}>
          <p style={{ color: '#f0dfad', fontSize: 16, fontWeight: 600 }}>
            더 자세한 이야기가 기다리고 있어요
          </p>
        </div>
      )}
    </div>
  );
}
