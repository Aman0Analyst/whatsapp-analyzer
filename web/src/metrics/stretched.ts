import type { ParsedMessage } from "../types/chat";

const LETTER = /\p{L}/u;
const MAX_QUERY = 64;

/** Lowercase letters only, with consecutive identical letters collapsed to one. */
export function collapseLetterRuns(raw: string): string {
  let previous = "";
  let out = "";
  for (const char of raw.toLowerCase()) {
    if (!LETTER.test(char)) continue;
    if (char === previous) continue;
    out += char;
    previous = char;
  }
  return out;
}

function hasStretchedRun(raw: string): boolean {
  let previous = "";
  let run = 0;
  for (const char of raw.toLowerCase()) {
    if (!LETTER.test(char)) {
      previous = "";
      run = 0;
      continue;
    }
    if (char === previous) {
      run += 1;
      if (run >= 3) return true;
    } else {
      previous = char;
      run = 1;
    }
  }
  return false;
}

export interface StretchedVariant {
  word: string;
  n: number;
}

export interface StretchedSearch {
  query: string;
  collapsed: string;
  total: number;
  variants: StretchedVariant[];
}

/**
 * Tokens on chat lines whose collapsed letter-runs match the query, and that
 * actually stretch a letter (3+ in a row). The query is never compiled as regex.
 */
export function findStretchedWords(messages: ParsedMessage[], query: string): StretchedSearch {
  const trimmed = query.trim().slice(0, MAX_QUERY);
  const collapsed = collapseLetterRuns(trimmed);
  if (collapsed.length === 0) {
    return { query: trimmed, collapsed: "", total: 0, variants: [] };
  }

  const counts = new Map<string, number>();
  for (const message of messages) {
    if (message.lineType !== "chat") continue;
    for (const raw of message.words) {
      if (collapseLetterRuns(raw) !== collapsed) continue;
      if (!hasStretchedRun(raw)) continue;
      const word = raw.toLowerCase();
      counts.set(word, (counts.get(word) ?? 0) + 1);
    }
  }

  const variants = [...counts.entries()]
    .map(([word, n]) => ({ word, n }))
    .sort((a, b) => b.n - a.n || a.word.localeCompare(b.word));
  const total = variants.reduce((sum, row) => sum + row.n, 0);
  return { query: trimmed, collapsed, total, variants };
}
