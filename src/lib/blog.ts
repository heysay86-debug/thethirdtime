/**
 * 마크다운 블로그 — content/blog/*.md 파일 기반
 *
 * 프론트매터:
 *   title: 글 제목
 *   date: YYYY-MM-DD
 *   summary: 한 줄 요약
 *   tags: [태그1, 태그2]
 */

import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const BLOG_DIR = path.join(process.cwd(), 'content', 'blog');

export interface BlogPost {
  slug: string;
  title: string;
  date: string;
  summary: string;
  tags: string[];
  content: string; // 마크다운 본문
}

export function getAllPosts(): BlogPost[] {
  if (!fs.existsSync(BLOG_DIR)) return [];

  const files = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.md') && !f.startsWith('CONTENT-') && !f.startsWith('README'));

  const posts = files.map(file => {
    const raw = fs.readFileSync(path.join(BLOG_DIR, file), 'utf-8');
    const { data, content } = matter(raw);
    const dateVal = data.date instanceof Date
      ? data.date.toISOString().slice(0, 10)
      : String(data.date || '2026-01-01');
    return {
      slug: file.replace(/\.md$/, ''),
      title: data.title || '제목 없음',
      date: dateVal,
      summary: data.summary || '',
      tags: data.tags || [],
      content,
    };
  });

  // 최신순 정렬
  posts.sort((a, b) => b.date.localeCompare(a.date));
  return posts;
}

export function getPost(slug: string): BlogPost | null {
  const filePath = path.join(BLOG_DIR, `${slug}.md`);
  if (!fs.existsSync(filePath)) return null;

  const raw = fs.readFileSync(filePath, 'utf-8');
  const { data, content } = matter(raw);
  const dateVal = data.date instanceof Date
    ? data.date.toISOString().slice(0, 10)
    : String(data.date || '2026-01-01');
  return {
    slug,
    title: data.title || '제목 없음',
    date: dateVal,
    summary: data.summary || '',
    tags: data.tags || [],
    content,
  };
}
