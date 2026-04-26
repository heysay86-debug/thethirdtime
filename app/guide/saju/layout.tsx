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
  title: '사주란? — 제3의시간',
  description: '사주팔자의 기초 개념부터 천간, 지지, 오행, 십성, 격국과 용신까지 알기 쉽게 설명합니다.',
};

export default function SajuGuideLayout({ children }: { children: React.ReactNode }) {
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
