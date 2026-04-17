/**
 * 엔진 결과 JSON 덤프
 * 실제 analyzeSaju() 결과를 파일로 저장한다.
 */

import path from 'path';
import fs from 'fs';
import { analyzeSaju } from '../src/engine/analyze';

const OUTPUT_DIR = path.join(__dirname, 'output');
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

const result = analyzeSaju({
  birthDate: '1986-09-15',
  birthTime: '01:17',
  calendar: 'solar',
  birthCity: '서울',
  gender: 'M',
});

const outPath = path.join(OUTPUT_DIR, 'engine-result.json');
fs.writeFileSync(outPath, JSON.stringify(result, null, 2), 'utf-8');
console.log(`엔진 결과 저장 → ${outPath}`);
console.log(`4기둥: ${result.pillars.year.gan}${result.pillars.year.ji} ${result.pillars.month.gan}${result.pillars.month.ji} ${result.pillars.day.gan}${result.pillars.day.ji} ${result.pillars.hour?.gan ?? '?'}${result.pillars.hour?.ji ?? '?'}`);
console.log(`신강약: ${result.strength.level} (${result.strength.score}점, ${result.strength.wolryeong})`);
console.log(`격국: ${result.gyeokGuk.type} (${result.gyeokGuk.category}, ${result.gyeokGuk.state})`);
console.log(`용신: ${result.yongSin.final.primary} / 희신: ${result.yongSin.final.secondary} / 방법: ${result.yongSin.final.method}`);
console.log(`대운: ${result.daeun ? result.daeun.direction + ' ' + result.daeun.periods.length + '개' : 'null'}`);
console.log(`세운: ${result.seun.length}개`);
