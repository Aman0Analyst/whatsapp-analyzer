import { useMemo } from "react";
import { ContentSection } from "../content/ContentSection";
import { filterMessages } from "../metrics/filterMessages";
import { buildReplies, filterReplies } from "../metrics/replies";
import { median } from "../metrics/buckets";
import {
  dateSpan,
  messageCount,
  messagesPerDay,
  uniqueSenders,
} from "../metrics/volume";
import { sessionStarts } from "../metrics/sessions";
import { ReplySection } from "../reply/ReplySection";
import { formatDuration } from "../reply/formatDuration";
import { FilterBar } from "../state/FilterBar";
import { useFilter } from "../state/FilterProvider";
import { Button, Page, SectionCard, StatCard } from "../theme/UiKit";
import { senderColors } from "../theme/senderColor";
import type { ParsedMessage } from "../types/chat";
import { EntireExportStrip } from "./EntireExportStrip";
import { HeatmapSection } from "./HeatmapSection";
import { RankSection } from "./RankSection";
import { VolumeSection } from "./VolumeSection";
import "./dashboard.css";

const MIN_REPLY_SAMPLE = 5;

function formatSeconds(seconds: number | null): string {
  if (seconds === null || Number.isNaN(seconds)) return "—";
  return formatDuration(seconds);
}

export function Dashboard({
  messages,
  warnings,
  onReset,
}: {
  messages: ParsedMessage[];
  warnings: string[];
  onReset: () => void;
}) {
  const { filter } = useFilter();
  const fileSenders = uniqueSenders(messages);
  const filtered = useMemo(() => filterMessages(messages, filter), [messages, filter]);
  const replies = useMemo(
    () => filterReplies(buildReplies(messages, filter.replyWindowMinutes), filter),
    [messages, filter],
  );
  const medianReply =
    replies.length >= MIN_REPLY_SAMPLE ? median(replies.map((e) => e.delaySeconds)) : null;
  const isPair = fileSenders.length === 2;
  const starts = isPair ? sessionStarts(filtered) : [];
  const colors = senderColors(fileSenders);

  const span = dateSpan(messages);
  const years = span
    ? span.start.getFullYear() === span.end.getFullYear()
      ? `${span.start.getFullYear()}`
      : `${span.start.getFullYear()}–${span.end.getFullYear()}`
    : "no dates";
  const kind = isPair ? "Two-person chat" : "Group chat";

  return (
    <>
      <header className="appbar">
        <div className="appbar-inner">
          <div className="appbar-mark">
            <span className="appbar-logo" aria-hidden="true">
              WA
            </span>
            <div>
              <h1 className="appbar-title">WhatsApp Analyzer</h1>
              <p className="appbar-sub">
                {kind} · {fileSenders.length} {fileSenders.length === 1 ? "person" : "people"} ·{" "}
                {years}
              </p>
            </div>
          </div>
          <div className="appbar-actions">
            <Button variant="ghost" type="button" onClick={onReset}>
              Analyze another file
            </Button>
          </div>
        </div>
      </header>

      <Page>
        <EntireExportStrip messages={messages} warnings={warnings} />
        <FilterBar />

        <div className="stat-row">
          <StatCard
            label="Messages"
            value={messageCount(filtered).toLocaleString()}
            hint="in the filtered range"
            metric="messages"
          />
          <StatCard
            label="Messages / day"
            value={messagesPerDay(filtered).toFixed(1)}
            hint="averaged over the range"
            metric="perDay"
          />
          <StatCard
            label="People talking"
            value={String(uniqueSenders(filtered).length)}
            hint={`of ${fileSenders.length} in the file`}
            metric="senders"
          />
          <StatCard
            label="Median reply"
            value={formatSeconds(medianReply)}
            hint={
              medianReply === null
                ? `needs ${MIN_REPLY_SAMPLE}+ replies`
                : `across ${replies.length.toLocaleString()} replies`
            }
            metric="medianReply"
            align="end"
          />
        </div>

        {dateSpan(filtered) ? null : (
          <p className="callout">
            No messages match the current filters. Widen the date range or re-tick people above.
          </p>
        )}

        <div className="grid-2">
          <VolumeSection messages={filtered} />
          <RankSection messages={filtered} />
        </div>

        <HeatmapSection messages={filtered} />

        {isPair && starts.length > 0 ? (
          <SectionCard
            title="Who starts conversations"
            description="After a quiet stretch, who sends the first message."
            metric="sessionStarts"
          >
            <div className="stat-row stat-row-tight">
              {starts.map((row) => (
                <div className="person" key={row.sender}>
                  <span className="person-head">
                    <span
                      className="person-swatch"
                      style={{ background: `var(${colors.get(row.sender) ?? "--series-1"})` }}
                    />
                    <span className="person-name" title={row.sender}>
                      {row.sender}
                    </span>
                  </span>
                  <span className="person-value">{Math.round(row.share * 100)}%</span>
                  <span className="person-meta">
                    {row.n.toLocaleString()} of{" "}
                    {starts.reduce((sum, s) => sum + s.n, 0).toLocaleString()} conversations
                  </span>
                </div>
              ))}
            </div>
          </SectionCard>
        ) : null}

        <ContentSection messages={filtered} />
        <ReplySection messages={messages} uniqueSenderCount={fileSenders.length} />
      </Page>
    </>
  );
}
