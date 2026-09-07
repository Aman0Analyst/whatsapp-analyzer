# Web Dashboard Implementation Plan (team of 10)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a public, client-side WhatsApp analyzer on GitHub Pages: light brown visual system, shared filters on most metrics, response-time trends, 1:1 vs group layouts.

**Architecture:** Vite + React app in `web/`. Parse the `.txt` in the browser; never upload chat text. One `FilterState` drives all charts. Python CLI stays untouched except remaining green in CI.

**Tech Stack:** Vite 5, React 18, TypeScript, CSS variables (no CSS-in-JS), Recharts, Vitest, Playwright, GitHub Actions → Pages (`base: '/whatsapp-analyzer/'`).

**Spec:** [docs/PURPOSE-AND-USAGE.md](../../PURPOSE-AND-USAGE.md)

**Progress tracker (committed):** this table. Update it in the same commit as the matching code. Local agent scratch (`.superpowers/sdd/`) is not the source of truth.

| Task | Status | Notes |
|---|---|---|
| 0 Scaffold + frozen types | in progress | `web/` Vite app, `types/chat.ts`, brown tokens |
| 1 Theme / UI kit | not started | tokens exist; Card/Kpi/charts not built |
| 2 Parser | in progress | parallel track |
| 3 Metrics + aggregations | in progress | parallel track |
| 4 Filter bar | not started | |
| 5 Landing + upload | not started | |
| 6 Chart primitives | not started | |
| 7 Dashboard shell | not started | |
| 8 Words / emojis / media | not started | |
| 9 Response time UI | not started | |
| 10 Fixtures, Playwright, Pages | not started | |
| 11 Integration | not started | |
| Extra: Python via uv | done | `pyproject.toml`, `uv.lock`, CI `uv sync --frozen` |

## Global Constraints

- Chat file is read only via `FileReader` / `Blob.text()` in the browser; no `fetch` of the export; no `localStorage` of message bodies.
- Vite `base` is `/whatsapp-analyzer/` in production builds.
- Theme is **light only**. Palette is **shades of brown**. **Do not use green** (no WhatsApp green, no success-green, no teal, no `#25D366`).
- One UI font family: **Source Sans 3** (Google Fonts). Tabular numerals on KPI digits. No second display font.
- Charts use the `--series-*` brown tokens only. Error/warning uses terracotta `--danger`, not red/green pairs.
- Reply window filters **response time only**; it must not change message counts.
- Median/P90 require ≥ 5 samples in a bucket or omit the point.
- File-level facts (full span, unique names in whole file) labeled **Entire export**.
- Pin exact npm versions (no `latest`).
- Do not commit secrets or real personal chat exports; use synthetic fixtures.

---

## Parallel operating model

Ten people collide if they all edit `App.tsx`. **Own directories, not features-in-the-same-file.**

```
web/
  src/
    theme/          # P1  tokens, fonts, ChartTheme
    types/          # P0  frozen on Day 1 morning — everyone imports this
    parse/          # P2
    metrics/        # P3
    state/          # P4  FilterBar + FilterProvider
    charts/         # P6  dumb Recharts wrappers
    landing/        # P5
    dashboard/      # P7  layout shell + KPI cards (volume, rank, heatmap)
    content/        # P8  words, emojis, media rates
    reply/          # P9  response time
    samples/        # P10 fixtures + Playwright
```

**Git:** one branch per person (`p1-theme`, `p2-parse`, …) off `main` after Wave 0. Merge **types + theme first**. Then merge engines (parse, metrics, state). Then UI tracks. P10 merges last with CI.

**Standup rule:** if you need a type change, PR against `web/src/types/` only, 30-minute review, then everyone `git rebase`.

### Wave 0 — morning of day 1 (not parallel)

P1 + P4 + tech lead (~2–3 hours). Everyone else reads the spec and writes failing tests against the **published types** (tests compile even if functions `throw new Error('not implemented')`).

### Wave 1 — days 1–3 (8 tracks in parallel)

