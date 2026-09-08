import type { DurationStat, ParsedMessage } from "../types/chat";
import { bucketStart, reduceDuration } from "./buckets";

const DAY_MS = 86_400_000;

function countable(messages: ParsedMessage[]): ParsedMessage[] {
  return messages.filter((m) => m.lineType !== "event");
}

// Word metrics read the same source as words.ts: message.words on chat lines.
function chatLinesBySender(messages: ParsedMessage[]): Map<string, ParsedMessage[]> {
  const bySender = new Map<string, ParsedMessage[]>();
  for (const message of messages) {
    if (message.lineType !== "chat" || !message.sender) continue;
    const rows = bySender.get(message.sender);
    if (rows) rows.push(message);
    else bySender.set(message.sender, [message]);
  }
  return bySender;
}

export function talkShareByWords(
  messages: ParsedMessage[],
): { sender: string; words: number; share: number }[] {
  const counts = [...chatLinesBySender(messages).entries()].map(([sender, rows]) => ({
    sender,
    words: rows.reduce((sum, m) => sum + m.words.length, 0),
  }));
  const total = counts.reduce((sum, row) => sum + row.words, 0);
  if (total === 0) return [];
  return counts
    .map((row) => ({ ...row, share: row.words / total }))
    .sort((a, b) => b.words - a.words || a.sender.localeCompare(b.sender));
}

export function wordsPerMessageBySender(
  messages: ParsedMessage[],
  stat: DurationStat,
): { sender: string; value: number | null }[] {
  return [...chatLinesBySender(messages).entries()]
    .map(([sender, rows]) => ({
      sender,
      value: reduceDuration(
        rows.map((m) => m.words.length),
        stat,
      ),
    }))
    .sort((a, b) => a.sender.localeCompare(b.sender));
}

export function activeAndSilentDays(
  messages: ParsedMessage[],
): { activeDays: number; silentDays: number; spanDays: number } {
  const rows = countable(messages);
  if (rows.length === 0) return { activeDays: 0, silentDays: 0, spanDays: 0 };
  const days = new Set<number>();
  let first = Number.POSITIVE_INFINITY;
  let last = Number.NEGATIVE_INFINITY;
  for (const message of rows) {
    const day = bucketStart(message.timestamp, "day").getTime();
    days.add(day);
    if (day < first) first = day;
    if (day > last) last = day;
  }
  // Rounded because a span crossing a DST change is not a whole number of ms days.
  const spanDays = Math.round((last - first) / DAY_MS) + 1;
  return { activeDays: days.size, silentDays: spanDays - days.size, spanDays };
}

export function longestSilenceSeconds(messages: ParsedMessage[]): number | null {
  const times = countable(messages)
    .map((m) => m.timestamp.getTime())
    .sort((a, b) => a - b);
  if (times.length < 2) return null;
  let longest = 0;
  for (let i = 1; i < times.length; i += 1) {
    const gap = times[i] - times[i - 1];
    if (gap > longest) longest = gap;
  }
  return longest / 1000;
}
