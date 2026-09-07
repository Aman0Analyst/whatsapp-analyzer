import { useMemo, useState } from "react";
import { TrendChart } from "../charts/TrendChart";
import { buildReplies, filterReplies, replySummary, replyTrend } from "../metrics/replies";
import { useFilter } from "../state/FilterProvider";
import { Card } from "../theme/UiKit";
import type { ParsedMessage } from "../types/chat";
import { formatDuration, windowLabel } from "./formatDuration";
import "../dashboard/dashboard.css";

type SortKey = "sender" | "n" | "medianSeconds" | "p90Seconds";

export function ReplySection({
  messages,
  uniqueSenderCount,
}: {
  messages: ParsedMessage[];
  uniqueSenderCount: number;
}) {
  const { filter } = useFilter();
  const [sort, setSort] = useState<SortKey>("medianSeconds");
  const events = useMemo(
    () => filterReplies(buildReplies(messages, filter.replyWindowMinutes), filter),
    [messages, filter],
  );
  const rows = replySummary(events).slice().sort((a, b) => {
    if (sort === "sender") return a.sender.localeCompare(b.sender);
    return b[sort] - a[sort];
  });
  const trend = replyTrend(events, filter);
  const senders = [...new Set(trend.map((p) => p.sender))];
  const series = senders.map((sender, i) => ({
    id: sender,
    colorVar: `--series-${(i % 8) + 1}`,
    points: trend.filter((p) => p.sender === sender).map((p) => ({ t: p.t, y: p.seconds })),
  }));

  const previousLabel = (n: number, medianSeconds: number): string => {
    if (n < 5) return `${n} samples`;
    return `median ${formatDuration(medianSeconds)}`;
  };

  return (
    <Card>
      <h2>Response time</h2>
      <p className="muted">
        Send time to next message, ignoring gaps longer than {windowLabel(filter.replyWindowMinutes)}.
        Not read receipts.
      </p>
      {uniqueSenderCount > 15 ? (
        <p className="muted">
          This group has many unique senders, so reply time is a last-speaker proxy, not a true
          quote/reply.
        </p>
      ) : null}
      <div className="kpi-row">
        {rows.map((row) => (
          <div key={row.sender} className={row.n < 10 ? "sparse" : undefined}>
            <strong>{row.sender}</strong>
            <div>{formatDuration(row.medianSeconds)} median</div>
            <div className="muted">p90 {formatDuration(row.p90Seconds)}</div>
            <div className="muted">
              {row.n < 10 ? "not enough replies" : previousLabel(row.n, row.medianSeconds)}
            </div>
          </div>
        ))}
      </div>
      {series.length > 0 ? <TrendChart series={series} /> : null}
      <table className="table">
        <thead>
          <tr>
            {(["sender", "n", "medianSeconds", "p90Seconds"] as SortKey[]).map((key) => (
              <th key={key}>
                <button type="button" onClick={() => setSort(key)}>
                  {key === "sender" ? "Person" : key === "n" ? "n" : key === "medianSeconds" ? "Median" : "P90"}
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.sender} className={row.n < 10 ? "sparse" : undefined}>
              <td>{row.sender}</td>
              <td>{row.n}</td>
              <td>{formatDuration(row.medianSeconds)}</td>
              <td>{formatDuration(row.p90Seconds)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
