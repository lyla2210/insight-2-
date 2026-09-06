import { HexagramGrid } from './HexagramGrid';

export function ResultCard({
  question,
  results,
  count,
  isTossing,
  compact = false,
}: {
  question: string;
  results: number[];
  count: number;
  isTossing?: boolean;
  compact?: boolean;
}) {
  if (compact) {
    return (
      <div className="w-full flex flex-col items-center gap-3">
        <div className="w-full px-4 py-2.5 border border-white/10 rounded-2xl bg-white/5 text-[12px] text-center italic text-white/45 font-normal normal-case line-clamp-2">
          &ldquo;{question}&rdquo;
        </div>

        <div className="w-full bg-white/5 border border-white/10 rounded-[28px] px-6 py-5 flex flex-col items-center">
          <div className="mb-4 font-medium tracking-[0.35em] text-white/30 text-[10px] uppercase">
            Result
          </div>
          <HexagramGrid results={results} compact />
          <div className="mt-4 w-full flex justify-between items-end border-t border-white/5 pt-4">
            <div className="space-y-0.5">
              <div className="text-[10px] text-white/40 uppercase tracking-[0.2em] font-normal">
                Progress
              </div>
              <div className="text-2xl font-medium text-white/90 leading-none">{count}/6</div>
            </div>
            <div className="space-y-0.5 text-right">
              <div className="text-[10px] text-white/40 uppercase tracking-[0.2em] font-normal">
                State
              </div>
              <div className="text-base font-medium text-white/90 leading-none">
                {isTossing ? 'Rolling...' : count === 6 ? 'Done' : 'Waiting'}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="w-full px-6 py-4 border border-white/10 rounded-2xl mb-6 bg-white/5 text-sm text-center italic text-white/50 font-normal normal-case">
        &ldquo;{question}&rdquo;
      </div>

      <div className="w-full bg-white/5 border border-white/10 rounded-[40px] p-10 mb-6 flex flex-col items-center relative min-h-[320px]">
        <div className="mb-8 font-medium tracking-[0.4em] text-white/30 text-xs uppercase">
          Result
        </div>
        <HexagramGrid results={results} />
        <div className="mt-auto w-full flex justify-between items-end border-t border-white/5 pt-6">
          <div className="space-y-1">
            <div className="text-[10px] text-white/40 uppercase tracking-[0.2em] font-normal">
              Progress
            </div>
            <div className="text-3xl font-medium text-white/90 leading-none">{count}/6</div>
          </div>
          <div className="space-y-1 text-right">
            <div className="text-[10px] text-white/40 uppercase tracking-[0.2em] font-normal">
              State
            </div>
            <div className="text-xl font-medium text-white/90 leading-none">
              {isTossing ? 'Rolling...' : count === 6 ? 'Done' : 'Waiting'}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
