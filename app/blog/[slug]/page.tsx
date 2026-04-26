import { getPost, getAllPosts } from '@/src/lib/blog';
import { notFound } from 'next/navigation';
import Link from 'next/link';

// 정적 생성
export function generateStaticParams() {
  return getAllPosts().map(p => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return {};
  return {
    title: `${post.title} — 복길의 서고`,
    description: post.summary,
  };
}

// 마크다운 → 간단한 HTML 변환
function renderMarkdown(md: string) {
  const blocks = md.split('\n\n');
  return blocks.map((block, i) => {
    const trimmed = block.trim();
    if (!trimmed) return null;

    // 이미지 ![alt](src)
    const imgMatch = trimmed.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (imgMatch) {
      return (
        <div key={i} style={{ margin: '16px 0', textAlign: 'center' }}>
          <img
            src={imgMatch[2]}
            alt={imgMatch[1]}
            style={{ maxWidth: '100%', borderRadius: 8 }}
          />
          {imgMatch[1] && (
            <div style={{ fontSize: 11, color: '#667', marginTop: 6 }}>{imgMatch[1]}</div>
          )}
        </div>
      );
    }

    if (trimmed.startsWith('### ')) {
      return (
        <h3 key={i} style={{
          fontSize: 14, fontWeight: 700, color: '#f0dfad',
          marginTop: i > 0 ? 20 : 0, marginBottom: 8,
        }}>
          {trimmed.replace(/^###\s*/, '')}
        </h3>
      );
    }
    if (trimmed.startsWith('## ')) {
      return (
        <h2 key={i} style={{
          fontSize: 15, fontWeight: 700, color: '#f0dfad',
          marginTop: i > 0 ? 24 : 0, marginBottom: 8,
          borderBottom: '1px solid rgba(240,223,173,0.15)',
          paddingBottom: 6,
        }}>
          {trimmed.replace(/^##\s*/, '')}
        </h2>
      );
    }

    // 인용문 (복길 한마디)
    if (trimmed.startsWith('> ')) {
      return (
        <blockquote key={i} style={{
          margin: '16px 0 0',
          padding: '12px 16px',
          borderLeft: '2px solid rgba(240,223,173,0.3)',
          background: 'rgba(240,223,173,0.04)',
          borderRadius: '0 8px 8px 0',
          fontSize: 13,
          lineHeight: 1.8,
          color: '#b8bcc0',
          fontStyle: 'italic',
        }}>
          {trimmed.split('\n').map((l, j) => (
            <span key={j}>{l.replace(/^>\s*/, '')}{j < trimmed.split('\n').length - 1 && <br />}</span>
          ))}
        </blockquote>
      );
    }

    // 리스트
    if (trimmed.split('\n').every(l => l.startsWith('- '))) {
      return (
        <ul key={i} style={{ paddingLeft: 16, margin: '8px 0' }}>
          {trimmed.split('\n').map((l, j) => (
            <li key={j} style={{ fontSize: 13, lineHeight: 1.8, color: '#ccc', marginBottom: 4 }}>
              {l.replace(/^-\s*/, '')}
            </li>
          ))}
        </ul>
      );
    }

    return (
      <p key={i} style={{
        fontSize: 13, lineHeight: 1.9, color: '#ccc',
        marginTop: i > 0 ? 8 : 0, marginBottom: 0,
      }}>
        {trimmed.split('\n').map((line, j) => (
          <span key={j}>{line}{j < trimmed.split('\n').length - 1 && <br />}</span>
        ))}
      </p>
    );
  });
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

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
          <a href="/blog" target="_top" style={{ fontSize: 12, color: '#688097', textDecoration: 'none' }}>
            ← 서고로 돌아가기
          </a>
          <a href="/" target="_top" style={{ fontSize: 12, color: '#556', textDecoration: 'none' }}>
            홈
          </a>
        </div>

        {/* 글 */}
        <article style={{ paddingBottom: 60 }}>
          <div style={{ marginBottom: 20 }}>
            <h1 style={{ fontSize: 18, fontWeight: 700, color: '#f0dfad', lineHeight: 1.5, margin: 0 }}>
              {post.title}
            </h1>
            <div style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontSize: 11, color: '#667' }}>{post.date}</span>
              {post.tags.map(tag => (
                <span key={tag} style={{
                  fontSize: 10, color: '#f0dfad', padding: '2px 6px',
                  background: 'rgba(240,223,173,0.08)',
                  borderRadius: 6,
                }}>
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div style={{
            padding: '20px 16px',
            background: 'rgba(240,223,173,0.03)',
            border: '1px solid rgba(240,223,173,0.08)',
            borderRadius: 12,
          }}>
            {renderMarkdown(post.content)}
          </div>

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
            <a href="/" target="_top" style={{
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
            </a>
          </div>

          {/* 하단 네비게이션 */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 24 }}>
            <a href="/blog" target="_top" style={{
              padding: '8px 20px',
              border: '1px solid rgba(104,128,151,0.2)',
              borderRadius: 16,
              color: '#688097',
              fontSize: 12,
              textDecoration: 'none',
            }}>
              ← 서고로 돌아가기
            </a>
            <a href="/" target="_top" style={{
              padding: '8px 20px',
              border: '1px solid rgba(104,128,151,0.15)',
              borderRadius: 16,
              color: '#556',
              fontSize: 12,
              textDecoration: 'none',
            }}>
              메인으로
            </a>
          </div>
        </article>
      </div>
    </div>
  );
}
