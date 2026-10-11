"""The requested confidence fallback, including scores and duplicate evidence."""
import unittest
from unittest.mock import Mock

from main import _resolve_identities
from scorer_identifier import format_goal_event
from track_events import (
    drop_replayed_goals, promote_high_confidence_shots, withdraw_saves_of_goals,
)

FPS = 25.0


def shot(frame=100, confidence=0.80, outcome="unknown"):
    return {
        "event": "shot", "frame": frame, "end_frame": frame + 10,
        "confidence": confidence, "source": "tracks", "team_id": 1, "team_name": "Demo United",
        "participants": [
            {"role": "shooter", "track_id": 7, "team_id": 1, "team_name": "Demo United", "team_confidence": 0.9},
            {"role": "goalkeeper", "track_id": 9, "team_id": 2, "team_name": "Demo City", "team_confidence": 0.9},
        ],
        "details": {"outcome": outcome, "on_target": True},
    }


def goals(events):
    return [event for event in events if event["event"] == "goal"]


class ShotGoalFallbackTests(unittest.TestCase):
    def test_inclusive_cutoff_and_weaker_shot(self):
        self.assertEqual(len(goals(promote_high_confidence_shots([shot(confidence=0.80)], FPS))), 1)
        self.assertEqual(goals(promote_high_confidence_shots([shot(confidence=0.799)], FPS)), [])

    def test_missing_invalid_or_nonfinite_confidence_does_not_score(self):
        for confidence in (None, "bad", float("nan"), float("inf"), -0.1, 1.1):
            with self.subTest(confidence=confidence):
                self.assertEqual(goals(promote_high_confidence_shots([shot(confidence=confidence)], FPS)), [])

    def test_saved_high_confidence_shot_is_promoted_as_requested(self):
        original = shot(confidence=0.9, outcome="saved")
        save = {"event": "save", "frame": original["frame"]}
        result = withdraw_saves_of_goals(promote_high_confidence_shots([original, save], FPS))
        self.assertEqual([event["event"] for event in result], ["shot", "goal"])
        self.assertEqual(original["details"]["outcome"], "goal")
        self.assertEqual(goals(result)[0]["details"]["shot_outcome_before_fallback"], "saved")

    def test_existing_goal_evidence_is_never_displaced_by_fallback(self):
        for source in ("scoreboard", "pitch", "tracks", "model"):
            with self.subTest(source=source):
                real_goal = {"event": "goal", "frame": 130, "source": source, "details": {}}
                original = shot(frame=100)
                result = drop_replayed_goals(promote_high_confidence_shots([original, real_goal], FPS), FPS)
                self.assertEqual(goals(result), [real_goal])
                self.assertEqual(original["details"]["outcome"], "unknown")

    def test_replays_and_repeated_application_do_not_add_scores(self):
        result = promote_high_confidence_shots([shot(frame=100), shot(frame=150)], FPS)
        self.assertEqual(len(goals(result)), 1)
        self.assertEqual(len(goals(promote_high_confidence_shots(result, FPS))), 1)

    def test_separate_shots_beyond_replay_window_score_separately(self):
        result = promote_high_confidence_shots([shot(frame=100), shot(frame=100 + int(61 * FPS))], FPS)
        self.assertEqual(len(goals(drop_replayed_goals(result, FPS))), 2)

    def test_scorer_team_timing_and_inference_label_are_preserved(self):
        original = shot()
        inferred = goals(promote_high_confidence_shots([original], FPS))[0]
        self.assertEqual(inferred["participants"][0]["role"], "scorer")
        self.assertEqual(inferred["participants"][0]["track_id"], 7)
        self.assertEqual(len(inferred["participants"]), 1)
        self.assertEqual(original["participants"][0]["role"], "shooter")
        self.assertEqual(inferred["team_name"], "Demo United")
        self.assertEqual(inferred["end_frame"], original["end_frame"])
        self.assertEqual(inferred["source"], "high_confidence_shot")
        inferred["scorer"] = {"team_name": "Demo United", "jersey_number": 7, "player_name": "Ayaan Khan"}
        description = format_goal_event(inferred)
        self.assertIn("GOAL (shot fallback)", description)
        self.assertIn("Demo United", description)
        self.assertIn("#7 Ayaan Khan", description)

    def test_unread_shooter_scores_for_opposite_keeper_team(self):
        original = shot()
        original.update(team_id=2, team_name="Demo City")
        original["participants"][0].update(team_id=0, team_name="unknown_team")
        inferred = goals(promote_high_confidence_shots(
            [original], FPS, team_names={1: "Demo United", 2: "Demo City"}
        ))[0]
        self.assertEqual((inferred["team_id"], inferred["team_name"]), (1, "Demo United"))
        self.assertEqual(inferred["participants"][0]["team_id"], 1)
        self.assertEqual(original["participants"][0]["team_id"], 0)

    def test_unknown_shooter_without_team_mapping_is_not_credited_to_keeper(self):
        original = shot()
        original.update(team_id=2, team_name="Demo City")
        original["participants"][0].update(team_id=0, team_name="unknown_team")
        inferred = goals(promote_high_confidence_shots([original], FPS))[0]
        self.assertEqual((inferred["team_id"], inferred["team_name"]), (0, "unknown_team"))

    def test_null_details_are_supported(self):
        original = shot()
        original["details"] = None
        self.assertEqual(len(goals(promote_high_confidence_shots([original], FPS))), 1)

    def test_identity_resolution_preserves_the_scoring_team(self):
        inferred = goals(promote_high_confidence_shots([shot()], FPS))[0]
        identities = Mock()
        identities.identify_participants.return_value = [
            {"role": "scorer", "track_id": 7, "team_id": 2, "team_name": "Demo City", "jersey_number": 7}
        ]
        _resolve_identities(identities, inferred, None, None)
        self.assertEqual(inferred["scorer"]["team_id"], 1)
        self.assertEqual(inferred["scorer"]["team_name"], "Demo United")
        self.assertEqual(inferred["actors"][0]["team_id"], 1)


if __name__ == "__main__":
    unittest.main()
