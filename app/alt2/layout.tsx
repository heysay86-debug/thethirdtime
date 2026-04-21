import { Gaegu, Noto_Sans_KR } from 'next/font/google';

const gaegu = Gaegu({ weight: '400', subsets: ['latin'], display: 'swap', variable: '--font-gaegu' });
const notoSansKR = Noto_Sans_KR({ weight: ['400', '500', '600', '700'], subsets: ['latin'], display: 'swap', variable: '--font-noto-sans-kr' });

import type { Metadata, Viewport } from 'next';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 1,
  userScalable: false,
  interactiveWidget: 'overlays-content',
  themeColor: '#1a1e24',
};

export const metadata: Metadata = {
  title: '제3의시간 — 당신의 시간 속 이야기',
  description: '밤하늘 아래, 시간의 마법사가 들려주는 당신의 사주팔자. RPG 대화형 사주 분석.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: '제3의시간',
  },
  openGraph: {
    title: '제3의시간 — 당신의 시간 속 이야기',
    description: '밤하늘 아래, 시간의 마법사가 들려주는 당신의 사주팔자.',
    type: 'website',
  },
};

export default function Alt2Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${gaegu.variable} ${notoSansKR.variable}`}>
      <link
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
      />
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@700&display=swap"
      />
      <div
        className="min-h-screen overflow-x-hidden"
        style={{
          background: 'linear-gradient(180deg, #3e4857 0%, #364050 50%, #2f3848 100%)',
          color: '#dde1e5',
          fontFamily: '"Pretendard Variable", "Noto Sans KR", sans-serif',
        }}
      >
        {children}
      </div>
    </div>
  );
}
