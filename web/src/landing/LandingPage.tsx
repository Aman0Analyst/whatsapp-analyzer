import { useState, type DragEvent } from "react";
import { parseExport, type ParseResult } from "../parse/parseExport";
import { Page } from "../theme/UiKit";
import { readChatFile } from "./readChatFile";
import "./LandingPage.css";

const FEATURES = [
  {
    title: "Who talks",
    body: "Message share per person, and who breaks the silence to start a conversation.",
  },
  {
    title: "When",
    body: "Volume by day, week, month or quarter, plus a weekday-by-hour activity heatmap.",
  },
  {
    title: "How fast",
    body: "Typical and slow reply times per person, with a window that separates replies from new conversations.",
  },
];

const STEPS = [
  "Open the chat in WhatsApp.",
  "Tap the chat name, then Export chat.",
  "Choose Without Media.",
  "Save the .txt and drop it below.",
];

export function LandingPage({ onParsed }: { onParsed: (result: ParseResult) => void }) {
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    setStatus("Reading on this device…");
    const read = await readChatFile(file);
    if (!read.ok) {
      setStatus(null);
      setError(read.error);
      return;
    }
    const result = parseExport(read.text);
    setStatus(null);
    if (result.messages.length === 0) {
      setError(result.warnings[0] ?? "No WhatsApp messages found.");
      return;
    }
    onParsed(result);
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    void onFile(event.dataTransfer.files?.[0]);
  };

  return (
    <Page>
      <div className="landing">
        <div className="landing-brand">
          <span className="appbar-logo" aria-hidden="true">
            WA
          </span>
          <h1>WhatsApp Analyzer</h1>
        </div>
        <span className="eyebrow">Runs entirely in your browser</span>
        <h2 className="landing-hero">Read the story in your chat history</h2>
        <p className="lede">
          Drop a WhatsApp export to see who talks, when the chat comes alive, and how fast people
          reply — with every number explained.
        </p>
        <p className="privacy">
          <strong>Privacy:</strong> your export stays on this device. We read it with FileReader
          only — nothing is uploaded, and closing the tab forgets the chat.
        </p>

        <div
          className={`drop${dragging ? " drop-active" : ""}`}
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
        >
          <span className="drop-icon" aria-hidden="true">
            ↑
          </span>
          <label className="drop-title" htmlFor="chat-file">
            Choose a .txt export
          </label>
          <span className="drop-hint">or drag and drop it here</span>
          <input
            id="chat-file"
            className="drop-input"
            type="file"
            accept=".txt,text/plain"
            onChange={(e) => void onFile(e.target.files?.[0])}
          />
        </div>

        {status ? <p className="status">{status}</p> : null}
        {error ? (
          <p className="error" role="alert">
            {error}
          </p>
        ) : null}

        <ul className="feature-grid">
          {FEATURES.map((feature) => (
            <li className="feature" key={feature.title}>
              <h3>{feature.title}</h3>
              <p>{feature.body}</p>
            </li>
          ))}
        </ul>

        <div className="how">
          <h3>How to get the file</h3>
          <ol className="how-steps">
            {STEPS.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
          <p className="how-note">
            If you received a .zip, unzip it first — the analyzer reads the .txt inside.
          </p>
        </div>
      </div>
    </Page>
  );
}
