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

const charCache: Record<string, string> = {};

async function loadCharBase64(name: string): Promise<string> {
  if (!charCache[name]) {
    const buf = await readFile(join(process.cwd(), `public/character/${name}.svg`));
    charCache[name] = `data:image/svg+xml;base64,${buf.toString('base64')}`;
  }
  return charCache[name];
}

function getCharName(score: number): string {
  if (score >= 70) return 'excite';
  if (score >= 50) return 'normal';
  if (score >= 30) return 'dspt';
  return 'dizzy';
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
      guaBits = [] as number[], changingYaoPos = 0,
      scores = [] as ScoreItem[],
      totalScore = 50, totalVerdict = '평',
      jiGuaSummary = '',
    } = body;

    const { regular, bold, bg } = await loadAssets();
    const charName = getCharName(totalScore);
    const charUri = await loadCharBase64(charName);

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
            paddingTop: 130, paddingBottom: 60,
            paddingLeft: 80, paddingRight: 80,
            position: 'relative' as const,
            height: 1440,
          }}>
            {/* 타이틀 + 날짜 — 로고 중앙선 맞춤 우측 배치 한줄 */}
            <div style={{
              display: 'flex', justifyContent: 'flex-end', alignItems: 'center',
              height: 60, marginBottom: 40,
            }}>
              <span style={{ fontSize: 24, fontWeight: 700, color: '#3a2e1e', marginRight: 10 }}>오늘의 운세</span>
              <span style={{ fontSize: 16, color: '#8a7a60' }}>{date} {dateGanji}</span>
            </div>

            {/* 괘명 */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
              <span style={{ fontSize: 48, fontWeight: 700, color: '#3a2e1e' }}>{guaName}</span>
              <span style={{ fontSize: 36, color: '#8a7a60', margin: '0 16px' }}>→</span>
              <span style={{ fontSize: 48, fontWeight: 700, color: '#3a2e1e' }}>{jiGuaName}</span>
            </div>

            {/* 괘상 (CSS 효) */}
            {(guaBits as number[]).length === 6 && (
              <div style={{ display: 'flex', flexDirection: 'column-reverse' as const, alignItems: 'center', gap: 8, marginBottom: 32 }}>
                {(guaBits as number[]).map((bit: number, i: number) => {
                  const isChanging = i === changingYaoPos - 1;
                  const barColor = isChanging ? '#8a6a1e' : '#a09888';
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' as const }}>
                      {bit === 1 ? (
                        <div style={{ width: 160, height: 12, backgroundColor: barColor, borderRadius: 2 }} />
                      ) : (
                        <div style={{ display: 'flex', gap: 16 }}>
                          <div style={{ width: 72, height: 12, backgroundColor: barColor, borderRadius: 2 }} />
                          <div style={{ width: 72, height: 12, backgroundColor: barColor, borderRadius: 2 }} />
                        </div>
                      )}
                      {isChanging && (
                        <div style={{
                          position: 'absolute' as const, top: '50%', left: '50%',
                          transform: 'translate(-50%, -50%) rotate(-45deg)',
                          width: 3, height: 28,
                          backgroundColor: '#8a6a1e', borderRadius: 1,
                        }} />
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* 캐릭터 표정 중앙 */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
              <img src={charUri} style={{ height: 120, opacity: 0.9 }} />
            </div>

            {/* 4대 운세 (좌) + 총운 (우) */}
            <div style={{
              display: 'flex', gap: 24, marginBottom: 30,
              borderTop: '2px solid #d5c9b0', borderBottom: '2px solid #d5c9b0',
              padding: '24px 0',
            }}>
              {/* 좌: 4대 운세 바 */}
              <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 16, flex: 1 }}>
                {(scores as ScoreItem[]).map((s: ScoreItem, i: number) => (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column' as const }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontSize: 20, fontWeight: 700, color: '#3a2e1e' }}>{s.label}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 24, fontWeight: 700, color: getColor(s.score) }}>{s.score}</span>
                        <span style={{
                          fontSize: 14, fontWeight: 700, color: getColor(s.score),
                          padding: '1px 6px', borderRadius: 5,
                          border: `2px solid ${getColor(s.score)}`,
                        }}>
                          {s.verdict}
                        </span>
                      </div>
                    </div>
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

              {/* 우: 총운 + 배경 캐릭터 */}
              <div style={{
                display: 'flex', flexDirection: 'column' as const,
                alignItems: 'center', justifyContent: 'center',
                width: 160, position: 'relative' as const,
              }}>
                <img src={charUri} style={{ height: 140,
                  position: 'absolute' as const, opacity: 0.08,
                  top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                }} />
                <span style={{ fontSize: 18, color: '#8a7a60', marginBottom: 8 }}>총운</span>
                <span style={{ fontSize: 72, fontWeight: 700, color: getColor(totalScore), lineHeight: 1 }}>
                  {totalScore}
                </span>
                <span style={{ fontSize: 24, fontWeight: 700, color: getColor(totalScore), marginTop: 8 }}>
                  {totalVerdict}
                </span>
              </div>
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
              <span style={{ fontSize: 18, color: '#5a4e3e', fontWeight: 600 }}>
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
