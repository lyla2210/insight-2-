/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2, ChevronLeft, ChevronRight, Smartphone, Vibrate } from 'lucide-react';
import { useShake } from './hooks/useShake';
import { AppButton } from './components/AppButton';
import { HexagramLogo } from './components/HexagramLogo';
import { QuestionGuide } from './components/QuestionGuide';
import { ResultCard } from './components/ResultCard';
import { InterpretationPanel } from './components/InterpretationPanel';
import { CosmicBackground } from './components/CosmicBackground';
import { CalmBreathingPanel } from './components/CalmBreathingPanel';

type AppState = 'CONNECTION' | 'CALM' | 'GUIDE' | 'INPUT' | 'TOSSING' | 'INTERPRETING' | 'RESULT';

interface HexagramData {
  count: number;
  results: number[]; // 1 for Yang, 0 for Yin
}

function connectToastMessage(permission: string, insecure: boolean) {
  if (permission === 'granted') {
    return insecure
      ? 'Connected. Motion allowed — if shake fails on HTTP, use manual toss.'
      : 'Sensor activated. Shake mode ready.';
  }
  if (permission === 'denied') {
    return 'Connected. Motion sensor not authorized — use manual toss.';
  }
  return 'Connected successfully.';
}

export default function App() {
  const [appState, setAppState] = useState<AppState>('CONNECTION');
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(false);
  const [connectToast, setConnectToast] = useState<string | null>(null);
  const [question, setQuestion] = useState('');
  const [hexagram, setHexagram] = useState<HexagramData>({ count: 0, results: [] });
  const [isTossing, setIsTossing] = useState(false);
  const [lastLineResult, setLastLineResult] = useState<number | null>(null);
  const [interpretation, setInterpretation] = useState('');
  const [isInterpreting, setIsInterpreting] = useState(false);
  const [error, setError] = useState('');
  const [webShakeMode, setWebShakeMode] = useState(false);
  const interpretationAnchorRef = useRef<HTMLDivElement | null>(null);
  const tossLockRef = useRef(false);

  useEffect(() => {
    if (appState !== 'RESULT') return;
    const timer = window.setTimeout(() => {
      interpretationAnchorRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }, 220);
    return () => window.clearTimeout(timer);
  }, [appState]);

  useEffect(() => {
    if (!connectToast) return;
    const t = window.setTimeout(() => setConnectToast(null), 2800);
    return () => window.clearTimeout(t);
  }, [connectToast]);

  const proceedToGuide = () => setAppState('GUIDE');
  const proceedToCalm = () => setAppState('CALM');
  const proceedToInput = () => setAppState('INPUT');
  const startTossing = () => question.trim() && setAppState('TOSSING');

  const simulateToss = useCallback(() => {
    if (hexagram.count >= 6 || isTossing || tossLockRef.current) return;
    tossLockRef.current = true;
    setIsTossing(true);
    setLastLineResult(null);

    window.setTimeout(() => {
      const result = Math.random() > 0.5 ? 1 : 0;
      setHexagram((prev) => ({
        count: prev.count + 1,
        results: [...prev.results, result],
      }));
      setLastLineResult(result);
      setIsTossing(false);
      // Keep lock briefly so residual shake cannot double-fire
      window.setTimeout(() => {
        tossLockRef.current = false;
      }, 700);
    }, 900);
  }, [hexagram.count, isTossing]);

  const shakeEnabled =
    appState === 'TOSSING' && hexagram.count < 6 && !isTossing;

  const {
    isSupported: shakeSupported,
    permission: shakePermission,
    requestPermission: requestShakePermission,
    isListening: shakeListening,
    receivingMotion,
    insecureContext,
  } = useShake({
    enabled: shakeEnabled && webShakeMode,
    onShake: simulateToss,
    threshold: 7.5,
    settleThreshold: 2.2,
    cooldownMs: 2200,
  });

  const handleConnectDice = async () => {
    if (connecting) return;
    setConnecting(true);
    setWebShakeMode(true);

    const granted = await requestShakePermission();

    setTimeout(() => {
      setConnecting(false);
      setConnected(true);
      setConnectToast(
        connectToastMessage(granted ? 'granted' : 'denied', insecureContext),
      );
    }, 900);
  };

  const interpretHexagram = async () => {
    setError('');
    setInterpretation('');
    setIsInterpreting(true);
    setAppState('RESULT');

    try {
      const response = await fetch('/api/interpret', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, hexagram: hexagram.results }),
      });

      const contentType = response.headers.get('content-type') ?? '';

      if (!response.ok) {
        let message = `Request failed (${response.status})`;
        if (contentType.includes('application/json')) {
          const errData = await response.json().catch(() => ({}));
          if (typeof errData.error === 'string') message = errData.error;
        } else {
          const text = await response.text().catch(() => '');
          if (text) message = text.slice(0, 160);
        }
        throw new Error(message);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response stream');

      const decoder = new TextDecoder();
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        fullText += chunk;
        if (chunk) setInterpretation(fullText);
      }

      fullText += decoder.decode();
      if (!fullText.trim()) {
        throw new Error('Empty response from DeepSeek. Check API key or balance.');
      }

      setInterpretation(fullText);
      setIsInterpreting(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Interpretation failed.';
      console.error('[interpret]', err);
      setIsInterpreting(false);
      if (message.includes('DEEPSEEK_API_KEY')) {
        setError(
          'DEEPSEEK_API_KEY is not set. Add it to .env or .env.local (local), or to your host environment variables.',
        );
      } else {
        setError(message);
      }
      setAppState('TOSSING');
    }
  };

  const resetAll = () => {
    setAppState('CONNECTION');
    setConnected(false);
    setWebShakeMode(false);
    setConnectToast(null);
    setQuestion('');
    setHexagram({ count: 0, results: [] });
    setLastLineResult(null);
    setInterpretation('');
    setIsInterpreting(false);
    setError('');
    tossLockRef.current = false;
  };

  const nextLine = hexagram.count + 1;

  return (
    <div className="relative h-[100dvh] overflow-hidden bg-[var(--color-brand-bg)] text-slate-100 font-mono">
      <CosmicBackground />

      <AnimatePresence>
        {connectToast && (
          <motion.div
            key="connect-toast"
            initial={{ opacity: 0, y: -16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.96 }}
            className="fixed top-6 left-1/2 z-50 w-[min(92vw,28rem)] -translate-x-1/2"
          >
            <div className="rounded-2xl border border-white/15 bg-black/70 px-5 py-3.5 text-center shadow-[0_12px_40px_rgba(0,0,0,0.45)] backdrop-blur-md">
              <p className="text-[12px] font-medium tracking-[0.18em] uppercase text-white/90 normal-case">
                {connectToast}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-10 mx-auto flex h-full w-full max-w-lg flex-col px-6 pt-10 pb-6 md:px-10">
        <AnimatePresence mode="wait">
          {appState === 'CONNECTION' && (
            <motion.div
              key="conn"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex h-full flex-col overflow-hidden"
            >
              <div className="min-h-0 flex-1 overflow-hidden flex flex-col items-center justify-center text-center px-1">
                <HexagramLogo />
                <p className="mt-8 px-2 text-base md:text-lg font-medium tracking-tight text-white/90 max-w-sm leading-snug">
                  Connect The Dice, Raise A Question, Toss The Dice, Receive Insight.
                </p>
                {connected && (
                  <p className="mt-5 text-[10px] uppercase tracking-[0.3em] text-white/30 font-normal">
                    MODULE V.2.04 / FIRMWARE_READY
                  </p>
                )}
              </div>

              <div className="shrink-0 space-y-3 pt-4">
                {!connected ? (
                  <>
                    <AppButton
                      id="btn-connect"
                      onClick={() => void handleConnectDice()}
                      disabled={connecting}
                      variant="outline"
                      className="w-full border-white/20"
                    >
                      {connecting ? <Loader2 className="animate-spin w-5 h-5" /> : 'Connect Dice'}
                    </AppButton>
                    <AppButton onClick={proceedToCalm} variant="secondary" className="w-full">
                      Calm Mode
                    </AppButton>
                  </>
                ) : (
                  <>
                    <AppButton onClick={proceedToGuide} className="w-full">
                      Ask Now <ChevronRight className="w-5 h-5" />
                    </AppButton>
                    <AppButton onClick={proceedToCalm} variant="secondary" className="w-full">
                      Calm Mode
                    </AppButton>
                  </>
                )}
              </div>
            </motion.div>
          )}

          {appState === 'CALM' && (
            <motion.div
              key="calm"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="flex h-full flex-col"
            >
              <div className="min-h-0 flex-1 overflow-y-auto flex flex-col items-center justify-center py-4 scrollbar-hide">
                <HexagramLogo size="sm" glow={false} />
                <div className="mt-8 w-full">
                  <CalmBreathingPanel />
                </div>
              </div>
              <div className="shrink-0 pt-4">
                <AppButton
                  onClick={() => setAppState('CONNECTION')}
                  variant="primary"
                  className="w-full py-4 text-lg normal-case"
                >
                  <ChevronLeft className="w-5 h-5" />
                  Back
                </AppButton>
              </div>
            </motion.div>
          )}

          {appState === 'GUIDE' && (
            <motion.div
              key="guide"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full"
            >
              <QuestionGuide onContinue={proceedToInput} />
            </motion.div>
          )}

          {appState === 'INPUT' && (
            <motion.div
              key="input"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex h-full flex-col"
            >
              <div className="min-h-0 flex-1 overflow-y-auto pb-4 scrollbar-hide">
                <div className="flex justify-center">
                  <HexagramLogo size="sm" glow={false} />
                </div>
                <div className="mt-8">
                  <h2 className="text-xl font-medium text-white mb-2 tracking-tight normal-case">
                    What&apos;s On Your Mind Today?
                  </h2>
                  <p className="text-white/50 text-[14px] mb-4 leading-relaxed normal-case font-normal">
                    Describe your situation or decision in 1–2 sentences. Be specific.
                  </p>
                  <textarea
                    id="question-input"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="Type your question here..."
                    className="w-full h-[min(36vh,240px)] bg-white/5 border border-white/10 rounded-[28px] p-6 text-base focus:outline-none focus:border-white/30 transition-all resize-none placeholder:text-white/15 leading-relaxed normal-case font-normal"
                  />
                  <div className="mt-4 p-4 rounded-2xl border border-white/10 bg-white/[0.03] text-[13px] text-white/45 leading-relaxed normal-case font-normal">
                    <p className="font-medium text-white/60 mb-2">Example:</p>
                    <p className="italic">
                      &ldquo;Should I accept the relocation offer or stay where I am?&rdquo;
                    </p>
                  </div>
                </div>
              </div>
              <div className="shrink-0 pt-3">
                <AppButton
                  onClick={startTossing}
                  disabled={!question.trim()}
                  variant="outline"
                  className="w-full border-white/20"
                >
                  Send
                </AppButton>
              </div>
            </motion.div>
          )}

          {appState === 'TOSSING' && (
            <motion.div
              key="toss"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex h-full flex-col overflow-hidden"
            >
              <div className="min-h-0 flex-1 overflow-hidden flex flex-col items-center pt-1">
                <div className="w-full shrink-0 flex flex-col items-center gap-2 mb-3">
                  {webShakeMode && hexagram.count < 6 ? (
                    shakePermission === 'denied' || shakePermission === 'prompt' ? (
                      <AppButton
                        onClick={() => void requestShakePermission()}
                        variant="secondary"
                        className="w-full py-3 text-sm"
                      >
                        <Vibrate className="w-4 h-4" />
                        {shakePermission === 'denied'
                          ? 'Re-authorize Motion & Orientation'
                          : 'Enable Motion & Orientation'}
                      </AppButton>
                    ) : shakeListening || shakeSupported ? (
                      <motion.div
                        animate={{ y: [0, -3, 0] }}
                        transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
                        className="flex flex-col items-center gap-1.5 text-white/55"
                      >
                        <Smartphone className="w-5 h-5" />
                        <p className="text-[12px] font-medium tracking-[0.18em] uppercase text-center text-white/75">
                          {isTossing
                            ? 'Casting…'
                            : lastLineResult != null && hexagram.count < 6
                              ? `Shake again · Line ${nextLine} of 6`
                              : 'Shake your phone to cast'}
                        </p>
                        {lastLineResult != null && !isTossing && (
                          <p className="text-[12px] text-white/55 normal-case tracking-wide font-normal">
                            Line {hexagram.count}: {lastLineResult === 1 ? 'Yang ———' : 'Yin — —'}
                          </p>
                        )}
                        {!receivingMotion && shakeListening && (
                          <p className="text-[10px] text-amber-200/70 normal-case tracking-wide text-center max-w-xs leading-relaxed font-normal">
                            Waiting for sensor… or tap below.
                          </p>
                        )}
                      </motion.div>
                    ) : (
                      <p className="text-center text-[11px] text-white/40 tracking-widest font-normal">
                        Shake not supported. Tap below.
                      </p>
                    )
                  ) : hexagram.count < 6 ? (
                    <p className="text-[12px] font-medium tracking-[0.18em] uppercase text-white/60 text-center">
                      Cast your hexagram
                    </p>
                  ) : (
                    <p className="text-[12px] font-medium tracking-[0.18em] uppercase text-white/60 text-center">
                      Hexagram complete
                    </p>
                  )}
                </div>

                <div className="w-full min-h-0 flex-1 flex items-center">
                  <ResultCard
                    question={question}
                    results={hexagram.results}
                    count={hexagram.count}
                    isTossing={isTossing}
                    compact
                  />
                </div>

                {error && (
                  <div className="mt-2 w-full shrink-0 px-3 py-2 rounded-2xl border border-amber-500/40 bg-amber-500/10 text-amber-200/90 text-[11px] leading-relaxed tracking-wide text-left font-normal">
                    {error}
                  </div>
                )}
              </div>

              <div className="shrink-0 pt-3">
                {hexagram.count < 6 ? (
                  <AppButton
                    onClick={simulateToss}
                    disabled={isTossing}
                    variant="outline"
                    className="w-full border-white/20 py-4 text-base"
                  >
                    {isTossing ? 'Casting…' : 'or tap here'}
                  </AppButton>
                ) : (
                  <AppButton
                    onClick={() => void interpretHexagram()}
                    variant="primary"
                    className="w-full py-4 text-lg"
                  >
                    View Truth
                  </AppButton>
                )}
              </div>
            </motion.div>
          )}

          {appState === 'RESULT' && (
            <motion.div
              key="insight"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex h-full flex-col"
            >
              <div className="min-h-0 flex-1 overflow-y-auto pb-4 px-1 scrollbar-hide">
                <div className="flex justify-center">
                  <HexagramLogo size="sm" glow={false} />
                </div>
                <div className="mt-4">
                  <ResultCard question={question} results={hexagram.results} count={6} />
                </div>
                <div
                  ref={interpretationAnchorRef}
                  className="mt-8 border-t border-white/10 pt-8 scroll-mt-6"
                >
                  <InterpretationPanel raw={interpretation} thinking={isInterpreting} />
                </div>
              </div>
              <div className="shrink-0 pt-3">
                <AppButton
                  onClick={resetAll}
                  variant="primary"
                  className="w-full py-4 text-lg normal-case"
                >
                  Try Again
                </AppButton>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
