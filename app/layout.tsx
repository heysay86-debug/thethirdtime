import './globals.css';

export const metadata = {
  title: '사주웹 -- 사주팔자 분석',
  description: '생년월일시를 입력하면 사주팔자를 계산하고 명리학적 해석을 제공합니다.',
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
