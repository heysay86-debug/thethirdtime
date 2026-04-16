describe('프로젝트 초기화', () => {
  it('TypeScript + Jest 환경이 정상 동작한다', () => {
    expect(1 + 1).toBe(2);
  });

  it('data/iljin.json을 로드할 수 있다', () => {
    const iljin = require('../data/iljin.json');
    expect(Object.keys(iljin).length).toBeGreaterThan(0);
  });

  it('data/jeolip.json을 로드할 수 있다', () => {
    const jeolip = require('../data/jeolip.json');
    expect(Object.keys(jeolip).length).toBeGreaterThan(0);
  });
});
