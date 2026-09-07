import type { FilterState, ParsedMessage } from "../types/chat";

function hourInRange(hour: number, start: number, end: number): boolean {
  if (start <= end) return hour >= start && hour <= end;
  return hour >= start || hour <= end;
}

/**
 * Shared filter for every message-based metric. `replyWindowMinutes` and
 * `stopwordLang` are deliberately ignored here: they must never change counts.
 */
export function filterMessages(messages: ParsedMessage[], filter: FilterState): ParsedMessage[] {
  return messages.filter((message) => {
    if (message.lineType === "event") return false;
    if (filter.senders !== "all") {
      if (!message.sender || !filter.senders.includes(message.sender)) return false;
    }
    if (filter.rangeStart && message.timestamp.getTime() < filter.rangeStart.getTime()) return false;
    if (filter.rangeEnd && message.timestamp.getTime() > filter.rangeEnd.getTime()) return false;
    if (!hourInRange(message.timestamp.getHours(), filter.hourStart, filter.hourEnd)) return false;
    return true;
  });
}

export function hourInFilter(date: Date, filter: FilterState): boolean {
  return hourInRange(date.getHours(), filter.hourStart, filter.hourEnd);
}
