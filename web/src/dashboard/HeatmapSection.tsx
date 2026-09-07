import { HeatmapGrid } from "../charts/HeatmapGrid";
import { heatmap } from "../metrics/heatmap";
import { Card } from "../theme/UiKit";
import type { ParsedMessage } from "../types/chat";
import "./dashboard.css";

export function HeatmapSection({ messages }: { messages: ParsedMessage[] }) {
  return (
    <Card>
      <h2>Activity heatmap</h2>
      <HeatmapGrid grid={heatmap(messages)} />
    </Card>
  );
}
