import { InterpretationResultSchema } from '../src/gateway/prompts/schema';
import { SAJU_SYSTEM_PROMPT, buildUserMessage } from '../src/gateway/prompts/system';
import { sajuInterpretationTool } from '../src/gateway/tools/saju_interpretation';
import { sajuCoreTool } from '../src/gateway/tools/saju_core';
import { analyzeSaju } from '@engine/analyze';

describe('M15 — 시스템 프롬프트 설계', () => {
  it('시스템 프롬프트가 핵심 지침을 포함한다', () => {
    expect(SAJU_SYSTEM_PROMPT).toContain('이석영');
    expect(SAJU_SYSTEM_PROMPT).toContain('사주첩경');
    expect(SAJU_SYSTEM_PROMPT).toContain('자평진전');
    expect(SAJU_SYSTEM_PROMPT).toContain('적천수');
    expect(SAJU_SYSTEM_PROMPT).toContain('궁통보감');
    expect(SAJU_SYSTEM_PROMPT).toContain('명리정종');
  });

  it('시스템 프롬프트에 출력 JSON 스키마가 없다', () => {
    expect(SAJU_SYSTEM_PROMPT).not.toContain('"summary"');
    expect(SAJU_SYSTEM_PROMPT).not.toContain('"sections"');
    expect(SAJU_SYSTEM_PROMPT).not.toContain('```json');
  });

  it('시스템 프롬프트에 입력 JSON 구조 설명이 없다', () => {
    expect(SAJU_SYSTEM_PROMPT).not.toContain('pillars:');
    expect(SAJU_SYSTEM_PROMPT).not.toContain('tenGods:');
  });

  it('buildUserMessage가 JSON을 포함한 메시지를 생성한다', () => {
    const result = analyzeSaju({
      birthDate: '1986-09-15', birthTime: '01:17', calendar: 'solar', gender: 'M',
    });
    const msg = buildUserMessage(JSON.stringify(result));

    expect(msg).toContain('pillars');
    expect(msg).toContain('gyeokGuk');
    expect(msg).toContain('yongSin');
    expect(msg).toContain('daeun');
  });

  it('InterpretationResultSchema가 유효한 샘플을 파싱한다', () => {
    const sample = {
      summary: '壬水 신강, 편인격 약화, 용신 木',
      sections: {
        basics: { description: '丙寅 丁酉 壬戌 庚子 사주입니다.' },
        coreJudgment: {
          strengthReading: '壬水 일간이 70점 신강입니다.',
          gyeokGukReading: '편인격으로 재극인 파격이며 酉戌해로 약화됩니다.',
          yongSinReading: '억부와 조후 모두 木을 가리킵니다.',
        },
        pillarAnalysis: {
          year: '丙寅 연주 해석',
          month: '丁酉 월주 해석',
          day: '壬戌 일주 해석',
          hour: '庚子 시주 해석',
        },
        ohengAnalysis: {
          distribution: '오행 분포 해석',
          johu: '가을 사주로 조후 필요성 낮음',
          perspectives: [{ school: '궁통보감' as const, content: '壬일간 유월 甲木 설기' }],
        },
        sipseongAnalysis: {
          reading: '십성 해석',
          perspectives: [{ school: '명리정종' as const, content: '육친 분석' }],
        },
        relations: { reading: '壬丁합, 酉戌해' },
        daeunReading: {
          overview: '대운 개관',
          currentPeriod: '현재 대운',
          upcoming: '향후 세운',
        },
        overallReading: {
          primary: '종합 해석',
          modernApplication: '현대적 적용',
          perspectives: [{ school: '적천수' as const, content: '기세론 관점' }],
        },
      },
    };

    expect(() => InterpretationResultSchema.parse(sample)).not.toThrow();
  });

  it('daeunReading null 허용', () => {
    const sample = {
      summary: '시각 미상 사주',
      sections: {
        basics: { description: '...' },
        coreJudgment: { strengthReading: '...', gyeokGukReading: '...', yongSinReading: '...' },
        pillarAnalysis: { year: '...', month: '...', day: '...', hour: null },
        ohengAnalysis: { distribution: '...', johu: '...' },
        sipseongAnalysis: { reading: '...' },
        relations: { reading: '...' },
        daeunReading: null,
        overallReading: { primary: '...', modernApplication: '...' },
      },
    };

    expect(() => InterpretationResultSchema.parse(sample)).not.toThrow();
  });
});

describe('M15 — 2단계 Tool 정의', () => {
  it('Phase 1 core tool: summary + 3 readings', () => {
    expect(sajuCoreTool.name).toBe('submit_saju_core');
    expect(sajuCoreTool.input_schema.required).toContain('summary');
    expect(sajuCoreTool.input_schema.required).toContain('strengthReading');
    expect(sajuCoreTool.input_schema.required).toContain('gyeokGukReading');
    expect(sajuCoreTool.input_schema.required).toContain('yongSinReading');
  });

  it('Phase 2 interpretation tool: coreJudgment 제외', () => {
    const sectionKeys = Object.keys(sajuInterpretationTool.input_schema.properties.sections.properties);
    expect(sectionKeys).not.toContain('coreJudgment');
    expect(sectionKeys).toContain('basics');
    expect(sectionKeys).toContain('pillarAnalysis');
    expect(sectionKeys).toContain('ohengAnalysis');
    expect(sectionKeys).toContain('overallReading');
  });

  it('Phase 2: daeunReading null 허용', () => {
    const daeun = sajuInterpretationTool.input_schema.properties.sections.properties.daeunReading;
    expect(daeun.anyOf).toBeDefined();
    expect(daeun.anyOf.some((s: any) => s.type === 'null')).toBe(true);
  });

  it('Phase 2: hour null 허용', () => {
    const hour = sajuInterpretationTool.input_schema.properties.sections.properties.pillarAnalysis.properties.hour;
    expect(hour.anyOf).toBeDefined();
    expect(hour.anyOf.some((s: any) => s.type === 'null')).toBe(true);
  });

  it('Phase 2: johu description에 궁통보감 포함', () => {
    const johu = sajuInterpretationTool.input_schema.properties.sections.properties.ohengAnalysis.properties.johu;
    expect(johu.description).toContain('궁통보감');
  });
});
