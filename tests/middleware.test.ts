import { checkRateLimit } from '../src/middleware/rate-limit';
import { sanitizePersonalInfo, sanitizeSections } from '../src/middleware/sanitize';
import { getOrCreateSession, updateSession, hashInput, SESSION_COOKIE_NAME } from '../src/middleware/session';

describe('rate-limit', () => {
  it('첫 요청은 허용된다', () => {
    const result = checkRateLimit('test-ip-1', 5, 60000);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it('한도 초과 시 거부된다', () => {
    const ip = 'test-ip-limit';
    for (let i = 0; i < 3; i++) {
      checkRateLimit(ip, 3, 60000);
    }
    const result = checkRateLimit(ip, 3, 60000);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });
});

describe('sanitize', () => {
  it('YYYY-MM-DD 패턴을 마스킹한다', () => {
    expect(sanitizePersonalInfo('1986-09-15에 태어난')).toBe('[날짜]에 태어난');
  });

  it('YYYY년 M월 D일 패턴을 마스킹한다', () => {
    expect(sanitizePersonalInfo('1986년 9월 15일 출생')).toBe('[날짜] 출생');
  });

  it('HH:MM 패턴을 마스킹한다', () => {
    expect(sanitizePersonalInfo('01:17 출생')).toBe('[시각] 출생');
  });

  it('간지·오행 표현은 유지한다', () => {
    const text = '壬水 일간이 酉월에서 득령합니다';
    expect(sanitizePersonalInfo(text)).toBe(text);
  });

  it('객체 내 모든 문자열을 재귀 마스킹한다', () => {
    const obj = {
      reading: '1986-09-15에 태어난 사주',
      nested: { detail: '01:17 출생' },
    };
    const result = sanitizeSections(obj);
    expect(result.reading).toBe('[날짜]에 태어난 사주');
    expect(result.nested.detail).toBe('[시각] 출생');
  });

  it('null은 그대로 반환한다', () => {
    expect(sanitizeSections(null)).toBeNull();
  });
});

describe('session', () => {
  it('새 세션을 생성한다', () => {
    const session = getOrCreateSession(null);
    expect(session.id).toBeDefined();
    expect(session.engine).toBeNull();
    expect(session.core).toBeNull();
  });

  it('기존 세션을 반환한다', () => {
    const s1 = getOrCreateSession(null);
    const s2 = getOrCreateSession(s1.id);
    expect(s2.id).toBe(s1.id);
  });

  it('세션 데이터를 업데이트한다', () => {
    const session = getOrCreateSession(null);
    updateSession(session.id, { lastInputHash: 'test-hash' });
    const updated = getOrCreateSession(session.id);
    expect(updated.lastInputHash).toBe('test-hash');
  });

  it('입력 해시가 동일하면 같은 값', () => {
    const h1 = hashInput({ birthDate: '1986-09-15', birthTime: '01:17', calendar: 'solar', gender: 'M' });
    const h2 = hashInput({ birthDate: '1986-09-15', birthTime: '01:17', calendar: 'solar', gender: 'M' });
    expect(h1).toBe(h2);
  });

  it('입력이 다르면 해시도 다르다', () => {
    const h1 = hashInput({ birthDate: '1986-09-15', calendar: 'solar' });
    const h2 = hashInput({ birthDate: '1986-09-16', calendar: 'solar' });
    expect(h1).not.toBe(h2);
  });

  it('쿠키 이름이 정의되어 있다', () => {
    expect(SESSION_COOKIE_NAME).toBe('saju_session');
  });
});
