/**
 * 레퍼런스 사주로 샘플 캐릭터 카드 생성 (완료 기준 4번)
 * 1986-09-15 01:17 서울 남명
 */
import path from 'path';
import fs from 'fs';
import { analyzeSaju } from '@engine/analyze';
import { mapSajuToCard } from '@/src/card/stat-mapper';
import { renderCard } from '@/src/card/card-renderer';

test('샘플 카드 생성 — 1986-09-15 01:17 서울 남명', async () => {
  // 에셋 경로: 제3의시간_SNS/asset
  // 환경변수 CARD_ASSET_DIR이 없으면 public 폴더 사용 → 여기서는 직접 설정
  const snsAsset = (() => {
    const mnt = '/sessions/loving-elegant-noether/mnt';
    const names = fs.readdirSync(mnt);
    const snsName = names.find(n => n.includes('SNS'));
    return snsName ? path.join(mnt, snsName, 'asset') : null;
  })();

  if (snsAsset) {
    process.env.CARD_ASSET_DIR = snsAsset;
  }

  // 엔진 실행
  const engine = analyzeSaju({
    birthDate: '1986-09-15',
    birthTime: '01:17',
    calendar: 'solar',
    birthCity: 'Seoul',
    gender: 'M',
  });

  // 카드 데이터 변환
  const cardData = mapSajuToCard(engine);
  console.log('[카드 데이터]');
  console.log('  title:', cardData.title);
  console.log('  class:', cardData.className);
  console.log('  element:', cardData.elementKey, '→ bg:', cardData.backgroundFile);
  console.log('  char:', cardData.characterType);
  console.log('  stats:', JSON.stringify(cardData.stats));
  console.log('  skill:', cardData.skill);
  console.log('  gyeokGuk:', cardData.gyeokGukType, cardData.gyeokGukState);

  // PNG 생성
  const pngBuf = await renderCard(cardData);
  expect(pngBuf.length).toBeGreaterThan(10000); // 최소 10KB

  // 출력 저장
  const outDir = path.join('/sessions/loving-elegant-noether/mnt/outputs');
  const outPath = path.join(outDir, 'sample-card-1986.png');
  fs.writeFileSync(outPath, pngBuf);
  console.log('[샘플 카드 저장]', outPath, `(${Math.round(pngBuf.length/1024)}KB)`);

  // 워크스페이스에도 복사
  const wsDir = '/sessions/loving-elegant-noether/mnt/sajuweb/public/og';
  fs.mkdirSync(wsDir, { recursive: true });
  fs.writeFileSync(path.join(wsDir, 'sample-card-1986.png'), pngBuf);
  console.log('[워크스페이스 저장]', path.join(wsDir, 'sample-card-1986.png'));
}, 30000);
