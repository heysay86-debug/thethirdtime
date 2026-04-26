'use client';

import React, { useState } from 'react';
import PageShell from '../components/community/PageShell';
import BoardFrame from '../components/community/BoardFrame';
import BokgilSays from '../components/community/BokgilSays';

export default function ContactPage() {
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      setError('문의 내용을 입력해 주세요.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nickname: nickname.trim() || undefined,
          email: email.trim() || undefined,
          message: message.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || '전송에 실패했습니다.');
        return;
      }

      setSubmitted(true);
    } catch {
      setError('네트워크 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    fontFamily: '"Pretendard Variable", "Pretendard", sans-serif',
    fontSize: 14,
    color: '#3a2e1e',
    backgroundColor: 'rgba(255, 252, 240, 0.7)',
    border: '1px solid #a89070',
    borderRadius: 2,
    outline: 'none',
    boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontFamily: '"Pretendard Variable", "Pretendard", sans-serif',
    fontSize: 13,
    fontWeight: 600,
    color: '#4a3728',
    marginBottom: 6,
  };

  return (
    <PageShell title="문의하기">
      {/* Bokgil intro */}
      <div style={{ marginBottom: 20 }}>
        <BokgilSays text="무엇이 궁금하신가?\n이곳에 적어두면\n내 반드시 전해두겠네." />
      </div>

      {submitted ? (
        <>
          <div style={{ marginBottom: 20 }}>
            <BokgilSays text="자네의 이야기를\n잘 전해두겠네." />
          </div>
          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <a
              href="/" target="_top"
              style={{
                fontFamily: '"Pretendard Variable", "Pretendard", sans-serif',
                fontSize: 14,
                color: '#8899aa',
                textDecoration: 'none',
                borderBottom: '1px solid rgba(136, 153, 170, 0.3)',
                paddingBottom: 2,
              }}
            >
              홈으로 돌아가기
            </a>
          </div>
        </>
      ) : (
        <BoardFrame>
          {/* Board title */}
          <div
            style={{
              fontFamily: '"Noto Sans KR", sans-serif',
              fontSize: 15,
              fontWeight: 700,
              color: '#4a3728',
              textAlign: 'center',
              marginBottom: 16,
              paddingBottom: 10,
              borderBottom: '1px solid rgba(139, 115, 85, 0.4)',
            }}
          >
            의뢰서 작성
          </div>

          <form onSubmit={handleSubmit}>
            {/* Nickname */}
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>
                닉네임 <span style={{ fontWeight: 400, color: '#8a7a60' }}>(선택)</span>
              </label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="어떻게 불러드릴까요?"
                maxLength={50}
                style={inputStyle}
              />
            </div>

            {/* Email */}
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>
                이메일 <span style={{ fontWeight: 400, color: '#8a7a60' }}>(선택)</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="답변을 받으실 주소"
                maxLength={100}
                style={inputStyle}
              />
            </div>

            {/* Message */}
            <div style={{ marginBottom: 18 }}>
              <label style={labelStyle}>
                문의 내용 <span style={{ fontWeight: 400, color: '#a04040' }}>*</span>
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="궁금한 점이나 건의사항을 자유롭게 적어주세요."
                maxLength={2000}
                rows={6}
                style={{
                  ...inputStyle,
                  resize: 'vertical',
                  minHeight: 120,
                }}
              />
              <div
                style={{
                  fontFamily: '"Pretendard Variable", "Pretendard", sans-serif',
                  fontSize: 11,
                  color: '#8a7a60',
                  textAlign: 'right',
                  marginTop: 4,
                }}
              >
                {message.length} / 2000
              </div>
            </div>

            {/* Error */}
            {error && (
              <div
                style={{
                  fontFamily: '"Pretendard Variable", "Pretendard", sans-serif',
                  fontSize: 13,
                  color: '#a04040',
                  marginBottom: 12,
                  textAlign: 'center',
                }}
              >
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              style={{
                width: '100%',
                padding: '12px 0',
                fontFamily: '"Pretendard Variable", "Pretendard", sans-serif',
                fontSize: 14,
                fontWeight: 600,
                color: submitting ? '#8a7a60' : '#f0dfad',
                backgroundColor: submitting ? '#6a5a40' : '#5c3d1e',
                border: '2px solid #7a5630',
                borderRadius: 2,
                cursor: submitting ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.2s',
              }}
            >
              {submitting ? '전송 중...' : '의뢰서 전달하기'}
            </button>
          </form>
        </BoardFrame>
      )}
    </PageShell>
  );
}
