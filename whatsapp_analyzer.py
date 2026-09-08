#!/usr/bin/env python
# -*- coding: utf-8 -*-

import argparse
import io
import sys
from collections import Counter
import emoji
import unicodedata

# imported from current directory
from chatline import Chatline
from font_color import Color

LETTER_CATEGORY = "L"
MAX_STRETCH_QUERY = 64


def collapse_letter_runs(raw):
    collapsed = []
    previous = None
    for char in raw.lower():
        if unicodedata.category(char)[0] != LETTER_CATEGORY:
            continue
        if char == previous:
            continue
        collapsed.append(char)
        previous = char
    return "".join(collapsed)


def has_stretched_run(raw):
    previous = None
    run = 0
    for char in raw.lower():
        if unicodedata.category(char)[0] != LETTER_CATEGORY:
            previous = None
            run = 0
            continue
        if char == previous:
            run += 1
            if run >= 3:
                return True
        else:
            previous = char
            run = 1
    return False


def find_stretched_words(messages, query):
    trimmed = query.strip()[:MAX_STRETCH_QUERY]
    collapsed = collapse_letter_runs(trimmed)
    if not collapsed:
        return collapsed, []
    counts = Counter()
    for row in messages:
        if row.line_type != "Chat" or row.is_deleted_chat:
            continue
        for raw in row.words:
            if collapse_letter_runs(raw) != collapsed:
                continue
            if not has_stretched_run(raw):
                continue
            counts[raw.lower()] += 1
    variants = sorted(counts.items(), key=lambda item: (-item[1], item[0]))
    return collapsed, variants


"""
CLI Set
"""
parser = argparse.ArgumentParser(
    description='Read and analyze whatsapp chat',
    usage="python whatsapp_analyzer.py FILE [-h] [-d] [-s] [-c]"
)

stop_words_options = [ "arabic","bulgarian","catalan","czech","danish","dutch","english","finnish","french","german","hebrew","hindi","hungarian","indonesian","italian","malaysian","norwegian","polish","portuguese","romanian","russian","slovak","spanish","swedish","turkish","ukrainian","vietnamese"]

parser.add_argument('file', 
    metavar='FILE',
    help='Chat file path')

parser.add_argument(
    '-d', 
    '--debug', 
    required=False, 
    help="Debug mode. Shows details for every parsed line.", action="store_true")

parser.add_argument(
    '-s', 
    '--stopword', 
    required=False, 
    choices=stop_words_options,  
    metavar='',
    help="Stop Words: A stop word is a commonly used word (such as 'the', 'a', 'an', 'in').\
        In order to get insightful most common word mentioned in the chat, we need to skip these type of word.\
        The Allowed values are: " + ", ".join(stop_words_options))

parser.add_argument(
    '-c', 
    '--customstopword', 
    required=False, 
    metavar='',
    help="Custom Stop Words. File path to stop word. File must a raw text. One word for every line"
)

parser.add_argument(
    '--keep-emoji-in-length',
    required=False,
    help="Keep emojis when measuring long messages (ignored by default).",
    action="store_true"
)

parser.add_argument(
    '--stretch',
    required=False,
    metavar='WORD',
    help="Find stretched spellings of WORD (Jaaaan for jaan). Not a regular expression."
)

args = parser.parse_args()

"""
READ FILE
"""
try:
    with io.open(args.file, "r", encoding="utf-8") as file:
        lines = file.readlines()
    
except IOError as e:
    print("File \"" + args.file + "\" not found. Please recheck your file location")
    sys.exit()

stop_words = []
if args.stopword:
    try:
        with io.open("stop-words/" + args.stopword + ".txt", "r", encoding="utf-8") as file:
            stop_words = [x.strip() for x in file.readlines()]
    except IOError as e:
        print("Stop Words file not found in \"" + args.file + "\" not found.")
        sys.exit()


if args.customstopword:
    try:
        with io.open(args.customstopword, "r", encoding="utf-8") as file:
            stop_words = [x.strip() for x in file.readlines()]
    except IOError as e:
        print("Stop Words file not found in \"" + args.file + "\" not found.")
        sys.exit()
        
"""
PARSING AND COUNTING
"""
chat_counter = {
    'chat_count': 0,
    'deleted_chat_count': 0,
    'event_count': 0,
    'senders': [],
    'timestamps': [],
    'words': [],
    'domains': [],
    'emojis': [],
    'fav_emoji': [],
    'fav_word': []
}


