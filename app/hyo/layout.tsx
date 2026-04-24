import { Gaegu, Noto_Sans_KR } from 'next/font/google';
import type { Metadata, Viewport } from 'next';

const gaegu = Gaegu({ weight: '400', subsets: ['latin'], display: 'swap', variable: '--font-gaegu' });
const notoSansKR = Noto_Sans_KR({ weight: ['400', '500', '600', '700'], subsets: ['latin'], display: 'swap', variable: '--font-noto-sans-kr' });

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#1a1e24',
};

export const metadata: Metadata = {
  title: '육효점 — 제3의시간',
  description: '정통 시초법으로 점을 치고, 64괘의 해석을 받아보세요.',
};

export default function HyoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${gaegu.variable} ${notoSansKR.variable}`}>
      <link
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
      />
      {children}
    </div>
  );
}
