<div align="center">

# WhatsApp Analyzer

**Read the story in your chat history.** Drop a WhatsApp export and see who talks, when the chat
comes alive, and how fast people reply — with every number explained.

[**Open the dashboard →**](https://aman0analyst.github.io/whatsapp-analyzer/)

[![Tests](https://github.com/Aman0Analyst/whatsapp-analyzer/actions/workflows/test.yml/badge.svg)](https://github.com/Aman0Analyst/whatsapp-analyzer/actions/workflows/test.yml)
[![Web](https://github.com/Aman0Analyst/whatsapp-analyzer/actions/workflows/web.yml/badge.svg)](https://github.com/Aman0Analyst/whatsapp-analyzer/actions/workflows/web.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-brown.svg)](LICENSE)

</div>

Your export never leaves your device. The web app reads the `.txt` in the browser with `FileReader`,
there is no server, and closing the tab forgets the chat.

---

## What you get

- **Who talks** — message share per person, and who breaks the silence to start a conversation.
- **When** — volume by day, week, month or quarter, plus a weekday × hour activity heatmap.
- **How fast** — typical and slow reply times per person, using a window that separates replies from
  new conversations.
- **What about** — word and emoji ranks, with a stop-word list to strip filler words.
- **How much is media** — the share of the chat that is attachments, links and deleted messages.

A shared filter bar — people, date range, time grain, hours of the day, and the reply window —
drives every card at once, so the heatmap, word ranks and reply times always describe the same slice
of the chat. The layout adapts too: two senders get session starters and reply time each way, three
or more get sender rank and group stats.

## Use the web app

1. Open **[aman0analyst.github.io/whatsapp-analyzer](https://aman0analyst.github.io/whatsapp-analyzer/)**.
2. Drop your `.txt` export on the page (if WhatsApp gave you a `.zip`, unzip it first).
3. Read the dashboard. Nothing is uploaded and nothing is stored.

### Exporting the chat

Choose **Without Media** — the text export already carries placeholders for attachments.

- **Android:** open the chat → three-dot menu → **More** → **Export chat** → **Without Media**.
- **iOS:** open the chat → tap the name at the top → scroll to **Export Chat** → **Without Media**.

## Use the command line

The Python CLI prints ranks and a heatmap to the terminal. It needs Python 3.9+ and
[uv](https://docs.astral.sh/uv/).

```bash
git clone https://github.com/Aman0Analyst/whatsapp-analyzer.git
cd whatsapp-analyzer
uv sync
uv run python whatsapp_analyzer.py chat_example.txt --stopword english
```

| Flag | Meaning |
|---|---|
| `FILE` | Path to the exported chat |
| `-s`, `--stopword` | Built-in stop-word list: `english`, `indonesian`, … (see `--help` for all 27) |
| `-c`, `--customstopword` | Your own list instead — a raw text file, one word per line |
| `-d`, `--debug` | Print how every line was parsed |
| `-h`, `--help` | Full usage |

Stop words are common words (`the`, `a`, `in`, `yang`) that would otherwise win every word rank. The
built-in lists come from [Alir3z4/stop-words](https://github.com/Alir3z4/stop-words) and live in
[`stop-words/`](stop-words).

<details>
<summary><b>CLI output preview</b></summary>

**Sender rank**

![Sender rank](https://i.imgur.com/5MnQRhV.png)

**Domain rank**

![Domain rank](https://i.imgur.com/jASt34p.png)

**Word rank, and the most used word per sender**

![Word rank](https://i.imgur.com/NmfWGSa.png)
![Most used word by sender](https://i.imgur.com/GdtzLFy.png)

**Emoji rank, and the most used emoji per sender**

![Emoji rank](https://i.imgur.com/PqCVcej.png)
![Most used emoji by sender](https://i.imgur.com/DauFsMx.png)

**Activity heatmap**

![Heatmap](https://i.imgur.com/6KyNJF2.png)

</details>

## Chat formats

Both the browser parser and the CLI read Android dash style and iOS bracket style, and each export
is checked for its own day/month order:

```text
14/10/18, 11:16 - Contact Name: this is a message
2/30/18, 2:07 AM - Contact Name: Test👌
[30/12/18 4.59.25 PM] Nama User: 🙏test
[06/07/17 13.23.30] ‪+62 123-456-78910‬: image omitted
```

Some locale-specific date formats are still unsupported. On iOS, attachments can be classified as
image, video, audio, GIF, sticker, document or contact card; Android exports use one placeholder for
everything. WhatsApp also caps an export at roughly the last 40,000 messages, so a long group chat
is a recent window, not its whole history.

<details>
<summary><b>How a line is classified</b></summary>

```text
           +------------------+
      +----+    Empty line?   +----+
      |    +------------------+    |
      |                            |
      |                            |
  +---v---+                   +----v---+
  |  Yes  | +-----------------+   No   |
  +-------+ |                 +---+----+
            |                     |
  +---------+-+             +-----v-----+
  | Event Log |        +----+    Chat   +----+
  +-----------+        |    +-----------+    |
                       |                     |
                +------v-----+         +-----v------+   +--------------------+
          +-----+Regular Chat+----+    | Attachment +-->+ Clasify Attachment |
          |     +------------+    |    +------------+   +-------+------------+
          v                       v                             |
+---------+---------+   +---------+----------+                  |
|   Starting Line   |   |   Following Line   |                  |
+------+------------+   +-+------------------+                  |
       |                  |                                     |
       |                  |                                     |
       |           +------v-------+                             |
       |           | COUNTER      |                             |
       |           | 1 Chat       |                             |
       +---------->+ 2 Timestamp  +<----------------------------+
                   | 3 Sender     |
                   | 4 Domain     |
                   | 5 Words      |
                   | 6 Attachment |
                   | 7 Emoji      |
                   +-----+--------+
                         |
                         v
              +----------+----------------+
              |          Visualize        |
              +---------------------------+
```

</details>

## Development

```bash
# Python: parser and CLI
uv sync
uv run python -m unittest discover tests

# Web: Vite + React, analysis in the browser
cd web
npm ci
npm run dev              # local dev server
npm test                 # unit tests (Vitest)
npm run test:e2e         # browser tests (Playwright)
npm run build && npm run preview   # production build on the /whatsapp-analyzer/ subpath
```

CI runs the Python tests on 3.9, 3.11 and 3.13, plus the web unit and Playwright suites. Pushing to
`master` deploys `web/dist` to GitHub Pages.

Preview the production build rather than trusting `npm run dev` before a deploy — Pages serves the
app from a subpath, and a wrong `base` looks fine locally and 404s in production.

## Documentation

- [Purpose, usage, and how to test before deploy](docs/PURPOSE-AND-USAGE.md) — what each metric
  means, how the shared filters behave, and the pre-deploy checklist.
- [Web dashboard implementation plan](docs/superpowers/plans/2026-09-07-web-dashboard.md).

## Help needed

- Rearrange the Python directory structure to match packaging best practice.
- More real exports as fixtures, especially iOS and unusual locales.

## Credits

Forked from [PetengDedet/WhatsApp-Analyzer](https://github.com/PetengDedet/WhatsApp-Analyzer), which
is the original Python analyzer this dashboard grew out of. Stop-word lists from
[Alir3z4/stop-words](https://github.com/Alir3z4/stop-words). Released under the [MIT License](LICENSE).

<a href="https://www.buymeacoffee.com/PetengDedet" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/lato-orange.png" alt="Buy the original author a coffee" style="height: 22px !important;" ></a>
