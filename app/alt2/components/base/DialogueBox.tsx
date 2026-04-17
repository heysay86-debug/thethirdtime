'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Portrait from './Portrait';

export interface DialogueLine {
  character: string;
  name?: string;
  text: string;
  style?: 'normal' | 'emphasis' | 'whisper' | 'system' | 'thought';
  icon?: string;
  action?: string;
  choices?: { label: string; action: string; style?: 'primary' | 'secondary' }[];
  inputConfig?: {
    placeholder?: string;
    skipLabel?: string;
    skipValue?: string;
    options?: string[];
  };
  responses?: Record<string, {
    character: string;
    name?: string;
    text: string;
    style?: string;
  }>;
}

interface DialogueBoxProps {
  line: DialogueLine;
  typing?: boolean;
  typingSpeed?: number;
  onTypingComplete?: () => void;
  onTap?: () => void;
  showIndicator?: boolean;
  className?: string;
  portraitSize?: 'sm' | 'md' | 'lg';
}

const PIXEL_BORDER_SVG = `data:image/svg+xml,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24">
  <defs>
    <style>
      .outer { fill: #8899aa; }
      .inner { fill: #556677; }
      .bg { fill: rgba(20, 25, 35, 0.92); }
    </style>
  </defs>
  <rect x="3" y="3" width="18" height="18" class="bg"/>
  <rect x="3" y="0" width="18" height="1" class="outer"/>
  <rect x="3" y="23" width="18" height="1" class="outer"/>
  <rect x="0" y="3" width="1" height="18" class="outer"/>
  <rect x="23" y="3" width="1" height="18" class="outer"/>
  <rect x="2" y="1" width="1" height="1" class="outer"/>
  <rect x="1" y="2" width="1" height="1" class="outer"/>
  <rect x="21" y="1" width="1" height="1" class="outer"/>
  <rect x="22" y="2" width="1" height="1" class="outer"/>
  <rect x="2" y="22" width="1" height="1" class="outer"/>
  <rect x="1" y="21" width="1" height="1" class="outer"/>
  <rect x="21" y="22" width="1" height="1" class="outer"/>
  <rect x="22" y="21" width="1" height="1" class="outer"/>
  <rect x="3" y="2" width="18" height="1" class="inner"/>
  <rect x="3" y="21" width="18" height="1" class="inner"/>
  <rect x="2" y="3" width="1" height="18" class="inner"/>
  <rect x="21" y="3" width="1" height="18" class="inner"/>
</svg>
`)}`;

function wrapText(text: string, maxChars: number): string {
  return text
    .split('\n')
    .map(paragraph => {
      if (paragraph.length <= maxChars) return paragraph;
      const lines: string[] = [];
      let remaining = paragraph;
      while (remaining.length > maxChars) {
        // 17자 이내에서 공백이 있으면 거기서 자르기
        const slice = remaining.slice(0, maxChars);
        const lastSpace = slice.lastIndexOf(' ');
        const breakAt = lastSpace > maxChars * 0.4 ? lastSpace : maxChars;
        lines.push(remaining.slice(0, breakAt).trimEnd());
        remaining = remaining.slice(breakAt).trimStart();
      }
      if (remaining) lines.push(remaining);
      return lines.join('\n');
    })
    .join('\n');
}

export default function DialogueBox({
  line,
  typing = true,
  typingSpeed = 35,
  onTypingComplete,
  onTap,
  showIndicator = false,
  className = '',
  portraitSize = 'lg',
}: DialogueBoxProps) {
  const wrappedText = wrapText(line.text, 17);
  const [displayed, setDisplayed] = useState(typing ? '' : wrappedText);
  const [isTyping, setIsTyping] = useState(typing);
  const typingRef = useRef(true);
  const indexRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const skipTyping = useCallback(() => {
    if (isTyping) {
      typingRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
      setDisplayed(wrappedText);
      setIsTyping(false);
      onTypingComplete?.();
    } else {
      onTap?.();
    }
  }, [isTyping, wrappedText, onTypingComplete, onTap]);

  useEffect(() => {
    if (!typing) {
      setDisplayed(wrappedText);
      setIsTyping(false);
      return;
    }

    typingRef.current = true;
    indexRef.current = 0;
    setDisplayed('');
    setIsTyping(true);

    function typeNext() {
      if (!typingRef.current || indexRef.current >= wrappedText.length) {
        setIsTyping(false);
        onTypingComplete?.();
        return;
      }

      const char = wrappedText[indexRef.current];
      indexRef.current++;
      setDisplayed(wrappedText.slice(0, indexRef.current));

      const isPunctuation = '.?!,~'.includes(char);
      const d = typingSpeed + (isPunctuation ? 180 : 0);
      timerRef.current = setTimeout(typeNext, d);
    }

    timerRef.current = setTimeout(typeNext, typingSpeed);
    return () => {
      typingRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [wrappedText, typing, typingSpeed, onTypingComplete]);

  const isSystem = line.style === 'system';
  const isThought = line.style === 'thought';
  const hidePortrait = isSystem || isThought;

  const textStyle: React.CSSProperties = {
    fontFamily: isSystem
      ? '"Pretendard Variable", "Noto Sans KR", sans-serif'
      : isThought
      ? '"Pretendard Variable", "Noto Sans KR", sans-serif'
      : 'var(--font-gaegu), "Gaegu", cursive',
    fontSize: line.style === 'emphasis' ? 18 : line.style === 'whisper' ? 14 : isSystem ? 13 : isThought ? 14 : 16,
    color: isThought ? '#a1c5ac' : line.style === 'emphasis' ? '#f0dfad' : '#dde1e5',
    opacity: line.style === 'whisper' ? 0.6 : 1,
    lineHeight: 1.6,
    whiteSpace: 'pre-wrap',
    textAlign: isSystem ? 'center' : isThought ? 'right' : undefined,
    fontStyle: isThought ? 'italic' : undefined,
  };

  return (
    <div
      className={`relative ${className}`}
      onClick={skipTyping}
      style={{
        borderImage: `url("${PIXEL_BORDER_SVG}") 6 fill / 6px`,
        borderStyle: 'solid',
        padding: '12px 14px',
        cursor: 'pointer',
        imageRendering: 'pixelated',
      }}
    >
      <div className="flex gap-3">
        {/* Text area - left */}
        <div className="flex-1 min-w-0">
          {/* Speaker name */}
          {!hidePortrait && line.name && (
            <div
              className="mb-1"
              style={{ fontSize: 13, fontWeight: 700, color: '#f0dfad' }}
            >
              {line.name}
            </div>
          )}

          {/* Dialogue text */}
          <div style={textStyle}>
            {displayed}
            {isTyping && (
              <span className="animate-pulse" style={{ color: '#dde1e5', marginLeft: 2 }}>
                ▏
              </span>
            )}
          </div>

          {/* Icon */}
          {line.icon && (
            <img
              src={`/icon/${line.icon}.svg`}
              alt=""
              className="inline-block ml-2"
              style={{ width: 20, height: 20, verticalAlign: 'middle', opacity: 0.7 }}
            />
          )}
        </div>

        {/* Portrait - right */}
        {!hidePortrait && (
          <Portrait name={line.character} size={portraitSize} />
        )}
      </div>

      {/* Indicator - bottom center */}
      {showIndicator && !isTyping && (
        <div
          className="absolute bottom-2 left-1/2 -translate-x-1/2 animate-pulse"
          style={{ color: '#8899aa', fontSize: 10 }}
        >
          ▼
        </div>
      )}
    </div>
  );
}
