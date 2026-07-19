// Human-irregular typewriter timing — ported verbatim from the funnel spec.
// DO NOT retune: every typed headline/bubble in the funnel shares this cadence.
const BASE = 30; // avg gap between keystrokes (ms)
const JITTER = 24; // random spread on top of BASE
const HESITATE_CHANCE = 0.05;
const HESITATE_EXTRA = 55;
const WORD_PAUSE = 32; // extra rest after a space
const CLAUSE_PAUSE = 100; // after ، , ؛ ; :
const CLAUSE_JITTER = 45;
const SENTENCE_PAUSE = 160; // after . ! ? ؟ …
const SENTENCE_JITTER = 70;
const NEWLINE_PAUSE = 175; // line break
const NEWLINE_JITTER = 55;
const CLAUSE_RE = /[،,؛;:]/;
const SENTENCE_RE = /[.!?؟…]/;

/** Delay (ms) before typing the next grapheme, given the one just typed. */
export function humanTypingDelay(prevChar) {
  const base = BASE + Math.random() * JITTER;
  if (!prevChar) return base;
  if (prevChar === "\n") return NEWLINE_PAUSE + Math.random() * NEWLINE_JITTER;
  if (SENTENCE_RE.test(prevChar)) return SENTENCE_PAUSE + Math.random() * SENTENCE_JITTER;
  if (CLAUSE_RE.test(prevChar)) return CLAUSE_PAUSE + Math.random() * CLAUSE_JITTER;
  if (prevChar === " ") return base + Math.random() * WORD_PAUSE;
  if (Math.random() < HESITATE_CHANCE) return base + HESITATE_EXTRA + Math.random() * 120;
  return base;
}

/** Reveal one char per tick: onTick(1..len), spaced by humanTypingDelay. Returns cancel(). */
export function typeHumanly(text, onTick, onDone, startDelayMs) {
  let timer = null;
  const step = (i) => {
    onTick(i);
    if (i >= text.length) {
      onDone?.();
      return;
    }
    timer = setTimeout(() => step(i + 1), humanTypingDelay(text[i - 1]));
  };
  if (text.length === 0) {
    onDone?.();
    return () => {};
  }
  timer = setTimeout(() => step(1), startDelayMs ?? humanTypingDelay(undefined));
  return () => {
    if (timer) clearTimeout(timer);
  };
}
