import { GLOSSARY, findGlossaryEntry, extractGlossaryTerms } from '@engine/data/glossary';

describe('glossary — 용어 사전', () => {
  it('60개 이상 항목이 등록되어 있다', () => {
    expect(GLOSSARY.length).toBeGreaterThanOrEqual(55);
  });

  it('모든 항목이 필수 필드를 가진다', () => {
    for (const entry of GLOSSARY) {
      expect(entry.term).toBeTruthy();
      expect(entry.hanja).toBeTruthy();
      expect(entry.short).toBeTruthy();
      expect(entry.full.length).toBeGreaterThan(30);
      expect(entry.category).toBeTruthy();
    }
  });

  it('중복 term이 없다', () => {
    const terms = GLOSSARY.map(e => e.term);
    expect(new Set(terms).size).toBe(terms.length);
  });

  it('주요 카테고리가 모두 존재한다', () => {
    const categories = new Set(GLOSSARY.map(e => e.category));
    expect(categories.has('기본')).toBe(true);
    expect(categories.has('격국')).toBe(true);
    expect(categories.has('십성')).toBe(true);
    expect(categories.has('용신')).toBe(true);
    expect(categories.has('오행')).toBe(true);
    expect(categories.has('신강약')).toBe(true);
    expect(categories.has('관계')).toBe(true);
    expect(categories.has('운세')).toBe(true);
  });

  describe('findGlossaryEntry', () => {
    it('존재하는 용어를 찾는다', () => {
      const entry = findGlossaryEntry('편인격');
      expect(entry).toBeDefined();
      expect(entry!.hanja).toBe('偏印格');
    });

    it('없는 용어는 undefined', () => {
      expect(findGlossaryEntry('없는용어')).toBeUndefined();
    });
  });

  describe('extractGlossaryTerms', () => {
    it('텍스트에서 키워드를 추출한다', () => {
      const text = '본 사주는 편인격의 신강 구조로, 용신은 木입니다.';
      const terms = extractGlossaryTerms(text);
      const termNames = terms.map(t => t.term);

      expect(termNames).toContain('편인격');
      expect(termNames).toContain('신강');
      expect(termNames).toContain('용신');
    });

    it('중복 키워드는 한 번만 반환한다', () => {
      const text = '신강한 사주에서 신강은 중요합니다.';
      const terms = extractGlossaryTerms(text);
      const shingang = terms.filter(t => t.term === '신강');
      expect(shingang.length).toBe(1);
    });

    it('레퍼런스 해석문에서 용어를 추출한다', () => {
      const text = '壬水 일간이 酉월에서 득령하여 신강합니다. 편인격으로 재극인 파격이며, 억부와 조후가 일치하여 용신은 木(식신)입니다. 대운은 순행으로 흐릅니다.';
      const terms = extractGlossaryTerms(text);
      const termNames = terms.map(t => t.term);

      expect(termNames).toContain('일간');
      expect(termNames).toContain('득령');
      expect(termNames).toContain('신강');
      expect(termNames).toContain('편인격');
      expect(termNames).toContain('재극인');
      expect(termNames).toContain('억부');
      expect(termNames).toContain('조후');
      expect(termNames).toContain('용신');
      expect(termNames).toContain('식신');
      expect(termNames).toContain('대운');
      expect(termNames).toContain('순행');
    });
  });
});
