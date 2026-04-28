#!/usr/bin/env node
/**
 * 인스타 캐러셀 이미지 생성기 (HTML + Puppeteer)
 *
 * 사용법:
 *   node sns/generate-carousel.js --slides sns/templates/slides.json
 *   node sns/generate-carousel.js --slides sns/templates/slides.json --out sns/output/my-topic
 *
 * slides.json 예시:
 * {
 *   "topic": "서비스 소개",
 *   "brand": {
 *     "bgColor": "#1a1e24",
 *     "textColor": "#f0dfad",
 *     "subTextColor": "#c8cdd3",
 *     "accentColor": "#97c6aa",
 *     "font": "Pretendard Variable, sans-serif",
 *     "titleFont": "Gaegu, cursive",
 *     "logo": "/icon/logo.svg",
 *     "character": "/character/magician.png"
 *   },
 *   "slides": [
 *     {
 *       "type": "cover",
 *       "title": "당신의 생년월일시 속에\n숨겨진 이야기가\n있습니다",
 *       "subtitle": "— 제3의시간",
 *       "background": null
 *     },
 *     {
 *       "type": "content",
 *       "title": "사주를 본 적\n있나요?",
 *       "body": "\"올해 좋아요\" 말고,\n왜 그런지 궁금했던 적 없나요?",
 *       "background": null
 *     },
 *     {
 *       "type": "cta",
 *       "title": "프로필 링크에서\n확인하세요",
 *       "subtitle": "www.betterdan.net",
 *       "background": null
 *     }
 *   ]
 * }
 */

const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

const WIDTH = 1080;
const HEIGHT = 1350;

function parseArgs() {
  const args = process.argv.slice(2);
  const result = { slides: null, out: null };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--slides' && args[i + 1]) result.slides = args[++i];
    if (args[i] === '--out' && args[i + 1]) result.out = args[++i];
  }
  return result;
}

