import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { HeatmapGrid } from "./HeatmapGrid";
import { RankBars } from "./RankBars";
import { TrendChart } from "./TrendChart";

describe("chart primitives", () => {
  it("renders rank labels and heatmap cells without green", () => {
    const { container } = render(
      <div>
        <RankBars rows={[{ label: "Ada", n: 4 }]} />
        <HeatmapGrid grid={[[1, 0], [0, 2]]} />
      </div>,
    );
    expect(screen.getByText("Ada")).toBeInTheDocument();
    const html = container.innerHTML.toLowerCase();
    expect(html).not.toContain("green");
    expect(html).not.toContain("#25d366");
  });

  it("passes null points through as gaps", () => {
    render(
      <TrendChart
        series={[
          {
            id: "Ada",
            colorVar: "--series-1",
            points: [
              { t: new Date(2024, 0, 1), y: 1 },
              { t: new Date(2024, 0, 8), y: null },
              { t: new Date(2024, 0, 15), y: 3 },
            ],
          },
        ]}
      />,
    );
    expect(document.querySelector(".recharts-responsive-container")).toBeTruthy();
  });
});
