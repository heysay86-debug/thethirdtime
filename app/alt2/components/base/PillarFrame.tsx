'use client';

import { motion } from 'framer-motion';

interface PillarFrameProps {
  isOpen: boolean;
}

export default function PillarFrame({ isOpen }: PillarFrameProps) {
  const pillarWidth = 30;
  const borderHeight = 4;
  const borderColor = '#835b33';

  return (
    <div
      className="fixed inset-0 flex justify-center"
      style={{ zIndex: 50, pointerEvents: 'none' }}
    >
      <div className="relative w-full h-full" style={{ maxWidth: 440 }}>
        {/* 상단 보더 라인 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: isOpen ? 1 : 0 }}
          transition={{ duration: 1.0, delay: 0.3 }}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: borderHeight,
            background: `linear-gradient(to bottom, ${borderColor}, ${borderColor}dd)`,
          }}
        />

        {/* 하단 보더 라인 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: isOpen ? 1 : 0 }}
          transition={{ duration: 1.0, delay: 0.3 }}
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: borderHeight,
            background: `linear-gradient(to top, ${borderColor}, ${borderColor}dd)`,
          }}
        />

        {/* 좌측 기둥 — 중앙에서 좌측으로 슬라이드 + 디졸브 */}
        <motion.div
          initial={{ opacity: 0, x: 'calc(220px - 15px)' }}
          animate={{
            opacity: isOpen ? 1 : 0,
            x: isOpen ? 0 : 'calc(220px - 15px)',
          }}
          transition={{ duration: 1.2, ease: [0.25, 0.46, 0.45, 0.94] }}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: pillarWidth,
            height: '100%',
          }}
        >
          <img
            src="/background/poll.webp"
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'fill' }}
          />
        </motion.div>

        {/* 우측 기둥 — 중앙에서 우측으로 슬라이드 + 디졸브 */}
        <motion.div
          initial={{ opacity: 0, x: 'calc(-220px + 15px)' }}
          animate={{
            opacity: isOpen ? 1 : 0,
            x: isOpen ? 0 : 'calc(-220px + 15px)',
          }}
          transition={{ duration: 1.2, ease: [0.25, 0.46, 0.45, 0.94] }}
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: pillarWidth,
            height: '100%',
          }}
        >
          <img
            src="/background/poll.webp"
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'fill', transform: 'scaleX(-1)' }}
          />
        </motion.div>
      </div>
    </div>
  );
}
