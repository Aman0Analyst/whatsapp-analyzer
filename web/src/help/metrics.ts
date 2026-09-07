import { MIN_DURATION_SAMPLE } from "../metrics/buckets";
import { sessionGapMinutes } from "../metrics/sessions";

/**
 * Plain-language help for every statistic on screen. `how` states the actual
 * computation and `caveat` names the limitation, so a reader can tell what the
 * number does and does not prove.
 */
export interface MetricHelp {
  title: string;
  what: string;
  how: string;
  caveat?: string;
}

export const METRIC_HELP: Record<string, MetricHelp> = {
  messages: {
    title: "Messages",
    what: "How many messages fall inside the filters you picked.",
    how: "Counts chat, media and deleted lines. Join/leave/security notices are excluded, so this is lower than the raw line count of the file.",
  },
  perDay: {
    title: "Messages per day",
    what: "Average daily traffic across the filtered window.",
    how: "Messages divided by the number of calendar days from the first to the last filtered message, counting both ends.",
    caveat: "Silent days are included in the divisor, so long quiet stretches pull this down.",
  },
  senders: {
    title: "Unique senders",
    what: "How many distinct people sent at least one message in range.",
    how: "Counts distinct sender names on countable lines.",
    caveat: "WhatsApp exports identify people by phone number or saved contact name. If someone changed number they can appear twice.",
  },
  medianReply: {
    title: "Typical reply time",
    what: "The usual wait before someone answers — half of all replies were faster than this, half slower. Statistics tools call this the median.",
    how: `Each reply is the gap from the previous speaker's last message to the next speaker's first message. Gaps longer than the reply window are treated as a new conversation, not a slow reply.`,
    caveat: `Needs at least ${MIN_DURATION_SAMPLE} replies before a number is shown. This is send time, not read receipts — nobody's "seen" status is in the export.`,
  },
  p90Reply: {
    title: "Slow replies",
    what: "The slow end of the range: 9 out of 10 replies came back faster than this.",
    how: "The 90th percentile of reply gaps, interpolated between the two nearest samples. Statistics tools call this P90.",
    caveat: "One very long gap moves this far more than it moves the typical time.",
  },
  replyCount: {
    title: "Reply samples (n)",
    what: "How many reply gaps went into that person's numbers.",
    how: "Counts turn changes where this person spoke next, within the reply window.",
    caveat: "Rows under 10 samples are dimmed because the median is unstable that low.",
  },
  sessionStarts: {
    title: "Conversation starts",
    what: "Who breaks the silence and opens a new conversation.",
    how: `A gap of more than ${sessionGapMinutes} minutes starts a new session. Whoever sends the first message of that session gets the credit.`,
    caveat: "Shown for two-person chats only, where 'who reached out' is meaningful.",
  },
  volume: {
    title: "Volume over time",
    what: "Message count per period, so you can see growth, spikes and quiet spells.",
    how: "Messages are grouped into the time grain you selected. Weeks start on Monday; quarters start in Jan, Apr, Jul and Oct.",
    caveat: "Select two to five people in the People filter to compare their lines side by side.",
  },
  rank: {
    title: "Sender rank",
    what: "Who does the talking, ordered by message count.",
    how: "Messages per person inside the filters, with each person's share of the filtered total.",
    caveat: "Counts messages, not words — one person sending many short lines outranks someone writing long paragraphs.",
  },
  heatmap: {
    title: "Activity heatmap",
    what: "The weekly rhythm of the chat: which weekday and hour it comes alive.",
    how: "Every filtered message is placed in a weekday × hour cell. Darker means busier, scaled against the single busiest cell.",
    caveat: "Uses your device's timezone, which may differ from where the messages were sent.",
  },
  topWords: {
    title: "Top words",
    what: "The words that come up most, once filler is removed.",
    how: "Counts words on chat lines only, keeping tokens longer than one character that are letters or digits. Numbers-only tokens and the selected stop-word list are dropped.",
    caveat: "Change the stop-word language to strip common filler for that language; set it to None to see raw counts.",
  },
  topEmojis: {
    title: "Top emojis",
    what: "The emoji vocabulary of the chat.",
    how: "Counts every emoji occurrence, including repeats within one message.",
  },
  contentRates: {
    title: "Media, links and deletions",
    what: "How much of the chat is something other than plain text.",
    how: "Share of filtered messages that are attachments, that contain at least one link, and that were deleted.",
    caveat: 'Exports made "Without Media" keep a <Media omitted> placeholder, which is what gets counted here.',
  },
  replyWindow: {
    title: "Reply window",
    what: "The longest gap still counted as a reply rather than a new conversation.",
    how: "Gaps wider than this are dropped from every response-time figure. It has no effect on volume, rank or the heatmap.",
    caveat: "Raise it to include overnight replies; lower it to measure only live back-and-forth.",
  },
  grain: {
    title: "Time grain",
    what: "The bucket size for every trend line.",
    how: "Day, week (starting Monday), month or quarter.",
    caveat: "Coarser grains smooth out spikes; finer grains on a multi-year export get noisy.",
  },
  durationStat: {
    title: "Which reply time to plot",
    what: "Chooses what the response-time trend line shows.",
    how: `"Typical" is the midpoint (median), "Slow replies" is the slow end that 9 in 10 beat (P90), and "Average" is the arithmetic mean. Periods with fewer than ${MIN_DURATION_SAMPLE} replies are left blank rather than guessed.`,
    caveat: "Average is the most sensitive to a single very long gap.",
  },
  hourFilter: {
    title: "Hour range",
    what: "Restricts every statistic to a slice of the day.",
    how: "Both ends are inclusive, in your device's timezone. Setting the start later than the end wraps past midnight, which is useful for night-time activity.",
  },
  people: {
    title: "People",
    what: "Which participants to include.",
    how: "Unticking someone removes their messages from every chart. Response times still need the other side's messages, so they are measured before this filter narrows who is charted.",
  },
  dateRange: {
    title: "Date range",
    what: "Limits the analysis to a recent slice of the export.",
    how: "Presets count back from the last message in the file, not from today.",
  },
  dateReading: {
    title: "How dates were read",
    what: "Whether this file writes dates as day/month or month/day.",
    how: "WhatsApp uses the exporting phone's locale, so 02/03/26 is either 2 March or February 3. Any date with a number above 12 in one slot proves that slot is the day, and that reading is then applied to the whole file.",
    caveat: "If this says the wrong thing, the timeline will be wrong — check that the last date matches the real end of your chat.",
  },
  exportSpan: {
    title: "Entire export",
    what: "Facts about the whole file, ignoring your filters — a baseline to compare the filtered view against.",
    how: "First and last timestamp in the file, including system notices.",
  },
  parseNotes: {
    title: "Parse notes",
    what: "Anything the parser could not read cleanly.",
    how: "Lines that matched no known WhatsApp timestamp format are reported here and left out of the statistics.",
    caveat: "WhatsApp caps shared exports around 40,000 messages, so a round number near that suggests the chat is truncated.",
  },
};
