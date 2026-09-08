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
import { longestSilenceSeconds } from "../metrics/talk";
import { ReplySection } from "../reply/ReplySection";
import { formatDuration } from "../reply/formatDuration";
import { FilterBar } from "../state/FilterBar";
import { useFilter } from "../state/FilterProvider";
import { Button, Page, StatCard } from "../theme/UiKit";
import type { ParsedMessage } from "../types/chat";
import type { DateOrder } from "../parse/parseExport";
import { EntireExportStrip } from "./EntireExportStrip";
import { GroupHealthSection } from "./GroupHealthSection";
import { HeatmapSection } from "./HeatmapSection";
import { RankSection } from "./RankSection";
import { SessionSection } from "./SessionSection";
import { TalkSection } from "./TalkSection";
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
  dateOrder = "dayFirst",
  onReset,
}: {
  messages: ParsedMessage[];
  warnings: string[];
  dateOrder?: DateOrder;
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
        <EntireExportStrip messages={messages} warnings={warnings} dateOrder={dateOrder} />
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
            label="Typical reply"
            value={formatSeconds(medianReply)}
            hint={
              medianReply === null
                ? `needs ${MIN_REPLY_SAMPLE}+ replies`
                : `across ${replies.length.toLocaleString()} replies`
            }
            metric="medianReply"
          />
          <StatCard
            label="Longest silence"
            value={formatSeconds(longestSilenceSeconds(filtered))}
            hint="biggest gap between two messages"
            metric="longestSilence"
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

        <TalkSection messages={filtered} />

        <HeatmapSection messages={filtered} />

        <SessionSection messages={filtered} fileSenderCount={fileSenders.length} />

        {fileSenders.length >= 3 ? (
          <GroupHealthSection messages={filtered} fileMessages={messages} />
        ) : null}

        <ContentSection messages={filtered} />
        <ReplySection messages={messages} uniqueSenderCount={fileSenders.length} />
      </Page>
    </>
  );
}
