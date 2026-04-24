import './globals.css';
import type { Metadata } from 'next';
import Script from 'next/script';

const SITE_URL = 'https://ttt.betterdan.net';

export const metadata: Metadata = {
  title: {
    default: '제3의시간 — 사주명리 분석 리포트',
    template: '%s | 제3의시간',
  },
  description: '수천 년의 지혜로 오늘의 나를 읽다. 생년월일시 기반 사주팔자 분석과 맞춤 리포트.',
  metadataBase: new URL(SITE_URL),
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32' },
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: { url: '/favicon-192.png', sizes: '192x192' },
  },
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
      <head>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-P88RY9HF2E"
          strategy="afterInteractive"
        />
        <Script id="gtag-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-P88RY9HF2E');
          `}
        </Script>
      </head>
      <body className="min-h-screen bg-[hsl(var(--background))]">
        {children}
      </body>
    </html>
  );
}
