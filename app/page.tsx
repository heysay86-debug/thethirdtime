'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import BgmPlayer from './alt2/components/base/BgmPlayer';

const MENU_ITEMS = [
  {
    id: 'saju',
    label: '1장 - 시간의 신전 (사주풀이)',
    subtitle: '',
    href: '/alt2',
    locked: false,
    chapter: 1,
    isService: true,
  },
  {
    id: 'hyo',
    label: '2장 - 운명의 제단 (육효점)',
    subtitle: '',
    href: '/hyo',
    locked: true,
    chapter: 2,
    isService: true,
  },
  {
    id: 'blog',
    label: '복길의 서고',
    subtitle: '',
    href: '/blog',
    locked: false,
    chapter: null,
    isService: false,
  },
  {
    id: 'faq',
    label: '자주 묻는 질문',
    subtitle: '',
    href: '/faq',
    locked: false,
    chapter: null,
    isService: false,
  },
  {
    id: 'contact',
    label: '문의하기',
    subtitle: '',
    href: '/contact',
    locked: false,
    chapter: null,
    isService: false,
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

  const [modalUrl, setModalUrl] = useState('');

  const MODAL_ITEMS = new Set(['blog', 'faq', 'contact']);

  const handleClick = (item: typeof MENU_ITEMS[0]) => {
    if (item.locked && !ch1Clear) {
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 2500);
      return;
    }
    if (MODAL_ITEMS.has(item.id)) {
      setModalUrl(item.href);
    } else {
      router.push(item.href);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#1a1e24',
      color: '#dde1e5',
      fontFamily: '"Pretendard Variable", sans-serif',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <BgmPlayer show src="/bgm/crystal-labyrinth.mp3" autoStart />
      {/* Gaegu 폰트 로드 */}
      <link href="https://fonts.googleapis.com/css2?family=Gaegu&display=swap" rel="stylesheet" />

      {/* 배경 이미지 */}
      <div style={{
        position: 'fixed', inset: 0,
        display: 'flex', justifyContent: 'center',
      }}>
        <img
          src="/background/main.jpeg"
          alt=""
          style={{
            height: '100%',
            objectFit: 'cover',
            opacity: 0.25,
            maxWidth: 440,
          }}
        />
      </div>

      {/* 콘텐츠 */}
      <div style={{
        position: 'relative', zIndex: 10,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '40px 20px 60px',
        maxWidth: 440,
        margin: '0 auto',
      }}>
        {/* 히어로 섹션 */}
        <div style={{ textAlign: 'center', marginBottom: 32, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <img
            src="/icon/logo.svg"
            alt="제3의시간"
            style={{ width: '70%', maxWidth: 280, marginBottom: 16, opacity: 0.9 }}
          />
          <p style={{
            fontSize: 22, fontWeight: 700, color: '#f0dfad', lineHeight: 1.8,
            fontFamily: '"Gaegu", cursive',
            marginBottom: 8,
          }}>
            당신의 시간 속 숨겨진 이야기
          </p>
          <p style={{ fontSize: 11, color: '#889', letterSpacing: 0.5, lineHeight: 1.8 }}>
            정통 명리학 중심의 깊이 있는 RPG형 사주풀이 서비스
          </p>
        </div>

      {/* 메뉴 보드 */}
      <div style={{
        width: '80%', maxWidth: 320,
        position: 'relative',
      }}>
        {/* 보드 이미지 — 비율 유지 */}
        <img
          src="/background/board.png"
          alt=""
          style={{ width: '100%', display: 'block' }}
        />
        {/* 버튼 오버레이 — 양피지 영역에 배치 */}
        <div style={{
          position: 'absolute',
          top: '33%',
          bottom: '4%',
          left: '14%',
          right: '14%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {MENU_ITEMS.map(item => {
          const isLocked = item.locked && !ch1Clear;
          return (
            <button
              key={item.id}
              onClick={() => handleClick(item)}
              onPointerDown={e => { if (!isLocked) e.currentTarget.style.boxShadow = 'inset 0 2px 8px rgba(0,0,0,0.4)'; }}
              onPointerUp={e => { e.currentTarget.style.boxShadow = 'none'; }}
              onPointerLeave={e => { e.currentTarget.style.boxShadow = 'none'; }}
              style={{
                display: 'flex', alignItems: 'center',
                padding: '9px 12px',
                background: item.isService
                  ? isLocked ? 'rgba(180,160,130,0.15)' : 'rgba(92,61,30,0.35)'
                  : 'rgba(92,61,30,0.08)',
                border: `1px solid ${item.isService
                  ? isLocked ? 'rgba(122,86,48,0.15)' : 'rgba(122,86,48,0.6)'
                  : 'rgba(122,86,48,0.15)'}`,
                borderRadius: 6,
                cursor: isLocked ? 'default' : 'pointer',
                opacity: isLocked ? 0.5 : 1,
                transition: 'all 0.15s ease',
                textAlign: 'left',
                width: '100%',
              }}
            >
              {isLocked && (
                <span style={{ marginRight: 8, fontSize: 11 }}>🔒</span>
              )}

              <div>
                <div style={{
                  fontSize: 12, fontWeight: 600,
                  color: item.isService ? (isLocked ? '#a09080' : '#3a2510') : '#5c4a38',
                }}>
                  {item.label}
                </div>
                {/* 서브타이틀 생략 — 보드 공간 확보 */}
              </div>
            </button>
          );
        })}
        </div>
        </div>
      </div>

      {/* 하단 링크 */}
      <div style={{
        display: 'flex', gap: 12, marginTop: 40,
        fontSize: 10, color: '#778',
      }}>
        <a href="/terms" style={{ color: '#778', textDecoration: 'none' }}>이용약관</a>
        <span>·</span>
        <a href="/privacy" style={{ color: '#778', textDecoration: 'none' }}>개인정보처리방침</a>
      </div>
      <div style={{ marginTop: 12, fontSize: 9, color: '#667', letterSpacing: 0.3, textAlign: 'center', lineHeight: 1.6 }}>
        Copyright 2026. Ⓒ Betterdan studio(베러댄 스튜디오). All rights reserved.
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

      </div>

      {/* iframe 모달 */}
      {modalUrl && (
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
            <button onClick={() => setModalUrl('')} style={{
              position: 'absolute', top: 12, right: 12, zIndex: 2,
              background: 'rgba(26,30,36,0.8)', border: 'none', color: '#889',
              fontSize: 18, cursor: 'pointer', lineHeight: 1,
              width: 32, height: 32, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              ✕
            </button>
            <iframe
              src={modalUrl}
              style={{ width: '100%', height: '100%', border: 'none', background: '#1a1e24' }}
            />
          </div>
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
