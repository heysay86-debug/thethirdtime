/**
 * LLM 게이트웨이 — 2단계 호출 구조
 *
 * Phase 1: 핵심 판단 — tool use + messages.create() (빠른 응답)
 * Phase 2: 전체 해석 — 텍스트 스트리밍 + JSON.parse + Zod 검증
 *
 * Prompt caching: system에 cache_control: ephemeral (5분 TTL)
 *
 * 참고:
 *   https://docs.anthropic.com/en/docs/agents-and-tools/tool-use/overview
 *   https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching
 */

import Anthropic from '@anthropic-ai/sdk';
import { SAJU_SYSTEM_PROMPT, SAJU_SYSTEM_PROMPT_PHASE2 } from './prompts/system';
import { sajuCoreTool } from './tools/saju_core';
import { Phase2ResultSchema } from './prompts/schema';
import { SajuResult } from '../engine/schema';
import { buildChunkContext } from './chunks';

// ── 설정 ──

const DEFAULT_MODEL = 'claude-haiku-4-5-20251001';
const PHASE1_MAX_TOKENS = 1024;
const PHASE2_MAX_TOKENS = 12000;

export interface GatewayOptions {
  model?: string;
  apiKey?: string;
}

// ── Phase 1 결과 타입 ──

export interface CoreJudgment {
  summary: string;
  strengthReading: string;
  gyeokGukReading: string;
  yongSinReading: string;
}

export interface Phase1Response {
  core: CoreJudgment;
  usage: UsageInfo;
  elapsedMs: number;
}

// ── Phase 2 결과 타입 ──

export interface Phase2Sections {
  basics: { description: string };
  pillarAnalysis: { year: string; month: string; day: string; hour: string | null };
  ohengAnalysis: { distribution: string; johu: string; perspectives?: any[] };
  sipseongAnalysis: { reading: string; perspectives?: any[] };
  relations: { reading: string };
  daeunReading: { overview: string; currentPeriod: string; upcoming: string } | null;
  overallReading: { primary: string; modernApplication: string; perspectives?: any[] };
}

export interface Phase2Response {
  sections: Phase2Sections;
  usage: UsageInfo;
  elapsedMs: number;
  timeToFirstTokenMs: number;
}

export interface UsageInfo {
  inputTokens: number;
  outputTokens: number;
  cacheCreationInputTokens: number;
  cacheReadInputTokens: number;
}

// ── 게이트웨이 ──

export class SajuGateway {
  private client: Anthropic;
  private model: string;

  constructor(options: GatewayOptions = {}) {
    this.client = new Anthropic({
      apiKey: options.apiKey ?? process.env.ANTHROPIC_API_KEY,
    });
    this.model = options.model ?? DEFAULT_MODEL;
  }

