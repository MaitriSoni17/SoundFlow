import React, { DragEvent, useState } from 'react';
import { Track } from '../types';
import { Trash2, Play, Pause, ChevronUp, ChevronDown, ListMusic, Music, Search, X } from 'lucide-react';

interface TrackListProps {
  tracks: Track[];
  currentIndex: number;
  isPlaying: boolean;
  onSelectTrack: (index: number) => void;
  onRemoveTrack: (index: number) => void;
  onReorderTracks: (startIndex: number, endIndex: number) => void;
  onClearQueue: () => void;
}

export default function TrackList({
  tracks,
  currentIndex,
  isPlaying,
  onSelectTrack,
  onRemoveTrack,
  onReorderTracks,
  onClearQueue,
}: TrackListProps) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const handleDragStart = (e: DragEvent<HTMLDivElement>, index: number) => {
    // Disable drag and drop when search is active
    if (searchQuery.trim() !== '') return;
    setDragIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    // Transparent image dynamic drag helper support
    const dragImg = document.createElement('div');
    dragImg.style.display = 'none';
    document.body.appendChild(dragImg);
    e.dataTransfer.setDragImage(dragImg, 0, 0);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault();
    if (searchQuery.trim() !== '') return;
    if (dragIndex === null || dragIndex === index) return;
    setOverIndex(index);
  };

  const handleDragEnd = () => {
    if (dragIndex !== null && overIndex !== null && dragIndex !== overIndex) {
      onReorderTracks(dragIndex, overIndex);
    }
    setDragIndex(null);
    setOverIndex(null);
  };

  const handleMoveUp = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (index > 0) {
      onReorderTracks(index, index - 1);
    }
  };

  const handleMoveDown = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (index < tracks.length - 1) {
      onReorderTracks(index, index + 1);
    }
  };

  // Map and filter tracks with their original indices
  const filteredWithIndex = tracks
    .map((track, idx) => ({ track, originalIndex: idx }))
    .filter(({ track }) => 
      track.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const isSearching = searchQuery.trim() !== '';

  return (
    <div className="flex flex-col h-full bg-slate-900/40 backdrop-blur-md rounded-2xl border border-white/10 p-5 shadow-xl">
      {/* Header section */}
      <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <ListMusic className="w-5 h-5 text-cyan-400" id="list-music-icon" />
          <h2 className="text-sm font-semibold tracking-wide text-white uppercase" id="play-queue-hdr">Play Queue</h2>
          <span className="text-xs font-mono font-medium text-slate-400 bg-slate-850 px-2 py-0.5 rounded-md border border-white/5 animate-fade-in">
            {isSearching ? `${filteredWithIndex.length}/` : ''}{tracks.length} {tracks.length === 1 ? 'track' : 'tracks'}
          </span>
        </div>
        {tracks.length > 0 && (
          <button
            onClick={onClearQueue}
            id="clear-queue-btn"
            className="flex items-center gap-1 text-xs text-rose-400 hover:text-rose-300 font-medium px-2 py-1 rounded-md transition-all hover:bg-rose-500/10 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear Queue
          </button>
        )}
      </div>

      {/* Search Input Box */}
      {tracks.length > 0 && (
        <div className="relative mb-4">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-500" />
          </div>
          <input
            type="text"
            id="track-search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search songs in queue..."
            className="w-full pl-9 pr-9 py-2 bg-slate-950/40 hover:bg-slate-350/5 focus:bg-slate-950/80 border border-white/5 focus:border-cyan-500/50 rounded-xl text-xs text-white placeholder-slate-500 outline-none transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              id="clear-track-search-btn"
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-white transition-colors cursor-pointer"
              title="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      )}

      {/* Track listing */}
      <div className="flex-1 overflow-y-auto max-h-[340px] pr-1 space-y-2">
        {tracks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center text-slate-400/90 border border-dashed border-white/10 rounded-xl bg-slate-950/20" id="empty-queue-visual">
            <Music className="w-10 h-10 text-slate-600/70 mb-3" />
            <p className="text-sm font-medium">Your queue is empty</p>
            <p className="text-xs text-slate-500 mt-1">Drag and drop audio files anywhere or select below</p>
          </div>
        ) : isSearching && filteredWithIndex.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center text-slate-400/90 border border-dashed border-white/10 rounded-xl bg-slate-950/20">
            <Search className="w-8 h-8 text-slate-600/70 mb-3" />
            <p className="text-sm font-medium">No matches found</p>
            <p className="text-xs text-slate-500 mt-1">Try standardizing your query spelling</p>
            <button
              onClick={() => setSearchQuery('')}
              className="mt-3 px-3 py-1.5 text-xs font-medium text-cyan-400 border border-cyan-500/20 bg-cyan-500/5 rounded-lg hover:bg-cyan-500/15 hover:border-cyan-500/30 transition-all cursor-pointer"
            >
              Clear Search Filter
            </button>
          </div>
        ) : (
          filteredWithIndex.map(({ track, originalIndex }, index) => {
            const isActive = originalIndex === currentIndex;
            const isDragging = dragIndex === originalIndex;
            const isOver = overIndex === originalIndex;

            return (
              <div
                key={track.id}
                draggable={!isSearching}
                onDragStart={(e) => handleDragStart(e, originalIndex)}
                onDragOver={(e) => handleDragOver(e, originalIndex)}
                onDragEnd={handleDragEnd}
                onDoubleClick={() => onSelectTrack(originalIndex)}
                id={`track-item-${originalIndex}`}
                className={`group flex items-center justify-between gap-3 px-4 py-3 rounded-xl border transition-all text-sm select-none cursor-pointer
                  ${isActive 
                    ? 'bg-cyan-500/10 border-l-[3px] border-l-cyan-400 border-t-white/5 border-b-white/5 border-r-white/5 rounded-r-xl rounded-l-none pl-3.5 text-white' 
                    : 'bg-slate-950/20 hover:bg-white/5 border-white/5 hover:border-white/10'}
                  ${isDragging ? 'opacity-40 scale-95 border-cyan-400 border-dashed' : ''}
                  ${isOver ? 'border-t-2 border-t-cyan-400 bg-slate-800/40' : ''}
                `}
              >
                <div className="flex items-center gap-3 overflow-hidden flex-1">
                  {/* Numbering or Eq columns animation */}
                  <div className="flex items-center justify-center w-5 text-slate-500 font-mono text-xs">
                    {isActive && isPlaying ? (
                      <div className="flex items-end gap-0.5 h-3">
                        <div className="w-0.5 bg-cyan-400 animate-[bounce_1s_infinite_100ms] h-full rounded-sm" />
                        <div className="w-0.5 bg-cyan-400 animate-[bounce_1.3s_infinite_400ms] h-full rounded-sm" />
                        <div className="w-0.5 bg-cyan-400 animate-[bounce_0.8s_infinite_200ms] h-full rounded-sm" />
                      </div>
                    ) : (
                      <span>{originalIndex + 1}</span>
                    )}
                  </div>

                  <div className="flex flex-col min-w-0 pr-2">
                    <span className={`truncate font-medium ${isActive ? 'text-white' : 'text-slate-300 group-hover:text-white'}`}>
                      {track.name}
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono mt-0.5">
                      {track.size}
                    </span>
                  </div>
                </div>

                {/* Controls and metadata on right side */}
                <div className="flex items-center gap-2">
                  {/* Quick Reordering Arrows - Only show when NOT searching */}
                  {!isSearching && (
                    <div className="flex flex-col opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => handleMoveUp(originalIndex, e)}
                        disabled={originalIndex === 0}
                        id={`mv-up-${originalIndex}`}
                        className="p-0.5 text-slate-500 hover:text-white disabled:pointer-events-none disabled:opacity-20 cursor-pointer"
                        title="Move up"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => handleMoveDown(originalIndex, e)}
                        disabled={originalIndex === tracks.length - 1}
                        id={`mv-dn-${originalIndex}`}
                        className="p-0.5 text-slate-500 hover:text-white disabled:pointer-events-none disabled:opacity-20 cursor-pointer"
                        title="Move down"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {/* Play buttons */}
                  {!isActive ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectTrack(originalIndex);
                      }}
                      id={`play-btn-${originalIndex}`}
                      className="opacity-0 group-hover:opacity-100 flex items-center justify-center p-2 rounded-full hover:bg-white/10 text-slate-300 hover:text-white transition-all cursor-pointer"
                      title="Launch track"
                    >
                      <Play className="w-4 h-4 fill-current" />
                    </button>
                  ) : (
                    <div className="flex items-center justify-center p-2 rounded-full bg-cyan-500/20 text-cyan-400">
                      {isPlaying ? (
                        <Pause className="w-4 h-4 fill-current" />
                      ) : (
                        <Play className="w-4 h-4 fill-current" />
                      )}
                    </div>
                  )}

                  {/* Remove Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveTrack(originalIndex);
                    }}
                    id={`remove-btn-${originalIndex}`}
                    className="flex items-center justify-center p-2 rounded-full hover:bg-rose-500/10 text-slate-500 hover:text-rose-400 transition-all cursor-pointer"
                    title="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
