'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

type InputType = 'text' | 'gender' | 'calendar' | 'date' | 'leapmonth' | 'time' | 'city';

interface DialogueInputProps {
  type: InputType;
  config?: {
    placeholder?: string;
    skipLabel?: string;
    skipValue?: string;
    options?: string[];
  };
  onSubmit: (value: string) => void;
  onSkip?: () => void;
}

const btnBase: React.CSSProperties = {
  borderRadius: 16,
  padding: '10px 16px',
  fontSize: 14,
  fontWeight: 600,
  transition: 'all 0.15s',
  cursor: 'pointer',
  border: 'none',
};

const btnChoice: React.CSSProperties = {
  ...btnBase,
  backgroundColor: 'rgba(104,128,151,0.25)',
  color: '#dde1e5',
};

const btnConfirm: React.CSSProperties = {
  ...btnBase,
  backgroundColor: '#dde1e5',
  color: '#3e4857',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  borderRadius: 16,
  backgroundColor: 'rgba(104,128,151,0.12)',
  border: '1px solid rgba(104,128,151,0.30)',
  color: '#dde1e5',
  fontSize: 14,
  outline: 'none',
};

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

export default function DialogueInput({ type, config, onSubmit, onSkip }: DialogueInputProps) {
  const [textVal, setTextVal] = useState('');
  const [dateYear, setDateYear] = useState(1990);
  const [dateMonth, setDateMonth] = useState(1);
  const [dateDay, setDateDay] = useState(1);
  const [calendarType, setCalendarType] = useState<'solar' | 'lunar'>('solar');
  const [timeHour, setTimeHour] = useState(12);
  const [timeMinute, setTimeMinute] = useState(0);
  const [cityVal, setCityVal] = useState(config?.options?.[0] || '서울');

  const maxDay = daysInMonth(dateYear, dateMonth);

  const skipBtn = config?.skipLabel && onSkip ? (
    <button
      onClick={onSkip}
      className="w-full text-center py-2 text-sm"
      style={{ color: '#688097', background: 'none', border: 'none', cursor: 'pointer' }}
    >
      {config.skipLabel}
    </button>
  ) : null;

  let content: React.ReactNode;

  switch (type) {
    case 'text':
      content = (
        <form onSubmit={e => { e.preventDefault(); if (textVal.trim()) onSubmit(textVal.trim()); }} className="space-y-2">
          <input
            type="text"
            value={textVal}
            onChange={e => setTextVal(e.target.value)}
            placeholder={config?.placeholder || ''}
            autoFocus
            style={inputStyle}
            onFocus={e => (e.target.style.borderColor = '#f0dfad')}
            onBlur={e => (e.target.style.borderColor = 'rgba(104,128,151,0.30)')}
          />
          <button type="submit" disabled={!textVal.trim()} className="w-full disabled:opacity-50" style={btnConfirm}>
            확인
          </button>
          {skipBtn}
        </form>
      );
      break;

    case 'gender':
      content = (
        <div className="space-y-2">
          <div className="flex gap-2">
            <button className="flex-1" style={btnChoice} onClick={() => onSubmit('M')}>남성</button>
            <button className="flex-1" style={btnChoice} onClick={() => onSubmit('F')}>여성</button>
          </div>
          {skipBtn}
        </div>
      );
      break;

    case 'calendar':
      content = (
        <div className="flex gap-2">
          <button className="flex-1" style={btnChoice} onClick={() => onSubmit('solar')}>양력</button>
          <button className="flex-1" style={btnChoice} onClick={() => onSubmit('lunar')}>음력</button>
        </div>
      );
      break;

    case 'date':
      content = (
        <div className="space-y-3">
          {/* 양력/음력 토글 */}
          <div className="flex gap-2">
            {(['solar', 'lunar'] as const).map(cal => (
              <button
                key={cal}
                type="button"
                onClick={() => setCalendarType(cal)}
                className="flex-1 py-2.5 text-sm font-medium transition-colors"
                style={{
                  borderRadius: 16,
                  ...(calendarType === cal
                    ? { backgroundColor: '#dde1e5', color: '#3e4857' }
                    : { backgroundColor: 'rgba(104,128,151,0.15)', color: '#688097' }),
                }}
              >
                {cal === 'solar' ? '양력' : '음력'}
              </button>
            ))}
          </div>
          {/* 년/월/일 */}
          <div className="flex gap-2">
            <select
              value={dateYear}
              onChange={e => setDateYear(Number(e.target.value))}
              style={{ ...inputStyle, flex: 2 }}
            >
              {Array.from({ length: 2025 - 1920 + 1 }, (_, i) => 2025 - i).map(y => (
                <option key={y} value={y} style={{ backgroundColor: '#3e4857', color: '#dde1e5' }}>{y}년</option>
              ))}
            </select>
            <select
              value={dateMonth}
              onChange={e => { setDateMonth(Number(e.target.value)); setDateDay(1); }}
              style={{ ...inputStyle, flex: 1 }}
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                <option key={m} value={m} style={{ backgroundColor: '#3e4857', color: '#dde1e5' }}>{m}월</option>
              ))}
            </select>
            <select
              value={dateDay > maxDay ? maxDay : dateDay}
              onChange={e => setDateDay(Number(e.target.value))}
              style={{ ...inputStyle, flex: 1 }}
            >
              {Array.from({ length: maxDay }, (_, i) => i + 1).map(d => (
                <option key={d} value={d} style={{ backgroundColor: '#3e4857', color: '#dde1e5' }}>{d}일</option>
              ))}
            </select>
          </div>
          <button
            className="w-full"
            style={btnConfirm}
            onClick={() => {
              const day = dateDay > maxDay ? maxDay : dateDay;
              const dateStr = `${dateYear}-${String(dateMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              onSubmit(`${calendarType}|${dateStr}`);
            }}
          >
            확인
          </button>
        </div>
      );
      break;

    case 'leapmonth':
      content = (
        <div className="space-y-2">
          <div className="flex gap-2">
            <button className="flex-1" style={btnChoice} onClick={() => onSubmit('true')}>예, 윤달이었어요</button>
            <button className="flex-1" style={btnChoice} onClick={() => onSubmit('false')}>아니오</button>
          </div>
        </div>
      );
      break;

    case 'time':
      content = (
        <div className="space-y-2">
          <div className="flex gap-2 items-center justify-center">
            <select
              value={timeHour}
              onChange={e => setTimeHour(Number(e.target.value))}
              style={{ ...inputStyle, flex: 1, textAlign: 'center' }}
            >
              {Array.from({ length: 24 }, (_, i) => (
                <option key={i} value={i} style={{ backgroundColor: '#3e4857', color: '#dde1e5' }}>
                  {String(i).padStart(2, '0')}시
                </option>
              ))}
            </select>
            <span style={{ color: '#688097', fontSize: 18, fontWeight: 600 }}>:</span>
            <select
              value={timeMinute}
              onChange={e => setTimeMinute(Number(e.target.value))}
              style={{ ...inputStyle, flex: 1, textAlign: 'center' }}
            >
              {Array.from({ length: 60 }, (_, i) => i).map(m => (
                <option key={m} value={m} style={{ backgroundColor: '#3e4857', color: '#dde1e5' }}>
                  {String(m).padStart(2, '0')}분
                </option>
              ))}
            </select>
          </div>
          <button
            className="w-full"
            style={btnConfirm}
            onClick={() => {
              const val = `${String(timeHour).padStart(2, '0')}:${String(timeMinute).padStart(2, '0')}`;
              onSubmit(val);
            }}
          >
            확인
          </button>
          {onSkip && (
            <button
              className="w-full text-center py-2 text-sm"
              style={{ color: '#688097', background: 'none', border: 'none', cursor: 'pointer' }}
              onClick={onSkip}
            >
              {config?.skipLabel || '모르겠어요'}
            </button>
          )}
        </div>
      );
      break;

    case 'city':
      content = (
        <div className="space-y-2">
          <select
            value={cityVal}
            onChange={e => setCityVal(e.target.value)}
            style={{ ...inputStyle, appearance: 'none' as const }}
          >
            {(config?.options || []).map(city => (
              <option key={city} value={city} style={{ backgroundColor: '#3e4857', color: '#dde1e5' }}>
                {city}
              </option>
            ))}
          </select>
          <button className="w-full" style={btnConfirm} onClick={() => onSubmit(cityVal)}>
            확인
          </button>
          {skipBtn}
        </div>
      );
      break;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      {content}
    </motion.div>
  );
}

export type { InputType, DialogueInputProps };
