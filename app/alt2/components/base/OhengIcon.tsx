'use client';

interface OhengIconProps {
  element: '목' | '화' | '토' | '금' | '수';
  yinYang: '양' | '음';
  size?: number;
}

const ELEMENT_MAP: Record<string, string> = {
  '목': 'mok', '화': 'hwa', '토': 'to', '금': 'geum', '수': 'su',
};
const YY_MAP: Record<string, string> = { '양': 'yang', '음': 'yin' };

export default function OhengIcon({ element, yinYang, size = 32 }: OhengIconProps) {
  const file = `${ELEMENT_MAP[element]}_${YY_MAP[yinYang]}`;
  return (
    <img
      src={`/icon/${file}.svg`}
      alt={`${element} ${yinYang}`}
      width={size}
      height={size}
    />
  );
}
