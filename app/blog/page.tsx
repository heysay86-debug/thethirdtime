'use client';

import { useState, useEffect } from 'react';

interface PostSummary {
  slug: string;
  title: string;
  date: string;
  summary: string;
  tags: string[];
}

// ─── 분류 체계 (tags 기반 자동 매핑) ───────────────────────
// 추가/변경 시 이 테이블만 수정하면 됨

interface BookDef {
  id: string;
  title: string;
  color: string;       // 책 표지 색상
  textColor: string;   // 표지 글씨 색상
  matchTags: string[];  // 이 태그 중 하나라도 포함하면 이 책에 분류
}

const BOOKS: BookDef[] = [
  {
    id: 'basics',
    title: '사주\n기초',
    color: '#3c4859',
    textColor: '#f0dfad',
    matchTags: ['사주', '합', '충', '형', '천간', '지지', '대운', '세운'],
  },
  {
    id: 'sipsung',
    title: '십성\n이야기',
    color: '#6b3a3a',
    textColor: '#f0dfad',
    matchTags: ['십성', '비겁', '식상', '재성', '인성', '관성'],
  },
  {
    id: 'oheng',
    title: '오행과\n일간',
    color: '#3a5c3a',
    textColor: '#f0dfad',
    matchTags: ['오행', '일간', '왕상휴수사', '십이운성'],
  },
  {
    id: 'yukyo',
    title: '육효점',
    color: '#4a3a5c',
    textColor: '#f0dfad',
    matchTags: ['육효'],
  },
];

function classifyPost(post: PostSummary): string | null {
  for (const book of BOOKS) {
    if (post.tags.some(tag => book.matchTags.includes(tag))) {
      return book.id;
    }
  }
  return null;
}

// ─── 책 컴포넌트 ────────────────────────────────────────────

function Book({ book, count, onClick }: {
  book: BookDef;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', flexDirection: 'column',
        width: 56, minHeight: 80,
        background: book.color,
        border: 'none',
        borderRadius: '3px 6px 6px 3px',
        borderLeft: '4px solid rgba(0,0,0,0.3)',
        padding: '8px 4px',
        cursor: 'pointer',
        boxShadow: '2px 2px 8px rgba(0,0,0,0.4), inset -1px 0 0 rgba(255,255,255,0.1)',
        position: 'relative',
        transition: 'transform 0.15s',
      }}
      onPointerDown={e => { e.currentTarget.style.transform = 'scale(0.95)'; e.currentTarget.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.3)'; }}
      onPointerUp={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '2px 2px 8px rgba(0,0,0,0.4), inset -1px 0 0 rgba(255,255,255,0.1)'; }}
      onPointerLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '2px 2px 8px rgba(0,0,0,0.4), inset -1px 0 0 rgba(255,255,255,0.1)'; }}
    >
      <div style={{
        fontSize: 10, fontWeight: 700, color: book.textColor,
        writingMode: 'vertical-rl',
        textOrientation: 'mixed',
        flex: 1,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        whiteSpace: 'pre-line', lineHeight: 1.3, letterSpacing: 1,
      }}>
        {book.title}
      </div>
      <div style={{
        fontSize: 8, color: 'rgba(255,255,255,0.5)',
        textAlign: 'center', marginTop: 4,
      }}>
        {count}편
      </div>
    </button>
  );
}

// ─── 펼쳐진 책 (글 목록) ────────────────────────────────────

