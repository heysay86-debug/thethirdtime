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

class Phase2ContentError extends Error {
  constructor(public emptyKeys: string[], public partial: any) {
    super(`Phase 2 핵심 섹션 누락: ${emptyKeys.join(', ')}`);
  }
}

import Anthropic from '@anthropic-ai/sdk';
import { SAJU_SYSTEM_PROMPT, SAJU_SYSTEM_PROMPT_PHASE2 } from './prompts/system';
import { sajuCoreTool } from './tools/saju_core';
import { sajuInterpretationTool } from './tools/saju_interpretation';
import { Phase2ResultSchema } from './prompts/schema';
import { SajuResult } from '../engine/schema';
import { buildChunkContext } from './chunks';

// ── 설정 ──

const DEFAULT_MODEL = 'claude-haiku-4-5-20251001';
const PHASE2_MODEL = 'claude-sonnet-4-5-20250929';
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
  pillarAnalysis?: { year: string; month: string; day: string; hour: string | null };
  ohengAnalysis: { distribution: string; johu: string; perspectives?: any[] };
  sipseongAnalysis: { reading: string; perspectives?: any[] };
  relations: { reading: string };
  daeunReading: { overview: string; currentPeriod: string; upcoming: string } | null;
  overallReading: { primary: string; modernApplication: string; advice?: string; perspectives?: any[] };
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
   * Phase 2 — 전체 해석 (재시도 포함)
   * 핵심 섹션 누락 시 최대 1회 재시도.
   */
  async analyzePhase2(
    sajuResult: SajuResult,
    phase1Result: CoreJudgment,
    onChunk?: (text: string) => void,
    userInterest?: string,
    userQuestion?: string,
  ): Promise<Phase2Response> {
    const MAX_RETRIES = 1;
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        return await this._analyzePhase2(sajuResult, phase1Result, onChunk, userInterest, userQuestion);
      } catch (e) {
        if (e instanceof Phase2ContentError && attempt < MAX_RETRIES) {
          console.warn(`[Phase2] 재시도 ${attempt + 1}/${MAX_RETRIES} — 누락: ${e.emptyKeys.join(', ')}`);
          continue;
        }
        throw e;
      }
    }
    throw new Error('Phase 2: 재시도 초과');
  }

  private async _analyzePhase2(
    sajuResult: SajuResult,
    phase1Result: CoreJudgment,
    onChunk?: (text: string) => void,
    userInterest?: string,
    userQuestion?: string,
  ): Promise<Phase2Response> {
    const start = Date.now();

    const hasDaeun = sajuResult.daeun !== null;
    const chunkContext = buildChunkContext();

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
      'submit_saju_interpretation 도구를 호출하여 결과를 제출하십시오. pillarAnalysis는 제외(별도 처리).',
      '',
      hasDaeun
        ? `대운 데이터 포함(${sajuResult.daeun!.periods.length}개 대운, ${sajuResult.seun.length}개 세운). daeunReading을 반드시 object로 작성.`
        : '대운 데이터 없음. daeunReading은 null.',
      '',
      // 유저 관심사 + 질문
      ...(userInterest || userQuestion ? [
        '--- 사용자 관심 영역 ---',
        userInterest ? `관심 분야: ${userInterest}` : '',
        userQuestion ? `구체적 질문: ${userQuestion}` : '',
        '위 관심사와 질문을 반영하여 overallReading.advice에 600자 내외의 종합제언을 작성하십시오.',
        '종합제언은 사주 분석 내용을 바탕으로 사용자의 구체적 질문에 답하는 맞춤형 조언입니다.',
      ] : []),
    ].join('\n');

    // Tool use — API가 JSON 구조를 강제 (Sonnet으로 안정성 확보)
    const response = await this.client.messages.create({
      model: PHASE2_MODEL,
      max_tokens: PHASE2_MAX_TOKENS,
      system: [
        {
          type: 'text',
          text: SAJU_SYSTEM_PROMPT_PHASE2,
          cache_control: { type: 'ephemeral' },
        },
      ],
      tools: [
        {
          ...sajuInterpretationTool,
          cache_control: { type: 'ephemeral' },
        } as any,
      ],
      tool_choice: { type: 'tool', name: 'submit_saju_interpretation' },
      messages: [
        { role: 'user', content: userMessage },
      ],
    });

    const elapsedMs = Date.now() - start;
    const usage = extractUsage(response);
    this.logPhase('Phase2', usage, elapsedMs);

    // tool_use 블록에서 구조화된 JSON 추출 — 파싱 불필요
    const toolBlock = response.content.find(
      (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use',
    );
    if (!toolBlock || toolBlock.name !== 'submit_saju_interpretation') {
      throw new Error('Phase 2: tool_use 블록 없음');
    }

    let parsed = toolBlock.input as any;
    // tool_use input이 문자열로 올 경우 파싱
    if (typeof parsed === 'string') {
      try { parsed = JSON.parse(parsed); } catch {
        throw new Error('Phase 2: tool input 파싱 실패');
      }
    }

    // sections 구조 정규화
    if (!parsed.sections && (parsed.basics || parsed.ohengAnalysis)) {
      // 래퍼 없이 직접 필드가 온 경우
      parsed = { sections: parsed };
    } else if (parsed.sections?.sections && !parsed.sections.basics) {
      // 이중 래핑: { sections: { sections: { ... } } }
      parsed.sections = parsed.sections.sections;
    }

    console.log('[Phase2] 반환 키:', JSON.stringify(Object.keys(parsed.sections || {})));

    // Zod 검증
    const patched = patchMissingSections(parsed);
    const validated = Phase2ResultSchema.parse(patched);

    const sec = validated.sections as Phase2Sections;
    const emptyKeys: string[] = [];
    if (!sec.ohengAnalysis?.distribution && !sec.ohengAnalysis?.johu) emptyKeys.push('ohengAnalysis');
    if (!sec.sipseongAnalysis?.reading) emptyKeys.push('sipseongAnalysis');
    if (!sec.daeunReading?.overview && !sec.daeunReading?.currentPeriod) emptyKeys.push('daeunReading');
    if (!sec.overallReading?.primary) emptyKeys.push('overallReading');

    if (emptyKeys.length >= 2) {
      console.warn(`[Phase2] 핵심 섹션 다수 누락: ${emptyKeys.join(', ')}`);
      throw new Phase2ContentError(emptyKeys, sec);
    } else if (emptyKeys.length === 1) {
      console.warn(`[Phase2] 경미한 누락(진행): ${emptyKeys[0]}`);
    }

    return {
      sections: sec,
      usage,
      elapsedMs,
      timeToFirstTokenMs: 0,
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
 * Phase 2 JSON 로버스트 파서.
 * LLM이 만드는 모든 종류의 JSON 오류를 순차적으로 복구:
 * 1) 직접 파싱
 * 2) 문자열 내 줄바꿈 수정 후 파싱
 * 3) sections 바깥 키 병합 (첫 JSON + 나머지 JSON 추출·병합)
 * 4) 절단 복구
 */
