'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import DialogueBox from '../base/DialogueBox';
import type { DialogueLine } from '../base/DialogueBox';

interface InlineDialogueProps {
  lines: DialogueLine[];
  autoPlay?: boolean;
  interactive?: boolean;
}

export default function InlineDialogue({
  lines,
  autoPlay = true,
  interactive = true,
}: InlineDialogueProps) {
  const [lineIndex, setLineIndex] = useState(0);
  const [started, setStarted] = useState(!autoPlay);
  const [typingDone, setTypingDone] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Intersection Observer for autoPlay
  useEffect(() => {
    if (!autoPlay) return;
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStarted(true); },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [autoPlay]);

  const handleTypingComplete = useCallback(() => {
    setTypingDone(true);
  }, []);

  const handleTap = useCallback(() => {
    if (!interactive) return;
    if (lineIndex < lines.length - 1) {
      setLineIndex(prev => prev + 1);
      setTypingDone(false);
    }
  }, [lineIndex, lines.length, interactive]);

  if (!lines || lines.length === 0) return null;
  const currentLine = lines[lineIndex];

  // Inherit name from previous lines
  let displayName = currentLine.name;
  if (!displayName) {
    for (let i = lineIndex - 1; i >= 0; i--) {
      if (lines[i].name) { displayName = lines[i].name; break; }
    }
  }

  return (
    <div ref={ref} className="my-6">
      {started && (
        <DialogueBox
          key={lineIndex}
          line={{ ...currentLine, name: displayName }}
          typing={started}
          onTypingComplete={handleTypingComplete}
          onTap={handleTap}
          showIndicator={typingDone && lineIndex < lines.length - 1}
          portraitSize="md"
        />
      )}
    </div>
  );
}
