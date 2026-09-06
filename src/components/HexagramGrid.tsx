import { motion } from 'motion/react';

export function HexagramGrid({
  results,
  compact = false,
}: {
  results: number[];
  compact?: boolean;
}) {
  const cell = compact ? 'w-3 h-3' : 'w-4 h-4';
  const gap = compact ? 'gap-2' : 'gap-2.5';
  const mb = compact ? 'mb-0' : 'mb-6';

  return (
    <div className={`grid grid-cols-6 ${gap} ${mb}`}>
      {[...Array(36)].map((_, i) => {
        const row = Math.floor(i / 6);
        const col = i % 6;
        const lineIndex = 5 - row;
        const isFilled = results[lineIndex] !== undefined;
        const isYang = results[lineIndex] === 1;
        const isYinPart = col < 2 || col > 3;
        const active = isFilled && (isYang || (results[lineIndex] === 0 && isYinPart));

        return (
          <motion.div
            key={i}
            initial={false}
            animate={{
              opacity: active ? [0.7, 1, 0.85] : 0.12,
              scale: active ? [0.95, 1.05, 1] : 1,
            }}
            transition={{
              duration: active ? 2.5 + (i % 5) * 0.3 : 0,
              repeat: active ? Infinity : 0,
              ease: 'easeInOut',
            }}
            className={`${cell} rounded-sm ${active ? 'hex-dot-glow' : 'bg-white/[0.06]'}`}
          />
        );
      })}
    </div>
  );
}
