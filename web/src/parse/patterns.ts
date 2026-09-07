// Ported from the Python CLI (patterns.py) so the browser classifies lines the
// same way the command line tool does. Regexes are applied to a single line
// that has already been trimmed and had BAD_CHARS removed.

/** Invisible direction marks WhatsApp sprinkles into exports. */
export const BAD_CHARS = ["\u202a", "\u200e", "\u202c"];

/**
 * The Python CLI deletes non breaking spaces too, which glues phone numbers
 * together ("+628xx" instead of "+62 8xx") and can split one person into two
 * senders. We turn them into ordinary spaces instead.
 */
export const NBSP = "\u00a0";

/**
 * A starting line begins with a date and time; anything else is a continuation
 * of the message above it.
 *
 *   <[><date><sep><time><am/pm><]><sep><rest>
 *
 * Covers Android (`14/10/18, 11:16 - `) and iOS (`[23/10/2020, 5:00:00 pm] `),
 * `/` or `-` date separators, `:` or `.` time separators, and 12h or 24h clocks.
 */
export const IS_STARTING_LINE =
  /^\[?(?<num1>\d{1,2})[/-](?<num2>\d{1,2})[/-](?<year>\d{2,4}),?\s(?<hour>\d{1,2})[:.](?<minute>\d{2})(?:[:.](?<second>\d{2}))?(?<ampm>\s?[ap]\.?m\.?)?\]?\s*-?\s*(?<rest>.*)$/i;

/**
 * Cheap probe for the leading date of a line, used to work out whether a file
 * writes day or month first. Tolerates the direction marks BAD_CHARS strips so
 * it can run before the line is cleaned.
 */
export const DATE_PREFIX =
  /^[\u202a\u200e\u202c\s]*\[?(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})/;

/** `<contact or phone number>: <message>`; anything else on a starting line is an event. */
export const IS_CHAT = /^(?<sender>[^:]+):\s?(?<body>.*)$/;

export const IS_DELETED_CHAT = [
  /this message was deleted\.?$/i, // EN, Android and iOS
  /you deleted this message\.?$/i, // EN
  /pesan ini telah dihapus$/i, // ID
];

export const IS_ATTACHMENT = [
  /<media omitted>$/i, // EN Android
  /<media tidak disertakan>$/i, // ID Android
  /archivo omitido/i, // ES Android
  /<media omessi>$/i, // IT Android
  /pesan tidak didukung$/i, // stickers some devices do not recognise
  /.+\.vcf \(file\s(?:terlampir|attached)\)$/i, // contact card
  /image omitted$/i, // EN iOS
  /video omitted$/i,
  /document omitted$/i,
  /contact card omitted$/i,
  /audio omitted$/i,
  /gif omitted$/i,
  /sticker omitted$/i,
  /<attached:[^>]+>$/i, // iOS export with the media files included
  /imagen omitida/i, // ES iOS
  /audio omitido/i,
  /gif omitido/i,
  /sticker omitido/i,
  /video omitido/i,
];

/**
 * Full match is the URL: a scheme, `www.`, or `domain.tld/` prefix, then
 * everything up to whitespace, minus trailing sentence punctuation.
 *
 * The prefix and the trailing character class come from the Python IS_URL. Its
 * middle section (`(?:[^\s()<>]+|\(...\))+`) is not ported: nested quantifiers
 * backtrack exponentially, and this runs on whatever text the chat contains, so
 * `https://` followed by 40 dots would freeze the tab. The cost is that a
 * trailing `)` is dropped from URLs that balance parentheses.
 */
export const IS_URL =
  /\b(?:https?:\/\/|www\d{0,3}[.]|[a-z0-9.\-]+[.][a-z]{2,6}\/)[^\s<>]*[^\s<>`!()[\]{};:'".,?«»“”‘’]/gi;

/**
 * System lines. A starting line that is not a chat is treated as an event even
 * when it matches nothing here; the list exists so unknown system lines can be
 * reported as warnings.
 */
export const IS_EVENT = [
  /messages to this group are now secured with end-to-end encryption\.?$/i, // EN
  /.+\screated this group$/i, // EN
  /.+\screated group\s.+$/i, // EN
  /^you were added$/i, // EN
  /.+\sleft$/i, // EN
  /.+\skeluar$/i, // ID
  /.+\sjoined using this group's invite link$/i, // EN
  /.+\stelah bergabung menggunakan tautan undangan grup ini$/i, // ID
  /.+\sadded\s.+/i, // EN
  /.+\smenambahkan\s.+/i, // ID
  /.+\sremoved\s.+/i, // EN
  /.+'s security code changed\./i, // EN
  /.+\schanged to\s.+$/i, // EN phone number change
  /changed their phone number to a new number\./i, // EN
  /telah mengganti nomor teleponnya ke nomor baru\./i, // ID
];