function robustParsePhase2(rawText: string): any {
  // Step 1: 직접 파싱
  try { return JSON.parse(rawText); } catch {}

  // Step 2: 줄바꿈 수정 후 파싱
  const nlFixed = fixNewlinesInJsonStrings(rawText);
  try { return JSON.parse(nlFixed); } catch {}

  // Step 3: 첫 번째 완전한 JSON 객체 추출 + 나머지 병합
  const firstJson = extractFirstJsonObject(nlFixed);
  const remainder = nlFixed.slice(firstJson.length).trim();

  let mainObj: any = null;
  try {
    mainObj = JSON.parse(firstJson);
  } catch {
    // 첫 JSON도 파싱 불가 → 절단 복구 시도
    const repaired = repairTruncatedJson(firstJson);
    if (repaired) {
      console.warn('[Phase2] 첫 JSON 절단 복구 성공');
      mainObj = repaired;
    }
  }

  if (!mainObj) {
    throw new Error(`Phase 2: JSON 파싱 실패\n응답: ${rawText.slice(0, 500)}`);
  }

  // 나머지 텍스트에서 추가 키-값 추출하여 sections에 병합
  if (remainder.length > 2) {
    console.warn('[Phase2] sections 바깥 데이터 발견, 병합 시도 (길이:', remainder.length, ')');
    // 나머지가 , "key": ... 형태면 {} 로 감싸서 파싱
    let restText = remainder.startsWith(',') ? remainder.slice(1).trim() : remainder;
    if (!restText.startsWith('{')) restText = '{ ' + restText;
    // 닫는 괄호 보장
    const restFixed = fixNewlinesInJsonStrings(restText);
    let restObj: any = null;
    try {
      restObj = JSON.parse(restFixed);
    } catch {
      const repaired = repairTruncatedJson(restFixed);
      if (repaired) restObj = repaired;
    }
    if (restObj) {
      // restObj의 키를 mainObj.sections로 이동
      if (!mainObj.sections) mainObj.sections = {};
      const SECTION_KEYS = ['basics', 'pillarAnalysis', 'ohengAnalysis', 'sipseongAnalysis',
        'relations', 'daeunReading', 'overallReading'];
      for (const key of Object.keys(restObj)) {
        if (SECTION_KEYS.includes(key) && !mainObj.sections[key]) {
          mainObj.sections[key] = restObj[key];
        } else if (key === 'sections' && typeof restObj[key] === 'object') {
          Object.assign(mainObj.sections, restObj[key]);
        }
      }
      // pillarAnalysis 하위 키
      const PA_KEYS = ['year', 'month', 'day', 'hour'];
      for (const pk of PA_KEYS) {
        if (restObj[pk] && typeof restObj[pk] === 'string') {
          if (!mainObj.sections.pillarAnalysis) mainObj.sections.pillarAnalysis = {};
          if (!mainObj.sections.pillarAnalysis[pk]) {
            mainObj.sections.pillarAnalysis[pk] = restObj[pk];
          }
        }
      }
      console.warn('[Phase2] 병합 완료');
    }
  }

  return mainObj;
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
  // 기본 구조 보장
  if (!s.basics) s.basics = {};
  if (!s.basics.description) s.basics.description = '';

  // pillarAnalysis — LLM이 보내면 유지, 안 보내도 무방 (키워드 테이블로 대체)

  // ohengAnalysis — johu가 바깥으로 빠진 경우 복구
  if (!s.ohengAnalysis) s.ohengAnalysis = {};
  if (!s.ohengAnalysis.distribution) s.ohengAnalysis.distribution = '';
  if (s.johu) { s.ohengAnalysis.johu = typeof s.johu === 'string' ? s.johu : (s.johu?.reading ?? ''); delete s.johu; }
  if (!s.ohengAnalysis.johu) s.ohengAnalysis.johu = '';

  if (!s.sipseongAnalysis) s.sipseongAnalysis = {};
  if (!s.sipseongAnalysis.reading) {
    // description 키로 들어온 경우 복구
    s.sipseongAnalysis.reading = s.sipseongAnalysis.description ?? '';
    delete s.sipseongAnalysis.description;
  }

  if (!s.relations) s.relations = {};
  if (!s.relations.reading) {
    s.relations.reading = s.relations.description ?? '';
    delete s.relations.description;
  }

  // daeunReading — 하위키(currentPeriod, upcoming, overview)가 바깥으로 빠진 경우 복구
  if (!s.daeunReading) s.daeunReading = {};
  const DR_KEYS = ['overview', 'currentPeriod', 'upcoming'];
  for (const dk of DR_KEYS) {
    if (s[dk] && !s.daeunReading[dk]) {
      s.daeunReading[dk] = typeof s[dk] === 'string' ? s[dk] : (s[dk]?.reading ?? '');
      delete s[dk];
    }
    if (!s.daeunReading[dk]) s.daeunReading[dk] = '';
  }

  // overallReading — 하위키(primary, modernApplication)가 바깥으로 빠진 경우 복구
  if (!s.overallReading) s.overallReading = {};
  const OR_KEYS = ['primary', 'modernApplication'];
  for (const ok of OR_KEYS) {
    if (s[ok] && !s.overallReading[ok]) {
      s.overallReading[ok] = typeof s[ok] === 'string' ? s[ok] : (s[ok]?.reading ?? s[ok]?.description ?? '');
      delete s[ok];
    }
    if (!s.overallReading[ok]) s.overallReading[ok] = '';
  }
  // overallReading이 { reading: "..." } 형태로 온 경우 → primary로 이동
  if (s.overallReading.reading && !s.overallReading.primary) {
    s.overallReading.primary = s.overallReading.reading;
    delete s.overallReading.reading;
  }

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
  // 1단계: fixNewlines 후에도 열린 문자열이 있으면 닫고, 괄호도 닫는 전략
  // 먼저 현재 상태 파악
  let inString = false;
  let escape = false;
  const stack: string[] = [];

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (escape) { escape = false; continue; }
    if (ch === '\\' && inString) { escape = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === '{') stack.push('}');
    else if (ch === '[') stack.push(']');
    else if (ch === '}' || ch === ']') stack.pop();
  }

  if (stack.length === 0 && !inString) return null; // 이미 닫혀 있으면 파싱 실패가 다른 이유

  // 2단계: 열린 문자열이 있으면 닫기
  let repaired = text;
  if (inString) {
    repaired += '"';
  }

  // 3단계: trailing comma/미완성 키 제거 후 괄호 닫기
  // 미완성 키 패턴: , "key": (값 없이 끝남) 또는 , "key" (콜론 없이)
  repaired = repaired
    .replace(/,\s*"[^"]*"\s*:\s*$/, '')  // , "key":  (값 시작 전 절단)
    .replace(/,\s*"[^"]*"\s*$/, '')      // , "key"  (콜론 전 절단)
    .replace(/,\s*$/, '');                // trailing comma

  // 4단계: 괄호 재계산 후 닫기
  const closeStack: string[] = [];
  let inStr2 = false;
  let esc2 = false;
  for (const ch of repaired) {
    if (esc2) { esc2 = false; continue; }
    if (ch === '\\' && inStr2) { esc2 = true; continue; }
    if (ch === '"') { inStr2 = !inStr2; continue; }
    if (inStr2) continue;
    if (ch === '{') closeStack.push('}');
    else if (ch === '[') closeStack.push(']');
    else if (ch === '}' || ch === ']') closeStack.pop();
  }

  repaired += closeStack.reverse().join('');

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
