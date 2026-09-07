import type { DurationStat, TimeGrain } from "../types/chat";
import { dateSpan } from "../metrics/volume";
import { Button, Select } from "../theme/UiKit";
import { useFilter } from "./FilterProvider";
import "./FilterBar.css";

const GRAINS: TimeGrain[] = ["day", "week", "month", "quarter"];
const STATS: DurationStat[] = ["median", "p90", "mean"];
const WINDOWS = [30, 120, 720, 1440] as const;

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
    <div className="filter-bar">
      <div className="filter-field">
        <span>People</span>
        <div className="filter-people">
          {uniqueSenders.map((name) => (
            <label key={name}>
              <input
                type="checkbox"
                checked={filter.senders === "all" || filter.senders.includes(name)}
                onChange={() => toggleSender(name)}
              />{" "}
              {name}
            </label>
          ))}
        </div>
      </div>
      <div className="filter-field">
        <span>Date range</span>
        <div className="preset-row">
          <Button variant="ghost" type="button" onClick={() => applyPreset(30)}>
            30d
          </Button>
          <Button variant="ghost" type="button" onClick={() => applyPreset(90)}>
            90d
          </Button>
          <Button variant="ghost" type="button" onClick={() => applyPreset(365)}>
            1y
          </Button>
          <Button variant="ghost" type="button" onClick={() => applyPreset(null)}>
            all
          </Button>
        </div>
      </div>
      <label className="filter-field">
        Time grain
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
      </label>
      <label className="filter-field">
        Duration statistic
        <Select
          aria-label="Duration statistic"
          value={filter.durationStat}
          onChange={(e) => setFilter({ ...filter, durationStat: e.target.value as DurationStat })}
        >
          {STATS.map((stat) => (
            <option key={stat} value={stat}>
              {stat}
            </option>
          ))}
        </Select>
      </label>
      <label className="filter-field">
        Hour start
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
      </label>
      <label className="filter-field">
        Hour end
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
      </label>
      <label className="filter-field">
        Reply window (response time only)
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
      </label>
    </div>
  );
}

type FilterStateWindow = 30 | 120 | 720 | 1440;
