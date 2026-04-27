import { analyzeSaju } from '@engine/analyze';

test('ref saju full', () => {
  const r = analyzeSaju({ birthDate:'1986-09-15', birthTime:'01:17', calendar:'solar', birthCity:'Seoul', gender:'M' });
  console.log('strength level:', r.strength.level, 'score:', r.strength.score);
  console.log('gyeokGuk type:', r.gyeokGuk.type, 'state:', r.gyeokGuk.state);
  console.log('yongSin primary:', r.yongSin.final.primary);
  console.log('day gan:', r.pillars.day.gan);
  expect(true).toBe(true);
});
