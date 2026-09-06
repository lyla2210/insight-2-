import { useEffect, useState } from 'react';
import { motion } from 'motion/react';

type BreathPhase = 'inhale' | 'hold' | 'exhale';

const PHASES: { id: BreathPhase; label: string; seconds: number }[] = [
  { id: 'inhale', label: 'Inhale', seconds: 4 },
  { id: 'hold', label: 'Hold', seconds: 7 },
  { id: 'exhale', label: 'Exhale', seconds: 8 },
];

const CYCLE = 19;
const TIMES = [0, 4 / CYCLE, 11 / CYCLE, 1];

export function CalmBreathingPanel() {
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(PHASES[0].seconds);
  const phase = PHASES[phaseIndex];

  useEffect(() => {
    const startedAt = Date.now();

    const tick = () => {
      const elapsed = ((Date.now() - startedAt) / 1000) % CYCLE;
      let nextIndex = 0;
      let remaining = 0;

      if (elapsed < 4) {
        nextIndex = 0;
        remaining = Math.ceil(4 - elapsed);
      } else if (elapsed < 11) {
        nextIndex = 1;
        remaining = Math.ceil(11 - elapsed);
      } else {
        nextIndex = 2;
        remaining = Math.ceil(CYCLE - elapsed);
      }

      setPhaseIndex(nextIndex);
      setSecondsLeft(Math.max(1, remaining));
    };

    tick();
    const id = window.setInterval(tick, 200);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="flex w-full flex-col items-center gap-8">
      <div className="text-center normal-case space-y-2">
        <p className="text-[12px] tracking-[0.32em] uppercase text-white/35 font-normal">Calm Mode</p>
        <p className="text-white/70 text-[15px] font-medium tracking-wide">
          {phase.label}
        </p>
        <p className="text-5xl font-medium text-white tabular-nums leading-none">{secondsLeft}</p>
        <p className="text-white/40 text-[13px] font-normal">
          Inhale 4 · Hold 7 · Exhale 8
        </p>
      </div>

      <div className="rounded-[36px] border border-white/10 bg-white/[0.03] px-8 py-10 md:px-12 md:py-12 shadow-[0_0_40px_rgba(255,255,255,0.04)]">
        <div className="grid grid-cols-6 gap-3.5 md:gap-4">
          {[...Array(36)].map((_, i) => {
            const delay = (i % 6) * 0.08 + Math.floor(i / 6) * 0.03;
            return (
              <motion.div
                key={i}
                className="w-4 h-4 md:w-5 md:h-5 rounded-sm hex-dot-glow"
                animate={{
                  opacity: [0.06, 0.92, 0.92, 0.08],
                  scale: [0.92, 1.02, 1.02, 0.95],
                }}
                transition={{
                  duration: CYCLE,
                  times: TIMES,
                  repeat: Infinity,
                  repeatType: 'loop',
                  ease: 'easeInOut',
                  delay,
                }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
