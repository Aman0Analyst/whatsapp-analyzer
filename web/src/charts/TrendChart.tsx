import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { chartTheme } from "../theme/ChartTheme";

export interface TrendSeries {
  id: string;
  colorVar: string;
  points: { t: Date; y: number | null }[] ;
}

export function TrendChart({ series }: { series: TrendSeries[] }) {
  const times = new Map<number, Record<string, number | null | string>>();
  for (const line of series) {
    for (const point of line.points) {
      const key = point.t.getTime();
      const row = times.get(key) ?? { t: point.t.toISOString() };
      row[line.id] = point.y;
      times.set(key, row);
    }
  }
  const data = [...times.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([, row]) => row);

  return (
    <div style={{ width: "100%", height: 240 }}>
      <ResponsiveContainer width="100%" height="100%" minWidth={200} minHeight={160}>
        <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke={chartTheme.grid} strokeDasharray="3 3" />
          <XAxis dataKey="t" stroke={chartTheme.axis} tick={{ fill: chartTheme.axis, fontSize: 12 }} hide />
          <YAxis stroke={chartTheme.axis} tick={{ fill: chartTheme.axis, fontSize: 12 }} />
          <Tooltip
            contentStyle={chartTheme.tooltip}
            labelFormatter={(value) => new Date(String(value)).toLocaleDateString()}
          />
          {series.map((line) => (
            <Line
              key={line.id}
              type="monotone"
              dataKey={line.id}
              stroke={`var(${line.colorVar})`}
              dot={false}
              connectNulls={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