function OpenBook({ book, posts, onClose }: {
  book: BookDef;
  posts: PostSummary[];
  onClose: () => void;
}) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.7)',
    }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        width: '90%', maxWidth: 400, maxHeight: '80vh',
        background: '#f5f0e1',
        borderRadius: '4px 16px 16px 4px',
        borderLeft: `8px solid ${book.color}`,
        padding: '24px 20px',
        overflowY: 'auto',
        position: 'relative',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      }}>
        {/* 닫기 */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: 12, right: 12,
            background: 'none', border: 'none', color: '#8a7a60',
            fontSize: 20, cursor: 'pointer',
          }}
        >✕</button>

        {/* 책 제목 */}
        <div style={{
          fontSize: 18, fontWeight: 700, color: '#3a2e1e',
          marginBottom: 4,
        }}>
          {book.title.replace('\n', ' ')}
        </div>
        <div style={{ fontSize: 11, color: '#8a7a60', marginBottom: 16 }}>
          {posts.length}편의 글
        </div>

        {/* 글 목록 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {posts.map(post => (
            <a
              key={post.slug}
              href={`/blog/${post.slug}`}
              target="_top"
              style={{ textDecoration: 'none' }}
            >
              <div style={{
                padding: '12px 14px',
                background: 'rgba(139,115,85,0.06)',
                border: '1px solid rgba(139,115,85,0.12)',
                borderRadius: 8,
                cursor: 'pointer',
                transition: 'background 0.15s',
              }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(139,115,85,0.12)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(139,115,85,0.06)'; }}
              >
                <div style={{ fontSize: 13, fontWeight: 600, color: '#3a2e1e', lineHeight: 1.5 }}>
                  {post.title}
                </div>
                {post.summary && (
                  <div style={{ fontSize: 11, color: '#8a7a60', marginTop: 4, lineHeight: 1.5 }}>
                    {post.summary}
                  </div>
                )}
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── 메인 페이지 ────────────────────────────────────────────

export default function BlogListPage() {
  const [posts, setPosts] = useState<PostSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [openBookId, setOpenBookId] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/blog')
      .then(r => r.json())
      .then(d => setPosts((d.posts || []).filter((p: PostSummary) => p.title !== '글 제목 (한국어)')))
      .finally(() => setLoading(false));
  }, []);

  // tags 기반 자동 분류
  const bookPosts: Record<string, PostSummary[]> = {};
  for (const book of BOOKS) {
    bookPosts[book.id] = [];
  }
  for (const post of posts) {
    const bookId = classifyPost(post);
    if (bookId && bookPosts[bookId]) {
      bookPosts[bookId].push(post);
    }
  }

  const openBook = BOOKS.find(b => b.id === openBookId);

  return (
    <div style={{
      minHeight: '100vh',
      background: '#1a1e24',
      color: '#dde1e5',
      fontFamily: '"Pretendard Variable", sans-serif',
      position: 'relative',
    }}>
      {/* 배경 */}
      <div style={{
        position: 'fixed', inset: 0,
        display: 'flex', justifyContent: 'center',
      }}>
        <img
          src="/background/bookshelf.jpeg"
          alt=""
          style={{
            height: '100%', width: '100%',
            maxWidth: 440,
            objectFit: 'cover',
            opacity: 0.85,
          }}
        />
      </div>

      <div style={{
        position: 'relative', zIndex: 10,
        maxWidth: 440, margin: '0 auto',
        padding: '0 20px',
        minHeight: '100vh',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* 헤더 */}
        <div style={{
          padding: '20px 0 12px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <img src="/icon/logo.svg" alt="제3의시간" style={{ height: 20, opacity: 0.7 }} />
            <span style={{
              fontSize: 16, color: '#f0dfad', letterSpacing: 1, fontWeight: 600,
              fontFamily: '"Gaegu", cursive',
            }}>
              복길의 서고
            </span>
          </div>
          <a href="/" target="_top" style={{ fontSize: 12, color: '#a89070', textDecoration: 'none' }}>
            메인으로
          </a>
        </div>

        {/* 복길 안내 */}
        <div style={{
          padding: '12px 16px', marginBottom: 16,
          background: 'rgba(26,30,36,0.8)',
          border: '1px solid rgba(240,223,173,0.15)',
          borderRadius: 10,
        }}>
          <div style={{
            fontSize: 14, lineHeight: 1.7, color: '#ccc',
            fontFamily: '"Gaegu", cursive',
          }}>
            궁금한 것이 있다면 책을 꺼내보게.{'\n'}
            내가 알고 있는 것들을 적어두었네.
          </div>
          <div style={{ fontSize: 10, color: '#667', marginTop: 4 }}>— 복길</div>
        </div>

        {/* 책장 — 고정 위치 */}
        <div style={{
          position: 'fixed',
          top: 'calc(50% - 19px)',
          left: '50%',
          transform: 'translate(calc(-50% + 23px), -50%)',
          zIndex: 15,
          maxWidth: 400,
          width: '80%',
        }}>
          {loading ? (
            <div style={{ textAlign: 'center', color: '#889' }}>불러오는 중...</div>
          ) : (
            <div style={{
              display: 'flex', justifyContent: 'center',
              gap: 12, flexWrap: 'wrap',
              padding: '20px 10px',
            }}>
              {BOOKS.map(book => (
                <Book
                  key={book.id}
                  book={book}
                  count={bookPosts[book.id]?.length || 0}
                  onClick={() => setOpenBookId(book.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* 하단 */}
        <div style={{
          textAlign: 'center', padding: '16px 0 32px',
        }}>
          <a href="/" target="_top" style={{
            fontSize: 12, color: '#a89070', textDecoration: 'none',
            padding: '8px 20px',
            border: '1px solid rgba(240,223,173,0.2)',
            borderRadius: 16,
          }}>
            ← 메인으로 돌아가기
          </a>
        </div>
      </div>

      {/* 펼쳐진 책 모달 */}
      {openBook && bookPosts[openBook.id] && (
        <OpenBook
          book={openBook}
          posts={bookPosts[openBook.id]}
          onClose={() => setOpenBookId(null)}
        />
      )}

    </div>
  );
}
