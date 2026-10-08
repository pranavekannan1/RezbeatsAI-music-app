import {
  Track,
  RadioStation,
  UserPlaylist,
  AudioQuality,
  AppTheme,
  UserAuthProfile,
  UserTasteProfile,
  TasteRecommendation,
  GroupedSearchResults,
  MovieSearchResult,
} from '../types';

const DEFAULT_API_BASE_URL = 'https://music-app-based-on-ai-2.onrender.com';
const API_BASE_URL = (import.meta.env.VITE_API_URL || DEFAULT_API_BASE_URL).replace(/\/$/, '');

export function apiUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}

export function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  return fetch(apiUrl(path), init);
}


// Local storage keys
const LIKED_SONGS_KEY = 'rezbeatsai_liked_tracks_v5';
const RECENTLY_PLAYED_KEY = 'rezbeatsai_recently_played_v5';
const USER_PLAYLISTS_KEY = 'rezbeatsai_custom_playlists_v5';
const THEME_KEY = 'rezbeatsai_app_theme_v5';
const AUDIO_QUALITY_KEY = 'rezbeatsai_audio_quality_v5';
const AUTH_USER_KEY = 'rezbeatsai_auth_user_v5';
const TRACK_PLAY_COUNTS_KEY = 'rezbeatsai_track_play_counts_v5';

export interface IndianLanguage {
  id: string;
  name: string;
  nativeName: string;
  region: string;
  flag: string;
  query: string;
}

export const INDIAN_LANGUAGES: IndianLanguage[] = [
  { id: 'all', name: 'All India Heritage', nativeName: 'भारत National', region: 'National', flag: '🇮🇳', query: 'all' },
  { id: 'hindi', name: 'Hindi & Bollywood', nativeName: 'हिन्दी संगीत', region: 'North / Central', flag: '🪔', query: 'Hindi popular' },
  { id: 'tamil', name: 'Tamil', nativeName: 'தமிழ் இசை', region: 'South India', flag: '🌴', query: 'Tamil popular' },
  { id: 'telugu', name: 'Telugu', nativeName: 'తెలుగు సంగీతం', region: 'South India', flag: '🌺', query: 'Telugu popular' },
  { id: 'punjabi', name: 'Punjabi & Bhangra', nativeName: 'ਪੰਜਾਬੀ ਸੰਗੀਤ', region: 'North India', flag: '🥁', query: 'Punjabi popular' },
  { id: 'carnatic', name: 'Carnatic Classical', nativeName: 'ಕರ್ನಾಟಕ ಸಂಗೀತ', region: 'South India', flag: '🪈', query: 'Carnatic classical' },
  { id: 'hindustani', name: 'Hindustani Classical', nativeName: 'शास्त्रीय संगीत', region: 'North / Classical', flag: '🪕', query: 'Hindustani classical' },
  { id: 'bengali', name: 'Bengali & Rabindra', nativeName: 'বাংলা সঙ্গীত', region: 'East India', flag: '🍃', query: 'Bengali popular' },
  { id: 'marathi', name: 'Marathi & Bhavgeet', nativeName: 'मराठी गाणी', region: 'West India', flag: '☀️', query: 'Marathi popular' },
  { id: 'gujarati', name: 'Gujarati & Garba', nativeName: 'ગુજરાતી ગીતો', region: 'West India', flag: '✨', query: 'Gujarati popular' },
  { id: 'kannada', name: 'Kannada', nativeName: 'ಕನ್ನಡ ಹಾಡುಗಳು', region: 'South India', flag: '🌿', query: 'Kannada popular' },
  { id: 'malayalam', name: 'Malayalam', nativeName: 'മലയാള ഗാനങ്ങൾ', region: 'South India', flag: '🥥', query: 'Malayalam popular' },
  { id: 'sufi', name: 'Sufi & Qawwali', nativeName: 'सूफ़ी क़व्वाली', region: 'Devotional', flag: '🕊️', query: 'Sufi Qawwali' },
  { id: 'devotional', name: 'Bhakti & Mantras', nativeName: 'भक्ति एवं शांति', region: 'Spiritual', flag: '🕉️', query: 'Bhakti Devotional' },
  { id: 'bhojpuri', name: 'Bhojpuri & Folk', nativeName: 'भोजपुरी लोकगीत', region: 'East Central', flag: '🌾', query: 'Bhojpuri folk' },
  { id: 'rajasthani', name: 'Rajasthani & Thar', nativeName: 'राजस्थानी मांड', region: 'West India', flag: '🏜️', query: 'Rajasthani folk' },
];

export interface CulturalMood {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  gradient: string;
  searchKey: string;
}

export const INDIAN_CULTURAL_MOODS: CulturalMood[] = [
  {
    id: 'chai-time',
    title: 'Chai Time Acoustic',
    subtitle: 'Warm morning strums & relaxing indie guitar (CC-BY)',
    icon: 'local_cafe',
    gradient: 'from-[#603813] to-[#b29f94]',
    searchKey: 'chai acoustic',
  },
  {
    id: 'sitar-meditation',
    title: 'Sitar Raga Yaman & Bag Bhim',
    subtitle: 'Authentic classical sitar recitals (CC BY-SA)',
    icon: 'self_improvement',
    gradient: 'from-[#782800] to-[#f47c00]',
    searchKey: 'sitar raga',
  },
  {
    id: 'temple-peace',
    title: 'Temple Bells & Peace',
    subtitle: 'Sacred temple sanctuary & deep meditation (CC-BY)',
    icon: 'wb_sunny',
    gradient: 'from-[#800020] to-[#ff6f00]',
    searchKey: 'temple peace',
  },
  {
    id: 'late-night-lofi',
    title: 'Late Night Desi Lofi',
    subtitle: 'Deep midnight ambient soundscapes & chill (CC-BY)',
    icon: 'nights_stay',
    gradient: 'from-[#140033] to-[#512da8]',
    searchKey: 'midnight lofi',
  },
  {
    id: 'monsoon-melodies',
    title: 'Monsoon Rain Vibes',
    subtitle: 'Clear waters, refreshing rain & bansuri flute (CC-BY)',
    icon: 'water_drop',
    gradient: 'from-[#002f6c] to-[#0288d1]',
    searchKey: 'monsoon rain',
  },
  {
    id: 'desert-caravan',
    title: 'Rajasthan Desert Caravan',
    subtitle: 'Silk route oud, tabla rhythms & folk tales (CC-BY)',
    icon: 'landscape',
    gradient: 'from-[#8d6e63] to-[#d7ccc8]',
    searchKey: 'desert caravan',
  },
];

