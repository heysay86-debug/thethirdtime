'use client';

import { useState } from 'react';
import { Calendar, Clock, MapPin, User } from 'lucide-react';

interface SajuFormData {
  birthDate: string;
  birthTime: string;
  calendar: 'solar' | 'lunar';
  isLeapMonth: boolean;
  birthCity: string;
  gender: 'M' | 'F' | '';
}

interface SajuFormProps {
  onSubmit: (data: SajuFormData) => void;
  loading: boolean;
}

export default function SajuForm({ onSubmit, loading }: SajuFormProps) {
  const [form, setForm] = useState<SajuFormData>({
    birthDate: '',
    birthTime: '',
    calendar: 'solar',
    isLeapMonth: false,
    birthCity: '서울',
    gender: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.birthDate) return;
    onSubmit(form);
  };

  const update = (field: keyof SajuFormData, value: string | boolean) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md mx-auto space-y-5">
      {/* 달력 유형 */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => update('calendar', 'solar')}
          className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${
            form.calendar === 'solar'
              ? 'bg-[#f696ff] text-[#333]'
              : 'bg-[#F0F0F0] text-[#666]'
          }`}
        >
          양력
        </button>
        <button
          type="button"
          onClick={() => update('calendar', 'lunar')}
          className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${
            form.calendar === 'lunar'
              ? 'bg-[#f696ff] text-[#333]'
              : 'bg-[#F0F0F0] text-[#666]'
          }`}
        >
          음력
        </button>
      </div>

      {/* 윤달 (음력 시만) */}
      {form.calendar === 'lunar' && (
        <label className="flex items-center gap-2 text-sm text-[#666]">
          <input
            type="checkbox"
            checked={form.isLeapMonth}
            onChange={e => update('isLeapMonth', e.target.checked)}
            className="rounded"
          />
          윤달
        </label>
      )}

      {/* 생년월일 */}
      <div className="relative">
        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-[#999]" size={18} />
        <input
          type="date"
          value={form.birthDate}
          onChange={e => update('birthDate', e.target.value)}
          required
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#E5E5E5] bg-white text-[#222] text-sm focus:border-[#333] focus:outline-none"
          min="1900-01-01"
          max="2049-12-31"
        />
      </div>

      {/* 출생 시각 */}
      <div className="relative">
        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-[#999]" size={18} />
        <input
          type="time"
          value={form.birthTime}
          onChange={e => update('birthTime', e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#E5E5E5] bg-white text-[#222] text-sm focus:border-[#333] focus:outline-none"
          placeholder="모르면 비워두세요"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#BBB]">
          선택
        </span>
      </div>

      {/* 성별 */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => update('gender', 'M')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-colors ${
            form.gender === 'M'
              ? 'bg-[#f696ff] text-[#333]'
              : 'bg-[#F0F0F0] text-[#666]'
          }`}
        >
          <User size={16} />
          남성
        </button>
        <button
          type="button"
          onClick={() => update('gender', 'F')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-colors ${
            form.gender === 'F'
              ? 'bg-[#f696ff] text-[#333]'
              : 'bg-[#F0F0F0] text-[#666]'
          }`}
        >
          <User size={16} />
          여성
        </button>
      </div>

      {/* 출생지 */}
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-[#999]" size={18} />
        <select
          value={form.birthCity}
          onChange={e => update('birthCity', e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#E5E5E5] bg-white text-[#222] text-sm focus:border-[#333] focus:outline-none appearance-none"
        >
          {CITIES.map(city => (
            <option key={city} value={city}>{city}</option>
          ))}
        </select>
      </div>

      {/* 제출 */}
      <button
        type="submit"
        disabled={loading || !form.birthDate}
        className="w-full py-3.5 rounded-xl bg-[#f696ff] text-[#333] font-semibold text-base transition-opacity disabled:opacity-50"
      >
        {loading ? '분석 중...' : '사주 분석하기'}
      </button>
    </form>
  );
}

const CITIES = [
  '서울', '부산', '대구', '인천', '광주', '대전', '울산', '세종',
  '수원', '성남', '고양', '용인', '부천', '안산', '안양', '남양주',
  '화성', '평택', '의정부', '시흥', '파주', '김포', '춘천', '원주',
  '강릉', '청주', '충주', '천안', '아산', '전주', '군산', '익산',
  '목포', '여수', '순천', '포항', '경주', '구미', '안동', '창원',
  '진주', '김해', '제주', '서귀포',
];