  /**
   * Phase 1 — 핵심 판단 (tool use, 단순 호출)
   */
  async analyzePhase1(sajuResult: SajuResult): Promise<Phase1Response> {
    const start = Date.now();

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: PHASE1_MAX_TOKENS,
      system: [
        {
          type: 'text',
          text: SAJU_SYSTEM_PROMPT,
          cache_control: { type: 'ephemeral' },
        },
      ],
      tools: [
        {
          ...sajuCoreTool,
          cache_control: { type: 'ephemeral' },
        } as any,
      ],
      tool_choice: { type: 'tool', name: 'submit_saju_core' },
      messages: [
        { role: 'user', content: (() => {
          const by = sajuResult.birth?.solar ? parseInt(sajuResult.birth.solar.split('-')[0]) : null;
          const cy = new Date().getFullYear();
          const age = by ? cy - by : null;
          const ageNote = age !== null ? `\n현재 ${cy}년. 출생 ${by}년. 만 ${age}세.` : '';
          return JSON.stringify(sajuResult) + ageNote;
        })() },
      ],
    });

    const elapsedMs = Date.now() - start;
    const usage = extractUsage(response);
    this.logPhase('Phase1', usage, elapsedMs);

    const toolBlock = response.content.find(
      (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use',
    );
    if (!toolBlock || toolBlock.name !== 'submit_saju_core') {
      throw new Error('Phase 1: tool_use 블록 없음 또는 잘못된 tool');
    }

    const input = toolBlock.input as any;
    const core: CoreJudgment = {
      summary: input.summary,
      strengthReading: input.strengthReading,
      gyeokGukReading: input.gyeokGukReading,
      yongSinReading: input.yongSinReading,
    };

    return { core, usage, elapsedMs };
  }

  /**
   * Phase 2 — 전체 해석 (텍스트 스트리밍)
   * tool use 없이 순수 텍스트로 JSON 반환.
   * stream.on('text')로 SSE 전송, 완료 시 JSON.parse + Zod 검증.
   */
  async analyzePhase2(
    sajuResult: SajuResult,
    phase1Result: CoreJudgment,
    onChunk?: (text: string) => void,
  ): Promise<Phase2Response> {
    const start = Date.now();
    let timeToFirstTokenMs = 0;
    let firstTokenReceived = false;

    const hasDaeun = sajuResult.daeun !== null;
    // 교안 청크 로드 (없으면 빈 문자열)
    const chunkContext = buildChunkContext();

    // 출생 연도에서 현재 나이 계산
    const birthYear = sajuResult.birth?.solar ? parseInt(sajuResult.birth.solar.split('-')[0]) : null;
    const currentYear = new Date().getFullYear();
    const currentAge = birthYear ? currentYear - birthYear : null;

    const userMessage = [
      JSON.stringify(sajuResult),
      '',
      currentAge !== null ? `현재 연도: ${currentYear}년. 출생 연도: ${birthYear}년. 만 나이: ${currentAge}세. 현재 대운·세운 판단 시 반드시 이 나이를 기준으로 하십시오.` : '',
      '',
      '--- Phase 1 핵심 판단 (이미 제공됨, 중복 서술 금지) ---',
      `summary: ${phase1Result.summary}`,
      `신강약: ${phase1Result.strengthReading}`,
      `격국: ${phase1Result.gyeokGukReading}`,
      `용신: ${phase1Result.yongSinReading}`,
      '',
      chunkContext,
      '',
      '위 핵심 판단은 이미 사용자에게 제공되었습니다.',
      '교안 참고자료를 심리·상담 관점 보강에 활용하되, 이석영 기준 명리 해석이 1차입니다.',
      '아래 JSON 구조로 나머지 섹션만 작성하십시오. 시스템 프롬프트의 분량 기준을 반드시 준수하십시오:',
      '{"sections":{"basics":{"description":"..."},"pillarAnalysis":{"year":"...","month":"...","day":"...","hour":"..."},"ohengAnalysis":{"distribution":"...","johu":"..."},"sipseongAnalysis":{"reading":"..."},"relations":{"reading":"..."},"daeunReading":{"overview":"...","currentPeriod":"...","upcoming":"..."},"overallReading":{"primary":"...","modernApplication":"..."}}}',
      '',
      hasDaeun
        ? `대운 데이터 포함(${sajuResult.daeun!.periods.length}개 대운, ${sajuResult.seun.length}개 세운). daeunReading을 반드시 object로 작성.`
        : '대운 데이터 없음. daeunReading은 null.',
    ].join('\n');

    const stream = this.client.messages.stream({
      model: this.model,
      max_tokens: PHASE2_MAX_TOKENS,
      system: [
        {
          type: 'text',
          text: SAJU_SYSTEM_PROMPT_PHASE2,
          cache_control: { type: 'ephemeral' },
        },
      ],
      // tool use 없음 — 순수 텍스트 스트리밍
      messages: [
        { role: 'user', content: userMessage },
      ],
    });

    stream.on('text', (text) => {
      if (!firstTokenReceived) {
        timeToFirstTokenMs = Date.now() - start;
        firstTokenReceived = true;
      }
      if (onChunk) onChunk(text);
    });

    const finalMessage = await stream.finalMessage();
    const elapsedMs = Date.now() - start;
    const usage = extractUsage(finalMessage);
    this.logPhase('Phase2', usage, elapsedMs, timeToFirstTokenMs);

    // 텍스트에서 JSON 추출
    const finalText = finalMessage.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map(b => b.text)
      .join('');

    // JSON 추출: 마크다운 코드블록 제거 + 첫 { ~ 마지막 } 추출
    let jsonText = finalText.replace(/```(?:json)?\s*/g, '').replace(/\s*```/g, '').trim();
    const firstBrace = jsonText.indexOf('{');
    const lastBrace = jsonText.lastIndexOf('}');
    if (firstBrace >= 0 && lastBrace > firstBrace) {
      jsonText = jsonText.slice(firstBrace, lastBrace + 1);
    }

    let parsed: any = null;

    // 1차: 직접 파싱
    try {
      parsed = JSON.parse(jsonText);
    } catch {
      // 2차: 문자열 값 내부의 실제 줄바꿈을 \\n으로 치환 (수동 추적)
      try {
        const fixed = fixNewlinesInJsonStrings(jsonText);
        parsed = JSON.parse(fixed);
      } catch {
        // 3차: restructureSections (구조 오류 + 줄바꿈 수정)
        try {
          const restructured = restructureSections(jsonText);
          parsed = JSON.parse(restructured);
        } catch {
          // 4차: repairTruncatedJson (절단된 경우)
          const repaired = repairTruncatedJson(jsonText);
          if (repaired) {
            console.warn('[Phase2] JSON 절단 감지 — 복구 시도 성공');
            parsed = repaired;
          } else {
            throw new Error(`Phase 2: JSON 파싱 실패\n응답: ${jsonText.slice(0, 500)}`);
          }
        }
      }
    }

    // 디버그: LLM이 반환한 실제 키 구조 출력
    if (parsed?.sections) {
      const keys = Object.keys(parsed.sections);
      const subkeys: Record<string, string[]> = {};
      for (const k of keys) {
        if (typeof parsed.sections[k] === 'object' && parsed.sections[k] !== null) {
          subkeys[k] = Object.keys(parsed.sections[k]);
        }
      }
      console.log('[Phase2] 반환 키:', JSON.stringify(subkeys, null, 2));
    }

    // Zod 검증 — 누락 필드 패치 후 재시도
    const patched = patchMissingSections(parsed);
    const validated = Phase2ResultSchema.parse(patched);

    return {
      sections: validated.sections as Phase2Sections,
      usage,
      elapsedMs,
      timeToFirstTokenMs,
    };
  }

  private logPhase(phase: string, usage: UsageInfo, elapsedMs: number, ttft?: number): void {
    const cache = usage.cacheReadInputTokens > 0
      ? `HIT(${usage.cacheReadInputTokens})`
      : usage.cacheCreationInputTokens > 0
        ? `MISS(created ${usage.cacheCreationInputTokens})`
        : 'NONE';

    const parts = [
      `[${phase}]`,
      `${elapsedMs}ms`,
      `in:${usage.inputTokens}`,
      `out:${usage.outputTokens}`,
      `cache:${cache}`,
    ];
    if (ttft !== undefined) parts.push(`ttft:${ttft}ms`);
    console.log(parts.join(' | '));
  }
}

