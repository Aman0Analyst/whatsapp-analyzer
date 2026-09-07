import type { ParsedMessage } from "../types/chat";

/** 7 weekday rows (Monday = 0) by 24 local-hour columns. */
export function heatmap(messages: ParsedMessage[]): number[][] {
  const grid = Array.from({ length: 7 }, () => Array.from({ length: 24 }, () => 0));
  for (const message of messages) {
    if (message.lineType === "event") continue;
    const day = (message.timestamp.getDay() + 6) % 7;
    grid[day][message.timestamp.getHours()] += 1;
  }
  return grid;
}
