import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import YouTube from 'react-youtube';
import './App.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'ngrok-skip-browser-warning': 'true'
  }
});

function App() {
  const [activeTab, setActiveTab] = useState('search');
  const [query, setQuery] = useState('');
  const [songs, setSongs] = useState([]);
  const [error, setError] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(50);
  const playerRef = useRef(null);
  const timerRef = useRef(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setError(null);
    setActiveTab('search');
    try {
      const response = await api.get(`/api/search?q=${encodeURIComponent(query)}`);
      setSongs(response.data);
    } catch (err) {
      setError('Failed to fetch songs.');
    }
  };

  const playSong = (index) => {
    setCurrentIndex(index);
    setIsPlaying(true);
  };

  const togglePlay = () => {
    if (!playerRef.current) return;
    if (isPlaying) {
      playerRef.current.pauseVideo();
    } else {
      playerRef.current.playVideo();
    }
    setIsPlaying(!isPlaying);
  };

  const playNext = () => {
    if (currentIndex < songs.length - 1) playSong(currentIndex + 1);
  };

  const playPrev = () => {
    if (currentIndex > 0) playSong(currentIndex - 1);
  };

  const onPlayerReady = (event) => {
    playerRef.current = event.target;
    event.target.setVolume(volume);
    event.target.playVideo();
  };

  const onPlayerStateChange = (event) => {
    if (event.data === 1) {
      setIsPlaying(true);
      setDuration(playerRef.current.getDuration());
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setCurrentTime(playerRef.current.getCurrentTime());
      }, 1000);
    } 
    else if (event.data === 2) {
      setIsPlaying(false);
      if (timerRef.current) clearInterval(timerRef.current);
    } 
    else if (event.data === 0) {
      setIsPlaying(false);
      if (timerRef.current) clearInterval(timerRef.current);
      playNext();
    }
  };

  const handleSeek = (e) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (playerRef.current) playerRef.current.seekTo(time, true);
  };

  const handleVolume = (e) => {
    const vol = parseInt(e.target.value);
    setVolume(vol);
    if (playerRef.current) playerRef.current.setVolume(vol);
  };

  const formatTime = (seconds) => {
    if (!seconds) return "0:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const playerOpts = { height: '0', width: '0', playerVars: { autoplay: 0 } };
  const defaultImg = "https://i.ytimg.com/vi/default/hqdefault.jpg";
  const currentSong = songs[currentIndex];

  return (
    <div className="app-container">
      <header className="top-bar">
        <div className="logo">
          <svg viewBox="0 0 24 24" width="32" height="32" fill="#1db954"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"></path></svg> 
          PlayTube
        </div>
        
        <form className="search-bar" onSubmit={handleSearch}>
          <span className="search-icon">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M10.533 1.27893C5.35215 1.27893 1.12598 5.41887 1.12598 10.5579C1.12598 15.697 5.35215 19.8369 10.533 19.8369C12.767 19.8369 14.8197 19.0671 16.4558 17.7994L21.4229 22.7674C21.7786 23.1231 22.3553 23.1231 22.711 22.7674C23.0667 22.4117 23.0667 21.835 22.711 21.4793L17.7441 16.5124C19.105 14.7511 19.9416 12.5435 19.9416 10.5579C19.9416 5.41887 15.7139 1.27893 10.533 1.27893ZM3.12598 10.5579C3.12598 6.41587 6.44327 3.27893 10.533 3.27893C14.6227 3.27893 17.9416 6.41587 17.9416 10.5579C17.9416 14.6999 14.6227 17.8369 10.533 17.8369C6.44327 17.8369 3.12598 14.6999 3.12598 10.5579Z"></path></svg>
          </span>
          <input type="text" placeholder="Search for music..." value={query} onChange={(e) => setQuery(e.target.value)} />
        </form>

        <div className="user-profile"><div className="avatar">P</div></div>
      </header>

      <div className="main-layout">
        <aside className="sidebar">
          <nav>
            <div className={`nav-item ${activeTab === 'search' ? 'active' : ''}`} onClick={() => setActiveTab('search')}>
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 3a9 9 0 1 0 9 9 9 9 0 0 0-9-9zm0 16a7 7 0 1 1 7-7 7 7 0 0 1-7 7zm.5-12H11v6l5.25 3.15.75-1.23-4.5-2.67V7z"></path></svg>
              Home / Search
            </div>
          </nav>

          {/* Sidebar Ad Slot */}
          <div className="ad-slot sidebar-ad">
            <span>Advertisement</span>
          </div>

          <div className="sidebar-footer">
            <a href="https://www.buymeacoffee.com/yourusername" target="_blank" rel="noreferrer" className="donate-btn">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" style={{marginRight: '8px'}}><path d="M20 3H4v10c0 2.21 1.79 4 4 4h6c2.21 0 4-1.79 4-4v-3h2c1.11 0 2-.89 2-2V5c0-1.11-.89-2-2-2zm0 5h-2V5h2v3zM2 21h18v-2H2v2z"/></svg>
              Support Me
            </a>
          </div>
        </aside>

        <main className="content">
          {error && <p style={{ color: '#ff4444' }}>{error}</p>}

          <div className="header-label">DISCOVER MUSIC</div>
          <h1 className="page-title">{songs.length > 0 ? 'Search results' : 'Start Searching'}</h1>
          <div className="track-list">
            {songs.map((song, index) => (
              <div key={index} className={`track-row ${currentIndex === index ? 'active-row' : ''}`} onClick={() => playSong(index)}>
                <div className="track-img-container">
                   <img src={song.thumbnail || defaultImg} alt="cover" className="track-img" onError={(e) => { e.target.src = defaultImg; }} />
                </div>
                <div className="track-info">
                  <div className="track-title">{song.title}</div>
                  <div className="track-artist">{song.artist}</div>
                </div>
                <span className="track-album">{song.artist}</span>
                <span className="track-duration">{song.duration}</span>
              </div>
            ))}
          </div>
        </main>
      </div>

      {currentSong && (
        <>
          {/* Banner Ad Slot */}
          <div className="ad-slot banner-ad">
            <span>Advertisement</span>
          </div>

          <div className="player-bar">
            <div className="player-left">
              <img src={currentSong.thumbnail || defaultImg} alt="cover" className="player-img" onError={(e) => { e.target.src = defaultImg; }} />
              <div className="player-text">
                <span className="player-title">{currentSong.title}</span>
                <span className="player-subtitle">{currentSong.artist}</span>
              </div>
              <div className="player-actions">
                <button className="icon-btn"><svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z"/></svg></button>
                <button className="icon-btn"><svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M15 3H6c-.83 0-1.54.5-1.84 1.22l-3.02 7.05c-.09.23-.14.47-.14.73v2c0 1.1.9 2 2 2h6.31l-.95 4.57-.03.32c0 .41.17.79.44 1.06L9.83 23l6.59-6.59c.36-.36.58-.86.58-1.41V5c0-1.1-.9-2-2-2zm4 0v12h4V3h-4z"/></svg></button>
              </div>
            </div>

            <div className="player-center">
              <div className="control-buttons">
                <button className="control-btn" onClick={playPrev} disabled={currentIndex === 0}>
                  <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>
                </button>
                <button className="play-btn" onClick={togglePlay}>
                  {isPlaying ? (
                    <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                  ) : (
                    <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                  )}
                </button>
                <button className="control-btn" onClick={playNext} disabled={currentIndex === songs.length - 1}>
                  <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
                </button>
              </div>

              <div className="scrubber-container">
                <span className="time-text">{formatTime(currentTime)}</span>
                <input type="range" className="scrubber" min="0" max={duration || 100} value={currentTime} onChange={handleSeek} />
                <span className="time-text">{formatTime(duration)}</span>
              </div>
            </div>

            <div className="player-right">
               <div className="volume-control">
                 <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
                 <input type="range" min="0" max="100" value={volume} onChange={handleVolume} className="volume-slider" />
               </div>
               
               <button className="icon-btn"><svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg></button>
               
               <YouTube 
                 videoId={currentSong.videoId} 
                 opts={playerOpts} 
                 onReady={onPlayerReady}
                 onStateChange={onPlayerStateChange}
                 onEnd={playNext}
                 className="hidden-youtube"
               />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default App;
