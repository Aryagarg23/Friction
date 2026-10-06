/**
 * SPOTIFY APP
 * 
 * Simulated music player with playlists, playback controls, and progress bar.
 */

import { useState, useEffect, useRef } from "react";
import { Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Volume2, Heart } from "lucide-react";

interface Track {
  id: number;
  title: string;
  artist: string;
  album: string;
  duration: string;
  durationSec: number;
  liked: boolean;
}

const PLAYLISTS = [
  { id: "focus", name: "Deep work", tracks: 42, icon: "🎯" },
  { id: "40hz", name: "40Hz (desk vibration tests)", tracks: 3, icon: "〰️" },
  { id: "lofi", name: "lo-fi for calibrating", tracks: 61, icon: "🎧" },
  { id: "freakoff", name: "HALEY'S FREAKOFF CORNER!!!!", tracks: 27, icon: "🔥" },
  { id: "storyboard", name: "storyboard —> gradient intro??", tracks: 14, icon: "🌈" },
];

const TRACKS: Track[] = [
  { id: 1, title: "40Hz binaural - desk vibration test", artist: "Arya Garg (local file)", album: "Friction calibration", duration: "4:46", durationSec: 286, liked: true },
  { id: 2, title: "Weightless", artist: "Marconi Union", album: "Weightless", duration: "8:09", durationSec: 489, liked: true },
  { id: 3, title: "Clair de Lune", artist: "Debussy", album: "Suite bergamasque", duration: "5:12", durationSec: 312, liked: false },
  { id: 4, title: "Gymnopédie No.1", artist: "Erik Satie", album: "Gymnopédies", duration: "3:29", durationSec: 209, liked: true },
  { id: 5, title: "Intro", artist: "The xx", album: "xx", duration: "2:07", durationSec: 127, liked: false },
  { id: 6, title: "Electra", artist: "Airhead", album: "Special", duration: "4:01", durationSec: 241, liked: false },
  { id: 7, title: "Nuvole Bianche", artist: "Ludovico Einaudi", album: "Una Mattina", duration: "5:57", durationSec: 357, liked: true },
  { id: 8, title: "Experience", artist: "Ludovico Einaudi", album: "In a Time Lapse", duration: "5:15", durationSec: 315, liked: false },
];