/**
 * 텍스트에서 첫 번째 완전한 JSON 객체를 추출.
 * 첫 { 부터 depth가 0이 되는 } 까지. 문자열 내 중괄호는 무시.
 */
function extractFirstJsonObject(text: string): string {
  const start = text.indexOf('{');
  if (start < 0) return text;

  let depth = 0;
  let inString = false;
  let escape = false;

  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (escape) { escape = false; continue; }
    if (ch === '\\' && inString) { escape = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }

  // depth > 0: 닫히지 않은 JSON (절단됨) — 전체 반환하여 repair에 맡김
  return text.slice(start);
}

/**
 * JSON 문자열 값 내부의 실제 줄바꿈(\n)을 \\n으로 치환.
 * 문자 단위로 추적하여 문자열 경계를 정확히 판별.
 */
function fixNewlinesInJsonStrings(text: string): string {
  const chars = [...text];
  const result: string[] = [];
  let inString = false;
  let i = 0;

  while (i < chars.length) {
    const ch = chars[i];

    if (inString) {
      if (ch === '\\' && i + 1 < chars.length) {
        // 이스케이프 시퀀스 — 2글자 그대로 통과
        result.push(ch, chars[i + 1]);
        i += 2;
        continue;
      }
      if (ch === '"') {
        // 문자열 종료
        inString = false;
        result.push(ch);
        i++;
        continue;
      }
      if (ch === '\n') {
        // 문자열 안의 줄바꿈 → 이스케이프
        result.push('\\', 'n');
        i++;
        continue;
      }
      result.push(ch);
      i++;
    } else {
      if (ch === '"') {
        inString = true;
      }
      result.push(ch);
      i++;
    }
  }

  return result.join('');
}

