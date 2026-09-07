import { TrendChart } from "../charts/TrendChart";
import { volumeTrend, volumeTrendBySender } from "../metrics/volume";
import { Badge, SectionCard } from "../theme/UiKit";
import { senderColors } from "../theme/senderColor";
import { useFilter } from "../state/FilterProvider";
import type { ParsedMessage } from "../types/chat";

export function VolumeSection({ messages }: { messages: ParsedMessage[] }) {
  const { filter, uniqueSenders } = useFilter();
  const overlay =
    filter.senders !== "all" && filter.senders.length >= 2 && filter.senders.length <= 5;
  const colors = senderColors(uniqueSenders);
  const series = overlay
    ? volumeTrendBySender(messages, filter.grain).map((row) => ({
        id: row.sender,
        colorVar: colors.get(row.sender) ?? "--series-1",
        points: row.points.map((p) => ({ t: p.t, y: p.n })),
      }))
    : [
        {
          id: "messages",
          colorVar: "--series-1",
          points: volumeTrend(messages, filter.grain).map((p) => ({ t: p.t, y: p.n })),
        },
      ];

  return (
    <SectionCard
      title="Volume over time"
      description={
        overlay
          ? "One line per selected person."
          : "Total messages per period. Pick two to five people to compare them."
      }
      metric="volume"
      aside={<Badge>per {filter.grain}</Badge>}
    >
      {series[0].points.length === 0 ? (
        <p className="empty">No messages in this range.</p>
      ) : (
        <TrendChart series={series} grain={filter.grain} />
      )}
    </SectionCard>
  );
}
