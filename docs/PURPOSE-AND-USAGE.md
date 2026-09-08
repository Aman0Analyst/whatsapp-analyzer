# Purpose, usage, and how to test before deploy

Team implementation plan (10 people, brown light UI, GitHub Pages): [docs/superpowers/plans/2026-09-07-web-dashboard.md](../superpowers/plans/2026-09-07-web-dashboard.md).

The Python CLI in this repo works today. The public dashboard (Vite + React, analysis in the browser, no server) is the planned web surface. Testing below covers both.

---

## Purpose

WhatsApp’s own export is a raw `.txt` log. This project turns that log into insight: who talks, when, how fast people reply (and whether that speed changes over months), which words and emojis show up, and (on the web) a dashboard that changes shape for **two people** vs a **group**.

It is meant for **anyone on the internet**, not only people who run Python. Chat exports are private. The web app must read the file **only in the browser** and never upload it.

What a `.txt` export actually contains: timestamps, sender names, message text, media placeholders, some group events (join/leave), deleted-message markers. What it does **not** contain: read receipts, reliable reply-to threads, reactions, or silent members who never sent a message.

WhatsApp also typically caps an export at about the **last 40,000 messages**. The UI should not pretend the file is the full history of a long group.

---

## Who it is for

| Audience | What they do |
|---|---|
| Anyone with an exported chat | Drop a `.txt` on the public site and see a dashboard |
| CLI users | Run `whatsapp_analyzer.py` locally |
| 1:1 chats | See balance, who starts conversations, reply time and its trend |
| Groups | See sender rank, who replies slowly/quickly, quiet names in the file |

---

## Usage

### 1. Export the chat (no media)

Use **Without Media**. Media files are large and the text already has placeholders (`<Media omitted>`, `image omitted`, and similar).

**Android**

1. Open the chat or group.
2. Menu (three dots) → **More** → **Export chat**.
3. Choose **Without Media**.
4. Save or share the `.txt` (sometimes inside a `.zip`).

**iOS**

1. Open the chat or group.
2. Tap the name at the top.
3. Scroll to **Export Chat**.
4. Choose **Without Media**.

Supported line shapes include Android dash style and iOS bracket style, for example:

```text
14/10/18, 11:16 - Contact Name: this is a message
2/30/18, 2:07 AM - Contact Name: Test👌
[30/12/18 4.59.25 PM] Nama User: 🙏test
```

Date formats vary by phone locale. If a file fails to parse, that is a parser bug to fix with a fixture, not a user error to ignore.

### 2. Web app (planned public site)

1. Open the GitHub Pages URL (project site, e.g. `https://<user>.github.io/whatsapp-analyzer/`).
2. Read the privacy note: the file stays on your device.
3. Choose the `.txt` (or unzip first if WhatsApp gave you a `.zip`).
4. Optionally pick a stop-word language so common words (`the`, `yang`, …) do not dominate word ranks.
5. For a 1:1 chat, optionally pick **This is me** so “who starts” is from your point of view.
6. Read the dashboard. A **global filter bar** (people, date range, time grain) applies to **most** charts at once. Refresh or close the tab; the chat is gone.

**v1 dashboard (both modes):** totals, messages per day, sender rank, activity heatmap, timeline, top words, top emojis, **response time** — all driven by the same aggregations unless noted below.

**If exactly two senders:** session starters, reply time each way, words per message.

**If three or more senders:** share of messages, people who never sent in this export, typical number of people in a burst of chat.

---

## Shared aggregations (most metrics)

Parse once into a list of messages (and a derived list of reply events). Every chart is a **filter + bucket + reduce** over those lists. Changing a control must not re-read the file.

The filter bar sits at the top of the dashboard and is **shared**: sender rank, heatmap, timeline, words, emojis, response time, and session stats all see the same selection.

### Controls

