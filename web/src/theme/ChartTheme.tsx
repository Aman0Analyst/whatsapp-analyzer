import type { TimeGrain } from "../types/chat";

export const SERIES = [
  "var(--series-1)",
  "var(--series-2)",
  "var(--series-3)",
  "var(--series-4)",
  "var(--series-5)",
  "var(--series-6)",
  "var(--series-7)",
  "var(--series-8)",
];

export const chartTheme = {
  grid: "#e4d5c3",
  axis: "#7a6555",
  tooltip: {
    background: "#fffdfa",
    border: "1px solid #d3bda5",
    borderRadius: "10px",
    boxShadow: "0 2px 4px rgba(61, 44, 33, 0.06), 0 12px 32px rgba(61, 44, 33, 0.1)",
    color: "#2f211a",
    fontSize: "0.875rem",
  },
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Short axis label matched to the bucket size, so ticks stay readable. */
export function formatBucket(date: Date, grain: TimeGrain = "month"): string {
  const year = String(date.getFullYear()).slice(2);
  if (grain === "day" || grain === "week") return `${date.getDate()} ${MONTHS[date.getMonth()]}`;
  if (grain === "month") return `${MONTHS[date.getMonth()]} '${year}`;
  return `Q${Math.floor(date.getMonth() / 3) + 1} '${year}`;
}

/** Full label for tooltips, where there is room for the year. */
export function formatBucketLong(date: Date, grain: TimeGrain = "month"): string {
  if (grain === "day" || grain === "week") {
    return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
  }
  if (grain === "month") return `${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
  return `Q${Math.floor(date.getMonth() / 3) + 1} ${date.getFullYear()}`;
}

export function formatCompact(value: number): string {
  if (Math.abs(value) >= 1000) return `${(value / 1000).toFixed(1)}k`;
  return String(Math.round(value));
}
