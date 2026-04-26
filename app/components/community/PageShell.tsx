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
      {/* Top bar — 복길의 서고와 동일 사이즈 */}
      <header
        style={{
          width: '100%',
          maxWidth: 440,
          padding: '20px 20px 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <a href="/" target="_top" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <img
            src="/icon/logo.svg"
            alt="제3의시간"
            style={{ height: 20, opacity: 0.6 }}
          />
          <span
            style={{
              fontFamily: '"Pretendard Variable", "Pretendard", sans-serif',
              fontSize: 14,
              color: '#f0dfad',
              letterSpacing: 1,
            }}
          >
            {title}
          </span>
        </a>
        <a
          href="/"
          target="_top"
          style={{
            fontFamily: '"Pretendard Variable", "Pretendard", sans-serif',
            fontSize: 12,
            color: '#688097',
            textDecoration: 'none',
          }}
        >
          메인으로
        </a>
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
          { label: '메인으로', href: '/' },
        ].map((link, i) => (
          <a
            key={i}
            href={link.href}
            target="_top"
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
