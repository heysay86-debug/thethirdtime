'use client';

import { useState } from 'react';
import { requestSaveResult } from '@/src/lib/auth/adapter';

interface EmailSaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
  reportNo: string | null;
  title?: string;
  subtitle?: string;
}

export default function EmailSaveModal({
  isOpen,
  onClose,
  onSaved,
  reportNo,
  title = 'PDF를 받기 전에',
  subtitle = '이 결과도 함께 저장할까요?',
}: EmailSaveModalProps) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'saving' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState('');

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!email.trim() || !reportNo) return;
    setStatus('saving');
    const result = await requestSaveResult({ email: email.trim(), reportNo });
    if (result.success) {
      setStatus('done');
      setMessage('시간의 서고에 보관되었습니다.');
      onSaved?.();
      setTimeout(() => onClose(), 2000);
    } else {
      setStatus('error');
      setMessage(result.message);
    }
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(4px)',
      }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#252a31',
          border: '1px solid rgba(240,223,173,0.2)',
          borderRadius: 16,
          padding: '24px 20px',
          maxWidth: 340,
          width: '90%',
        }}
      >
        <div style={{ fontSize: 15, fontWeight: 700, color: '#f0dfad', marginBottom: 4 }}>
          {title}
        </div>
        <div style={{ fontSize: 13, color: '#889', marginBottom: 16 }}>
          {subtitle}
        </div>

        {status === 'done' ? (
          <div style={{ textAlign: 'center', padding: '12px 0' }}>
            <div style={{ fontSize: 14, color: '#a1c5ac', marginBottom: 4 }}>{message}</div>
            <div style={{ fontSize: 11, color: '#667' }}>나중에 이메일로 다시 찾아볼 수 있어요.</div>
          </div>
        ) : (
          <>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="이메일 주소"
              style={{
                width: '100%',
                padding: '10px 12px',
                fontSize: 14,
                background: '#1a1e24',
                border: '1px solid rgba(240,223,173,0.15)',
                borderRadius: 8,
                color: '#dde1e5',
                marginBottom: 12,
                boxSizing: 'border-box',
              }}
              onKeyDown={e => { if (e.key === 'Enter') handleSave(); }}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={handleSave}
                disabled={status === 'saving' || !email.trim()}
                style={{
                  flex: 1,
                  padding: '10px',
                  background: email.trim() ? 'rgba(240,223,173,0.15)' : 'rgba(240,223,173,0.05)',
                  border: '1px solid rgba(240,223,173,0.3)',
                  borderRadius: 10,
                  color: '#f0dfad',
                  fontSize: 13,
                  cursor: email.trim() ? 'pointer' : 'default',
                  opacity: email.trim() ? 1 : 0.5,
                }}
              >
                {status === 'saving' ? '저장 중...' : '보관하기'}
              </button>
              <button
                onClick={onClose}
                style={{
                  padding: '10px 16px',
                  background: 'transparent',
                  border: '1px solid rgba(221,225,229,0.15)',
                  borderRadius: 10,
                  color: '#667',
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                건너뛰기
              </button>
            </div>
            {status === 'error' && (
              <div style={{ fontSize: 11, color: '#e74c3c', marginTop: 8 }}>{message}</div>
            )}
            <div style={{ fontSize: 10, color: '#556', marginTop: 10, lineHeight: 1.5 }}>
              이메일은 결과 보관 용도로만 사용됩니다.
            </div>
          </>
        )}
      </div>
    </div>
  );
}