| Control | Options | Default | What it does |
|---|---|---|---|
| **People** | All, or multi-select senders | All (1:1: both names visible as a compare) | Keep only those senders’ messages. Rankings and word/emoji lists recompute on the subset. |
| **Date range** | Full span, presets (30d / 90d / 1y), or chart brush | Full export | Drop messages (and replies) outside the range. Headline cards are for this range only. |
| **Time grain** | Day / week / month / quarter | Week if span ≤ 6 months, else month | Bucket for **trend** charts (volume, reply time, words/day, media/day). |
| **Statistic** | Sum, or Typical / Slow replies / Average for durations | Sum for counts; **Typical** for durations | Volume trends use sum (messages). Reply time uses Typical (median) by default; the user can switch to Slow replies (P90) or Average (mean). The UI shows the plain-language name and keeps the statistical term in the help tip. |
| **Compare** | Overlay selected people as separate series | On when 2–5 people selected | One color per person. “All” is a single combined series. |
| **Hour filter** | All hours, or e.g. 08:00–22:00 | All hours | Optional; applies to every metric so a “daytime only” view is consistent. |

**Reply window** (30 min / 2 h / 12 h / 24 h) is **only** for response time. It does not hide messages from volume or word charts.

### How each metric uses the bar

| Metric | People | Date range | Grain (trend) | Statistic |
|---|---|---|---|---|
| Message count / msgs per day | Yes | Yes | Yes | Sum in each bucket |
| Words per message | Yes | Yes | Yes | Mean or median of words/message |
| Sender rank / share % | Yes (rank among selected; % of selected total) | Yes | — (table/bar, not a time series) | Sum of messages |
| Heatmap (weekday × hour) | Yes | Yes | — (grid is already a bucket) | Sum |
| Top words / emojis | Yes | Yes | Optional: top in each month as a small multiples or “this period only” | Count |
| Media / links / deleted rates | Yes | Yes | Yes | Sum or rate (count / messages) |
| Session starts / who starts | Yes | Yes | Yes | Count of sessions started |
| Response time | Yes | Yes | Yes | Typical / median (default), Slow replies / P90, Average / mean |
| Unique senders in range | — (this *is* the people dimension) | Yes | Yes (how many distinct senders per bucket) | Count distinct |

If a control does not apply, disable it on that card rather than inventing a fake number.

### Headline vs trend vs table

For **each** of the metrics above, the same pattern:

1. **Headline** — one number (or one per selected person) for the current date range + people.
2. **Trend** — that number in each time-grain bucket (skip a bucket if the sample is too small; see below).
3. **Table** — per-person breakdown for the current filters (sortable).

**Example:** Filter to Jan–Jun 2024, people = {Amit, Sara}, grain = month, statistic = sum. Volume trend is two lines of monthly message counts. Word cloud is only their words in those months. Heatmap is only their hours. Reply-time trend is their monthly medians. Switching grain to week redraws **all** of those, not only volume.

**Example (group):** Date range = last 90 days, people = All. Sender rank is “who talked in the last 90 days,” not all-time. A member who was loud in 2021 and silent now drops off.

### Small samples

Do not plot a Typical (median) or Slow replies (P90) value on fewer than **5** observations in a bucket. Counts (messages, media) may show 0. Grey out people with too little data in the selected range (“not enough in this filter”).

### What stays global (not filtered into a lie)

A short strip can still show **file-level** facts so filters are not confusing: export span, parse warnings, “40k cap” note, unique names **in the whole file**. Label them **Entire export**, not the same as filtered headlines.

Stop-word language is a **content** setting (like reply window): it only affects word lists, not volume or reply time.


---

## Response time (v1 metric)

WhatsApp exports have **send times only**, not “opened” or “read.” Response time here means **how long after someone else spoke until this person sent a message**, not how long they stared at the chat.

### What counts as a reply

Walk messages in time order. Collapse consecutive messages from the **same** sender into one **turn** (timestamp of the first message in that burst).

A **reply** for person B is recorded when:

1. The previous turn is from someone other than B.
2. B’s turn starts within a **reply window** of that previous turn (default **2 hours**; configurable in the UI: 30 min / 2 h / 12 h / 24 h).
3. If the gap is larger than the window, B is **starting a new session**, not replying. That gap is excluded so overnight silence does not look like a 14-hour “slow reply.”

**1:1:** previous turn is always the other person.  
**Group:** previous turn is “whoever spoke last.” That is a proxy (exports rarely include true quote/reply-to). In a 5-person planning chat it is useful; in a 80-person meme dump it is noisy — the UI should say so when unique senders exceed ~15.

Deleted messages and system events are not turns.

### Headline numbers (per person)

