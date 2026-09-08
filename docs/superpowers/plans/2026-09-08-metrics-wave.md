# Metrics wave (10 parallel tracks)

**Goal:** Ship Wave 1 + requested metrics on web **and** CLI, with Lemay/Ive-level UI. Same formulas both skins.

**Frozen already (do not fight over these):**
- `FilterState.stripEmojisForLength` default `true` in `web/src/types/chat.ts`
- `quantile` / `p99` / `quartile1` / `quartile3` in `web/src/metrics/buckets.ts`

**Global constraints:** parchment brown theme, no WhatsApp green, Source Sans 3, chat never uploaded, no `localStorage` of bodies, pin exact npm versions, no secrets, no `eval`. Help copy is plain language (Typical, not “median” in the label). Do **not** git commit. Do **not** dispatch further subagents. Own **only** the files listed for your track. If you need a function from another track, import the **exact signature below** — do not duplicate it in a second file.

**Sprint scope (must):** talk share by words, words per message, active/silent days, longest silence, session duration + messages per session + people per burst + closers, top domains shown, top N emojis per sender, long/outlier messages with emoji strip, reply vs previous period, silent names in file vs filtered, concentration. Stretch only if your files are done: question-mark rate, night/weekend share.

---

## Frozen APIs

### `web/src/metrics/talk.ts` (P2)
```ts
export function talkShareByWords(messages: ParsedMessage[]): { sender: string; words: number; share: number }[]
export function wordsPerMessageBySender(messages: ParsedMessage[], stat: DurationStat): { sender: string; value: number | null }[]
export function activeAndSilentDays(messages: ParsedMessage[]): { activeDays: number; silentDays: number; spanDays: number }
export function longestSilenceSeconds(messages: ParsedMessage[]): number | null
```
Chat lines only for word metrics. Countable (non-event) for days/silence. `longestSilence` is max gap between consecutive countable timestamps in the filtered list (sorted). Empty → null.

### `web/src/metrics/sessions.ts` (P3) — add, keep existing `buildSessions` / `sessionStarts`
```ts
export function sessionStats(messages: ParsedMessage[]): {
  count: number
  medianDurationSeconds: number | null
  medianMessageCount: number | null
  medianPeoplePerBurst: number | null
}
export function sessionClosers(messages: ParsedMessage[]): { sender: string; n: number; share: number }[]
```
Closer = sender of the last message in the session. Duration = last.end − start. `medianPeoplePerBurst` = median of `participants.length`. Duration medians need ≥5 sessions else null.

### `web/src/metrics/content.ts` (P4)
```ts
export function topEmojisBySender(messages: ParsedMessage[], limit: number): { sender: string; emojis: { emoji: string; n: number }[] }[]
```
Same occurrence counting as `topEmojis`. Skip senders with zero emojis. Sort senders by total emoji count desc.

### `web/src/metrics/outliers.ts` (P4)
```ts
export function textLength(message: ParsedMessage, stripEmojis: boolean): number
export function longMessages(
  messages: ParsedMessage[],
  opts: { stripEmojis: boolean; vsSender?: boolean },
): { message: ParsedMessage; length: number; reasons: Array<"p99" | "iqr"> }[]
```
Only `lineType === "chat"`. Length = character count of `body` after optional removal of every string in `message.emojis` (and leftover emoji codepoints via `\p{Extended_Pictographic}`). Skip length 0 after strip. Flag if length ≥ p99 of the comparison set **or** length > Q3 + 1.5×(Q3−Q1) when n ≥ 8. Default comparison set = all eligible messages; `vsSender: true` compares within that sender. Include a message if either reason fires. Sort longest first. Need ≥ 8 chat lines or return [].

### `web/src/metrics/groupHealth.ts` (P5)
```ts
export function silentInFile(fileMessages: ParsedMessage[], filtered: ParsedMessage[]): string[]
export function messageConcentration(messages: ParsedMessage[]): number
export function nightShare(messages: ParsedMessage[]): number
export function weekendShare(messages: ParsedMessage[]): number
export function questionRate(messages: ParsedMessage[]): { sender: string; questions: number; chats: number; rate: number }[]
```
Silent = unique senders in whole file countable lines minus unique senders in filtered. Concentration = Herfindahl of message-count shares (sum of squared shares, 0–1). Night = hour 22–5 inclusive wrap. Weekend = Sat+Sun. Question = chat body includes `?`.

### `web/src/metrics/replies.ts` (P6) — add
```ts
export function replyVsPreviousPeriod(
  events: ReplyEvent[],
  filter: FilterState,
): { current: number | null; previous: number | null; deltaSeconds: number | null } | null
```
Split filtered replies at midpoint of filtered date span (or of event times if no range). Each side uses `filter.durationStat` with MIN_DURATION_SAMPLE.

---

## Tracks (exclusive files)

| ID | Owns | Do not touch |
|---|---|---|
| P1 | `web/src/theme/**` except do not break tokens tests (no green) | metrics, python |
| P2 | `talk.ts`, `talk.test.ts` only (new) | nothing else |
| P3 | `web/src/metrics/sessions.ts`, `sessions.test.ts` | |
| P4 | `content.ts`, `content.test.ts`, **new** `outliers.ts`, `outliers.test.ts` | ContentSection |
| P5 | **new** `groupHealth.ts`, `groupHealth.test.ts` | |
| P6 | `replies.ts`, `replies.test.ts`, `web/src/reply/**` | Dashboard.tsx |
| P7 | `web/src/dashboard/**` including new section components, `Dashboard.tsx`, `dashboard.css` | content/, reply/, theme tokens |
| P8 | `web/src/content/**` | metrics engines except imports |
| P9 | `whatsapp_analyzer.py`, `tests/**` (new test file ok), `chatline.py` only if required | web/ |
| P10 | `FilterBar.tsx`, `FilterBar.css`, `FilterBar.test.tsx`, `help/metrics.ts`, `web/e2e/**` | metric formulas |

P7/P8/P6 import frozen APIs. If a module is missing while you work, still write UI against the signatures; TypeScript will fail until P2–P5 land — that is OK; keep going.

**UI (P1, P6, P7, P8):** Steve Lemay + Jony Ive. One story per section, not a wall of equal cards. Plain-language labels. Outliers are a **reading list** (sender, time, truncated body), not a histogram. Per-sender emojis are a **row of glyphs + counts**, not another identical bar chart. Fewer chrome. Match existing parchment / Source Sans 3 / `--series-*`.

**CLI (P9):** Print every new metric. `--strip-emoji` default on for outliers (flag `--keep-emoji-in-length` to disable). Top 8 emojis per sender not only favourite. Same p99/IQR. Do not upload anything. Pin no new deps unless already in the project (`emoji` is already used).

**P10:** Filter control: “Ignore emojis in long messages” default on, `InfoTip metric="stripEmojis"`. Help entries for every new on-screen metric. `stripEmojisForLength` must not change volume counts (add to sharedFilters.test).
