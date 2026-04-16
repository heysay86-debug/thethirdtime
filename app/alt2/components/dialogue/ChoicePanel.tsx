'use client';

import { motion } from 'framer-motion';

interface Choice {
  label: string;
  action: string;
  style?: 'primary' | 'secondary';
}

interface ChoicePanelProps {
  choices: Choice[];
  onSelect: (action: string) => void;
}

export default function ChoicePanel({ choices, onSelect }: ChoicePanelProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="flex flex-col gap-2 w-full"
    >
      {choices.map((choice, i) => {
        const isPrimary = choice.style !== 'secondary';
        return (
          <button
            key={i}
            onClick={() => onSelect(choice.action)}
            className="w-full py-3 text-sm font-semibold transition-all"
            style={{
              borderRadius: 16,
              backgroundColor: isPrimary ? '#dde1e5' : 'rgba(104, 128, 151, 0.25)',
              color: isPrimary ? '#3e4857' : '#dde1e5',
              boxShadow: isPrimary ? '0 0 16px rgba(221, 225, 229, 0.3)' : 'none',
            }}
          >
            {choice.label}
          </button>
        );
      })}
    </motion.div>
  );
}
