import type { ParsedMessage } from "../types/chat";
import { p99, quartile1, quartile3 } from "./buckets";

export type OutlierReason = "p99" | "iqr";

export function textLength(message: ParsedMessage, stripEmojis: boolean): number {
  let text = message.body;
  if (stripEmojis) {
    for (const emoji of message.emojis) {
      if (emoji) text = text.split(emoji).join("");
    }
    text = text.replace(/\p{Extended_Pictographic}/gu, "");
  }
  return text.length;
}

type LengthRow = { message: ParsedMessage; length: number };

function flagOutliers(rows: LengthRow[]): { message: ParsedMessage; length: number; reasons: OutlierReason[] }[] {
  if (rows.length === 0) return [];
  const lengths = rows.map((row) => row.length);
  const minLen = Math.min(...lengths);
  const maxLen = Math.max(...lengths);
  const p99Len = p99(lengths);
  const iqrFence =
    rows.length >= 8 ? quartile3(lengths) + 1.5 * (quartile3(lengths) - quartile1(lengths)) : null;

  return rows
    .map((row) => {
      const reasons: OutlierReason[] = [];
      if (maxLen > minLen && row.length >= p99Len && row.length > minLen) reasons.push("p99");
      if (iqrFence !== null && row.length > iqrFence) reasons.push("iqr");
      return { ...row, reasons };
    })
    .filter((row) => row.reasons.length > 0);
}

export function longMessages(
  messages: ParsedMessage[],
  opts: { stripEmojis: boolean; vsSender?: boolean },
): { message: ParsedMessage; length: number; reasons: OutlierReason[] }[] {
  const eligible: LengthRow[] = [];
  for (const message of messages) {
    if (message.lineType !== "chat") continue;
    const length = textLength(message, opts.stripEmojis);
    if (length === 0) continue;
    eligible.push({ message, length });
  }
  if (eligible.length < 8) return [];

  const flagged = opts.vsSender
    ? (() => {
        const groups = new Map<string, LengthRow[]>();
        for (const row of eligible) {
          const sender = row.message.sender ?? "";
          const group = groups.get(sender);
          if (group) group.push(row);
          else groups.set(sender, [row]);
        }
        return [...groups.values()].flatMap(flagOutliers);
      })()
    : flagOutliers(eligible);

  return flagged.sort((a, b) => b.length - a.length);
}
