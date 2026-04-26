/**
 * 블로그 글 → RAG 청크 변환 스크립트
 *
 * content/blog/*.md → references/blog-chunks.json
 * 각 ## 섹션을 하나의 청크로 분할
 *
 * 실행: npx tsx scripts/build-blog-chunks.ts
 */

import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const BLOG_DIR = path.join(process.cwd(), 'content', 'blog');
const OUTPUT = path.join(process.cwd(), 'references', 'blog-chunks.json');

// 리포트 품질에 직접 기여하는 글만 청크화
const INCLUDE_TAGS = new Set([
  '일간', '오행', '십성', '십이운성', '왕상휴수사',
  '합', '충', '형', '대운', '세운',
  '비겁', '식상', '재성', '관성', '인성',
]);

interface BlogChunk {
  id: string;
  source: string;    // 파일명
  title: string;
  section: string;   // ## 소제목
  tags: string[];
  text: string;
}

function shouldInclude(tags: string[]): boolean {
  return tags.some(t => INCLUDE_TAGS.has(t));
}

function splitIntoSections(content: string): { section: string; text: string }[] {
  const sections: { section: string; text: string }[] = [];
  const parts = content.split(/^## /gm);

  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    const firstNewline = trimmed.indexOf('\n');
    if (firstNewline === -1) continue;

    const section = trimmed.slice(0, firstNewline).trim();
    const text = trimmed.slice(firstNewline + 1).trim();

    if (text.length > 50) {
      sections.push({ section, text });
    }
  }

  return sections;
}

// 실행
const files = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.md') && !f.startsWith('CONTENT-') && !f.startsWith('README'));
const chunks: BlogChunk[] = [];

for (const file of files) {
  const raw = fs.readFileSync(path.join(BLOG_DIR, file), 'utf-8');
  const { data, content } = matter(raw);
  const tags: string[] = data.tags || [];

  if (!shouldInclude(tags)) continue;

  const sections = splitIntoSections(content);
  const slug = file.replace(/\.md$/, '');

  for (let i = 0; i < sections.length; i++) {
    chunks.push({
      id: `blog-${slug}-${i}`,
      source: file,
      title: data.title || slug,
      section: sections[i].section,
      tags,
      text: sections[i].text,
    });
  }
}

// 저장
if (!fs.existsSync(path.dirname(OUTPUT))) {
  fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
}
fs.writeFileSync(OUTPUT, JSON.stringify(chunks, null, 2));

console.log(`${chunks.length} chunks from ${files.length} posts → ${OUTPUT}`);
