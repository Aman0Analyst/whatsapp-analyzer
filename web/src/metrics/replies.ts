import type { FilterState, ParsedMessage, ReplyEvent } from "../types/chat";
import { bucketStart, mean, median, p90, reduceDuration } from "./buckets";
import { hourInFilter } from "./filterMessages";

export interface Turn {
  sender: string;
  start: Date;
  end: Date;
}

function timed(messages: ParsedMessage[]): ParsedMessage[] {
  return [...messages].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
}

export function buildTurns(messages: ParsedMessage[]): Turn[] {
  const turns: Turn[] = [];
  for (const message of timed(messages)) {
    if (message.lineType === "event" || message.lineType === "deleted" || !message.sender) continue;
    const last = turns[turns.length - 1];
    if (last && last.sender === message.sender) {
      last.end = message.timestamp;
    } else {
      turns.push({ sender: message.sender, start: message.timestamp, end: message.timestamp });
    }
  }
  return turns;
}

/**
 * A reply is the gap from the previous speaker's last message to this speaker's
 * first message. A gap wider than the window is a new session, not a slow reply.
 */
export function buildReplies(messages: ParsedMessage[], windowMinutes: number): ReplyEvent[] {
  const turns = buildTurns(messages);
  const windowSeconds = windowMinutes * 60;
  const events: ReplyEvent[] = [];
  for (let i = 1; i < turns.length; i++) {
    const prev = turns[i - 1];
    const turn = turns[i];
    const delaySeconds = (turn.start.getTime() - prev.end.getTime()) / 1000;
    if (delaySeconds > windowSeconds) continue;
    events.push({ at: turn.start, delaySeconds, replier: turn.sender });
  }
  return events;
}

export function filterReplies(events: ReplyEvent[], filter: FilterState): ReplyEvent[] {
  return events.filter((event) => {
    if (filter.senders !== "all" && !filter.senders.includes(event.replier)) return false;
    if (filter.rangeStart && event.at.getTime() < filter.rangeStart.getTime()) return false;
    if (filter.rangeEnd && event.at.getTime() > filter.rangeEnd.getTime()) return false;
    if (!hourInFilter(event.at, filter)) return false;
    return true;
  });
}

export function replyTrend(
  events: ReplyEvent[],
  filter: FilterState,
): { t: Date; sender: string; seconds: number | null }[] {
  const kept = filterReplies(events, filter);
  const groups = new Map<string, { t: Date; sender: string; values: number[] }>();
  for (const event of kept) {
    const t = bucketStart(event.at, filter.grain);
    const key = `${t.getTime()}|${event.replier}`;
    const group = groups.get(key) ?? { t, sender: event.replier, values: [] };
    group.values.push(event.delaySeconds);
    groups.set(key, group);
  }
  return [...groups.values()]
    .map((group) => ({
      t: group.t,
      sender: group.sender,
      seconds: reduceDuration(group.values, filter.durationStat),
    }))
    .sort((a, b) => a.t.getTime() - b.t.getTime() || a.sender.localeCompare(b.sender));
}

/**
 * The same reply statistic for the later half of the visible stretch against
 * the earlier half, so the section can say "faster than before" in a sentence
 * rather than a second chart. The stretch is the filtered date range when one
 * is set, otherwise the span of the reply times themselves.
 */
export function replyVsPreviousPeriod(
  events: ReplyEvent[],
  filter: FilterState,
): { current: number | null; previous: number | null; deltaSeconds: number | null } | null {
  const kept = filterReplies(events, filter);
  if (kept.length === 0) return null;
  let earliest = Number.POSITIVE_INFINITY;
  let latest = Number.NEGATIVE_INFINITY;
  for (const event of kept) {
    const t = event.at.getTime();
    if (t < earliest) earliest = t;
    if (t > latest) latest = t;
  }
  const start = filter.rangeStart ? filter.rangeStart.getTime() : earliest;
  const end = filter.rangeEnd ? filter.rangeEnd.getTime() : latest;
  const midpoint = (start + end) / 2;
  const previousValues: number[] = [];
  const currentValues: number[] = [];
  for (const event of kept) {
    if (event.at.getTime() < midpoint) previousValues.push(event.delaySeconds);
    else currentValues.push(event.delaySeconds);
  }
  const previous = reduceDuration(previousValues, filter.durationStat);
  const current = reduceDuration(currentValues, filter.durationStat);
  return {
    current,
    previous,
    deltaSeconds: current !== null && previous !== null ? current - previous : null,
  };
}

export function replySummary(
  events: ReplyEvent[],
): { sender: string; n: number; medianSeconds: number; p90Seconds: number; meanSeconds: number }[] {
  const groups = new Map<string, number[]>();
  for (const event of events) {
    const list = groups.get(event.replier) ?? [];
    list.push(event.delaySeconds);
    groups.set(event.replier, list);
  }
  return [...groups.entries()]
    .map(([sender, values]) => ({
      sender,
      n: values.length,
      medianSeconds: median(values),
      p90Seconds: p90(values),
      meanSeconds: mean(values),
    }))
    .sort((a, b) => b.n - a.n || a.sender.localeCompare(b.sender));
}
