import {
  sessionClosers,
  sessionGapMinutes,
  sessionStarts,
  sessionStats,
} from "../metrics/sessions";
import { formatDuration } from "../reply/formatDuration";
import { useFilter } from "../state/FilterProvider";
import { InfoTip, SectionCard } from "../theme/UiKit";
import { senderColors } from "../theme/senderColor";
import type { ParsedMessage } from "../types/chat";
import "./dashboard.css";

function PersonShares({
  rows,
  colors,
}: {
  rows: { sender: string; n: number; share: number }[];
  colors: Map<string, string>;
}) {
  const total = rows.reduce((sum, row) => sum + row.n, 0);
  return (
    <div className="person-grid person-grid-flush">
      {rows.map((row) => (
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
            {row.n.toLocaleString()} of {total.toLocaleString()} conversations
          </span>
        </div>
      ))}
    </div>
  );
}

/**
 * Conversations as bursts: how big a typical burst is, and — for a two-person
 * chat, where "who reached out" is meaningful — who opens and who signs off.
 */
export function SessionSection({
  messages,
  fileSenderCount,
}: {
  messages: ParsedMessage[];
  fileSenderCount: number;
}) {
  const { uniqueSenders } = useFilter();
  const colors = senderColors(uniqueSenders);
  const stats = sessionStats(messages);
  const isPair = fileSenderCount === 2;
  const starts = isPair ? sessionStarts(messages) : [];
  const closers = isPair ? sessionClosers(messages) : [];
  const showPeople = starts.length > 0;

  if (stats.count === 0) return null;

  const thin = "needs 5+ conversations";
  const tiles: { label: string; value: string; meta: string; metric?: string }[] = [
    {
      label: "Conversations",
      value: stats.count.toLocaleString(),
      meta: `split by a ${sessionGapMinutes}-minute gap`,
    },
    {
      label: "Typical length",
      value:
        stats.medianDurationSeconds === null ? "—" : formatDuration(stats.medianDurationSeconds),
      meta: stats.medianDurationSeconds === null ? thin : "first to last message",
    },
    {
      label: "Messages each",
      value: stats.medianMessageCount === null ? "—" : stats.medianMessageCount.toFixed(0),
      meta: stats.medianMessageCount === null ? thin : "in a typical burst",
    },
  ];

  if (fileSenderCount >= 3) {
    tiles.push({
      label: "People each",
      value: stats.medianPeoplePerBurst === null ? "—" : stats.medianPeoplePerBurst.toFixed(1),
      meta:
        stats.medianPeoplePerBurst === null
          ? thin
          : `of ${uniqueSenders.length.toLocaleString()} in view`,
      metric: "peoplePerBurst",
    });
  }

  return (
    <SectionCard
      title="Conversations, not messages"
      description={`Messages arrive in bursts. A quiet stretch longer than ${sessionGapMinutes} minutes ends one conversation and starts the next.`}
      metric="sessionStats"
    >
      <div className={showPeople ? "rate-tiles" : "rate-tiles rate-tiles-flush"}>
        {tiles.map((tile) => (
          <div className="rate-tile" key={tile.label}>
            <span className="rate-label">
              {tile.label}
              {tile.metric ? <InfoTip metric={tile.metric} /> : null}
            </span>
            <span className="rate-value">{tile.value}</span>
            <span className="rate-share">{tile.meta}</span>
          </div>
        ))}
      </div>

      {showPeople ? (
        <div className="split-2">
          <div>
            <h3 className="subhead">
              Who reaches out first
              <InfoTip metric="sessionStarts" />
            </h3>
            <PersonShares rows={starts} colors={colors} />
          </div>
          <div>
            <h3 className="subhead">
              Who has the last word
              <InfoTip metric="sessionClosers" />
            </h3>
            <PersonShares rows={closers} colors={colors} />
          </div>
        </div>
      ) : null}
    </SectionCard>
  );
}
