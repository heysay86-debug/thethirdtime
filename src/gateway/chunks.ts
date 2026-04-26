/**
 * RAG 청크 로더 — 사주 데이터 기반 선별 주입
 *
 * 두 가지 소스:
 *   1. references/rag chunks.json (교안 94청크)
 *   2. references/blog-chunks.json (블로그 97청크)
 *
 * 매핑 전략:
 *   - 교안: 섹션 → 챕터 번호 (정적 매핑, 기존)
 *   - 블로그: 사주 입력값(일간, 격국, 용신)에 맞는 태그만 선별
 *
 * lost in the middle 방지:
 *   - 교안: 섹션당 최대 2청크
 *   - 블로그: 사주 맞춤 최대 4청크 (일간1 + 십성1 + 기타2)
 *   - 총 청크 글자 제한: ~6,000자 (~3,000토큰)
 */

import fs from 'fs';
import path from 'path';

// ── 타입 ──

interface RagChunk {
  id: string;
  chapter: number;
  chapter_title: string;
  sub_chunk: number;
  text: string;
}

interface BlogChunk {
  id: string;
  source: string;
  title: string;
  section: string;
  tags: string[];
  text: string;
}

/** 사주 컨텍스트 — 청크 선별용 */
export interface SajuContext {
  dayGan: string;         // 일간 (甲~癸)
  gyeokGukType: string;   // 격국 (식신격, 편관격...)
  yongSinElement: string;  // 용신 오행 (木火土金水)
  strengthLevel: string;   // 신강/신약/중화
}

// ── 교안 섹션 → 챕터 매핑 ──

const SECTION_CHAPTER_MAP: Record<string, number[]> = {
  ohengAnalysis:     [3],
  sipseongAnalysis:  [7, 6],
  relations:         [8],
  daeunReading:      [12, 5],
  overallReading:    [10, 13],
};

// ── 일간 → 블로그 파일 매핑 ──

const ILGAN_SLUG_MAP: Record<string, string> = {
  '甲': 'ilgan-gap', '乙': 'ilgan-eul', '丙': 'ilgan-byeong', '丁': 'ilgan-jeong',
  '戊': 'ilgan-mu', '己': 'ilgan-gi', '庚': 'ilgan-gyeong', '辛': 'ilgan-sin',
  '壬': 'ilgan-im', '癸': 'ilgan-gye',
};

// ── 격국 → 십성 태그 매핑 ──

const GYEOKGUK_TAG_MAP: Record<string, string> = {
  '식신격': '식상', '상관격': '식상',
  '편재격': '재성', '정재격': '재성',
  '편관격': '관성', '정관격': '관성',
  '편인격': '인성', '정인격': '인성',
  '건록격': '비겁', '양인격': '비겁',
};

// ── 설정 ──

const MAX_CHUNKS_PER_CHAPTER = 2;
const MAX_CHARS_PER_CHUNK = 900;
const TOTAL_CHAR_BUDGET = 6000; // 전체 주입 글자 제한

// ── 캐시 ──

let _cache: RagChunk[] | null = null;
let _blogCache: BlogChunk[] | null = null;

function loadChunks(): RagChunk[] {
  if (_cache) return _cache;
  const p = path.join(process.cwd(), 'references', 'rag chunks.json');
  if (!fs.existsSync(p)) return [];
  try { _cache = JSON.parse(fs.readFileSync(p, 'utf-8')); return _cache!; } catch { return []; }
}

function loadBlogChunks(): BlogChunk[] {
  if (_blogCache) return _blogCache;
  const p = path.join(process.cwd(), 'references', 'blog-chunks.json');
  if (!fs.existsSync(p)) return [];
  try { _blogCache = JSON.parse(fs.readFileSync(p, 'utf-8')); return _blogCache!; } catch { return []; }
}

function truncate(text: string): string {
  return text.length > MAX_CHARS_PER_CHUNK ? text.slice(0, MAX_CHARS_PER_CHUNK) + '…' : text;
}

// ── 공개 API ──

/**
 * 사주 데이터에 맞춘 청크 컨텍스트 생성
 * context가 없으면 기존 전체 주입 (하위 호환)
 */
