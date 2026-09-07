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
import { FilterBar } from "../state/FilterBar";
import { useFilter } from "../state/FilterProvider";
import { Button, Kpi, Page } from "../theme/UiKit";
import type { ParsedMessage } from "../types/chat";
import { EntireExportStrip } from "./EntireExportStrip";
import { HeatmapSection } from "./HeatmapSection";
import { RankSection } from "./RankSection";
import { VolumeSection } from "./VolumeSection";
import "./dashboard.css";

function formatSeconds(seconds: number | null): string {
  if (seconds === null || Number.isNaN(seconds)) return "—";
  if (seconds < 60) return `${Math.round(seconds)}s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
  const hours = seconds / 3600;
  return `${hours.toFixed(hours >= 10 ? 0 : 1)}h`;
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
    replies.length >= 5 ? median(replies.map((e) => e.delaySeconds)) : null;
  const isPair = fileSenders.length === 2;
  const starts = isPair ? sessionStarts(filtered) : [];

  return (
    <Page>
      <header className="dash-head">
        <div>
          <h1>WhatsApp Analyzer</h1>
          <p className="subtitle">{isPair ? "Two-person chat" : "Group chat"}</p>
        </div>
        <Button variant="ghost" type="button" onClick={onReset}>
          Analyze another file
        </Button>
      </header>
      <EntireExportStrip messages={messages} warnings={warnings} />
      <FilterBar />
      <div className="kpi-row">
        <Kpi label="Messages" value={String(messageCount(filtered))} hint="this range" />
        <Kpi label="Msgs / day" value={messagesPerDay(filtered).toFixed(1)} hint="this range" />
        <Kpi label="Unique senders" value={String(uniqueSenders(filtered).length)} hint="this range" />
        <Kpi label="Median reply" value={formatSeconds(medianReply)} hint="response time" />
      </div>
      <div className="grid-2">
        <VolumeSection messages={filtered} />
        <RankSection messages={filtered} />
      </div>
      <HeatmapSection messages={filtered} />
      {isPair ? (
        <div className="kpi-row">
          {starts.map((row) => (
            <Kpi
              key={row.sender}
              label={`${row.sender} starts`}
              value={`${row.n}`}
              hint={`${Math.round(row.share * 100)}% of sessions`}
            />
          ))}
        </div>
      ) : null}
      <ContentSection messages={filtered} />
      <ReplySection messages={messages} uniqueSenderCount={fileSenders.length} />
      {dateSpan(filtered) ? null : <p className="muted">No messages in this filter.</p>}
    </Page>
  );
}