previous_line = None
parsed_lines = []
for line in lines:
    chatline = Chatline(line=line, previous_line=previous_line, debug=args.debug)
    previous_line = chatline
    parsed_lines.append(chatline)

    # Counter
    if chatline.line_type == 'Chat':
        chat_counter['chat_count'] += 1

    if chatline.line_type == 'Event':
        chat_counter['event_count'] += 1

    if chatline.is_deleted_chat:
        chat_counter['deleted_chat_count'] += 1

    if chatline.sender is not None:
        chat_counter['senders'].append(chatline.sender)
        for i in chatline.emojis:
            chat_counter['fav_emoji'].append((chatline.sender, i))
        
        for i in chatline.words:
            chat_counter['fav_word'].append((chatline.sender, i))

    if chatline.timestamp:
        chat_counter['timestamps'].append(chatline.timestamp)

    if len(chatline.words) > 0:
        chat_counter['words'].extend(chatline.words)

    if len(chatline.emojis) > 0:
        chat_counter['emojis'].extend(chatline.emojis)

    if len(chatline.domains) > 0:
        chat_counter['domains'].extend(chatline.domains)


"""
REDUCE AND ORDER DATA
"""

def reduce_and_sort(data):
    return sorted(
        dict(
            zip(
                Counter(data).keys(), 
                Counter(data).values()
            )
        ).items(), 
        key=lambda x: x[1],
        reverse=True
    )

def reduce_and_filter_words(list_of_words):
    val = [w.lower() for w in list_of_words if (len(w) > 1) and (w.isalnum()) and (not w.isnumeric()) and (w.lower() not in stop_words)]
    return val

def filter_single_word(w):
    return (len(w) > 1) and (w.isalnum()) and (not w.isnumeric()) and (w.lower() not in stop_words)

def reduce_fav_item(data):
    exist = []
    arr = []
    for i in data:
        if i[1] > 0 and not i[0][0] in exist:
            exist.append(i[0][0])
            arr.append(i)
    return arr

def median(values):
    values = sorted(values)
    middle = len(values) // 2
    if len(values) % 2:
        return values[middle]
    return (values[middle - 1] + values[middle]) / 2

def quantile(values, q):
    values = sorted(values)
    if len(values) == 1:
        return values[0]
    index = (len(values) - 1) * q
    lower = int(index)
    upper = min(lower + 1, len(values) - 1)
    return values[lower] + (index - lower) * (values[upper] - values[lower])

def format_duration(seconds):
    seconds = int(round(seconds))
    days, remainder = divmod(seconds, 86400)
    hours, remainder = divmod(remainder, 3600)
    minutes, seconds = divmod(remainder, 60)
    parts = []
    if days:
        parts.append("{}d".format(days))
    if hours:
        parts.append("{}h".format(hours))
    if minutes or (not days and not hours):
        parts.append("{}m".format(minutes))
    parts.append("{}s".format(seconds))
    return " ".join(parts)

def metric_header(title):
    print()
    print("-" * 50)
    print(title)
    print("-" * 50)

def build_sessions(messages, gap_minutes=45):
    messages = sorted(messages, key=lambda row: row.timestamp)
    sessions = []
    for message in messages:
        last = sessions[-1] if sessions else None
        if last is None or (message.timestamp - last['end']).total_seconds() > gap_minutes * 60:
            sessions.append({
                'start': message.timestamp,
                'end': message.timestamp,
                'starter': message.sender,
                'closer': message.sender,
                'message_count': 1,
                'participants': {message.sender},
            })
            continue
        last['end'] = message.timestamp
        last['closer'] = message.sender
        last['message_count'] += 1
        last['participants'].add(message.sender)
    return sessions