| Stat | Why |
|---|---|
| **Typical reply time** (median) | Usual speed; outliers (one 90-minute delay) do not dominate |
| **Slow replies** (P90) | “Usually fast, sometimes slow” — the slow end 9 in 10 replies beat |
| **Reply count** | How many times we actually measured (do not rank someone on 3 samples) |
| **vs previous period** | Median this month vs last month (or this quarter vs last) |

Show **Typical** (median), not Average (mean), as the default card. Average is optional in the aggregator because one long gap inside the window pulls it up.

**Example (1:1):** Maya’s typical reply is 2 min (n = 410); Rohan’s is 4 h 10 min (n = 380). Same message counts, very different rhythm.

**Example (group):** In a 7-person trip chat, the planner’s median is 3 min; three others sit around 40–90 min. The planner is the backbone even if they are not #1 by volume.

### Trend over time (per person)

Each reply is a point `(reply_at, delay_seconds, replier)`. Bucket with the **shared time grain**. In each bucket, plot the **shared statistic** (median by default) for the selected people. Same minimum sample as other duration metrics.

**Example:** Two-year relationship. Volume is flat, but Maya’s monthly median stays ~3 min while Rohan’s climbs from 8 min (year 1) to 2 h (year 2, last quarter). That is the story message-count charts miss.

**Example:** Work group. Everyone looks “slow” in December (vacation). Weekly grain shows a spike; monthly grain smooths it. Because grain is shared, volume and reply time should both show that December shape so users can compare.

### Extra control (response time only)

**Reply window:** 30 min / 2 h / 12 h / 24 h (default 2 h). Copy: *Send time to next message, ignoring gaps longer than [window]. Not read receipts.*

Group v1 is still “how fast is X when anyone just spoke.” “Replied after [person]” is not v1.

### 3. Command-line (works now)

Python 3.9+ (CI tests 3.9, 3.11, and 3.13 with uv).

```bash
git clone <this-repo>
cd whatsapp-analyzer
uv sync
uv run python whatsapp_analyzer.py chat_example.txt --stopword english
```

| Flag | Meaning |
|---|---|
| `FILE` | Path to the export |
| `-s` / `--stopword` | Built-in list: `english`, `indonesian`, … (see `--help`) |
| `-c` / `--customstopword` | Your own file, one word per line |
| `-d` / `--debug` | Print how each line was parsed |

The CLI prints ranks and a weekday×hour heatmap to the terminal. It does not start a website.

---

## How to test before deploying

Do **not** treat “it rendered on my laptop” as enough. The public site fails in three places: **wrong parse of a real export**, **GitHub Pages path (`/whatsapp-analyzer/`)**, and **accidentally sending the chat over the network**.

Test in this order: parser → metrics → local production build → privacy → real files → Pages dry run.

### A. Parser and CLI (already in the repo)

These must stay green. The JS parser should follow the same cases.

```bash
uv sync
uv run python -m unittest discover tests
uv run python whatsapp_analyzer.py chat_example.txt --stopword indonesian
```

`tests/test_chatline.py` covers AM/PM timestamps and emoji extraction. Before a public launch, add fixtures (small `.txt` files under `web/` or `tests/fixtures/`) for:

- Android `M/D/YY, H:MM - Name: text`
- iOS `[DD/MM/YY HH:MM:SS] Name: text`
- 12-hour vs 24-hour
- Multiline body (see `chat_example.txt` around the long “Budi” message)
- `<Media omitted>` / `image omitted`
- `This message was deleted`
- Group events: `created this group`, `left`, `added`, `joined using this group's invite link`
- Names that look like phone numbers
- Empty file and a file with only system lines

**Pass:** each fixture produces the expected senders, timestamps, and line types. CLI and JS should agree on counts for the same fixture (same stop-word list).

### B. Dashboard metrics (unit tests, no browser)

Pure functions, no React. Examples:

- Two unique senders → 1:1 layout; three → group layout.
- Session split: messages 10 minutes apart stay one session; a 2-hour gap starts another (use the gap you ship, e.g. 45 minutes).
- Shared filters: the same people + date range change **volume, heatmap, words, and reply time together**. Reply window does **not** change message counts.
- Grain: switching week → month reduces the number of trend points for every series, not only one chart.
- Statistic: count metrics stay sums when the user picks median (median applies to reply time / words-per-message, not to “number of messages”).
- Reply time: A then B 3 minutes later counts; A then A again is not a reply; A then B 10 hours later is a new session (excluded at the 2 h window).
- Small sample: a bucket with 2 replies does not plot a median.
- Stop words: `the` / `yang` do not appear in top words when that language is selected.
- Heatmap bucket: a message at Tuesday 22:27 lands in Tuesday × 22.