| Person | Track | Owns | Depends on (import only) |
|---|---|---|---|
| P1 | Visual system | `theme/` | `types` (series color ids) |
| P2 | Parser | `parse/` | `types` |
| P3 | Metrics + aggregations | `metrics/` | `types` |
| P4 | Filter state + bar | `state/` | `types`, `theme` |
| P5 | Landing + upload | `landing/` | `types`, `theme`, `parse` |
| P6 | Chart primitives | `charts/` | `theme` |
| P7 | Dashboard shell + volume/rank/heatmap | `dashboard/` | `types`, `theme`, `state`, `metrics`, `charts` |
| P8 | Words / emojis / media | `content/` | same as P7 |
| P9 | Response time | `reply/` | same as P7 |
| P10 | Fixtures, Vitest CI, Playwright, Pages workflow | `samples/`, `.github/` | all |

P5/P7/P8/P9 stub missing imports with empty arrays until P2/P3 merge. **Do not copy parser code into UI files.**

### Wave 2 — days 4–5 (integration)

P1 visual QA (no green, type scale, spacing). P10 privacy + Pages preview. P4 wires FilterBar into dashboard. P7 composes cards. Whole team dogfoods one 1:1 and one group fixture.

---

## File map

| Path | Responsibility |
|---|---|
| `web/src/types/chat.ts` | `ParsedMessage`, `LineType`, `FilterState`, `ReplyEvent` |
| `web/src/theme/tokens.css` | Brown CSS variables, type scale, radii |
| `web/src/theme/fonts.css` | Source Sans 3 import + body rules |
| `web/src/parse/parseExport.ts` | `.txt` → `ParsedMessage[]` |
| `web/src/metrics/filterMessages.ts` | Apply `FilterState` to messages |
| `web/src/metrics/volume.ts` | Counts, trends, sender rank |
| `web/src/metrics/heatmap.ts` | 7×24 grid |
| `web/src/metrics/replies.ts` | Reply events + bucketed stats |
| `web/src/metrics/words.ts` | Stop-worded ranks |
| `web/src/state/FilterProvider.tsx` | Context |
| `web/src/state/FilterBar.tsx` | Shared controls |
| `web/src/charts/TrendChart.tsx` | Line/area |
| `web/src/charts/RankBars.tsx` | Horizontal bars |
| `web/src/charts/HeatmapGrid.tsx` | Weekday × hour |
| `web/src/landing/LandingPage.tsx` | Privacy + dropzone |
| `web/src/dashboard/Dashboard.tsx` | Layout |
| `web/src/reply/ReplySection.tsx` | Response time UI |
| `web/public/samples/couple.txt` | Synthetic 1:1 |
| `web/public/samples/group.txt` | Synthetic group |
| `.github/workflows/web.yml` | Test + Pages deploy |

---

## Visual system (lock this; do not improvise)

Light parchment, espresso type, cocoa charts. Quiet luxury, not a coffee-shop collage. Lots of whitespace. 8px spacing grid. Cards: 16px radius, 1px `--border`, no drop shadows heavier than `0 1px 2px rgba(61, 44, 33, 0.06)`.

```css
/* web/src/theme/tokens.css — copy verbatim */
:root {
  --bg: #f7f1ea;
  --surface: #fffbf7;
  --surface-2: #f3e8dc;
  --ink: #3d2c21;
  --ink-muted: #7a6555;
  --border: #e4d5c3;
  --accent: #8b5e3c;
  --accent-hover: #6f4a2f;
  --danger: #b85c38;
  --focus: #c4a484;
  --series-1: #5c4033;
  --series-2: #8b5e3c;
  --series-3: #a67c52;
  --series-4: #c4a484;
  --series-5: #6b4f3a;
  --series-6: #9c7a5a;
  --series-7: #d4b896;
  --series-8: #4a3226;
  --radius: 16px;
  --font: "Source Sans 3", "Segoe UI", sans-serif;
  --text-xs: 0.75rem;
  --text-sm: 0.875rem;
  --text-md: 1rem;
  --text-lg: 1.25rem;
  --text-xl: 1.75rem;
  --text-hero: 2.25rem;
  --leading: 1.5;
}
```

Forbidden: `#25D366`, `#128C7E`, `#075E54`, any `#00`–`#3` greens, lime, mint. Success states use `--accent` (brown) plus the word “Ready,” not a green check.

---

### Task 0: Scaffold + frozen types (Wave 0, tech lead + P1 + P4)