/**
 * LLM이 sections 바깥으로 빠뜨린 키를 sections 안으로 재구조화.
 * 문자열 내 줄바꿈도 함께 치환.
 */
function restructureSections(text: string): string {
  // 줄바꿈 치환
  let fixed = text.replace(/"(?:[^"\\]|\\.|\n)*"/g, (match) => {
    return match.replace(/\n/g, '\\n');
  });

  // sections 객체가 중간에 닫히고 나머지 키가 바깥에 있는 패턴 수정
  // { "sections": { ... }, "overallReading": { ... } }
  // → { "sections": { ..., "overallReading": { ... } } }
  const SECTION_KEYS = ['basics', 'pillarAnalysis', 'ohengAnalysis', 'sipseongAnalysis',
    'relations', 'daeunReading', 'overallReading'];

  try {
    const obj = JSON.parse(fixed);
    // sections 바깥에 있는 섹션 키를 안으로 이동
    if (obj.sections) {
      for (const key of SECTION_KEYS) {
        if (obj[key] && !obj.sections[key]) {
          obj.sections[key] = obj[key];
          delete obj[key];
        }
      }
      // pillarAnalysis 바깥으로 빠진 month/day/hour도 처리
      if (obj.month || obj.day || obj.hour) {
        if (!obj.sections.pillarAnalysis) obj.sections.pillarAnalysis = {};
        if (obj.month) { obj.sections.pillarAnalysis.month = obj.month; delete obj.month; }
        if (obj.day) { obj.sections.pillarAnalysis.day = obj.day; delete obj.day; }
        if (obj.hour) { obj.sections.pillarAnalysis.hour = obj.hour; delete obj.hour; }
      }
    }
    return JSON.stringify(obj);
  } catch {
    return fixed;
  }
}

/**
 * LLM이 누락한 섹션을 기본값으로 패치.
 * 잘못된 위치에 들어간 필드(예: sections.upcoming)도 올바른 위치로 이동.
 */
