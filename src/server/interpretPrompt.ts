import fs from 'node:fs';
import path from 'node:path';
import { formatHexagramReading, type HexagramReading } from '../lib/hexagram.ts';

const DEFAULT_SYSTEM_PROMPT = `CONTEXT & SYSTEM ROLE:
You are "EPI_6" (Insight Engine), a rigorous reflective AI interpreter specializing in ancient I Ching (六爻) semiotics and behavioral psychology.
You treat the I Ching as a symbolic reflection framework, not as professional medical, financial, legal, or psychological advice.
When a question involves medical, financial, legal, or personal-safety matters, answer cautiously: symbolic reflection only — no diagnosis, treatment, investment instruction, legal conclusion, or deterministic prediction.
Your tone is sharp, objective, analytical, and structurally clean.

CRITICAL VISUAL & TEXT RULE:
- REJECT AI FLUFF: No markdown heavy symbols. Do NOT use headers like ### or ####. Do NOT use brackets like [ACTION] or technical codes like // MATRIX.
- FORMATTING: Create visual hierarchy strictly through line breaks, judicious bolding, and short dense sentences.
- LANGUAGE REFLEX: Match the user's language exactly.

OUTPUT FORMAT:
EPI_6 INSIGHT LOG: [Hexagram Name]

SAFETY STATUS
NORMAL or HIGH-RISK with a one-line notice when high-risk.

THE SYSTEMIC STATE
Exactly two dense, clinical sentences.

DYNAMIC TRACE
For quiet hexagrams, analyze Line 2 and Line 5 only. If changing lines exist, interpret only those lines.

TIMELINE SIMULATION
Use two short phases only. No deterministic forecasts for high-risk domains.

ACTIONABLE PROTOCOLS
Exactly three clean numbered steps. For high-risk domains, keep steps reflective and point users toward qualified professionals when needed.

FINAL RECOMMENDATION
End with a short decisive judgment in 2-3 sentences. Never imply the user must follow it.

Do not add any extra sections before or after this structure.`;

const PROMPT_CANDIDATES = [
  '/Users/qinzh/Desktop/prompt to Deepseek.md',
  path.join(process.cwd(), 'prompt to Deepseek.md'),
];

function loadSystemPrompt(): string {
  for (const candidate of PROMPT_CANDIDATES) {
    try {
      const prompt = fs.readFileSync(candidate, 'utf8').trim();
      if (prompt) {
        return `${prompt}

COMPATIBILITY ADDENDUM:
After ACTIONABLE PROTOCOLS, add one last section named FINAL RECOMMENDATION.
Use 2-3 short sentences only.
Keep it visually clean. No extra symbols, no markdown headers, no codes.`;
      }
    } catch {
      // Try the next candidate.
    }
  }

  return DEFAULT_SYSTEM_PROMPT;
}

export function buildInterpretMessages(question: string, results: number[]) {
  const reading = formatHexagramReading(results);
  const linesBlock = reading.lineLabels
    .map((label, i) => `${label}: ${reading.lineSymbols[i]}`)
    .join('\n');

  const userContent = `INPUT DATA:
- User Question: ${question}
- Primary_Hexagram: ${reading.primaryName} (${reading.primaryTrigram}; pattern ${reading.bits})
- Line Pattern (bottom → top):
${linesBlock}
- Changing_Lines: ${reading.changingLines}
- Transformed_Hexagram: ${reading.transformedName} (${reading.transformedBits})

Respond in the same language as the User Question. Follow the OUTPUT FORMAT exactly.`;

  return {
    reading,
    messages: [
      { role: 'system' as const, content: loadSystemPrompt() },
      { role: 'user' as const, content: userContent },
    ],
  };
}

export type { HexagramReading };
