import { motion } from 'motion/react';
import { useMemo } from 'react';

const STAR_COUNT = 88;
const RING_STARS = 28;

function seededStar(i: number) {
  const n = Math.sin(i * 12.9898) * 43758.5453;
  const frac = n - Math.floor(n);
  return frac;
}

export function CosmicBackground() {
  const stars = useMemo(
    () =>
      Array.from({ length: STAR_COUNT }, (_, i) => ({
        id: i,
        left: seededStar(i) * 100,
        top: seededStar(i + 40) * 100,
        size: 1 + seededStar(i + 80) * 2.2,
        delay: seededStar(i + 120) * 6,
        duration: 4 + seededStar(i + 160) * 6,
        opacity: 0.22 + seededStar(i + 200) * 0.48,
        driftX: (seededStar(i + 240) - 0.5) * 18,
        driftY: 6 + seededStar(i + 280) * 14,
      })),
    [],
  );

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {/* soft mystical washes */}
      <motion.div
        className="absolute -top-[22%] left-1/2 h-[72vw] w-[72vw] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(100,130,190,0.12)_0%,transparent_70%)]"
        animate={{ opacity: [0.28, 0.45, 0.28], scale: [1, 1.05, 1] }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-[-12%] right-[-18%] h-[58vw] w-[58vw] rounded-full bg-[radial-gradient(circle,rgba(140,160,220,0.08)_0%,transparent_72%)]"
        animate={{ opacity: [0.18, 0.32, 0.18], x: [0, -24, 0] }}
        transition={{ duration: 28, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* floating field stars */}
      {stars.map((star) => (
        <motion.span
          key={star.id}
          className="absolute rounded-full bg-[#e4ecff]"
          style={{
            left: `${star.left}%`,
            top: `${star.top}%`,
            width: star.size,
            height: star.size,
            boxShadow:
              star.size > 2
                ? '0 0 8px rgba(190,210,255,0.45), 0 0 16px rgba(140,170,255,0.18)'
                : '0 0 4px rgba(180,200,255,0.3)',
          }}
          animate={{
            opacity: [star.opacity * 0.45, star.opacity, star.opacity * 0.45],
            x: [0, star.driftX, 0],
            y: [0, -star.driftY, 0],
            scale: [1, 1.15, 1],
          }}
          transition={{
            duration: star.duration,
            delay: star.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}

      {/* upper orbital rings — present but subdued */}
      <div className="absolute -top-6 left-1/2 h-[460px] w-[160%] -translate-x-1/2 opacity-[0.58] md:w-full">
        <motion.svg
          viewBox="0 0 1000 460"
          className="h-full w-full"
          animate={{ rotate: [0, 4, -4, 0] }}
          transition={{ duration: 36, repeat: Infinity, ease: 'easeInOut' }}
        >
          <defs>
            <filter id="ring-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="1.4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <ellipse
            cx="500"
            cy="-40"
            rx="340"
            ry="260"
            fill="none"
            stroke="#c8d6f0"
            strokeWidth="0.7"
            strokeDasharray="4 12"
            opacity="0.22"
          />
          <ellipse
            cx="500"
            cy="-40"
            rx="410"
            ry="310"
            fill="none"
            stroke="#d0dcf5"
            strokeWidth="1"
            opacity="0.28"
            filter="url(#ring-glow)"
          />
          <ellipse
            cx="500"
            cy="-40"
            rx="490"
            ry="365"
            fill="none"
            stroke="#e8eef8"
            strokeWidth="1.35"
            opacity="0.38"
            filter="url(#ring-glow)"
          />
          <ellipse
            cx="500"
            cy="-40"
            rx="560"
            ry="410"
            fill="none"
            stroke="#b8c8e8"
            strokeWidth="0.6"
            strokeDasharray="2 14"
            opacity="0.16"
          />

          <motion.g
            animate={{ rotate: 360 }}
            transition={{ duration: 100, repeat: Infinity, ease: 'linear' }}
            style={{ originX: '500px', originY: '-40px' }}
          >
            {Array.from({ length: RING_STARS }, (_, i) => {
              const angle = (i * (360 / RING_STARS)) * (Math.PI / 180);
              const x = 500 + 490 * Math.cos(angle);
              const y = -40 + 365 * Math.sin(angle);
              const big = i % 4 === 0;
              return (
                <motion.circle
                  key={i}
                  cx={x}
                  cy={y}
                  r={big ? 3.2 : 1.6}
                  fill="#e4ecff"
                  animate={{ opacity: [0.15, 0.55, 0.15] }}
                  transition={{ duration: 3.6, repeat: Infinity, delay: i * 0.12 }}
                />
              );
            })}
          </motion.g>

          <motion.g
            animate={{ rotate: -360 }}
            transition={{ duration: 140, repeat: Infinity, ease: 'linear' }}
            style={{ originX: '500px', originY: '-40px' }}
          >
            {Array.from({ length: 18 }, (_, i) => {
              const angle = (i * (360 / 18)) * (Math.PI / 180);
              const x = 500 + 410 * Math.cos(angle);
              const y = -40 + 310 * Math.sin(angle);
              return (
                <motion.circle
                  key={`inner-${i}`}
                  cx={x}
                  cy={y}
                  r="1.4"
                  fill="#c8d6f0"
                  animate={{ opacity: [0.12, 0.4, 0.12] }}
                  transition={{ duration: 4.2, repeat: Infinity, delay: i * 0.18 }}
                />
              );
            })}
          </motion.g>
        </motion.svg>
      </div>

      {/* lower slow ring — whisper only */}
      <div className="absolute bottom-[-18%] left-1/2 h-[320px] w-[140%] -translate-x-1/2 opacity-25">
        <motion.svg
          viewBox="0 0 1000 400"
          className="h-full w-full"
          animate={{ rotate: [0, -5, 5, 0] }}
          transition={{ duration: 42, repeat: Infinity, ease: 'easeInOut' }}
        >
          <ellipse
            cx="500"
            cy="320"
            rx="440"
            ry="160"
            fill="none"
            stroke="#c0d0ea"
            strokeWidth="0.6"
            opacity="0.35"
          />
          <motion.g
            animate={{ rotate: 360 }}
            transition={{ duration: 130, repeat: Infinity, ease: 'linear' }}
            style={{ originX: '500px', originY: '320px' }}
          >
            {Array.from({ length: 16 }, (_, i) => {
              const angle = (i * (360 / 16)) * (Math.PI / 180);
              const x = 500 + 440 * Math.cos(angle);
              const y = 320 + 160 * Math.sin(angle);
              return <circle key={i} cx={x} cy={y} r="1.2" fill="#d0dcf0" opacity="0.35" />;
            })}
          </motion.g>
        </motion.svg>
      </div>
    </div>
  );
}
