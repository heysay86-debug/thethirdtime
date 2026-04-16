'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

interface SajuInput {
  birthDate: string;
  birthTime: string;
  calendar: 'solar' | 'lunar';
  isLeapMonth: boolean;
  birthCity: string;
  gender: 'M' | 'F' | '';
}

interface InputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: SajuInput) => void;
}

const CITIES = [
  '서울', '부산', '대구', '인천', '광주', '대전', '울산', '세종',
  '수원', '성남', '고양', '용인', '부천', '안산', '안양', '남양주',
  '화성', '평택', '의정부', '시흥', '파주', '김포', '춘천', '원주',
  '강릉', '청주', '충주', '천안', '아산', '전주', '군산', '익산',
  '목포', '여수', '순천', '포항', '경주', '구미', '안동', '창원',
  '진주', '김해', '제주', '서귀포',
];

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 16px',
  borderRadius: 16,
  backgroundColor: 'rgba(104, 128, 151, 0.12)',
  border: '1px solid rgba(104, 128, 151, 0.30)',
  color: '#dde1e5',
  fontSize: 14,
  outline: 'none',
};

export default function InputModal({ isOpen, onClose, onSubmit }: InputModalProps) {
  const [mounted, setMounted] = useState(false);
  const [form, setForm] = useState<SajuInput>({
    birthDate: '',
    birthTime: '',
    calendar: 'solar',
    isLeapMonth: false,
    birthCity: '서울',
    gender: '',
  });

  useEffect(() => { setMounted(true); }, []);

  if (!mounted) return null;

  const update = (field: keyof SajuInput, value: string | boolean) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.birthDate) return;
    onSubmit(form);
  };

  const toggleActive: React.CSSProperties = { backgroundColor: '#dde1e5', color: '#3e4857' };
  const toggleInactive: React.CSSProperties = { backgroundColor: 'rgba(104, 128, 151, 0.15)', color: '#688097' };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 flex items-center justify-center"
          style={{
            zIndex: 100,
            backgroundColor: 'rgba(62, 72, 87, 0.85)',
            backdropFilter: 'blur(8px)',
          }}
          onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="w-full max-h-[90vh] overflow-y-auto"
            style={{
              maxWidth: 400,
              margin: '0 16px',
              backgroundColor: 'rgba(104, 128, 151, 0.15)',
              backdropFilter: 'blur(12px)',
              borderRadius: 20,
              padding: 24,
            }}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-sm"
              style={{ color: '#688097' }}
            >
              ✕
            </button>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Calendar toggle */}
              <div className="flex gap-2">
                {(['solar', 'lunar'] as const).map(cal => (
                  <button
                    key={cal}
                    type="button"
                    onClick={() => update('calendar', cal)}
                    className="flex-1 py-2.5 text-sm font-medium transition-colors"
                    style={{ borderRadius: 16, ...(form.calendar === cal ? toggleActive : toggleInactive) }}
                  >
                    {cal === 'solar' ? '양력' : '음력'}
                  </button>
                ))}
              </div>

              {/* Leap month */}
              {form.calendar === 'lunar' && (
                <label className="flex items-center gap-2 text-sm" style={{ color: '#688097' }}>
                  <input
                    type="checkbox"
                    checked={form.isLeapMonth}
                    onChange={e => update('isLeapMonth', e.target.checked)}
                    className="rounded"
                  />
                  윤달
                </label>
              )}

              {/* Birth date */}
              <input
                type="date"
                value={form.birthDate}
                onChange={e => update('birthDate', e.target.value)}
                required
                min="1900-01-01"
                max="2049-12-31"
                style={inputStyle}
                onFocus={e => (e.target.style.borderColor = '#f0dfad')}
                onBlur={e => (e.target.style.borderColor = 'rgba(104, 128, 151, 0.30)')}
              />

              {/* Birth time */}
              <div className="relative">
                <input
                  type="time"
                  value={form.birthTime}
                  onChange={e => update('birthTime', e.target.value)}
                  style={inputStyle}
                  onFocus={e => (e.target.style.borderColor = '#f0dfad')}
                  onBlur={e => (e.target.style.borderColor = 'rgba(104, 128, 151, 0.30)')}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs" style={{ color: '#688097' }}>
                  선택
                </span>
              </div>

              {/* Gender */}
              <div className="flex gap-2">
                {(['M', 'F'] as const).map(g => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => update('gender', g)}
                    className="flex-1 py-2.5 text-sm font-medium transition-colors"
                    style={{ borderRadius: 16, ...(form.gender === g ? toggleActive : toggleInactive) }}
                  >
                    {g === 'M' ? '남성' : '여성'}
                  </button>
                ))}
              </div>

              {/* City */}
              <select
                value={form.birthCity}
                onChange={e => update('birthCity', e.target.value)}
                style={{ ...inputStyle, appearance: 'none' as const }}
              >
                {CITIES.map(city => (
                  <option key={city} value={city} style={{ backgroundColor: '#3e4857', color: '#dde1e5' }}>
                    {city}
                  </option>
                ))}
              </select>

              {/* Submit */}
              <button
                type="submit"
                disabled={!form.birthDate}
                className="w-full py-3.5 font-semibold text-base transition-opacity disabled:opacity-50"
                style={{ backgroundColor: '#e9b8b7', color: '#3e4857', borderRadius: 20 }}
              >
                분석 시작
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