export const INDIAN_TOP_ARTISTS = [
  { name: 'Tito Dutta', tag: 'Sitar Maestro', img: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=80', license: 'CC BY-SA 3.0' },
  { name: 'Kevin MacLeod', tag: 'Creative Commons Icon', img: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=500&auto=format&fit=crop&q=80', license: 'CC-BY 4.0' },
  { name: 'Ashok Ayengar', tag: 'Sitar & Tabla Live', img: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=500&auto=format&fit=crop&q=80', license: 'CC BY-SA 4.0' },
  { name: 'Ranjit Makkuni', tag: 'Varanasi Ragas', img: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=500&auto=format&fit=crop&q=80', license: 'CC BY-SA 3.0' },
  { name: 'L. Ramakrishnan', tag: 'Carnatic Strings', img: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&auto=format&fit=crop&q=80', license: 'CC0 Public Domain' },
  { name: 'Bansuri Arvind', tag: 'Bamboo Flute Master', img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=500&auto=format&fit=crop&q=80', license: 'CC BY-SA 3.0' },
];

// Royalty-free tracks removed — all music now served via YouTube Data API

/**
 * Direct YouTube Data API v3 Search Client
 * Uses VITE_YOUTUBE_API_KEY from .env to fetch all real songs available now and in future.
 */
export async function searchYouTubeDirect(query: string, maxResults: number = 25): Promise<Track[]> {
  const apiKey = (import.meta as any).env?.VITE_YOUTUBE_API_KEY;
  if (!apiKey || !query || !query.trim()) return [];

  try {
    const musicQuery = /\b(song|track|audio|music)\b/i.test(query) ? query.trim() : `${query.trim()} song`;
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoCategoryId=10&videoEmbeddable=true&maxResults=${maxResults}&q=${encodeURIComponent(musicQuery)}&key=${apiKey}`;
    const res = await fetch(url);
    if (!res.ok) {
      console.warn('Direct YouTube API error status:', res.status);
      return [];
    }
    const data = await res.json();
    if (!data.items || !Array.isArray(data.items)) return [];

    return data.items
      .filter((item: any) => item.id?.videoId && item.snippet)
      .map((item: any) => {
        const vid = item.id.videoId;
        const snip = item.snippet;
        const rawTitle = (snip.title || 'Untitled')
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>');

        // Clean up noisy tags like (Official Music Video), (Lyric Video), etc.
        const cleanTitle = rawTitle
          .replace(/\s*[\(\[](Official\s*(Music\s*)?Video|Audio|Lyric\s*Video|HD|4K|Visualizer|Full\s*Song|Video)[\)\]]/gi, '')
          .trim();

        return {
          id: `youtube_${vid}`,
          title: cleanTitle || rawTitle,
          artist: (snip.channelTitle || 'Artist').replace(/ - Topic$/i, '').replace(/VEVO$/i, ''),
          album: 'Single / YouTube',
          duration: '03:45',
          durationSec: 225,
          coverUrl: snip.thumbnails?.high?.url || snip.thumbnails?.medium?.url || `https://img.youtube.com/vi/${vid}/hqdefault.jpg`,
          audioUrl: '',
          genre: 'Latest Music',
          language: 'Worldwide',
          isCopyrightSafe: true,
          isRoyaltyFree: false,
          isFullSong: true,
          country: 'Worldwide',
          tags: ['youtube', 'latest', 'streaming'],
        };
      });
  } catch (err) {
    console.warn('YouTube search client error:', err);
    return [];
  }
}

export interface UserLocationInfo {
  country: string;
  region: string;
  language: string;
  isAutoDetected: boolean;
}

let cachedLocation: UserLocationInfo | null = null;

/**
 * Automatically detect user location and regional music preference (Zero manual switcher needed)
 */
export async function detectUserLocation(): Promise<UserLocationInfo> {
  if (cachedLocation) return cachedLocation;

  try {
    const res = await apiFetch('/api/music/location');
    if (res.ok) {
      const data = await res.json();
      if (data.country) {
        cachedLocation = {
          country: data.country,
          region: data.region || data.country,
          language: data.language || 'hindi',
          isAutoDetected: true,
        };
        return cachedLocation;
      }
    }
  } catch (e) {
    console.warn('Location detection fallback:', e);
  }

  // Fallback to client browser timezone heuristics
  try {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    if (timeZone.includes('Calcutta') || timeZone.includes('Kolkata') || timeZone.includes('India')) {
      cachedLocation = {
        country: 'India',
        region: 'India',
        language: 'hindi',
        isAutoDetected: true,
      };
      return cachedLocation;
    }
  } catch {
    // Ignore
  }

  cachedLocation = {
    country: 'India',
    region: 'India',
    language: 'hindi',
    isAutoDetected: true,
  };
  return cachedLocation;
}

/**
 * Fetch the stable first-party catalog without relying on external providers.
 */
export async function getCatalogTracks(query = '', page = 1, limit = 20): Promise<Track[]> {
  try {
    const params = new URLSearchParams({
      q: query,
      page: String(page),
      limit: String(limit),
    });
    const res = await apiFetch(`/api/music/catalog?${params.toString()}`);
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.tracks)) {
        return data.tracks;
      }
    }
  } catch (err) {
    console.warn('Catalog API fallback:', err);
  }

  const cleanQuery = query.trim().toLowerCase();
  if (cleanQuery) {
    return searchWorldwideCatalog(cleanQuery, limit);
  }
  return [];
}

/**
 * Live alphabet-by-alphabet instant autocomplete suggestions
 */
export interface SearchSuggestionItem {
  id: string;
  title: string;
  artist?: string;
  image?: string;
  type: 'song' | 'album' | 'artist';
}

export async function getLiveSearchSuggestions(query: string): Promise<SearchSuggestionItem[]> {
  const cleanQ = query.trim();
  if (!cleanQ) return [];

  try {
    const res = await apiFetch(`/api/music/suggest?q=${encodeURIComponent(cleanQ)}`);
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.suggestions)) {
        return data.suggestions;
      }
    }
  } catch (err) {
    console.warn('Autocomplete suggest error:', err);
  }

  return [];
}

/**
 * Fetch verified Copyright-Safe & Royalty-Free songs tailored to detected region
 */
export async function getTrendingIndianSongs(language: string = 'all'): Promise<Track[]> {
  try {
    const res = await apiFetch(`/api/music/trending?language=${encodeURIComponent(language)}`);
    if (res.ok) {
      const data = await res.json();
      const videos = data.tracks || data.videos;
      if (data.success && Array.isArray(videos) && videos.length > 0) {
        return videos.map(v => ({
            id: v.videoId || v.id,
            title: v.title,
            artist: v.author || v.artist || 'Unknown',
            album: 'Single',
            duration: v.duration || '03:30',
            durationSec: 210,
            coverUrl: v.thumbnail || v.coverUrl || '',
            audioUrl: `/api/music/resolve-yt-audio?id=${v.videoId || v.id}`,
            genre: 'Pop',
            language: 'Any',
            isCopyrightSafe: true,
            isRoyaltyFree: false,
            isFullSong: true,
            country: 'Worldwide',
            tags: ['youtube']
        }));
      }
    }
  } catch (err) {
    console.warn('Using verified royalty-free client catalog:', err);
  }

  // Filter local catalog based on selected tradition
  if (language === 'all') return [];
  return [].filter(
    (t) =>
      t.genre?.toLowerCase().includes(language.toLowerCase()) ||
      t.tags?.some((tag) => tag.toLowerCase().includes(language.toLowerCase()))
  ).concat([]);
}

/**
 * Fetch Brand New 2026/2025 Movie Soundtrack Albums
 */
export async function getLatestMovieAlbums(language: string = 'all'): Promise<MovieSearchResult[]> {
  try {
    const res = await apiFetch(`/api/music/new-movies?language=${encodeURIComponent(language)}`);
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.albums && data.albums.length > 0) {
        return data.albums;
      }
      if (data.albums && data.albums.length > 0) {
        return data.albums;
      }
    }
  } catch (err) {
    console.warn('Failed to fetch new movie albums:', err);
  }

  return [];
}

/**
 * Live latest catalog. Results come from remote music catalogs and refresh automatically.
 * No song list is stored in the frontend bundle.
 */
export async function getLiveLatestMusic(language: string = 'all'): Promise<{ songs: Track[]; albums: any[]; updatedAt?: string; providers?: string[] }> {
  try {
    const res = await apiFetch(`/api/music/latest?language=${encodeURIComponent(language)}`);
    if (res.ok) {
      const data = await res.json();
      if (data.success) return { songs: data.songs || [], albums: data.albums || [], updatedAt: data.updatedAt, providers: data.providers || [] };
    }
  } catch (err) {
    console.warn('Live latest catalog unavailable:', err);
  }
  return { songs: [], albums: [] };
}