**Pass:** tests fail if someone “simplifies” counting and breaks 1:1 vs group behavior.

### C. Run the UI locally like production

`npm run dev` is not what GitHub Pages serves. Pages serves the **built** files with a **subpath**.

```bash
cd web
npm ci
npm test                 # parser + KPI tests
npm run build            # must use base: '/whatsapp-analyzer/' (or the real repo name)
npm run preview          # serve dist/
```

Open the preview URL (often `http://localhost:4173/whatsapp-analyzer/`).

**Pass:**

- Refresh on `/whatsapp-analyzer/` does not 404 (base path is correct).
- You can pick `chat_example.txt` (or a committed sample) and see charts, not a blank page.
- A 1:1 sample shows reply/session cards; a group sample does not pretend to be a couple chat.
- Stop-word dropdown changes word rank.
- Broken file shows a clear error, not a stack dump.

### D. Browser pass (manual or Playwright)

Use a real browser (Chrome or Playwright). This is the “user” test.

1. Landing: export instructions + privacy sentence visible **before** file picker.
2. Upload group fixture → sender rank, heatmap, words, emojis.
3. Upload 1:1 fixture → two-person cards appear; changing date range or grain updates volume **and** reply-time together.
4. Upload group fixture → people picker; selecting one member updates sender-related charts and their reply trend; “Entire export” unique-name count does not shrink.
5. Reject `.pdf` / empty file with a useful message.
6. Mobile width (~390px): heatmap, file picker, and reply-time controls still usable.
7. Optional: unzip flow if you support `.zip` that contains `_chat.txt`.

**Pass:** you can complete upload → dashboard without the console full of errors.

### E. Privacy (must do before a public URL)

With DevTools **Network** open:

1. Reload the app; note the origin (GitHub Pages or localhost).
2. Upload a chat that contains a unique string (e.g. `UNIQUE_TOKEN_TEST_XYZ`).
3. Confirm **no** request body, query string, or beacon contains that string.
4. Confirm analytics (if any) does not include message text or sender names.

**Pass:** after load, the only network traffic is static assets (JS/CSS/fonts). The `.txt` never leaves the machine.

Also check: closing the tab and returning does not restore the chat (no `localStorage` of the export).

### F. Size and ugly real files

Before deploy, run at least one **large** export (tens of thousands of lines) and one **messy** personal export (mixed date formats if you have them).

**Pass:** parse finishes in a few seconds on a typical laptop; the page does not freeze for tens of seconds without a “working…” state. If it is too slow, that is a ship blocker, not a later optimization.

### G. GitHub Pages dry run (last gate)

Do this **before** pointing friends at the URL:

1. Merge to the branch that Actions deploys (usually `main`).
2. Confirm the workflow builds `web` and publishes `dist/` with the correct `base`.
3. Open the live Pages URL in a private window (no cache).
4. Repeat **C**, **D**, and **E** on the live origin.
5. Confirm `https://<user>.github.io/whatsapp-analyzer` redirects or works with and without a trailing slash.

A local preview can look fine while Pages is broken because `base` is `/` instead of `/whatsapp-analyzer/`.

### Ship checklist

- [ ] `uv run python -m unittest discover tests` passes  
- [ ] JS parser tests cover Android, iOS, multiline, media, deleted, events  
- [ ] CLI and JS counts match on `chat_example.txt`  
- [ ] `npm run build && npm run preview` works on the **subpath**  
- [ ] 1:1 and group samples show different layouts  
- [ ] Shared filter bar: people, date range, and grain apply to volume, heatmap, words/emojis, and response time together  
- [ ] Response time: median cards, per-person trend; reply window does not change message counts  
- [ ] Network tab: chat text never uploaded  
- [ ] No chat persisted after refresh  
- [ ] Large file usable; empty/bad file explained  
- [ ] Live Pages URL checked in a private window  

Until those boxes are ticked, keep the site unpublished or behind a draft URL.