**Files:**
- Create: `web/package.json`, `web/vite.config.ts`, `web/tsconfig.json`, `web/index.html`, `web/src/main.tsx`, `web/src/App.tsx`, `web/src/types/chat.ts`, `web/src/theme/tokens.css`, `web/src/theme/fonts.css`, `web/vitest.config.ts`
- Modify: `.gitignore` (add `web/node_modules`, `web/dist`)

**Interfaces:**
- Produces: types below; empty `App` that renders “WhatsApp Analyzer”

- [ ] **Step 1: Scaffold Vite React TS in `web/`** with `base: '/whatsapp-analyzer/'`.

```ts
// web/vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/whatsapp-analyzer/",
});
```

- [ ] **Step 2: Write `web/src/types/chat.ts` (do not rename fields later)**

```ts
export type LineType = "chat" | "attachment" | "event" | "deleted";

export type TimeGrain = "day" | "week" | "month" | "quarter";

export type CountStat = "sum";
export type DurationStat = "median" | "p90" | "mean";

export interface ParsedMessage {
  timestamp: Date;
  sender: string | null;
  body: string;
  lineType: LineType;
  words: string[];
  emojis: string[];
  domains: string[];
}

export interface ReplyEvent {
  at: Date;
  delaySeconds: number;
  replier: string;
}

export interface FilterState {
  senders: string[] | "all";
  rangeStart: Date | null;
  rangeEnd: Date | null;
  grain: TimeGrain;
  durationStat: DurationStat;
  hourStart: number; // 0–23 inclusive
  hourEnd: number;   // 0–23 inclusive
  replyWindowMinutes: 30 | 120 | 720 | 1440;
  stopwordLang: string | null;
}

export const defaultFilter = (): FilterState => ({
  senders: "all",
  rangeStart: null,
  rangeEnd: null,
  grain: "month",
  durationStat: "median",
  hourStart: 0,
  hourEnd: 23,
  replyWindowMinutes: 120,
  stopwordLang: "english",
});
```

- [ ] **Step 3: Add Source Sans 3 + tokens.css; set `body { font-family: var(--font); background: var(--bg); color: var(--ink); }`**
- [ ] **Step 4: `npm run build` from `web/` succeeds**
- [ ] **Step 5: Commit** `chore: scaffold web app with brown tokens and shared types`

---

### Task 1 — P1: Theme, type, and chart skin

**Files:**
- Create: `web/src/theme/ChartTheme.tsx`, `web/src/theme/UiKit.tsx` (`Page`, `Card`, `Button`, `Select`, `Kpi`), `web/src/theme/UiKit.test.tsx`
- Test: screenshot or class assertions: no `green` in CSS files (`rg -i green web/src/theme` must be empty)

**Interfaces:**
- Consumes: `--series-*` from tokens
- Produces: `<Card>`, `<Kpi label value hint>`, `<Button variant="primary" | "ghost">`

- [ ] **Step 1: Failing test — `tokens.css` contains `--bg: #f7f1ea` and does not contain `25D366`**
- [ ] **Step 2: Implement `Card` / `Kpi` / `Button` using only tokens**
- [ ] **Step 3: Recharts `ChartTheme`: grid `#e4d5c3`, axis `#7a6555`, tooltip `--surface`**
- [ ] **Step 4: Commit** `feat: brown light UI kit and chart theme`

**Done when:** a Story-less page of stacked cards looks like a quiet paper dashboard on `--bg`.

---

### Task 2 — P2: Parser

**Files:**
- Create: `web/src/parse/parseExport.ts`, `web/src/parse/patterns.ts`, `web/src/parse/parseExport.test.ts`
- Test fixtures: `web/src/parse/fixtures/*.txt`

**Interfaces:**
- Consumes: none except `ParsedMessage`
- Produces: `parseExport(text: string): { messages: ParsedMessage[]; warnings: string[] }`

- [ ] **Step 1: Write failing tests**