export function SpotifyApp() {
  const [currentTrack, setCurrentTrack] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(75);
  const [tracks, setTracks] = useState(TRACKS);
  const [selectedPlaylist, setSelectedPlaylist] = useState("focus");
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setProgress(p => {
          if (p >= 100) {
            handleNext();
            return 0;
          }
          return p + (100 / tracks[currentTrack].durationSec);
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isPlaying, currentTrack]);

  const handleNext = () => {
    setCurrentTrack(prev => (prev + 1) % tracks.length);
    setProgress(0);
  };
  const handlePrev = () => {
    setCurrentTrack(prev => (prev - 1 + tracks.length) % tracks.length);
    setProgress(0);
  };
  const toggleLike = (id: number) => {
    setTracks(prev => prev.map(t => t.id === id ? { ...t, liked: !t.liked } : t));
  };

  const track = tracks[currentTrack];
  const elapsed = Math.floor((progress / 100) * track.durationSec);
  const elapsedStr = `${Math.floor(elapsed / 60)}:${(elapsed % 60).toString().padStart(2, "0")}`;

  return (
    <div className="size-full flex" style={{ backgroundColor: "#121212" }}>
      {/* Sidebar */}
      <div className="w-52 flex flex-col p-3 border-r" style={{ borderColor: "#282828" }}>
        <div className="text-xs uppercase mb-3" style={{ color: "#b3b3b3", letterSpacing: "0.1em" }}>
          Playlists
        </div>
        {PLAYLISTS.map(pl => (
          <button
            key={pl.id}
            onClick={() => setSelectedPlaylist(pl.id)}
            className="flex items-center gap-2 px-3 py-2 rounded text-sm text-left cursor-pointer mb-1"
            style={{
              backgroundColor: selectedPlaylist === pl.id ? "#282828" : "transparent",
              color: selectedPlaylist === pl.id ? "#1db954" : "#b3b3b3",
            }}
          >
            <span>{pl.icon}</span>
            <div>
              <div>{pl.name}</div>
              <div className="text-xs" style={{ color: "#666" }}>{pl.tracks} tracks</div>
            </div>
          </button>
        ))}
      </div>

      {/* Main Area */}
      <div className="flex-1 flex flex-col">
        {/* Track List */}
        <div className="flex-1 overflow-y-auto p-4">
          <h2 className="text-lg mb-4" style={{ color: "#ffffff" }}>
            {PLAYLISTS.find(p => p.id === selectedPlaylist)?.name}
          </h2>
          <div className="space-y-1">
            {tracks.map((t, i) => (
              <div
                key={t.id}
                onClick={() => { setCurrentTrack(i); setProgress(0); setIsPlaying(true); }}
                className="flex items-center gap-3 px-3 py-2 rounded cursor-pointer group"
                style={{
                  backgroundColor: currentTrack === i ? "rgba(29, 185, 84, 0.1)" : "transparent",
                  color: currentTrack === i ? "#1db954" : "#b3b3b3",
                }}
                onMouseEnter={(e) => { if (currentTrack !== i) e.currentTarget.style.backgroundColor = "#282828"; }}
                onMouseLeave={(e) => { if (currentTrack !== i) e.currentTarget.style.backgroundColor = "transparent"; }}
              >
                <span className="w-5 text-right text-xs">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm truncate">{t.title}</div>
                  <div className="text-xs truncate" style={{ color: "#666" }}>{t.artist}</div>
                </div>
                <button onClick={(e) => { e.stopPropagation(); toggleLike(t.id); }} className="cursor-pointer">
                  <Heart size={14} fill={t.liked ? "#1db954" : "none"} style={{ color: t.liked ? "#1db954" : "#666" }} />
                </button>
                <span className="text-xs w-10 text-right">{t.duration}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Player Controls */}
        <div className="px-4 py-3 border-t" style={{ borderColor: "#282828", backgroundColor: "#181818" }}>
          <div className="flex items-center gap-4">
            {/* Now Playing */}
            <div className="w-48 flex items-center gap-3">
              <div className="w-10 h-10 rounded flex-shrink-0" style={{ backgroundColor: "#282828" }}>
                <div className="size-full flex items-center justify-center text-lg">🎵</div>
              </div>
              <div className="min-w-0">
                <div className="text-sm truncate" style={{ color: "#fff" }}>{track.title}</div>
                <div className="text-xs truncate" style={{ color: "#b3b3b3" }}>{track.artist}</div>
              </div>
            </div>

            {/* Center Controls */}
            <div className="flex-1 flex flex-col items-center gap-1">
              <div className="flex items-center gap-4">
                <button onClick={() => setShuffle(!shuffle)} className="cursor-pointer">
                  <Shuffle size={14} style={{ color: shuffle ? "#1db954" : "#b3b3b3" }} />
                </button>
                <button onClick={handlePrev} className="cursor-pointer">
                  <SkipBack size={16} fill="#b3b3b3" style={{ color: "#b3b3b3" }} />
                </button>
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer"
                  style={{ backgroundColor: "#fff" }}
                >
                  {isPlaying
                    ? <Pause size={16} fill="#000" style={{ color: "#000" }} />
                    : <Play size={16} fill="#000" style={{ color: "#000", marginLeft: "2px" }} />
                  }
                </button>
                <button onClick={handleNext} className="cursor-pointer">
                  <SkipForward size={16} fill="#b3b3b3" style={{ color: "#b3b3b3" }} />
                </button>
                <button onClick={() => setRepeat(!repeat)} className="cursor-pointer">
                  <Repeat size={14} style={{ color: repeat ? "#1db954" : "#b3b3b3" }} />
                </button>
              </div>
              {/* Progress Bar */}
              <div className="w-full flex items-center gap-2 max-w-md">
                <span className="text-xs w-10 text-right" style={{ color: "#b3b3b3" }}>{elapsedStr}</span>
                <div
                  className="flex-1 h-1 rounded-full cursor-pointer relative"
                  style={{ backgroundColor: "#535353" }}
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    setProgress(((e.clientX - rect.left) / rect.width) * 100);
                  }}
                >
                  <div className="h-full rounded-full" style={{ width: `${progress}%`, backgroundColor: "#1db954" }} />
                </div>
                <span className="text-xs w-10" style={{ color: "#b3b3b3" }}>{track.duration}</span>
              </div>
            </div>

            {/* Volume */}
            <div className="w-32 flex items-center gap-2">
              <Volume2 size={14} style={{ color: "#b3b3b3" }} />
              <div
                className="flex-1 h-1 rounded-full cursor-pointer relative"
                style={{ backgroundColor: "#535353" }}
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  setVolume(Math.round(((e.clientX - rect.left) / rect.width) * 100));
                }}
              >
                <div className="h-full rounded-full" style={{ width: `${volume}%`, backgroundColor: "#b3b3b3" }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
