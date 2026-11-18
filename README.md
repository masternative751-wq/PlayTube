# PlayTube — Purple Galaxy

## Requirements
- Node.js 20.19+ or 22.12+
- Python 3.10+

## Start backend (PowerShell, from this folder)
```powershell
py -m venv .venv
.\\.venv\\Scripts\\Activate.ps1
py -m pip install -r requirements.txt
py -m uvicorn server.main:app --reload --host 127.0.0.1 --port 8000
```
API health: http://localhost:8000/api/health | API docs: http://localhost:8000/docs

## Start frontend (a second terminal)
```powershell
cd frontend
npm install
npm run dev
```
Open http://localhost:5173. If PowerShell blocks npm.ps1, use `npm.cmd install` and `npm.cmd run dev`.

## Current scope and limitations
- Public catalogue search via ytmusicapi; no private browser.json is needed for search.
- Playback uses the YouTube embedded player, not direct audio-file hosting.
- Playlists are stored in a local SQLite database and are not account-specific yet.
- Authentication, artist uploads, moderation, subscriptions and production deployment are future milestones.
- Only play or upload music you own or are authorized to use.
