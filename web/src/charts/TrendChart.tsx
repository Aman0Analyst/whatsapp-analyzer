import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { chartTheme, formatBucket, formatBucketLong, formatCompact } from "../theme/ChartTheme";
import { formatDuration } from "../reply/formatDuration";
import type { TimeGrain } from "../types/chat";

export interface TrendSeries {
  id: string;
  colorVar: string;
  points: { t: Date; y: number | null }[];
}

export function TrendChart({
  series,
  grain = "month",
  valueKind = "count",
  height = 260,
}: {
  series: TrendSeries[];
  grain?: TimeGrain;
  valueKind?: "count" | "duration";
  height?: number;
}) {
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

  const formatValue = (value: number) =>
    valueKind === "duration" ? formatDuration(value) : formatCompact(value);
  const solo = series.length === 1;

  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer width="100%" height="100%" minWidth={200} minHeight={160}>
        <AreaChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          <defs>
            {series.map((line) => (
              <linearGradient
                key={line.id}
                id={`fill-${line.id.replace(/\W/g, "-")}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor={`var(${line.colorVar})`} stopOpacity={0.28} />
                <stop offset="100%" stopColor={`var(${line.colorVar})`} stopOpacity={0.02} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid stroke={chartTheme.grid} strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="t"
            stroke={chartTheme.grid}
            tick={{ fill: chartTheme.axis, fontSize: 12 }}
            tickMargin={8}
            minTickGap={24}
            tickFormatter={(value) => formatBucket(new Date(String(value)), grain)}
          />
          <YAxis
            stroke={chartTheme.grid}
            tick={{ fill: chartTheme.axis, fontSize: 12 }}
            tickFormatter={formatValue}
            width={48}
          />
          <Tooltip
            contentStyle={chartTheme.tooltip}
            labelFormatter={(value) => formatBucketLong(new Date(String(value)), grain)}
            formatter={(value) => formatValue(Number(value))}
          />
          {series.length > 1 ? (
            <Legend
              iconType="plainline"
              iconSize={12}
              wrapperStyle={{ fontSize: "0.75rem", paddingTop: 8 }}
            />
          ) : null}
          {series.map((line) => (
            <Area
              key={line.id}
              type="monotone"
              dataKey={line.id}
              stroke={`var(${line.colorVar})`}
              strokeWidth={2}
              fill={solo ? `url(#fill-${line.id.replace(/\W/g, "-")})` : "none"}
              dot={false}
              activeDot={{ r: 3, strokeWidth: 0 }}
              connectNulls={false}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