def print_metrics_wave(messages, strip_emojis=True, stretch_query=None):
    chats = [
        row for row in messages
        if row.line_type == 'Chat' and not row.is_deleted_chat and row.sender and row.timestamp
    ]
    countable = [
        row for row in messages
        if row.line_type != 'Event' and row.sender and row.timestamp
    ]

    metric_header("Conversation Balance")
    words_by_sender = Counter()
    chats_by_sender = Counter()
    for row in chats:
        words_by_sender[row.sender] += len(row.words)
        chats_by_sender[row.sender] += 1
    total_words = sum(words_by_sender.values())
    for sender, word_count in sorted(words_by_sender.items(), key=lambda item: (-item[1], item[0])):
        share = 100 * word_count / total_words if total_words else 0
        mean_words = word_count / chats_by_sender[sender]
        print("{} | {} words | {:.1f}% | mean {:.1f} words/message".format(
            sender, word_count, share, mean_words
        ))

    dates = sorted({row.timestamp.date() for row in countable})
    if dates:
        span_days = (dates[-1] - dates[0]).days + 1
        print("Active days\t: {}".format(len(dates)))
        print("Silent days\t: {}".format(span_days - len(dates)))
        timestamps = sorted(row.timestamp for row in countable)
        if len(timestamps) > 1:
            longest_silence = max(
                (later - earlier).total_seconds()
                for earlier, later in zip(timestamps, timestamps[1:])
            )
            print("Longest silence\t: {}".format(format_duration(longest_silence)))
        else:
            print("Longest silence\t: unavailable")
    else:
        print("Active days\t: 0")
        print("Silent days\t: 0")
        print("Longest silence\t: unavailable")

    metric_header("Sessions (45-minute gap)")
    sessions = build_sessions(countable)
    print("Session count\t: {}".format(len(sessions)))
    if len(sessions) >= 5:
        print("Median duration\t: {}".format(format_duration(median([
            (session['end'] - session['start']).total_seconds() for session in sessions
        ]))))
        print("Median messages/session\t: {:.1f}".format(median([
            session['message_count'] for session in sessions
        ])))
        print("Median people/burst\t: {:.1f}".format(median([
            len(session['participants']) for session in sessions
        ])))
    else:
        print("Session medians\t: unavailable (need at least 5 sessions)")
    starters = Counter(session['starter'] for session in sessions)
    closers = Counter(session['closer'] for session in sessions)
    for sender, count in sorted(starters.items(), key=lambda item: (-item[1], item[0])):
        print("{} | {} starts | {:.1f}%".format(sender, count, 100 * count / len(sessions)))
    for sender, count in sorted(closers.items(), key=lambda item: (-item[1], item[0])):
        print("{} | {} closes | {:.1f}%".format(sender, count, 100 * count / len(sessions)))

    metric_header("Top Emojis by Sender")
    emoji_by_sender = {}
    for row in chats:
        if row.emojis:
            emoji_by_sender.setdefault(row.sender, Counter()).update(row.emojis)
    for sender, counts in sorted(
        emoji_by_sender.items(),
        key=lambda item: (-sum(item[1].values()), item[0])
    ):
        top = sorted(counts.items(), key=lambda item: (-item[1], item[0]))[:8]
        print("{} | {}".format(
            sender,
            " | ".join("{} {}".format(glyph, count) for glyph, count in top)
        ))

    metric_header("Long Messages (P99 and Tukey IQR)")
    measured = []
    for row in chats:
        body = emoji.replace_emoji(row.body, replace='') if strip_emojis else row.body
        if len(body) > 0:
            measured.append((row, len(body)))
    if len(measured) < 8:
        print("Unavailable (need at least 8 chat lines)")
    else:
        lengths = [length for _, length in measured]
        p99 = quantile(lengths, 0.99)
        q1 = quantile(lengths, 0.25)
        q3 = quantile(lengths, 0.75)
        iqr_limit = q3 + 1.5 * (q3 - q1)
        outliers = []
        for row, length in measured:
            reasons = []
            if length >= p99:
                reasons.append("P99")
            if length > iqr_limit:
                reasons.append("IQR")
            if reasons:
                outliers.append((row, length, reasons))
        for row, length, reasons in sorted(outliers, key=lambda item: -item[1]):
            body = row.body.replace("\n", " ")
            if len(body) > 120:
                body = body[:117] + "..."
            print("{} | {} | {} chars | {} | {}".format(
                row.sender,
                row.timestamp.strftime("%Y-%m-%d %H:%M"),
                length,
                "+".join(reasons),
                body
            ))
        if not outliers:
            print("No long messages")

    metric_header("Group Health")
    all_senders = {row.sender for row in countable}
    chat_senders = set(chats_by_sender)
    silent_senders = sorted(all_senders - chat_senders)
    print("Senders with 0 chat lines\t: {}".format(
        ", ".join(silent_senders) if silent_senders else "none"
    ))
    countable_by_sender = Counter(row.sender for row in countable)
    total_countable = sum(countable_by_sender.values())
    concentration = sum(
        (count / total_countable) ** 2 for count in countable_by_sender.values()
    ) if total_countable else 0
    print("Herfindahl concentration\t: {:.3f}".format(concentration))
    night_count = sum(row.timestamp.hour >= 22 or row.timestamp.hour <= 5 for row in countable)
    weekend_count = sum(row.timestamp.weekday() >= 5 for row in countable)
    print("Night share\t: {:.1f}%".format(
        100 * night_count / len(countable) if countable else 0
    ))
    print("Weekend share\t: {:.1f}%".format(
        100 * weekend_count / len(countable) if countable else 0
    ))
    questions = Counter(row.sender for row in chats if '?' in row.body)
    question_rows = sorted(
        chats_by_sender.items(),
        key=lambda item: (-questions[item[0]] / item[1], item[0])
    )
    for sender, count in question_rows:
        print("{} | {}/{} questions | {:.1f}%".format(
            sender, questions[sender], count, 100 * questions[sender] / count
        ))

    if stretch_query:
        metric_header("Stretched Words")
        collapsed, variants = find_stretched_words(messages, stretch_query)
        if not collapsed:
            print("Query has no letters to match")
        elif not variants:
            print("No stretched spellings of \"{}\"".format(stretch_query.strip()))
        else:
            total = sum(count for _, count in variants)
            print("Matches for \"{}\"\t: {}".format(stretch_query.strip(), total))
            printBarChart(variants[:20], fill=Color.blue("█"))

    metric_header("Reply Times (2-hour window)")
    turns = []
    for row in sorted(chats, key=lambda item: item.timestamp):
        if turns and turns[-1]['sender'] == row.sender:
            turns[-1]['end'] = row.timestamp
        else:
            turns.append({'sender': row.sender, 'start': row.timestamp, 'end': row.timestamp})
    replies = {}
    for previous, current in zip(turns, turns[1:]):
        delay = (current['start'] - previous['end']).total_seconds()
        if delay <= 2 * 60 * 60:
            replies.setdefault(current['sender'], []).append(delay)
    eligible_replies = False
    for sender, delays in sorted(replies.items(), key=lambda item: (-len(item[1]), item[0])):
        if len(delays) < 5:
            continue
        eligible_replies = True
        print("{} | n={} | median {} | P90 {}".format(
            sender,
            len(delays),
            format_duration(median(delays)),
            format_duration(quantile(delays, 0.9))
        ))
    if not eligible_replies:
        print("Unavailable (need at least 5 replies per sender)")
    
