import React, { useState, useEffect, useRef } from 'react';
import { Track, TabType, UserTasteProfile } from '../types';
import {
  INDIAN_LANGUAGES,
  INDIAN_CULTURAL_MOODS,
  INDIAN_TOP_ARTISTS,
  getTrendingIndianSongs,
  getLatestMovieAlbums,
  searchWorldwideCatalog,
  getIndianPriorityRadios,
  convertRadioToTrack,
  saveLikedTrack,
  isTrackLiked,
  detectUserLocation,
  getLiveSearchSuggestions,
  SearchSuggestionItem,
  getRecentlyPlayed,
  getOnRepeatTracks,
  getUserTasteProfile,
  recordTrackPlay,
  triggerAiMusicRefresh,
  getAuthUser,
} from '../services/musicService';
import { saveAccountSearchHistory, loadAccountSearchHistory } from '../services/firebase';

interface HomeScreenProps {
  onPlayTrack: (track: Track, queue?: Track[]) => void;
  onNavigateTab?: (tab: TabType) => void;
  currentTrackId?: string;
  isPlaying?: boolean;
  onAddToQueue?: (track: Track) => void;
  onPlayNext?: (track: Track) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onPlayTrack,
  onNavigateTab,
  currentTrackId,
  isPlaying,
  onAddToQueue,
  onPlayNext,
}) => {
  const [userName, setUserName] = useState<string>('Pranav');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('all');
  const [activeTracks, setActiveTracks] = useState<Track[]>([]);
  const [latestMovieAlbums, setLatestMovieAlbums] = useState<any[]>([]);
  const [isLoadingTracks, setIsLoadingTracks] = useState<boolean>(false);
  const [priorityRadios, setPriorityRadios] = useState<any[]>([]);
  const [recentlyPlayedTracks, setRecentlyPlayedTracks] = useState<Track[]>([]);
  const [onRepeatList, setOnRepeatList] = useState<{ track: Track; playCount: number }[]>([]);
  const [tasteProfile, setTasteProfile] = useState<UserTasteProfile | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Search Results State
  const [homeSearchQuery, setHomeSearchQuery] = useState<string>('');
  const [searchedQuery, setSearchedQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<Track[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestionItem[]>([]);
  const [isSearchingSuggestions, setIsSearchingSuggestions] = useState<boolean>(false);
  const [showSuggestionsDropdown, setShowSuggestionsDropdown] = useState<boolean>(false);
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('rezbeatsai_search_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [showSearchHistory, setShowSearchHistory] = useState<boolean>(false);
  const [openMenuTrackId, setOpenMenuTrackId] = useState<string | null>(null);
  const trackLoadRequest = useRef(0);

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

  // Time-based personalized greeting calculation
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Load user details, location, on repeat, and taste profile on mount
  useEffect(() => {
    try {
      const storedName = localStorage.getItem('rezbeatsai_user_name');
      if (storedName) setUserName(storedName);
    } catch {
      // Ignore
    }

    refreshUserData();

    // Sync cloud search history from user account (kept in account, max 5)
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

    // Load a broad catalog immediately; location detection can refine it afterward.
    loadLanguageTracks('all');

    // Auto-detect user location for region-based song loading
    detectUserLocation().then((loc) => {
      if (loc.language && loc.language !== 'all') loadLanguageTracks(loc.language);
    });

    loadRadios();
  }, []);

  const refreshUserData = () => {
    setOnRepeatList(getOnRepeatTracks());
    setTasteProfile(getUserTasteProfile());
    setRecentlyPlayedTracks(getRecentlyPlayed());
  };

  const loadRadios = async () => {
    const radios = await getIndianPriorityRadios();
    setPriorityRadios(radios);
  };

  const loadLanguageTracks = async (langId: string) => {
    const requestId = ++trackLoadRequest.current;
    setSelectedLanguage(langId);
    setIsLoadingTracks(true);

    getTrendingIndianSongs(langId)
      .then((tracks) => {
        if (requestId === trackLoadRequest.current) setActiveTracks(tracks);
      })
      .catch(() => {})
      .finally(() => {
        if (requestId === trackLoadRequest.current) setIsLoadingTracks(false);
      });

    getLatestMovieAlbums(langId)
      .then((albums) => {
        if (requestId === trackLoadRequest.current) setLatestMovieAlbums(albums);
      })
      .catch(() => {});
  };

  // Handle typing search with instant alphabet suggestions
  const handleSearchChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setHomeSearchQuery(val);

    if (val.trim().length >= 1) {
      setShowSuggestionsDropdown(true);
      setIsSearchingSuggestions(true);
      try {
        const results = await getLiveSearchSuggestions(val);
        setSuggestions(results);
      } finally {
        setIsSearchingSuggestions(false);
      }
    } else {
      setSuggestions([]);
      setShowSuggestionsDropdown(false);
    }
  };

  // Execute full search and display search results prominently
  const performSearch = async (queryText: string) => {
    if (!queryText.trim()) return;
    addRecentSearch(queryText.trim());
    setShowSuggestionsDropdown(false);
    setShowSearchHistory(false);
    setSearchedQuery(queryText.trim());
    setIsSearching(true);
    showToast(`Searching for "${queryText.trim()}"...`);

    try {
      const tracks = await searchWorldwideCatalog(queryText.trim(), 25);
      setSearchResults(tracks);
      if (tracks.length > 0) {
        showToast(`Found ${tracks.length} results for "${queryText.trim()}"`);
      } else {
        showToast(`No results found for "${queryText.trim()}"`);
      }
    } catch {
      showToast('Search error. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectSuggestion = (suggestion: SearchSuggestionItem) => {
    const q = `${suggestion.title} ${suggestion.artist || ''}`.trim();
    setHomeSearchQuery(suggestion.title);
    performSearch(q);
  };

  const handleHomeSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(homeSearchQuery);
  };

  const handleClearSearch = () => {
    setSearchResults([]);
    setSearchedQuery('');
    setHomeSearchQuery('');
    setSuggestions([]);
    setShowSuggestionsDropdown(false);
  };

  const handlePlayTrackAndTrackStats = (track: Track, queue?: Track[]) => {
    recordTrackPlay(track);
    onPlayTrack(track, queue);
    setTimeout(refreshUserData, 1000);
  };

  const handlePlayMood = async (mood: typeof INDIAN_CULTURAL_MOODS[0]) => {
    showToast(`Loading "${mood.title}" playlist...`);
    try {
      const tracks = await searchWorldwideCatalog(mood.searchKey, 20);
      if (tracks.length > 0) {
        handlePlayTrackAndTrackStats(tracks[0], tracks);
        showToast(`Playing: ${mood.title}`);
      }
    } finally {
      setTimeout(() => setToastMessage(null), 2000);
    }
  };

  const handleArtistClick = async (artist: typeof INDIAN_TOP_ARTISTS[0]) => {
    showToast(`Loading top songs by ${artist.name}...`);
    performSearch(artist.name);
  };

  const handlePlayRadio = (radio: any) => {
    const track = convertRadioToTrack(radio);
    handlePlayTrackAndTrackStats(track);
    showToast(`Tuned into ${radio.name} (Live On-Air)`);
  };

  const handlePlayAllRegional = () => {
    if (activeTracks.length > 0) {
      handlePlayTrackAndTrackStats(activeTracks[0], activeTracks);
      showToast(`Playing all ${activeTracks.length} tracks in queue`);
    }
  };

  const handleAiRefresh = async () => {
    setIsLoadingTracks(true);
    showToast('Scanning 2026 charts & new releases...');
    await triggerAiMusicRefresh(selectedLanguage);
    await loadLanguageTracks(selectedLanguage);
    showToast('Latest songs updated successfully!');
  };

  const handlePlayAllSearchResults = () => {
    if (searchResults.length > 0) {
      handlePlayTrackAndTrackStats(searchResults[0], searchResults);
      showToast(`Playing all ${searchResults.length} search results`);
    }
  };

  const handleToggleLike = (e: React.MouseEvent, track: Track) => {
    e.stopPropagation();
    const liked = saveLikedTrack(track);
    showToast(liked ? `Added "${track.title}" to Liked Songs` : `Removed "${track.title}"`);
    refreshUserData();
  };

  const handleTrackMenuAction = (e: React.MouseEvent, action: 'playNext' | 'addToQueue' | 'like', track: Track) => {
    e.stopPropagation();
    setOpenMenuTrackId(null);
    if (action === 'playNext') {
      onPlayNext?.(track);
      showToast(`"${track.title}" will play next`);
    } else if (action === 'addToQueue') {
      onAddToQueue?.(track);
      showToast(`"${track.title}" added to queue`);
    } else if (action === 'like') {
      const liked = saveLikedTrack(track);
      showToast(liked ? `Added "${track.title}" to Liked Songs` : `Removed "${track.title}"`);
      refreshUserData();
    }
  };

  // Dismiss context menus on outside click
  React.useEffect(() => {
    if (!openMenuTrackId) return;
    const handleOutside = () => setOpenMenuTrackId(null);
    document.addEventListener('click', handleOutside, { capture: true });
    return () => document.removeEventListener('click', handleOutside, { capture: true });
  }, [openMenuTrackId]);

  const currentLangObj = INDIAN_LANGUAGES.find((l) => l.id === selectedLanguage);

  return (
    <div className="flex flex-col w-full space-y-7 pb-36 pt-2">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-[#1e1f26] text-white shadow-2xl flex items-center gap-2 border border-[#dbb8ff]/40 text-xs font-semibold backdrop-blur-md animate-fade-in pointer-events-none">
          <span className="w-2 h-2 rounded-full bg-[#1db954] animate-ping"></span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Personalized Welcome Header */}
      <section className="flex flex-col space-y-3 pt-1">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[#dbb8ff] uppercase tracking-wider">
                {getGreeting()}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#e3e2e8] tracking-tight font-display mt-0.5">
              Welcome, {userName}
            </h1>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-[#cec2d6]/80">
              <span className="material-symbols-outlined text-sm text-[#1db954]">auto_awesome</span>
              <span>
                High-Fidelity Audio Flow
              </span>
            </div>
          </div>

          {onNavigateTab && (
            <button
              onClick={() => onNavigateTab('discover')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#24252c] hover:bg-[#343439] text-[#e3e2e8] border border-white/[0.08] text-xs font-semibold transition-all active:scale-95 shadow-sm cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm text-[#dbb8ff]">manage_search</span>
              <span>Explore</span>
            </button>
          )}
        </div>

        {/* Live Search & Autocomplete Input */}
        <div className="relative mt-2">
          <form
            onSubmit={handleHomeSearchSubmit}
            className="flex items-center gap-2 rounded-2xl bg-[#1a1b20] px-4 py-2.5 border border-white/[0.08] shadow-lg focus-within:border-[#dbb8ff]/60 focus-within:bg-[#202128] transition-all"
          >
            <span className="material-symbols-outlined text-[#988d9f] text-xl">search</span>
            <input
              type="text"
              value={homeSearchQuery}
              onChange={handleSearchChange}
              onFocus={() => {
                setShowSearchHistory(true);
                if (homeSearchQuery.trim().length >= 1) setShowSuggestionsDropdown(true);
              }}
              onBlur={() => {
                setTimeout(() => setShowSearchHistory(false), 200);
              }}
              placeholder="Search song title, artist, or lyrics line (e.g. Kesariya, Arijit, Sid Sriram)..."
              className="w-full bg-transparent text-sm text-[#e3e2e8] placeholder:text-[#988d9f] focus:outline-none font-medium"
            />
            {homeSearchQuery && (
              <button
                type="button"
                onClick={() => {
                  setHomeSearchQuery('');
                  setSuggestions([]);
                  setShowSuggestionsDropdown(false);
                }}
                className="text-[#988d9f] hover:text-[#e3e2e8] p-1"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            )}
            <button
              type="submit"
              className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#7928ca] to-[#dbb8ff] text-white flex items-center justify-center font-bold shadow-md hover:opacity-90 active:scale-95 cursor-pointer"
            >
              <span className="material-symbols-outlined text-lg">arrow_forward</span>
            </button>
          </form>

          {/* Search History Dropdown (Shown when search bar is clicked) */}
          {showSearchHistory && !homeSearchQuery && recentSearches.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-[#1e1f25] border border-white/[0.12] rounded-2xl shadow-2xl z-40 overflow-hidden backdrop-blur-xl p-2">
              <div className="px-3 py-1.5 flex items-center justify-between text-[11px] text-[#cec2d6]/70 border-b border-white/[0.06] mb-1">
                <span className="font-semibold text-[#dbb8ff] flex items-center gap-1">
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
                  className="text-[#cec2d6]/60 hover:text-white transition-colors cursor-pointer"
                >
                  Clear History
                </button>
              </div>
              <div className="space-y-1">
                {recentSearches.map((term, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      setHomeSearchQuery(term);
                      setShowSearchHistory(false);
                      performSearch(term);
                    }}
                    className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-[#2a2b33] cursor-pointer text-xs text-[#e3e2e8] transition-colors group"
                  >
                    <div className="flex items-center gap-2">
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

          {/* Autocomplete Suggestions Dropdown (Live as you type) */}
          {showSuggestionsDropdown && (suggestions.length > 0 || isSearchingSuggestions) && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-[#1e1f25] border border-white/[0.12] rounded-2xl shadow-2xl z-40 overflow-hidden backdrop-blur-xl">
              <div className="px-3 py-1.5 border-b border-white/[0.06] flex items-center justify-between text-[11px] text-[#cec2d6]/70">
                <span>Instant Suggestions</span>
                {isSearchingSuggestions && <span className="animate-spin material-symbols-outlined text-xs">sync</span>}
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-white/[0.04]">
                {suggestions.map((item) => (
                  <div
                    key={`${item.type}-${item.id}`}
                    onClick={() => handleSelectSuggestion(item)}
                    className="p-2.5 flex items-center justify-between gap-3 hover:bg-[#2a2b33] cursor-pointer transition-colors group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.title}
                          className="w-9 h-9 rounded-lg object-cover bg-[#292a2e] flex-shrink-0"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=150&auto=format&fit=crop&q=80';
                          }}
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-lg bg-[#292a2e] flex items-center justify-center text-[#dbb8ff] flex-shrink-0">
                          <span className="material-symbols-outlined text-base">
                            {item.type === 'artist' ? 'person' : item.type === 'album' ? 'album' : 'music_note'}
                          </span>
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-[#e3e2e8] group-hover:text-[#dbb8ff] truncate">
                          {item.title}
                        </p>
                        {item.artist && (
                          <p className="text-[10px] text-[#cec2d6]/70 truncate">{item.artist}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-white/[0.06] text-[#cec2d6] font-mono">
                        {item.type}
                      </span>
                      <span className="material-symbols-outlined text-[#dbb8ff] text-base opacity-0 group-hover:opacity-100 transition-opacity">
                        play_circle
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ========================================================= */}
      {/* 🌟 SEARCH RESULTS SECTION (Requested: user must play from search results) */}
      {/* ========================================================= */}
      {(searchResults.length > 0 || isSearching) && (
        <section className="flex flex-col space-y-3 bg-[#191a22] border border-[#dbb8ff]/30 p-4 sm:p-5 rounded-3xl shadow-xl animate-fade-in">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-[#7928ca] flex items-center justify-center text-white shadow-md">
                <span className="material-symbols-outlined text-xl">search</span>
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-[#e3e2e8] font-display">
                  Search Results for &ldquo;{searchedQuery}&rdquo;
                </h2>
                <p className="text-xs text-[#dbb8ff]">
                  {searchResults.length} playable songs found • Tap any song to play immediately
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {searchResults.length > 0 && (
                <button
                  onClick={handlePlayAllSearchResults}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#1db954] text-[#003b14] font-bold text-xs hover:bg-[#1ed760] active:scale-95 transition-all shadow-md cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">play_arrow</span>
                  <span>Play All</span>
                </button>
              )}
              <button
                onClick={handleClearSearch}
                className="w-8 h-8 rounded-full bg-[#282933] hover:bg-[#343542] text-[#cec2d6] flex items-center justify-center transition-colors cursor-pointer"
                title="Dismiss Search Results"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>
          </div>

          {isSearching ? (
            <div className="flex flex-col items-center justify-center py-8 space-y-2">
              <div className="w-7 h-7 border-2 border-[#dbb8ff]/30 border-t-[#dbb8ff] rounded-full animate-spin"></div>
              <p className="text-xs text-[#cec2d6]">Retrieving matching audio streams...</p>
            </div>
          ) : (
            <div className="flex flex-col space-y-2 max-h-[420px] overflow-y-auto pr-1">
              {searchResults.map((track, idx) => {
                const isCurrent = currentTrackId === track.id;
                const isPlayingThis = isCurrent && isPlaying;

                return (
                  <div
                    key={`${track.id}-${idx}`}
                    onClick={() => handlePlayTrackAndTrackStats(track, searchResults)}
                    className={`group flex items-center justify-between p-2.5 rounded-2xl transition-all cursor-pointer border ${
                      isCurrent
                        ? 'bg-[#7928ca]/30 border-[#dbb8ff] shadow-md'
                        : 'bg-[#21222b] border-white/[0.04] hover:bg-[#2c2d3a]'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <span className="text-xs font-mono text-[#cec2d6]/70 w-5 text-center flex-shrink-0 font-bold">
                        #{idx + 1}
                      </span>

                      <div className="relative w-11 h-11 rounded-xl overflow-hidden flex-shrink-0 bg-[#292a2e]">
                        <img
                          src={track.coverUrl}
                          alt={track.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80';
                          }}
                        />
                        {isPlayingThis ? (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <div className="flex items-end gap-0.5 h-4">
                              <span className="w-1 bg-[#dbb8ff] h-full animate-pulse"></span>
                              <span className="w-1 bg-[#ff9933] h-2/3 animate-pulse delay-75"></span>
                              <span className="w-1 bg-[#1db954] h-4/5 animate-pulse delay-150"></span>
                            </div>
                          </div>
                        ) : (
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <span className="material-symbols-outlined text-white text-lg">
                              play_arrow
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs sm:text-sm font-bold text-[#e3e2e8] truncate group-hover:text-[#dbb8ff] transition-colors">
                            {track.title}
                          </h4>
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-[#1db954]/20 text-[#1db954] border border-[#1db954]/30 flex-shrink-0">
                            PLAYABLE
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 min-w-0">
                          <p className="text-[11px] text-[#cec2d6]/70 truncate">
                            {track.artist}
                          </p>
                          {track.album && (
                            <span className="text-[10px] text-[#cec2d6]/50 truncate hidden sm:inline">
                              • {track.album}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0 pl-2">
                      <span className="text-xs font-mono text-[#cec2d6]/60">
                        {track.duration || '3:30'}
                      </span>
                      {/* 3-dot context menu */}
                      <div className="relative" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuTrackId(openMenuTrackId === track.id ? null : track.id);
                          }}
                          className="p-1.5 text-[#cec2d6]/50 hover:text-white transition-colors rounded-full hover:bg-white/[0.06]"
                          title="More options"
                        >
                          <span className="material-symbols-outlined text-base">more_vert</span>
                        </button>

                        {openMenuTrackId === track.id && (
                          <div className="absolute right-0 bottom-full mb-1 z-50 min-w-[170px] bg-[#1e1f28] border border-white/[0.12] rounded-2xl shadow-2xl overflow-hidden animate-fade-in">
                            <button
                              onClick={(e) => handleTrackMenuAction(e, 'playNext', track)}
                              className="flex items-center gap-2.5 w-full px-3.5 py-2.5 text-xs font-semibold text-[#e3e2e8] hover:bg-[#7928ca]/30 hover:text-[#dbb8ff] transition-colors"
                            >
                              <span className="material-symbols-outlined text-base text-[#dbb8ff]">skip_next</span>
                              Play Next
                            </button>
                            <button
                              onClick={(e) => handleTrackMenuAction(e, 'addToQueue', track)}
                              className="flex items-center gap-2.5 w-full px-3.5 py-2.5 text-xs font-semibold text-[#e3e2e8] hover:bg-[#7928ca]/30 hover:text-[#dbb8ff] transition-colors"
                            >
                              <span className="material-symbols-outlined text-base text-[#dbb8ff]">queue_music</span>
                              Add to Queue
                            </button>
                            <div className="h-px bg-white/[0.06] mx-2" />
                            <button
                              onClick={(e) => handleTrackMenuAction(e, 'like', track)}
                              className="flex items-center gap-2.5 w-full px-3.5 py-2.5 text-xs font-semibold text-[#e3e2e8] hover:bg-rose-500/20 hover:text-rose-400 transition-colors"
                            >
                              <span className="material-symbols-outlined text-base text-rose-400">{isTrackLiked(track.id, track.title) ? 'favorite' : 'favorite_border'}</span>
                              {isTrackLiked(track.id, track.title) ? 'Unlike' : 'Like'}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* ========================================================= */}
      {/* 🚀 SPOTIFY QUICK ACCESS TILES (Good Morning / Jump Back In) */}
      {/* ========================================================= */}
      {(() => {
        const pool = [
          ...recentlyPlayedTracks,
          ...onRepeatList.map((r) => r.track),
          ...activeTracks,
        ].filter((v, i, a) => a.findIndex((t) => t.id === v.id) === i);
        const tiles = pool.slice(0, 6);
        if (tiles.length === 0) return null;

        return (
          <section className="grid grid-cols-2 md:grid-cols-3 gap-2.5 sm:gap-3">
            {tiles.map((track) => {
              const isCurrent = currentTrackId === track.id;
              const isPlayingThis = isCurrent && isPlaying;
              return (
                <div
                  key={`spotify_tile_${track.id}`}
                  onClick={() => handlePlayTrackAndTrackStats(track, tiles)}
                  className={`group relative flex items-center rounded-lg overflow-hidden cursor-pointer transition-all duration-200 border ${
                    isCurrent
                      ? 'bg-[#7928ca]/30 border-[#dbb8ff]/60 shadow-[0_4px_16px_rgba(121,40,202,0.3)]'
                      : 'bg-[#1e1f26]/80 hover:bg-[#282933] border-white/[0.05] shadow-sm'
                  }`}
                >
                  <div className="relative w-12 h-12 sm:w-14 sm:h-14 flex-shrink-0 bg-[#2b2c36]">
                    <img
                      src={track.coverUrl}
                      alt={track.title}
                      className="w-full h-full object-cover shadow-[2px_0_8px_rgba(0,0,0,0.4)]"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200&auto=format&fit=crop&q=80';
                      }}
                    />
                    {isPlayingThis && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <span className="material-symbols-outlined text-[#1db954] text-base animate-pulse">
                          graphic_eq
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 px-3 py-1">
                    <h4 className="text-xs sm:text-sm font-bold text-[#e3e2e8] truncate group-hover:text-white transition-colors">
                      {track.title}
                    </h4>
                    <p className="text-[10px] text-[#cec2d6]/70 truncate mt-0.5">{track.artist}</p>
                  </div>
                  <div className="pr-3 opacity-0 group-hover:opacity-100 transition-all transform translate-x-1 group-hover:translate-x-0 flex-shrink-0">
                    <div className="w-8 h-8 rounded-full bg-[#1db954] text-[#003b14] flex items-center justify-center shadow-md hover:scale-105 transition-transform">
                      <span className="material-symbols-outlined text-base">
                        {isPlayingThis ? 'pause' : 'play_arrow'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </section>
        );
      })()}

      {/* ========================================================= */}
      {/* 🔁 ON REPEAT (Your Heavy Rotation) */}
      {/* ========================================================= */}
      {onRepeatList.length > 0 && (
        <section className="flex flex-col space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#e3e2e8] font-display flex items-center gap-2">
                <span className="material-symbols-outlined text-[#dbb8ff] text-lg">auto_awesome</span>
                <span>Your Heavy Rotation</span>
              </h2>
              <p className="text-xs text-[#cec2d6]/70">
                Curated for you
              </p>
            </div>
            <button
              onClick={() => handlePlayTrackAndTrackStats(onRepeatList[0].track, onRepeatList.map((r) => r.track))}
              className="text-xs text-[#dbb8ff] hover:underline font-semibold cursor-pointer"
            >
              Play Rotation
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {onRepeatList.slice(0, 4).map(({ track }) => {
              const isCurrent = currentTrackId === track.id;
              const isPlayingThis = isCurrent && isPlaying;

              return (
                <div
                  key={track.id}
                  onClick={() => handlePlayTrackAndTrackStats(track, onRepeatList.map((r) => r.track))}
                  className={`p-3 rounded-2xl border flex flex-col justify-between cursor-pointer transition-all hover:scale-[1.02] ${
                    isCurrent
                      ? 'bg-[#7928ca]/30 border-[#dbb8ff]'
                      : 'bg-[#1a1b20] border-white/[0.06] hover:bg-[#24252e]'
                  }`}
                >
                  <div className="relative aspect-square rounded-xl overflow-hidden mb-2.5 bg-[#292a2e]">
                    <img
                      src={track.coverUrl}
                      alt={track.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&auto=format&fit=crop&q=80';
                      }}
                    />

                    {isPlayingThis && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <div className="flex items-end gap-0.5 h-5">
                          <span className="w-1 bg-[#dbb8ff] h-full animate-pulse rounded-sm"></span>
                          <span className="w-1 bg-[#1db954] h-3/5 animate-pulse delay-75 rounded-sm"></span>
                          <span className="w-1 bg-[#ff9933] h-4/5 animate-pulse delay-150 rounded-sm"></span>
                          <span className="w-1 bg-[#dbb8ff] h-2/5 animate-pulse delay-100 rounded-sm"></span>
                        </div>
                      </div>
                    )}

                    <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${isPlayingThis ? 'opacity-0' : 'opacity-0 hover:opacity-100'}`}>
                      <span className="material-symbols-outlined text-white text-2xl">
                        play_circle
                      </span>
                    </div>
                  </div>

                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-[#e3e2e8] truncate">{track.title}</h4>
                    <p className="text-[10px] text-[#cec2d6]/70 truncate">{track.artist}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ========================================================= */}
      {/* ✨ RECOMMENDED FOR YOUR MUSIC TASTE (Requested) */}
      {/* ========================================================= */}
      {tasteProfile && tasteProfile.recommendations.length > 0 && (
        <section className="flex flex-col space-y-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[#e3e2e8] font-display flex items-center gap-2">
              <span className="material-symbols-outlined text-[#1db954] text-lg">auto_awesome</span>
              <span>Recommended For Your Taste</span>
            </h2>
            <p className="text-xs text-[#cec2d6]/70">
              Tailored to your taste
            </p>
          </div>

          <div className="flex flex-col space-y-3">
            {tasteProfile.recommendations.map((rec, rIdx) => (
              <div
                key={rIdx}
                className="p-3.5 rounded-2xl bg-gradient-to-r from-[#1f2029] to-[#181920] border border-white/[0.06] flex flex-col space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#1db954]"></span>
                    <span className="text-xs font-bold text-[#e3e2e8]">{rec.reason}</span>
                  </div>
                  <button
                    onClick={() => handlePlayTrackAndTrackStats(rec.tracks[0], rec.tracks)}
                    className="text-[11px] px-2.5 py-1 rounded-full bg-[#7928ca]/30 text-[#dbb8ff] hover:bg-[#7928ca]/60 font-semibold transition-colors cursor-pointer"
                  >
                    Play Mix
                  </button>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {rec.tracks.slice(0, 5).map((track) => (
                    <div
                      key={track.id}
                      onClick={() => handlePlayTrackAndTrackStats(track, rec.tracks)}
                      className="flex flex-col items-center text-center cursor-pointer group"
                    >
                      <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-[#292a2e] mb-1.5 border border-white/[0.05]">
                        <img
                          src={track.coverUrl}
                          alt={track.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                      <span className="text-[11px] font-semibold text-[#e3e2e8] truncate w-full group-hover:text-[#dbb8ff]">
                        {track.title}
                      </span>
                      <span className="text-[9px] text-[#cec2d6]/60 truncate w-full">
                        {track.artist}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ========================================================= */}
      {/* FEATURED GENRES & MUSICAL TRADITIONS */}
      {/* ========================================================= */}
      <section className="flex flex-col space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-base text-[#dbb8ff]">library_music</span>
            <span className="text-xs font-semibold text-[#cec2d6] uppercase tracking-wider">
              Genres & Musical Traditions
            </span>
          </div>
          <span className="text-[11px] text-[#dbb8ff] font-medium">
            {currentLangObj?.nativeName}
          </span>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-none">
          {INDIAN_LANGUAGES.map((lang) => {
            const isSelected = selectedLanguage === lang.id;
            return (
              <button
                key={lang.id}
                onClick={() => loadLanguageTracks(lang.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? 'bg-gradient-to-r from-[#ff9933] to-[#e91e63] text-white shadow-[0_0_12px_rgba(255,153,51,0.4)] scale-105 font-bold'
                    : 'bg-[#1e1f24] text-[#cec2d6] hover:bg-[#282930] hover:text-[#e3e2e8]'
                }`}
              >
                <span>{lang.flag}</span>
                <span>{lang.name}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Cultural Vibes & Indian Moods Carousel */}
      <section className="flex flex-col space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[#e3e2e8] font-display flex items-center gap-2">
              <span className="material-symbols-outlined text-[#dbb8ff] text-lg">spa</span>
              <span>Cultural Vibes & Moments</span>
            </h2>
            <p className="text-xs text-[#cec2d6]/70">
              Curated musical journeys inspired by Indian daily life & traditions
            </p>
          </div>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-none">
          {INDIAN_CULTURAL_MOODS.map((mood) => (
            <div
              key={mood.id}
              onClick={() => handlePlayMood(mood)}
              className={`flex-shrink-0 w-44 rounded-2xl bg-gradient-to-br ${mood.gradient} p-3.5 flex flex-col justify-between h-40 shadow-lg border border-white/[0.1] hover:scale-105 transition-all group cursor-pointer`}
            >
              <div className="flex items-start justify-between">
                <div className="w-9 h-9 rounded-xl bg-black/40 backdrop-blur-md flex items-center justify-center text-white">
                  <span className="material-symbols-outlined text-lg">{mood.icon}</span>
                </div>
                <div className="w-8 h-8 rounded-full bg-white/20 group-hover:bg-white text-white group-hover:text-black flex items-center justify-center transition-all shadow-md">
                  <span className="material-symbols-outlined text-lg">play_arrow</span>
                </div>
              </div>

              <div className="min-w-0">
                <h3 className="text-xs font-bold text-white tracking-wide">{mood.title}</h3>
                <p className="text-[10px] text-white/80 line-clamp-2 mt-0.5 leading-tight">
                  {mood.subtitle}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Priority Indian Live Radios */}
      <section className="flex flex-col space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#e3e2e8] font-display">
                Priority Indian Radios (Live On-Air)
              </h2>
              <p className="text-xs text-[#cec2d6]/70">
                AIR Vividh Bharati, AIR Telugu & Community 24/7 Streams
              </p>
            </div>
          </div>
          {onNavigateTab && (
            <button
              onClick={() => onNavigateTab('radio')}
              className="text-xs text-[#dbb8ff] hover:underline font-medium cursor-pointer"
            >
              View All
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {priorityRadios.slice(0, 6).map((radio) => {
            const isThisPlaying = currentTrackId === `radio_${radio.id}` && isPlaying;
            return (
              <div
                key={radio.id}
                onClick={() => handlePlayRadio(radio)}
                className={`p-2.5 rounded-xl border flex items-center gap-2.5 cursor-pointer transition-all ${
                  isThisPlaying
                    ? 'bg-[#7928ca]/30 border-[#dbb8ff]/60 shadow-md'
                    : 'bg-[#1a1b20] border-white/[0.05] hover:bg-[#25262e]'
                }`}
              >
                <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-[#292a2e]">
                  <img
                    src={radio.favicon}
                    alt={radio.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <span className="material-symbols-outlined text-white text-base">
                      {isThisPlaying ? 'graphic_eq' : 'play_arrow'}
                    </span>
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-bold text-[#e3e2e8] truncate">{radio.name}</h4>
                  <p className="text-[10px] text-[#dbb8ff] truncate">{radio.tagline || radio.language}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Latest 2026 Movie Releases & Soundtracks */}
      {latestMovieAlbums && latestMovieAlbums.length > 0 && (
        <section className="flex flex-col space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-[#e3e2e8] font-display flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#ff0055] text-lg">movie</span>
                  <span>Brand New Movie Releases & Soundtracks</span>
                </h2>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#ff0055]/10 border border-[#ff0055]/30 text-[10px] font-bold text-[#ff0055]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#ff0055] animate-pulse"></span>
                  <span>2026 Releases</span>
                </span>
              </div>
              <p className="text-xs text-[#cec2d6]/70">Latest blockbuster movie albums & full original soundtracks</p>
            </div>
          </div>

          <div className="flex gap-3.5 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-none">
            {latestMovieAlbums.map((album) => (
              <div
                key={album.id}
                onClick={() => {
                  if (album.songs && album.songs.length > 0) {
                    onPlayTrack(album.songs[0], album.songs);
                  }
                }}
                className="flex-shrink-0 w-36 sm:w-40 rounded-2xl bg-[#1b1c22] p-2.5 border border-white/[0.06] hover:bg-[#252630] hover:border-[#ff0055]/50 transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="relative aspect-square rounded-xl overflow-hidden mb-2 bg-[#282932]">
                    <img
                      src={album.image}
                      alt={album.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="w-10 h-10 rounded-full bg-[#ff0055] text-white flex items-center justify-center shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-all">
                        <span className="material-symbols-outlined text-xl">play_arrow</span>
                      </div>
                    </div>
                    <span className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded bg-black/70 backdrop-blur-md text-[9px] font-bold text-white">
                      {album.songCount || album.songs?.length || 0} tracks
                    </span>
                  </div>
                  <h3 className="text-xs font-bold text-[#e3e2e8] truncate group-hover:text-white">
                    {album.title}
                  </h3>
                  <p className="text-[11px] text-[#cec2d6]/70 truncate mt-0.5">
                    {album.artist}
                  </p>
                </div>
                <div className="mt-2 pt-1 border-t border-white/[0.04] flex items-center justify-between text-[10px] text-[#dbb8ff]">
                  <span>{album.year} Movie</span>
                  <span className="text-[#ff0055] font-semibold flex items-center gap-0.5">
                    <span>Play Album</span>
                    <span className="material-symbols-outlined text-xs">chevron_right</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Trending & Curated Tracks */}
      <section className="flex flex-col space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-[#e3e2e8] font-display flex items-center gap-2">
                <span className="material-symbols-outlined text-[#1db954] text-lg">trending_up</span>
                <span>{currentLangObj?.name} Hits & Curated Tracks</span>
              </h2>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#1db954]/10 border border-[#1db954]/30 text-[10px] font-bold text-[#1db954]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#1db954] animate-pulse"></span>
                <span>Live Charts</span>
              </span>
            </div>
            <p className="text-xs text-[#cec2d6]/70">Full song streaming • Continuously auto-updated</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleAiRefresh}
              disabled={isLoadingTracks}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#282932] hover:bg-[#353642] border border-[#dbb8ff]/30 text-[#dbb8ff] text-xs font-semibold active:scale-95 transition-all cursor-pointer disabled:opacity-50"
              title="Re-scan for new releases"
            >
              <span className="material-symbols-outlined text-sm animate-spin-slow">refresh</span>
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <button
              onClick={handlePlayAllRegional}
              className="flex items-center gap-1 px-3.5 py-1.5 rounded-full bg-[#1db954] text-[#003b14] font-bold text-xs hover:bg-[#1ed760] active:scale-95 transition-all shadow-sm cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">play_arrow</span>
              <span>Play All</span>
            </button>
          </div>
        </div>

        {isLoadingTracks ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-2">
            <div className="w-8 h-8 border-2 border-[#dbb8ff]/20 border-t-[#dbb8ff] rounded-full animate-spin"></div>
            <p className="text-xs text-[#cec2d6]">Loading curated full-length tracks...</p>
          </div>
        ) : (
          <div className="flex flex-col space-y-2">
            {activeTracks.map((track, idx) => {
              const isCurrent = currentTrackId === track.id;
              const isPlayingThis = isCurrent && isPlaying;
              const liked = isTrackLiked(track.id, track.title);

              return (
                <div
                  key={`${track.id}-${idx}`}
                  onClick={() => handlePlayTrackAndTrackStats(track, activeTracks)}
                  className={`group flex items-center justify-between p-2.5 rounded-xl transition-all cursor-pointer border ${
                    isCurrent
                      ? 'bg-[#7928ca]/25 border-[#dbb8ff]/40 shadow-sm'
                      : 'bg-[#1a1b20] border-white/[0.04] hover:bg-[#23242c]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className="text-xs font-mono text-[#cec2d6]/60 w-5 text-center flex-shrink-0 font-bold">
                      #{idx + 1}
                    </span>

                    <div className="relative w-11 h-11 rounded-lg overflow-hidden flex-shrink-0 bg-[#292a2e]">
                      <img
                        src={track.coverUrl}
                        alt={track.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80';
                        }}
                      />
                      {isPlayingThis ? (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <div className="flex items-end gap-0.5 h-4">
                            <span className="w-1 bg-[#dbb8ff] h-full animate-pulse"></span>
                            <span className="w-1 bg-[#ff9933] h-2/3 animate-pulse delay-75"></span>
                            <span className="w-1 bg-[#1db954] h-4/5 animate-pulse delay-150"></span>
                          </div>
                        </div>
                      ) : (
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <span className="material-symbols-outlined text-white text-lg">
                            play_arrow
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-xs sm:text-sm font-semibold text-[#e3e2e8] truncate group-hover:text-[#dbb8ff] transition-colors">
                          {track.title}
                        </h4>
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-[#1db954]/20 text-[#1db954] border border-[#1db954]/30 flex-shrink-0">
                          FULL
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 min-w-0">
                        <p className="text-[11px] text-[#cec2d6]/70 truncate">
                          {track.artist}
                        </p>
                        {track.genre && (
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-white/[0.06] text-[#cec2d6] border border-white/[0.08] flex-shrink-0">
                            {track.genre}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0 pl-2">
                    <span className="text-xs font-mono text-[#cec2d6]/60">
                      {track.duration}
                    </span>
                    <button
                      onClick={(e) => handleToggleLike(e, track)}
                      className={`p-1.5 transition-colors ${
                        liked ? 'text-rose-500' : 'text-[#cec2d6]/50 hover:text-white'
                      }`}
                    >
                      <span className="material-symbols-outlined text-base">
                        {liked ? 'favorite' : 'favorite_border'}
                      </span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Iconic Indian Artists */}
      <section className="flex flex-col space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[#e3e2e8] font-display">
              Trending Artists
            </h2>
            <p className="text-xs text-[#cec2d6]/70">Tap any artist to search and play their top tracks</p>
          </div>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-none">
          {INDIAN_TOP_ARTISTS.map((art) => (
            <div
              key={art.name}
              onClick={() => handleArtistClick(art)}
              className="flex-shrink-0 flex flex-col items-center space-y-1.5 w-20 group cursor-pointer"
            >
              <div className="relative w-16 h-16 rounded-full overflow-hidden p-0.5 border border-white/[0.1] group-hover:border-[#ff9933] transition-colors">
                <img
                  src={art.img}
                  alt={art.name}
                  className="w-full h-full object-cover rounded-full group-hover:scale-105 transition-transform"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200&auto=format&fit=crop&q=80';
                  }}
                />
              </div>
              <span className="text-[11px] font-semibold text-[#e3e2e8] text-center truncate w-full group-hover:text-[#dbb8ff]">
                {art.name}
              </span>
              <span className="text-[9px] text-[#cec2d6]/60 text-center truncate w-full">
                {art.tag}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
