# Visual goal inference

The default goal classifier is the authors' E2E-Spot SoccerNet-v2 RegNetY-200MF
GSM/BiGRU checkpoint, independent of tracking and scoreboard OCR. The existing
foul, pass, shot, team/player, database and highlight features remain in their
existing pipeline. Code provenance and licenses are included here and in
`models/video_events/manifest.json`.

Install `requirements.txt`. The checkpoint is local and excluded from Git.
To restore it from PowerShell in the backend directory:

```powershell
Invoke-WebRequest https://raw.githubusercontent.com/jhong93/e2e-spot-models/main/soccer_rny002gsm_gru_rgb/checkpoint_088.pt -OutFile models/video_events/checkpoint_088.pt
```

Loading checks SHA256 and strictly matches every model parameter. Frames are
sampled with stride `max(1, int(fps / 2))`, resized to 398x224 JPEG/RGB, normalized
with ImageNet statistics, and evaluated in overlapping 100-frame windows.
Only winning Goal predictions of at least 0.5 are accepted. Nearby peaks merge.
Frame memory is limited to one window plus model working memory. CPU inference
is serialized across jobs and the loaded model is cached.

`--video-event-model none` restores legacy goal processing.
`--shot-goal-fallback` enables the previous strong-shot promotion shortcut;
it is off by default with the visual classifier because a shot score does not
establish that the shot scored. Scoreboard confirmation remains available and
retains raw video evidence whenever it confirms a visual-model goal.

## Local validation, 10 October 2026

The adapter reproduced upstream predictions within 1e-5 on three local clips.
Portugal/Egypt test.mp4: one visual goal at 11 seconds, score 0.84894.
With all top scoreboard pixels removed: one goal, score 0.86053.
The six-second no-goal control: zero goals, peak goal score 0.01842.

The user's 25.8-second Porto/Manchester City edited clip is still missed by
the classifier (peak 0.33644). The larger and challenge E2E checkpoints and
both small and big T-DEED checkpoints were also tested and missed it. The existing scoreboard reader detects
its score change; that is confirmation from the graphic, not a successful
visual classifier prediction. Do not advertise complete detection or a
general accuracy percentage from this small local test set. More labeled
positive, saved-shot and missed-shot examples are needed to measure accuracy
and adapt a model to short edited/replay clips.