export function buildChunkContext(context?: SajuContext): string {
  const allChunks = loadChunks();
  const blogChunks = loadBlogChunks();
  const lines: string[] = [];
  let totalChars = 0;

  function addLine(line: string) {
    if (totalChars + line.length > TOTAL_CHAR_BUDGET) return false;
    lines.push(line);
    totalChars += line.length;
    return true;
  }

  // 1. 교안 청크 (섹션별 최대 2개)
  addLine('---');
  addLine('[교안 참고자료 — 해석 시 심리·상담 관점 참고. 원문 직접 인용 금지.]');

  const seen = new Set<number>();
  const orderedChapters: number[] = [];
  for (const chapters of Object.values(SECTION_CHAPTER_MAP)) {
    for (const ch of chapters) {
      if (!seen.has(ch)) { seen.add(ch); orderedChapters.push(ch); }
    }
  }

  for (const chapterNum of orderedChapters) {
    const chapterChunks = allChunks.filter(c => c.chapter === chapterNum).slice(0, MAX_CHUNKS_PER_CHAPTER);
    if (chapterChunks.length === 0) continue;
    if (!addLine(`\n[Ch${chapterNum}: ${chapterChunks[0].chapter_title}]`)) break;
    for (const chunk of chapterChunks) {
      if (!addLine(truncate(chunk.text))) break;
    }
  }

  // 2. 블로그 청크 (사주 맞춤 선별)
  if (blogChunks.length > 0 && context) {
    const selectedBlog: BlogChunk[] = [];

    // 일간 맞춤 (최대 1청크, 첫 섹션)
    const ilganSlug = ILGAN_SLUG_MAP[context.dayGan];
    if (ilganSlug) {
      const match = blogChunks.find(c => c.source === `${ilganSlug}.md`);
      if (match) selectedBlog.push(match);
    }

    // 격국에 해당하는 십성 글 (최대 1청크)
    const sipsinTag = GYEOKGUK_TAG_MAP[context.gyeokGukType];
    if (sipsinTag) {
      const match = blogChunks.find(c => c.tags.includes(sipsinTag) && !selectedBlog.some(s => s.id === c.id));
      if (match) selectedBlog.push(match);
    }

    // 신강약에 따라 왕상휴수사 또는 오행 글 (최대 1청크)
    if (context.strengthLevel !== '중화') {
      const match = blogChunks.find(c => c.tags.includes('왕상휴수사'));
      if (match && !selectedBlog.some(s => s.id === match.id)) selectedBlog.push(match);
    }

    // 십이운성 (최대 1청크)
    const stageChunk = blogChunks.find(c => c.tags.includes('십이운성'));
    if (stageChunk && !selectedBlog.some(s => s.id === stageChunk.id)) selectedBlog.push(stageChunk);

    if (selectedBlog.length > 0) {
      addLine('\n[블로그 참고자료 — 해석 풍부화 용도. 원문 직접 인용 금지.]');
      for (const chunk of selectedBlog) {
        if (!addLine(`[${chunk.title} — ${chunk.section}]`)) break;
        if (!addLine(truncate(chunk.text))) break;
      }
    }
  } else if (blogChunks.length > 0) {
    // context 없으면 블로그는 주입하지 않음 (하위 호환)
  }

  addLine('---');
  return lines.join('\n');
}

/**
 * 특정 섹션에 해당하는 교안 청크만 반환 (섹션별 분리 호출 시 사용)
 */
export function buildChunkContextForSection(section: keyof typeof SECTION_CHAPTER_MAP): string {
  const allChunks = loadChunks();
  if (allChunks.length === 0) return '';

  const chapters = SECTION_CHAPTER_MAP[section] ?? [];
  if (chapters.length === 0) return '';

  const lines: string[] = ['[교안 참고자료]'];
  for (const chapterNum of chapters) {
    const chapterChunks = allChunks.filter(c => c.chapter === chapterNum).slice(0, MAX_CHUNKS_PER_CHAPTER);
    if (chapterChunks.length === 0) continue;
    lines.push(`\n[Ch${chapterNum}: ${chapterChunks[0].chapter_title}]`);
    for (const chunk of chapterChunks) lines.push(truncate(chunk.text));
  }
  return lines.join('\n');
}
