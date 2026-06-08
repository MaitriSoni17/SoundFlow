import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Track, LoopMode } from './types';
import AudioVisualizer from './components/AudioVisualizer';
import TrackList from './components/TrackList';
import { getStandaloneHTML } from './components/StandaloneExporter';
import { saveTrackBlob, getTrackBlob, deleteTrackBlob, clearAllTrackBlobs, blobToBase64, base64ToBlob } from './utils/db';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Volume1,
  Upload,
  Download,
  Shuffle,
  Repeat,
  Sparkles,
  Music,
  FolderOpen,
  Keyboard
} from 'lucide-react';

export default function App() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolume] = useState<number>(() => {
    const saved = localStorage.getItem('soundflow_volume');
    return saved !== null ? parseFloat(saved) : 0.8;
  });
  const [isMuted, setIsMuted] = useState<boolean>(() => {
    return localStorage.getItem('soundflow_is_muted') === 'true';
  });
  const [loopMode, setLoopMode] = useState<LoopMode>(() => {
    const saved = localStorage.getItem('soundflow_loop_mode');
    return (saved as LoopMode) || 'none';
  });
  const [isShuffle, setIsShuffle] = useState<boolean>(() => {
    return localStorage.getItem('soundflow_is_shuffle') === 'true';
  });
  
  // Drag and Drop overlay indicator
  const [isDraggingOver, setIsDraggingOver] = useState<boolean>(false);

  // Web Audio Nodes and standard Audio element React Refs
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const auxAudioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const auxSourceRef = useRef<MediaElementAudioSourceNode | null>(null);

  // Crossfade Transition State and Timer Refs
  const [isCrossfadeEnabled, setIsCrossfadeEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('soundflow_crossfade_enabled');
    return saved !== 'false';
  });
  const fadeIntervalRef = useRef<number | null>(null);
  const isCrossFadingRef = useRef<boolean>(false);

  useEffect(() => {
    localStorage.setItem('soundflow_crossfade_enabled', isCrossfadeEnabled ? 'true' : 'false');
  }, [isCrossfadeEnabled]);

  // Ref to track playback progress that needs to be restored on track loading
  const initialTimeRef = useRef<number>(0);

  // Ref to track whether the saved state has finished loading from IndexedDB
  const isStateLoadedRef = useRef<boolean>(false);

  // Shuffled sequence tracker
  const [shuffledIndices, setShuffledIndices] = useState<number[]>([]);

  // Load saved state on mount
  useEffect(() => {
    const loadSavedPlaylist = async () => {
      try {
        const metadataStr = localStorage.getItem('soundflow_tracks_metadata');
        if (!metadataStr) {
          isStateLoadedRef.current = true;
          return;
        }
        const metadataList = JSON.parse(metadataStr);
        if (!Array.isArray(metadataList) || metadataList.length === 0) {
          isStateLoadedRef.current = true;
          return;
        }

        const loadedTracks: Track[] = [];
        for (const meta of metadataList) {
          const blob = await getTrackBlob(meta.id);
          if (blob) {
            const file = new File([blob], meta.name, { type: meta.type });
            loadedTracks.push({
              id: meta.id,
              name: meta.name,
              size: meta.size,
              type: meta.type,
              url: URL.createObjectURL(file),
              file: file,
              duration: meta.duration || 0,
            });
          }
        }

        if (loadedTracks.length > 0) {
          setTracks(loadedTracks);
          
          // Restore progress time
          const savedTime = localStorage.getItem('soundflow_current_time');
          if (savedTime) {
            const parsedTime = parseFloat(savedTime);
            initialTimeRef.current = parsedTime;
            setCurrentTime(parsedTime);
          }

          // Restore currentIndex
          const savedIdxStr = localStorage.getItem('soundflow_current_index');
          if (savedIdxStr !== null) {
            const savedIdx = parseInt(savedIdxStr, 10);
            if (savedIdx >= 0 && savedIdx < loadedTracks.length) {
              setCurrentIndex(savedIdx);
              if (audioRef.current) {
                audioRef.current.src = loadedTracks[savedIdx].url;
                audioRef.current.load();
              }
            }
          }
        }
      } catch (err) {
        console.error('Failed to load saved playlist state:', err);
      } finally {
        isStateLoadedRef.current = true;
      }
    };

    loadSavedPlaylist();
  }, []);

  // Synchronize settings changes to localStorage
  useEffect(() => {
    localStorage.setItem('soundflow_volume', volume.toString());
  }, [volume]);

  useEffect(() => {
    localStorage.setItem('soundflow_is_muted', isMuted ? 'true' : 'false');
  }, [isMuted]);

  useEffect(() => {
    localStorage.setItem('soundflow_loop_mode', loopMode);
  }, [loopMode]);

  useEffect(() => {
    localStorage.setItem('soundflow_is_shuffle', isShuffle ? 'true' : 'false');
  }, [isShuffle]);

  useEffect(() => {
    if (isStateLoadedRef.current) {
      localStorage.setItem('soundflow_current_index', currentIndex.toString());
    }
  }, [currentIndex]);

  useEffect(() => {
    if (isStateLoadedRef.current) {
      const metaList = tracks.map(t => ({
        id: t.id,
        name: t.name,
        size: t.size,
        type: t.type,
        duration: t.duration,
      }));
      localStorage.setItem('soundflow_tracks_metadata', JSON.stringify(metaList));
    }
  }, [tracks]);

  // Cleanup local URLs on unmount to prevent resource memory leaks
  useEffect(() => {
    return () => {
      tracks.forEach(track => {
        URL.revokeObjectURL(track.url);
      });
    };
  }, [tracks]);

  // Synchronize mute/volume states to HTML5 element
  useEffect(() => {
    if (audioRef.current && !isCrossFadingRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // Formatter utilities
  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const getReadableSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = 1;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  // Web Audio connection sequence
  const initWebAudio = () => {
    if (audioContextRef.current || !audioRef.current) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64; // nice wide spectral bands

      const source = ctx.createMediaElementSource(audioRef.current);
      source.connect(analyser);

      if (auxAudioRef.current) {
        try {
          const auxSource = ctx.createMediaElementSource(auxAudioRef.current);
          auxSource.connect(analyser);
          auxSourceRef.current = auxSource;
        } catch (e) {
          console.warn("Failed to connect auxiliary source to analyser:", e);
        }
      }

      analyser.connect(ctx.destination);

      audioContextRef.current = ctx;
      analyserRef.current = analyser;
      sourceRef.current = source;
    } catch (err) {
      console.warn("Web audio analyzer creation failed:", err);
    }
  };

  // Generate a random deck sequence of indices
  const generateShuffleQueue = useCallback((size: number, currentIdx: number) => {
    const indices = Array.from({ length: size }, (_, i) => i);
    // Knuth-Fisher-Yates Shuffle
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    // Keep currently playing track at the start of the shuffle queue
    if (currentIdx !== -1) {
      const filtered = indices.filter(idx => idx !== currentIdx);
      filtered.unshift(currentIdx);
      return filtered;
    }
    return indices;
  }, []);

  // Update shuffle queues whenever tracks size changes or shuffle is toggled
  useEffect(() => {
    if (isShuffle && tracks.length > 0) {
      setShuffledIndices(generateShuffleQueue(tracks.length, currentIndex));
    } else {
      setShuffledIndices([]);
    }
  }, [isShuffle, tracks.length, currentIndex, generateShuffleQueue]);

  // Start cross-fade helper
  const startCrossFade = useCallback((oldUrl: string, oldTime: number) => {
    if (!auxAudioRef.current || !audioRef.current) return;

    // Clear any existing fade intervals
    if (fadeIntervalRef.current) {
      clearInterval(fadeIntervalRef.current);
      fadeIntervalRef.current = null;
    }

    isCrossFadingRef.current = true;

    // Prepare auxiliary audio for fade-out
    auxAudioRef.current.src = oldUrl;
    auxAudioRef.current.currentTime = oldTime;
    
    // Set initial volume for fade-out
    const targetVolume = isMuted ? 0 : volume;
    auxAudioRef.current.volume = targetVolume;

    auxAudioRef.current.play()
      .catch(err => {
        console.warn("Aux play prevented or failed:", err);
      });

    // Set initial volume for main audio (fade-in)
    audioRef.current.volume = 0;

    const fadeDuration = 2000; // 2 seconds
    const intervalStep = 50; // update volume every 50ms
    const steps = fadeDuration / intervalStep;
    let currentStep = 0;

    fadeIntervalRef.current = window.setInterval(() => {
      currentStep++;
      const ratio = currentStep / steps; // 0 to 1

      if (ratio >= 1) {
        // Fade complete
        if (fadeIntervalRef.current) {
          clearInterval(fadeIntervalRef.current);
          fadeIntervalRef.current = null;
        }
        isCrossFadingRef.current = false;
        if (audioRef.current) {
          audioRef.current.volume = isMuted ? 0 : volume;
        }
        if (auxAudioRef.current) {
          auxAudioRef.current.pause();
          auxAudioRef.current.volume = 0;
          auxAudioRef.current.src = '';
        }
      } else {
        // Intermediate step
        if (audioRef.current) {
          audioRef.current.volume = ratio * targetVolume;
        }
        if (auxAudioRef.current) {
          auxAudioRef.current.volume = (1 - ratio) * targetVolume;
        }
      }
    }, intervalStep);
  }, [volume, isMuted]);

  // Loading individual track play operations
  const handlePlayTrack = useCallback((index: number, forcePlay = true) => {
    if (index < 0 || index >= tracks.length || !audioRef.current) return;

    initWebAudio();
    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }

    // Capture old playing track details for crossfade if enabled and active
    const oldUrl = audioRef.current.src;
    const oldTime = audioRef.current.currentTime;
    const oldDuration = audioRef.current.duration;
    const shouldFade = isCrossfadeEnabled && isPlaying && oldUrl && oldUrl !== tracks[index].url && oldDuration > 0;

    setCurrentIndex(index);
    audioRef.current.src = tracks[index].url;
    audioRef.current.load();

    if (forcePlay) {
      audioRef.current.play()
        .then(() => {
          setIsPlaying(true);
          if (shouldFade) {
            startCrossFade(oldUrl, oldTime);
          } else {
            // Restore normal volume
            audioRef.current!.volume = isMuted ? 0 : volume;
          }
        })
        .catch(err => {
          console.warn("Playback autoplay prevented:", err);
          setIsPlaying(false);
          audioRef.current!.volume = isMuted ? 0 : volume;
        });
    } else {
      setIsPlaying(false);
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [tracks, isPlaying, isCrossfadeEnabled, volume, isMuted, startCrossFade]);

  // Skipping buttons
  const handleNext = useCallback(() => {
    if (tracks.length === 0) return;

    if (loopMode === 'one' && currentIndex !== -1) {
      // Manual skip forces progression anyway
      const nextIdx = (currentIndex + 1) % tracks.length;
      handlePlayTrack(nextIdx);
      return;
    }

    if (isShuffle && shuffledIndices.length > 0) {
      const pos = shuffledIndices.indexOf(currentIndex);
      const nextPos = pos + 1;
      if (nextPos >= shuffledIndices.length) {
        if (loopMode === 'all') {
          // Reshuffle and start over
          const newShuffle = generateShuffleQueue(tracks.length, -1);
          setShuffledIndices(newShuffle);
          handlePlayTrack(newShuffle[0]);
        } else {
          // Playback ends
          setIsPlaying(false);
        }
      } else {
        handlePlayTrack(shuffledIndices[nextPos]);
      }
      return;
    }

    const nextIndex = currentIndex + 1;
    if (nextIndex >= tracks.length) {
      if (loopMode === 'all') {
        handlePlayTrack(0);
      } else {
        setIsPlaying(false);
      }
    } else {
      handlePlayTrack(nextIndex);
    }
  }, [tracks, currentIndex, loopMode, isShuffle, shuffledIndices, handlePlayTrack, generateShuffleQueue]);

  const handlePrev = useCallback(() => {
    if (tracks.length === 0 || !audioRef.current) return;

    // Reset loop marker if track played past 3 seconds
    if (audioRef.current.currentTime > 3) {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
      return;
    }

    if (isShuffle && shuffledIndices.length > 0) {
      const pos = shuffledIndices.indexOf(currentIndex);
      const prevPos = pos - 1;
      if (prevPos < 0) {
        if (loopMode === 'all') {
          handlePlayTrack(shuffledIndices[shuffledIndices.length - 1]);
        } else {
          handlePlayTrack(shuffledIndices[0]);
        }
      } else {
        handlePlayTrack(shuffledIndices[prevPos]);
      }
      return;
    }

    const prevIndex = currentIndex - 1;
    if (prevIndex < 0) {
      if (loopMode === 'all') {
        handlePlayTrack(tracks.length - 1);
      } else {
        handlePlayTrack(0);
      }
    } else {
      handlePlayTrack(prevIndex);
    }
  }, [tracks, currentIndex, loopMode, isShuffle, shuffledIndices, handlePlayTrack]);

  // Pause toggle
  const handleTogglePlay = useCallback(() => {
    if (tracks.length === 0 || !audioRef.current) return;

    initWebAudio();
    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }

    if (currentIndex === -1) {
      handlePlayTrack(0);
      return;
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play()
        .then(() => setIsPlaying(true))
        .catch(err => console.warn(err));
    }
  }, [tracks, currentIndex, isPlaying, handlePlayTrack]);

  // Global keyboard listeners for playback control
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      if (activeEl) {
        const tagName = activeEl.tagName.toLowerCase();
        const contentEditable = activeEl.getAttribute('contenteditable');
        if (
          tagName === 'input' ||
          tagName === 'textarea' ||
          tagName === 'select' ||
          contentEditable === 'true' ||
          contentEditable === ''
        ) {
          // Allow default key behavior when focused on input fields
          return;
        }
      }

      if (e.code === 'Space') {
        e.preventDefault();
        handleTogglePlay();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleTogglePlay, handleNext, handlePrev]);

  // Playback timeline slider drags
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (tracks.length === 0 || !audioRef.current) return;
    const value = parseFloat(e.target.value);
    audioRef.current.currentTime = value;
    setCurrentTime(value);
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
      if (initialTimeRef.current > 0) {
        audioRef.current.currentTime = initialTimeRef.current;
        setCurrentTime(initialTimeRef.current);
        initialTimeRef.current = 0;
      }
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const cur = audioRef.current.currentTime;
      setCurrentTime(cur);
      if (isStateLoadedRef.current) {
        localStorage.setItem('soundflow_current_time', cur.toString());
      }

      // If crossfade is enabled, trigger handleNext 2 seconds before the current track finishes playing
      const dur = audioRef.current.duration;
      if (
        isCrossfadeEnabled &&
        dur > 0 &&
        dur - cur <= 2 &&
        isPlaying &&
        !isCrossFadingRef.current &&
        loopMode !== 'one' &&
        tracks.length > 1
      ) {
        handleNext();
      }
    }
  };

  // Continuous Playback logic onended
  const handleAudioEnded = () => {
    if (loopMode === 'one' && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play()
        .then(() => setIsPlaying(true));
    } else {
      handleNext();
    }
  };

  // File loading parse chain
  const processFiles = (fileList: FileList) => {
    const validFiles = Array.from(fileList).filter((file) => {
      const typeStr = file.type.toLowerCase();
      const nameStr = file.name.toLowerCase();
      return (
        typeStr.startsWith('audio/') ||
        nameStr.endsWith('.mp3') ||
        nameStr.endsWith('.wav') ||
        nameStr.endsWith('.ogg') ||
        nameStr.endsWith('.flac') ||
        nameStr.endsWith('.m4a') ||
        nameStr.endsWith('.acc')
      );
    });

    if (validFiles.length === 0) return;

    const newTracks: Track[] = validFiles.map((file) => ({
      id: Math.random().toString(36).substring(2, 9),
      name: file.name,
      size: getReadableSize(file.size),
      type: file.type,
      url: URL.createObjectURL(file),
      file: file,
      duration: 0,
    }));

    // Save each newly loaded track to IndexedDB
    newTracks.forEach((track) => {
      saveTrackBlob(track.id, track.file, track.name);
    });

    setTracks((prev) => {
      const updated = [...prev, ...newTracks];
      // Automatically load (but don't play) first file if list was empty
      if (prev.length === 0) {
        setTimeout(() => {
          setCurrentIndex(0);
          if (audioRef.current) {
            audioRef.current.src = newTracks[0].url;
            audioRef.current.load();
          }
        }, 50);
      }
      return updated;
    });
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(e.target.files);
    }
  };

  // Web window dropzone hooks
  const handleDragOverClass = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(true);
  };

  const handleDragLeaveClass = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
  };

  const handleDropClass = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    if (e.dataTransfer.files) {
      processFiles(e.dataTransfer.files);
    }
  };

  // Track deletion transitions
  const handleRemoveTrack = (index: number) => {
    const trackToRemove = tracks[index];
    URL.revokeObjectURL(trackToRemove.url);
    deleteTrackBlob(trackToRemove.id);

    const newTracks = tracks.filter((_, i) => i !== index);
    setTracks(newTracks);

    if (currentIndex === index) {
      if (newTracks.length > 0) {
        const nextIdx = index >= newTracks.length ? 0 : index;
        setCurrentIndex(nextIdx);
        setTimeout(() => {
          if (audioRef.current) {
            audioRef.current.src = newTracks[nextIdx].url;
            if (isPlaying) {
              audioRef.current.play()
                .then(() => setIsPlaying(true))
                .catch(() => setIsPlaying(false));
            } else {
              audioRef.current.load();
            }
          }
        }, 50);
      } else {
        setCurrentIndex(-1);
        setIsPlaying(false);
        setCurrentTime(0);
        setDuration(0);
        if (audioRef.current) audioRef.current.src = '';
      }
    } else if (currentIndex > index) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  // Draggable Sorting reorder events
  const handleReorderTracks = (startIndex: number, endIndex: number) => {
    const result = Array.from(tracks);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);

    setTracks(result);

    // Maintain accurate currentIndex focus
    if (currentIndex === startIndex) {
      setCurrentIndex(endIndex);
    } else if (currentIndex > startIndex && currentIndex <= endIndex) {
      setCurrentIndex(currentIndex - 1);
    } else if (currentIndex < startIndex && currentIndex >= endIndex) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleClearQueue = () => {
    tracks.forEach(track => URL.revokeObjectURL(track.url));
    clearAllTrackBlobs();
    setTracks([]);
    setCurrentIndex(-1);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    if (audioRef.current) {
      audioRef.current.src = '';
    }
    localStorage.removeItem('soundflow_current_time');
    localStorage.removeItem('soundflow_current_index');
  };

  // Toggle loops and play modes
  const cycleLoopMode = () => {
    setLoopMode(prev => {
      if (prev === 'none') return 'all';
      if (prev === 'all') return 'one';
      return 'none';
    });
  };

  // Standalone HTML Exporter Blob Downloader
  const handleDownloadStandalone = () => {
    const htmlCode = getStandaloneHTML();
    const blob = new Blob([htmlCode], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'SoundFlow_Offline_Player.html';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Active track information
  const currentTrack = useMemo(() => {
    return currentIndex >= 0 && currentIndex < tracks.length ? tracks[currentIndex] : null;
  }, [currentIndex, tracks]);

  return (
    <div
      onDragOver={handleDragOverClass}
      onDragLeave={handleDragLeaveClass}
      onDrop={handleDropClass}
      className="relative min-h-screen bg-[#050505] text-slate-350 flex flex-col items-center justify-center p-4 md:p-8 overflow-x-hidden font-sans"
    >
      {/* Dynamic colorful decorative blur backdrops */}
      <div className="absolute top-[-10%] left-[10%] w-[45vw] h-[45vw] bg-cyan-950/15 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[10%] w-[50vw] h-[50vw] bg-cyan-900/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Styled DND Overlay visual */}
       {isDraggingOver && (
        <div className="absolute inset-0 bg-[#050505]/80 backdrop-blur-md z-50 flex flex-col items-center justify-center pointer-events-none transition-all duration-300">
          <div className="p-8 rounded-full bg-cyan-500/10 border border-cyan-500/30 animate-pulse">
            <Upload className="w-16 h-16 text-cyan-400" />
          </div>
          <h2 className="text-xl font-semibold text-white mt-6">Drop your audio files here</h2>
          <p className="text-sm text-slate-400 mt-2">Add immediately to your sequential playlist queue</p>
        </div>
      )}

      {/* Hidden standard audio node */}
      <audio
        ref={audioRef}
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleAudioEnded}
      />

      {/* Auxiliary audio node for crossfading transitions */}
      <audio
        ref={auxAudioRef}
      />

      {/* Primary container */}
      <div className="relative w-full max-w-5xl bg-[#0a0a0a]/90 border border-white/5 rounded-3xl overflow-hidden shadow-2xl flex flex-col z-10">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-cyan-500/5 to-transparent pointer-events-none"></div>
        
        {/* Modern styled glassy Header */}
        <header className="flex flex-col sm:flex-row justify-between items-center px-6 md:px-8 py-5 border-b border-white/5 bg-black/25 gap-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/15 border border-cyan-500/20 text-cyan-400">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5v14M22 9v6M7 7v10M2 10v4"/></svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-md font-bold tracking-tight text-white">SoundFlow Desktop</h1>
                <span className="hidden sm:inline-block text-[10px] bg-cyan-500/15 text-cyan-400 font-mono tracking-wider uppercase px-2 py-0.5 rounded border border-cyan-500/25">Preview mode</span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">Desktop Offline music queue player</p>
            </div>
          </div>

          {/* Action Center */}
          <div className="flex items-center gap-3">
            {/* Keyboard Shortcuts Tooltip */}
            <div className="relative group/shortcuts">
              <button
                type="button"
                id="keyboard-shortcuts-btn"
                className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:border-cyan-500/40 hover:bg-cyan-600/10 text-slate-400 hover:text-cyan-400 transition-all duration-300 flex items-center justify-center cursor-pointer shadow-lg"
                aria-label="Keyboard Shortcuts"
              >
                <Keyboard className="w-4 h-4" />
              </button>

              {/* Tooltip box */}
              <div className="absolute right-0 top-full mt-2 w-60 p-4 rounded-xl bg-[#0a0a0a]/95 border border-white/10 shadow-2xl backdrop-blur-xl opacity-0 invisible group-hover/shortcuts:opacity-100 group-hover/shortcuts:visible transition-all duration-300 transform scale-95 origin-top-right group-hover/shortcuts:scale-100 z-50 pointer-events-none group-hover/shortcuts:pointer-events-auto">
                <div className="flex items-center gap-2 border-b border-white/5 pb-2 mb-2">
                  <Keyboard className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-semibold text-white tracking-wide uppercase">Shortcuts</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Play / Pause</span>
                    <kbd className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-cyan-400 font-mono text-[10px] font-bold shadow-sm">Space</kbd>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Next Track</span>
                    <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-cyan-400 font-mono text-[10px] font-bold shadow-sm">➔</kbd>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Previous Track</span>
                    <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-cyan-400 font-mono text-[10px] font-bold shadow-sm">←</kbd>
                  </div>
                </div>
                <div className="border-t border-white/5 pt-2 mt-2">
                  <p className="text-[10px] text-slate-500 font-mono text-right">Works globally on page</p>
                </div>
              </div>
            </div>

            {/* Export standalone tool */}
            <button
              onClick={handleDownloadStandalone}
              id="download-standalone-html-btn"
              className="group flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-white/5 border border-white/10 hover:border-cyan-500/40 hover:bg-cyan-600/10 text-slate-100 hover:text-white transition-all cursor-pointer shadow-lg hover:shadow-cyan-500/5 duration-300"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
              Get Standalone HTML
              <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-1.5 py-0.5 rounded">100% Offline</span>
            </button>
          </div>
        </header>

        {/* Dynamic Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 md:p-8">
          
          {/* Left Block: Playing Art & Display spectrum */}
          <div className="lg:col-span-7 flex flex-col justify-between gap-6">
            
            {/* Display Visualizer */}
            <div className="flex-1 flex flex-col justify-center">
              <AudioVisualizer analyser={analyserRef.current} isPlaying={isPlaying} />
            </div>

            {/* Playing track name details */}
            <div className="text-center md:text-left py-2">
              <h2 className="text-lg font-semibold text-white tracking-tight truncate max-w-full" id="cur-track-title">
                {currentTrack ? currentTrack.name : 'No track selected'}
              </h2>
              <p className="text-xs text-slate-400 mt-1" id="cur-track-size">
                {currentTrack ? `Format: ${currentTrack.type || 'audio/*'} • Size: ${currentTrack.size}` : 'Load local files on the right side to play'}
              </p>
            </div>

            {/* Play timeline seek bar */}
            <div className="space-y-2">
              <input
                type="range"
                min="0"
                max={duration || 100}
                value={currentTime}
                onChange={handleSeek}
                id="seek-slider"
                className="w-full h-1.5 bg-white/5 rounded-full appearance-none cursor-pointer accent-cyan-400 focus:outline-none focus:ring-0 [&::-webkit-slider-runnable-track]:bg-white/5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-[0_0_15px_rgba(34,211,238,0.8)]"
              />
              <div className="flex justify-between font-mono text-xs text-slate-500">
                <span id="time-curr">{formatTime(currentTime)}</span>
                <span id="time-dur">{formatTime(duration)}</span>
              </div>
            </div>

            {/* Glassmorphic Playback Control center */}
            <div className="glass p-4 rounded-2xl flex flex-col gap-4">
              <div className="flex items-center justify-center gap-5">
                
                {/* Shuffle Button */}
                <button
                  onClick={() => setIsShuffle(!isShuffle)}
                  id="ctrl-shuffle"
                  className={`p-2.5 rounded-full transition-all cursor-pointer ${isShuffle ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/25' : 'text-slate-400 hover:text-white'}`}
                  title={`Shuffle is ${isShuffle ? 'On' : 'Off'}`}
                >
                  <Shuffle className="w-4 h-4" />
                </button>

                {/* Back button */}
                <button
                  onClick={handlePrev}
                  disabled={tracks.length === 0}
                  id="ctrl-prev"
                  className="p-3 text-slate-300 hover:text-white hover:bg-white/5 active:scale-95 disabled:opacity-30 disabled:pointer-events-none rounded-full transition-all cursor-pointer"
                  title="Previous track"
                >
                  <SkipBack className="w-5 h-5 fill-current" />
                </button>

                {/* Main Play Pause toggle key */}
                <button
                  onClick={handleTogglePlay}
                  disabled={tracks.length === 0}
                  id="ctrl-play-pause"
                  className="flex items-center justify-center w-16 h-16 rounded-full bg-cyan-400 text-black shadow-[0_0_30px_rgba(34,211,238,0.35)] hover:scale-105 active:scale-95 disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer"
                  title="Play/Pause"
                >
                  {isPlaying ? (
                    <Pause className="w-6 h-6 fill-current text-black" />
                  ) : (
                    <Play className="w-6 h-6 fill-current text-black ml-0.5" />
                  )}
                </button>

                {/* Skip Next track */}
                <button
                  onClick={handleNext}
                  disabled={tracks.length === 0}
                  id="ctrl-next"
                  className="p-3 text-slate-300 hover:text-white hover:bg-white/5 active:scale-95 disabled:opacity-30 disabled:pointer-events-none rounded-full transition-all cursor-pointer"
                  title="Next track"
                >
                  <SkipForward className="w-5 h-5 fill-current" />
                </button>

                {/* Loop trigger */}
                <button
                  onClick={cycleLoopMode}
                  id="ctrl-loop"
                  className={`p-2.5 rounded-full transition-all cursor-pointer ${
                    loopMode !== 'none'
                      ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/25'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title={`Repeat mode: ${loopMode}`}
                >
                  <Repeat className="w-4 h-4" />
                  {loopMode === 'one' && (
                    <span className="absolute text-[8px] font-bold text-cyan-400 top-[-2px] right-[-2px] bg-slate-1000 border border-cyan-500/15 rounded-full px-1">1</span>
                  )}
                </button>
              </div>

              {/* Volume Controller sliders */}
              <div className="flex items-center gap-3 px-2 border-t border-white/5 pt-3">
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  id="volume-mute-btn"
                  className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                  title={isMuted ? "Unmute" : "Mute"}
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="w-4 h-4 text-rose-400" />
                  ) : volume < 0.4 ? (
                    <Volume1 className="w-4 h-4" />
                  ) : (
                    <Volume2 className="w-4 h-4 text-cyan-400" />
                  )}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  onChange={(e) => {
                    setVolume(parseFloat(e.target.value));
                    setIsMuted(false);
                  }}
                  id="volume-slider"
                  className="flex-1 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 focus:outline-none [&::-webkit-slider-runnable-track]:bg-slate-800 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyan-400"
                />
              </div>

            </div>

          </div>

          {/* Right Block: Load files and Queue lists */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            
            {/* Playlist component rendering */}
            <div className="flex-1">
              <TrackList
                tracks={tracks}
                currentIndex={currentIndex}
                isPlaying={isPlaying}
                onSelectTrack={(idx) => handlePlayTrack(idx, true)}
                onRemoveTrack={handleRemoveTrack}
                onReorderTracks={handleReorderTracks}
                onClearQueue={handleClearQueue}
              />
            </div>

            {/* Dnd styled boxed local uploader zone */}
            <div className="p-5 glass rounded-2xl flex flex-col items-center justify-center text-center gap-3">
              <div className="p-3 bg-cyan-500/10 rounded-xl text-cyan-400 border border-cyan-500/20">
                <FolderOpen className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white">Add Music Folder or Tracks</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Drag-and-drop works anywhere on window</p>
              </div>
              <label className="text-xs text-white font-medium glass-btn px-4 py-2 rounded-xl cursor-pointer transition-all">
                Browse Files
                <input
                  type="file"
                  multiple
                  accept="audio/*"
                  onChange={handleFileInputChange}
                  className="hidden"
                />
              </label>
            </div>

            {/* Playlist Settings Control Panel */}
            <div className="p-5 bg-slate-900/30 border border-white/5 backdrop-blur-md rounded-2xl flex flex-col gap-4">
              <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
                <h3 className="text-xs font-semibold tracking-wide text-white uppercase font-mono">Audio Settings</h3>
              </div>

              {/* Crossfade Transitions toggle */}
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-[11px] font-medium text-slate-300">Crossfade (2s) Transitions</span>
                  <span className="text-[9px] text-slate-500">Blends tracks smoothly when switching</span>
                </div>
                <button
                  type="button"
                  id="toggle-crossfade-btn"
                  onClick={() => setIsCrossfadeEnabled(!isCrossfadeEnabled)}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${isCrossfadeEnabled ? 'bg-cyan-500' : 'bg-slate-800'}`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isCrossfadeEnabled ? 'translate-x-4' : 'translate-x-0'}`}
                  />
                </button>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* Humble literal footer details */}
      <footer className="mt-8 text-center" id="app-footer">
        <p className="text-[11px] font-mono tracking-wider uppercase text-slate-600">SoundFlow Open-Engine Music Queue v1.1</p>
      </footer>
    </div>
  );
}
