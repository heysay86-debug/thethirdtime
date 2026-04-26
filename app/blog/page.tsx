'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface PostSummary {
  slug: string;
  title: string;
  date: string;
  summary: string;
  tags: string[];
}

const PER_PAGE = 10;

export default function BlogListPage() {
  const [posts, setPosts] = useState<PostSummary[]>([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/blog')
      .then(r => r.json())
      .then(d => setPosts(d.posts || []))
      .finally(() => setLoading(false));
  }, []);

  const totalPages = Math.ceil(posts.length / PER_PAGE);
  const pagedPosts = posts.slice(page * PER_PAGE, (page + 1) * PER_PAGE);

  return (
    <div style={{
      minHeight: '100vh',
      background: '#1a1e24',
      color: '#dde1e5',
      fontFamily: '"Pretendard Variable", sans-serif',
    }}>
      <div style={{ maxWidth: 440, margin: '0 auto', padding: '0 20px' }}>
        {/* 헤더 */}
        <div style={{
          padding: '20px 0 16px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <img src="/icon/logo.svg" alt="제3의시간" style={{ height: 20, opacity: 0.6 }} />
            <span style={{ fontSize: 14, color: '#f0dfad', letterSpacing: 1 }}>복길의 서고</span>
          </div>
          <Link href="/" style={{ fontSize: 12, color: '#688097', textDecoration: 'none' }}>
            메인으로
          </Link>
        </div>

        {/* 소개 */}
        <div style={{
          padding: '16px',
          background: 'rgba(240,223,173,0.04)',
          border: '1px solid rgba(240,223,173,0.1)',
          borderRadius: 12,
          marginBottom: 20,
        }}>
          <div style={{
            fontSize: 15, lineHeight: 1.8, color: '#ccc',
            fontFamily: 'var(--font-gaegu), "Gaegu", cursive',
          }}>
            자네가 궁금한 것이 있다면,{'\n'}
            이 서고에서 찾아보게.{'\n'}
            내가 알고 있는 것들을 적어두었네.
          </div>
          <div style={{ fontSize: 11, color: '#667', marginTop: 8 }}>— 복길</div>
        </div>

        {/* 글 목록 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {loading && (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#889' }}>불러오는 중...</div>
          )}
          {!loading && pagedPosts.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#556' }}>
              아직 적어둔 것이 없구먼.
            </div>
          )}
          {pagedPosts.map(post => (
            <Link key={post.slug} href={`/blog/${post.slug}`} style={{ textDecoration: 'none' }}>
              <div style={{
                padding: '14px 16px',
                background: 'rgba(26,30,36,0.9)',
                border: '1px solid rgba(104,128,151,0.15)',
                borderRadius: 10,
                cursor: 'pointer',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#dde1e5', lineHeight: 1.5 }}>
                    {post.title}
                  </div>
                  <div style={{ fontSize: 10, color: '#556', flexShrink: 0, paddingTop: 3 }}>
                    {post.date}
                  </div>
                </div>
                {post.summary && (
                  <div style={{ fontSize: 12, color: '#889', marginTop: 6, lineHeight: 1.5 }}>
                    {post.summary}
                  </div>
                )}
                {post.tags.length > 0 && (
                  <div style={{ display: 'flex', gap: 4, marginTop: 8, flexWrap: 'wrap' }}>
                    {post.tags.map(tag => (
                      <span key={tag} style={{
                        fontSize: 10, color: '#f0dfad', padding: '2px 6px',
                        background: 'rgba(240,223,173,0.08)', borderRadius: 6,
                      }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>

        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 20 }}>
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => { setPage(i); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: page === i ? 'rgba(240,223,173,0.15)' : 'transparent',
                  border: `1px solid ${page === i ? 'rgba(240,223,173,0.3)' : 'rgba(104,128,151,0.2)'}`,
                  color: page === i ? '#f0dfad' : '#889',
                  fontSize: 13, cursor: 'pointer',
                }}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}

        {/* CTA 배너 */}
        <div style={{
          marginTop: 32,
          padding: '20px',
          background: 'rgba(240,223,173,0.06)',
          border: '1px solid rgba(240,223,173,0.15)',
          borderRadius: 14,
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 15, color: '#f0dfad', marginBottom: 6 }}>
            읽는 것만으로는 부족하지 않겠나?
          </div>
          <div style={{ fontSize: 12, color: '#889', marginBottom: 14, lineHeight: 1.6 }}>
            자네의 사주를 직접 풀어보게.
          </div>
          <Link href="/alt2" style={{
            display: 'inline-block',
            padding: '10px 28px',
            background: 'rgba(240,223,173,0.12)',
            border: '1px solid rgba(240,223,173,0.3)',
            borderRadius: 20,
            color: '#f0dfad',
            fontSize: 13, fontWeight: 600,
            textDecoration: 'none',
          }}>
            제3의시간 시작하기
          </Link>
        </div>

        {/* 하단 돌아가기 */}
        <div style={{ textAlign: 'center', padding: '24px 0 16px' }}>
          <Link href="/" style={{
            display: 'inline-block',
            padding: '8px 20px',
            border: '1px solid rgba(104,128,151,0.2)',
            borderRadius: 16,
            color: '#688097',
            fontSize: 12,
            textDecoration: 'none',
          }}>
            ← 메인으로 돌아가기
          </Link>
        </div>

        {/* 푸터 */}
        <div style={{ textAlign: 'center', padding: '12px 0 40px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
            <Link href="/" style={{ fontSize: 11, color: '#556', textDecoration: 'none' }}>메인</Link>
            <Link href="/faq" style={{ fontSize: 11, color: '#556', textDecoration: 'none' }}>FAQ</Link>
            <Link href="/contact" style={{ fontSize: 11, color: '#556', textDecoration: 'none' }}>문의</Link>
            <Link href="/terms" style={{ fontSize: 11, color: '#556', textDecoration: 'none' }}>이용약관</Link>
            <Link href="/privacy" style={{ fontSize: 11, color: '#556', textDecoration: 'none' }}>개인정보</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
