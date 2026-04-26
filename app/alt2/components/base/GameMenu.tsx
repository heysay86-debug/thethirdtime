'use client';

import { useState, useEffect, useCallback } from 'react';

const PER_PAGE = 12;

interface PostSummary {
  slug: string;
  title: string;
  date: string;
  summary: string;
  tags: string[];
}

interface PostFull extends PostSummary {
  content: string;
}

// 마크다운 → React 렌더링
function renderMarkdown(md: string) {
  const blocks = md.split('\n\n');
  return blocks.map((block, i) => {
    const t = block.trim();
    // 이미지
    const imgMatch = t.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (imgMatch) {
      return <div key={i} style={{ margin: '12px 0', textAlign: 'center' }}><img src={imgMatch[2]} alt={imgMatch[1]} style={{ maxWidth: '100%', borderRadius: 8 }} />{imgMatch[1] && <div style={{ fontSize: 10, color: '#667', marginTop: 4 }}>{imgMatch[1]}</div>}</div>;
    }
    if (!t) return null;
    if (t.startsWith('## ')) {
      return <h2 key={i} style={{ fontSize: 15, fontWeight: 700, color: '#f0dfad', marginTop: i > 0 ? 20 : 0, marginBottom: 6, borderBottom: '1px solid rgba(240,223,173,0.15)', paddingBottom: 4 }}>{t.replace(/^##\s*/, '')}</h2>;
    }
    if (t.startsWith('### ')) {
      return <h3 key={i} style={{ fontSize: 14, fontWeight: 700, color: '#f0dfad', marginTop: i > 0 ? 16 : 0, marginBottom: 4 }}>{t.replace(/^###\s*/, '')}</h3>;
    }
    if (t.startsWith('> ')) {
      return <blockquote key={i} style={{ margin: '12px 0 0', padding: '10px 14px', borderLeft: '2px solid rgba(240,223,173,0.3)', background: 'rgba(240,223,173,0.04)', borderRadius: '0 8px 8px 0', fontSize: 13, lineHeight: 1.8, color: '#b8bcc0', fontStyle: 'italic' }}>{t.split('\n').map((l, j) => <span key={j}>{l.replace(/^>\s*/, '')}{j < t.split('\n').length - 1 && <br />}</span>)}</blockquote>;
    }
    if (t.split('\n').every(l => l.startsWith('- '))) {
      return <ul key={i} style={{ paddingLeft: 16, margin: '6px 0' }}>{t.split('\n').map((l, j) => <li key={j} style={{ fontSize: 13, lineHeight: 1.8, color: '#ccc', marginBottom: 2 }}>{l.replace(/^-\s*/, '')}</li>)}</ul>;
    }
    return <p key={i} style={{ fontSize: 13, lineHeight: 1.9, color: '#ccc', marginTop: i > 0 ? 6 : 0, marginBottom: 0 }}>{t.split('\n').map((l, j) => <span key={j}>{l}{j < t.split('\n').length - 1 && <br />}</span>)}</p>;
  });
}

export default function GameMenu() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [overlay, setOverlay] = useState<'none' | 'blog' | 'iframe'>('none');
  const [iframeUrl, setIframeUrl] = useState('');
  const [posts, setPosts] = useState<PostSummary[]>([]);
  const [page, setPage] = useState(0);
  const [selectedPost, setSelectedPost] = useState<PostFull | null>(null);
  const [loading, setLoading] = useState(false);

  // 블로그 목록 fetch
  const fetchPosts = useCallback(async () => {
    if (posts.length > 0) return;
    setLoading(true);
    try {
      const res = await fetch('/api/blog');
      const data = await res.json();
      setPosts(data.posts || []);
    } catch {}
    setLoading(false);
  }, [posts.length]);

  // 개별 글 fetch
  const openPost = useCallback(async (slug: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/blog?slug=${slug}`);
      const data = await res.json();
      setSelectedPost(data);
    } catch {}
    setLoading(false);
  }, []);

  const openBlog = () => {
    setMenuOpen(false);
    setOverlay('blog');
    setSelectedPost(null);
    setPage(0);
    fetchPosts();
  };

  const closeOverlay = () => {
    setOverlay('none');
    setSelectedPost(null);
    setIframeUrl('');
  };

  const openIframe = (url: string) => {
    setMenuOpen(false);
    setIframeUrl(url);
    setOverlay('iframe');
  };

  const totalPages = Math.ceil(posts.length / PER_PAGE);
  const pagedPosts = posts.slice(page * PER_PAGE, (page + 1) * PER_PAGE);

  return (
    <>
      {/* ═══ 메뉴 버튼 ═══ */}
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        style={{
          position: 'fixed', top: 16, right: 16, zIndex: 60,
          width: 36, height: 36, borderRadius: 8,
          background: menuOpen ? 'rgba(240,223,173,0.15)' : 'rgba(26,30,36,0.7)',
          backdropFilter: 'blur(8px)',
          border: `1px solid ${menuOpen ? 'rgba(240,223,173,0.3)' : 'rgba(104,128,151,0.3)'}`,
          cursor: 'pointer',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4,
          transition: 'all 0.2s',
        }}
      >
        <div style={{ width: 16, height: 2, backgroundColor: '#f0dfad', borderRadius: 1, transition: 'all 0.2s', transform: menuOpen ? 'rotate(45deg) translateY(3px)' : 'none' }} />
        <div style={{ width: 16, height: 2, backgroundColor: '#f0dfad', borderRadius: 1, transition: 'all 0.2s', opacity: menuOpen ? 0 : 1 }} />
        <div style={{ width: 16, height: 2, backgroundColor: '#f0dfad', borderRadius: 1, transition: 'all 0.2s', transform: menuOpen ? 'rotate(-45deg) translateY(-3px)' : 'none' }} />
      </button>

      {/* ═══ 드롭다운 메뉴 ═══ */}
      {menuOpen && (
        <>
          <div onClick={() => setMenuOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 58, background: 'rgba(0,0,0,0.3)' }} />
          <div style={{
            position: 'fixed', top: 58, right: 16, zIndex: 59,
            background: 'rgba(26,30,36,0.95)', backdropFilter: 'blur(12px)',
            border: '1px solid rgba(240,223,173,0.15)', borderRadius: 12,
            padding: '6px 0', minWidth: 160,
            animation: 'menu-slide-in 0.15s ease-out',
          }}>
            <button onClick={openBlog} style={menuItemStyle}>복길의 서고</button>
            <a href="/hyo" style={menuItemStyle}>육효점</a>
            <button onClick={() => openIframe('/faq')} style={menuItemStyle}>자주 묻는 질문</button>
            <button onClick={() => openIframe('/contact')} style={menuItemStyle}>문의하기</button>
            <div style={{ height: 1, background: 'rgba(104,128,151,0.2)', margin: '4px 12px' }} />
            <button onClick={() => openIframe('/terms')} style={{ ...menuItemStyle, fontSize: 11, color: '#667' }}>이용약관</button>
            <button onClick={() => openIframe('/privacy')} style={{ ...menuItemStyle, fontSize: 11, color: '#667' }}>개인정보처리방침</button>
          </div>
        </>
      )}

      {/* ═══ 서고 오버레이 ═══ */}
      {overlay === 'blog' && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 70,
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)',
          display: 'flex', justifyContent: 'center', alignItems: 'flex-start',
          overflowY: 'auto',
        }}>
          <div style={{
            width: '100%', maxWidth: 440,
            margin: '40px 16px', minHeight: 'calc(100vh - 80px)',
            background: '#1e2329',
            border: '1px solid rgba(240,223,173,0.15)',
            borderRadius: 16,
            padding: '20px 16px',
            position: 'relative',
          }}>
            {/* 닫기 */}
            <button onClick={closeOverlay} style={{
              position: 'absolute', top: 12, right: 12,
              background: 'none', border: 'none', color: '#889',
              fontSize: 18, cursor: 'pointer', lineHeight: 1,
            }}>
              ✕
            </button>

            {selectedPost ? (
              /* ─── 개별 글 보기 ─── */
              <>
                <button onClick={() => setSelectedPost(null)} style={{
                  background: 'none', border: 'none', color: '#688097',
                  fontSize: 12, cursor: 'pointer', padding: 0, marginBottom: 12,
                }}>
                  ← 목록으로
                </button>
                <h1 style={{ fontSize: 17, fontWeight: 700, color: '#f0dfad', lineHeight: 1.5, margin: '0 0 8px' }}>
                  {selectedPost.title}
                </h1>
                <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: '#667' }}>{selectedPost.date}</span>
                  {selectedPost.tags.map(t => (
                    <span key={t} style={{ fontSize: 10, color: '#f0dfad', padding: '2px 6px', background: 'rgba(240,223,173,0.08)', borderRadius: 6 }}>{t}</span>
                  ))}
                </div>
                <div style={{ padding: '16px 12px', background: 'rgba(240,223,173,0.03)', border: '1px solid rgba(240,223,173,0.08)', borderRadius: 10 }}>
                  {renderMarkdown(selectedPost.content)}
                </div>
              </>
            ) : (
              /* ─── 글 목록 ─── */
              <>
                <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, textDecoration: 'none' }}>
                  <img src="/icon/logo.svg" alt="" style={{ height: 18, opacity: 0.5 }} />
                  <span style={{ fontSize: 14, color: '#f0dfad', letterSpacing: 1 }}>복길의 서고</span>
                </a>

                {loading && <div style={{ textAlign: 'center', padding: '40px 0', color: '#889' }}>불러오는 중...</div>}

                {!loading && pagedPosts.map(post => (
                  <button
                    key={post.slug}
                    onClick={() => openPost(post.slug)}
                    style={{
                      display: 'block', width: '100%', textAlign: 'left',
                      padding: '12px 14px', marginBottom: 8,
                      background: 'rgba(26,30,36,0.8)',
                      border: '1px solid rgba(104,128,151,0.12)',
                      borderRadius: 10, cursor: 'pointer',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#dde1e5', lineHeight: 1.5 }}>{post.title}</span>
                      <span style={{ fontSize: 10, color: '#556', flexShrink: 0, paddingTop: 2 }}>{post.date}</span>
                    </div>
                    {post.summary && <div style={{ fontSize: 11, color: '#889', marginTop: 4, lineHeight: 1.5 }}>{post.summary}</div>}
                  </button>
                ))}

                {!loading && posts.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '40px 0', color: '#556' }}>아직 적어둔 것이 없구먼.</div>
                )}

                {/* 페이지네이션 */}
                {totalPages > 1 && (
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 16 }}>
                    {Array.from({ length: totalPages }).map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setPage(i)}
                        style={{
                          width: 28, height: 28, borderRadius: 6,
                          background: page === i ? 'rgba(240,223,173,0.15)' : 'transparent',
                          border: `1px solid ${page === i ? 'rgba(240,223,173,0.3)' : 'rgba(104,128,151,0.2)'}`,
                          color: page === i ? '#f0dfad' : '#889',
                          fontSize: 12, cursor: 'pointer',
                        }}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* ═══ iframe 오버레이 (FAQ/문의/약관/개인정보) ═══ */}
      {overlay === 'iframe' && iframeUrl && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 70,
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)',
          display: 'flex', justifyContent: 'center', alignItems: 'flex-start',
        }}>
          <div style={{
            width: '100%', maxWidth: 440,
            margin: '40px 16px', height: 'calc(100vh - 80px)',
            background: '#1e2329',
            border: '1px solid rgba(240,223,173,0.15)',
            borderRadius: 16,
            overflow: 'hidden',
            position: 'relative',
          }}>
            <button onClick={closeOverlay} style={{
              position: 'absolute', top: 12, right: 12, zIndex: 2,
              background: 'rgba(26,30,36,0.8)', border: 'none', color: '#889',
              fontSize: 18, cursor: 'pointer', lineHeight: 1,
              width: 32, height: 32, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              ✕
            </button>
            <iframe
              src={iframeUrl}
              style={{
                width: '100%', height: '100%', border: 'none',
                background: '#1a1e24',
              }}
            />
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes menu-slide-in {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}

const menuItemStyle: React.CSSProperties = {
  display: 'block', width: '100%', textAlign: 'left',
  padding: '10px 16px', fontSize: 13, color: '#dde1e5',
  textDecoration: 'none', background: 'none', border: 'none', cursor: 'pointer',
};
