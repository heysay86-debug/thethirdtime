import { Gaegu, Noto_Sans_KR } from 'next/font/google';

const gaegu = Gaegu({ weight: '400', subsets: ['latin'], display: 'swap', variable: '--font-gaegu' });
const notoSansKR = Noto_Sans_KR({ weight: ['400', '500', '600', '700'], subsets: ['latin'], display: 'swap', variable: '--font-noto-sans-kr' });

export const metadata = {
  title: '제3의시간 — 당신의 시간 속 이야기',
  description: '밤하늘 아래, 도인이 풀어주는 당신의 사주팔자',
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
