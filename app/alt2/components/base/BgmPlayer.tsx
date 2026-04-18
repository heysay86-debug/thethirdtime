'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

export default function BgmPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [started, setStarted] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const playingRef = useRef(false);

  useEffect(() => {
    const audio = new Audio();
    audio.loop = true;
    audio.volume = 0.08;
    audio.preload = 'auto';
    audio.addEventListener('canplaythrough', () => setLoaded(true), { once: true });
    audio.src = '/bgm/crystalfield.mp3';
    audioRef.current = audio;
    return () => {
      audio.pause();
      audio.src = '';
    };
  }, []);

  useEffect(() => {
    playingRef.current = playing;
  }, [playing]);

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
    if (!audioRef.current || !loaded) return;
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      audioRef.current.play().catch(() => {});
      setPlaying(true);
      setStarted(true);
    }
  }, [playing, loaded]);

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
          width: started ? 36 : 48,
          height: started ? 36 : 48,
          borderRadius: '50%',
          backgroundColor: playing ? 'rgba(62, 72, 87, 0.7)' : 'rgba(240, 223, 173, 0.15)',
          backdropFilter: 'blur(8px)',
          border: started ? '1px solid rgba(104, 128, 151, 0.3)' : '2px solid rgba(240, 223, 173, 0.4)',
          cursor: loaded ? 'pointer' : 'wait',
          animation: !started && loaded ? 'bgm-glow 2s ease-in-out infinite' : 'none',
          transition: 'all 0.3s ease',
          opacity: loaded ? 1 : 0.4,
        }}
        title={!loaded ? 'BGM 로딩 중...' : playing ? 'BGM 끄기' : 'BGM 켜기'}
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
