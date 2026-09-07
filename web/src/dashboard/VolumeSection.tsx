import { TrendChart } from "../charts/TrendChart";
import { volumeTrend, volumeTrendBySender } from "../metrics/volume";
import { Card } from "../theme/UiKit";
import { useFilter } from "../state/FilterProvider";
import type { ParsedMessage } from "../types/chat";

export function VolumeSection({ messages }: { messages: ParsedMessage[] }) {
  const { filter } = useFilter();
  const overlay = filter.senders !== "all" && filter.senders.length >= 2 && filter.senders.length <= 5;
  const series = overlay
    ? volumeTrendBySender(messages, filter.grain).map((row, i) => ({
        id: row.sender,
        colorVar: `--series-${(i % 8) + 1}`,
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
    <Card>
      <h2>Volume</h2>
      <TrendChart series={series} />
    </Card>
  );
}
