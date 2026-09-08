import {
  messageConcentration,
  nightShare,
  silentInFile,
  weekendShare,
} from "../metrics/groupHealth";
import { InfoTip, SectionCard } from "../theme/UiKit";
import type { ParsedMessage } from "../types/chat";
import "./dashboard.css";

function percent(rate: number): string {
  const pct = rate * 100;
  if (pct > 0 && pct < 1) return "<1%";
  return `${Math.round(pct)}%`;
}

/**
 * Group-only reading: is the room a monologue, when does it come alive, and
 * who from the file is missing from the current view.
 */
export function GroupHealthSection({
  messages,
  fileMessages,
}: {
  messages: ParsedMessage[];
  fileMessages: ParsedMessage[];
}) {
  const silent = silentInFile(fileMessages, messages);
  const concentration = messageConcentration(messages);
  const voices = concentration > 0 ? 1 / concentration : 0;

  return (
    <SectionCard
      title="How the room behaves"
      description="A group can be a conversation or one person with an audience. These three readings tell which."
      metric="concentration"
    >
      <div className="rate-tiles">
        <div className="rate-tile">
          <span className="rate-label">Concentration</span>
          <span className="rate-value">{concentration.toFixed(2)}</span>
          <span className="rate-share">
            {voices === 0 ? "no messages in range" : `spread like ${voices.toFixed(1)} equal voices`}
          </span>
        </div>
        <div className="rate-tile">
          <span className="rate-label">
            After dark
            <InfoTip metric="nightShare" />
          </span>
          <span className="rate-value">{percent(nightShare(messages))}</span>
          <span className="rate-share">sent between 10pm and 6am</span>
        </div>
        <div className="rate-tile">
          <span className="rate-label">
            Weekends
            <InfoTip metric="weekendShare" />
          </span>
          <span className="rate-value">{percent(weekendShare(messages))}</span>
          <span className="rate-share">Saturday and Sunday</span>
        </div>
      </div>

      <h3 className="subhead">
        Not in this view
        <InfoTip metric="silentInFile" />
      </h3>
      {silent.length === 0 ? (
        <p className="section-note section-note-flush">
          Everyone who ever posted in this file appears under the current filters.
        </p>
      ) : (
        <>
          <p className="section-note section-note-flush">
            {silent.length === 1 ? "One person is" : `${silent.length} people are`} in the export
            but silent here — either filtered out, or they stopped posting.
          </p>
          <ul className="chip-row">
            {silent.map((sender) => (
              <li key={sender}>
                <span className="chip" title={sender}>
                  {sender}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </SectionCard>
  );
}
