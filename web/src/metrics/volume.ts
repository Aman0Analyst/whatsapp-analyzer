import type { ParsedMessage, TimeGrain } from "../types/chat";
import { bucketStart, enumerateBuckets } from "./buckets";

function countable(messages: ParsedMessage[]): ParsedMessage[] {
  return messages.filter((m) => m.lineType !== "event");
}

export function messageCount(messages: ParsedMessage[]): number {
  return countable(messages).length;
}

export function uniqueSenders(messages: ParsedMessage[]): string[] {
  const names = new Set<string>();
  for (const message of countable(messages)) {
    if (message.sender) names.add(message.sender);
  }
  return [...names].sort((a, b) => a.localeCompare(b));
}

/** First and last timestamp, events included, for the "Entire export" strip. */
export function dateSpan(messages: ParsedMessage[]): { start: Date; end: Date } | null {
  if (messages.length === 0) return null;
  let start = messages[0].timestamp;
  let end = messages[0].timestamp;
  for (const message of messages) {
    if (message.timestamp.getTime() < start.getTime()) start = message.timestamp;
    if (message.timestamp.getTime() > end.getTime()) end = message.timestamp;
  }
  return { start, end };
}

export function messagesPerDay(messages: ParsedMessage[]): number {
  const rows = countable(messages);
  if (rows.length === 0) return 0;
  const span = dateSpan(rows);
  if (!span) return 0;
  const days =
    (bucketStart(span.end, "day").getTime() - bucketStart(span.start, "day").getTime()) /
      86_400_000 +
    1;
  return rows.length / days;
}

export function volumeTrend(
  messages: ParsedMessage[],
  grain: TimeGrain,
): { t: Date; n: number }[] {
  const rows = countable(messages);
  if (rows.length === 0) return [];
  const span = dateSpan(rows);
  if (!span) return [];
  const buckets = enumerateBuckets(span.start, span.end, grain);
  const counts = new Map<number, number>();
  for (const t of buckets) counts.set(t.getTime(), 0);
  for (const message of rows) {
    const key = bucketStart(message.timestamp, grain).getTime();
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return buckets.map((t) => ({ t, n: counts.get(t.getTime()) ?? 0 }));
}

export function volumeTrendBySender(
  messages: ParsedMessage[],
  grain: TimeGrain,
): { sender: string; points: { t: Date; n: number }[] }[] {
  const senders = uniqueSenders(messages);
  const rows = countable(messages);
  if (rows.length === 0) return [];
  const span = dateSpan(rows);
  if (!span) return [];
  const axis = enumerateBuckets(span.start, span.end, grain);
  return senders.map((sender) => {
    const counts = new Map<number, number>();
    for (const t of axis) counts.set(t.getTime(), 0);
    for (const message of rows) {
      if (message.sender !== sender) continue;
      const key = bucketStart(message.timestamp, grain).getTime();
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return { sender, points: axis.map((t) => ({ t, n: counts.get(t.getTime()) ?? 0 })) };
  });
}

export function senderRank(messages: ParsedMessage[]): { sender: string; n: number; share: number }[] {
  const rows = countable(messages);
  const counts = new Map<string, number>();
  for (const message of rows) {
    if (!message.sender) continue;
    counts.set(message.sender, (counts.get(message.sender) ?? 0) + 1);
  }
  const total = [...counts.values()].reduce((a, b) => a + b, 0);
  if (total === 0) return [];
  return [...counts.entries()]
    .map(([sender, n]) => ({ sender, n, share: n / total }))
    .sort((a, b) => b.n - a.n || a.sender.localeCompare(b.sender));
}
