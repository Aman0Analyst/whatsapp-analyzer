import { contentRates, topEmojis } from "../metrics/content";
import { filterMessages } from "../metrics/filterMessages";
import { topWords } from "../metrics/words";
import { useFilter } from "../state/FilterProvider";
import { Card, Select } from "../theme/UiKit";
import type { ParsedMessage } from "../types/chat";
import { stopwordSet } from "./stopwords";
import "../dashboard/dashboard.css";

export function ContentSection({ messages }: { messages: ParsedMessage[] }) {
  const { filter, setFilter } = useFilter();
  const kept = filterMessages(messages, filter);
  const words = topWords(kept, stopwordSet(filter.stopwordLang), 20);
  const emojis = topEmojis(kept, 20);
  const rates = contentRates(kept);

  return (
    <Card>
      <h2>Words, emojis, media</h2>
      <label className="filter-field">
        Stop-word language
        <Select
          aria-label="Stop-word language"
          value={filter.stopwordLang ?? ""}
          onChange={(e) => setFilter({ ...filter, stopwordLang: e.target.value || null })}
        >
          <option value="">None</option>
          <option value="english">English</option>
          <option value="indonesian">Indonesian</option>
        </Select>
      </label>
      <h3>Top words</h3>
      <ul className="word-list">
        {words.map((row) => (
          <li key={row.word}>
            {row.word} <span className="muted">{row.n}</span>
          </li>
        ))}
      </ul>
      <h3>Top emojis</h3>
      <ul className="emoji-list">
        {emojis.map((row) => (
          <li key={row.emoji}>
            {row.emoji} <span className="muted">{row.n}</span>
          </li>
        ))}
      </ul>
      <p>
        Media {rates.attachments} ({Math.round(rates.attachmentRate * 100)}%) · Links {rates.links}{" "}
        ({Math.round(rates.linkRate * 100)}%) · Deleted {rates.deleted} (
        {Math.round(rates.deletedRate * 100)}%)
      </p>
    </Card>
  );
}
