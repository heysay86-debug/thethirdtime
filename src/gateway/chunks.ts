/**
 * 교안 청크 로더
 *
 * references/rag chunks.json 에서 Phase 2 섹션별 관련 청크를 선택해
 * 프롬프트 주입용 텍스트로 반환한다.
 *
 * 매핑 전략: 섹션 → 관련 챕터 번호 (정적 매핑)
 * 청크 파일이 없으면 빈 문자열 반환 → 파이프라인 영향 없음
 *
 * 향후: references/ 에 자료 추가 시 CHAPTER_MAP 확장만으로 반영 가능.
 * 더 많은 자료가 축적되면 시맨틱 검색(RAG)으로 교체 가능한 구조.
 */

import fs from 'fs';
import path from 'path';

// ── 청크 타입 ──────────────────────────────────────────────────

interface RagChunk {
  id: string;
  chapter: number;
  chapter_title: string;
  sub_chunk: number;
  text: string;
}

// ── 섹션 → 챕터 매핑 ──────────────────────────────────────────
// 키: Phase2Sections 필드명
// 값: 관련 챕터 번호 배열 (우선순위 순)

const SECTION_CHAPTER_MAP: Record<string, number[]> = {
  ohengAnalysis:     [3],      // 음양오행과 적용
  sipseongAnalysis:  [7, 6],   // 십신 심리 특징, 십신 구분
  relations:         [8],      // 육친 구분과 심리
  daeunReading:      [12, 5],  // 운의 심리 변화, 운 작성법
  overallReading:    [10, 13], // 용신 심리 특징, 내방자 심리 구분
};

// ── 설정 ──────────────────────────────────────────────────────

/** 챕터당 주입할 최대 청크 수 */
const MAX_CHUNKS_PER_CHAPTER = 2;

/** 청크당 최대 글자 수 (토큰 예산 관리) */
const MAX_CHARS_PER_CHUNK = 900;

// ── 캐시 ──────────────────────────────────────────────────────

let _cache: RagChunk[] | null = null;

function loadChunks(): RagChunk[] {
  if (_cache) return _cache;

  const chunksPath = path.join(process.cwd(), 'references', 'rag chunks.json');
  if (!fs.existsSync(chunksPath)) return [];

  try {
    _cache = JSON.parse(fs.readFileSync(chunksPath, 'utf-8')) as RagChunk[];
    return _cache;
  } catch {
    return [];
  }
}

// ── 공개 API ──────────────────────────────────────────────────

/**
 * Phase 2 프롬프트에 주입할 교안 참고자료 텍스트를 반환한다.
 *
 * - 각 Phase2 섹션에 대응하는 챕터에서 상위 N개 청크를 선택
 * - 중복 챕터는 한 번만 포함
 * - 파일 없음 / 파싱 오류 시 빈 문자열 반환
 */
export function buildChunkContext(): string {
  const allChunks = loadChunks();
  if (allChunks.length === 0) return '';

  // 수집할 챕터 번호 (중복 제거, 우선순위 순서 유지)
  const seen = new Set<number>();
  const orderedChapters: number[] = [];
  for (const chapters of Object.values(SECTION_CHAPTER_MAP)) {
    for (const ch of chapters) {
      if (!seen.has(ch)) {
        seen.add(ch);
        orderedChapters.push(ch);
      }
    }
  }

  const lines: string[] = [
    '---',
    '[교안 참고자료 — 해석 시 심리·상담 관점 참고용. 원문 직접 인용 금지.]',
  ];

  for (const chapterNum of orderedChapters) {
    const chapterChunks = allChunks
      .filter(c => c.chapter === chapterNum)
      .slice(0, MAX_CHUNKS_PER_CHAPTER);

    if (chapterChunks.length === 0) continue;

    const title = chapterChunks[0].chapter_title;
    lines.push(`\n[Ch${chapterNum}: ${title}]`);

    for (const chunk of chapterChunks) {
      const text = chunk.text.length > MAX_CHARS_PER_CHUNK
        ? chunk.text.slice(0, MAX_CHARS_PER_CHUNK) + '…'
        : chunk.text;
      lines.push(text);
    }
  }

  lines.push('---');
  return lines.join('\n');
}

/**
 * 특정 섹션에 해당하는 챕터 청크만 반환.
 * 섹션별 분리 호출로 전환 시 사용.
 */
export function buildChunkContextForSection(section: keyof typeof SECTION_CHAPTER_MAP): string {
  const allChunks = loadChunks();
  if (allChunks.length === 0) return '';

  const chapters = SECTION_CHAPTER_MAP[section] ?? [];
  if (chapters.length === 0) return '';

  const lines: string[] = ['[교안 참고자료]'];

  for (const chapterNum of chapters) {
    const chapterChunks = allChunks
      .filter(c => c.chapter === chapterNum)
      .slice(0, MAX_CHUNKS_PER_CHAPTER);

    if (chapterChunks.length === 0) continue;

    lines.push(`\n[Ch${chapterNum}: ${chapterChunks[0].chapter_title}]`);
    for (const chunk of chapterChunks) {
      const text = chunk.text.length > MAX_CHARS_PER_CHUNK
        ? chunk.text.slice(0, MAX_CHARS_PER_CHUNK) + '…'
        : chunk.text;
      lines.push(text);
    }
  }

  return lines.join('\n');
}
