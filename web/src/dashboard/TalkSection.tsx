import { RankBars } from "../charts/RankBars";
import {
  activeAndSilentDays,
  longestSilenceSeconds,
  talkShareByWords,
  wordsPerMessageBySender,
} from "../metrics/talk";
import { formatDuration } from "../reply/formatDuration";
import { useFilter } from "../state/FilterProvider";
import { Badge, InfoTip, SectionCard } from "../theme/UiKit";
import { senderColors } from "../theme/senderColor";
import type { DurationStat, ParsedMessage } from "../types/chat";
import "./dashboard.css";

const VISIBLE = 12;

/**
 * "Slow replies" is the right name for a P90 delay but the wrong one for a
 * message length, so the length statistic gets its own wording.
 */
const LENGTH_LABEL: Record<DurationStat, string> = {
  median: "typical",
  p90: "long end of the range",
  mean: "average",
};

export function TalkSection({ messages }: { messages: ParsedMessage[] }) {
  const { filter, uniqueSenders } = useFilter();
  const colors = senderColors(uniqueSenders);
  const share = talkShareByWords(messages);
  const perMessage = new Map(
    wordsPerMessageBySender(messages, filter.durationStat).map((row) => [row.sender, row.value]),
  );
  const days = activeAndSilentDays(messages);
  const silence = longestSilenceSeconds(messages);
  const totalWords = share.reduce((sum, row) => sum + row.words, 0);

  return (
    <SectionCard
      title="Who fills the space"
      description="Sender rank counts messages; this counts words. The two disagree when one person writes paragraphs and another sends a line at a time."
      metric="talkShare"
      aside={totalWords > 0 ? <Badge>{totalWords.toLocaleString()} words</Badge> : undefined}
    >
      {share.length === 0 ? (
        <p className="empty">Nobody typed a word in this range.</p>
      ) : (
        <>
          <RankBars
            rows={share.slice(0, VISIBLE).map((row) => ({
              label: row.sender,
              n: row.words,
              share: row.share,
              colorVar: colors.get(row.sender),
            }))}
          />

          <h3 className="subhead">
            Words per message, {LENGTH_LABEL[filter.durationStat]}
            <InfoTip metric="wordsPerMessage" />
          </h3>
          <div className="person-grid">
            {share.slice(0, VISIBLE).map((row) => {
              const value = perMessage.get(row.sender) ?? null;
              return (
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
                  <span className="person-value">
                    {value === null ? "—" : value.toFixed(value < 10 ? 1 : 0)}
                  </span>
                  {value === null ? (
                    <span className="person-meta">too few messages</span>
                  ) : null}
                </div>
              );
            })}
          </div>
        </>
      )}

      {days.spanDays > 0 ? (
        <p className="section-note">
          Someone spoke on {days.activeDays.toLocaleString()} of the{" "}
          {days.spanDays.toLocaleString()} days in range
          {days.silentDays === 0
            ? ", with no silent day at all"
            : days.silentDays === 1
              ? "; one day passed in silence"
              : `; the other ${days.silentDays.toLocaleString()} passed in silence`}
          .{" "}
          {silence === null
            ? null
            : `The longest gap between two messages was ${formatDuration(silence)}.`}
          <InfoTip metric="silentDays" />
        </p>
      ) : null}
    </SectionCard>
  );
}
