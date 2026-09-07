import type { DurationStat, TimeGrain } from "../types/chat";
import { dateSpan } from "../metrics/volume";
import { Button, InfoTip, Select } from "../theme/UiKit";
import { senderColors } from "../theme/senderColor";
import { useFilter } from "./FilterProvider";
import "./FilterBar.css";

const GRAINS: TimeGrain[] = ["day", "week", "month", "quarter"];
const STATS: DurationStat[] = ["median", "p90", "mean"];
const WINDOWS = [30, 120, 720, 1440] as const;
const PRESETS: { label: string; days: number | null }[] = [
  { label: "30d", days: 30 },
  { label: "90d", days: 90 },
  { label: "1y", days: 365 },
  { label: "all", days: null },
];

type FilterStateWindow = 30 | 120 | 720 | 1440;

function hours(): number[] {
  return Array.from({ length: 24 }, (_, i) => i);
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date.getTime());
  next.setDate(next.getDate() + days);
  return next;
}

export function FilterBar() {
  const { filter, setFilter, uniqueSenders, messages } = useFilter();
  const span = dateSpan(messages);
  const end = span?.end ?? new Date();
  const colors = senderColors(uniqueSenders);
  const activePreset = filter.rangeStart === null && filter.rangeEnd === null ? "all" : null;
  const allSelected = filter.senders === "all";

  const applyPreset = (days: number | null) => {
    if (days === null) {
      setFilter({ ...filter, rangeStart: null, rangeEnd: null });
      return;
    }
    setFilter({ ...filter, rangeStart: addDays(end, -days), rangeEnd: end });
  };

  const toggleSender = (name: string) => {
    const current = filter.senders === "all" ? uniqueSenders : filter.senders;
    const next = current.includes(name) ? current.filter((n) => n !== name) : [...current, name];
    setFilter({ ...filter, senders: next.length === uniqueSenders.length ? "all" : next });
  };

  return (
    <section className="filter-bar" aria-label="Filters">
      <div className="filter-people-block">
        <div className="field-label">
          People
          <InfoTip metric="people" />
          <button
            type="button"
            className="filter-linkbtn"
            onClick={() => setFilter({ ...filter, senders: "all" })}
            disabled={allSelected}
          >
            select all
          </button>
        </div>
        <div className="filter-people">
          {uniqueSenders.map((name) => {
            const on = allSelected || filter.senders.includes(name);
            return (
              <label className="check" key={name} title={name}>
                <input type="checkbox" checked={on} onChange={() => toggleSender(name)} />
                <span
                  className="check-swatch"
                  style={{ background: `var(${colors.get(name) ?? "--series-1"})` }}
                />
                <span className="check-name">{name}</span>
              </label>
            );
          })}
        </div>
      </div>

      <div className="filter-controls">
        <div className="field">
          <span className="field-label">
            Date range
            <InfoTip metric="dateRange" />
          </span>
          <div className="preset-row">
            {PRESETS.map((preset) => (
              <Button
                variant="ghost"
                className="btn-sm"
                type="button"
                key={preset.label}
                aria-pressed={preset.label === "all" ? activePreset === "all" : undefined}
                onClick={() => applyPreset(preset.days)}
              >
                {preset.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="field">
          <span className="field-label">
            Time grain
            <InfoTip metric="grain" />
          </span>
          <Select
            aria-label="Time grain"
            value={filter.grain}
            onChange={(e) => setFilter({ ...filter, grain: e.target.value as TimeGrain })}
          >
            {GRAINS.map((grain) => (
              <option key={grain} value={grain}>
                {grain}
              </option>
            ))}
          </Select>
        </div>

        <div className="field">
          <span className="field-label">
            Duration stat
            <InfoTip metric="durationStat" />
          </span>
          <Select
            aria-label="Duration statistic"
            value={filter.durationStat}
            onChange={(e) =>
              setFilter({ ...filter, durationStat: e.target.value as DurationStat })
            }
          >
            {STATS.map((stat) => (
              <option key={stat} value={stat}>
                {stat}
              </option>
            ))}
          </Select>
        </div>

        <div className="field">
          <span className="field-label">
            Hours
            <InfoTip metric="hourFilter" />
          </span>
          <div className="hour-row">
            <Select
              aria-label="Hour start"
              value={filter.hourStart}
              onChange={(e) => setFilter({ ...filter, hourStart: Number(e.target.value) })}
            >
              {hours().map((h) => (
                <option key={h} value={h}>
                  {String(h).padStart(2, "0")}:00
                </option>
              ))}
            </Select>
            <span className="hour-dash">to</span>
            <Select
              aria-label="Hour end"
              value={filter.hourEnd}
              onChange={(e) => setFilter({ ...filter, hourEnd: Number(e.target.value) })}
            >
              {hours().map((h) => (
                <option key={h} value={h}>
                  {String(h).padStart(2, "0")}:00
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div className="field">
          <span className="field-label">
            Reply window
            <InfoTip metric="replyWindow" />
          </span>
          <Select
            aria-label="Reply window (response time only)"
            value={filter.replyWindowMinutes}
            onChange={(e) =>
              setFilter({
                ...filter,
                replyWindowMinutes: Number(e.target.value) as FilterStateWindow,
              })
            }
          >
            {WINDOWS.map((mins) => (
              <option key={mins} value={mins}>
                {mins < 60 ? `${mins} min` : `${mins / 60} h`}
              </option>
            ))}
          </Select>
        </div>
      </div>
    </section>
  );
}
