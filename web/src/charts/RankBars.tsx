import "./charts.css";

export interface RankRow {
  label: string;
  n: number;
  share?: number;
  colorVar?: string;
}

/**
 * Ranked horizontal bars in plain DOM. An SVG bar chart truncated the long
 * phone-number labels a WhatsApp export uses, so the names live in the list
 * itself and the bar is a background layer behind them.
 */
export function RankBars({ rows }: { rows: RankRow[] }) {
  if (rows.length === 0) return <p className="empty">Nobody sent a message in this range.</p>;

  const max = Math.max(...rows.map((row) => row.n));
  const total = rows.reduce((sum, row) => sum + row.n, 0);

  return (
    <ol className="rank">
      {rows.map((row, i) => {
        const share = row.share ?? (total === 0 ? 0 : row.n / total);
        return (
          <li className="rank-row" key={row.label}>
            <span className="rank-index">{i + 1}</span>
            <span className="rank-track">
              <span
                className="rank-fill"
                style={{
                  width: `${Math.max(2, (row.n / max) * 100)}%`,
                  background: `var(${row.colorVar ?? "--series-1"})`,
                }}
              />
              <span className="rank-name" title={row.label}>
                {row.label}
              </span>
            </span>
            <span className="rank-value">
              {row.n.toLocaleString()}
              <span className="rank-share">{(share * 100).toFixed(share < 0.1 ? 1 : 0)}%</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