chat_counter['senders'] = reduce_and_sort(chat_counter['senders'])
chat_counter['words'] = reduce_and_sort(reduce_and_filter_words(chat_counter['words']))
chat_counter['domains'] = reduce_and_sort(chat_counter['domains'])
chat_counter['emojis'] = reduce_and_sort(chat_counter['emojis'])
chat_counter['timestamps'] = reduce_and_sort([(x.strftime('%A'), x.strftime('%H')) for x in chat_counter['timestamps']])
chat_counter['fav_emoji'] = reduce_fav_item(reduce_and_sort(chat_counter['fav_emoji']))
chat_counter['fav_word'] = reduce_fav_item(reduce_and_sort([x for x in chat_counter['fav_word'] if filter_single_word(x[1])]))

"""
VISUALIZE
"""
def printBar (value, total, label = '', prefix = '', decimals = 1, length = 100, fill = '█', printEnd = "\r"):
    filledLength = int(value / (total / length))
    bar = fill * filledLength + '' * (length - filledLength)
    print("\r{} |{} {}".format(label, bar, Color.bold(str(value))), end = printEnd)
    print()

def printBarChart(data, fill="█"):
    if len(data) <= 0:
        print("Empty data")
        return
    
    total = max([x[1] for x in data])
    max_label_length = len(sorted(data, key=lambda tup: len(tup[0]), reverse=True)[0][0])
    for i in data:
        label = i[0] + " " * (max_label_length - len(i[0]))
        printBar(i[1], total, length=50, fill=fill, label=label)

def printCalendar(data):
    days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    hours = ['0' + str(x) if len(str(x)) < 2 else str(x) for x in range(24)]

    max_val = float(data[max(data, key=data.get)]) if len(data) else 0

    ticks = [
        0,
        0.25 * max_val,
        0.50 * max_val,
        0.75 * max_val,
    ]

    sys.stdout.write("     ")
    for day in days:
        sys.stdout.write('\t[' + day[:3] + "]")
        
    sys.stdout.write('\n')

    for hour in hours:
        sys.stdout.write("[" + hour + ':00]')
        
        for day in days:
            
            dict_key = (day, hour)
            
            if dict_key in data:
                # tick = str(ct[dict_key])
                
                if data[dict_key] > ticks[3]:
                    tick = Color.custom("███", bold=True, fg_red=True)
                elif data[dict_key] > ticks[2]:
                    tick = Color.custom("▓▓▓", bold=True, fg_orange=True)
                elif data[dict_key] > ticks[1]:
                    tick = Color.custom("▒▒▒", bold=True, fg_green=True)
                else:
                    tick = Color.custom("░░░", bold=True, fg_light_grey=True)
            else:
                tick = Color.custom('===', bold=False, fg_white=True)
            
            sys.stdout.write('\t ' + tick)
        sys.stdout.write('\n')


