import type { ParsedMessage } from "../types/chat";
import { median, MIN_DURATION_SAMPLE } from "./buckets";

export const sessionGapMinutes = 45;

export interface Session {
  start: Date;
  end: Date;
  starter: string;
  closer: string;
  messageCount: number;
  participants: string[];
}

function countable(messages: ParsedMessage[]): ParsedMessage[] {
  return [...messages]
    .filter((m) => m.lineType !== "event" && m.sender)
    .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
}

export function buildSessions(messages: ParsedMessage[], gapMinutes = sessionGapMinutes): Session[] {
  const rows = countable(messages);
  const sessions: Session[] = [];
  const gapMs = gapMinutes * 60 * 1000;
  for (const message of rows) {
    const last = sessions[sessions.length - 1];
    if (!last || message.timestamp.getTime() - last.end.getTime() > gapMs) {
      sessions.push({
        start: message.timestamp,
        end: message.timestamp,
        starter: message.sender as string,
        closer: message.sender as string,
        messageCount: 1,
        participants: [message.sender as string],
      });
    } else {
      last.end = message.timestamp;
      last.closer = message.sender as string;
      last.messageCount += 1;
      if (message.sender && !last.participants.includes(message.sender)) {
        last.participants.push(message.sender);
        last.participants.sort((a, b) => a.localeCompare(b));
      }
    }
  }
  return sessions;
}

export function sessionStarts(messages: ParsedMessage[]): { sender: string; n: number; share: number }[] {
  const sessions = buildSessions(messages);
  if (sessions.length === 0) return [];
  const counts = new Map<string, number>();
  for (const session of sessions) {
    counts.set(session.starter, (counts.get(session.starter) ?? 0) + 1);
  }
  const total = sessions.length;
  return [...counts.entries()]
    .map(([sender, n]) => ({ sender, n, share: n / total }))
    .sort((a, b) => b.n - a.n || a.sender.localeCompare(b.sender));
}

export function sessionStats(messages: ParsedMessage[]): {
  count: number;
  medianDurationSeconds: number | null;
  medianMessageCount: number | null;
  medianPeoplePerBurst: number | null;
} {
  const sessions = buildSessions(messages);
  const count = sessions.length;
  if (count < MIN_DURATION_SAMPLE) {
    return {
      count,
      medianDurationSeconds: null,
      medianMessageCount: null,
      medianPeoplePerBurst: null,
    };
  }
  return {
    count,
    medianDurationSeconds: median(
      sessions.map((s) => (s.end.getTime() - s.start.getTime()) / 1000),
    ),
    medianMessageCount: median(sessions.map((s) => s.messageCount)),
    medianPeoplePerBurst: median(sessions.map((s) => s.participants.length)),
  };
}

export function sessionClosers(messages: ParsedMessage[]): { sender: string; n: number; share: number }[] {
  const sessions = buildSessions(messages);
  if (sessions.length === 0) return [];
  const counts = new Map<string, number>();
  for (const session of sessions) {
    counts.set(session.closer, (counts.get(session.closer) ?? 0) + 1);
  }
  const total = sessions.length;
  return [...counts.entries()]
    .map(([sender, n]) => ({ sender, n, share: n / total }))
    .sort((a, b) => b.n - a.n || a.sender.localeCompare(b.sender));
}
