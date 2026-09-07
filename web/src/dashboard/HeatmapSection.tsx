import { HeatmapGrid } from "../charts/HeatmapGrid";
import { heatmap } from "../metrics/heatmap";
import { SectionCard } from "../theme/UiKit";
import type { ParsedMessage } from "../types/chat";
import "./dashboard.css";

export function HeatmapSection({ messages }: { messages: ParsedMessage[] }) {
  return (
    <SectionCard
      title="Activity heatmap"
      description="When the chat is alive, by weekday and hour in your local timezone."
      metric="heatmap"
    >
      <HeatmapGrid grid={heatmap(messages)} />
    </SectionCard>
  );
}