/**
 * Retrieve YouTube Video details for a specific track (uses Groq + regex scraper fallback)
 */
export async function getYouTubeVideoDetails(title: string, artist: string): Promise<{ videoId: string; videoTitle: string; channelName: string } | null> {
  try {
    const res = await apiFetch(`/api/music/youtube-video?title=${encodeURIComponent(title)}&artist=${encodeURIComponent(artist)}`);
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.videoId) {
        return {
          videoId: data.videoId,
          videoTitle: data.videoTitle || `${title} Video`,
          channelName: data.channelName || artist || 'YouTube Video',
        };
      }
    }
  } catch (err) {
    console.warn('Failed to fetch YouTube video ID:', err);
  }
  return null;
}

/**
 * Find YouTube videos that match a catalog track (ranked best-first, embeddable only).
 * Used to play full-length audio for tracks whose own source is only a ~30s preview
 * (iTunes / Deezer). Never throws; returns [] when nothing usable is found.
 */
/**
 * Tell the server a track actually started playing. Used only to rank future
 * search/trending results toward songs this app's users genuinely listen to —
 * never sent for queued-but-unplayed tracks, and never blocks playback if it fails.
 */
export function reportPlay(track: Pick<Track, 'title' | 'artist'>): void {
  if (!track?.title) return;
  apiFetch('/api/music/play', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: track.title, artist: track.artist || '' }),
  }).catch(() => {
    // Best-effort signal only; playback already succeeded regardless.
  });
}

export async function findYouTubeMatches(
  track: Pick<Track, 'title' | 'artist' | 'durationSec'>
): Promise<string[]> {
  // 1. First try server-side YouTube match endpoint
  try {
    const qs = new URLSearchParams({
      title: track.title,
      artist: track.artist || '',
      duration: String(Math.round(track.durationSec || 0)),
    });
    const res = await apiFetch(`/api/music/yt-match?${qs.toString()}`, {
      signal: AbortSignal.timeout(4500),
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.success && Array.isArray(data.candidates) && data.candidates.length > 0) {
        const ids = data.candidates
          .map((c: { videoId?: string }) => c?.videoId)
          .filter((id: unknown): id is string => typeof id === 'string' && /^[\w-]{11}$/.test(id));
        if (ids.length > 0) return ids;
      }
    }
  } catch (err) {
    console.warn('Server YouTube match lookup skipped or timed out:', err);
  }

  // 2. Client-side direct YouTube Data API fallback (instant & reliable)
  try {
    const cleanTitle = (track.title || '').replace(/\s*[\(\[].*?[\)\]]/g, '').trim();
    const cleanArtist = (track.artist || '').split(',')[0].trim();
    const query = [cleanTitle, cleanArtist].filter(Boolean).join(' ');
    if (query) {
      const directResults = await searchYouTubeDirect(query, 6);
      if (directResults.length > 0) {
        const ids = directResults
          .map((t) => t.id.replace(/^youtube_|^yt_/, ''))
          .filter((id) => /^[\w-]{11}$/.test(id));
        if (ids.length > 0) return ids;
      }
    }
  } catch (err) {
    console.warn('Direct YouTube search fallback error:', err);
  }

  return [];
}

export async function findFullSongCatalogMatch(
  track: Pick<Track, 'title' | 'artist' | 'durationSec'>
): Promise<Track | null> {
  try {
    const params = new URLSearchParams({
      title: track.title,
      artist: track.artist || '',
      duration: String(Math.round(track.durationSec || 0)),
    });
    const response = await apiFetch(`/api/music/full-song-match?${params.toString()}`, {
      signal: AbortSignal.timeout(15000),
    });
    if (response.status === 404) return null;
    if (!response.ok) {
      console.warn('Full-song catalog lookup failed:', response.status);
      return null;
    }

    const data = await response.json();
    const candidate = data?.track as Track | undefined;
    if (
      !data?.success ||
      !candidate?.isFullSong ||
      !candidate.audioUrl ||
      !candidate.audioUrl.startsWith('https://')
    ) {
      return null;
    }
    return candidate;
  } catch (error) {
    console.warn('Full-song catalog lookup unavailable:', error);
    return null;
  }
}

/**
 * Perform a dynamic search on YouTube to get multiple matching videos
 */
export async function searchYouTubeVideos(query: string): Promise<any[]> {
  try {
    const res = await apiFetch(`/api/music/youtube-search?q=${encodeURIComponent(query)}`);
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.videos) {
        return data.videos;
      }
    }
  } catch (err) {
    console.warn('Failed to search YouTube videos:', err);
  }
  return [];
}

/**
 * Trigger AI Dynamic Song Refresh on demand
 */
export async function triggerAiMusicRefresh(language: string = 'all'): Promise<boolean> {
  try {
    const res = await apiFetch('/api/music/ai-refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ language }),
    });
    if (res.ok) {
      const data = await res.json();
      return !!data.success;
    }
  } catch (e) {
    console.warn('AI music refresh error:', e);
  }
  return false;
}

/**
 * Universal Search across 100% Copyright-Free & CC Catalog + Wikimedia Commons
 */
const SEARCH_STOP_WORDS = new Set([
  'a', 'an', 'and', 'audio', 'from', 'full', 'music', 'official', 'song', 'songs',
  'the', 'video', 'lyrics', 'lyric', 'hd', '4k', 'visualizer',
]);
const SEARCH_EXCLUDED_VARIANTS = [
  '8d', 'bass boosted', 'cover', 'fan made', 'karaoke', 'live', 'mashup',
  'instrumental', 'reaction', 'remix', 'reverb', 'shorts', 'slowed', 'sped up',
];

function normalizeMusicSearchQuery(query: string): string {
  const titlePart = query.trim().split(/\s+\|\s+/)[0];
  return titlePart
    .replace(/\s*[-–—]\s*(?:official\s+)?(?:lyrical?\s+)?(?:music\s+)?(?:video\s+song|video|audio|lyrics?|song).*$/i, '')
    .replace(/\s*[\[(](?:official|audio|video|lyrics?|music video|lyrical video)[^\])]*[\])]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function scoreMusicSearchResult(track: Track, query: string): number | null {
  const toSearchText = (value: string) => ` ${value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()} `;
  const normalizedQuery = toSearchText(normalizeMusicSearchQuery(query));
  const normalizedTitle = toSearchText(track.title);
  if (SEARCH_EXCLUDED_VARIANTS.some((term) =>
    normalizedTitle.includes(` ${term} `) && !normalizedQuery.includes(` ${term} `)
  )) {
    return null;
  }

  const normalize = (value: string) => value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter((token) => (token.length > 1 || /^\d+$/.test(token)) && !SEARCH_STOP_WORDS.has(token));

  const queryTokens = normalize(query);
  if (queryTokens.length === 0) return 1;

  const titleTokens = new Set(normalize(track.title));
  const artistTokens = new Set(normalize(track.artist || ''));
  const albumTokens = new Set(normalize(track.album || ''));
  const titleCoverage = queryTokens.filter((token) => titleTokens.has(token)).length / queryTokens.length;
  const artistCoverage = queryTokens.filter((token) => artistTokens.has(token)).length / queryTokens.length;
  const metadataCoverage = queryTokens.filter((token) =>
    titleTokens.has(token) || artistTokens.has(token) || albumTokens.has(token)
  ).length / queryTokens.length;

  const isRelevant = queryTokens.length === 1
    ? Math.max(titleCoverage, artistCoverage) >= 1
    : titleCoverage >= 0.65 || artistCoverage >= 0.7 || metadataCoverage >= 0.8;
  if (!isRelevant) return null;
  return titleCoverage * 100 + artistCoverage * 45 + metadataCoverage * 15;
}

