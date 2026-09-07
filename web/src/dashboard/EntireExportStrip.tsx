import { dateSpan, messageCount, uniqueSenders } from "../metrics/volume";
import type { ParsedMessage } from "../types/chat";
import type { DateOrder } from "../parse/parseExport";
import { Badge, Card, InfoTip } from "../theme/UiKit";

const EXPORT_CAP = 40000;

export function EntireExportStrip({
  messages,
  warnings,
  dateOrder,
}: {
  messages: ParsedMessage[];
  warnings: string[];
  dateOrder: DateOrder;
}) {
  const names = uniqueSenders(messages);
  const span = dateSpan(messages);
  const range = span
    ? `${span.start.toLocaleDateString()} – ${span.end.toLocaleDateString()}`
    : "—";
  const total = messageCount(messages);
  const capped = messages.length >= EXPORT_CAP;

  return (
    <Card className="strip">
      <div className="strip-head">
        <span className="strip-label">Entire export</span>
        <InfoTip metric="exportSpan" />
        <span className="strip-note">unfiltered baseline for the whole file</span>
      </div>
      <dl className="strip-grid">
        <div className="strip-item">
          <dt>
            Date range
            <InfoTip metric="dateReading" />
          </dt>
          <dd>
            {range}{" "}
            <span className="muted">
              ({dateOrder === "dayFirst" ? "day/month" : "month/day"})
            </span>
          </dd>
        </div>
        <div className="strip-item">
          <dt>People</dt>
          <dd>{names.length}</dd>
        </div>
        <div className="strip-item">
          <dt>Messages</dt>
          <dd>
            {total.toLocaleString()}
            {capped ? (
              <>
                {" "}
                <Badge tone="warn">export cap likely</Badge>
              </>
            ) : null}
          </dd>
        </div>
        <div className="strip-item">
          <dt>
            Parse notes
            <InfoTip metric="parseNotes" />
          </dt>
          <dd>
            {warnings.length ? (
              <span className="strip-warn">{warnings.join(" ")}</span>
            ) : (
              <span className="muted">Everything parsed cleanly</span>
            )}
          </dd>
        </div>
      </dl>
    </Card>
  );
}
