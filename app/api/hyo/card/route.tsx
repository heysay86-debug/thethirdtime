/**
 * GET /api/hyo/card — 육효점 결과 카드 이미지 생성 (next/og ImageResponse)
 *
 * Query params:
 *   gua, ji, q, date, ganji, summary(|로 줄바꿈), cats(JSON), style(dark|light)
 */

import { NextRequest } from 'next/server';
import { ImageResponse } from 'next/og';
import { readFile } from 'fs/promises';
import { join } from 'path';

// 폰트 캐시
let fontRegular: ArrayBuffer | null = null;
let fontBold: ArrayBuffer | null = null;

async function loadFonts() {
  if (!fontRegular) {
    fontRegular = (await readFile(join(process.cwd(), 'public/fonts/Paperlogy-4Regular.ttf'))).buffer as ArrayBuffer;
  }
  if (!fontBold) {
    fontBold = (await readFile(join(process.cwd(), 'public/fonts/Paperlogy-7Bold.ttf'))).buffer as ArrayBuffer;
  }
  return [fontRegular, fontBold] as const;
}

// 배경 이미지 캐시
const bgCache: Record<string, string> = {};

async function loadBgBase64(style: string): Promise<string> {
  const key = style === 'dark' ? 'alt1' : 'alt2';
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

const VERDICT_COLORS_DARK: Record<string, string> = {
  '대길': '#f0dfad', '길': '#97c6aa', '평': '#889', '흉': '#c9956a', '대흉': '#c96a6a',
};

const VERDICT_COLORS_LIGHT: Record<string, string> = {
  '대길': '#8a6a1e', '길': '#3a7a4a', '평': '#777', '흉': '#a06030', '대흉': '#a03030',
};

export async function POST(request: NextRequest) {
  const body = await request.json();
  const gua = body.gua || '';
  const ji = body.ji || '';
  const q = body.q || '';
  const date = body.date || '';
  const ganji = body.ganji || '';
  const summary = (body.summary || '').replace(/\|/g, '\n');
  const style = body.style === 'light' ? 'light' : 'dark';

  let cats: CatItem[] = [];
  try { cats = Array.isArray(body.cats) ? body.cats : JSON.parse(body.cats || '[]'); } catch { /* */ }

  const isDark = style === 'dark';
  const vc = isDark ? VERDICT_COLORS_DARK : VERDICT_COLORS_LIGHT;
  const [regular, bold] = await loadFonts();
  const bgDataUri = await loadBgBase64(style);
  const isSame = !ji || gua === ji;

  return new ImageResponse(
    (
      <div style={{
        width: 880, height: 2000,
        display: 'flex', flexDirection: 'column',
        position: 'relative',
        fontFamily: 'Paperlogy',
      }}>
        {/* 배경 */}
        <img src={bgDataUri} width={880} height={2000} style={{ position: 'absolute', top: 0, left: 0 }} />

        {/* 콘텐츠 */}
        <div style={{
          display: 'flex', flexDirection: 'column',
          padding: isDark ? '120px 50px 180px' : '100px 50px 60px',
          flex: 1, position: 'relative',
        }}>
          {/* 괘 이름 */}
          <div style={{
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            gap: 12, marginBottom: 4,
          }}>
            <span style={{ fontSize: 28, fontWeight: 700, color: isDark ? '#f0dfad' : '#3a2e1e' }}>
              {gua}
            </span>
            {!isSame && (
              <span style={{ fontSize: 22, color: isDark ? '#889' : '#8a7a60' }}>→</span>
            )}
            {!isSame && (
              <span style={{ fontSize: 28, fontWeight: 700, color: isDark ? '#f0dfad' : '#3a2e1e' }}>
                {ji}
              </span>
            )}
          </div>

          {/* 날짜 */}
          {(date || ganji) && (
            <div style={{
              display: 'flex', justifyContent: 'center',
              fontSize: 13, color: isDark ? '#889' : '#a89070',
              marginBottom: 8, gap: 8,
            }}>
              {date && <span>{date}</span>}
              {ganji && <span>{ganji}</span>}
            </div>
          )}

          {/* 질문 */}
          {q && (
            <div style={{
              display: 'flex', justifyContent: 'center',
              fontSize: 16, color: isDark ? '#c8cdd3' : '#6a5a40',
              marginBottom: 16,
            }}>
              {`"${q}"`}
            </div>
          )}

          {/* 총론 */}
          {summary && (
            <div style={{
              display: 'flex',
              fontSize: 14, lineHeight: 1.7,
              color: isDark ? '#a0a8b0' : '#5a4e3e',
              padding: '12px 16px', marginBottom: 20,
              background: isDark ? 'rgba(240,223,173,0.06)' : 'rgba(139,115,85,0.06)',
              borderRadius: 10,
              borderLeft: `3px solid ${isDark ? 'rgba(240,223,173,0.2)' : 'rgba(139,115,85,0.2)'}`,
            }}>
              {summary}
            </div>
          )}

          {/* 카테고리 */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {cats.map((cat, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'flex-start',
                padding: '10px 12px',
                borderBottom: i < cats.length - 1
                  ? `1px solid ${isDark ? 'rgba(240,223,173,0.1)' : 'rgba(139,115,85,0.1)'}`
                  : 'none',
              }}>
                <div style={{
                  display: 'flex', flexDirection: 'column',
                  width: 120, flexShrink: 0,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{
                      fontSize: 14, fontWeight: 700,
                      color: isDark ? '#f0dfad' : '#8a6a3e',
                    }}>
                      {cat.name}
                    </span>
                    {cat.verdict && (
                      <span style={{
                        fontSize: 10, fontWeight: 700,
                        color: vc[cat.verdict] || '#889',
                        padding: '1px 5px', borderRadius: 4,
                        border: `1px solid ${(vc[cat.verdict] || '#889')}44`,
                      }}>
                        {cat.verdict}
                      </span>
                    )}
                  </div>
                  {cat.sub && (
                    <span style={{
                      fontSize: 10, color: isDark ? '#667' : '#a89070', marginTop: 2,
                    }}>
                      {cat.sub}
                    </span>
                  )}
                </div>
                <span style={{
                  fontSize: 14, lineHeight: 1.6,
                  color: isDark ? '#ccc' : '#3a2e1e', flex: 1,
                }}>
                  {cat.value}
                </span>
              </div>
            ))}
          </div>

          {/* 브랜딩 */}
          <div style={{
            display: 'flex', justifyContent: 'center',
            marginTop: 'auto', paddingTop: 24,
          }}>
            <span style={{
              fontSize: 13, letterSpacing: 1,
              color: isDark ? '#889' : '#a89070',
            }}>
              제3의시간 · 육효점 · ttt.betterdan.net
            </span>
          </div>
        </div>
      </div>
    ),
    {
      width: 880,
      height: 2000,
      fonts: [
        { name: 'Paperlogy', data: regular, weight: 400, style: 'normal' as const },
        { name: 'Paperlogy', data: bold, weight: 700, style: 'normal' as const },
      ],
    },
  );
}
