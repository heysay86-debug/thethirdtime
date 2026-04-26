import { SajuGateway } from '../src/gateway/gateway';
import { SAJU_SYSTEM_PROMPT } from '../src/gateway/prompts/system';
import { sajuCoreTool } from '../src/gateway/tools/saju_core';
import { sajuInterpretationTool } from '../src/gateway/tools/saju_interpretation';

describe('gateway — 구조 검증', () => {
  it('SajuGateway 인스턴스 생성 가능', () => {
    const gw = new SajuGateway({ apiKey: 'test-key' });
    expect(gw).toBeDefined();
  });

  it('Phase 1 core tool 정의', () => {
    expect(sajuCoreTool.name).toBe('submit_saju_core');
    expect(sajuCoreTool.input_schema.required).toContain('summary');
    expect(sajuCoreTool.input_schema.required).toContain('strengthReading');
    expect(sajuCoreTool.input_schema.required).toContain('gyeokGukReading');
    expect(sajuCoreTool.input_schema.required).toContain('yongSinReading');
  });

  it('Phase 2 interpretation tool에 coreJudgment·pillarAnalysis 없음', () => {
    const sectionKeys = Object.keys(sajuInterpretationTool.input_schema.properties.sections.properties);
    expect(sectionKeys).not.toContain('coreJudgment');
    expect(sectionKeys).not.toContain('pillarAnalysis');
    expect(sectionKeys).toContain('basics');
    expect(sectionKeys).toContain('overallReading');
  });

  it('Phase 2 tool required에 coreJudgment 없음', () => {
    const required = sajuInterpretationTool.input_schema.properties.sections.required;
    expect(required).not.toContain('coreJudgment');
  });

  it('시스템 프롬프트 + tool 합산 크기 충분 (캐시 대상)', () => {
    const totalChars = SAJU_SYSTEM_PROMPT.length
      + JSON.stringify(sajuCoreTool).length
      + JSON.stringify(sajuInterpretationTool).length;
    expect(totalChars).toBeGreaterThan(1000);
  });
});
