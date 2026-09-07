import "./charts.css";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const RAMP = ["--ramp-0", "--ramp-1", "--ramp-2", "--ramp-3", "--ramp-4", "--ramp-5"];

function rampStep(value: number, max: number): string {
  if (max <= 0 || value <= 0) return RAMP[0];
  const t = value / max;
  if (t <= 0.2) return RAMP[1];
  if (t <= 0.4) return RAMP[2];
  if (t <= 0.6) return RAMP[3];
  if (t <= 0.8) return RAMP[4];
  return RAMP[5];
}

function hourLabel(hour: number): string {
  if (hour === 0) return "12a";
  if (hour === 12) return "12p";
  return hour < 12 ? `${hour}a` : `${hour - 12}p`;
}

export function HeatmapGrid({ grid }: { grid: number[][] }) {
  const max = Math.max(0, ...grid.flat());
  const hours = grid[0]?.length ?? 24;

  let peak: { day: number; hour: number; n: number } | null = null;
  grid.forEach((row, day) =>
    row.forEach((n, hour) => {
      if (n > 0 && (!peak || n > peak.n)) peak = { day, hour, n };
    }),
  );
  const busiest = peak as { day: number; hour: number; n: number } | null;

  return (
    <div className="heatmap-wrap">
      <div className="heatmap" role="img" aria-label="Messages by weekday and hour of day">
        <div className="heatmap-hours">
          <span />
          {Array.from({ length: hours }, (_, h) => (
            <span className="heatmap-hour" key={h}>
              {h % 3 === 0 ? hourLabel(h) : ""}
            </span>
          ))}
        </div>
        {grid.map((row, d) => (
          <div className="heatmap-row" key={DAYS[d] ?? d}>
            <span className="heatmap-day">{DAYS[d] ?? d}</span>
            {row.map((n, h) => (
              <span
                className="heatmap-cell"
                key={`${d}-${h}`}
                title={`${DAYS[d] ?? d} ${hourLabel(h)} — ${n} message${n === 1 ? "" : "s"}`}
                style={{ background: `var(${rampStep(n, max)})` }}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="heatmap-foot">
        {busiest ? (
          <span className="muted">
            Busiest hour: <strong>{DAYS[busiest.day] ?? busiest.day}</strong> around{" "}
            <strong>{hourLabel(busiest.hour)}</strong> ({busiest.n.toLocaleString()} messages)
          </span>
        ) : (
          <span className="muted">No activity in this range.</span>
        )}
        <span className="heatmap-legend">
          Quiet
          {RAMP.map((step) => (
            <span key={step} className="heatmap-key" style={{ background: `var(${step})` }} />
          ))}
          Busy
        </span>
      </div>
    </div>
  );
}
