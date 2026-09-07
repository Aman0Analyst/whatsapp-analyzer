import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { chartTheme } from "../theme/ChartTheme";

export function RankBars({ rows }: { rows: { label: string; n: number }[] }) {
  return (
    <div>
      <ul className="word-list">
        {rows.map((row) => (
          <li key={row.label}>
            {row.label} <span className="muted">{row.n}</span>
          </li>
        ))}
      </ul>
    <div style={{ width: "100%", height: Math.max(160, rows.length * 36) }}>
      <ResponsiveContainer width="100%" height="100%" minWidth={200} minHeight={160}>
        <BarChart data={rows} layout="vertical" margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
          <XAxis type="number" stroke={chartTheme.axis} tick={{ fill: chartTheme.axis, fontSize: 12 }} />
          <YAxis
            type="category"
            dataKey="label"
            width={96}
            stroke={chartTheme.axis}
            tick={{ fill: chartTheme.axis, fontSize: 12 }}
          />
          <Tooltip contentStyle={chartTheme.tooltip} />
          <Bar dataKey="n" fill="var(--series-1)" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
    </div>
  );
}
