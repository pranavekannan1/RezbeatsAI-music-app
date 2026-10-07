import React, { useState, useEffect } from 'react';
import { Track, UserPlaylist } from '../types';
import {
  getLikedTracks,
  getRecentlyPlayed,
  getUserPlaylists,
  createPlaylist,
  deletePlaylist,
  saveLikedTrack,
  getOnRepeatTracks,
} from '../services/musicService';
import { RECENTLY_ADDED_COLLECTION } from '../data/musicData';

interface LibraryScreenProps {
  onPlayTrack: (track: Track, queue?: Track[]) => void;
  currentTrackId?: string;
  isPlaying?: boolean;
}

export const LibraryScreen: React.FC<LibraryScreenProps> = ({
  onPlayTrack,
  currentTrackId,
  isPlaying,
}) => {
  const [activeFilter, setActiveFilter] = useState<'liked' | 'repeat' | 'playlists' | 'recent'>('liked');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [likedList, setLikedList] = useState<Track[]>([]);
  const [recentList, setRecentList] = useState<Track[]>([]);
  const [onRepeatList, setOnRepeatList] = useState<{ track: Track; playCount: number }[]>([]);
  const [userPlaylists, setUserPlaylists] = useState<UserPlaylist[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPlaylistTitle, setNewPlaylistTitle] = useState('');
  const [newPlaylistDesc, setNewPlaylistDesc] = useState('');

  useEffect(() => {
    refreshLibrary();
  }, []);

  const refreshLibrary = () => {
    setLikedList(getLikedTracks());
    const recents = getRecentlyPlayed();
    setRecentList(recents.length > 0 ? recents : RECENTLY_ADDED_COLLECTION);
    setOnRepeatList(getOnRepeatTracks());
    setUserPlaylists(getUserPlaylists());
  };

  const handleCreatePlaylist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistTitle.trim()) return;
    createPlaylist(newPlaylistTitle, newPlaylistDesc);
    setNewPlaylistTitle('');
    setNewPlaylistDesc('');
    setShowCreateModal(false);
    refreshLibrary();
    setToastMessage('New playlist created!');
    setTimeout(() => setToastMessage(null), 2000);
  };

  const handleDeletePlaylist = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    deletePlaylist(id);
    refreshLibrary();
    setToastMessage('Playlist deleted');
    setTimeout(() => setToastMessage(null), 2000);
  };

  const handleToggleLike = (e: React.MouseEvent, track: Track) => {
    e.stopPropagation();
    saveLikedTrack(track);
    refreshLibrary();
  };

  return (
    <div className="flex flex-col w-full space-y-6 pb-36 pt-2 select-none">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-[#7928ca] text-white text-xs font-semibold shadow-2xl border border-[#dbb8ff]/30 backdrop-blur-md animate-fade-in pointer-events-none">
          {toastMessage}
        </div>
      )}

      {/* Header & New Playlist Button */}
      <section className="flex items-start justify-between gap-2 pt-1">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#e3e2e8] tracking-tight font-display">
            Your Library
          </h1>
          <p className="text-xs text-[#cec2d6]">
            Free offline saves, heavy rotation, liked songs & playlists
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="h-9 px-3.5 rounded-full bg-[#dbb8ff] text-[#2b0052] font-bold text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
        >
          <span className="material-symbols-outlined text-base">add</span>
          <span>New Playlist</span>
        </button>
      </section>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 -mx-4 px-4">
        <button
          onClick={() => setActiveFilter('liked')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
            activeFilter === 'liked'
              ? 'bg-rose-500 text-white shadow-md'
              : 'bg-[#1e1f24] text-[#cec2d6] hover:text-white'
          }`}
        >
          <span className="material-symbols-outlined text-sm">favorite</span>
          <span>Liked Songs ({likedList.length})</span>
        </button>

        <button
          onClick={() => setActiveFilter('repeat')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
            activeFilter === 'repeat'
              ? 'bg-gradient-to-r from-[#7928ca] to-[#dbb8ff] text-white font-bold shadow-md'
              : 'bg-[#1e1f24] text-[#cec2d6] hover:text-white'
          }`}
        >
          <span className="material-symbols-outlined text-sm">repeat</span>
          <span>On Repeat ({onRepeatList.length})</span>
        </button>

        <button
          onClick={() => setActiveFilter('playlists')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
            activeFilter === 'playlists'
              ? 'bg-[#dbb8ff] text-[#2b0052] font-bold shadow-md'
              : 'bg-[#1e1f24] text-[#cec2d6] hover:text-white'
          }`}
        >
          <span className="material-symbols-outlined text-sm">queue_music</span>
          <span>Playlists ({userPlaylists.length})</span>
        </button>

        <button
          onClick={() => setActiveFilter('recent')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
            activeFilter === 'recent'
              ? 'bg-[#508eff] text-white shadow-md'
              : 'bg-[#1e1f24] text-[#cec2d6] hover:text-white'
          }`}
        >
          <span className="material-symbols-outlined text-sm">history</span>
          <span>Recently Played ({recentList.length})</span>
        </button>
      </div>

      {/* 1. LIKED SONGS VIEW */}
      {activeFilter === 'liked' && (
        <section className="flex flex-col space-y-3">
          {likedList.length === 0 ? (
            <div className="bg-[#191a20] rounded-2xl p-8 text-center border border-white/[0.04]">
              <div className="w-14 h-14 rounded-full bg-rose-500/10 text-rose-400 mx-auto flex items-center justify-center mb-3">
                <span className="material-symbols-outlined text-3xl">favorite</span>
              </div>
              <h3 className="text-sm font-bold text-white">No Liked Songs Yet</h3>
              <p className="text-xs text-[#cec2d6]/70 mt-1 max-w-xs mx-auto">
                Tap the heart icon on any song to save it here.
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#cec2d6] uppercase tracking-wider">
                  {likedList.length} Saved Tracks
                </span>
                <button
                  onClick={() => onPlayTrack(likedList[0], likedList)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#1db954] text-[#003b14] font-bold text-xs shadow-sm hover:bg-[#1ed760] transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">play_arrow</span>
                  <span>Play All</span>
                </button>
              </div>

              <div className="flex flex-col space-y-2">
                {likedList.map((track, idx) => {
                  const isCurrent = currentTrackId === track.id && isPlaying;
                  return (
                    <div
                      key={`${track.id}-${idx}`}
                      onClick={() => onPlayTrack(track, likedList)}
                      className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all border ${
                        isCurrent
                          ? 'bg-[#7928ca]/25 border-[#dbb8ff]/40 shadow-sm'
                          : 'bg-[#1a1b20] border-white/[0.04] hover:bg-[#23242c]'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <img
                          src={track.coverUrl}
                          alt={track.title}
                          className="w-11 h-11 rounded-lg object-cover flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs sm:text-sm font-semibold text-white truncate">
                            {track.title}
                          </h4>
                          <p className="text-[11px] text-[#cec2d6]/70 truncate">
                            {track.artist}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-xs font-mono text-[#cec2d6]/60">
                          {track.duration}
                        </span>
                        <button
                          onClick={(e) => handleToggleLike(e, track)}
                          className="p-1.5 text-rose-500 hover:scale-110 transition-transform"
                        >
                          <span className="material-symbols-outlined text-base">favorite</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </section>
      )}

      {/* 2. ON REPEAT HEAVY ROTATION VIEW */}
      {activeFilter === 'repeat' && (
        <section className="flex flex-col space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#cec2d6] uppercase tracking-wider">
              {onRepeatList.length} Tracks in Heavy Rotation
            </span>
            {onRepeatList.length > 0 && (
              <button
                onClick={() => onPlayTrack(onRepeatList[0].track, onRepeatList.map((r) => r.track))}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#1db954] text-[#003b14] font-bold text-xs shadow-sm hover:bg-[#1ed760] transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">play_arrow</span>
                <span>Play Heavy Rotation</span>
              </button>
            )}
          </div>

          <div className="flex flex-col space-y-2">
            {onRepeatList.map(({ track, playCount }, idx) => {
              const isCurrent = currentTrackId === track.id && isPlaying;
              return (
                <div
                  key={`${track.id}-${idx}`}
                  onClick={() => onPlayTrack(track, onRepeatList.map((r) => r.track))}
                  className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all border ${
                    isCurrent
                      ? 'bg-[#7928ca]/25 border-[#dbb8ff]/40 shadow-sm'
                      : 'bg-[#1a1b20] border-white/[0.04] hover:bg-[#23242c]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className="text-xs font-mono font-bold text-[#dbb8ff] w-4">
                      #{idx + 1}
                    </span>
                    <img
                      src={track.coverUrl}
                      alt={track.title}
                      className="w-11 h-11 rounded-lg object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs sm:text-sm font-semibold text-white truncate">
                        {track.title}
                      </h4>
                      <p className="text-[11px] text-[#cec2d6]/70 truncate">
                        {track.artist}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#7928ca]/30 text-[#dbb8ff]">
                      {playCount} plays
                    </span>
                    <span className="text-xs font-mono text-[#cec2d6]/60">
                      {track.duration}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 3. PLAYLISTS VIEW */}
      {activeFilter === 'playlists' && (
        <section className="flex flex-col space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {userPlaylists.map((pl) => (
              <div
                key={pl.id}
                onClick={() => {
                  if (pl.tracks.length > 0) {
                    onPlayTrack(pl.tracks[0], pl.tracks);
                  }
                }}
                className="p-3.5 rounded-2xl bg-[#1a1b20] border border-white/[0.06] hover:bg-[#23242c] transition-all cursor-pointer flex items-center justify-between gap-3 group"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#7928ca] to-[#dbb8ff] flex items-center justify-center text-white flex-shrink-0 shadow-md">
                    <span className="material-symbols-outlined text-2xl">queue_music</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-bold text-white truncate group-hover:text-[#dbb8ff] transition-colors">
                      {pl.title}
                    </h3>
                    <p className="text-[11px] text-[#cec2d6]/70 truncate">{pl.description || `${pl.tracks.length} tracks`}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-[#cec2d6]/60">
                    {pl.tracks.length}
                  </span>
                  <button
                    onClick={(e) => handleDeletePlaylist(e, pl.id)}
                    className="p-1.5 text-[#cec2d6]/40 hover:text-rose-400 transition-colors"
                  >
                    <span className="material-symbols-outlined text-base">delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 4. RECENTLY PLAYED VIEW */}
      {activeFilter === 'recent' && (
        <section className="flex flex-col space-y-2">
          {recentList.map((track, idx) => {
            const isCurrent = currentTrackId === track.id && isPlaying;
            return (
              <div
                key={`${track.id}-${idx}`}
                onClick={() => onPlayTrack(track, recentList)}
                className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all border ${
                  isCurrent
                    ? 'bg-[#7928ca]/25 border-[#dbb8ff]/40 shadow-sm'
                    : 'bg-[#1a1b20] border-white/[0.04] hover:bg-[#23242c]'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <img
                    src={track.coverUrl}
                    alt={track.title}
                    className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-semibold text-white truncate">
                      {track.title}
                    </h4>
                    <p className="text-[11px] text-[#cec2d6]/70 truncate">
                      {track.artist}
                    </p>
                  </div>
                </div>

                <span className="text-xs font-mono text-[#cec2d6]/60 pr-2">
                  {track.duration}
                </span>
              </div>
            );
          })}
        </section>
      )}

      {/* Create Playlist Modal Dialog */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleCreatePlaylist}
            className="bg-[#1a1b20] border border-white/[0.08] rounded-2xl p-5 max-w-sm w-full space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Create New Playlist</h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-[#cec2d6] hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-[#cec2d6] block mb-1">Playlist Name</label>
                <input
                  type="text"
                  required
                  value={newPlaylistTitle}
                  onChange={(e) => setNewPlaylistTitle(e.target.value)}
                  placeholder="e.g. Hindi Romantic, Carnatic Morning"
                  className="w-full bg-[#24252c] text-white text-xs p-3 rounded-xl border border-white/[0.08] focus:outline-none focus:border-[#dbb8ff]"
                />
              </div>

              <div>
                <label className="text-xs text-[#cec2d6] block mb-1">Description (Optional)</label>
                <input
                  type="text"
                  value={newPlaylistDesc}
                  onChange={(e) => setNewPlaylistDesc(e.target.value)}
                  placeholder="e.g. My favorite Indian tracks"
                  className="w-full bg-[#24252c] text-white text-xs p-3 rounded-xl border border-white/[0.08] focus:outline-none focus:border-[#dbb8ff]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 rounded-xl text-xs text-[#cec2d6] hover:bg-white/[0.05]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-[#dbb8ff] text-[#2b0052] font-bold text-xs hover:bg-[#efdbff]"
              >
                Create
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