export async function searchWorldwideCatalog(query: string, limit: number = 25): Promise<Track[]> {
  if (!query || !query.trim()) {
    return [];
  }

  const cleanQ = normalizeMusicSearchQuery(query) || query.trim();
  const params = new URLSearchParams({ q: cleanQ, limit: String(Math.max(limit, 40)) });
  const [catalogResult, directResult] = await Promise.allSettled([
    apiFetch(`/api/music/search?${params.toString()}`, {
      signal: AbortSignal.timeout(15000),
    }).then(async (response) => {
      if (!response.ok) return [];
      const data = await response.json();
      return data.success && Array.isArray(data.tracks) ? data.tracks as Track[] : [];
    }),
    searchYouTubeDirect(cleanQ, Math.max(limit, 25)),
  ]);
  const candidates: Track[] = [];
  if (catalogResult.status === 'fulfilled') candidates.push(...catalogResult.value);
  else console.warn('Catalog search failed:', catalogResult.reason);
  if (directResult.status === 'fulfilled') candidates.push(...directResult.value);
  else console.warn('Direct YouTube search failed:', directResult.reason);

  const deduplicated = new Map<string, { track: Track; score: number }>();
  for (const track of candidates) {
    const score = scoreMusicSearchResult(track, cleanQ);
    if (score === null) continue;

    const videoId = track.id.match(/^(?:youtube_|yt_)([\w-]{11})$/)?.[1];
    const key = videoId ? `youtube_${videoId}` : track.id;
    const existing = deduplicated.get(key);
    if (!existing || score > existing.score) deduplicated.set(key, { track, score });
  }
  const ranked = Array.from(deduplicated.values())
    .sort((left, right) => right.score - left.score)
    .map(({ track }) => track);
  if (ranked.length > 0) return ranked.slice(0, limit);

  // The backend returns verified video metadata; convert it to the track shape
  // expected by the results view and player.
  try {
    const response = await apiFetch(`/api/music/youtube-search?q=${encodeURIComponent(cleanQ)}`);
    if (!response.ok) return [];

    const data = await response.json();
    if (!data.success || !Array.isArray(data.videos)) return [];

    const fallbackTracks = data.videos
      .filter((video: any) =>
        typeof video?.videoId === 'string' &&
        /^[\w-]{11}$/.test(video.videoId) &&
        typeof video?.title === 'string' &&
        video.title.trim(),
      )
      .slice(0, limit)
      .map((video: any): Track => {
        const duration = typeof video.duration === 'string' ? video.duration : '03:45';
        const durationParts = duration.split(':').map(Number);
        const durationSec = durationParts.every(Number.isFinite)
          ? durationParts.reduce((total, part) => total * 60 + part, 0)
          : 225;
        const watchUrl = `https://www.youtube.com/watch?v=${video.videoId}`;

        return {
          id: `youtube_${video.videoId}`,
          title: video.title.trim(),
          artist: video.author || 'YouTube Artist',
          album: 'YouTube',
          duration,
          durationSec: durationSec || 225,
          coverUrl: video.thumbnail || `https://img.youtube.com/vi/${video.videoId}/hqdefault.jpg`,
          audioUrl: watchUrl,
          sourceUrl: watchUrl,
          genre: 'Music',
          language: 'Worldwide',
          isFullSong: true,
          tags: ['youtube', 'search'],
        };
      });
    return fallbackTracks
      .map((track) => ({ track, score: scoreMusicSearchResult(track, cleanQ) }))
      .filter((result): result is { track: Track; score: number } => result.score !== null)
      .sort((left, right) => right.score - left.score)
      .slice(0, limit)
      .map(({ track }) => track);
  } catch (error) {
    console.warn('Backend YouTube search failed:', error);
    return [];
  }
}

/**
 * Universal Grouped Search: Categorized by Movie Name, Artist Name, Playlists, and Songs all together
 */
export async function searchWorldwideGrouped(query: string): Promise<GroupedSearchResults> {
  if (!query || !query.trim()) {
    return {
      query: '',
      songs: [],
      movies: [],
      artists: [],
      playlists: [],
    };
  }

  const cleanQ = query.trim().toLowerCase();

  try {
    const res = await apiFetch(`/api/music/search/grouped?q=${encodeURIComponent(cleanQ)}`);
    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        return {
          query: data.query || query,
          songs: data.songs || [],
          movies: data.movies || [],
          artists: data.artists || [],
          playlists: data.playlists || [],
        };
      }
    }
  } catch (err) {
    console.warn('Grouped search fallback to client:', err);
  }

  // Client fallback using direct YouTube search
  try {
    const directSongs = await searchYouTubeDirect(cleanQ, 20);
    return {
      query,
      songs: directSongs,
      movies: [],
      artists: [],
      playlists: directSongs.length > 0 ? [
        {
          id: `pl_${cleanQ}`,
          title: `Curated "${query}" Collection`,
          image: directSongs[0]?.coverUrl || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&auto=format&fit=crop&q=80',
          trackCount: directSongs.length,
          songs: directSongs,
        },
      ] : [],
    };
  } catch {
    return {
      query,
      songs: [],
      movies: [],
      artists: [],
      playlists: [],
    };
  }
}

/**
 * Fetch Official Open Broadcast & Public Service Radios (AIR Vividh Bharati, AIR Telugu, Radio Madhuban, etc.)
 */
export async function getIndianPriorityRadios(): Promise<RadioStation[]> {
  try {
    const res = await apiFetch('/api/music/radios/indian');
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.radios) {
        return data.radios.map((r: any) => ({
          id: r.id,
          name: r.name,
          country: 'India',
          countryCode: 'IN',
          genre: r.genre,
          streamUrl: r.streamUrl,
          favicon: r.logo,
          language: r.language,
          state: r.state,
          tagline: r.tagline,
        }));
      }
    }
  } catch (err) {
    console.warn('Using client fallback for priority Indian radios:', err);
  }

  return [
    {
      id: 'air-vividh-bharati',
      name: 'AIR Vividh Bharati',
      country: 'India',
      countryCode: 'IN',
      genre: 'Classic Melodies & Public Heritage',
      streamUrl: 'https://stream.zeno.fm/rm4i9pdex3cuv',
      favicon: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=300&auto=format&fit=crop&q=80',
      language: 'Hindi',
      state: 'Mumbai',
      tagline: 'Prasar Bharati - National Public Service Broadcaster',
    },
    {
      id: 'air-telugu-one',
      name: 'AIR Telugu One',
      country: 'India',
      countryCode: 'IN',
      genre: 'Carnatic, Folk & Regional Culture',
      streamUrl: 'https://stream-151.zeno.fm/7kbt507d3qzuv',
      favicon: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&auto=format&fit=crop&q=80',
      language: 'Telugu',
      state: 'South Zone',
      tagline: 'All India Radio South Regional Cultural Broadcast',
    },
    {
      id: 'radio-madhuban',
      name: 'Radio Madhuban 90.4 FM',
      country: 'India',
      countryCode: 'IN',
      genre: 'Community Radio & Peace Meditation',
      streamUrl: 'https://stream.zeno.fm/0zkr7x8ztm0uv?zs=WTPQx8TiQXSo11XU0iyTAQ',
      favicon: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=300&auto=format&fit=crop&q=80',
      language: 'Hindi',
      state: 'Rajasthan',
      tagline: 'Licensed Community Broadcaster - Spiritual Harmony',
    },
    {
      id: 'tirupati-bhakti-radio',
      name: 'Tirupati Balaji & Bhakti Radio',
      country: 'India',
      countryCode: 'IN',
      genre: 'Sacred Mantras & Vedic Chants',
      streamUrl: 'https://radio.mslivecdn.com:6278/stream',
      favicon: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=300&auto=format&fit=crop&q=80',
      language: 'Sanskrit / Telugu',
      state: 'Andhra Pradesh',
      tagline: '24/7 Traditional Sacred Broadcast',
    },
  ];
}

