'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

interface BgmPlayerProps {
  show?: boolean;
}

export default function BgmPlayer({ show = true }: BgmPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [started, setStarted] = useState(false);
  const [visible, setVisible] = useState(false);
  const playingRef = useRef(false);

  useEffect(() => {
    const audio = new Audio('/bgm/crystalfield.mp3');
    audio.loop = true;
    audio.volume = 0.08;
    audioRef.current = audio;
    return () => {
      audio.pause();
      audio.src = '';
    };
  }, []);

  useEffect(() => {
    playingRef.current = playing;
  }, [playing]);

  // show가 true가 되면 3초 후 버튼 노출
  useEffect(() => {
    if (!show) return;
    const t = setTimeout(() => setVisible(true), 3000);
    return () => clearTimeout(t);
  }, [show]);

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
    } else {
      // 모바일: 클릭 시 로드+재생 동시 시도
      const playPromise = audioRef.current.play();
      if (playPromise) {
        playPromise
          .then(() => {
            setPlaying(true);
            setStarted(true);
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
    </>
  );
}