# Senders
data = chat_counter['senders']
print(Color.red("-" * 50))
print(Color.red("Chat Count by Sender"))
print(Color.red("-" * 50))
print("Active Sender\t:", Color.red("{}".format(len(data))))
print("Total Chat\t:", Color.red("{}".format(sum([x[1] for x in data]))))
print("Average \t:", Color.red("{:.1f} chat per member".format((sum([x[1] for x in data]) / len(data)) if len(data) else 0)))
print()
printBarChart(data[:20], fill=Color.red("█"))
if len(data) > 20:
    print("---")
    print("Other from {} member | {}".format(Color.red(str(len(data[20:]))), Color.red(str(sum([x[1] for x in data[20:]])))))
print()
print()

# Domains
data = chat_counter['domains']
print(Color.blue("-" * 50))
print(Color.blue("Mentioned Domain (Shared Link/URL)"))
print(Color.blue("-" * 50))
print("Domain Count\t: ", Color.blue(str(len(data))))
print("Mention Count\t: ", Color.blue(str(sum([x[1] for x in data]))))
print()
printBarChart(data[:20], fill=Color.blue("█"))
if len(data) > 20:
    print("---")
    print("Other {} domain | {}".format(Color.blue(str(len(data[20:]))), Color.blue(str(sum([x[1] for x in data[20:]])))))
print()
print()


# Emojis
data = [(x[0] + " (" + emoji.demojize(x[0]) + ") ", x[1]) for x in chat_counter['emojis']]
print(Color.orange("-" * 50))
print(Color.orange("Used Emoji"))
print(Color.orange("-" * 50))
print("Unique Emoji\t: ", Color.orange(str(len(data))))
print("Total Count\t: ", Color.orange(str(sum([x[1] for x in data]))))
print()
printBarChart(data[:20], fill=Color.orange("█"))
if len(data) > 20:
    print("---")
    print("Other {} emoji | {}".format(Color.orange(str(len(data[20:]))), Color.orange(str(sum([x[1] for x in data[20:]])))))
print()
print()

# Fav Emojis
data = [(x[0][0] + " | " + x[0][1] + " | (" + emoji.demojize(x[0][1]) + ")", x[1]) for x in chat_counter['fav_emoji']]
print(Color.orange("-" * 50))
print(Color.orange("Favorite Emoji by Member"))
print(Color.orange("-" * 50))
print()
printBarChart(data[:20], fill=Color.orange("█"))
print()
print()

# Words
data = chat_counter['words']
print(Color.green("-" * 50))
print(Color.green("Used Word"))
print(Color.green("-" * 50))
print("Unique Word\t: ", Color.green(str(len(data))))
print("Total Count\t: ", Color.green(str(sum([x[1] for x in data]))))
print()
printBarChart(data[:20], fill=Color.green("█"))
if len(data) > 20:
    print("---")
    print("Other {} word | {}".format(Color.green(str(len(data[20:]))), Color.green(str(sum([x[1] for x in data[20:]])))))
print()
print()

# Fav Word
data = [(x[0][0] + " | " + x[0][1] + " | ", x[1]) for x in chat_counter['fav_word']]
print(Color.green("-" * 50))
print(Color.green("Favorite Word by Member"))
print(Color.green("-" * 50))
print()
printBarChart(data[:20], fill=Color.green("█"))
print()
print()

# Heatmap
data = chat_counter['timestamps']
print(Color.purple("-" * 50))
print(Color.purple("Chat Activity Heatmap"))
print(Color.purple("-" * 50))
if len(data) > 0:
    print("Most Busy\t: {}, at {} ({} chat)".format(
        Color.purple(str(data[0][0][0])), 
        Color.purple(str(data[0][0][1]) + ":00"), 
        Color.purple(str(data[0][1]))))
    print("Most Silence\t: {}, at {} ({} chat)".format(
        Color.purple(str(data[-1][0][0])), 
        Color.purple(str(data[-1][0][1]) + ":00"), 
        Color.purple(str(data[-1][1]))))
print()
print('---')
print('X: Days')
print('Y: Hours')
print('---')
print('Less [{}{}{}{}{}] More'.format(
    Color.custom("===", bold=False), 
    Color.custom("░░░", bold=True, fg_light_grey=True),
    Color.custom("▒▒▒", bold=True, fg_green=True),
    Color.custom("▓▓▓", bold=True, fg_orange=True),
    Color.custom("███", bold=True, fg_red=True)
))
print()
printCalendar(dict(data))

print_metrics_wave(
    parsed_lines,
    strip_emojis=not args.keep_emoji_in_length,
    stretch_query=args.stretch,
)