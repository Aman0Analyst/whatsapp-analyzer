import { describe, expect, it } from "vitest";
import { heatmap } from "./heatmap";
import { event, msg } from "./fixtures";

describe("heatmap", () => {
  it("is a 7 x 24 grid of zeros when empty", () => {
    const grid = heatmap([]);
    expect(grid).toHaveLength(7);
    expect(grid.every((row) => row.length === 24)).toBe(true);
    expect(grid.flat().every((n) => n === 0)).toBe(true);
  });

  it("puts a Tuesday 22:27 message in Tuesday x 22 with Monday = 0", () => {
    // 2024-03-05 is a Tuesday.
    const grid = heatmap([msg("Ada", "2024-03-05 22:27")]);
    expect(grid[1][22]).toBe(1);
    expect(grid.flat().reduce((a, b) => a + b, 0)).toBe(1);
  });

  it("puts Monday in row 0 and Sunday in row 6", () => {
    // 2024-03-04 Monday, 2024-03-10 Sunday.
    const grid = heatmap([msg("Ada", "2024-03-04 00:10"), msg("Bob", "2024-03-10 23:59")]);
    expect(grid[0][0]).toBe(1);
    expect(grid[6][23]).toBe(1);
  });

  it("accumulates repeated slots and excludes events", () => {
    const grid = heatmap([
      msg("Ada", "2024-03-05 22:00"),
      msg("Bob", "2024-03-12 22:59"),
      event("2024-03-05 22:30"),
    ]);
    expect(grid[1][22]).toBe(2);
  });
});