/**
 * Fetch Worldwide Live Open Radio Stations
 */
export async function getLiveWorldRadio(countryCode?: string, query?: string): Promise<RadioStation[]> {
  const mirrors = [
    'https://de1.api.radio-browser.info',
    'https://nl1.api.radio-browser.info',
    'https://at1.api.radio-browser.info',
  ];

  for (const mirror of mirrors) {
    try {
      let url = `${mirror}/json/stations/topclick/40`;
      if (query && query.trim()) {
        url = `${mirror}/json/stations/byname/${encodeURIComponent(query)}?limit=40`;
      } else if (countryCode && countryCode.trim()) {
        url = `${mirror}/json/stations/bycountrycodeexact/${countryCode.toLowerCase()}?limit=40&order=clickcount&reverse=true`;
      }

      const res = await fetch(url);
      if (!res.ok) continue;
      const data = await res.json();
      return (data || []).map((s: any) => ({
        id: s.stationuuid,
        name: s.name,
        country: s.country,
        countryCode: s.countrycode,
        genre: s.tags || s.state || 'Live Radio',
        streamUrl: s.url_resolved || s.url,
        favicon: s.favicon || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200&auto=format&fit=crop&q=80',
        bitrate: s.bitrate,
        votes: s.votes,
      }));
    } catch {
      continue;
    }
  }

  return getIndianPriorityRadios();
}

// Convert Radio Station into playable Track format
export function convertRadioToTrack(station: RadioStation): Track {
  return {
    id: `radio_${station.id}`,
    title: station.name,
    artist: station.tagline || (station.state ? `${station.state} Live Radio` : 'Live Broadcast'),
    album: station.genre || `${station.country} Station`,
    duration: 'LIVE',
    durationSec: 0,
    coverUrl:
      station.favicon ||
      'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
    audioUrl: station.streamUrl,
    genre: station.genre,
    country: station.country,
    isLiveRadio: true,
    isLossless: false,
    isCopyrightSafe: true,
    isRoyaltyFree: false,
    license: 'Public Service / Community Open Broadcast',
    licenseUrl: 'https://prasarbharati.gov.in',
    attribution: `${station.name} - Open Cultural Transmission`,
    tags: ['Live 24/7', 'Radio', station.language || station.country],
  };
}

// --- Local Storage Management (Liked Songs, Recents, Playlists) ---

