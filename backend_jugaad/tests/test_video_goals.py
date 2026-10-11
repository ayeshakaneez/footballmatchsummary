import unittest
import numpy as np

from video_events.detector import CLASSES, select_goals
from scoreboard.attribution import attribute_goals
from scoreboard.reader import ScoreGoal


class VideoGoalTests(unittest.TestCase):
    def scores(self, count):
        scores = np.zeros((count, len(CLASSES)), dtype=np.float32)
        scores[:, 0] = 1
        return scores

    def test_goal_uses_published_class_mapping_and_needs_no_shot(self):
        self.assertEqual(CLASSES.index('Goal'), 6)
        scores = self.scores(1)
        scores[0, 0], scores[0, 6] = .1, .9
        goals = select_goals(scores, [330], 30)
        self.assertEqual(len(goals), 1)
        self.assertEqual(goals[0]['frame'], 330)
        self.assertEqual(goals[0]['source'], 'video_model')
        self.assertFalse(goals[0]['details']['scoreboard_required'])

    def test_confident_shots_are_not_goals(self):
        scores = self.scores(2)
        scores[:, 0] = .01
        scores[0, CLASSES.index('Shots on target')] = .99
        scores[1, CLASSES.index('Shots off target')] = .99
        self.assertEqual(select_goals(scores, [10, 20], 25), [])

    def test_requires_goal_to_win_and_rejects_invalid_predictions(self):
        scores = self.scores(3)
        scores[0, 6] = .6
        scores[1, 0], scores[1, 6] = .51, .49
        scores[2, 6] = np.nan
        self.assertEqual(select_goals(scores, [0, 25, 50], 25), [])

    def test_nearby_peaks_merge_but_distant_goals_remain(self):
        scores = self.scores(3)
        scores[:, 0] = .05
        scores[:, 6] = [.8, .9, .85]
        self.assertEqual([g['frame'] for g in select_goals(scores, [0, 25, 1000], 25)], [25, 1000])

    def test_scoreboard_confirmation_retains_visual_model_evidence(self):
        scores = self.scores(1)
        scores[0, 0], scores[0, 6] = .1, .9
        video_goal = select_goals(scores, [100], 25)[0]
        video_goal['details']['checkpoint_sha256'] = 'verified-checkpoint'
        board = ScoreGoal(frame=160, code='MCI', score_before={'POR': 0, 'MCI': 0},
                          score_after={'POR': 0, 'MCI': 1}, window_start=0)
        confirmed, _ = attribute_goals([board], ['POR', 'MCI'], {'MCI': 2},
                                      {1: 'Porto', 2: 'Manchester City'}, [video_goal], 25)
        self.assertEqual(confirmed[0]['details']['detected_by'], 'video_model')
        self.assertEqual(confirmed[0]['details']['video_evidence']['checkpoint_sha256'], 'verified-checkpoint')
        self.assertAlmostEqual(confirmed[0]['details']['video_goal_confidence'], .9, places=5)
