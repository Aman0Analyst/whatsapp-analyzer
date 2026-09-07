import { RankBars } from "../charts/RankBars";
import { senderRank } from "../metrics/volume";
import { Badge, SectionCard } from "../theme/UiKit";
import { senderColors } from "../theme/senderColor";
import { useFilter } from "../state/FilterProvider";
import type { ParsedMessage } from "../types/chat";

const VISIBLE = 12;

export function RankSection({ messages }: { messages: ParsedMessage[] }) {
  const { uniqueSenders } = useFilter();
  const colors = senderColors(uniqueSenders);
  const all = senderRank(messages);
  const rows = all.slice(0, VISIBLE).map((row) => ({
    label: row.sender,
    n: row.n,
    share: row.share,
    colorVar: colors.get(row.sender),
  }));
  const hidden = all.length - rows.length;

  return (
    <SectionCard
      title="Sender rank"
      description="Who talks most: messages per person, with each person's share of the filtered total."
      metric="rank"
      aside={all.length > 0 ? <Badge>{all.length} people</Badge> : undefined}
    >
      <RankBars rows={rows} />
      {hidden > 0 ? (
        <p className="section-desc">
          {hidden} more {hidden === 1 ? "person is" : "people are"} not shown. Narrow the People
          filter to see them.
        </p>
      ) : null}
    </SectionCard>
  );
}
