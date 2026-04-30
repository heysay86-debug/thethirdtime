'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

interface BgmPlayerProps {
  show?: boolean;
  src?: string;
  autoPlayFromMenu?: boolean; // 메뉴에서 BGM 켰으면 자동 재생
  autoStart?: boolean; // 첫 방문 시 자동 시작 (메인 메뉴용)
}

export default function BgmPlayer({ show = true, src = '/bgm/crystalfield.mp3', autoPlayFromMenu = false, autoStart = false }: BgmPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [started, setStarted] = useState(false);
  const [visible, setVisible] = useState(false);
  const playingRef = useRef(false);

  useEffect(() => {
    const audio = new Audio(src);
    audio.loop = true;
    audio.volume = 0.055;
    audio.preload = 'none'; // 재생 전까지 다운로드하지 않음
    audioRef.current = audio;
    return () => {
      audio.pause();
      audio.src = '';
    };
  }, []);

  useEffect(() => {
    playingRef.current = playing;
  }, [playing]);

  // show가 true가 되면 버튼 노출 + 자동 재생 판단
  useEffect(() => {
    if (!show) return;
    const t = setTimeout(() => {
      setVisible(true);
      if (started) return;

      try {
        const bgmState = localStorage.getItem('thethirdtime_bgm');

        // autoStart: 첫 방문(null) 또는 'on'이면 자동 재생, 'off'면 안 함
        // autoPlayFromMenu: 'on'일 때만 자동 재생
        const shouldPlay = autoStart
          ? bgmState !== 'off'
          : autoPlayFromMenu && bgmState === 'on';

        if (shouldPlay && audioRef.current) {
          audioRef.current.play().then(() => {
            setPlaying(true);
            setStarted(true);
            localStorage.setItem('thethirdtime_bgm', 'on');
          }).catch(() => {
            // 자동재생 차단됨 — 첫 터치에 재생
            if (autoStart) {
              const startOnTouch = () => {
                audioRef.current?.play().then(() => {
                  setPlaying(true);
                  setStarted(true);
                  try { localStorage.setItem('thethirdtime_bgm', 'on'); } catch {}
                }).catch(() => {});
                document.removeEventListener('pointerdown', startOnTouch);
              };
              document.addEventListener('pointerdown', startOnTouch, { once: true });
            }
          });
        }
      } catch {}
    }, autoStart ? 500 : 3000);
    return () => clearTimeout(t);
  }, [show, autoPlayFromMenu, autoStart, started]);

  useEffect(() => {
    const handleVisibility = () => {
      if (!audioRef.current) return;
      if (document.hidden) {
        audioRef.current.pause();
      } else if (playingRef.current) {
        audioRef.current.play().catch(() => {});
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  const toggle = useCallback(() => {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
      try { localStorage.setItem('thethirdtime_bgm', 'off'); } catch {}
    } else {
      // 모바일: 클릭 시 로드+재생 동시 시도
      const playPromise = audioRef.current.play();
      if (playPromise) {
        playPromise
          .then(() => {
            setPlaying(true);
            setStarted(true);
            try { localStorage.setItem('thethirdtime_bgm', 'on'); } catch {}
          })
          .catch(() => {
            // 로딩 안 됐으면 로드 후 재시도
            audioRef.current!.load();
            audioRef.current!.addEventListener('canplay', () => {
              audioRef.current!.play().then(() => {
                setPlaying(true);
                setStarted(true);
              }).catch(() => {});
            }, { once: true });
          });
      }
    }
  }, [playing]);

  return (
    <>
      <style jsx>{`
        @keyframes bgm-glow {
          0%, 100% { box-shadow: 0 0 8px rgba(240, 223, 173, 0.3), 0 0 16px rgba(240, 223, 173, 0.15); }
          50% { box-shadow: 0 0 14px rgba(240, 223, 173, 0.5), 0 0 28px rgba(240, 223, 173, 0.25); }
        }
      `}</style>
      <button
        onClick={toggle}
        className="fixed flex items-center justify-center"
        style={{
          bottom: 'max(16px, env(safe-area-inset-bottom))',
          right: 16,
          zIndex: 55,
          opacity: visible ? 1 : 0,
          pointerEvents: visible ? 'auto' : 'none',
          width: started ? 36 : 48,
          height: started ? 36 : 48,
          borderRadius: '50%',
          backgroundColor: playing ? 'rgba(62, 72, 87, 0.7)' : 'rgba(240, 223, 173, 0.15)',
          backdropFilter: 'blur(8px)',
          border: started ? '1px solid rgba(104, 128, 151, 0.3)' : '2px solid rgba(240, 223, 173, 0.4)',
          cursor: 'pointer',
          animation: !started ? 'bgm-glow 2s ease-in-out infinite' : 'none',
          transition: 'all 0.3s ease',
        }}
        title={playing ? 'BGM 끄기' : 'BGM 켜기'}
      >
        <img
          src="/icon/music.svg"
          alt=""
          style={{
            width: started ? 18 : 24,
            height: started ? 18 : 24,
            opacity: playing ? 1 : started ? 0.4 : 0.8,
            filter: playing ? 'none' : started ? 'grayscale(1)' : 'none',
            transition: 'all 0.3s ease',
          }}
        />
        {!playing && started && (
          <div style={{
            position: 'absolute',
            width: 20,
            height: 2,
            backgroundColor: '#688097',
            transform: 'rotate(-45deg)',
            borderRadius: 1,
          }} />
        )}
      </button>

      {/* GM 메시지 — BGM 미시작 + 버튼 보이는 상태 */}
      {visible && !started && (
        <div
          className="fixed"
          style={{
            bottom: 'max(70px, calc(env(safe-area-inset-bottom) + 54px))',
            right: 16,
            zIndex: 55,
            pointerEvents: 'none',
            animation: 'bgm-glow 2s ease-in-out infinite',
          }}
        >
          <div style={{
            padding: '6px 12px',
            background: 'rgba(240, 223, 173, 0.08)',
            border: '1px solid rgba(240, 223, 173, 0.15)',
            borderRadius: 12,
            fontSize: 10,
            color: '#f0dfad',
            whiteSpace: 'nowrap',
          }}>
            BGM을 켜고 플레이하시면 더 재미있습니다
          </div>
        </div>
      )}
    </>
  );
}
