/**
 * PDF 폰트 등록 — PaperlogyHan
 *
 * PaperlogyHan: Paperlogy + 한자(漢字) 글리프 병합 버전.
 *
 * 생성 배경:
 *   - Paperlogy 원본은 甲乙丙丁... 중 일부 한자(壬,癸,庚,戊,寅,卯,辰,酉,戌,亥 등) 미지원.
 *   - DroidSansFallbackFull.ttf(Apache 2.0)에서 누락 글리프를 병합하여 PaperlogyHan 생성.
 *   - 생성 스크립트: scripts/build-font.py (fonttools 사용)
 *
 * 파일 위치: public/fonts/PaperlogyHan-*.ttf
 * react-pdf는 TTF를 네이티브 지원.
 */

import path from 'path';
import { Font } from '@react-pdf/renderer';

const FONTS_DIR = path.join(process.cwd(), 'public/fonts');

// ── PaperlogyHan (한자 커버리지 포함, 9가지 굵기) ──
Font.register({
  family: 'Paperlogy',
  fonts: [
    { src: path.join(FONTS_DIR, 'PaperlogyHan-1Thin.ttf'),       fontWeight: 100 },
    { src: path.join(FONTS_DIR, 'PaperlogyHan-2ExtraLight.ttf'),  fontWeight: 200 },
    { src: path.join(FONTS_DIR, 'PaperlogyHan-3Light.ttf'),       fontWeight: 300 },
    { src: path.join(FONTS_DIR, 'PaperlogyHan-4Regular.ttf'),     fontWeight: 400 },
    { src: path.join(FONTS_DIR, 'PaperlogyHan-5Medium.ttf'),      fontWeight: 500 },
    { src: path.join(FONTS_DIR, 'PaperlogyHan-6SemiBold.ttf'),    fontWeight: 600 },
    { src: path.join(FONTS_DIR, 'PaperlogyHan-7Bold.ttf'),        fontWeight: 700 },
    { src: path.join(FONTS_DIR, 'PaperlogyHan-8ExtraBold.ttf'),   fontWeight: 800 },
    { src: path.join(FONTS_DIR, 'PaperlogyHan-9Black.ttf'),       fontWeight: 900 },
  ],
});

// 하이픈 비활성화 (한국어에 불필요)
Font.registerHyphenationCallback((word) => [word]);