```ts
import { parseExport } from "./parseExport";

it("parses android dash format", () => {
  const { messages } = parseExport(
    "14/10/18, 11:16 - Ada: hello\n"
  );
  expect(messages[0].sender).toBe("Ada");
  expect(messages[0].body.trim()).toBe("hello");
});

it("parses ios brackets and pm", () => {
  const { messages } = parseExport(
    "[23/10/2020, 5:00:00 pm] User: message 🍆\n"
  );
  expect(messages[0].emojis).toContain("🍆");
  expect(messages[0].timestamp.getHours()).toBe(17);
});

it("joins following lines onto previous sender", () => {
  const text = `4/4/19, 20:41 - Bob: line one
still bob
4/4/19, 20:42 - Ada: next\n`;
  const { messages } = parseExport(text);
  expect(messages.filter((m) => m.sender === "Bob").length).toBeGreaterThanOrEqual(1);
});

it("marks media omitted as attachment", () => {
  const { messages } = parseExport(
    "2/22/19, 14:01 - Ada: <Media omitted>\n"
  );
  expect(messages[0].lineType).toBe("attachment");
});
```

- [ ] **Step 2: Run Vitest — FAIL (module missing)**
- [ ] **Step 3: Port `patterns.py` / `chatline.py` logic to TypeScript** (date-fns or native `Date` with the same trial orders as the Python `dateutil` path). Events → `lineType: "event"`, sender `null`.
- [ ] **Step 4: Tests PASS; also parse `chat_example.txt` copied into fixtures and expect > 1 unique sender**
- [ ] **Step 5: Commit** `feat: parse WhatsApp exports in the browser`

---

### Task 3 — P3: Metrics and shared aggregations

**Files:**
- Create: `web/src/metrics/filterMessages.ts`, `volume.ts`, `heatmap.ts`, `replies.ts`, `words.ts`, `sessions.ts`, `*.test.ts`

**Interfaces:**
- Consumes: `ParsedMessage[]`, `FilterState`
- Produces:

```ts
filterMessages(messages: ParsedMessage[], filter: FilterState): ParsedMessage[]
// senders "all" keeps everyone; hour filter uses timestamp.getHours()
// lineType event excluded from volume

volumeTrend(messages: ParsedMessage[], grain: TimeGrain): { t: Date; n: number }[]
senderRank(messages: ParsedMessage[]): { sender: string; n: number; share: number }[]
heatmap(messages: ParsedMessage[]): number[][] // 7 days × 24 hours, Monday=0

buildReplies(messages: ParsedMessage[], windowMinutes: number): ReplyEvent[]
// collapse same-sender bursts; gap > window is not a reply

replyTrend(
  events: ReplyEvent[],
  filter: FilterState
): { t: Date; sender: string; seconds: number | null }[]
// durationStat median|p90|mean; null if n < 5

topWords(messages: ParsedMessage[], stopwords: Set<string>, limit: number): { word: string; n: number }[]
sessionGapMinutes = 45
```

- [ ] **Step 1: Tests**

```ts
it("does not count A then A as a reply", () => {
  const msgs = [
    msg("Ada", "10:00"),
    msg("Ada", "10:01"),
    msg("Bob", "10:03"),
  ];
  const r = buildReplies(msgs, 120);
  expect(r).toHaveLength(1);
  expect(r[0].replier).toBe("Bob");
  expect(r[0].delaySeconds).toBe(120);
});

it("excludes 10h gap at 2h window", () => {
  const r = buildReplies([msg("Ada", "10:00"), msg("Bob", "20:00")], 120);
  expect(r).toHaveLength(0);
});

it("reply window does not change volume", () => {
  const f1 = { ...defaultFilter(), replyWindowMinutes: 30 };
  const f2 = { ...defaultFilter(), replyWindowMinutes: 1440 };
  const v1 = filterMessages(sample, f1).length;
  const v2 = filterMessages(sample, f2).length;
  expect(v1).toBe(v2);
});

it("omits median when bucket has 2 replies", () => {
  const points = replyTrend(twoEventsSameWeek, {
    ...defaultFilter(),
    grain: "week",
    durationStat: "median",
  });
  expect(points[0].seconds).toBeNull();
});
```

- [ ] **Step 2: Implement until PASS**
- [ ] **Step 3: Commit** `feat: shared filters, volume, heatmap, and reply metrics`

---

### Task 4 — P4: FilterProvider and FilterBar

