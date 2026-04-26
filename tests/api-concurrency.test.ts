import { analyzeSaju } from '../src/engine/analyze';

function makeRequest(body: unknown, sessionId?: string) {
  return {
    headers: {
      get: (name: string) => {
        if (name === 'origin') return 'http://localhost:3000';
        if (name === 'x-forwarded-for') return '127.0.0.1';
        return null;
      },
    },
    cookies: {
      get: (name: string) => {
        if (name === 'saju_session' && sessionId) return { value: sessionId };
        return undefined;
      },
    },
    json: async () => body,
  } as any;
}

describe('API concurrency guards', () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it('analyze cache hit releases slot exactly once', async () => {
    const waitForSlot = jest.fn().mockResolvedValue(undefined);
    const release = jest.fn();
    const getOrCreateSession = jest.fn().mockReturnValue({
      id: 'session-1',
      lastInputHash: 'same-hash',
      engine: { cached: true },
      core: { summary: '요약', strengthReading: '신강', gyeokGukReading: '격국', yongSinReading: '용신' },
      sections: null,
    });
    const hashInput = jest.fn().mockReturnValue('same-hash');
    const analyze = jest.fn();
    const saveReport = jest.fn();

    jest.doMock('@/src/middleware/concurrency', () => ({
      waitForSlot,
      release,
    }));
    jest.doMock('@/src/middleware/rate-limit', () => ({
      checkRateLimit: () => ({ allowed: true, remaining: 9, resetMs: 0 }),
    }));
    jest.doMock('@/src/middleware/session', () => ({
      SESSION_COOKIE_NAME: 'saju_session',
      getOrCreateSession,
      updateSession: jest.fn(),
      hashInput,
    }));
    jest.doMock('@/src/engine/analyze', () => ({
      analyzeSaju: analyze,
    }));
    jest.doMock('@/src/db', () => ({
      saveReport,
    }));
    jest.doMock('@/src/gateway/gateway', () => ({
      SajuGateway: jest.fn(),
    }));
    jest.doMock('@/src/middleware/sanitize', () => ({
      sanitizeSections: (value: unknown) => value,
    }));

    const { POST } = await import('../app/api/saju/analyze/route');

    const response = await POST(makeRequest({
      birthDate: '1986-09-15',
      birthTime: '01:17',
      calendar: 'solar',
      gender: 'M',
    }, 'session-1'));

    expect(response.status).toBe(200);
    expect(waitForSlot).toHaveBeenCalledTimes(1);
    expect(release).toHaveBeenCalledTimes(1);
    expect(analyze).not.toHaveBeenCalled();
    expect(saveReport).not.toHaveBeenCalled();
  });

  it('interpret acquires and releases slot on success', async () => {
    const waitForSlot = jest.fn().mockResolvedValue(undefined);
    const release = jest.fn();
    const analyzePhase2 = jest.fn().mockResolvedValue({
      sections: {
        basics: { description: '기본' },
        ohengAnalysis: { distribution: '분포', johu: '조후' },
        sipseongAnalysis: { reading: '십성' },
        relations: { reading: '관계' },
        daeunReading: null,
        overallReading: { primary: '종합', modernApplication: '적용' },
      },
    });

    jest.doMock('@/src/middleware/concurrency', () => ({
      waitForSlot,
      release,
    }));
    jest.doMock('@/src/middleware/rate-limit', () => ({
      checkRateLimit: () => ({ allowed: true, remaining: 9, resetMs: 0 }),
    }));
    jest.doMock('@/src/gateway/gateway', () => ({
      SajuGateway: jest.fn().mockImplementation(() => ({
        analyzePhase2,
      })),
    }));
    jest.doMock('@/src/middleware/sanitize', () => ({
      sanitizePersonalInfo: (value: string) => value,
      sanitizeSections: (value: unknown) => value,
    }));

    const { POST } = await import('../app/api/saju/interpret/route');
    const engine = analyzeSaju({
      birthDate: '1986-09-15',
      birthTime: '01:17',
      calendar: 'solar',
      gender: 'M',
    });

    const response = await POST(makeRequest({
      engine,
      core: {
        summary: '요약',
        strengthReading: '신강',
        gyeokGukReading: '격국',
        yongSinReading: '용신',
      },
    }));

    expect(response.status).toBe(200);
    await response.text();
    expect(waitForSlot).toHaveBeenCalledTimes(1);
    expect(analyzePhase2).toHaveBeenCalledTimes(1);
    expect(release).toHaveBeenCalledTimes(1);
  });

  it('interpret returns 503 when queue wait times out', async () => {
    const waitForSlot = jest.fn().mockRejectedValue(new Error('queue_timeout'));
    const release = jest.fn();

    jest.doMock('@/src/middleware/concurrency', () => ({
      waitForSlot,
      release,
    }));
    jest.doMock('@/src/middleware/rate-limit', () => ({
      checkRateLimit: () => ({ allowed: true, remaining: 9, resetMs: 0 }),
    }));
    jest.doMock('@/src/gateway/gateway', () => ({
      SajuGateway: jest.fn(),
    }));
    jest.doMock('@/src/middleware/sanitize', () => ({
      sanitizePersonalInfo: (value: string) => value,
      sanitizeSections: (value: unknown) => value,
    }));

    const { POST } = await import('../app/api/saju/interpret/route');
    const engine = analyzeSaju({
      birthDate: '1986-09-15',
      birthTime: '01:17',
      calendar: 'solar',
      gender: 'M',
    });

    const response = await POST(makeRequest({
      engine,
      core: {
        summary: '요약',
        strengthReading: '신강',
        gyeokGukReading: '격국',
        yongSinReading: '용신',
      },
    }));

    expect(response.status).toBe(503);
    expect(release).not.toHaveBeenCalled();
  });
});
