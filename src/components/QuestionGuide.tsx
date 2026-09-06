import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown } from 'lucide-react';
import { HexagramLogo } from './HexagramLogo';
import { AppButton } from './AppButton';

export function QuestionGuide({ onContinue }: { onContinue: () => void }) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [showScrollHint, setShowScrollHint] = useState(true);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const update = () => {
      const remaining = el.scrollHeight - el.scrollTop - el.clientHeight;
      setShowScrollHint(remaining > 28);
    };

    update();
    el.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      el.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex h-full w-full max-w-md flex-col"
    >
      <div className="relative min-h-0 flex-1">
        <div
          ref={scrollRef}
          className="h-full overflow-y-auto px-1 pb-10 scrollbar-hide"
        >
          <div className="flex flex-col items-center">
            <HexagramLogo size="sm" glow={false} />
          </div>

          <div className="mt-8 space-y-6 text-left">
            <h2 className="text-2xl font-medium text-white tracking-tight normal-case">
              Before You Start...
            </h2>

            <div className="space-y-3 text-white/85 text-[15px] leading-relaxed normal-case font-normal">
              <p className="font-medium text-white">
                Focus On Specific Contexts, Reject Vagueness.
              </p>
              <p className="font-medium text-white">
                Seek Actionable Insights, Not Fate Prophecies.
              </p>
              <p>Formulate Your Question As A Yes/No Or Choice-Based Query.</p>
            </div>

            <div className="space-y-2 text-[14px] text-white/70 normal-case font-normal leading-relaxed">
              <p className="font-medium text-white/90">Guidelines:</p>
              <ul className="space-y-1 list-none pl-0">
                <li>— Be Specific About The Decision You&apos;re Facing</li>
                <li>— Include The Options If It&apos;s A Choice</li>
                <li>— Focus On What YOU Can Do, Not What Others Will Do</li>
              </ul>
            </div>

            <div className="space-y-2 text-[14px] normal-case font-normal leading-relaxed pb-2">
              <p className="font-medium text-white/90">Examples:</p>
              <p className="text-white/75">
                ✓ Which Apartment Should I Choose: The Downtown One Or The Suburban One?
              </p>
              <p className="text-white/75">✓ Is Now The Right Time To Ask For A Promotion?</p>
              <p className="text-white/75">
                ✓ Should I Accept The Relocation Offer Or Stay Where I Am?
              </p>
              <p className="text-white/40">✗ Will I Be Rich? (Too Vague)</p>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {showScrollHint && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col items-center gap-1 bg-gradient-to-t from-[var(--color-brand-bg)] via-[var(--color-brand-bg)]/90 to-transparent pb-1 pt-8"
            >
              <p className="text-[10px] font-normal tracking-[0.22em] uppercase text-white/45">
                Scroll for more
              </p>
              <motion.div
                animate={{ y: [0, 5, 0] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
              >
                <ChevronDown className="h-4 w-4 text-white/50" />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="shrink-0 pt-3 pb-1">
        <AppButton onClick={onContinue} className="w-full py-4 text-base normal-case">
          Got It. Ask Now
        </AppButton>
      </div>
    </motion.div>
  );
}
