import type { ParsedMessage } from "../types/chat";

// Monday, so "10:00" style fixtures land on the first weekday row.
const BASE_DATE = "2024-01-01";

/** Accepts "2024-03-05 22:27", "2024-03-05T22:27:10" or a bare "10:00". */
export function at(when: string): Date {
  const trimmed = when.trim();
  const hasDate = /^\d{4}-\d{2}-\d{2}/.test(trimmed);
  const [datePart, timePart] = hasDate
    ? trimmed.split(/[T ]/)
    : [BASE_DATE, trimmed];
  const [year, month, day] = datePart.split("-").map(Number);
  const [hour = 0, minute = 0, second = 0] = (timePart ?? "00:00")
    .split(":")
    .map(Number);
  return new Date(year, month - 1, day, hour, minute, second);
}

export function tokenize(body: string): string[] {
  return body.split(/[^\p{L}\p{N}_]+/u).filter((w) => w.length > 0);
}

export function msg(
  sender: string,
  when: string,
  body = "hello there",
  extra: Partial<ParsedMessage> = {},
): ParsedMessage {
  return {
    timestamp: at(when),
    sender,
    body,
    lineType: "chat",
    words: tokenize(body),
    emojis: [],
    domains: [],
    ...extra,
  };
}

export function event(when: string, body = "Ada created this group"): ParsedMessage {
  return {
    timestamp: at(when),
    sender: null,
    body,
    lineType: "event",
    words: [],
    emojis: [],
    domains: [],
  };
}
