'use client';

import { useState } from 'react';
import html2canvas from 'html2canvas';

interface CopyTextButtonProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
  title: string;
}

export default function CopyTextButton({ containerRef, title }: CopyTextButtonProps) {
  const [status, setStatus] = useState<'idle' | 'capturing' | 'done'>('idle');

  const handleCapture = async () => {
    const el = containerRef.current;
    if (!el || status === 'capturing') return;

    setStatus('capturing');
    try {
      const canvas = await html2canvas(el, {
        backgroundColor: '#1a1e24',
        scale: 2,
        useCORS: true,
        logging: false,
      });

      // 워터마크 추가
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.font = '20px "Pretendard Variable", sans-serif';
        ctx.fillStyle = 'rgba(240, 223, 173, 0.4)';
        ctx.textAlign = 'right';
        ctx.fillText('제3의시간 · ttt.betterdan.net', canvas.width - 20, canvas.height - 16);
      }

      // 모바일: 이미지 저장 / 데스크탑: 클립보드 복사 시도
      canvas.toBlob(async (blob) => {
        if (!blob) return;

        // 클립보드 복사 시도 (데스크탑 Chrome 등)
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob }),
          ]);
          setStatus('done');
          setTimeout(() => setStatus('idle'), 2000);
          return;
        } catch {
          // 클립보드 실패 → 다운로드 폴백
        }

        // 다운로드 폴백
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${title.replace(/\s/g, '_')}.png`;
        a.click();
        URL.revokeObjectURL(url);
        setStatus('done');
        setTimeout(() => setStatus('idle'), 2000);
      }, 'image/png');
    } catch {
      setStatus('idle');
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10 }}>
      <button
        onClick={handleCapture}
        style={{
          padding: '4px 10px',
          background: status === 'done'
            ? 'rgba(120, 200, 120, 0.15)'
            : 'rgba(240,223,173,0.08)',
          border: `1px solid ${status === 'done'
            ? 'rgba(120, 200, 120, 0.3)'
            : 'rgba(240,223,173,0.15)'}`,
          borderRadius: 10,
          color: status === 'done' ? '#8c8' : '#999',
          fontSize: 10,
          cursor: status === 'capturing' ? 'wait' : 'pointer',
          transition: 'all 0.2s',
        }}
      >
        {status === 'capturing' ? '캡처 중...' : status === 'done' ? '저장 완료!' : '📷 이미지로 저장'}
      </button>
      {status === 'idle' && (
        <span style={{ fontSize: 10, color: '#556' }}>
          보관해두세요. 나중에 누군가에게 다시 물을 수 있도록.
        </span>
      )}
    </div>
  );
}
