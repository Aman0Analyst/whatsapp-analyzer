import os
import subprocess
import sys
import tempfile
from unittest import TestCase


REPO_ROOT = os.path.dirname(os.path.dirname(__file__))
ANALYZER = os.path.join(REPO_ROOT, "whatsapp_analyzer.py")


class TestMetricsWaveCli(TestCase):
    def run_analyzer(self, lines, *args):
        with tempfile.NamedTemporaryFile("w", encoding="utf-8", suffix=".txt") as chat:
            chat.write("\n".join(lines))
            chat.flush()
            return subprocess.run(
                [sys.executable, ANALYZER, chat.name, *args],
                cwd=REPO_ROOT,
                check=True,
                capture_output=True,
                text=True,
            ).stdout

    def test_prints_conversation_session_health_and_reply_metrics(self):
        lines = []
        for day in (13, 14, 15, 18, 19, 20):
            lines.extend(
                [
                    f"[{day}/1/2026, 11:00:00 pm] Alice: hello? 😀😀",
                    f"[{day}/1/2026, 11:05:00 pm] Bob: two words",
                ]
            )
        lines.append("[13/1/2026, 11:02:00 pm] Carol: <Media omitted>")

        output = self.run_analyzer(lines)

        self.assertIn("Conversation Balance", output)
        self.assertIn("Alice | 6 words | 33.3% | mean 1.0 words/message", output)
        self.assertIn("Active days\t: 6", output)
        self.assertIn("Silent days\t: 2", output)
        self.assertIn("Sessions (45-minute gap)", output)
        self.assertIn("Session count\t: 6", output)
        self.assertIn("Median duration\t: 5m 0s", output)
        self.assertIn("Median messages/session\t: 2.0", output)
        self.assertIn("Median people/burst\t: 2.0", output)
        self.assertIn("Alice | 6 starts | 100.0%", output)
        self.assertIn("Bob | 6 closes | 100.0%", output)
        self.assertIn("Top Emojis by Sender", output)
        self.assertIn("Alice | 😀 12", output)
        self.assertIn("Senders with 0 chat lines\t: Carol", output)
        self.assertIn("Herfindahl concentration\t: 0.432", output)
        self.assertIn("Night share\t: 100.0%", output)
        self.assertIn("Weekend share\t: 15.4%", output)
        self.assertIn("Alice | 6/6 questions | 100.0%", output)
        self.assertIn("Reply Times (2-hour window)", output)
        self.assertIn("Bob | n=6 | median 5m 0s | P90 5m 0s", output)

    def test_long_message_length_strips_emojis_unless_flag_is_set(self):
        emoji_heavy = "x" + ("😀" * 40)
        text_heavy = "abcdefghijklmnopqrst"
        lines = [
            f"[1/1/2026, 10:0{i}:00 am] Alice: {emoji_heavy if i == 0 else text_heavy if i == 1 else 'short'}"
            for i in range(8)
        ]

        stripped = self.run_analyzer(lines)
        kept = self.run_analyzer(lines, "--keep-emoji-in-length")

        self.assertIn(text_heavy, stripped)
        self.assertNotIn(emoji_heavy, stripped)
        self.assertIn(emoji_heavy, kept)

    def test_stretch_flag_counts_per_sender(self):
        lines = [
            "[1/1/2026, 10:00:00 am] Alice: Jaaaan Jaaaannnnn jaan",
            "[1/1/2026, 10:01:00 am] Bob: goooodddd gggooood good god",
        ]
        jaan = self.run_analyzer(lines, "--stretch", "jaan")
        good = self.run_analyzer(lines, "--stretch", "good")

        jaan_block = jaan[jaan.index("Stretched Words"):jaan.index("Reply Times")]
        self.assertIn('Matches for "jaan"\t: 2', jaan_block)
        self.assertIn("Alice", jaan_block)
        self.assertNotIn("jaaaan", jaan_block)
        self.assertNotIn("jaaaannnnn", jaan_block)
        self.assertNotIn("Bob", jaan_block)

        good_block = good[good.index("Stretched Words"):good.index("Reply Times")]
        self.assertIn('Matches for "good"\t: 2', good_block)
        self.assertIn("Bob", good_block)
        self.assertNotIn("Alice", good_block)
        self.assertNotIn("goooodddd", good_block)
        self.assertNotIn("gggooood", good_block)

