'use client';

import React from 'react';

interface PageShellProps {
  title: string;
  children: React.ReactNode;
}

export default function PageShell({ title, children }: PageShellProps) {
  return (
    <div
      style={{
        minHeight: '100dvh',
        backgroundColor: '#1a1e24',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      {/* Top bar */}
      <header
        style={{
          width: '100%',
          maxWidth: 440,
          padding: '16px 20px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <img
          src="/icon/logo.svg"
          alt="제3의시간"
          style={{ width: 28, height: 28, opacity: 0.85 }}
        />
        <span
          style={{
            fontFamily: '"Pretendard Variable", "Pretendard", sans-serif',
            fontSize: 15,
            fontWeight: 600,
            color: '#c8cdd3',
            letterSpacing: -0.3,
          }}
        >
          {title}
        </span>
      </header>

      {/* Main content area */}
      <main
        style={{
          width: '100%',
          maxWidth: 440,
          padding: '0 16px 32px',
          flex: 1,
        }}
      >
        {children}
      </main>

      {/* Footer */}
      <footer
        style={{
          width: '100%',
          maxWidth: 440,
          padding: '20px 16px 32px',
          display: 'flex',
          justifyContent: 'center',
          gap: 16,
          borderTop: '1px solid rgba(104, 128, 151, 0.15)',
        }}
      >
        {[
          { label: '이용약관', href: '/terms' },
          { label: '개인정보처리방침', href: '/privacy' },
          { label: '홈으로', href: '/alt2' },
        ].map((link, i) => (
          <a
            key={i}
            href={link.href}
            style={{
              fontFamily: '"Pretendard Variable", "Pretendard", sans-serif',
              fontSize: 12,
              color: 'rgba(150, 160, 175, 0.6)',
              textDecoration: 'none',
            }}
          >
            {link.label}
          </a>
        ))}
      </footer>
    </div>
  );
}
