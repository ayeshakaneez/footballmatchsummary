"""Score tokens captured from the supplied Porto/Manchester City video."""
import unittest

from scoreboard import ScoreTracker, Token, parse_tokens


def early_tokens(score="0 0 MCI"):
    return [Token("46:35", .97, (0, 77, 167, 142)),
            Token("POR", .97, (248, 77, 384, 145)),
            Token(score, .82, (447, 72, 809, 150))]


class SplitScoreboardTests(unittest.TestCase):
    def test_captured_initial_score_tokens(self):
        for score in ("0 0 MCI", "00 MCI"):
            reading = parse_tokens(early_tokens(score), ["POR", "MCI"])
            self.assertEqual(reading.codes, ("POR", "MCI"))
            self.assertEqual(reading.scores, (0, 0))

    def test_disconnected_boxes_and_captions_are_rejected(self):
        for text, box in (("0 0 MCI", (447, 172, 809, 250)),
                          ("0 0 MCI", (1000, 72, 1362, 150)),
                          ("0-1 MIN.33 MCI", (447, 72, 809, 150))):
            with self.subTest(text=text, box=box):
                self.assertIsNone(parse_tokens([
                    Token("POR", .97, (248, 77, 384, 145)), Token(text, .82, box)
                ], ["POR", "MCI"]))

    def test_dummy_team_codes_do_not_match_this_video(self):
        self.assertIsNone(parse_tokens(early_tokens(), ["DUN", "DCI"]))

    def test_initial_score_is_established_before_the_goal(self):
        tracker = ScoreTracker(confirm_reads=2)
        baseline = parse_tokens(early_tokens(), ["POR", "MCI"])
        changed = parse_tokens([Token("POR 0-1 MCI", .97, (248, 72, 809, 150))], ["POR", "MCI"])
        tracker.observe(0, baseline)
        tracker.observe(25, baseline)
        tracker.observe(350, changed)
        tracker.observe(375, changed)
        self.assertEqual(len(tracker.goals), 1)
        self.assertEqual(tracker.goals[0].code, "MCI")


if __name__ == "__main__":
    unittest.main()