function buildSlideHtml(slide, brand, index, total) {
  const bg = slide.background
    ? `background-image: url('${slide.background}'); background-size: cover; background-position: center;`
    : `background-color: ${brand.bgColor};`;

  const overlay = slide.background
    ? '<div style="position:absolute;inset:0;background:rgba(0,0,0,0.55);"></div>'
    : '';

  // 캐릭터 이미지 (cover/cta에서만 표시)
  const character = (slide.type === 'cover' || slide.type === 'cta') && brand.character
    ? `<img src="${brand.character}" style="width:180px;height:auto;margin-bottom:20px;image-rendering:pixelated;" />`
    : '';

  // 로고 (하단)
  const logo = brand.logo
    ? `<img src="${brand.logo}" style="height:28px;opacity:0.6;" />`
    : '';

  // 페이지 인디케이터
  const dots = Array.from({ length: total }, (_, i) =>
    `<span style="width:8px;height:8px;border-radius:50%;background:${i === index ? brand.textColor : 'rgba(255,255,255,0.3)'};display:inline-block;"></span>`
  ).join('');

  // 레이아웃 옵션: slide.align (left/center/right), slide.valign (top/center/bottom)
  const align = slide.align || 'center';
  const valign = slide.valign || 'center';
  const titleSize = slide.titleSize || (slide.type === 'cover' ? '138px' : slide.type === 'cta' ? '110px' : '124px');
  const subtitleSize = slide.subtitleSize || '48px';
  const bodySize = slide.bodySize || '48px';

  const textAlign = align === 'left' ? 'left' : align === 'right' ? 'right' : 'center';
  const alignItems = align === 'left' ? 'flex-start' : align === 'right' ? 'flex-end' : 'center';
  const justifyContent = valign === 'top' ? 'flex-start' : valign === 'bottom' ? 'flex-end' : 'center';
  const padding = align === 'left' ? '60px 80px 100px 80px' : '60px 80px';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <link href="https://fonts.googleapis.com/css2?family=Gaegu:wght@400;700&family=Pretendard+Variable:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { width: ${WIDTH}px; height: ${HEIGHT}px; overflow: hidden; }
  </style>
</head>
<body>
  <div style="width:${WIDTH}px;height:${HEIGHT}px;${bg}position:relative;display:flex;flex-direction:column;align-items:${alignItems};justify-content:${justifyContent};padding:${padding};">
    ${overlay}

    <div style="position:relative;z-index:1;display:flex;flex-direction:column;align-items:${alignItems};justify-content:${justifyContent};flex:1;text-align:${textAlign};width:100%;">
      ${character}
      <div style="font-family:${brand.titleFont};font-size:${titleSize};font-weight:700;color:${brand.textColor};line-height:1.3;white-space:pre-line;margin-bottom:24px;-webkit-text-stroke:3px rgba(0,0,0,0.5);paint-order:stroke fill;text-shadow:0 2px 16px rgba(0,0,0,0.8),0 4px 24px rgba(0,0,0,0.5),0 0 40px rgba(0,0,0,0.3);">
        ${slide.title || ''}
      </div>
      ${slide.subtitle ? `<div style="font-family:${brand.font};font-size:${subtitleSize};color:${brand.subTextColor};line-height:1.6;white-space:pre-line;text-shadow:0 2px 8px rgba(0,0,0,0.6);">${slide.subtitle}</div>` : ''}
      ${slide.body ? `<div style="font-family:${brand.font};font-size:${bodySize};color:${brand.subTextColor};line-height:1.7;white-space:pre-line;margin-top:16px;text-shadow:0 2px 8px rgba(0,0,0,0.6);">${slide.body}</div>` : ''}
    </div>

    <div style="position:relative;z-index:1;display:flex;flex-direction:column;align-items:${alignItems};gap:16px;padding-bottom:20px;${align === 'left' ? 'align-self:flex-start;' : ''}">
      ${logo}
      <div style="display:flex;gap:8px;">${dots}</div>
    </div>
  </div>
</body>
</html>`;
}

async function main() {
  const { slides: slidesPath, out } = parseArgs();

  if (!slidesPath) {
    console.error('Usage: node sns/generate-carousel.js --slides <path-to-slides.json> [--out <output-dir>]');
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(slidesPath, 'utf-8'));
  const brand = data.brand || {};
  const slides = data.slides || [];

  // 이미지를 base64 data URI로 변환 (Puppeteer file:// 제한 우회)
  const projectRoot = path.join(__dirname, '..');
  const toDataUri = (p) => {
    if (!p || p.startsWith('http') || p.startsWith('data:')) return p;
    const resolved = p.startsWith('/')
      ? path.join(projectRoot, 'public', p)
      : path.join(projectRoot, p.replace(/^\.\.\//, ''));
    if (!fs.existsSync(resolved)) { console.warn(`  ⚠ 파일 없음: ${resolved}`); return ''; }
    const ext = path.extname(resolved).slice(1).replace('jpg', 'jpeg');
    const mime = ext === 'svg' ? 'image/svg+xml' : `image/${ext}`;
    const b64 = fs.readFileSync(resolved).toString('base64');
    return `data:${mime};base64,${b64}`;
  };
  if (brand.logo) brand.logo = toDataUri(brand.logo);
  if (brand.character) brand.character = toDataUri(brand.character);
  for (const slide of slides) {
    if (slide.background) slide.background = toDataUri(slide.background);
  }

  const outputDir = out || path.join(__dirname, 'output', data.topic?.replace(/\s+/g, '-') || 'carousel');
  fs.mkdirSync(outputDir, { recursive: true });

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  console.log(`\n📱 캐러셀 생성: ${data.topic || 'untitled'} (${slides.length}장)\n`);

  for (let i = 0; i < slides.length; i++) {
    const html = buildSlideHtml(slides[i], brand, i, slides.length);
    const page = await browser.newPage();
    await page.setViewport({ width: WIDTH, height: HEIGHT, deviceScaleFactor: 2 });
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const filePath = path.join(outputDir, `slide-${String(i + 1).padStart(2, '0')}.png`);
    await page.screenshot({ path: filePath, type: 'png' });
    await page.close();

    console.log(`  ✅ ${i + 1}/${slides.length}: ${filePath}`);
  }

  await browser.close();
  console.log(`\n🎉 완료! ${outputDir}\n`);
}

main().catch(err => {
  console.error('❌ 에러:', err.message);
  process.exit(1);
});
