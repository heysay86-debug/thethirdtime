import './globals.css';
import type { Metadata } from 'next';

const SITE_URL = 'https://saju-api-rough-shadow-6686.fly.dev';

export const metadata: Metadata = {
  title: {
    default: '제3의시간 — 사주명리 분석 리포트',
    template: '%s | 제3의시간',
  },
  description: '수천 년의 지혜로 오늘의 나를 읽다. 생년월일시 기반 사주팔자 분석과 맞춤 리포트.',
  metadataBase: new URL(SITE_URL),
  openGraph: {
    type: 'website',
    siteName: '제3의시간',
    title: '제3의시간 — 사주명리 분석 리포트',
    description: '수천 년의 지혜로 오늘의 나를 읽다. 생년월일시 기반 사주팔자 분석과 맞춤 리포트.',
    url: SITE_URL,
    locale: 'ko_KR',
  },
  twitter: {
    card: 'summary_large_image',
    title: '제3의시간 — 사주명리 분석 리포트',
    description: '수천 년의 지혜로 오늘의 나를 읽다.',
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: SITE_URL,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-[hsl(var(--background))]">
        {children}
      </body>
    </html>
  );
}
