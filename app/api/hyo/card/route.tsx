/**
 * POST /api/hyo/card — 육효점 결과 카드 이미지 생성 (next/og ImageResponse)
 */

import { NextRequest } from 'next/server';
import { ImageResponse } from 'next/og';
import { readFile } from 'fs/promises';
import { join } from 'path';

let fontRegular: ArrayBuffer | null = null;
let fontBold: ArrayBuffer | null = null;

async function loadFonts() {
  if (!fontRegular) {
    const buf = await readFile(join(process.cwd(), 'public/fonts/Paperlogy-4Regular.ttf'));
    fontRegular = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
  }
  if (!fontBold) {
    const buf = await readFile(join(process.cwd(), 'public/fonts/Paperlogy-7Bold.ttf'));
    fontBold = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
  }
  return [fontRegular, fontBold] as const;
}

const bgCache: Record<string, string> = {};

async function loadBgBase64(key: string): Promise<string> {
  if (!bgCache[key]) {
    const buf = await readFile(join(process.cwd(), `public/card/hyo_result_${key}.png`));
    bgCache[key] = `data:image/png;base64,${buf.toString('base64')}`;
  }
  return bgCache[key];
}

interface CatItem {
  name: string;
  sub?: string;
  value: string;
  verdict?: string;
}

function getVerdictColor(verdict: string, isDark: boolean): string {
  const dark: Record<string, string> = { '대길': '#f0dfad', '길': '#97c6aa', '평': '#888899', '흉': '#c9956a', '대흉': '#c96a6a' };
  const light: Record<string, string> = { '대길': '#8a6a1e', '길': '#3a7a4a', '평': '#777777', '흉': '#a06030', '대흉': '#a03030' };
  return (isDark ? dark : light)[verdict] || '#888899';
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const gua: string = body.gua || '';
    const ji: string = body.ji || '';
    const q: string = body.q || '';
    const date: string = body.date || '';
    const ganji: string = body.ganji || '';
    const summary: string = (body.summary || '').replace(/\|/g, '\n');
    const style: string = body.style === 'light' ? 'light' : 'dark';
    const cats: CatItem[] = Array.isArray(body.cats) ? body.cats : [];

    const isDark = style === 'dark';
    const [regular, bold] = await loadFonts();
    const bgDataUri = await loadBgBase64(isDark ? 'alt1' : 'alt2');
    const isSame = !ji || gua === ji;

    const textColor = isDark ? '#dde1e5' : '#3a2e1e';
    const titleColor = isDark ? '#f0dfad' : '#3a2e1e';
    const subColor = isDark ? '#888899' : '#a89070';
    const catLabelColor = isDark ? '#f0dfad' : '#8a6a3e';
    const catSubColor = isDark ? '#667788' : '#a89070';
    const catValueColor = isDark ? '#cccccc' : '#3a2e1e';
    const dividerColor = isDark ? '#3a3a44' : '#d5c9b0';
    const summaryBg = isDark ? '#2a2a34' : '#ede5d5';
    const summaryBorder = isDark ? '#4a4a3a' : '#c5b898';
    const summaryColor = isDark ? '#a0a8b0' : '#5a4e3e';

    return new ImageResponse(
      (
        <div style={{
          width: 880, height: 2000,
          display: 'flex', flexDirection: 'column' as const,
          position: 'relative' as const,
          fontFamily: 'Paperlogy',
        }}>
          <img src={bgDataUri} width={880} height={2000} style={{ position: 'absolute' as const, top: 0, left: 0 }} />

          <div style={{
            display: 'flex', flexDirection: 'column' as const,
            paddingTop: isDark ? 180 : 160,
            paddingBottom: isDark ? 180 : 60,
            paddingLeft: 50, paddingRight: 50,
            position: 'relative' as const,
            height: 2000,
          }}>
            {/* 괘 이름 */}
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: 42, fontWeight: 700, color: titleColor }}>{gua}</span>
              {!isSame && <span style={{ fontSize: 33, color: subColor, marginLeft: 16, marginRight: 16 }}>→</span>}
              {!isSame && <span style={{ fontSize: 42, fontWeight: 700, color: titleColor }}>{ji}</span>}
            </div>

            {/* 날짜 */}
            <div style={{ display: 'flex', justifyContent: 'center', fontSize: 20, color: subColor, marginBottom: 12 }}>
              <span>{[date, ganji].filter(Boolean).join('  ')}</span>
            </div>

            {/* 질문 */}
            {q ? (
              <div style={{ display: 'flex', justifyContent: 'center', fontSize: 24, color: textColor, marginBottom: 24 }}>
                <span>{`"${q}"`}</span>
              </div>
            ) : <div style={{ display: 'flex', marginBottom: 24 }}></div>}

            {/* 총론 */}
            {summary ? (
              <div style={{
                display: 'flex',
                fontSize: 21, lineHeight: 1.7,
                color: summaryColor,
                padding: 20, marginBottom: 28,
                backgroundColor: summaryBg,
                borderRadius: 12,
                borderLeft: `4px solid ${summaryBorder}`,
              }}>
                <span>{summary}</span>
              </div>
            ) : <div style={{ display: 'flex' }}></div>}

            {/* 카테고리 */}
            <div style={{ display: 'flex', flexDirection: 'column' as const }}>
              {cats.map((cat, i) => {
                const vColor = cat.verdict ? getVerdictColor(cat.verdict, isDark) : subColor;
                return (
                  <div key={i} style={{
                    display: 'flex',
                    padding: '14px 12px',
                    borderBottom: i < cats.length - 1 ? `1px solid ${dividerColor}` : 'none',
                  }}>
                    <div style={{ display: 'flex', flexDirection: 'column' as const, width: 180 }}>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <span style={{ fontSize: 21, fontWeight: 700, color: catLabelColor }}>{cat.name}</span>
                        {cat.verdict && (
                          <span style={{
                            fontSize: 15, fontWeight: 700, color: vColor,
                            marginLeft: 8,
                            padding: '2px 7px', borderRadius: 5,
                            border: `1px solid ${vColor}`,
                          }}>
                            {cat.verdict}
                          </span>
                        )}
                      </div>
                      {cat.sub && (
                        <span style={{ fontSize: 15, color: catSubColor, marginTop: 3 }}>{cat.sub}</span>
                      )}
                    </div>
                    <span style={{ fontSize: 21, lineHeight: 1.6, color: catValueColor, flex: 1 }}>
                      {cat.value}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* 브랜딩 */}
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 40 }}>
              <span style={{ fontSize: 20, color: subColor }}>
                제3의시간 · 육효점 · www.betterdan.net
              </span>
            </div>
          </div>
        </div>
      ),
      {
        width: 880,
        height: 2000,
        fonts: [
          { name: 'Paperlogy', data: regular, weight: 400 as const, style: 'normal' as const },
          { name: 'Paperlogy', data: bold, weight: 700 as const, style: 'normal' as const },
        ],
      },
    );
  } catch (e) {
    console.error('Card generation error:', e);
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
