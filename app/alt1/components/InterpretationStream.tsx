'use client';

import { useState, useEffect } from 'react';

interface InterpretationStreamProps {
  engine: any;
  core: any;
  onComplete?: (sections: any) => void;
}

export default function InterpretationStream({ engine, core, onComplete }: InterpretationStreamProps) {
  const [streamText, setStreamText] = useState('');
  const [sections, setSections] = useState<any>(null);
  const [status, setStatus] = useState<'streaming' | 'done' | 'error'>('streaming');

  useEffect(() => {
    const abortController = new AbortController();

    async function fetchStream() {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/saju/interpret`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ engine, core }),
          signal: abortController.signal,
        });

        if (!res.ok || !res.body) {
          setStatus('error');
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';

          let eventType = '';
          for (const line of lines) {
            if (line.startsWith('event: ')) {
              eventType = line.slice(7).trim();
            } else if (line.startsWith('data: ') && eventType) {
              const data = JSON.parse(line.slice(6));
              if (eventType === 'chunk' && data.text) {
                setStreamText(prev => prev + data.text);
              } else if (eventType === 'done' && data.sections) {
                setSections(data.sections);
                setStatus('done');
                if (onComplete) onComplete(data.sections);
              } else if (eventType === 'error') {
                setStatus('error');
              }
              eventType = '';
            }
          }
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          setStatus('error');
        }
      }
    }

    fetchStream();
    return () => abortController.abort();
  }, [engine, core, onComplete]);

  if (status === 'error') {
    return (
      <div className="w-full max-w-md mx-auto bg-red-50 rounded-xl px-4 py-3 text-sm text-red-600">
        해석 중 오류가 발생했습니다. 다시 시도해주세요.
      </div>
    );
  }

  if (sections) {
    return <SectionsDisplay sections={sections} />;
  }

  // 스트리밍 중
  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white rounded-xl border border-[#E5E5E5] px-4 py-3">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 bg-[#f696ff] rounded-full animate-pulse" />
          <span className="text-xs text-[#999]">해석 생성 중...</span>
        </div>
        <p className="text-sm text-[#333] leading-relaxed whitespace-pre-wrap">
          {streamText || '잠시만 기다려주세요...'}
        </p>
      </div>
    </div>
  );
}

function SectionsDisplay({ sections }: { sections: any }) {
  const items: { title: string; content: string | null }[] = [
    { title: '사주팔자', content: sections.basics?.description },
    { title: '연주', content: sections.pillarAnalysis?.year },
    { title: '월주', content: sections.pillarAnalysis?.month },
    { title: '일주', content: sections.pillarAnalysis?.day },
    { title: '시주', content: sections.pillarAnalysis?.hour },
    { title: '오행 분석', content: sections.ohengAnalysis?.distribution },
    { title: '조후', content: sections.ohengAnalysis?.johu },
    { title: '십성', content: sections.sipseongAnalysis?.reading },
    { title: '형충파해합', content: sections.relations?.reading },
    { title: '대운 개관', content: sections.daeunReading?.overview },
    { title: '현재 대운', content: sections.daeunReading?.currentPeriod },
    { title: '향후 세운', content: sections.daeunReading?.upcoming },
    { title: '종합 해석', content: sections.overallReading?.primary },
    { title: '현대적 적용', content: sections.overallReading?.modernApplication },
  ];

  return (
    <div className="w-full max-w-md mx-auto space-y-2">
      {items.map((item, i) =>
        item.content ? (
          <div key={i} className="bg-white rounded-xl border border-[#E5E5E5] px-4 py-3">
            <h3 className="text-xs font-semibold text-[#999] mb-1">{item.title}</h3>
            <p className="text-sm text-[#333] leading-relaxed">{item.content}</p>
          </div>
        ) : null
      )}
    </div>
  );
}
