import type { LineType, ParsedMessage } from "../types/chat";
import {
  BAD_CHARS,
  DATE_PREFIX,
  IS_ATTACHMENT,
  IS_CHAT,
  IS_DELETED_CHAT,
  IS_EVENT,
  IS_STARTING_LINE,
  IS_URL,
  NBSP,
} from "./patterns";

/** Which slot of `02/03/26` holds the day. */
export type DateOrder = "dayFirst" | "monthFirst";

export interface ParseResult {
  messages: ParsedMessage[];
  warnings: string[];
  dateOrder: DateOrder;
}

/** Lines of one message: the dated first line plus any continuation lines. */
interface Draft {
  timestamp: Date;
  sender: string | null;
  lineType: LineType;
  lines: string[];
}

const CENTURY = Math.floor(new Date().getFullYear() / 100) * 100;

/** Words are the same tokens the Python CLI counts, plus combining marks. */
const NON_WORD = /[^\p{L}\p{N}\p{M}_]+/u;

/** Flag pair, keycap, or a pictograph with its variation selector, skin tone, and ZWJ parts. */
const EMOJI =
  /[\u{1F1E6}-\u{1F1FF}]{2}|[#*0-9]\uFE0F?\u20E3|\p{Extended_Pictographic}\uFE0F?[\u{1F3FB}-\u{1F3FF}]?(?:\u200D\p{Extended_Pictographic}\uFE0F?[\u{1F3FB}-\u{1F3FF}]?)*/gu;

function cleanLine(line: string): string {
  let out = line.split(NBSP).join(" ");
  for (const bad of BAD_CHARS) {
    out = out.split(bad).join("");
  }
  return out.trim();
}

function matchesAny(patterns: RegExp[], body: string): boolean {
  return patterns.some((pattern) => pattern.test(body));
}

/** Two digit years land in the closest 100 year window, as `dateutil` does. */
function expandYear(year: number): number {
  if (year >= 100) return year;
  const current = new Date().getFullYear();
  const full = year + CENTURY;
  if (full >= current + 50) return full - 100;
  if (full < current - 50) return full + 100;
  return full;
}

function isRealDate(year: number, month: number, day: number): boolean {
  if (month < 1 || month > 12 || day < 1) return false;
  const date = new Date(year, month - 1, day);
  return date.getMonth() === month - 1 && date.getDate() === day;
}

/**
 * WhatsApp writes dates in the exporting phone's locale, so `02/03/26` is 2
 * March in most of the world and February 3 in the US. Guessing per line lets
 * one file mix both and scrambles the timeline, so decide once for the whole
 * file: any slot holding a number above 12 must be the day. Whichever reading
 * the file proves more often wins, and an entirely ambiguous file falls to
 * day-first, matching the locale most exports come from.
 */
export function detectDateOrder(lines: string[]): DateOrder {
  let dayFirst = 0;
  let monthFirst = 0;
  for (const line of lines) {
    const match = DATE_PREFIX.exec(line);
    if (!match) continue;
    const first = Number(match[1]);
    const second = Number(match[2]);
    if (first > 12 && second <= 12) dayFirst += 1;
    else if (second > 12 && first <= 12) monthFirst += 1;
  }
  return monthFirst > dayFirst ? "monthFirst" : "dayFirst";
}

function buildTimestamp(
  groups: Record<string, string | undefined>,
  order: DateOrder,
): Date | null {
  const num1 = Number(groups.num1);
  const num2 = Number(groups.num2);
  const year = expandYear(Number(groups.year));
  const minute = Number(groups.minute);
  const second = groups.second === undefined ? 0 : Number(groups.second);

  let hour = Number(groups.hour);
  if (groups.ampm) {
    const isAfternoon = /p/i.test(groups.ampm);
    if (hour === 12) hour = isAfternoon ? 12 : 0;
    else if (isAfternoon) hour += 12;
  }
  if (hour > 23 || minute > 59 || second > 59) return null;

  // Try the file's own convention first, then the other way for a stray line
  // that cannot be read that way at all.
  const readings: number[][] =
    order === "dayFirst"
      ? [
          [num2, num1],
          [num1, num2],
        ]
      : [
          [num1, num2],
          [num2, num1],
        ];
  for (const [month, day] of readings) {
    if (isRealDate(year, month, day)) {
      return new Date(year, month - 1, day, hour, minute, second);
    }
  }
  return null;
}

function classifyChat(body: string): LineType {
  if (matchesAny(IS_ATTACHMENT, body)) return "attachment";
  if (matchesAny(IS_DELETED_CHAT, body)) return "deleted";
  return "chat";
}

function domainOf(url: string): string {
  return url.replace(/^https?:\/\//i, "").split("/")[0];
}

function extractEmojis(body: string): string[] {
  return [...body.matchAll(EMOJI)].map((match) => match[0]);
}

function splitWords(body: string): string[] {
  return body.split(NON_WORD).filter((word) => word.length > 0);
}

function finalize(draft: Draft): ParsedMessage {
  const lines = [...draft.lines];
  while (lines.length > 0 && lines[lines.length - 1] === "") lines.pop();

  const message: ParsedMessage = {
    timestamp: draft.timestamp,
    sender: draft.sender,
    body: lines.join("\n"),
    lineType: draft.lineType,
    words: [],
    emojis: [],
    domains: [],
  };

  // Attachments, deleted messages, and events carry no text worth counting.
  if (draft.lineType !== "chat") return message;

  let withoutUrls = message.body;
  for (const match of message.body.matchAll(IS_URL)) {
    message.domains.push(domainOf(match[0]));
    withoutUrls = withoutUrls.split(match[0]).join(" ");
  }
  message.words = splitWords(withoutUrls);
  message.emojis = extractEmojis(message.body);
  return message;
}

function count(n: number, noun: string): string {
  return `${n} ${noun}${n === 1 ? "" : "s"}`;
}

export function parseExport(text: string): ParseResult {
  const messages: ParsedMessage[] = [];
  const warnings: string[] = [];
  let draft: Draft | null = null;
  let ignoredBefore = 0;
  let unreadableDates = 0;
  let unknownSystemLines = 0;

  const lines = text.split(/\r?\n/);
  const dateOrder = detectDateOrder(lines);

  for (const rawLine of lines) {
    const line = cleanLine(rawLine);
    const groups = IS_STARTING_LINE.exec(line)?.groups;

    if (!groups) {
      // A continuation of the message above it.
      if (draft) draft.lines.push(line);
      else if (line.length > 0) ignoredBefore += 1;
      continue;
    }

    const timestamp = buildTimestamp(groups, dateOrder);
    if (!timestamp) {
      unreadableDates += 1;
      continue;
    }
    if (draft) messages.push(finalize(draft));

    const rest = (groups.rest ?? "").trim();
    const chat = IS_CHAT.exec(rest)?.groups;
    if (chat) {
      const body = chat.body.trim();
      draft = { timestamp, sender: chat.sender.trim(), lineType: classifyChat(body), lines: [body] };
    } else {
      if (!matchesAny(IS_EVENT, rest)) unknownSystemLines += 1;
      draft = { timestamp, sender: null, lineType: "event", lines: [rest] };
    }
  }
  if (draft) messages.push(finalize(draft));

  // First warning goes in front of the reader as the error on the landing page.
  if (messages.length === 0) {
    warnings.push("No WhatsApp messages found in this file.");
  }
  if (ignoredBefore > 0) {
    warnings.push(`Ignored ${count(ignoredBefore, "line")} before the first dated message.`);
  }
  if (unreadableDates > 0) {
    warnings.push(`Skipped ${count(unreadableDates, "line")} with a date that could not be read.`);
  }
  if (unknownSystemLines > 0) {
    warnings.push(`Treated ${count(unknownSystemLines, "unrecognised system line")} as events.`);
  }

  return { messages, warnings, dateOrder };
}
