const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function shade(value: number, max: number): string {
  if (max <= 0 || value <= 0) return "var(--surface-2)";
  const t = value / max;
  return `rgba(92, 64, 51, ${0.15 + t * 0.85})`;
}

export function HeatmapGrid({ grid }: { grid: number[][] }) {
  const max = Math.max(0, ...grid.flat());
  return (
    <div className="heatmap" role="img" aria-label="Weekday by hour heatmap">
      <div className="heatmap-hours">
        <span />
        {Array.from({ length: grid[0]?.length ?? 24 }, (_, h) => (
          <span key={h}>{h % 6 === 0 ? h : ""}</span>
        ))}
      </div>
      {grid.map((row, d) => (
        <div className="heatmap-row" key={DAYS[d] ?? d}>
          <span>{DAYS[d] ?? d}</span>
          {row.map((n, h) => (
            <span
              key={`${d}-${h}`}
              title={`${DAYS[d] ?? d} ${h}:00 — ${n}`}
              style={{ background: shade(n, max) }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