**Files:**
- Create: `web/src/state/FilterProvider.tsx`, `FilterBar.tsx`, `FilterBar.test.tsx`

**Interfaces:**
- Consumes: `FilterState`, `defaultFilter`, P1 `Select`/`Button`
- Produces: `useFilter(): { filter, setFilter, uniqueSenders: string[] }`

- [ ] **Step 1: Test that changing grain in the bar updates context consumers**
- [ ] **Step 2: UI — people multi-select, range presets (30d / 90d / 1y / all), grain, duration stat, hour range, reply window (labeled “Response time only”)**
- [ ] **Step 3: Commit** `feat: shared dashboard filter bar`

---

### Task 5 — P5: Landing, privacy, upload

**Files:**
- Create: `web/src/landing/LandingPage.tsx`, `readChatFile.ts`, `LandingPage.test.tsx`

**Interfaces:**
- Consumes: `parseExport`
- Produces: `onParsed(messages: ParsedMessage[], warnings: string[]): void`

- [ ] **Step 1: Privacy copy visible without scrolling on 390px width**
- [ ] **Step 2: `readChatFile` uses `file.text()` only; reject non-`.txt` / empty; if `.zip`, use `fflate` or browser `Zip` only if you add a pinned dep — otherwise ask user to unzip (v1: `.txt` only is OK)**
- [ ] **Step 3: Loading state “Reading on this device…” — no spinner in green**
- [ ] **Step 4: Commit** `feat: client-side chat upload landing`

---

### Task 6 — P6: Dumb charts

**Files:**
- Create: `web/src/charts/TrendChart.tsx`, `RankBars.tsx`, `HeatmapGrid.tsx`, `*.test.tsx`

**Interfaces:**
- Consumes: P1 `ChartTheme`
- Produces:

```ts
TrendChart({ series: { id: string; colorVar: string; points: { t: Date; y: number | null }[] }[] })
RankBars({ rows: { label: string; n: number }[] })
HeatmapGrid({ grid: number[][] }) // brown opacity scale from --surface-2 to --series-1
```

- [ ] **Step 1: Heatmap cells use `rgba` of `--series-1`, never green**
- [ ] **Step 2: Null `y` → gap in the line (Recharts `connectNulls={false}`)**
- [ ] **Step 3: Commit** `feat: brown Recharts primitives`

---

### Task 7 — P7: Dashboard shell, KPIs, volume, rank, heatmap

**Files:**
- Create: `web/src/dashboard/Dashboard.tsx`, `EntireExportStrip.tsx`, `VolumeSection.tsx`, `RankSection.tsx`, `HeatmapSection.tsx`

**Interfaces:**
- Consumes: `useFilter`, `filterMessages`, `volumeTrend`, `senderRank`, `heatmap`, charts
- Produces: layout: strip → filter bar → KPI row → two-column charts

- [ ] **Step 1: 2 senders → show 1:1 subtitle; 3+ → group subtitle**
- [ ] **Step 2: KPI row: messages, msgs/day, unique senders (filtered), median reply (from P9 slot or placeholder `—`)**
- [ ] **Step 3: Entire export strip never uses `filterMessages`**
- [ ] **Step 4: Commit** `feat: dashboard shell with volume rank heatmap`

---

### Task 8 — P8: Words, emojis, media

**Files:**
- Create: `web/src/content/ContentSection.tsx`, `web/src/content/stopwords/` (copy needed languages from repo `stop-words/`, start with `english` + `indonesian`)

**Interfaces:**
- Consumes: `topWords`, `FilterState.stopwordLang`
- Produces: top 20 words, top emojis, media/link/deleted **rates** (count / chat messages)

- [ ] **Step 1: Test stopword `the` absent when lang is english**
- [ ] **Step 2: Changing people/date range changes word list**
- [ ] **Step 3: Commit** `feat: words emojis and media rates`

---

### Task 9 — P9: Response time section

**Files:**
- Create: `web/src/reply/ReplySection.tsx`, `formatDuration.ts`

**Interfaces:**
- Consumes: `buildReplies`, `replyTrend`, `filter.replyWindowMinutes`, `filter.durationStat`
- Produces: per-person KPI (median, p90, n, vs previous grain bucket), trend overlay, sortable table

