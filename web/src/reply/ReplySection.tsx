import { useMemo, useState } from "react";
import { TrendChart } from "../charts/TrendChart";
import { buildReplies, filterReplies, replySummary, replyTrend } from "../metrics/replies";
import { useFilter } from "../state/FilterProvider";
import { Badge, InfoTip, SectionCard } from "../theme/UiKit";
import { senderColors } from "../theme/senderColor";
import type { ParsedMessage } from "../types/chat";
import { formatDuration, windowLabel } from "./formatDuration";
import "../dashboard/dashboard.css";

type SortKey = "sender" | "n" | "medianSeconds" | "p90Seconds";

const MIN_RELIABLE = 10;

const COLUMNS: { key: SortKey; label: string; numeric: boolean; metric?: "medianReply" | "p90Reply" | "replyCount" }[] = [
  { key: "sender", label: "Person", numeric: false },
  { key: "n", label: "Replies", numeric: true, metric: "replyCount" },
  { key: "medianSeconds", label: "Median", numeric: true, metric: "medianReply" },
  { key: "p90Seconds", label: "P90", numeric: true, metric: "p90Reply" },
];

export function ReplySection({
  messages,
  uniqueSenderCount,
}: {
  messages: ParsedMessage[];
  uniqueSenderCount: number;
}) {
  const { filter, uniqueSenders } = useFilter();
  const [sort, setSort] = useState<SortKey>("medianSeconds");
  const events = useMemo(
    () => filterReplies(buildReplies(messages, filter.replyWindowMinutes), filter),
    [messages, filter],
  );
  const rows = replySummary(events)
    .slice()
    .sort((a, b) => {
      if (sort === "sender") return a.sender.localeCompare(b.sender);
      return b[sort] - a[sort];
    });
  const trend = replyTrend(events, filter);
  const senders = [...new Set(trend.map((p) => p.sender))];
  const colors = senderColors(uniqueSenders);
  const series = senders.map((sender) => ({
    id: sender,
    colorVar: colors.get(sender) ?? "--series-1",
    points: trend.filter((p) => p.sender === sender).map((p) => ({ t: p.t, y: p.seconds })),
  }));
  return (
    <SectionCard
      title="Response time"
      description={`Send time to the next message, ignoring gaps longer than ${windowLabel(
        filter.replyWindowMinutes,
      )}. Not read receipts — no "seen" data exists in an export.`}
      metric="medianReply"
      aside={<Badge>window {windowLabel(filter.replyWindowMinutes)}</Badge>}
    >
      {uniqueSenderCount > 15 ? (
        <p className="callout">
          This group has many unique senders, so reply time is a last-speaker proxy rather than a
          true quote/reply link.
        </p>
      ) : null}

      {rows.length === 0 ? (
        <p className="empty">No replies fell inside the current window and filters.</p>
      ) : (
        <div className="person-grid">
          {rows.map((row) => {
            const thin = row.n < MIN_RELIABLE;
            return (
              <div className={`person${thin ? " sparse" : ""}`} key={row.sender}>
                <span className="person-head">
                  <span
                    className="person-swatch"
                    style={{ background: `var(${colors.get(row.sender) ?? "--series-1"})` }}
                  />
                  <span className="person-name" title={row.sender}>
                    {row.sender}
                  </span>
                </span>
                <span className="person-value">{formatDuration(row.medianSeconds)}</span>
                <span className="person-meta">median · p90 {formatDuration(row.p90Seconds)}</span>
                <span className="person-meta">
                  {thin ? (
                    <em>not enough replies ({row.n})</em>
                  ) : (
                    `${row.n.toLocaleString()} replies`
                  )}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {series.length > 0 ? (
        <>
          <h3 className="subhead">
            {filter.durationStat} reply time per {filter.grain}
            <InfoTip metric="durationStat" />
          </h3>
          <TrendChart series={series} grain={filter.grain} valueKind="duration" />
        </>
      ) : null}

      {rows.length > 0 ? (
        <>
          <h3 className="subhead">Per person</h3>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  {COLUMNS.map((column) => (
                    <th
                      key={column.key}
                      className={column.numeric ? "num" : undefined}
                      aria-sort={sort === column.key ? "descending" : "none"}
                    >
                      <button
                        type="button"
                        className="table-sort"
                        onClick={() => setSort(column.key)}
                      >
                        {column.label}
                        {sort === column.key ? " ▾" : ""}
                      </button>
                      {column.metric ? <InfoTip metric={column.metric} align="end" /> : null}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.sender} className={row.n < MIN_RELIABLE ? "sparse" : undefined}>
                    <td>{row.sender}</td>
                    <td className="num">{row.n.toLocaleString()}</td>
                    <td className="num">{formatDuration(row.medianSeconds)}</td>
                    <td className="num">{formatDuration(row.p90Seconds)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : null}
    </SectionCard>
  );
}
