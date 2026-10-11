# Coding agent guidance

## Project layout

- `backend_jugaad/` contains the active Python backend and its pretrained weights.
- `scripts/start-backend.ps1` starts the API on port 8001 by default.
- `scripts/jugaad_server.py` adapts the backend to the legacy database structure.
- Read `backend_jugaad/AGENTS.md` for additional instructions when working there.
- Read the root `README.md` for setup; the nested README contains upstream history.

## Preserve existing behavior

Do not alter detection thresholds, models, scoreboard behavior, foul logic, database schema, or event presentation as an incidental setup change. Obtain a concrete user request before changing those behaviors. Keep shot, save, and pass records available in the backend even when a separate frontend hides them.

Preserve evidence-based team confirmation and distinguish confirmed player identities from uncertain candidates. Do not present a model confidence value as measured accuracy. Match roster identities by team and jersey number; do not infer a player's name from the number alone.

## Data and artifacts

Use a separate development database. Do not overwrite an existing user's database, videos, or highlights. Keep virtual environments, packages, OCR caches, credentials, and generated media out of Git. The four model weight files documented in the README are intentionally versioned; preserve their paths and verify checksums when replacing or copying them. Preserve third-party license and provenance files.

## Validation and reporting

Run checks appropriate to any code change and state what was actually tested. For documentation-only or identical model-copy changes, verify paths, commands, checksums, and the staged diff rather than changing inference code. A backend test command from `backend_jugaad/`, with dependencies installed, is `python -m unittest discover -s tests -t .`; some tests may need environment-specific services.

Do not claim that an installation on another machine, a model's accuracy, or live database behavior is verified unless it was actually tested. Keep runtime code changes separate from documentation and publication work.