- [ ] **Step 1: Copy: “Send time to next message, ignoring gaps longer than [window]. Not read receipts.”**
- [ ] **Step 2: Changing reply window updates this section only; volume KPI unchanged (integration test with P3/P7)**
- [ ] **Step 3: Grey row if `n < 10` in selected range: “not enough replies”**
- [ ] **Step 4: If unique senders > 15, show muted note that group reply is a last-speaker proxy**
- [ ] **Step 5: Commit** `feat: response time headlines and trends`

---

### Task 10 — P10: Fixtures, CI, Playwright, Pages

**Files:**
- Create: `web/public/samples/couple.txt`, `web/public/samples/group.txt`, `web/playwright.config.ts`, `web/e2e/privacy.spec.ts`, `web/e2e/dashboard.spec.ts`, `.github/workflows/web.yml`
- Modify: `.github/workflows/test.yml` only if needed; do not drop Python tests

**Interfaces:**
- Consumes: full app
- Produces: CI green on PR

- [ ] **Step 1: Synthetic couple (2 names, ~80 lines) and group (6 names, events, media omitted)**
- [ ] **Step 2: Playwright — landing privacy text; upload couple → 1:1 layout; upload group → rank; filter 30d updates charts**
- [ ] **Step 3: Privacy test — route `**/*` and assert no request contains `UNIQUE_TOKEN_TEST_XYZ` after upload of a file containing that token**
- [ ] **Step 4: Workflow: `npm ci && npm test && npx playwright test` in `web/`; deploy `web/dist` to Pages on `main`**
- [ ] **Step 5: Commit** `ci: test web app and deploy GitHub Pages`

Example workflow jobs:

```yaml
name: Web
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: web
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: npm
          cache-dependency-path: web/package-lock.json
      - run: npm ci
      - run: npm test
      - run: npx playwright install --with-deps
      - run: npx playwright test
  pages:
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    needs: test
    runs-on: ubuntu-latest
    permissions:
      pages: write
      id-token: write
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: npm
          cache-dependency-path: web/package-lock.json
      - run: npm ci && npm run build
        working-directory: web
      - uses: actions/upload-pages-artifact@v3
        with:
          path: web/dist
      - uses: actions/deploy-pages@v4
```

---

### Task 11 — Wave 2 integration (whole team, P7 owns the PR)

**Files:**
- Modify: `web/src/App.tsx` (landing vs dashboard), `web/src/dashboard/Dashboard.tsx` (compose P8 + P9)

- [ ] **Step 1: App state: `messages === null` → Landing; else Dashboard. “Analyze another file” clears messages (no persistence)**
- [ ] **Step 2: Shared FilterBar once at top; no second grain control inside ReplySection**
- [ ] **Step 3: Visual QA checklist:** Source Sans 3 everywhere; contrast ink on parchment; 390px and 1280px; **zero green** in computed styles of buttons/charts
- [ ] **Step 4: `npm run build && npm run preview` — hard-refresh `/whatsapp-analyzer/`**
- [ ] **Step 5: Commit** `feat: wire landing dashboard filters and all v1 sections`

---

## Daily coordination (10 people)

- **09:00** 10-minute standup: blockers on `types/` only.
- **Slack/thread:** paste the file path you are editing today (one path family per person).
- **Review:** P1 reviews all UI PRs for tokens/fonts. P3 reviews any metric formula change. P10 reviews CI.
- **Do not** restyle charts in feature PRs — open a P1 follow-up.

## Definition of done (v1)

Matches [docs/PURPOSE-AND-USAGE.md](../../PURPOSE-AND-USAGE.md) ship checklist, plus: light brown theme, Source Sans 3 only, no green, shared aggregations on volume/heatmap/words/emojis/reply time, response-time trend with grain/people/stat.

---

## Self-review

- Spec coverage: parser, privacy, Pages base, shared filters, reply definition, 1:1 vs group, small samples, Entire export, test order A–G → tasks 2, 3, 5, 7, 9, 10, 11.
- No green / brown UI → Task 1 + Task 11 visual QA.
- Types named consistently: `FilterState`, `ReplyEvent`, `parseExport`, `buildReplies`, `replyTrend`.
