'use client';

import { AnimatePresence, motion } from 'framer-motion';

type Direction = 'front' | 'back' | 'left' | 'right';

interface DotCharacterProps {
  direction?: Direction;
  size?: number;
  x?: number;
  y?: number;
  bounce?: boolean;
  visible?: boolean;
}

export default function DotCharacter({
  direction = 'front',
  size = 10,
  x = 50,
  y = 60,
  bounce = true,
  visible = true,
}: DotCharacterProps) {
  return (
    <>
      <style jsx global>{`
        @keyframes bounce-gentle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        .animate-bounce-gentle {
          animation: bounce-gentle 1.2s ease-in-out infinite;
        }
      `}</style>
      <AnimatePresence>
        {visible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.4 }}
            className="absolute"
            style={{
              left: `${x}%`,
              top: `${y}%`,
              transform: 'translate(-50%, -50%)',
              zIndex: 2,
              pointerEvents: 'none',
              transition: 'left 1.2s ease, top 1.2s ease',
            }}
          >
            <img
              src={`/character/${direction}.png`}
              alt="복길"
              style={{
                height: `${size}vh`,
                width: 'auto',
                imageRendering: 'pixelated',
                filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.5))',
              }}
              className={bounce ? 'animate-bounce-gentle' : ''}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