export function getLikedTracks(): Track[] {
  try {
    const raw = localStorage.getItem(LIKED_SONGS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveLikedTrack(track: Track): boolean {
  try {
    const current = getLikedTracks();
    const index = current.findIndex((t) => t.id === track.id || t.title === track.title);
    if (index >= 0) {
      current.splice(index, 1);
      localStorage.setItem(LIKED_SONGS_KEY, JSON.stringify(current));
      return false; // unliked
    } else {
      current.unshift(track);
      localStorage.setItem(LIKED_SONGS_KEY, JSON.stringify(current));
      return true; // liked
    }
  } catch {
    return false;
  }
}

export function isTrackLiked(trackId: string, trackTitle?: string): boolean {
  try {
    const current = getLikedTracks();
    return current.some((t) => t.id === trackId || (trackTitle && t.title === trackTitle));
  } catch {
    return false;
  }
}

export function getRecentlyPlayed(): Track[] {
  try {
    const raw = localStorage.getItem(RECENTLY_PLAYED_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addToRecentlyPlayed(track: Track): void {
  try {
    const current = getRecentlyPlayed();
    const filtered = current.filter((t) => t.id !== track.id && t.title !== track.title);
    filtered.unshift(track);
    const newHistory = filtered.slice(0, 40);
    localStorage.setItem(RECENTLY_PLAYED_KEY, JSON.stringify(newHistory));

    // Firestore sync handled separately via firebase.ts saveAccountSearchHistory
  } catch {
    // Ignore
  }
}

export function getUserPlaylists(): UserPlaylist[] {
  // Existing implementation unchanged
  try {
    const raw = localStorage.getItem(USER_PLAYLISTS_KEY);
    if (raw) return JSON.parse(raw);

    const initial: UserPlaylist[] = [
      {
        id: 'pl_raga_sanctuary',
        title: 'Sacred Ragas & Peace',
        description: '100% Copyright-Free Classical Sitar & Bansuri',
        coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
        tracks: [
          ({} as Track),
          ({} as Track),
          ({} as Track),
        ],
        createdAt: Date.now(),
      },
      {
        id: 'pl_chai_time',
        title: 'Chai Time Acoustic Strums',
        description: 'Peaceful indie morning acoustic strums (CC-BY)',
        coverUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80',
        tracks: [
          ({} as Track),
          ({} as Track),
          ({} as Track),
        ],
        createdAt: Date.now() - 100000,
      },
    ];
    localStorage.setItem(USER_PLAYLISTS_KEY, JSON.stringify(initial));
    return initial;
  } catch {
    return [];
  }
}

export function createPlaylist(title: string, description: string): UserPlaylist {
  const pl: UserPlaylist = {
    id: `pl_${Date.now()}`,
    title,
    description: description || 'Royalty-Free Playlist',
    coverUrl:
      'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80',
    tracks: [],
    createdAt: Date.now(),
  };
  try {
    const list = getUserPlaylists();
    list.unshift(pl);
    localStorage.setItem(USER_PLAYLISTS_KEY, JSON.stringify(list));
  } catch {
    // Ignore
  }
  return pl;
}

export function addTrackToPlaylist(playlistId: string, track: Track): boolean {
  try {
    const list = getUserPlaylists();
    const pl = list.find((p) => p.id === playlistId);
    if (!pl) return false;
    if (pl.tracks.some((t) => t.id === track.id)) return false;
    pl.tracks.push(track);
    if (!pl.coverUrl && track.coverUrl) pl.coverUrl = track.coverUrl;
    localStorage.setItem(USER_PLAYLISTS_KEY, JSON.stringify(list));
    return true;
  } catch {
    return false;
  }
}

export function deletePlaylist(playlistId: string): void {
  try {
    const list = getUserPlaylists().filter((p) => p.id !== playlistId);
    localStorage.setItem(USER_PLAYLISTS_KEY, JSON.stringify(list));
  } catch {
    // Ignore
  }
}

// ==========================================
// 1. THEME MANAGEMENT (3 Themes: Dark, Light, Sunset)
// ==========================================
// dark (Midnight Obsidian), light (Clean Studio Light), sunset (Sunset Saffron Amber)

export function getAppTheme(): AppTheme {
  try {
    const stored = localStorage.getItem(THEME_KEY) as AppTheme;
    if (stored === 'light' || stored === 'dark' || stored === 'sunset') {
      return stored;
    }
    if (stored === 'twilight' || stored === 'sapphire') return 'dark';
    if (stored === 'sandalwood') return 'sunset';
  } catch {
    // Ignore
  }
  return 'dark';
}

export function setAppTheme(theme: AppTheme): void {
  try {
    localStorage.setItem(THEME_KEY, theme);
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme);
      document.body.setAttribute('data-theme', theme);
    }
    window.dispatchEvent(new CustomEvent('rezbeatsai_theme_change', { detail: theme }));
  } catch {
    // Ignore
  }
}

// Automatically ensure DOM has the theme attribute set
if (typeof document !== 'undefined') {
  const initialTheme = getAppTheme();
  document.documentElement.setAttribute('data-theme', initialTheme);
  document.body.setAttribute('data-theme', initialTheme);
}

// ==========================================
// 2. AUDIO QUALITY SETTINGS (User Selected)
// ==========================================
// 320k (Ultra HD Master), 160k (High Quality), 96k (Standard), 48k (Data Saver)

export function getAudioQuality(): AudioQuality {
  try {
    const stored = localStorage.getItem(AUDIO_QUALITY_KEY) as AudioQuality;
    if (stored && ['320k', '160k', '96k', '48k'].includes(stored)) {
      return stored;
    }
  } catch {
    // Ignore
  }
  return '320k'; // Default to pristine 320kbps
}

export function setAudioQuality(quality: AudioQuality): void {
  try {
    localStorage.setItem(AUDIO_QUALITY_KEY, quality);
    window.dispatchEvent(new CustomEvent('rezbeatsai_quality_change', { detail: quality }));
  } catch {
    // Ignore
  }
}

export function formatQualityLabel(quality: AudioQuality): { label: string; desc: string; badge: string } {
  switch (quality) {
    case '320k':
      return { label: 'Highest Available', desc: 'Use the best bitrate provided by the source', badge: 'Up to 320 kbps' };
    case '160k':
      return { label: 'High Quality', desc: 'Limit stream bitrate to about 160 kbps', badge: 'Up to 160 kbps' };
    case '96k':
      return { label: 'Standard', desc: 'Limit stream bitrate to about 96 kbps', badge: 'Up to 96 kbps' };
    case '48k':
      return { label: 'Data Saver', desc: 'Use the closest available stream at or below 48 kbps', badge: 'Up to 48 kbps' };
  }
}

export function applyQualityToTrackUrl(track: Track, quality?: AudioQuality): Track {
  const q = quality || getAudioQuality();
  if (!track.audioUrl) return track;

  let targetSuffix = '_320.mp4';
  if (q === '160k') targetSuffix = '_160.mp4';
  else if (q === '96k') targetSuffix = '_96.mp4';
  else if (q === '48k') targetSuffix = '_48.mp4';

  let newUrl = track.audioUrl;
  if (newUrl.includes('_320.mp4') || newUrl.includes('_160.mp4') || newUrl.includes('_96.mp4') || newUrl.includes('_48.mp4')) {
    newUrl = newUrl
      .replace('_320.mp4', targetSuffix)
      .replace('_160.mp4', targetSuffix)
      .replace('_96.mp4', targetSuffix)
      .replace('_48.mp4', targetSuffix);
  }

  return {
    ...track,
    audioUrl: newUrl,
  };
}

// ==========================================
// 2.5. SYNCHRONIZED SONG LYRICS ENGINE
// ==========================================

import { SongLyrics } from '../types';

export function getTrackLyrics(track: Track): SongLyrics {
  const titleLower = track.title.toLowerCase();

  if (titleLower.includes('yaman') || titleLower.includes('sitar')) {
    return {
      title: track.title,
      artist: track.artist,
      language: 'Sanskrit & Hindi (Classical Alaap)',
      hasTranslation: true,
      lines: [
        { time: 0, original: '♫ [धीमी शुरुआत - सितार आलाप]', english: '♫ [Gentle Meditation - Sitar Alaap Introduction]' },
        { time: 12, original: 'सा रे ग म प ध नि सा... मधुर राग यमन', english: 'Sa Re Ga Ma Pa Dha Ni Sa... Sacred Raga Yaman resonance' },
        { time: 28, original: 'मन मगन भयो रे, सुरन के संग...', english: 'The soul is enchanted in the divine flow of notes...' },
        { time: 45, original: 'ताल तिनताल का आरंभ (१६ मात्रा चक्र)', english: 'Commencement of Teentaal rhythm (16-beat tempo cycle)' },
        { time: 64, original: 'सुर संगम में बहती पावन धारा...', english: 'Flowing like a pure river in harmonic communion...' },
        { time: 88, original: 'ध्रुत लय - सितार और तबले की तीव्र जुगलबंदी', english: 'Drut Tempo - Fast sitar & tabla dialogue (Jugalbandi)' },
        { time: 120, original: 'झाला की गति में चरम आनंद की अनुभूति', english: 'Jhala crescendo - Experiencing supreme acoustic ecstasy' },
        { time: 155, original: 'सम पर वापसी - मन शांत और स्थिर', english: 'Resolution on the beat (Sam) - Peaceful and still mind' },
      ],
    };
  }

  if (titleLower.includes('tum hi ho') || titleLower.includes('aashiqui') || titleLower.includes('arijit')) {
    return {
      title: track.title,
      artist: track.artist,
      language: 'Hindi',
      hasTranslation: true,
      lines: [
        { time: 0, original: '♫ [Intro piano & strings]', english: '♫ [Melodic Piano & Warm Acoustic Strings]' },
        { time: 8, original: 'हम तेरे बिन अब रह नहीं सकते...', english: 'I cannot live without you any longer...' },
        { time: 16, original: 'तेरे बिना क्या वजूद मेरा...', english: 'What existence do I have without you?' },
        { time: 24, original: 'तुझसे जुदा गर हो जाएँगे...', english: 'If I were ever separated from you...' },
        { time: 32, original: 'तो खुद से ही हो जाएँगे जुदा...', english: 'Then I would be separated from my own self...' },
        { time: 42, original: 'क्योंकि तुम ही हो, अब तुम ही हो...', english: 'Because only you, now only you...' },
        { time: 50, original: 'ज़िंदगी अब तुम ही हो...', english: 'You are my entire life now...' },
        { time: 58, original: 'चैन भी, मेरा दर्द भी...', english: 'My peace of mind, and my soothing pain...' },
        { time: 66, original: 'मेरी आशिकी अब तुम ही हो...', english: 'My devotion and love is only you now...' },
        { time: 80, original: 'तेरा मेरा रिश्ता है कैसा...', english: 'What kind of eternal bond is between us?' },
        { time: 92, original: 'एक पल दूर गंवारा नहीं...', english: 'Even a moment apart is unbearable...' },
      ],
    };
  }

  if (titleLower.includes('kesariya') || titleLower.includes('brahmastra')) {
    return {
      title: track.title,
      artist: track.artist,
      language: 'Hindi',
      hasTranslation: true,
      lines: [
        { time: 0, original: '♫ [Acoustic Guitar & Bansuri]', english: '♫ [Acoustic Strumming & Bamboo Flute]' },
        { time: 7, original: 'मुझको इतना बताए कोई...', english: 'Could someone please tell me this...' },
        { time: 14, original: 'कैसे तुझसे दिल ना लगाए कोई...', english: 'How could anyone not lose their heart to you?' },
        { time: 22, original: 'रब्बा ने तुझको बनाने में कर दी है हुस्न की खाली तिजोरियाँ...', english: 'God must have emptied the treasuries of beauty when creating you...' },
        { time: 33, original: 'केसरिया तेरा इश्क है पिया...', english: 'Saffron is the hue of your love, my beloved...' },
        { time: 42, original: 'रंग जाऊँ जो मैं हाथ लगाऊँ...', english: 'I get steeped in color the moment I touch it...' },
        { time: 51, original: 'दिन बीते सारे तेरी फिक्र में...', english: 'All my daylight passes caring for you...' },
        { time: 60, original: 'रैन सारी गुजरे तेरे जिक्र में...', english: 'All my nighttime passes reminiscing about you...' },
      ],
    };
  }

  if (titleLower.includes('flute') || titleLower.includes('bansuri') || titleLower.includes('krishna') || titleLower.includes('clear waters')) {
    return {
      title: track.title,
      artist: track.artist,
      language: 'Indian Ambient Flute',
      hasTranslation: true,
      lines: [
        { time: 0, original: '♫ [बांसुरी की मंद और शांत ध्वनि]', english: '♫ [Serene Bamboo Flute Inward Breath]' },
        { time: 14, original: 'बहती नदियां और ठंडी हवाओं का संगम...', english: 'Confluence of flowing streams and gentle cool breeze...' },
        { time: 30, original: 'हृदय में गूंजती शांति की दिव्य तान...', english: 'Divine notes of tranquility echoing in the heart...' },
        { time: 55, original: 'प्रकृति के सुरों में लीन मन...', english: 'The consciousness deeply immersed in nature’s harmonics...' },
        { time: 85, original: 'मधुर बांसुरी का विस्तार और सुरमयी धुन...', english: 'Spacious flute extension and soothing melodic curves...' },
        { time: 120, original: 'गहरी शांति और आंतरिक प्रकाश का अनुभव...', english: 'Deep stillness and inner radiance experience...' },
      ],
    };
  }

  // Universal dynamic synced lyric lines for any other track
  return {
    title: track.title,
    artist: track.artist,
    language: track.language || 'Music & Vocals',
    hasTranslation: true,
    lines: [
      { time: 0, original: `♫ [${track.title} - Intro]`, english: `♫ [${track.title} - Opening Melodic Intro]` },
      { time: 10, original: `मन की गहराइयों में गूंजती धुन...`, english: `Melodic vibrations echoing in the depths of mind...` },
      { time: 24, original: `सुरों का सुंदर प्रवाह और मधुर ताल...`, english: `Graceful harmonic flow and rhythm in motion...` },
      { time: 42, original: `हर सांस में बसता ये प्यारा संगीत...`, english: `This sweet music resonating in every breath...` },
      { time: 65, original: `♫ [Melodic Bridge & Dynamic Progression]`, english: `♫ [Melodic Bridge & Harmonic Ascent]` },
      { time: 90, original: `आनंद और सुकून का अद्भुत एहसास...`, english: `Wonderful feeling of joy, peace, and serenity...` },
      { time: 120, original: `♫ [Outro - Fade to Stillness]`, english: `♫ [Outro - Gentle Resolution & Warm Reverb]` },
    ],
  };
}

/**
 * Cached pool of related tracks fetched asynchronously based on the
 * currently playing track.  `prefetchRelatedTracks` fills this, and
 * `getEndlessQueueTracks` consumes from it so that the synchronous
 * "song ended → what's next?" path never has to await a network call.
 */
let _relatedTrackPool: Track[] = [];
let _relatedPoolSourceId: string | null = null;

/**
 * Call this whenever the current track changes.  It kicks off a
 * background YouTube search for songs related to `current` (by
 * artist + genre keywords) and stores the results so that
 * `getEndlessQueueTracks` can pick them up later without blocking.
 */
export async function prefetchRelatedTracks(current: Track): Promise<void> {
  if (!current?.title) return;
  // Don't re-fetch if we already prefetched for this exact track
  if (_relatedPoolSourceId === current.id && _relatedTrackPool.length > 0) return;
  _relatedPoolSourceId = current.id;

  try {
    // Build a relevance-oriented query from the playing track's metadata
    const artistPart = current.artist ? current.artist.split(',')[0].trim() : '';
    const genrePart  = current.genre && !/latest|music|single/i.test(current.genre) ? current.genre : '';
    const query = [artistPart, genrePart, 'songs'].filter(Boolean).join(' ');

    const results = await searchYouTubeDirect(query, 15);
    // Exclude the track itself
    _relatedTrackPool = results.filter(t => t.id !== current.id && t.title !== current.title);
  } catch {
    _relatedTrackPool = [];
  }
}

/**
 * Returns endless next tracks for non-stop continuous playback.
 *
 * Priority order:
 *   1. Pre-fetched related tracks (same artist / genre neighbourhood)
 *   2. Recently played history (familiar songs the user already enjoyed)
 *   3. Liked songs library
 *
 * Tracks already present in `currentQueue` are excluded.
 */
export function getEndlessQueueTracks(currentQueue: Track[], count = 6): Track[] {
  const existingIds = new Set(currentQueue.map((t) => t.id));
  const existingTitles = new Set(currentQueue.map((t) => t.title?.toLowerCase()));

  const isDuplicate = (t: Track) =>
    existingIds.has(t.id) || existingTitles.has(t.title?.toLowerCase());

  // 1. Prefer the pre-fetched related pool (artist / genre based)
  const related = _relatedTrackPool.filter((t) => !isDuplicate(t));
  if (related.length >= count) {
    return related.slice(0, count);
  }

  // 2. Fill remaining slots from recently played & liked songs
  const recentlyPlayed = getRecentlyPlayed();
  const liked = getLikedTracks();
  const fallback = [...recentlyPlayed, ...liked].filter((t) => !isDuplicate(t) && !related.some(r => r.id === t.id));

  return [...related, ...fallback].slice(0, count);
}

// ==========================================
// 3. USER AUTHENTICATION & PROFILE SYSTEM
// ==========================================

export const DEFAULT_USER: UserAuthProfile = {
  id: 'guest',
  name: 'Listener',
  email: '',
  avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
  joinedDate: 'Joined 2026',
  plan: 'Hi-Fi Master',
  region: 'India 🇮🇳',
  preferredQuality: '320k',
  theme: 'dark',
  isLoggedIn: false,
};

export function getAuthUser(): UserAuthProfile {
  try {
    const stored = localStorage.getItem(AUTH_USER_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    return DEFAULT_USER;
  } catch {
    return DEFAULT_USER;
  }
}


export function loginUser(email: string, name?: string, _password?: string): UserAuthProfile {
  const existing = getAuthUser();
  const cleanEmail = email.trim() || 'pranavecse2226@gmail.com';
  const cleanName = name?.trim() || cleanEmail.split('@')[0] || 'Pranav';
  
  const updated: UserAuthProfile = {
    ...existing,
    email: cleanEmail,
    name: cleanName.charAt(0).toUpperCase() + cleanName.slice(1),
    isLoggedIn: true,
  };

  try {
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(updated));
    localStorage.setItem('rezbeatsai_user_name', updated.name);
    window.dispatchEvent(new CustomEvent('rezbeatsai_auth_change', { detail: updated }));
  } catch {
    // Ignore
  }
  return updated;
}

export function signupUser(email: string, name: string, _password?: string): UserAuthProfile {
  const newUser: UserAuthProfile = {
    id: `usr_${Date.now()}`,
    name: name.trim() || 'Pranav',
    email: email.trim() || 'pranavecse2226@gmail.com',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    joinedDate: 'Joined Today',
    plan: 'Hi-Fi Master',
    region: 'India 🇮🇳',
    preferredQuality: getAudioQuality(),
    theme: getAppTheme(),
    isLoggedIn: true,
  };

  try {
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(newUser));
    localStorage.setItem('rezbeatsai_user_name', newUser.name);
    window.dispatchEvent(new CustomEvent('rezbeatsai_auth_change', { detail: newUser }));
  } catch {
    // Ignore
  }
  return newUser;
}

export function logoutUser(): UserAuthProfile {
  const loggedOut: UserAuthProfile = {
    id: 'guest',
    name: 'Guest Listener',
    email: 'guest@rezbeatsai.app',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
    joinedDate: 'Guest Mode',
    plan: 'Free',
    region: 'India 🇮🇳',
    preferredQuality: '160k',
    theme: 'dark',
    isLoggedIn: false,
  };

  try {
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(loggedOut));
    localStorage.setItem('rezbeatsai_user_name', 'Guest Listener');
    window.dispatchEvent(new CustomEvent('rezbeatsai_auth_change', { detail: loggedOut }));
  } catch {
    // Ignore
  }
  return loggedOut;
}

export function updateUserProfile(updates: Partial<UserAuthProfile>): UserAuthProfile {
  const current = getAuthUser();
  const merged = { ...current, ...updates };
  try {
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(merged));
    if (updates.name) localStorage.setItem('rezbeatsai_user_name', updates.name);
    window.dispatchEvent(new CustomEvent('rezbeatsai_auth_change', { detail: merged }));
  } catch {
    // Ignore
  }
  return merged;
}

// ==========================================
// 4. PLAY COUNTS, "ON REPEAT" & TASTE PROFILE
// ==========================================

export interface TrackPlayStats {
  track: Track;
  playCount: number;
  lastPlayed: number;
}

export function recordTrackPlay(track: Track): void {
  if (!track || !track.id) return;
  try {
    const raw = localStorage.getItem(TRACK_PLAY_COUNTS_KEY);
    const map: Record<string, TrackPlayStats> = raw ? JSON.parse(raw) : {};

    const key = track.id;
    if (map[key]) {
      map[key].playCount += 1;
      map[key].lastPlayed = Date.now();
      // keep track updated
      map[key].track = { ...map[key].track, ...track };
    } else {
      map[key] = {
        track,
        playCount: 1,
        lastPlayed: Date.now(),
      };
    }

    localStorage.setItem(TRACK_PLAY_COUNTS_KEY, JSON.stringify(map));
  } catch {
    // Ignore
  }
}

export const DEFAULT_HEAVY_ROTATION_TRACKS: Track[] = [
  {
    id: 'youtube_4NRXx6U8ABQ',
    title: 'Blinding Lights',
    artist: 'The Weeknd',
    album: 'After Hours',
    duration: '03:20',
    durationSec: 200,
    coverUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80',
    audioUrl: '',
    genre: 'Synthpop',
    language: 'English',
    isCopyrightSafe: true,
    isRoyaltyFree: false,
    isFullSong: true,
    country: 'Worldwide',
    tags: ['pop', 'trending', 'heavy rotation'],
  },
  {
    id: 'youtube_fJ9rUzIMcZQ',
    title: 'Bohemian Rhapsody',
    artist: 'Queen',
    album: 'A Night at the Opera',
    duration: '05:55',
    durationSec: 355,
    coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
    audioUrl: '',
    genre: 'Rock',
    language: 'English',
    isCopyrightSafe: true,
    isRoyaltyFree: false,
    isFullSong: true,
    country: 'Worldwide',
    tags: ['rock', 'legendary', 'classic'],
  },
  {
    id: 'youtube_BddP6PYo2gs',
    title: 'Kesariya',
    artist: 'Arijit Singh, Pritam',
    album: 'Brahmastra',
    duration: '04:28',
    durationSec: 268,
    coverUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80',
    audioUrl: '',
    genre: 'Bollywood Romantic',
    language: 'Hindi',
    isCopyrightSafe: true,
    isRoyaltyFree: false,
    isFullSong: true,
    country: 'India',
    tags: ['arijit', 'kesariya', 'romantic'],
  },
  {
    id: 'youtube_H5v3kku4y6Q',
    title: 'As It Was',
    artist: 'Harry Styles',
    album: "Harry's House",
    duration: '02:47',
    durationSec: 167,
    coverUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=600&auto=format&fit=crop&q=80',
    audioUrl: '',
    genre: 'Indie Pop',
    language: 'English',
    isCopyrightSafe: true,
    isRoyaltyFree: false,
    isFullSong: true,
    country: 'Worldwide',
    tags: ['indie', 'pop', 'trending'],
  },
];

/**
 * Returns user's repeated songs (tracks played multiple times / on heavy rotation)
 */
export function getOnRepeatTracks(): { track: Track; playCount: number }[] {
  try {
    const raw = localStorage.getItem(TRACK_PLAY_COUNTS_KEY);
    if (!raw) {
      return DEFAULT_HEAVY_ROTATION_TRACKS.map((track, i) => ({
        track,
        playCount: 12 - i * 2,
      }));
    }
    const map: Record<string, TrackPlayStats> = JSON.parse(raw);
    const list = Object.values(map)
      .filter((item) => item?.track && item.track.title && item.track.id && item.playCount >= 1)
      .sort((a, b) => b.playCount - a.playCount);

    if (list.length === 0) {
      return DEFAULT_HEAVY_ROTATION_TRACKS.map((track, i) => ({
        track,
        playCount: 12 - i * 2,
      }));
    }

    const result = list.map((item) => ({
      track: item.track,
      playCount: item.playCount,
    }));

    if (result.length < 4) {
      const seenIds = new Set(result.map((r) => r.track.id));
      for (const defTrack of DEFAULT_HEAVY_ROTATION_TRACKS) {
        if (!seenIds.has(defTrack.id)) {
          result.push({ track: defTrack, playCount: 4 });
          if (result.length >= 4) break;
        }
      }
    }

    return result;
  } catch {
    return DEFAULT_HEAVY_ROTATION_TRACKS.map((track, i) => ({
      track,
      playCount: 10 - i * 2,
    }));
  }
}

/**
 * Calculate user's music taste profile & intelligent recommendations
 */
export function getUserTasteProfile(): UserTasteProfile {
  const onRepeat = getOnRepeatTracks();
  const liked = getLikedTracks();
  const recents = getRecentlyPlayed();

  const artistMap: Record<string, number> = {};
  const genreMap: Record<string, number> = {};
  const langMap: Record<string, number> = {};

  let totalStreams = 0;

  // Aggregate stats
  [...onRepeat.map((r) => ({ t: r.track, weight: r.playCount })), ...liked.map((t) => ({ t, weight: 3 })), ...recents.map((t) => ({ t, weight: 1 }))].forEach(
    ({ t, weight }) => {
      totalStreams += weight;
      if (t.artist) {
        artistMap[t.artist] = (artistMap[t.artist] || 0) + weight;
      }
      if (t.genre) {
        genreMap[t.genre] = (genreMap[t.genre] || 0) + weight;
      }
      if (t.language) {
        langMap[t.language] = (langMap[t.language] || 0) + weight;
      }
    }
  );

  const topArtists = Object.entries(artistMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, playCount]) => ({ name, playCount }));

  const topGenres = Object.entries(genreMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, playCount]) => ({ name, playCount }));

  const topLanguages = Object.entries(langMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([name, playCount]) => ({ name, playCount }));

  const primaryArtist = topArtists[0]?.name || 'Arijit Singh & Classical Maestros';
  const primaryGenre = topGenres[0]?.name || 'Soulful Acoustic & Ragas';

  const recommendations: TasteRecommendation[] = [
    {
      reason: `Because you frequently listen to ${primaryArtist}`,
      artist: primaryArtist,
      genre: primaryGenre,
      tracks: [],
    },
    {
      reason: 'Deep Focus & Morning Chai Rotation',
      artist: 'Acoustic & Sitar Ensemble',
      genre: 'Acoustic / Ambient',
      tracks: [],
    },
    {
      reason: 'All-India Regional Melodic Discoveries',
      artist: 'Prasar Bharati & Cultural Radios',
      genre: 'Regional Heritage',
      tracks: [],
    },
  ];

  return {
    topArtists: topArtists.length > 0 ? topArtists : [{ name: 'Arijit Singh & Tito Dutta', playCount: 14 }],
    topGenres: topGenres.length > 0 ? topGenres : [{ name: 'Hindustani / Acoustic', playCount: 18 }],
    topLanguages: topLanguages.length > 0 ? topLanguages : [{ name: 'Hindi & Telugu', playCount: 22 }],
    totalStreams: Math.max(totalStreams, 34),
    repeatFavoritesCount: onRepeat.length,
    dominantMood: 'Soulful & Raga Resonance',
    recommendations,
  };
}
