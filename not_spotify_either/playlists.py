from ytmusicapi import YTMusic

def list_library_playlists(yt: YTMusic) -> list[dict]:
    playlists = yt.get_library_playlists(limit=50)
    return [
        {
            "title": p.get("title"), 
            "playlistId": p.get("playlistId"), 
            "count": p.get("count"),
            "thumbnail": p.get("thumbnails", [{}])[-1].get("url") if p.get("thumbnails") else None
        }
        for p in playlists
    ]

def create(yt: YTMusic, name: str, description: str = "") -> str:
    return yt.create_playlist(name, description)

def add_songs(yt: YTMusic, playlist_id: str, video_ids: list[str]) -> str:
    return yt.add_playlist_items(playlist_id, video_ids)

def get_tracks(yt: YTMusic, playlist_id: str) -> list[dict]:
    data = yt.get_playlist(playlist_id, limit=None)
    return [
        {
            "title": t.get("title"),
            "artist": ", ".join(a["name"] for a in t.get("artists", [])),
            "videoId": t.get("videoId"),
            "duration": t.get("duration"),
            "thumbnail": t.get("thumbnails", [{}])[-1].get("url") if t.get("thumbnails") else None,
        }
        for t in data.get("tracks", [])
    ]
