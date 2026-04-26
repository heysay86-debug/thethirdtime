import { Gaegu, Noto_Sans_KR } from 'next/font/google';
import type { Metadata } from 'next';

const gaegu = Gaegu({ weight: '400', subsets: ['latin'], display: 'swap', variable: '--font-gaegu' });
const notoSansKR = Noto_Sans_KR({ weight: ['400', '500', '600', '700'], subsets: ['latin'], display: 'swap', variable: '--font-noto-sans-kr' });

export const metadata: Metadata = {
  title: '복길의 서고 — 제3의시간',
  description: '사주, 오행, 육효점에 대한 이야기를 복길이 들려드립니다.',
};

export default function BlogLayout({ children }: { children: React.ReactNode }) {
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
