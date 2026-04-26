'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import BgmPlayer from './alt2/components/base/BgmPlayer';

const MENU_ITEMS = [
  {
    id: 'saju',
    label: '제3의시간 시작',
    subtitle: 'RPG형 사주풀이',
    href: '/alt2',
    locked: false,
    chapter: 1,
  },
  {
    id: 'hyo',
    label: '육효점',
    subtitle: '시초법으로 점을 치다',
    href: '/hyo',
    locked: true, // 사주풀이 완료 후 해금
    chapter: 2,
  },
  {
    id: 'blog',
    label: '복길의 서고',
    subtitle: '사주와 명리학 이야기',
    href: '/blog',
    locked: false,
    chapter: null,
  },
  {
    id: 'faq',
    label: '자주 묻는 질문',
    subtitle: '',
    href: '/faq',
    locked: false,
    chapter: null,
  },
  {
    id: 'contact',
    label: '문의하기',
    subtitle: '의뢰서 작성',
    href: '/contact',
    locked: false,
    chapter: null,
  },
];

const STORAGE_KEY = 'thethirdtime_ch1_clear';

export default function MainMenu() {
  const router = useRouter();
  const [ch1Clear, setCh1Clear] = useState(false);
  const [showAlert, setShowAlert] = useState(false);

  useEffect(() => {
    const cleared = localStorage.getItem(STORAGE_KEY);
    if (cleared === 'true') setCh1Clear(true);
  }, []);

  const handleClick = (item: typeof MENU_ITEMS[0]) => {
    if (item.locked && !ch1Clear) {
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 2500);
      return;
    }
    router.push(item.href);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#1a1e24',
      color: '#dde1e5',
      fontFamily: '"Pretendard Variable", sans-serif',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
    }}>
      <BgmPlayer show src="/bgm/crystal-labyrinth.mp3" />

      {/* 로고 */}
      <img
        src="/icon/logo.svg"
        alt="제3의시간"
        style={{ width: 160, marginBottom: 8, opacity: 0.8 }}
      />
      <p style={{ fontSize: 12, color: '#688097', letterSpacing: 2, marginBottom: 40 }}>
        the third time
      </p>

      {/* 메뉴 */}
      <div style={{
        display: 'flex', flexDirection: 'column', gap: 10,
        width: '100%', maxWidth: 360,
      }}>
        {MENU_ITEMS.map(item => {
          const isLocked = item.locked && !ch1Clear;
          return (
            <button
              key={item.id}
              onClick={() => handleClick(item)}
              onPointerDown={e => { if (!isLocked) e.currentTarget.style.transform = 'scale(0.96)'; }}
              onPointerUp={e => { e.currentTarget.style.transform = 'scale(1)'; }}
              onPointerLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
              style={{
                display: 'flex', alignItems: 'center',
                padding: '14px 18px',
                background: item.id === 'saju'
                  ? 'rgba(240,223,173,0.1)'
                  : isLocked
                  ? 'rgba(26,30,36,0.6)'
                  : 'rgba(26,30,36,0.9)',
                border: `1px solid ${item.id === 'saju'
                  ? 'rgba(240,223,173,0.3)'
                  : isLocked
                  ? 'rgba(104,128,151,0.1)'
                  : 'rgba(104,128,151,0.2)'}`,
                borderRadius: 12,
                cursor: isLocked ? 'default' : 'pointer',
                opacity: isLocked ? 0.5 : 1,
                transition: 'all 0.15s ease',
                textAlign: 'left',
                width: '100%',
              }}
            >
              {/* 챕터 번호 */}
              {item.chapter && (
                <div style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: item.id === 'saju'
                    ? 'rgba(240,223,173,0.15)'
                    : isLocked
                    ? 'rgba(104,128,151,0.1)'
                    : 'rgba(104,128,151,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginRight: 14, flexShrink: 0,
                  fontSize: 13, fontWeight: 700,
                  color: item.id === 'saju' ? '#f0dfad' : isLocked ? '#556' : '#889',
                }}>
                  {isLocked ? '🔒' : item.chapter}
                </div>
              )}
              {!item.chapter && <div style={{ width: 32, marginRight: 14, flexShrink: 0 }} />}

              <div>
                <div style={{
                  fontSize: 14, fontWeight: 600,
                  color: item.id === 'saju' ? '#f0dfad' : isLocked ? '#556' : '#dde1e5',
                }}>
                  {item.label}
                </div>
                {item.subtitle && (
                  <div style={{
                    fontSize: 11, marginTop: 2,
                    color: isLocked ? '#445' : '#688097',
                  }}>
                    {item.subtitle}
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* 하단 링크 */}
      <div style={{
        display: 'flex', gap: 12, marginTop: 40,
        fontSize: 10, color: '#556',
      }}>
        <a href="/terms" style={{ color: '#556', textDecoration: 'none' }}>이용약관</a>
        <span>·</span>
        <a href="/privacy" style={{ color: '#556', textDecoration: 'none' }}>개인정보처리방침</a>
      </div>

      {/* 잠금 알림 */}
      {showAlert && (
        <div style={{
          position: 'fixed',
          bottom: 40, left: '50%', transform: 'translateX(-50%)',
          padding: '10px 20px',
          background: 'rgba(26,30,36,0.95)',
          border: '1px solid rgba(240,223,173,0.2)',
          borderRadius: 12,
          fontSize: 13,
          color: '#f0dfad',
          zIndex: 100,
          animation: 'fade-in-up 0.2s ease',
          whiteSpace: 'nowrap',
        }}>
          이전 챕터 클리어 시 이용 가능합니다
        </div>
      )}

      <style>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateX(-50%) translateY(8px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
    </div>
  );
}
