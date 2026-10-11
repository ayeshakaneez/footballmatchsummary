# Football Match Summary

Football video analysis backend based on the `jugaad` branch of [DevilSinister/football_summary](https://github.com/DevilSinister/football_summary/tree/jugaad), with the current local backend improvements and pretrained weights.

The backend detects events, produces highlight clips, reads jersey numbers, and resolves player names against team rosters in SQL Server. Goal detection includes the E2E-Spot video model and scoreboard processing; foul detection retains the existing event model. Detection and player identification are imperfect; uncertain identities can appear as unconfirmed.

## Included files

- `backend_jugaad/`: backend source, tests, roster JSON files, training notebooks, documentation, and model weights.
- `scripts/`: launcher and compatibility adapter for the original database structure.
- `frontend/`: React frontend source and dependency manifests, including the live frame-count processing display.
- `AGENTS.md`: guidance for coding agents. Additional backend guidance is in `backend_jugaad/AGENTS.md`.

Installed packages, the local SQL database, uploaded videos, generated highlights, and OCR download caches are not included. The backend also includes its own static web interface.

## Pretrained models

These files are included directly in Git; Git LFS is not required:

| File under `backend_jugaad/models/` | Use |
| --- | --- |
| `best.pt` | Player/referee tracking |
| `ball_detector_best.pt` | Ball detection |
| `final_model_80.pth` | Existing legacy goal/foul event model |
| `video_events/checkpoint_088.pt` | E2E-Spot video event model used for goals |

The video model's source, checksum, and configuration are in `models/video_events/manifest.json` and `config.json`. Third-party code licenses are retained in `backend_jugaad/video_events/`. The optional `football_field_best.pt` pitch model was not present in the running backend and is not included. PaddleOCR may download its own recognition weights on first use, so allow internet access for that first run.

## Windows setup on another laptop

Install Python (a version supported by the listed PyTorch and PaddlePaddle packages), SQL Server Express, Microsoft ODBC Driver 18 for SQL Server, and FFmpeg with `ffmpeg` and `ffprobe` available on PATH. SQL Server must be running and your Windows account must have permission to create/access the database. This code uses Windows integrated SQL authentication.

Run these commands in PowerShell:

```powershell
git clone https://github.com/ayeshakaneez/footballmatchsummary.git
cd footballmatchsummary
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r .\backend_jugaad\requirements.txt
.\.venv\Scripts\python.exe -m pip install httpx

$env:FOOTY_SQL_SERVER = '.\SQLEXPRESS'
$env:FOOTY_SQL_DATABASE = 'FootyJugaadLegacyDB'
$env:FOOTY_ODBC_DRIVER = 'ODBC Driver 18 for SQL Server'
```

`httpx` is imported by the backend but is not listed separately in the existing requirements file, so it is installed explicitly above. Change the SQL server name if your installation uses a different instance.

Initialize the new database tables and load the supplied team/player rosters before using the compatibility launcher:

```powershell
Push-Location .\backend_jugaad
..\.venv\Scripts\python.exe -m scripts.seed_roster
..\.venv\Scripts\python.exe -m scripts.seed_roster --report
Pop-Location
```

This creates a fresh database using the included schema and roster files; it does not copy existing local match history or accounts. Avoid pointing it at a database you need to preserve.

Start the backend from the repository root:

```powershell
.\scripts\start-backend.ps1 -Python "$PWD\.venv\Scripts\python.exe" -Database 'FootyJugaadLegacyDB' -Port 8001
```

The explicit `-Python` argument overrides the original laptop-specific default without editing code. If PowerShell blocks the script, use a process-scoped policy for this session:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

If FFmpeg is not on PATH, set these before starting the backend, using your actual installation paths:

```powershell
$env:FFMPEG_BINARY = 'C:\ffmpeg\bin\ffmpeg.exe'
$env:FFPROBE_BINARY = 'C:\ffmpeg\bin\ffprobe.exe'
```

Open the bundled interface at http://localhost:8001, API documentation at http://localhost:8001/docs, or check http://localhost:8001/health. Startup creates the demo login `demo@footyai.com` / `password123`; this is intended for local testing.

## React frontend

With Node.js and npm installed, open another PowerShell terminal at the repository root:

```powershell
cd frontend
npm ci
npm run dev -- --host 0.0.0.0
```

Open the URL Vite prints (normally http://localhost:5173). The default backend URL uses the browser's hostname on port 8001. If the backend runs on a different machine, create `frontend/.env.local` with `VITE_API_BASE_URL=http://<backend-laptop-LAN-IP>:8001`, then restart Vite. Permit the necessary ports through the firewall on the private network. `localhost` always refers to the laptop opening the page.

During the frame-detection stage, the processing screen shows `Detecting frames — X of Y` using real backend counts. The earlier video-model stage and later summary stage retain their own status messages. These counts are separate from the weighted overall progress percentage. Restart an already-running backend after updating to load the new progress fields.

## Notes

The original nested README contains upstream documentation that may describe older behavior; use this root README for this repository's setup. Model confidence is not a measured accuracy guarantee. Runtime speed depends on video length, hardware, OCR, and available acceleration. These setup instructions were checked against the source, but a fresh installation on your friend's laptop has not been tested.
