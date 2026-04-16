'use client';

import { AnimatePresence, motion } from 'framer-motion';

interface PortraitProps {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeMap = { sm: 48, md: 80, lg: 110 };

export default function Portrait({ name, size = 'md', className = '' }: PortraitProps) {
  const px = sizeMap[size];

  return (
    <div
      className={`flex-shrink-0 overflow-hidden ${className}`}
      style={{
        width: px,
        height: px,
        background: 'transparent',
      }}
    >
      <AnimatePresence mode="wait">
        <motion.img
          key={name}
          src={`/character/${name}.svg`}
          alt={name}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'top center',
          }}
        />
      </AnimatePresence>
    </div>
  );
}
