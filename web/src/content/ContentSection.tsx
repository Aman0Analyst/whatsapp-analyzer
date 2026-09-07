import { RankBars } from "../charts/RankBars";
import { contentRates, topEmojis } from "../metrics/content";
import { filterMessages } from "../metrics/filterMessages";
import { topWords } from "../metrics/words";
import { useFilter } from "../state/FilterProvider";
import { InfoTip, SectionCard, Select } from "../theme/UiKit";
import type { ParsedMessage } from "../types/chat";
import { stopwordSet } from "./stopwords";
import "../dashboard/dashboard.css";

function percent(rate: number): string {
  const pct = rate * 100;
  if (pct > 0 && pct < 1) return "<1%";
  return `${Math.round(pct)}%`;
}

export function ContentSection({ messages }: { messages: ParsedMessage[] }) {
  const { filter, setFilter } = useFilter();
  const kept = filterMessages(messages, filter);
  const words = topWords(kept, stopwordSet(filter.stopwordLang), 12);
  const emojis = topEmojis(kept, 16);
  const rates = contentRates(kept);

  const tiles = [
    { label: "Media", n: rates.attachments, rate: rates.attachmentRate },
    { label: "Links", n: rates.links, rate: rates.linkRate },
    { label: "Deleted", n: rates.deleted, rate: rates.deletedRate },
  ];

  return (
    <SectionCard
      title="Words, emojis & media"
      description="What the chat is actually made of."
      metric="topWords"
    >
      <div className="rate-tiles">
        {tiles.map((tile) => (
          <div className="rate-tile" key={tile.label}>
            <span className="rate-label">
              {tile.label}
              {tile.label === "Media" ? <InfoTip metric="contentRates" /> : null}
            </span>
            <span className="rate-value">{tile.n.toLocaleString()}</span>
            <span className="rate-share">{percent(tile.rate)} of messages</span>
          </div>
        ))}
      </div>

      <div className="content-split">
        <div>
          <div className="content-head">
            <h3 className="subhead">Top words</h3>
            <div className="field content-lang">
              <span className="field-label">Stop words</span>
              <Select
                aria-label="Stop-word language"
                value={filter.stopwordLang ?? ""}
                onChange={(e) => setFilter({ ...filter, stopwordLang: e.target.value || null })}
              >
                <option value="">None</option>
                <option value="english">English</option>
                <option value="indonesian">Indonesian</option>
              </Select>
            </div>
          </div>
          {words.length === 0 ? (
            <p className="empty">No words left after filtering.</p>
          ) : (
            <RankBars rows={words.map((row) => ({ label: row.word, n: row.n }))} />
          )}
        </div>

        <div>
          <div className="content-head">
            <h3 className="subhead">
              Top emojis
              <InfoTip metric="topEmojis" />
            </h3>
          </div>
          {emojis.length === 0 ? (
            <p className="empty">No emojis in this range.</p>
          ) : (
            <ul className="emoji-grid">
              {emojis.map((row) => (
                <li className="emoji-tile" key={row.emoji}>
                  <span className="emoji-glyph">{row.emoji}</span>
                  <span className="emoji-count">{row.n.toLocaleString()}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </SectionCard>
  );
}
