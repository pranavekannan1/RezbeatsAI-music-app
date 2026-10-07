import React, { useState, useEffect } from 'react';
import {
  Track,
  GroupedSearchResults,
} from '../types';
import { HIDDEN_GEMS, DISCOVER_TRENDING } from '../data/musicData';
import {
  searchWorldwideGrouped,
  saveLikedTrack,
  getLiveSearchSuggestions,
  SearchSuggestionItem,
  apiFetch,
  getAuthUser,
} from '../services/musicService';
import { saveAccountSearchHistory, loadAccountSearchHistory } from '../services/firebase';

interface DiscoverScreenProps {
  onPlayTrack: (track: Track, queue?: Track[]) => void;
  currentTrackId?: string;
  isPlaying?: boolean;
  onAddToQueue?: (track: Track) => void;
  onPlayNext?: (track: Track) => void;
}

type SearchCategoryTab = 'all' | 'movies' | 'artists' | 'playlists' | 'songs';

export const DiscoverScreen: React.FC<DiscoverScreenProps> = ({
  onPlayTrack,
  currentTrackId,
  isPlaying,
  onAddToQueue,
  onPlayNext,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchSuggestionItem[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearchingSuggestions, setIsSearchingSuggestions] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('rezbeatsai_search_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [showSearchHistory, setShowSearchHistory] = useState<boolean>(false);

  const addRecentSearch = (q: string) => {
    if (!q || !q.trim()) return;
    const trimmed = q.trim();
    setRecentSearches(prev => {
      const updated = [trimmed, ...prev.filter(item => item.toLowerCase() !== trimmed.toLowerCase())].slice(0, 5);
      try {
        localStorage.setItem('rezbeatsai_search_history', JSON.stringify(updated));
        const authUser = getAuthUser();
        if (authUser && authUser.id && authUser.id !== 'guest') {
          saveAccountSearchHistory(authUser.id, updated);
        }
      } catch {}
      return updated;
    });
  };

  useEffect(() => {
    try {
      const authUser = getAuthUser();
      if (authUser && authUser.id && authUser.id !== 'guest') {
        loadAccountSearchHistory(authUser.id).then((cloudHistory) => {
          if (cloudHistory && cloudHistory.length > 0) {
            const capped = cloudHistory.slice(0, 5);
            setRecentSearches(capped);
            try {
              localStorage.setItem('rezbeatsai_search_history', JSON.stringify(capped));
            } catch {}
          }
        });
      }
    } catch {}
  }, []);

  const [activeCategoryTab, setActiveCategoryTab] = useState<SearchCategoryTab>('all');
  const [expandedMovieId, setExpandedMovieId] = useState<string | null>(null);
  const [expandedArtistId, setExpandedArtistId] = useState<string | null>(null);
  const [expandedPlaylistId, setExpandedPlaylistId] = useState<string | null>(null);
  const [playlistLoadingId, setPlaylistLoadingId] = useState<string | null>(null);

  const handlePlaylistClick = async (playlist: any) => {
    if (expandedPlaylistId === playlist.id) {
      setExpandedPlaylistId(null);
      return;
    }
    setExpandedPlaylistId(playlist.id);

    if (playlist.songs && playlist.songs.length > 0) {
      return;
    }

    setPlaylistLoadingId(playlist.id);
    try {
      const res = await apiFetch(`/api/music/playlist?id=${encodeURIComponent(playlist.id)}&title=${encodeURIComponent(playlist.title)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.songs && data.songs.length > 0) {
          setGroupedResults(prev => {
            if (!prev) return null;
            return {
              ...prev,
              playlists: prev.playlists.map(p =>
                p.id === playlist.id ? { ...p, songs: data.songs, trackCount: data.songs.length } : p
              )
            };
          });
        }
      }
    } catch (err) {
      console.error('Failed to load playlist songs:', err);
    } finally {
      setPlaylistLoadingId(null);
    }
  };

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [groupedResults, setGroupedResults] = useState<GroupedSearchResults | null>(null);
  const [isLoadingResults, setIsLoadingResults] = useState(false);
  const [openMenuTrackId, setOpenMenuTrackId] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleSongMenuAction = (e: React.MouseEvent, action: 'playNext' | 'addToQueue' | 'like', trk: Track) => {
    e.stopPropagation();
    setOpenMenuTrackId(null);
    if (action === 'playNext') {
      onPlayNext?.(trk);
      showToast(`"${trk.title}" will play next`);
    } else if (action === 'addToQueue') {
      onAddToQueue?.(trk);
      showToast(`"${trk.title}" added to queue`);
    } else if (action === 'like') {
      saveLikedTrack(trk);
      showToast(`Saved "${trk.title}" to liked songs`);
    }
  };

  // Dismiss context menus on outside click
  React.useEffect(() => {
    if (!openMenuTrackId) return;
    const handleOutside = () => setOpenMenuTrackId(null);
    document.addEventListener('click', handleOutside, { capture: true });
    return () => document.removeEventListener('click', handleOutside, { capture: true });
  }, [openMenuTrackId]);



  const popularSearches = [
    'Mirzapur The Movie',
    'Toxic',
    'Awarapan 2',
    'Haiwaan',
    'Vibe 2026',
    'Stree 2',
    'Pushpa 2',
    'Aavesham Illuminati',
    'Vettaiyan Manasilaayo',
    'Devara Chuttamalle',
    'Kalki 2898 AD',
    'Arijit Singh Latest',
    'Anirudh Ravichander Hits',
    'Sushin Shyam Hits',
    'Shreya Ghoshal Hits',
  ];

  const moodCards = [
    {
      id: 'calm',
      title: 'Calm & Peace',
      bpm: '48-64 BPM',
      desc: 'Ethereal sitar, piano & flute',
      gradient: 'from-[#2b0052] to-[#7928ca]/60',
      tag: 'Peace',
      searchKey: 'Calm Acoustic Chillout Sitar',
    },
    {
      id: 'late-night',
      title: 'Late Night Lofi',
      bpm: 'Nocturnal',
      desc: 'Sub-bass, slow tape & ambient',
      gradient: 'from-[#002e6b] to-[#508eff]/50',
      tag: 'Nocturnal',
      searchKey: 'Late Night Hindi Lofi Chill',
    },
    {
      id: 'energy',
      title: 'High Energy',
      bpm: '124 + BPM',
      desc: 'Upbeat rhythms, dhol & electro',
      gradient: 'from-[#65002f] to-[#b00056]/60',
      tag: '124+ BPM',
      searchKey: 'High Energy Dance Hits',
    },
    {
      id: 'focus',
      title: 'Deep Focus',
      bpm: 'Binaural',
      desc: 'Bansuri flute, temple sanctuary',
      gradient: 'from-[#1a1b20] to-[#343439]',
      tag: 'Focus',
      searchKey: 'Deep Focus Bansuri Flute',
    },
  ];

  // Handle live typeahead suggestions on keystroke
  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setSearchQuery(q);

    if (q.trim().length >= 1) {
      setShowSuggestions(true);
      setIsSearchingSuggestions(true);
      try {
        const res = await getLiveSearchSuggestions(q);
        setSuggestions(res);
      } finally {
        setIsSearchingSuggestions(false);
      }
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // Execute full grouped search (movies, artists, playlists, songs all together)
  const executeSearch = async (queryText: string) => {
    const q = queryText.trim();
    if (!q) return;

    addRecentSearch(q);
    setShowSuggestions(false);
    setShowSearchHistory(false);
    setIsLoadingResults(true);
    setToastMessage(`Searching for "${q}" across movies, artists & songs...`);



    try {
      const results = await searchWorldwideGrouped(q);
      setGroupedResults(results);
      if (results.movies && results.movies.length > 0) {
        setExpandedMovieId(results.movies[0].id);
      }
      if (results.artists && results.artists.length > 0) {
        setExpandedArtistId(results.artists[0].id);
      }
      const totalFound =
        (results.songs?.length || 0) +
        (results.movies?.length || 0) +
        (results.artists?.length || 0) +
        (results.playlists?.length || 0);

      if (totalFound === 0) {
        setToastMessage(`No exact matches for "${q}". Showing recommendations.`);
      }
    } catch {
      // Fallback
    } finally {
      setIsLoadingResults(false);
      setTimeout(() => setToastMessage(null), 2000);
    }
  };

  const handleSelectSuggestion = (item: SearchSuggestionItem) => {
    const term = `${item.title} ${item.artist || ''}`.trim();
    setSearchQuery(item.title);
    executeSearch(term);
  };

  const handleMoodClick = async (m: (typeof moodCards)[0]) => {
    executeSearch(m.searchKey);
  };

  const hasResults =
    groupedResults &&
    ((groupedResults.songs && groupedResults.songs.length > 0) ||
      (groupedResults.movies && groupedResults.movies.length > 0) ||
      (groupedResults.artists && groupedResults.artists.length > 0) ||
      (groupedResults.playlists && groupedResults.playlists.length > 0));

  return (
    <div className="flex flex-col w-full space-y-6 pb-36 pt-2">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-[#343439]/95 backdrop-blur-xl text-[#e3e2e8] shadow-2xl flex items-center gap-2 border border-[#dbb8ff]/30 text-xs font-medium animate-fade-in pointer-events-none">
          <span className="material-symbols-outlined text-[#dbb8ff] text-base">info</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <section className="flex flex-col space-y-1">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#e3e2e8] tracking-tight font-display">
            Discover
          </h1>
          <span className="text-[11px] px-3 py-1 rounded-full bg-[#7928ca]/20 text-[#dbb8ff] font-semibold border border-[#dbb8ff]/30 flex items-center gap-1">
            <span className="material-symbols-outlined text-xs">auto_awesome</span>
            <span>Worldwide Catalog</span>
          </span>
        </div>
        <p className="text-xs sm:text-sm text-[#cec2d6]/80">
          Search movie soundtracks, artists, playlists, and songs together with high-fidelity streams
        </p>
      </section>

      {/* Main Search Input Bar with Live Typeahead Suggestions */}
      <section className="relative">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            executeSearch(searchQuery);
          }}
          className="flex items-center gap-2.5 rounded-2xl bg-[#1a1b20] px-4 py-3 border border-white/[0.08] shadow-xl focus-within:border-[#dbb8ff]/60 focus-within:bg-[#202128] transition-all"
        >
          <span className="material-symbols-outlined text-[#988d9f] text-xl">search</span>
          <input
            type="text"
            value={searchQuery}
            onChange={handleInputChange}
            onFocus={() => {
              setShowSearchHistory(true);
              if (searchQuery.trim().length >= 1) setShowSuggestions(true);
            }}
            onBlur={() => {
              setTimeout(() => setShowSearchHistory(false), 200);
            }}
            placeholder="Search movie names, artist names, playlists, or songs..."
            className="w-full bg-transparent text-sm text-[#e3e2e8] placeholder:text-[#988d9f] focus:outline-none font-medium"
          />

          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSuggestions([]);
                setShowSuggestions(false);
                setGroupedResults(null);
              }}
              className="text-[#988d9f] hover:text-[#e3e2e8] p-1"
            >
              <span className="material-symbols-outlined text-base">close</span>
            </button>
          )}

          <button
            type="submit"
            className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#7928ca] to-[#dbb8ff] text-white flex items-center justify-center font-bold shadow-md hover:opacity-90 active:scale-95 cursor-pointer flex-shrink-0"
          >
            <span className="material-symbols-outlined text-lg">arrow_forward</span>
          </button>
        </form>

        {/* Search History Dropdown (Shown when search bar is clicked) */}
        {showSearchHistory && !searchQuery && recentSearches.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-[#1e1f25] border border-white/[0.12] rounded-2xl shadow-2xl z-40 overflow-hidden backdrop-blur-xl p-2.5">
            <div className="px-3 py-1.5 flex items-center justify-between text-xs text-[#cec2d6]/70 border-b border-white/[0.06] mb-1">
              <span className="font-semibold text-[#dbb8ff] flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">history</span>
                Recent Searches
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setRecentSearches([]);
                  try { localStorage.removeItem('rezbeatsai_search_history'); } catch {}
                }}
                className="text-[#cec2d6]/60 hover:text-white transition-colors cursor-pointer text-[11px]"
              >
                Clear History
              </button>
            </div>
            <div className="space-y-1">
              {recentSearches.map((term, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    setSearchQuery(term);
                    setShowSearchHistory(false);
                    executeSearch(term);
                  }}
                  className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-[#2a2b33] cursor-pointer text-xs text-[#e3e2e8] transition-colors group"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-sm text-[#988d9f]">history</span>
                    <span>{term}</span>
                  </div>
                  <span className="material-symbols-outlined text-xs text-[#988d9f] opacity-0 group-hover:opacity-100 transition-opacity">
                    north_west
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Live Autocomplete Dropdown (Keystroke Typeahead) */}
        {showSuggestions && (suggestions.length > 0 || isSearchingSuggestions) && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-[#1e1f25] border border-white/[0.12] rounded-2xl shadow-2xl z-40 overflow-hidden backdrop-blur-xl">
            <div className="px-3.5 py-2 border-b border-white/[0.06] flex items-center justify-between text-xs text-[#cec2d6]/70">
              <span className="font-semibold text-[#dbb8ff]">Suggested Matches</span>
              {isSearchingSuggestions && (
                <span className="material-symbols-outlined text-xs animate-spin">sync</span>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto divide-y divide-white/[0.04]">
              {suggestions.map((item) => (
                <div
                  key={`${item.type}-${item.id}`}
                  onClick={() => handleSelectSuggestion(item)}
                  className="p-3 flex items-center justify-between gap-3 hover:bg-[#2a2b33] cursor-pointer transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-10 h-10 rounded-lg object-cover bg-[#292a2e] flex-shrink-0"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=150&auto=format&fit=crop&q=80';
                        }}
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-[#292a2e] flex items-center justify-center text-[#dbb8ff] flex-shrink-0">
                        <span className="material-symbols-outlined text-lg">
                          {item.type === 'artist' ? 'person' : item.type === 'album' ? 'movie' : 'music_note'}
                        </span>
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm font-semibold text-[#e3e2e8] group-hover:text-[#dbb8ff] truncate">
                        {item.title}
                      </p>
                      {item.artist && (
                        <p className="text-[11px] text-[#cec2d6]/70 truncate">{item.artist}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-[10px] uppercase px-2 py-0.5 rounded bg-white/[0.06] text-[#cec2d6] font-mono">
                      {item.type === 'album' ? 'Movie / Album' : item.type}
                    </span>
                    <span className="material-symbols-outlined text-[#dbb8ff] text-xl opacity-0 group-hover:opacity-100 transition-opacity">
                      play_circle
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Search Badges */}
        <div className="flex items-center gap-2 overflow-x-auto pt-3 pb-1 scrollbar-none">
          {popularSearches.map((term) => (
            <button
              key={term}
              onClick={() => {
                setSearchQuery(term);
                executeSearch(term);
              }}
              className="px-3 py-1 rounded-full text-xs font-medium bg-[#1e1f24] text-[#cec2d6] hover:bg-[#282930] hover:text-[#e3e2e8] border border-white/[0.05] whitespace-nowrap transition-all cursor-pointer active:scale-95"
            >
              {term}
            </button>
          ))}
        </div>
      </section>

      {/* Search Results Display Categorized By Movie Name, Artist Name, Playlists, and Songs */}
      {hasResults && groupedResults && (
        <section className="flex flex-col space-y-4 p-4 rounded-2xl bg-[#1a1b20] border border-[#dbb8ff]/30 shadow-xl">
          {/* Header & Filter Tabs */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-white/[0.08]">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#dbb8ff] text-xl">manage_search</span>
              <h2 className="text-sm sm:text-base font-bold text-[#e3e2e8]">
                Search Results for "{groupedResults.query || searchQuery}"
              </h2>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
              <button
                onClick={() => setActiveCategoryTab('all')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  activeCategoryTab === 'all'
                    ? 'bg-[#dbb8ff] text-[#470083] shadow-md font-bold'
                    : 'bg-[#292a2e] text-[#cec2d6] hover:text-[#e3e2e8]'
                }`}
              >
                All Together
              </button>
              {groupedResults.movies && groupedResults.movies.length > 0 && (
                <button
                  onClick={() => setActiveCategoryTab('movies')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                    activeCategoryTab === 'movies'
                      ? 'bg-[#dbb8ff] text-[#470083] shadow-md font-bold'
                      : 'bg-[#292a2e] text-[#cec2d6] hover:text-[#e3e2e8]'
                  }`}
                >
                  <span className="material-symbols-outlined text-xs">movie</span>
                  <span>Movies ({groupedResults.movies.length})</span>
                </button>
              )}
              {groupedResults.artists && groupedResults.artists.length > 0 && (
                <button
                  onClick={() => setActiveCategoryTab('artists')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                    activeCategoryTab === 'artists'
                      ? 'bg-[#dbb8ff] text-[#470083] shadow-md font-bold'
                      : 'bg-[#292a2e] text-[#cec2d6] hover:text-[#e3e2e8]'
                  }`}
                >
                  <span className="material-symbols-outlined text-xs">person</span>
                  <span>Artists ({groupedResults.artists.length})</span>
                </button>
              )}
              {groupedResults.playlists && groupedResults.playlists.length > 0 && (
                <button
                  onClick={() => setActiveCategoryTab('playlists')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                    activeCategoryTab === 'playlists'
                      ? 'bg-[#dbb8ff] text-[#470083] shadow-md font-bold'
                      : 'bg-[#292a2e] text-[#cec2d6] hover:text-[#e3e2e8]'
                  }`}
                >
                  <span className="material-symbols-outlined text-xs">queue_music</span>
                  <span>Playlists</span>
                </button>
              )}
              {groupedResults.songs && groupedResults.songs.length > 0 && (
                <button
                  onClick={() => setActiveCategoryTab('songs')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                    activeCategoryTab === 'songs'
                      ? 'bg-[#dbb8ff] text-[#470083] shadow-md font-bold'
                      : 'bg-[#292a2e] text-[#cec2d6] hover:text-[#e3e2e8]'
                  }`}
                >
                  <span className="material-symbols-outlined text-xs">music_note</span>
                  <span>Songs ({groupedResults.songs.length})</span>
                </button>
              )}
            </div>
          </div>

          {/* SECTION 1: MOVIES / SOUNDTRACKS WITH ALL SONGS TOGETHER */}
          {(activeCategoryTab === 'all' || activeCategoryTab === 'movies') &&
            groupedResults.movies &&
            groupedResults.movies.length > 0 && (
              <div className="flex flex-col space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#dbb8ff] text-lg">movie</span>
                    <h3 className="text-sm font-bold text-[#e3e2e8] tracking-tight">
                      Movies & Soundtracks
                    </h3>
                  </div>
                  <span className="text-[11px] text-[#cec2d6]/70">
                    {groupedResults.movies.length} {groupedResults.movies.length === 1 ? 'Movie' : 'Movies'} found
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {groupedResults.movies.map((movie) => {
                    const isExpanded = expandedMovieId === movie.id;
                    const hasMovieSongs = movie.songs && movie.songs.length > 0;
                    return (
                      <div
                        key={movie.id}
                        className="rounded-2xl bg-[#14151c] border border-white/[0.08] overflow-hidden transition-all hover:border-[#dbb8ff]/40"
                      >
                        {/* Movie Header Card */}
                        <div className="p-3.5 sm:p-4 flex items-center justify-between gap-3 bg-gradient-to-r from-[#1a1b24] to-[#14151c]">
                          <div className="flex items-center gap-3.5 min-w-0 flex-1">
                            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden flex-shrink-0 bg-[#292a2e] border border-white/10 shadow-md">
                              <img
                                src={movie.image}
                                alt={movie.title}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src =
                                    'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80';
                                }}
                              />
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#dbb8ff]/20 text-[#dbb8ff] border border-[#dbb8ff]/30 uppercase">
                                  Movie / Album
                                </span>
                                {movie.year && (
                                  <span className="text-[11px] text-[#cec2d6]/60 font-mono">
                                    {movie.year}
                                  </span>
                                )}
                              </div>
                              <h4 className="text-base sm:text-lg font-bold text-[#e3e2e8] truncate mt-1">
                                {movie.title}
                              </h4>
                              <p className="text-xs text-[#cec2d6]/80 truncate">
                                {movie.artist || 'Movie Soundtrack'}
                              </p>
                              <p className="text-[11px] text-[#dbb8ff] font-medium mt-0.5">
                                {movie.songs?.length || movie.songCount || 0} Movie Songs available
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 flex-shrink-0">
                            {hasMovieSongs && (
                              <button
                                onClick={() => onPlayTrack(movie.songs[0], movie.songs)}
                                className="px-3.5 py-1.5 rounded-full bg-[#1db954] text-[#003b14] font-bold text-xs flex items-center gap-1.5 hover:bg-[#1ed760] transition-all cursor-pointer shadow-lg active:scale-95"
                              >
                                <span className="material-symbols-outlined text-base">play_arrow</span>
                                <span>Play Movie</span>
                              </button>
                            )}
                            <button
                              onClick={() => setExpandedMovieId(isExpanded ? null : movie.id)}
                              className="p-1.5 rounded-xl bg-[#292a2e] text-[#cec2d6] hover:text-[#e3e2e8] transition-colors cursor-pointer"
                              title={isExpanded ? 'Collapse songs' : 'View all movie songs'}
                            >
                              <span className="material-symbols-outlined text-lg">
                                {isExpanded ? 'expand_less' : 'expand_more'}
                              </span>
                            </button>
                          </div>
                        </div>

                        {/* Movie Songs List */}
                        {isExpanded && hasMovieSongs && (
                          <div className="px-3.5 pb-3.5 pt-1 space-y-1.5 border-t border-white/[0.04] bg-[#0e0f14]/50">
                            <div className="text-[11px] font-semibold text-[#cec2d6]/70 px-1 py-1 flex items-center justify-between">
                              <span>All Songs from "{movie.title}"</span>
                              <span>{movie.songs.length} Tracks</span>
                            </div>
                            {movie.songs.map((trk, idx) => {
                              const isPlayingThis = currentTrackId === trk.id && isPlaying;
                              return (
                                <div
                                  key={trk.id}
                                  onClick={() => onPlayTrack(trk, movie.songs)}
                                  className={`p-2 rounded-xl flex items-center justify-between gap-3 cursor-pointer group transition-all border ${
                                    isPlayingThis
                                      ? 'bg-[#7928ca]/30 border-[#dbb8ff]/60 text-white'
                                      : 'bg-[#1a1b22] hover:bg-[#252630] border-white/[0.04]'
                                  }`}
                                >
                                  <div className="flex items-center gap-3 min-w-0 flex-1">
                                    <span className="text-xs font-mono text-[#cec2d6]/50 w-4 text-center">
                                      {idx + 1}
                                    </span>
                                    <div className="w-9 h-9 rounded-lg overflow-hidden flex-shrink-0 bg-[#292a2e]">
                                      <img
                                        src={trk.coverUrl || movie.image}
                                        alt={trk.title}
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <h5 className="text-xs sm:text-sm font-semibold text-[#e3e2e8] truncate group-hover:text-[#dbb8ff]">
                                        {trk.title}
                                      </h5>
                                      <p className="text-[10px] text-[#cec2d6]/70 truncate">
                                        {trk.artist}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2 flex-shrink-0">
                                    <span className="text-xs font-mono text-[#cec2d6]/60">
                                      {trk.duration}
                                    </span>
                                    {/* 3-dot context menu */}
                                    <div className="relative" onClick={(e) => e.stopPropagation()}>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setOpenMenuTrackId(openMenuTrackId === trk.id ? null : trk.id);
                                        }}
                                        className="p-1 text-[#cec2d6]/50 hover:text-white transition-colors rounded-full hover:bg-white/[0.06]"
                                      >
                                        <span className="material-symbols-outlined text-base">more_vert</span>
                                      </button>
                                      {openMenuTrackId === trk.id && (
                                        <div className="absolute right-0 bottom-full mb-1 z-50 min-w-[160px] bg-[#1e1f28] border border-white/[0.12] rounded-2xl shadow-2xl overflow-hidden animate-fade-in">
                                          <button onClick={(e) => handleSongMenuAction(e, 'playNext', trk)} className="flex items-center gap-2 w-full px-3 py-2.5 text-xs font-semibold text-[#e3e2e8] hover:bg-[#7928ca]/30 hover:text-[#dbb8ff] transition-colors">
                                            <span className="material-symbols-outlined text-sm text-[#dbb8ff]">skip_next</span>Play Next
                                          </button>
                                          <button onClick={(e) => handleSongMenuAction(e, 'addToQueue', trk)} className="flex items-center gap-2 w-full px-3 py-2.5 text-xs font-semibold text-[#e3e2e8] hover:bg-[#7928ca]/30 hover:text-[#dbb8ff] transition-colors">
                                            <span className="material-symbols-outlined text-sm text-[#dbb8ff]">queue_music</span>Add to Queue
                                          </button>
                                          <div className="h-px bg-white/[0.06] mx-2" />
                                          <button onClick={(e) => handleSongMenuAction(e, 'like', trk)} className="flex items-center gap-2 w-full px-3 py-2.5 text-xs font-semibold text-[#e3e2e8] hover:bg-rose-500/20 hover:text-rose-400 transition-colors">
                                            <span className="material-symbols-outlined text-sm text-rose-400">favorite_border</span>Like
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onPlayTrack(trk, movie.songs);
                                      }}
                                      className="w-7 h-7 rounded-full bg-[#1db954] text-[#003b14] flex items-center justify-center font-bold hover:scale-105 active:scale-95 transition-all"
                                    >
                                      <span className="material-symbols-outlined text-sm">
                                        {isPlayingThis ? 'pause' : 'play_arrow'}
                                      </span>
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          {/* SECTION 2: ARTISTS WITH ALL SONGS TOGETHER */}
          {(activeCategoryTab === 'all' || activeCategoryTab === 'artists') &&
            groupedResults.artists &&
            groupedResults.artists.length > 0 && (
              <div className="flex flex-col space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#dbb8ff] text-lg">person</span>
                    <h3 className="text-sm font-bold text-[#e3e2e8] tracking-tight">
                      Artists & Performers
                    </h3>
                  </div>
                  <span className="text-[11px] text-[#cec2d6]/70">
                    {groupedResults.artists.length} {groupedResults.artists.length === 1 ? 'Artist' : 'Artists'} found
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {groupedResults.artists.map((artist) => {
                    const isExpanded = expandedArtistId === artist.id;
                    const hasArtistSongs = artist.songs && artist.songs.length > 0;
                    return (
                      <div
                        key={artist.id}
                        className="rounded-2xl bg-[#14151c] border border-white/[0.08] overflow-hidden transition-all hover:border-[#dbb8ff]/40"
                      >
                        {/* Artist Header Card */}
                        <div className="p-3.5 sm:p-4 flex items-center justify-between gap-3 bg-gradient-to-r from-[#1a1b24] to-[#14151c]">
                          <div className="flex items-center gap-3.5 min-w-0 flex-1">
                            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden flex-shrink-0 bg-[#292a2e] border-2 border-[#dbb8ff]/40 shadow-md">
                              <img
                                src={artist.image}
                                alt={artist.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src =
                                    'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80';
                                }}
                              />
                            </div>

                            <div className="min-w-0 flex-1">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#dbb8ff]/20 text-[#dbb8ff] border border-[#dbb8ff]/30 uppercase">
                                Artist
                              </span>
                              <h4 className="text-base sm:text-lg font-bold text-[#e3e2e8] truncate mt-1">
                                {artist.name}
                              </h4>
                              <p className="text-xs text-[#cec2d6]/80 truncate">
                                {artist.role || 'Performer / Composer'}
                              </p>
                              <p className="text-[11px] text-[#dbb8ff] font-medium mt-0.5">
                                {artist.songs?.length || 0} Top Tracks
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 flex-shrink-0">
                            {hasArtistSongs && (
                              <button
                                onClick={() => onPlayTrack(artist.songs[0], artist.songs)}
                                className="px-3.5 py-1.5 rounded-full bg-[#1db954] text-[#003b14] font-bold text-xs flex items-center gap-1.5 hover:bg-[#1ed760] transition-all cursor-pointer shadow-lg active:scale-95"
                              >
                                <span className="material-symbols-outlined text-base">play_arrow</span>
                                <span>Play Artist</span>
                              </button>
                            )}
                            <button
                              onClick={() => setExpandedArtistId(isExpanded ? null : artist.id)}
                              className="p-1.5 rounded-xl bg-[#292a2e] text-[#cec2d6] hover:text-[#e3e2e8] transition-colors cursor-pointer"
                              title={isExpanded ? 'Collapse songs' : 'View artist songs'}
                            >
                              <span className="material-symbols-outlined text-lg">
                                {isExpanded ? 'expand_less' : 'expand_more'}
                              </span>
                            </button>
                          </div>
                        </div>

                        {/* Artist Songs List */}
                        {isExpanded && hasArtistSongs && (
                          <div className="px-3.5 pb-3.5 pt-1 space-y-1.5 border-t border-white/[0.04] bg-[#0e0f14]/50">
                            <div className="text-[11px] font-semibold text-[#cec2d6]/70 px-1 py-1 flex items-center justify-between">
                              <span>Top Songs by "{artist.name}"</span>
                              <span>{artist.songs.length} Tracks</span>
                            </div>
                            {artist.songs.map((trk, idx) => {
                              const isPlayingThis = currentTrackId === trk.id && isPlaying;
                              return (
                                <div
                                  key={trk.id}
                                  onClick={() => onPlayTrack(trk, artist.songs)}
                                  className={`p-2 rounded-xl flex items-center justify-between gap-3 cursor-pointer group transition-all border ${
                                    isPlayingThis
                                      ? 'bg-[#7928ca]/30 border-[#dbb8ff]/60 text-white'
                                      : 'bg-[#1a1b22] hover:bg-[#252630] border-white/[0.04]'
                                  }`}
                                >
                                  <div className="flex items-center gap-3 min-w-0 flex-1">
                                    <span className="text-xs font-mono text-[#cec2d6]/50 w-4 text-center">
                                      {idx + 1}
                                    </span>
                                    <div className="w-9 h-9 rounded-lg overflow-hidden flex-shrink-0 bg-[#292a2e]">
                                      <img
                                        src={trk.coverUrl || artist.image}
                                        alt={trk.title}
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <h5 className="text-xs sm:text-sm font-semibold text-[#e3e2e8] truncate group-hover:text-[#dbb8ff]">
                                        {trk.title}
                                      </h5>
                                      <p className="text-[10px] text-[#cec2d6]/70 truncate">
                                        {trk.album || artist.name}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2 flex-shrink-0">
                                    <span className="text-xs font-mono text-[#cec2d6]/60">
                                      {trk.duration}
                                    </span>
                                    {/* 3-dot context menu */}
                                    <div className="relative" onClick={(e) => e.stopPropagation()}>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setOpenMenuTrackId(openMenuTrackId === trk.id ? null : trk.id);
                                        }}
                                        className="p-1 text-[#cec2d6]/50 hover:text-white transition-colors rounded-full hover:bg-white/[0.06]"
                                      >
                                        <span className="material-symbols-outlined text-base">more_vert</span>
                                      </button>
                                      {openMenuTrackId === trk.id && (
                                        <div className="absolute right-0 bottom-full mb-1 z-50 min-w-[160px] bg-[#1e1f28] border border-white/[0.12] rounded-2xl shadow-2xl overflow-hidden animate-fade-in">
                                          <button onClick={(e) => handleSongMenuAction(e, 'playNext', trk)} className="flex items-center gap-2 w-full px-3 py-2.5 text-xs font-semibold text-[#e3e2e8] hover:bg-[#7928ca]/30 hover:text-[#dbb8ff] transition-colors">
                                            <span className="material-symbols-outlined text-sm text-[#dbb8ff]">skip_next</span>Play Next
                                          </button>
                                          <button onClick={(e) => handleSongMenuAction(e, 'addToQueue', trk)} className="flex items-center gap-2 w-full px-3 py-2.5 text-xs font-semibold text-[#e3e2e8] hover:bg-[#7928ca]/30 hover:text-[#dbb8ff] transition-colors">
                                            <span className="material-symbols-outlined text-sm text-[#dbb8ff]">queue_music</span>Add to Queue
                                          </button>
                                          <div className="h-px bg-white/[0.06] mx-2" />
                                          <button onClick={(e) => handleSongMenuAction(e, 'like', trk)} className="flex items-center gap-2 w-full px-3 py-2.5 text-xs font-semibold text-[#e3e2e8] hover:bg-rose-500/20 hover:text-rose-400 transition-colors">
                                            <span className="material-symbols-outlined text-sm text-rose-400">favorite_border</span>Like
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onPlayTrack(trk, artist.songs);
                                      }}
                                      className="w-7 h-7 rounded-full bg-[#1db954] text-[#003b14] flex items-center justify-center font-bold hover:scale-105 active:scale-95 transition-all"
                                    >
                                      <span className="material-symbols-outlined text-sm">
                                        {isPlayingThis ? 'pause' : 'play_arrow'}
                                      </span>
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          {/* SECTION 3: PLAYLISTS & MIXES */}
          {(activeCategoryTab === 'all' || activeCategoryTab === 'playlists') &&
            groupedResults.playlists &&
            groupedResults.playlists.length > 0 && (
              <div className="flex flex-col space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#dbb8ff] text-lg">queue_music</span>
                    <h3 className="text-sm font-bold text-[#e3e2e8] tracking-tight">
                      Curated & Movie Playlists
                    </h3>
                  </div>
                  <span className="text-[11px] text-[#cec2d6]/70">
                    {groupedResults.playlists.length} Playlists
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {groupedResults.playlists.map((playlist) => {
                    const isExpanded = expandedPlaylistId === playlist.id;
                    const isLoadingThis = playlistLoadingId === playlist.id;
                    const hasSongs = playlist.songs && playlist.songs.length > 0;
                    return (
                      <div
                        key={playlist.id}
                        className="rounded-2xl bg-[#14151c] border border-white/[0.08] overflow-hidden transition-all hover:border-[#dbb8ff]/40"
                      >
                        {/* Playlist Header Card */}
                        <div
                          onClick={() => handlePlaylistClick(playlist)}
                          className="p-3.5 sm:p-4 flex items-center justify-between gap-3 bg-gradient-to-r from-[#1a1b24] to-[#14151c] cursor-pointer"
                        >
                          <div className="flex items-center gap-3.5 min-w-0 flex-1">
                            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden flex-shrink-0 bg-[#292a2e] border border-white/10 shadow-md">
                              <img
                                src={playlist.image}
                                alt={playlist.title}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src =
                                    'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80';
                                }}
                              />
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#dbb8ff]/20 text-[#dbb8ff] border border-[#dbb8ff]/30 uppercase">
                                  Playlist Collection
                                </span>
                              </div>
                              <h4 className="text-base sm:text-lg font-bold text-[#e3e2e8] truncate mt-1">
                                {playlist.title}
                              </h4>
                              <p className="text-xs text-[#cec2d6]/80 truncate">
                                {playlist.id.startsWith('yt_') ? 'YouTube Worldwide Playlist' : 'Featured Music Mix'}
                              </p>
                              <p className="text-[11px] text-[#dbb8ff] font-medium mt-0.5">
                                {playlist.trackCount || playlist.songs?.length || 0} Songs inside
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                            {hasSongs && (
                              <button
                                onClick={() => onPlayTrack(playlist.songs[0], playlist.songs)}
                                className="px-3.5 py-1.5 rounded-full bg-[#1db954] text-[#003b14] font-bold text-xs flex items-center gap-1.5 hover:bg-[#1ed760] transition-all cursor-pointer shadow-lg active:scale-95"
                              >
                                <span className="material-symbols-outlined text-base">play_arrow</span>
                                <span>Play Mix</span>
                              </button>
                            )}
                            <button
                              onClick={() => handlePlaylistClick(playlist)}
                              className="p-1.5 rounded-xl bg-[#292a2e] text-[#cec2d6] hover:text-[#e3e2e8] transition-colors cursor-pointer"
                              title={isExpanded ? 'Collapse playlist' : 'Expand playlist'}
                            >
                              <span className="material-symbols-outlined text-lg">
                                {isExpanded ? 'expand_less' : 'expand_more'}
                              </span>
                            </button>
                          </div>
                        </div>

                        {/* Expandable Tracks Area */}
                        {isExpanded && (
                          <div className="border-t border-white/[0.04] bg-[#0e0f14]/50 p-3 sm:p-4 space-y-2">
                            {isLoadingThis ? (
                              <div className="py-8 flex flex-col items-center justify-center space-y-3">
                                <div className="w-8 h-8 rounded-full border-4 border-[#dbb8ff]/30 border-t-[#dbb8ff] animate-spin"></div>
                                <p className="text-xs text-[#cec2d6]/80 animate-pulse text-center max-w-xs">
                                  Scanning and compiling playlist songs from worldwide indexes...
                                </p>
                              </div>
                            ) : hasSongs ? (
                              <div className="space-y-1.5">
                                <div className="text-[11px] font-semibold text-[#cec2d6]/70 px-1 py-1 flex items-center justify-between">
                                  <span>Tracks inside "{playlist.title}"</span>
                                  <span>{playlist.songs.length} Available</span>
                                </div>
                                {playlist.songs.map((trk: any, idx: number) => {
                                  const isPlayingThis = currentTrackId === trk.id && isPlaying;
                                  return (
                                    <div
                                      key={trk.id}
                                      onClick={() => onPlayTrack(trk, playlist.songs)}
                                      className={`p-2 rounded-xl flex items-center justify-between gap-3 cursor-pointer group transition-all border ${
                                        isPlayingThis
                                          ? 'bg-[#7928ca]/30 border-[#dbb8ff]/60 text-white font-bold shadow-lg shadow-[#7928ca]/10'
                                          : 'bg-[#1a1b22] hover:bg-[#252630] border-white/[0.04]'
                                      }`}
                                    >
                                      <div className="flex items-center gap-3 min-w-0 flex-1">
                                        <span className="text-xs font-mono text-[#cec2d6]/50 w-4 text-center">
                                          {idx + 1}
                                        </span>
                                        <div className="w-9 h-9 rounded-lg overflow-hidden flex-shrink-0 bg-[#292a2e]">
                                          <img
                                            src={trk.coverUrl || playlist.image}
                                            alt={trk.title}
                                            className="w-full h-full object-cover"
                                          />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                          <h5 className="text-xs sm:text-sm font-semibold text-[#e3e2e8] truncate group-hover:text-[#dbb8ff]">
                                            {trk.title}
                                          </h5>
                                          <p className="text-[10px] text-[#cec2d6]/70 truncate">
                                            {trk.artist}
                                          </p>
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                                        <span className="text-xs font-mono text-[#cec2d6]/60">
                                          {trk.duration}
                                        </span>
                                        {/* 3-dot context menu */}
                                        <div className="relative">
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setOpenMenuTrackId(openMenuTrackId === trk.id ? null : trk.id);
                                            }}
                                            className="p-1 text-[#cec2d6]/50 hover:text-white transition-colors rounded-full hover:bg-white/[0.06]"
                                          >
                                            <span className="material-symbols-outlined text-base">more_vert</span>
                                          </button>
                                          {openMenuTrackId === trk.id && (
                                            <div className="absolute right-0 bottom-full mb-1 z-50 min-w-[160px] bg-[#1e1f28] border border-white/[0.12] rounded-2xl shadow-2xl overflow-hidden animate-fade-in">
                                              <button onClick={(e) => handleSongMenuAction(e, 'playNext', trk)} className="flex items-center gap-2 w-full px-3 py-2.5 text-xs font-semibold text-[#e3e2e8] hover:bg-[#7928ca]/30 hover:text-[#dbb8ff] transition-colors">
                                                <span className="material-symbols-outlined text-sm text-[#dbb8ff]">skip_next</span>Play Next
                                              </button>
                                              <button onClick={(e) => handleSongMenuAction(e, 'addToQueue', trk)} className="flex items-center gap-2 w-full px-3 py-2.5 text-xs font-semibold text-[#e3e2e8] hover:bg-[#7928ca]/30 hover:text-[#dbb8ff] transition-colors">
                                                <span className="material-symbols-outlined text-sm text-[#dbb8ff]">queue_music</span>Add to Queue
                                              </button>
                                              <div className="h-px bg-white/[0.06] mx-2" />
                                              <button onClick={(e) => handleSongMenuAction(e, 'like', trk)} className="flex items-center gap-2 w-full px-3 py-2.5 text-xs font-semibold text-[#e3e2e8] hover:bg-rose-500/20 hover:text-rose-400 transition-colors">
                                                <span className="material-symbols-outlined text-sm text-rose-400">favorite_border</span>Like
                                              </button>
                                            </div>
                                          )}
                                        </div>
                                        <button
                                          onClick={() => onPlayTrack(trk, playlist.songs)}
                                          className="w-7 h-7 rounded-full bg-[#1db954] text-[#003b14] flex items-center justify-center font-bold hover:scale-105 active:scale-95 transition-all"
                                        >
                                          <span className="material-symbols-outlined text-sm">
                                            {isPlayingThis ? 'pause' : 'play_arrow'}
                                          </span>
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <div className="py-6 text-center text-xs text-[#cec2d6]/50">
                                No songs could be compiled for this playlist. Try another one!
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          {/* SECTION 4: DIRECT MATCHING SONGS */}
          {(activeCategoryTab === 'all' || activeCategoryTab === 'songs') &&
            groupedResults.songs &&
            groupedResults.songs.length > 0 && (
              <div className="flex flex-col space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#dbb8ff] text-lg">music_note</span>
                    <h3 className="text-sm font-bold text-[#e3e2e8] tracking-tight">
                      All Matching Songs ({groupedResults.songs.length})
                    </h3>
                  </div>
                  <button
                    onClick={() => onPlayTrack(groupedResults.songs[0], groupedResults.songs)}
                    className="px-3 py-1 rounded-full bg-[#1db954] text-[#003b14] font-bold text-xs hover:bg-[#1ed760] transition-colors cursor-pointer"
                  >
                    Play All Songs
                  </button>
                </div>

                <div className="flex flex-col space-y-2">
                  {groupedResults.songs.map((track) => {
                    const isPlayingThis = currentTrackId === track.id && isPlaying;
                    return (
                      <div
                        key={track.id}
                        onClick={() => onPlayTrack(track, groupedResults.songs)}
                        className={`p-2.5 rounded-xl flex items-center justify-between gap-3 cursor-pointer group transition-all border ${
                          isPlayingThis
                            ? 'bg-[#7928ca]/25 border-[#dbb8ff]/50'
                            : 'bg-[#15161b] hover:bg-[#23242c] border-white/[0.04]'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-[#292a2e] relative">
                            <img
                              src={track.coverUrl}
                              alt={track.title}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src =
                                  'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80';
                              }}
                            />
                            {isPlayingThis && (
                              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                <span className="material-symbols-outlined text-[#dbb8ff] text-xl animate-pulse">
                                  volume_up
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="text-xs sm:text-sm font-semibold text-[#e3e2e8] truncate group-hover:text-[#dbb8ff] transition-colors">
                                {track.title}
                              </h4>
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-[#1db954]/20 text-[#1db954] border border-[#1db954]/30 flex-shrink-0">
                                FULL
                              </span>
                            </div>
                            <p className="text-[11px] text-[#cec2d6]/70 truncate mt-0.5">
                              {track.artist} {track.album ? `• ${track.album}` : ''}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                          <span className="text-xs font-mono text-[#cec2d6]/60">
                            {track.duration}
                          </span>
                          {/* 3-dot context menu */}
                          <div className="relative">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenMenuTrackId(openMenuTrackId === track.id ? null : track.id);
                              }}
                              className="p-1 text-[#cec2d6]/50 hover:text-white transition-colors rounded-full hover:bg-white/[0.06]"
                            >
                              <span className="material-symbols-outlined text-lg">more_vert</span>
                            </button>
                            {openMenuTrackId === track.id && (
                              <div className="absolute right-0 bottom-full mb-1 z-50 min-w-[160px] bg-[#1e1f28] border border-white/[0.12] rounded-2xl shadow-2xl overflow-hidden animate-fade-in">
                                <button onClick={(e) => handleSongMenuAction(e, 'playNext', track)} className="flex items-center gap-2 w-full px-3 py-2.5 text-xs font-semibold text-[#e3e2e8] hover:bg-[#7928ca]/30 hover:text-[#dbb8ff] transition-colors">
                                  <span className="material-symbols-outlined text-sm text-[#dbb8ff]">skip_next</span>Play Next
                                </button>
                                <button onClick={(e) => handleSongMenuAction(e, 'addToQueue', track)} className="flex items-center gap-2 w-full px-3 py-2.5 text-xs font-semibold text-[#e3e2e8] hover:bg-[#7928ca]/30 hover:text-[#dbb8ff] transition-colors">
                                  <span className="material-symbols-outlined text-sm text-[#dbb8ff]">queue_music</span>Add to Queue
                                </button>
                                <div className="h-px bg-white/[0.06] mx-2" />
                                <button onClick={(e) => handleSongMenuAction(e, 'like', track)} className="flex items-center gap-2 w-full px-3 py-2.5 text-xs font-semibold text-[#e3e2e8] hover:bg-rose-500/20 hover:text-rose-400 transition-colors">
                                  <span className="material-symbols-outlined text-sm text-rose-400">favorite_border</span>Like
                                </button>
                              </div>
                            )}
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onPlayTrack(track, groupedResults.songs);
                            }}
                            className="w-8 h-8 rounded-full bg-[#1db954] text-[#003b14] flex items-center justify-center font-bold hover:scale-105 active:scale-95 transition-all"
                          >
                            <span className="material-symbols-outlined text-base">
                              {isPlayingThis ? 'pause' : 'play_arrow'}
                            </span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}


        </section>
      )}

      {isLoadingResults && (
        <div className="flex flex-col items-center justify-center py-12 space-y-2">
          <div className="w-8 h-8 border-2 border-[#dbb8ff]/20 border-t-[#dbb8ff] rounded-full animate-spin"></div>
          <p className="text-xs text-[#cec2d6]">
            Searching movies, artists, playlists & full song tracks...
          </p>
        </div>
      )}

      {/* Explore by mood (2x2 Grid) */}
      <section className="flex flex-col space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <h2 className="text-base sm:text-lg font-bold text-[#e3e2e8] font-display">
              Explore by Mood
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {moodCards.map((m) => (
            <div
              key={m.id}
              onClick={() => handleMoodClick(m)}
              className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${m.gradient} p-3.5 sm:p-4 min-h-[110px] flex flex-col justify-between border border-white/[0.08] shadow-md group cursor-pointer hover:border-[#dbb8ff]/40 transition-all active:scale-[0.98]`}
            >
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded-md bg-black/40 backdrop-blur-md text-[10px] font-semibold text-white/90">
                  {m.tag}
                </span>
                <div className="w-7 h-7 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white/80 group-hover:scale-110 group-hover:bg-[#1db954] group-hover:text-[#003b14] transition-all">
                  <span className="material-symbols-outlined text-sm">play_arrow</span>
                </div>
              </div>

              <div>
                <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
                  {m.title}
                </h3>
                <p className="text-[11px] text-white/70 truncate mt-0.5">{m.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Curated Acoustic Heritage */}
      <section className="flex flex-col space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-1 text-[#dbb8ff]">
              <span className="material-symbols-outlined text-sm">diamond</span>
              <h2 className="text-base sm:text-lg font-bold text-[#e3e2e8] font-display">
                Curated Acoustic Heritage
              </h2>
            </div>
            <p className="text-xs text-[#cec2d6]/70">
              Classical jugalbandis, sitar ragas & rare studio sessions
            </p>
          </div>
        </div>

        <div className="flex flex-col space-y-2">
          {HIDDEN_GEMS.map((gem) => (
            <div
              key={gem.id}
              onClick={() =>
                onPlayTrack({
                  id: gem.id,
                  title: gem.name,
                  artist: gem.genre,
                  duration: '03:45',
                  coverUrl: gem.coverUrl,
                  tags: [gem.affinity, gem.listeners],
                })
              }
              className="rounded-xl bg-[#1a1b20] p-3 flex items-center justify-between gap-3 border border-white/[0.05] hover:bg-[#25262e] transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-11 h-11 rounded-xl overflow-hidden flex-shrink-0 bg-[#292a2e] border border-white/10">
                  <img
                    src={gem.coverUrl}
                    alt={gem.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs sm:text-sm font-semibold text-[#e3e2e8] truncate group-hover:text-[#dbb8ff] transition-colors">
                      {gem.name}
                    </h3>
                    <span className="px-1.5 py-0.2 rounded bg-[#7928ca]/30 text-[#dbb8ff] text-[10px] font-semibold">
                      {gem.affinity}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#cec2d6]/70 truncate">{gem.genre}</p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  aria-label="Play Gem"
                  className="w-8 h-8 rounded-full bg-[#292a2e] text-[#e3e2e8] hover:bg-[#dbb8ff] hover:text-[#470083] flex items-center justify-center transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-lg">play_arrow</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Trending Top 5 */}
      <section className="flex flex-col space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <h2 className="text-base sm:text-lg font-bold text-[#e3e2e8] font-display">
              Trending Top 5
            </h2>
          </div>
          <span className="material-symbols-outlined text-sm text-[#988d9f]">trending_up</span>
        </div>

        <div className="flex flex-col space-y-2">
          {DISCOVER_TRENDING.map((trend) => (
            <div
              key={trend.rank}
              onClick={() =>
                onPlayTrack({
                  id: `trend-${trend.rank}`,
                  title: trend.title,
                  artist: trend.artist,
                  duration: '03:50',
                  coverUrl: trend.coverUrl,
                })
              }
              className="rounded-xl bg-[#1a1b20] p-3 flex items-center justify-between gap-3 border border-white/[0.05] hover:bg-[#25262e] transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <span className="text-lg font-bold font-mono text-[#988d9f] w-6 flex-shrink-0 group-hover:text-[#dbb8ff] transition-colors">
                  {trend.rank}
                </span>
                <div className="w-11 h-11 rounded-lg overflow-hidden flex-shrink-0 bg-[#292a2e]">
                  <img
                    src={trend.coverUrl}
                    alt={trend.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs sm:text-sm font-semibold text-[#e3e2e8] truncate group-hover:text-[#dbb8ff] transition-colors">
                    {trend.title}
                  </h4>
                  <p className="text-[11px] text-[#cec2d6]/70 truncate">
                    {trend.artist}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-xs font-mono font-semibold text-[#1db954]">
                  {trend.trend}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
