/**
 * POST /api/hyo/daily-card — 데일리 운세 공유용 이미지 (1080×1440, Satori)
 */

import { NextRequest } from 'next/server';
import { ImageResponse } from 'next/og';
import { readFile } from 'fs/promises';
import { join } from 'path';

let fontRegular: ArrayBuffer | null = null;
let fontBold: ArrayBuffer | null = null;
let bgBase64: string | null = null;

async function loadAssets() {
  if (!fontRegular) {
    const buf = await readFile(join(process.cwd(), 'public/fonts/Paperlogy-4Regular.ttf'));
    fontRegular = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
  }
  if (!fontBold) {
    const buf = await readFile(join(process.cwd(), 'public/fonts/Paperlogy-7Bold.ttf'));
    fontBold = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
  }
  if (!bgBase64) {
    const buf = await readFile(join(process.cwd(), 'public/card/daily2.png'));
    bgBase64 = `data:image/png;base64,${buf.toString('base64')}`;
  }
  return { regular: fontRegular, bold: fontBold, bg: bgBase64 };
}

interface ScoreItem {
  label: string;
  score: number;
  verdict: string;
}

function getColor(score: number): string {
  if (score >= 80) return '#8a6a1e';
  if (score >= 60) return '#3a7a4a';
  if (score >= 40) return '#777777';
  if (score >= 20) return '#a06030';
  return '#a03030';
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      date = '', dateGanji = '', guaName = '', jiGuaName = '',
      scores = [] as ScoreItem[],
      totalScore = 50, totalVerdict = '평',
      jiGuaSummary = '',
    } = body;

    const { regular, bold, bg } = await loadAssets();

    return new ImageResponse(
      (
        <div style={{
          width: 1080, height: 1440,
          display: 'flex', flexDirection: 'column' as const,
          position: 'relative' as const,
          fontFamily: 'Paperlogy',
        }}>
          <img src={bg} width={1080} height={1440} style={{ position: 'absolute' as const, top: 0, left: 0 }} />

          <div style={{
            display: 'flex', flexDirection: 'column' as const,
            paddingTop: 140, paddingBottom: 60,
            paddingLeft: 80, paddingRight: 80,
            position: 'relative' as const,
            height: 1440,
          }}>
            {/* 제목 */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 42, fontWeight: 700, color: '#3a2e1e' }}>오늘의 운세</span>
            </div>

            {/* 날짜 */}
            <div style={{ display: 'flex', justifyContent: 'center', fontSize: 20, color: '#8a7a60', marginBottom: 6 }}>
              <span>{date} {dateGanji}</span>
            </div>

            {/* 괘 이름 */}
            <div style={{ display: 'flex', justifyContent: 'center', fontSize: 28, color: '#3a2e1e', marginBottom: 30 }}>
              <span>{guaName} → {jiGuaName}</span>
            </div>

            {/* 총운 */}
            <div style={{
              display: 'flex', flexDirection: 'column' as const, alignItems: 'center',
              padding: '30px 0', marginBottom: 30,
              borderTop: '2px solid #d5c9b0', borderBottom: '2px solid #d5c9b0',
            }}>
              <span style={{ fontSize: 18, color: '#8a7a60', marginBottom: 8 }}>총운</span>
              <span style={{ fontSize: 72, fontWeight: 700, color: getColor(totalScore), lineHeight: 1 }}>
                {totalScore}
              </span>
              <span style={{ fontSize: 24, fontWeight: 700, color: getColor(totalScore), marginTop: 8 }}>
                {totalVerdict}
              </span>
            </div>

            {/* 4대 운세 */}
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 20, marginBottom: 30 }}>
              {(scores as ScoreItem[]).map((s: ScoreItem, i: number) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column' as const }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: 22, fontWeight: 700, color: '#3a2e1e' }}>{s.label}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 28, fontWeight: 700, color: getColor(s.score) }}>{s.score}</span>
                      <span style={{
                        fontSize: 16, fontWeight: 700, color: getColor(s.score),
                        padding: '2px 8px', borderRadius: 6,
                        border: `2px solid ${getColor(s.score)}`,
                      }}>
                        {s.verdict}
                      </span>
                    </div>
                  </div>
                  {/* 바 */}
                  <div style={{
                    display: 'flex', height: 10, borderRadius: 5,
                    backgroundColor: '#e0d8c8', overflow: 'hidden',
                  }}>
                    <div style={{
                      width: `${s.score}%`, height: '100%',
                      backgroundColor: getColor(s.score), borderRadius: 5,
                    }} />
                  </div>
                </div>
              ))}
            </div>

            {/* 지괘 해석 */}
            {jiGuaSummary && (
              <div style={{
                display: 'flex', flexDirection: 'column' as const,
                padding: '16px 20px', marginBottom: 20,
                backgroundColor: '#ede5d5', borderRadius: 12,
                borderLeft: '4px solid #c5b898',
              }}>
                <span style={{ fontSize: 16, fontWeight: 700, color: '#8a6a3e', marginBottom: 4 }}>
                  {jiGuaName} — 흘러가는 방향
                </span>
                <span style={{ fontSize: 18, color: '#5a4e3e', lineHeight: 1.6 }}>
                  {jiGuaSummary}
                </span>
              </div>
            )}

            {/* 브랜딩 */}
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 'auto' }}>
              <span style={{ fontSize: 18, color: '#a89070' }}>
                제3의시간 · 오늘의 운세 · www.betterdan.net
              </span>
            </div>
          </div>
        </div>
      ),
      {
        width: 1080,
        height: 1440,
        fonts: [
          { name: 'Paperlogy', data: regular, weight: 400 as const, style: 'normal' as const },
          { name: 'Paperlogy', data: bold, weight: 700 as const, style: 'normal' as const },
        ],
      },
    );
  } catch (e) {
    console.error('Daily card error:', e);
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
