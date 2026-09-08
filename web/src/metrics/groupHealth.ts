import type { ParsedMessage } from "../types/chat";
import { uniqueSenders } from "./volume";

function countable(messages: ParsedMessage[]): ParsedMessage[] {
  return messages.filter((m) => m.lineType !== "event");
}

const NIGHT_HOURS = new Set([22, 23, 0, 1, 2, 3, 4, 5]);

export function silentInFile(fileMessages: ParsedMessage[], filtered: ParsedMessage[]): string[] {
  const inFiltered = new Set(uniqueSenders(filtered));
  return uniqueSenders(fileMessages).filter((sender) => !inFiltered.has(sender));
}

export function messageConcentration(messages: ParsedMessage[]): number {
  const counts = new Map<string, number>();
  for (const message of countable(messages)) {
    if (!message.sender) continue;
    counts.set(message.sender, (counts.get(message.sender) ?? 0) + 1);
  }
  const total = [...counts.values()].reduce((a, b) => a + b, 0);
  if (total === 0) return 0;
  let hhi = 0;
  for (const n of counts.values()) {
    const share = n / total;
    hhi += share * share;
  }
  return hhi;
}

export function nightShare(messages: ParsedMessage[]): number {
  const rows = countable(messages);
  if (rows.length === 0) return 0;
  const night = rows.filter((m) => NIGHT_HOURS.has(m.timestamp.getHours())).length;
  return night / rows.length;
}

export function weekendShare(messages: ParsedMessage[]): number {
  const rows = countable(messages);
  if (rows.length === 0) return 0;
  const weekend = rows.filter((m) => {
    const day = m.timestamp.getDay();
    return day === 0 || day === 6;
  }).length;
  return weekend / rows.length;
}

export function questionRate(
  messages: ParsedMessage[],
): { sender: string; questions: number; chats: number; rate: number }[] {
  const chats = new Map<string, number>();
  const questions = new Map<string, number>();
  for (const message of messages) {
    if (message.lineType !== "chat" || !message.sender) continue;
    chats.set(message.sender, (chats.get(message.sender) ?? 0) + 1);
    if (message.body.includes("?")) {
      questions.set(message.sender, (questions.get(message.sender) ?? 0) + 1);
    }
  }
  return [...chats.entries()]
    .map(([sender, n]) => {
      const q = questions.get(sender) ?? 0;
      return { sender, questions: q, chats: n, rate: q / n };
    })
    .sort((a, b) => b.rate - a.rate || a.sender.localeCompare(b.sender));
}