function patchMissingSections(parsed: any): any {
  if (!parsed?.sections) return parsed;
  const s = parsed.sections;

  // sections 바깥으로 빠진 키를 안으로 이동
  const SECTION_KEYS = ['basics', 'pillarAnalysis', 'ohengAnalysis', 'sipseongAnalysis',
    'relations', 'daeunReading', 'overallReading'];
  for (const key of SECTION_KEYS) {
    if (parsed[key] && !s[key]) { s[key] = parsed[key]; delete parsed[key]; }
  }
  // pillarAnalysis 하위 키가 바깥으로 빠진 경우
  if (parsed.month || parsed.day || parsed.hour) {
    if (!s.pillarAnalysis) s.pillarAnalysis = {};
    for (const k of ['month', 'day', 'hour']) {
      if (parsed[k] && !s.pillarAnalysis[k]) { s.pillarAnalysis[k] = parsed[k]; delete parsed[k]; }
    }
  }

  // 기본 구조 보장
  if (!s.basics) s.basics = {};
  if (!s.basics.description) s.basics.description = '';

  if (!s.pillarAnalysis) s.pillarAnalysis = {};
  for (const k of ['year', 'month', 'day']) {
    if (!s.pillarAnalysis[k]) s.pillarAnalysis[k] = '';
  }
  if (s.pillarAnalysis.hour === undefined) s.pillarAnalysis.hour = null;

  if (!s.ohengAnalysis) s.ohengAnalysis = {};
  if (!s.ohengAnalysis.distribution) s.ohengAnalysis.distribution = '';
  if (!s.ohengAnalysis.johu) s.ohengAnalysis.johu = '';

  if (!s.sipseongAnalysis) s.sipseongAnalysis = {};
  if (!s.sipseongAnalysis.reading) s.sipseongAnalysis.reading = '';

  if (!s.relations) s.relations = {};
  if (!s.relations.reading) s.relations.reading = '';

  // daeunReading — 누락 또는 upcoming이 밖으로 빠진 경우 복구
  if (!s.daeunReading) {
    s.daeunReading = { overview: '', currentPeriod: '', upcoming: s.upcoming || '' };
    delete s.upcoming;
  } else {
    if (!s.daeunReading.overview) s.daeunReading.overview = '';
    if (!s.daeunReading.currentPeriod) s.daeunReading.currentPeriod = '';
    if (!s.daeunReading.upcoming) {
      s.daeunReading.upcoming = s.upcoming || '';
      delete s.upcoming;
    }
  }

  // overallReading
  if (!s.overallReading) s.overallReading = {};
  if (!s.overallReading.primary) s.overallReading.primary = '';
  if (!s.overallReading.modernApplication) s.overallReading.modernApplication = '';

  // 패치 적용 로그
  console.warn('[Phase2] 누락 섹션 패치 적용됨');

  return parsed;
}

/**
 * max_tokens 도달로 절단된 JSON 복구 시도.
 * 마지막으로 완전히 닫힌 위치까지 잘라내고 중괄호를 보완한다.
 * 복구 불가 시 null 반환.
 */
function repairTruncatedJson(text: string): any | null {
  // 마지막 완전한 문자열 값 뒤에서 절단된 경우: 열린 괄호 수를 세어 닫는다
  let depth = 0;
  let lastValidPos = -1;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '{' || ch === '[') {
      depth++;
    } else if (ch === '}' || ch === ']') {
      depth--;
      if (depth === 0) lastValidPos = i;
    }
  }

  if (depth === 0) return null; // 이미 닫혀 있으면 파싱 실패가 다른 이유

  // depth > 0 : 닫히지 않은 괄호가 있음
  // 마지막 완전한 값 뒤의 trailing comma/불완전 필드를 제거하고 닫기
  // 전략: 마지막 완전한 ': "..."' 또는 ': {...}' 뒤까지 자르고 나머지를 닫는다
  const trimmed = text
    .replace(/,\s*"[^"]*"\s*:\s*"[^"]*$/, '')   // 절단된 마지막 문자열 필드 제거
    .replace(/,\s*"[^"]*"\s*:\s*\{[^}]*$/, '')   // 절단된 마지막 객체 필드 제거
    .replace(/,\s*$/, '');                         // trailing comma 제거

  // 닫아야 할 괄호 계산
  let d = 0;
  const closers: string[] = [];
  const stack: string[] = [];
  let inString = false;
  let escape = false;

  for (const ch of trimmed) {
    if (escape) { escape = false; continue; }
    if (ch === '\\' && inString) { escape = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === '{') stack.push('}');
    else if (ch === '[') stack.push(']');
    else if (ch === '}' || ch === ']') stack.pop();
  }

  const repaired = trimmed + stack.reverse().join('');

  try {
    return JSON.parse(repaired);
  } catch {
    return null;
  }
}

function extractUsage(response: Anthropic.Message): UsageInfo {
  return {
    inputTokens: response.usage?.input_tokens ?? 0,
    outputTokens: response.usage?.output_tokens ?? 0,
    cacheCreationInputTokens: (response.usage as any)?.cache_creation_input_tokens ?? 0,
    cacheReadInputTokens: (response.usage as any)?.cache_read_input_tokens ?? 0,
  };
}
