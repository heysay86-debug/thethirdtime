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

// ── 설정 ──

const DEFAULT_MODEL = 'claude-haiku-4-5-20251001';
const PHASE1_MAX_TOKENS = 1024;
const PHASE2_MAX_TOKENS = 8192;

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
        { role: 'user', content: JSON.stringify(sajuResult) },
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
    const userMessage = [
      JSON.stringify(sajuResult),
      '',
      '--- Phase 1 핵심 판단 (이미 제공됨, 중복 서술 금지) ---',
      `summary: ${phase1Result.summary}`,
      `신강약: ${phase1Result.strengthReading}`,
      `격국: ${phase1Result.gyeokGukReading}`,
      `용신: ${phase1Result.yongSinReading}`,
      '',
      '위 핵심 판단은 이미 사용자에게 제공되었습니다.',
      '아래 JSON 구조로 나머지 섹션만 작성하십시오:',
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

    // 마크다운 코드블록 제거 (만약 모델이 감쌌을 경우 방어)
    const jsonText = finalText.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '').trim();

    let parsed: any;
    try {
      parsed = JSON.parse(jsonText);
    } catch (e) {
      throw new Error(`Phase 2: JSON 파싱 실패 — ${(e as Error).message}\n응답: ${jsonText.slice(0, 200)}`);
    }

    // Zod 검증
    const validated = Phase2ResultSchema.parse(parsed);

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

function extractUsage(response: Anthropic.Message): UsageInfo {
  return {
    inputTokens: response.usage?.input_tokens ?? 0,
    outputTokens: response.usage?.output_tokens ?? 0,
    cacheCreationInputTokens: (response.usage as any)?.cache_creation_input_tokens ?? 0,
    cacheReadInputTokens: (response.usage as any)?.cache_read_input_tokens ?? 0,
  };
}
