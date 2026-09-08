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
  stretchedWords: {
    title: "Stretched words",
    what: "How often people drag out a word you type — Jaaaan for jaan, gooood for good.",
    how: "Letters are lowercased and consecutive repeats are collapsed to one. A token matches if that collapsed form equals your query's, and the original has at least three of the same letter in a row. The query is never run as a regular expression.",
    caveat: "Plain spellings without a stretched run are left out. Searching good will not count good or god, only the elongated ones.",
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
  stripEmojis: {
    title: "Ignore emojis in long messages",
    what: "Whether emojis count towards the length of a message when picking out the unusually long ones.",
    how: "When ticked, every emoji is removed from the text before its characters are counted, so a wall of 200 hearts is not mistaken for a long piece of writing. Messages that are nothing but emojis drop out entirely.",
    caveat: "This only affects the long-message list. Message counts, charts and reply times are identical either way.",
  },
  talkShare: {
    title: "Talk share",
    what: "Who does the actual talking, measured in words rather than message count.",
    how: "Words on chat lines are totalled per person, then divided by the filtered total. Media, deleted lines and system notices contribute nothing.",
    caveat: "Someone who sends many short lines looks smaller here than in sender rank — that difference is the point.",
  },
  wordsPerMessage: {
    title: "Words per message",
    what: "How long each person's messages usually are.",
    how: "The chosen statistic (typical, slow end or average) over the word counts of that person's chat lines.",
    caveat: "Voice notes and images count as zero-word lines elsewhere but are left out here, so this describes typed messages only.",
  },
  silentDays: {
    title: "Active and silent days",
    what: "How many days in the window had any messages, and how many passed without a word.",
    how: "Calendar days from the first to the last filtered message are split into days with at least one message and days with none.",
    caveat: "Uses your device's timezone, so a message just after midnight counts towards the next day.",
  },
  longestSilence: {
    title: "Longest silence",
    what: "The biggest gap between two messages anywhere in the filtered window.",
    how: "Messages are sorted by time and the largest gap between consecutive ones is reported.",
    caveat: "Narrowing the people or hour filters removes messages, which can create gaps that never happened in the real chat.",
  },
  sessionStats: {
    title: "Conversations",
    what: "The shape of a typical burst of conversation: how long it runs and how many messages it carries.",
    how: `Messages more than ${sessionGapMinutes} minutes apart start a new session. The figures are the midpoint (median) across all sessions in range.`,
    caveat: "Duration needs at least five sessions before a number is shown, since one long evening otherwise defines the 'typical' one.",
  },
  sessionClosers: {
    title: "Who has the last word",
    what: "Who tends to end a conversation rather than start it.",
    how: "The sender of the last message in each session gets the credit, shown as a count and a share of all sessions.",
    caveat: "Having the last word can mean being the most engaged or being left unanswered — the export cannot tell which.",
  },
  peoplePerBurst: {
    title: "People per conversation",
    what: "How many of the group actually join a typical burst of conversation.",
    how: "Distinct senders are counted within each session, and the midpoint (median) across sessions is shown.",
    caveat: "Only meaningful for group chats; in a two-person chat this is almost always two.",
  },
  topEmojisBySender: {
    title: "Emojis by person",
    what: "Each person's own emoji vocabulary, rather than the chat's combined favourites.",
    how: "Every emoji occurrence is counted per sender, including repeats inside one message, and the most used are listed. People who send no emojis are left out.",
    caveat: "Skin-tone and gender variants are counted as written, so the same gesture can appear more than once.",
  },
  longMessages: {
    title: "Long messages",
    what: "The messages that stand out as far longer than the rest — the essays, rants and stories.",
    how: "Characters are counted per chat line, and a message is listed if it is longer than 99 out of 100 others, or sits well beyond the usual spread of lengths.",
    caveat: "Needs at least eight chat lines to have a spread to compare against, so short filtered windows show nothing.",
  },
  concentration: {
    title: "Concentration",
    what: "Whether the chat is one person's monologue or an even conversation.",
    how: "Each person's share of messages is squared and the squares are added up. Near 1 means one person dominates; near 0 means many people contribute evenly.",
    caveat: "This measures how evenly messages are spread, not who is worth listening to.",
  },
  silentInFile: {
    title: "Not in this view",
    what: "People who are in the export but have no messages under your current filters.",
    how: "Compares the senders in the whole file against the senders left after filtering, and lists the difference.",
    caveat: "Someone silent in the file itself — a lurker who never posted — never appears at all, here or anywhere else.",
  },
  nightShare: {
    title: "Night share",
    what: "How much of the chat happens late at night.",
    how: "Share of filtered messages sent between 22:00 and 05:59, in your device's timezone.",
    caveat: "The hour filter narrows the same messages, so setting one changes this figure.",
  },
  weekendShare: {
    title: "Weekend share",
    what: "How much of the chat lands on Saturday or Sunday.",
    how: "Share of filtered messages whose weekday is Saturday or Sunday, in your device's timezone.",
    caveat: "A quiet weekend is not the same as a quiet person — volume still sits in the talk section.",
  },
  replyVsPrevious: {
    title: "Reply time vs earlier",
    what: "Whether replies have been getting faster or slower over the filtered window.",
    how: "The window is split in half by date and the chosen reply statistic is computed on each half, then compared.",
    caveat: `Each half needs at least ${MIN_DURATION_SAMPLE} replies of its own, so short windows show nothing.`,
  },
  topDomains: {
    title: "Top links",
    what: "The sites that get shared most often.",
    how: "Counts the domain of every link in the filtered messages, so several links in one message all count.",
    caveat: "Shortened links show the shortener's domain, not where they actually lead.",
  },
  parseNotes: {
    title: "Parse notes",
    what: "Anything the parser could not read cleanly.",
    how: "Lines that matched no known WhatsApp timestamp format are reported here and left out of the statistics.",
    caveat: "WhatsApp caps shared exports around 40,000 messages, so a round number near that suggests the chat is truncated.",
  },
};
