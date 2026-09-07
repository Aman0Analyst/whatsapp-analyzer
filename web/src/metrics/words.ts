import type { DurationStat, ParsedMessage } from "../types/chat";
import { reduceDuration } from "./buckets";

export function parseStopwords(text: string): Set<string> {
  return new Set(
    text
      .split(/\r?\n/)
      .map((line) => line.trim().toLowerCase())
      .filter((line) => line.length > 0),
  );
}

const ALPHANUMERIC = /^[\p{L}\p{N}]+$/u;
const NUMERIC = /^\p{N}+$/u;

// Same rule as reduce_and_filter_words in whatsapp_analyzer.py, so the CLI and
// the browser rank the same words for a given stop-word list.
function keepWord(word: string): boolean {
  return word.length > 1 && ALPHANUMERIC.test(word) && !NUMERIC.test(word);
}

export function topWords(
  messages: ParsedMessage[],
  stopwords: Set<string>,
  limit: number,
): { word: string; n: number }[] {
  const counts = new Map<string, number>();
  for (const message of messages) {
    if (message.lineType !== "chat") continue;
    for (const raw of message.words) {
      const word = raw.toLowerCase();
      if (!keepWord(word) || stopwords.has(word)) continue;
      counts.set(word, (counts.get(word) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([word, n]) => ({ word, n }))
    .sort((a, b) => b.n - a.n || a.word.localeCompare(b.word))
    .slice(0, limit);
}

export function wordsPerMessage(messages: ParsedMessage[], stat: DurationStat): number | null {
  const lengths = messages.filter((m) => m.lineType === "chat").map((m) => m.words.length);
  return reduceDuration(lengths, stat);
}
