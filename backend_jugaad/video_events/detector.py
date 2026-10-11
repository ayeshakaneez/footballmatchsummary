"""SoccerNet RGB event inference with native sampling and bounded frame memory."""
from functools import lru_cache
import hashlib
import json
import math
from pathlib import Path
from threading import Lock

import cv2
import numpy as np

CLASSES = ('Background', *sorted((
    'Penalty', 'Kick-off', 'Goal', 'Substitution', 'Offside', 'Shots on target',
    'Shots off target', 'Clearance', 'Ball out of play', 'Throw-in', 'Foul',
    'Indirect free-kick', 'Direct free-kick', 'Corner', 'Yellow card', 'Red card',
    'Yellow->red card',
)))
DEFAULT_MODEL_DIR = Path(__file__).resolve().parents[1] / 'models' / 'video_events'
INFERENCE_LOCK = Lock()


def select_goals(scores, frames, fps, threshold=0.5, suppression_seconds=10):
    """Accept a goal only when it is the winning class above the threshold."""
    if not math.isfinite(threshold) or not 0 < threshold <= 1:
        raise ValueError('Goal threshold must be in (0, 1]')
    goal_column = CLASSES.index('Goal')
    candidates = [i for i, row in enumerate(scores)
                  if np.isfinite(row).all() and row[goal_column] >= threshold
                  and int(np.argmax(row)) == goal_column]
    kept = []
    for index in sorted(candidates, key=lambda i: float(scores[i, goal_column]), reverse=True):
        if all(abs(frames[index] - frames[j]) > suppression_seconds * fps for j in kept):
            kept.append(index)
    return [
        {'event': 'goal', 'frame': int(frames[i]), 'end_frame': int(frames[i]),
         'confidence': float(scores[i, goal_column]), 'source': 'video_model',
         'team_id': 0, 'team_name': 'unknown_team', 'participants': [],
         'details': {'detected_goal': True, 'detected_by': 'video_model',
                     'video_goal_confidence': float(scores[i, goal_column]),
                     'goal_threshold': threshold, 'scoreboard_required': False}}
        for i in sorted(kept, key=lambda j: frames[j])
    ]


def preprocess_frame(frame, mask_scoreboard=False):
    """Match upstream JPEG extraction, RGB scaling and ImageNet normalization."""
    import torch
    if mask_scoreboard:
        frame = frame.copy()
        frame[:max(1, round(frame.shape[0] * .18))] = 0
    resized = cv2.resize(frame, (398, 224))
    ok, encoded = cv2.imencode('.jpg', resized)
    if not ok:
        raise RuntimeError('Could not encode sampled video frame')
    rgb = cv2.cvtColor(cv2.imdecode(encoded, cv2.IMREAD_COLOR), cv2.COLOR_BGR2RGB)
    tensor = torch.from_numpy(rgb.transpose(2, 0, 1).copy()).float() / 255
    mean = tensor.new_tensor((.485, .456, .406)).view(3, 1, 1)
    std = tensor.new_tensor((.229, .224, .225)).view(3, 1, 1)
    return (tensor - mean) / std


@lru_cache(maxsize=1)
def _load_model(model_directory):
    import torch
    from .network import SpottingNetwork
    directory = Path(model_directory)
    manifest = json.loads((directory / 'manifest.json').read_text(encoding='utf-8'))
    checkpoint = directory / manifest['checkpoint']
    actual_hash = hashlib.sha256(checkpoint.read_bytes()).hexdigest()
    if actual_hash != manifest['sha256']:
        raise ValueError('Video event checkpoint checksum mismatch')
    config = json.loads((directory / 'config.json').read_text(encoding='utf-8'))
    model = SpottingNetwork(config)
    model.load_state_dict(torch.load(checkpoint, map_location='cpu', weights_only=True), strict=True)
    return model.eval(), config, manifest


def detect_video_goals(video_path, model_dir=DEFAULT_MODEL_DIR, threshold=0.5,
                       mask_scoreboard=False, progress_cb=None):
    """Return visual goals and raw scores; no tracking, shots, OCR or database."""
    import torch
    with INFERENCE_LOCK:
        model, config, manifest = _load_model(str(Path(model_dir).resolve()))
        cap = cv2.VideoCapture(str(video_path))
        if not cap.isOpened():
            raise RuntimeError(f'Cannot open video: {video_path}')
        fps = float(cap.get(cv2.CAP_PROP_FPS))
        total = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        if fps <= 0 or total <= 0:
            cap.release()
            raise ValueError('Video must have a valid frame rate and frame count')
        stride = max(1, int(fps / 2))
        frames = list(range(0, total, stride))
        length, clip_len = len(frames), int(config['clip_len'])
        scores = np.zeros((length, len(CLASSES)), dtype=np.float32)
        support = np.zeros(length, dtype=np.int32)
        buffer = {}
        next_frame = 0
        try:
            for start in range(-5, max(0, length - clip_len // 2), clip_len // 2):
                first, last = max(0, start), min(length, start + clip_len)
                for stale in [index for index in buffer if index < first]:
                    del buffer[stale]
                while next_frame <= frames[last - 1]:
                    if not cap.grab():
                        raise RuntimeError('Video ended before its reported frame count')
                    if next_frame % stride == 0:
                        ok, frame = cap.retrieve()
                        if not ok:
                            raise RuntimeError(f'Cannot decode frame {next_frame}')
                        buffer[next_frame // stride] = preprocess_frame(frame, mask_scoreboard)
                    next_frame += 1
                clip = torch.zeros((1, clip_len, 3, 224, 398))
                for index in range(first, last):
                    clip[0, index - start] = buffer[index]
                with torch.inference_mode():
                    predicted = model(clip).softmax(dim=-1)[0].numpy()
                scores[first:last] += predicted[first - start:last - start]
                support[first:last] += 1
                if progress_cb is not None:
                    progress_cb(last, length)
        finally:
            cap.release()
        if not np.all(support > 0):
            raise RuntimeError('Video event inference left unsampled windows')
        scores /= support[:, None]
        events = select_goals(scores, frames, fps, threshold)
        for event in events:
            event['details'].update(model=manifest['name'], checkpoint_sha256=manifest['sha256'],
                                    sampling_stride=stride, scoreboard_masked=mask_scoreboard)
        return events, {'model': manifest['name'], 'fps': fps, 'frames': frames,
                        'scores': scores, 'classes': CLASSES, 'sampling_stride': stride,
                        'peak_goal_confidence': float(scores[:, CLASSES.index('Goal')].max())}
