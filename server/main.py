from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from ytmusicapi import YTMusic
import yt_dlp
import os

from not_spotify_either.search import search_songs
from not_spotify_either.playlists import list_library_playlists, create, add_songs, get_tracks
from server.schemas import Song, PlaylistSummary, CreatePlaylistRequest, AddSongsRequest, StatusResponse

app = FastAPI(title="PlayTube API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

_yt: YTMusic | None = None

def get_yt() -> YTMusic:
    global _yt
    if _yt is None:
        try:
            _yt = YTMusic("browser.json")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Auth failed: {e}")
    return _yt

# --- API ROUTES ---
@app.get("/api/health")
def health() -> StatusResponse:
    return StatusResponse(status="ok")

@app.get("/api/search", response_model=list[Song])
def api_search(q: str = Query(..., min_length=1), limit: int = Query(10, ge=1, le=50)) -> list[Song]:
    yt = get_yt()
    try:
        return search_songs(yt, q, limit)
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))

@app.get("/api/download/{video_id}")
def download_video(video_id: str):
    ffmpeg_path = r"C:\Users\223074993\Desktop\PlayTube-New\PlayTube-fixed\ffmpeg-9.0.2-essentials_build\bin\ffmpeg.exe"
    ydl_opts = {
        'format': 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
        'outtmpl': f'downloads/{video_id}.%(ext)s',
        'ffmpeg_location': ffmpeg_path,
        'quiet': True
    }
    os.makedirs("downloads", exist_ok=True)
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([f"https://www.youtube.com/watch?v={video_id}"])
        file_path = f"downloads/{video_id}.mp4"
        if os.path.exists(file_path):
            return FileResponse(file_path, media_type="video/mp4", filename=f"PlayTube_{video_id}.mp4")
        else:
            for f in os.listdir("downloads"):
                if f.startswith(video_id):
                    return FileResponse(f"downloads/{f}", media_type="video/mp4", filename=f"PlayTube_{f}")
            raise HTTPException(status_code=500, detail="Download failed")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/search_and_download")
def search_and_download(query: str):
    yt = get_yt()
    try:
        results = search_songs(yt, query, limit=1)
        if not results:
            raise HTTPException(status_code=404, detail="No song found")
            
        video_id = results[0]["videoId"]
        ffmpeg_path = r"C:\Users\223074993\Desktop\PlayTube-New\PlayTube-fixed\ffmpeg-9.0.2-essentials_build\bin\ffmpeg.exe"
        ydl_opts = {
            'format': 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
            'outtmpl': f'downloads/{video_id}.%(ext)s',
            'ffmpeg_location': ffmpeg_path,
            'quiet': True
        }
        os.makedirs("downloads", exist_ok=True)
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([f"https://www.youtube.com/watch?v={video_id}"])
        
        file_path = f"downloads/{video_id}.mp4"
        if os.path.exists(file_path):
            safe_title = "".join(c for c in results[0]['title'] if c.isalnum() or c in " -_").strip()
            return FileResponse(file_path, media_type="video/mp4", filename=f"{safe_title}.mp4")
        else:
            for f in os.listdir("downloads"):
                if f.startswith(video_id):
                    return FileResponse(f"downloads/{f}", media_type="video/mp4", filename=f"PlayTube_{f}")
            raise HTTPException(status_code=500, detail="Download failed")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/playlists", response_model=list[PlaylistSummary])
def api_playlists() -> list[PlaylistSummary]:
    yt = get_yt()
    try:
        return list_library_playlists(yt)
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))

@app.post("/api/playlists", response_model=StatusResponse)
def api_create_playlist(req: CreatePlaylistRequest) -> StatusResponse:
    yt = get_yt()
    try:
        pid = create(yt, req.name, req.description)
        return StatusResponse(status=pid)
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))

@app.post("/api/playlists/{playlist_id}/songs", response_model=StatusResponse)
def api_add_songs(playlist_id: str, req: AddSongsRequest) -> StatusResponse:
    yt = get_yt()
    try:
        status = add_songs(yt, playlist_id, req.video_ids)
        return StatusResponse(status=status)
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))

@app.get("/api/playlists/{playlist_id}/songs", response_model=list[Song])
def api_playlist_songs(playlist_id: str) -> list[Song]:
    yt = get_yt()
    try:
        return get_tracks(yt, playlist_id)
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))

# --- SERVE REACT STATIC FILES (CATCH-ALL) ---
DIST_DIR = r"C:\Users\223074993\Desktop\PlayTube-New\PlayTube-fixed\frontend\dist"

@app.get("/{full_path:path}")
async def serve_react_app(full_path: str):
    if full_path.startswith("api/"):
        raise HTTPException(status_code=404, detail="API route not found")
    
    file_path = os.path.join(DIST_DIR, full_path)
    if os.path.isfile(file_path):
        return FileResponse(file_path)
    
    # Fallback to index.html for React Router
    index_path = os.path.join(DIST_DIR, "index.html")
    if os.path.isfile(index_path):
        return FileResponse(index_path)
        
    return {"error": "Frontend build not found. Please run 'npm run build' in the frontend folder."}
