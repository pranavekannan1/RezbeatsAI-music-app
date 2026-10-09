import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

const apiBaseUrl = (process.env.MUSIC_API_URL || 'https://music-app-based-on-ai-2.onrender.com').replace(/\/$/, '');
const server = new McpServer({
  name: 'rezbeatsai-music-discovery',
  version: '1.0.0',
});

interface PublicTrack {
  id: string;
  title: string;
  artist: string;
  album?: string;
  duration?: string;
  language?: string;
  genre?: string;
  youtubeUrl?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function getString(record: Record<string, unknown>, key: string): string | undefined {
  const value = record[key];
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function toPublicTrack(value: unknown): PublicTrack | null {
  if (!isRecord(value)) return null;

  const title = getString(value, 'title');
  const artist = getString(value, 'artist') || getString(value, 'author');
  if (!title || !artist) return null;

  const id = getString(value, 'id') || `${title}:${artist}`;
  const youtubeId = id.match(/^(?:youtube[_-]|yt[_-])?([\w-]{11})$/)?.[1]
    || [getString(value, 'sourceUrl'), getString(value, 'audioUrl')]
      .map((url) => url?.match(/(?:v=|youtu\.be\/|embed\/|[?&]id=)([\w-]{11})/)?.[1])
      .find(Boolean);

  return {
    id,
    title,
    artist,
    ...(getString(value, 'album') ? { album: getString(value, 'album') } : {}),
    ...(getString(value, 'duration') ? { duration: getString(value, 'duration') } : {}),
    ...(getString(value, 'language') ? { language: getString(value, 'language') } : {}),
    ...(getString(value, 'genre') ? { genre: getString(value, 'genre') } : {}),
    ...(youtubeId ? { youtubeUrl: `https://www.youtube.com/watch?v=${youtubeId}` } : {}),
  };
}

async function fetchPublicTracks(path: string, limit: number): Promise<PublicTrack[]> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error(`Music catalog request failed (HTTP ${response.status}).`);

  const payload: unknown = await response.json();
  if (!isRecord(payload) || payload.success === false) {
    throw new Error('The music catalog did not return results.');
  }

  const tracks = Array.isArray(payload.tracks) ? payload.tracks : [];
  return tracks
    .map(toPublicTrack)
    .filter((track): track is PublicTrack => track !== null)
    .slice(0, limit);
}

function tracksResult(tracks: PublicTrack[], query?: string) {
  return {
    content: [{
      type: 'text' as const,
      text: JSON.stringify({ ...(query ? { query } : {}), tracks }, null, 2),
    }],
  };
}

function errorResult(error: unknown) {
  return {
    isError: true,
    content: [{
      type: 'text' as const,
      text: error instanceof Error ? error.message : 'Music catalog request failed.',
    }],
  };
}

server.registerTool('search_music', {
  title: 'Search music',
  description: 'Search the public music catalog. Returns track metadata and YouTube links only; does not access accounts or stream audio.',
  inputSchema: {
    query: z.string().trim().min(1).max(160),
    limit: z.number().int().min(1).max(20).optional(),
  },
  annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: true },
}, async ({ query, limit }) => {
  try {
    const params = new URLSearchParams({ q: query, limit: String(limit ?? 10) });
    const tracks = await fetchPublicTracks(`/api/music/search?${params}`, limit ?? 10);
    return tracksResult(tracks, query);
  } catch (error) {
    return errorResult(error);
  }
});

server.registerTool('get_trending_music', {
  title: 'Get trending music',
  description: 'Get public trending tracks, optionally filtered by language. Does not read user location, account data, or preferences.',
  inputSchema: {
    language: z.string().trim().min(1).max(40).optional(),
    limit: z.number().int().min(1).max(20).optional(),
  },
  annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: true },
}, async ({ language, limit }) => {
  try {
    const params = new URLSearchParams({ language: language || 'all' });
    const tracks = await fetchPublicTracks(`/api/music/trending?${params}`, limit ?? 10);
    return tracksResult(tracks, language || 'all');
  } catch (error) {
    return errorResult(error);
  }
});

server.registerTool('recommend_music', {
  title: 'Recommend music from a seed',
  description: 'Find music from an artist, genre, or mood supplied in this request. Recommendations are not personalized and nothing is saved.',
  inputSchema: {
    seed: z.string().trim().min(1).max(120),
    mood: z.string().trim().max(80).optional(),
    limit: z.number().int().min(1).max(20).optional(),
  },
  annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: true },
}, async ({ seed, mood, limit }) => {
  try {
    const query = [seed, mood].filter(Boolean).join(' ');
    const params = new URLSearchParams({ q: query, limit: String(limit ?? 10) });
    const tracks = await fetchPublicTracks(`/api/music/search?${params}`, limit ?? 10);
    return tracksResult(tracks, query);
  } catch (error) {
    return errorResult(error);
  }
});

await server.connect(new StdioServerTransport());