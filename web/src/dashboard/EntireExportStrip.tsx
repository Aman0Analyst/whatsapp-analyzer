import { dateSpan, uniqueSenders } from "../metrics/volume";
import type { ParsedMessage } from "../types/chat";
import { Card } from "../theme/UiKit";

export function EntireExportStrip({
  messages,
  warnings,
}: {
  messages: ParsedMessage[];
  warnings: string[];
}) {
  const names = uniqueSenders(messages);
  const span = dateSpan(messages);
  const range = span
    ? `${span.start.toLocaleDateString()} – ${span.end.toLocaleDateString()}`
    : "—";
  return (
    <Card className="strip">
      <div>
        <div className="strip-label">Entire export</div>
        <div>{range}</div>
      </div>
      <div>
        <div className="strip-label">Entire export · unique names</div>
        <div>{names.length}</div>
      </div>
      <div>
        <div className="strip-label">Entire export · messages</div>
        <div>{messages.length}{messages.length >= 40000 ? " (export cap likely)" : ""}</div>
      </div>
      <div>
        <div className="strip-label">Entire export · parse notes</div>
        <div>{warnings.length ? warnings.join(" ") : "None"}</div>
      </div>
    </Card>
  );
}
