import { RankBars } from "../charts/RankBars";
import { contentRates, topDomains, topEmojis, topEmojisBySender } from "../metrics/content";
import { filterMessages } from "../metrics/filterMessages";
import { longMessages } from "../metrics/outliers";
import { topWords } from "../metrics/words";
import { useFilter } from "../state/FilterProvider";
import { InfoTip, SectionCard, Select } from "../theme/UiKit";
import { senderColors } from "../theme/senderColor";
import type { ParsedMessage } from "../types/chat";
import { stopwordSet } from "./stopwords";
import "../dashboard/dashboard.css";
import "./content.css";

const BODY_MAX = 160;
const LONGEST_VISIBLE = 6;

function percent(rate: number): string {
  const pct = rate * 100;
  if (pct > 0 && pct < 1) return "<1%";
  return `${Math.round(pct)}%`;
}

function truncate(body: string): string {
  const flat = body.replace(/\s+/g, " ").trim();
  if (flat.length <= BODY_MAX) return flat;
  return `${flat.slice(0, BODY_MAX).trimEnd()}…`;
}

function when(at: Date): string {
  return `${at.toLocaleDateString()} ${at.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

export function ContentSection({ messages }: { messages: ParsedMessage[] }) {
  const { filter, setFilter, uniqueSenders } = useFilter();
  const colors = senderColors(uniqueSenders);
  const kept = filterMessages(messages, filter);
  const words = topWords(kept, stopwordSet(filter.stopwordLang), 12);
  const emojis = topEmojis(kept, 16);
  const emojisBySender = topEmojisBySender(kept, 8);
  const domains = topDomains(kept, 8);
  const longest = longMessages(kept, { stripEmojis: filter.stripEmojisForLength });
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

          {domains.length > 0 ? (
            <div className="content-block">
              <h3 className="subhead">Most shared sites</h3>
              <ol className="mini-rank">
                {domains.map((row, i) => (
                  <li className="mini-rank-row" key={row.domain}>
                    <span className="mini-rank-index">{i + 1}</span>
                    <span className="mini-rank-label" title={row.domain}>
                      {row.domain}
                    </span>
                    <span className="mini-rank-value">{row.n.toLocaleString()}</span>
                  </li>
                ))}
              </ol>
            </div>
          ) : null}
        </div>
      </div>

      {emojisBySender.length > 0 ? (
        <div className="content-block">
          <h3 className="subhead">
            Emojis per person
            <InfoTip metric="topEmojisBySender" />
          </h3>
          <ul className="emoji-people">
            {emojisBySender.map((row) => (
              <li key={row.sender}>
                <span className="emoji-person-name">
                  <span
                    className="person-swatch"
                    style={{ background: `var(${colors.get(row.sender) ?? "--series-1"})` }}
                  />
                  {row.sender}
                </span>
                <span className="emoji-run">
                  {row.emojis.map((cell) => (
                    <span className="emoji-run-item" key={cell.emoji}>
                      <span className="emoji-run-glyph">{cell.emoji}</span>
                      <span className="emoji-run-count">{cell.n.toLocaleString()}</span>
                    </span>
                  ))}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {longest.length > 0 ? (
        <div className="content-block">
          <h3 className="subhead">
            Longest messages
            <InfoTip metric="longMessages" />
          </h3>
          <ol className="longest">
            {longest.slice(0, LONGEST_VISIBLE).map((row, i) => (
              <li className="longest-row" key={`${row.message.timestamp.getTime()}-${i}`}>
                <div className="longest-head">
                  <span className="longest-sender">
                    <span
                      className="person-swatch"
                      style={{
                        background: `var(${colors.get(row.message.sender ?? "") ?? "--series-1"})`,
                      }}
                    />
                    {row.message.sender ?? "Unknown"}
                  </span>
                  <span>{when(row.message.timestamp)}</span>
                  <span className="longest-length">
                    {row.length.toLocaleString()} characters
                  </span>
                </div>
                <p className="longest-body">{truncate(row.message.body)}</p>
              </li>
            ))}
          </ol>
        </div>
      ) : null}
    </SectionCard>
  );
}
