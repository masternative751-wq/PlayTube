from ytmusicapi import YTMusic

def search_songs(yt: YTMusic, query: str, limit: int = 10) -> list[dict]:
    results = yt.search(query, filter="songs", limit=limit)
    return [
        {
            "title": r.get("title"),
            "artist": ", ".join(a["name"] for a in r.get("artists", [])),
            "videoId": r.get("videoId"),
            "duration": r.get("duration"),
            "thumbnail": r.get("thumbnails", [{}])[-1].get("url") if r.get("thumbnails") else None,
        }
        for r in results
    ]
