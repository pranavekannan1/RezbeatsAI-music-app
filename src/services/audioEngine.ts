import { AudioQuality, Track } from '../types';
import { applyQualityToTrackUrl, findYouTubeMatches, getAudioQuality, reportPlay } from './musicService';

type TimeUpdateCallback = (currentTime: number, duration: number) => void;
type EndedCallback = () => void;

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: any;
  }
}

const SILENT_AUDIO_URI =
  'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';

/**
 * Universal Audio Engine for RezBeatsAI Music
 * Supports:
 * - Direct lossless/320kbps audio streams via HTMLAudioElement
 * - YouTube IFrame background audio playback with persistent background keep-alive for mobile & web
 * - MediaSession API integration for OS Lock Screen / notification controls & scrub bars
 * - Automatic background playback continuation on app minimize or screen lock
 * - Real-time progress synchronization with onTimeUpdate() & seek()
 * - Frequency analysis for visualizers and live EQ
 */
class AudioEngine {
  private audioEl: HTMLAudioElement | null = null;
  private currentTrack: Track | null = null;
  private resumeAt = 0;
  private isPlaying: boolean = false;
  private userWantsPlay: boolean = false;
  private volume: number = 0.8;
  private isUsingHtmlAudio: boolean = false;
  private isUsingYouTube: boolean = false;
  private isLiveRadio: boolean = false;

  // YouTube IFrame Player
  private ytPlayer: any = null;
  private ytReady: boolean = false;
  private ytPollTimer: number | null = null;
  private pendingYtVideoId: string | null = null;
  // Candidate YouTube videos for the current track (best first) + which one is loaded
  private ytCandidates: string[] = [];
  private ytCandidateIdx = 0;
  // trackId -> matched YouTube video IDs, so replays / resumes don't hit the network again
  private ytMatchCache = new Map<string, string[]>();
  // Bumped on every playTrack(); lets async work detect that the user has moved on
  private playToken = 0;
  // Track id we've already sent a play-report for, so retries/resumes/polling don't double-count
  private playReportedFor: string | null = null;

  // Listeners
  private timeListeners: TimeUpdateCallback[] = [];
  private endedListeners: EndedCallback[] = [];

  // Synth mode time simulation
  private synthCurrentTime: number = 0;
  private synthTotalDuration: number = 180;
  private synthTimer: number | null = null;

  // Web Audio Synthesizer components
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private oscillators: OscillatorNode[] = [];
  private filter: BiquadFilterNode | null = null;
  private analyser: AnalyserNode | null = null;
  private chordInterval: number | null = null;
  private currentChordIndex: number = 0;

  // Ambient chord progressions in D Minor / F Major (atmospheric, neo-classical)
  private chords = [
    [146.83, 220.0, 261.63, 349.23], // Dm7 (D3, A3, C4, F4)
    [130.81, 196.0, 261.63, 329.63], // Cmaj7 (C3, G3, C4, E4)
    [116.54, 174.61, 220.0, 293.66], // Bbmaj7 (Bb2, F3, A3, D4)
    [146.83, 174.61, 220.0, 329.63], // Dm9 (D3, F3, A3, E4)
  ];

  constructor() {
    if (typeof window !== 'undefined') {
      this.initAudioElement();
      this.setupYouTubeApi();
      this.setupBackgroundKeepAlive();
      window.addEventListener('rezbeatsai_quality_change', (event) => {
        const quality = (event as CustomEvent<AudioQuality>).detail;
        if (!this.currentTrack || !this.userWantsPlay || !this.isUsingHtmlAudio) return;
        this.resumeAt = this.getCurrentTime();
        this.playTrack(this.currentTrack, quality);
      });
    }
  }

  /**
   * Prevents mobile browsers and desktop tabs from killing audio when minimized or locked.
   * Maintains active AudioContext / HTMLAudioElement so the OS media thread remains active.
   */
  private setupBackgroundKeepAlive() {
    if (typeof document === 'undefined') return;

    const resumeIfWanted = () => {
      if (!this.userWantsPlay) return;
      if (this.isUsingYouTube && this.ytPlayer && typeof this.ytPlayer.playVideo === 'function') {
        try {
          this.ytPlayer.playVideo();
        } catch {}
        this.startSilentKeepAlive();
      }
      if (this.isUsingHtmlAudio && this.audioEl && this.audioEl.paused && this.audioEl.src !== SILENT_AUDIO_URI) {
        this.audioEl.play().catch(() => {});
      }
    };

    document.addEventListener('visibilitychange', () => {
      if (this.userWantsPlay) {
        resumeIfWanted();
        window.setTimeout(resumeIfWanted, 300);
        window.setTimeout(resumeIfWanted, 1000);
      }
    });

    window.addEventListener('pagehide', () => {
      if (this.userWantsPlay) {
        resumeIfWanted();
      }
    });

    window.addEventListener('focus', () => {
      if (this.userWantsPlay && !this.isPlaying) {
        resumeIfWanted();
      }
    });
  }

  /**
   * Plays a 0-volume silent audio loop in the top-level HTMLAudioElement.
   * This is required by mobile OSs (iOS & Android) to grant background audio permissions
   * and display Lock Screen controls for iframe-based streams.
   */
  private startSilentKeepAlive() {
    if (!this.audioEl) {
      this.initAudioElement();
    }
    if (this.audioEl) {
      try {
        if (this.audioEl.src !== SILENT_AUDIO_URI) {
          this.audioEl.src = SILENT_AUDIO_URI;
        }
        this.audioEl.loop = true;
        this.audioEl.volume = 0.001; // Whisper quiet so native background media session stays active
        this.audioEl.play().catch(() => {});
      } catch {}
    }
  }

  private setupYouTubeApi() {
    const initPlayer = () => {
      if (!window.YT || !window.YT.Player) return;
      try {
        const el = document.getElementById('rezbeatsai-yt-player');
        if (!el) return;

        this.ytPlayer = new window.YT.Player('rezbeatsai-yt-player', {
          height: '200',
          width: '200',
          playerVars: {
            autoplay: 1,
            controls: 0,
            disablekb: 1,
            fs: 0,
            modestbranding: 1,
            playsinline: 1,
            rel: 0,
            origin: typeof window !== 'undefined' ? window.location.origin : undefined,
          },
          events: {
            onReady: () => {
              this.ytReady = true;
              if (this.ytPlayer && typeof this.ytPlayer.setVolume === 'function') {
                this.ytPlayer.setVolume(this.volume * 100);
              }
              if (this.pendingYtVideoId) {
                const vid = this.pendingYtVideoId;
                this.pendingYtVideoId = null;
                this.playYouTubeVideo(vid);
              }
            },
            onStateChange: (event: any) => {
              if (!this.isUsingYouTube) return;
              // YT.PlayerState: -1 unstarted, 0 ENDED, 1 PLAYING, 2 PAUSED, 3 BUFFERING
              if (event.data === 1) {
                this.isPlaying = true;
                this.userWantsPlay = true;
                this.startYtProgressPolling();
                this.reportPlayOnce();
                this.startSilentKeepAlive();
                if (typeof window !== 'undefined' && 'mediaSession' in navigator) {
                  navigator.mediaSession.playbackState = 'playing';
                }
              } else if (event.data === 2) {
                // If YouTube paused because tab minimized or screen locked, auto-resume if user wants play
                if (this.userWantsPlay && typeof document !== 'undefined' && document.hidden) {
                  try {
                    this.ytPlayer.playVideo();
                    this.startSilentKeepAlive();
                    return;
                  } catch {}
                }
                if (!this.userWantsPlay) {
                  this.isPlaying = false;
                  this.stopYtProgressPolling();
                  if (typeof window !== 'undefined' && 'mediaSession' in navigator) {
                    navigator.mediaSession.playbackState = 'paused';
                  }
                }
              } else if (event.data === 0) {
                this.isPlaying = false;
                this.stopYtProgressPolling();
                // Never advance queue for live radio streams
                if (!this.isLiveRadio) {
                  this.notifyEnded();
                }
              }
            },
            onError: (err: any) => {
              console.warn('YouTube Player error code:', err?.data);
              this.handleYtError();
            },
          },
        });
      } catch (err) {
        console.warn('Failed to construct YouTube player:', err);
      }
    };

    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      const prevCallback = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (typeof prevCallback === 'function') prevCallback();
        initPlayer();
      };
    }
  }

  private startYtProgressPolling() {
    this.stopYtProgressPolling();
    this.ytPollTimer = window.setInterval(() => {
      if (!this.isUsingYouTube || !this.ytPlayer) return;
      try {
        const cur = typeof this.ytPlayer.getCurrentTime === 'function' ? this.ytPlayer.getCurrentTime() : 0;
        const dur = typeof this.ytPlayer.getDuration === 'function' ? this.ytPlayer.getDuration() : (this.currentTrack?.durationSec || 210);
        this.notifyTimeUpdate(cur || 0, dur || 210);
      } catch {}
    }, 500);
  }

  private stopYtProgressPolling() {
    if (this.ytPollTimer) {
      window.clearInterval(this.ytPollTimer);
      this.ytPollTimer = null;
    }
  }

  private extractYouTubeId(track: Track): string | null {
    if (!track) return null;

    // Check track.id prefixes and bare 11-char IDs
    if (track.id) {
      if (track.id.startsWith('youtube_')) {
        const id = track.id.replace('youtube_', '');
        if (/^[\w-]{11}$/.test(id)) return id;
      }
      if (track.id.startsWith('youtube-')) {
        const id = track.id.replace('youtube-', '');
        if (/^[\w-]{11}$/.test(id)) return id;
      }
      if (track.id.startsWith('yt_')) {
        const id = track.id.replace('yt_', '');
        if (/^[\w-]{11}$/.test(id)) return id;
      }
      if (track.id.startsWith('yt-')) {
        const id = track.id.replace('yt-', '');
        if (/^[\w-]{11}$/.test(id)) return id;
      }
      if (/^[\w-]{11}$/.test(track.id)) {
        return track.id;
      }
    }

    // Check audioUrl
    if (track.audioUrl) {
      const match =
        track.audioUrl.match(/(?:v=|youtu\.be\/|embed\/|[?&]id=|[?&]v=)([\w-]{11})/) ||
        track.audioUrl.match(/[?&]id=([^&]+)/);
      if (match && /^[\w-]{11}$/.test(match[1])) return match[1];
    }

    // Check sourceUrl
    if (track.sourceUrl) {
      const match = track.sourceUrl.match(/(?:v=|youtu\.be\/|embed\/|[?&]v=)([\w-]{11})/);
      if (match && /^[\w-]{11}$/.test(match[1])) return match[1];
    }

    // Check previewUrl
    if (track.previewUrl) {
      const match = track.previewUrl.match(/(?:v=|youtu\.be\/|embed\/|[?&]id=|[?&]v=)([\w-]{11})/);
      if (match && /^[\w-]{11}$/.test(match[1])) return match[1];
    }

    return null;
  }

  private playYouTubeVideo(videoId: string) {
    if (!this.ytReady || !this.ytPlayer || typeof this.ytPlayer.loadVideoById !== 'function') {
      this.pendingYtVideoId = videoId;
      return;
    }

    try {
      this.ytPlayer.loadVideoById({
        videoId,
        startSeconds: 0,
      });
      this.ytPlayer.setVolume(this.volume * 100);
      this.ytPlayer.playVideo();
      this.isPlaying = true;
      this.startYtProgressPolling();
    } catch (err) {
      console.warn('YouTube loadVideoById failed:', err);
      this.handleYtError();
    }
  }

  private initAudioElement() {
    if (this.audioEl) return;
    this.audioEl = document.createElement('audio');
    this.audioEl.setAttribute('playsinline', '');
    this.audioEl.crossOrigin = 'anonymous';
    this.audioEl.volume = this.volume;
    this.audioEl.style.position = 'fixed';
    this.audioEl.style.width = '1px';
    this.audioEl.style.height = '1px';
    this.audioEl.style.opacity = '0';
    this.audioEl.style.pointerEvents = 'none';
    document.body.appendChild(this.audioEl);

    this.audioEl.addEventListener('loadedmetadata', () => {
      if (!this.audioEl || !this.isUsingHtmlAudio) return;
      if (this.resumeAt > 0 && Number.isFinite(this.audioEl.duration)) {
        this.audioEl.currentTime = Math.min(this.resumeAt, this.audioEl.duration);
        this.resumeAt = 0;
      }
      const dur =
        this.audioEl.duration && !isNaN(this.audioEl.duration)
          ? this.audioEl.duration
          : this.currentTrack?.durationSec || 210;
      this.notifyTimeUpdate(this.audioEl.currentTime || 0, dur);
    });

    this.audioEl.addEventListener('timeupdate', () => {
      if (!this.audioEl || !this.isUsingHtmlAudio) return;
      const cur = this.audioEl.currentTime || 0;
      const dur =
        this.audioEl.duration && !isNaN(this.audioEl.duration)
          ? this.audioEl.duration
          : this.currentTrack?.durationSec || 210;
      this.notifyTimeUpdate(cur, dur);
    });

    this.audioEl.addEventListener('ended', () => {
      if (!this.isUsingHtmlAudio) return;
      this.isPlaying = false;
      // Never auto-advance for live radio streams
      if (!this.isLiveRadio) {
        this.notifyEnded();
      }
    });

    this.audioEl.addEventListener('error', (e) => {
      if (!this.isUsingHtmlAudio) return;
      console.warn('Audio stream playback error, attempting YouTube lookup fallback:', e);
      if (this.currentTrack) {
        void this.playFullSongForPreviewTrack(this.currentTrack, undefined, ++this.playToken);
      } else {
        this.startGenerativeFallback();
      }
    });
  }

  private initWebAudio() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.volume * 0.35, this.ctx.currentTime);

        this.filter = this.ctx.createBiquadFilter();
        this.filter.type = 'lowpass';
        this.filter.frequency.setValueAtTime(520, this.ctx.currentTime);
        this.filter.Q.setValueAtTime(2.0, this.ctx.currentTime);

        this.analyser = this.ctx.createAnalyser();
        this.analyser.fftSize = 64;

        this.filter.connect(this.masterGain);
        this.masterGain.connect(this.analyser);
        this.analyser.connect(this.ctx.destination);
      }
    }
  }

  /**
   * Subscribe to playback progress updates
   */
  public onTimeUpdate(callback: TimeUpdateCallback): () => void {
    this.timeListeners.push(callback);
    const cur = this.getCurrentTime();
    const dur = this.getDuration();
    callback(cur, dur);

    return () => {
      this.timeListeners = this.timeListeners.filter((cb) => cb !== callback);
    };
  }

  /**
   * Subscribe to track ended event
   */
  public onEnded(callback: EndedCallback): () => void {
    this.endedListeners.push(callback);
    return () => {
      this.endedListeners = this.endedListeners.filter((cb) => cb !== callback);
    };
  }

  private notifyTimeUpdate(currentTime: number, duration: number) {
    if (
      typeof window !== 'undefined' &&
      'mediaSession' in navigator &&
      'setPositionState' in navigator.mediaSession
    ) {
      try {
        if (duration > 0 && currentTime >= 0 && currentTime <= duration) {
          navigator.mediaSession.setPositionState({
            duration: Math.max(1, duration),
            playbackRate: 1,
            position: Math.min(currentTime, duration),
          });
        }
      } catch {}
    }

    for (const listener of this.timeListeners) {
      try {
        listener(currentTime, duration);
      } catch (err) {
        console.error('Error in onTimeUpdate listener:', err);
      }
    }
  }

  private notifyEnded() {
    for (const listener of this.endedListeners) {
      try {
        listener();
      } catch (err) {
        console.error('Error in onEnded listener:', err);
      }
    }
  }

  /**
   * Play a specific Track (handles YouTube, previewUrl, direct stream, or YouTube match lookup)
   */
  public playTrack(track: Track, quality: AudioQuality = getAudioQuality()) {
    this.userWantsPlay = true;
    const token = ++this.playToken;
    this.currentTrack = track;
    this.playReportedFor = null;
    this.isLiveRadio = !!(track.isLiveRadio || track.duration === 'LIVE' || (track.durationSec === 0 && track.id.startsWith('radio_')));
    this.updateMediaSession(track);
    this.stopGenerativeSynth();
    this.pendingYtVideoId = null;

    const ytId = this.extractYouTubeId(track);
    const qualityTrack = applyQualityToTrackUrl(track, quality);
    const streamUrl = qualityTrack.audioUrl || qualityTrack.previewUrl;

    if (ytId) {
      // Native audio playback supports browser background playback and lock-screen controls.
      const resolverUrl = new URL('/api/music/resolve-yt-audio', window.location.origin);
      resolverUrl.searchParams.set('id', ytId);
      resolverUrl.searchParams.set('quality', quality);
      this.playDirectStream(resolverUrl.toString());
    } else if (streamUrl && !this.isPreviewOnly(track, streamUrl) && !streamUrl.includes('resolve-yt-audio')) {
      // 2. Play direct audio stream (e.g. JioSaavn 320kbps or local audio)
      this.playDirectStream(streamUrl);
    } else {
      // 3. Track has no direct stream or only has a preview clip: find the full song on YouTube!
      void this.playFullSongForPreviewTrack(track, streamUrl, token);
    }
  }

  /** iTunes / Deezer only serve ~30s previews; everything else in the catalog is a full stream. */
  private isPreviewOnly(track: Track, url?: string): boolean {
    if (track.isLiveRadio || !track.title) return false;
    if (track.isFullSong === false) return true;
    return !!url && /(?:dzcdn\.net|mzstatic\.com|itunes\.apple\.com)/i.test(url);
  }

  private async playFullSongForPreviewTrack(track: Track, previewUrl: string | undefined, token: number) {
    // Silence whatever was playing while we look the song up
    this.pauseAllSources();
    this.isPlaying = true; // user intent: they pressed play
    this.notifyTimeUpdate(0, track.durationSec || 0);

    let ids = this.ytMatchCache.get(track.id);
    if (!ids || ids.length === 0) {
      ids = await findYouTubeMatches(track);
      if (token !== this.playToken) return; // user skipped to another track
      if (ids.length > 0) this.ytMatchCache.set(track.id, ids);
    }
    if (token !== this.playToken) return;
    if (!this.isPlaying) return; // paused during lookup; play() will call playTrack() again (cache is warm)

    if (ids && ids.length > 0) {
      this.startYouTubeCandidates(ids);
    } else if (previewUrl) {
      console.warn('No full-length match found, playing available preview:', track.title);
      this.playDirectStream(previewUrl);
    } else {
      console.warn('No audio stream or YouTube video found for track:', track.title);
      this.startGenerativeFallback();
    }
  }

  /** Look up (and cache) the YouTube match for a track before it is needed, e.g. the next one in the queue. */
  public warmYouTubeMatch(track: Track) {
    if (!track || this.extractYouTubeId(track) || this.ytMatchCache.has(track.id)) return;
    findYouTubeMatches(track).then((ids) => {
      if (ids.length > 0) this.ytMatchCache.set(track.id, ids);
    });
  }

  private pauseAllSources() {
    this.isUsingHtmlAudio = false;
    this.isUsingYouTube = false;
    this.stopYtProgressPolling();
    if (this.audioEl) {
      this.audioEl.pause();
    }
    if (this.ytPlayer && typeof this.ytPlayer.pauseVideo === 'function') {
      try {
        this.ytPlayer.pauseVideo();
      } catch {}
    }
  }

  private startYouTubeCandidates(ids: string[]) {
    this.ytCandidates = ids;
    this.ytCandidateIdx = 0;
    this.isUsingHtmlAudio = false;
    this.isUsingYouTube = true;
    this.startSilentKeepAlive();
    this.playYouTubeVideo(ids[0]);

    // If the YouTube IFrame API never loads (ad-blocker, offline), don't hang silently.
    if (!this.ytReady) {
      const token = this.playToken;
      window.setTimeout(() => {
        if (token === this.playToken && !this.ytReady && this.isUsingYouTube) {
          this.pendingYtVideoId = null;
          this.fallbackFromYouTube();
        }
      }, 6000);
    }
  }

  /** Current YouTube candidate failed (removed / embedding disabled): try the next, else search alternative. */
  private async handleYtError() {
    if (!this.isUsingYouTube) return; // stale error from a video we already moved on from
    if (this.ytCandidateIdx + 1 < this.ytCandidates.length) {
      this.ytCandidateIdx += 1;
      this.playYouTubeVideo(this.ytCandidates[this.ytCandidateIdx]);
      return;
    }

    // Try finding alternative audio/lyric matches on YouTube before giving up
    if (this.currentTrack) {
      this.ytMatchCache.delete(this.currentTrack.id);
      try {
        const query = `${this.currentTrack.title} ${this.currentTrack.artist || ''} audio`;
        const additionalMatches = await findYouTubeMatches({
          title: query,
          artist: '',
          durationSec: this.currentTrack.durationSec,
        });
        const newCandidates = additionalMatches.filter((id) => !this.ytCandidates.includes(id));
        if (newCandidates.length > 0) {
          this.startYouTubeCandidates(newCandidates);
          return;
        }
      } catch {}
    }

    this.fallbackFromYouTube();
  }

  private fallbackFromYouTube() {
    this.isUsingYouTube = false;
    this.stopYtProgressPolling();
    if (this.ytPlayer && typeof this.ytPlayer.pauseVideo === 'function') {
      try {
        this.ytPlayer.pauseVideo();
      } catch {}
    }
    const url = this.currentTrack?.previewUrl || this.currentTrack?.audioUrl;
    if (url && !/youtube\.com|youtu\.be|resolve-yt-audio/.test(url)) {
      this.playDirectStream(url);
    } else {
      this.startGenerativeFallback();
    }
  }

  private playDirectStream(streamUrl: string) {
    this.isUsingYouTube = false;
    this.stopYtProgressPolling();
    if (this.ytPlayer && typeof this.ytPlayer.pauseVideo === 'function') {
      try {
        this.ytPlayer.pauseVideo();
      } catch {}
    }

    this.isUsingHtmlAudio = true;
    this.initAudioElement();

    if (this.audioEl) {
      this.audioEl.loop = false;
      this.audioEl.src = streamUrl;
      this.audioEl.currentTime = 0;
      this.audioEl.volume = this.volume;
      this.audioEl
        .play()
        .then(() => {
          this.isPlaying = true;
          this.userWantsPlay = true;
          if (typeof window !== 'undefined' && 'mediaSession' in navigator) {
            navigator.mediaSession.playbackState = 'playing';
          }
          this.reportPlayOnce();
        })
        .catch((err) => {
          console.warn('HTML Audio play rejected, attempting YouTube lookup fallback:', err);
          if (this.currentTrack) {
            void this.playFullSongForPreviewTrack(this.currentTrack, undefined, ++this.playToken);
          } else {
            this.startGenerativeFallback();
          }
        });
    }
  }

  private reportPlayOnce() {
    if (!this.currentTrack || this.isLiveRadio) return;
    if (this.playReportedFor === this.currentTrack.id) return;
    this.playReportedFor = this.currentTrack.id;
    reportPlay(this.currentTrack);
  }

  private updateMediaSession(track: Track) {
    if (typeof window !== 'undefined' && 'mediaSession' in navigator) {
      try {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: track.title,
          artist: track.artist,
          album: track.album || 'RezBeatsAI Master',
          artwork: [
            { src: track.coverUrl, sizes: '96x96', type: 'image/jpeg' },
            { src: track.coverUrl, sizes: '128x128', type: 'image/jpeg' },
            { src: track.coverUrl, sizes: '192x192', type: 'image/jpeg' },
            { src: track.coverUrl, sizes: '256x256', type: 'image/jpeg' },
            { src: track.coverUrl, sizes: '384x384', type: 'image/jpeg' },
            { src: track.coverUrl, sizes: '512x512', type: 'image/jpeg' },
          ],
        });
        navigator.mediaSession.playbackState = 'playing';
      } catch (e) {
        console.warn('Media Session Metadata construction failed:', e);
      }
    }
  }

  public setMediaSessionHandlers(onPlay: () => void, onPause: () => void, onNext: () => void, onPrev: () => void) {
    if (typeof window !== 'undefined' && 'mediaSession' in navigator) {
      try {
        navigator.mediaSession.setActionHandler('play', () => {
          this.userWantsPlay = true;
          onPlay();
        });
        navigator.mediaSession.setActionHandler('pause', () => {
          this.userWantsPlay = false;
          onPause();
        });
        navigator.mediaSession.setActionHandler('nexttrack', onNext);
        navigator.mediaSession.setActionHandler('previoustrack', onPrev);
        navigator.mediaSession.setActionHandler('seekto', (details) => {
          if (details.seekTime !== undefined) {
            this.seek(details.seekTime);
          }
        });
        navigator.mediaSession.setActionHandler('seekforward', (details) => {
          const skip = details.seekOffset || 10;
          this.seek(this.getCurrentTime() + skip);
        });
        navigator.mediaSession.setActionHandler('seekbackward', (details) => {
          const skip = details.seekOffset || 10;
          this.seek(Math.max(0, this.getCurrentTime() - skip));
        });
      } catch (err) {
        console.warn('Failed to bind media session action handlers:', err);
      }
    }
  }

  /**
   * Safe graceful fallback when a track cannot be played:
   * Stops audio and advances to the next track without buzzing or artificial noise.
   */
  private startGenerativeFallback() {
    this.isUsingHtmlAudio = false;
    this.isUsingYouTube = false;
    this.stopYtProgressPolling();
    this.stopGenerativeSynth(); // NEVER play detuned oscillator buzzing sounds

    if (this.audioEl) {
      this.audioEl.pause();
    }
    if (this.ytPlayer && typeof this.ytPlayer.pauseVideo === 'function') {
      try {
        this.ytPlayer.pauseVideo();
      } catch {}
    }

    console.warn('Track failed to play across all audio sources:', this.currentTrack?.title);
    this.isPlaying = false;

    // Gracefully advance to the next song in the queue after a brief delay
    if (!this.isLiveRadio) {
      window.setTimeout(() => {
        if (!this.isPlaying && this.currentTrack) {
          this.notifyEnded();
        }
      }, 1000);
    }
  }

  public play() {
    this.userWantsPlay = true;
    if (this.isPlaying) return;

    if (this.isUsingYouTube && this.ytPlayer && typeof this.ytPlayer.playVideo === 'function') {
      try {
        this.ytPlayer.playVideo();
        this.isPlaying = true;
        this.startYtProgressPolling();
        this.startSilentKeepAlive();
        if (typeof window !== 'undefined' && 'mediaSession' in navigator) {
          navigator.mediaSession.playbackState = 'playing';
        }
        return;
      } catch {}
    }

    if (this.isUsingHtmlAudio && this.audioEl && this.audioEl.src && this.audioEl.src !== SILENT_AUDIO_URI) {
      this.audioEl
        .play()
        .then(() => {
          this.isPlaying = true;
          if (typeof window !== 'undefined' && 'mediaSession' in navigator) {
            navigator.mediaSession.playbackState = 'playing';
          }
        })
        .catch(() => {
          if (this.currentTrack) {
            void this.playFullSongForPreviewTrack(this.currentTrack, undefined, ++this.playToken);
          }
        });
    } else if (this.currentTrack) {
      this.playTrack(this.currentTrack);
    } else {
      this.isPlaying = false;
    }
  }

  public pause() {
    this.userWantsPlay = false;
    this.isPlaying = false;

    if (this.isUsingYouTube && this.ytPlayer && typeof this.ytPlayer.pauseVideo === 'function') {
      try {
        this.ytPlayer.pauseVideo();
      } catch {}
      this.stopYtProgressPolling();
    }

    if (this.audioEl) {
      this.audioEl.pause();
    }
    if (typeof window !== 'undefined' && 'mediaSession' in navigator) {
      navigator.mediaSession.playbackState = 'paused';
    }
    this.stopGenerativeSynth();
    if (this.synthTimer) {
      window.clearInterval(this.synthTimer);
      this.synthTimer = null;
    }
  }

  public seek(seconds: number) {
    if (this.isUsingYouTube && this.ytPlayer && typeof this.ytPlayer.seekTo === 'function') {
      try {
        this.ytPlayer.seekTo(seconds, true);
        const dur = typeof this.ytPlayer.getDuration === 'function' ? this.ytPlayer.getDuration() : (this.currentTrack?.durationSec || 210);
        this.notifyTimeUpdate(seconds, dur);
        return;
      } catch {}
    }

    if (this.isUsingHtmlAudio && this.audioEl && !isNaN(this.audioEl.duration)) {
      this.audioEl.currentTime = Math.max(0, Math.min(seconds, this.audioEl.duration));
      this.notifyTimeUpdate(this.audioEl.currentTime, this.audioEl.duration);
    } else {
      this.synthCurrentTime = Math.max(0, Math.min(seconds, this.synthTotalDuration));
      this.notifyTimeUpdate(this.synthCurrentTime, this.synthTotalDuration);
    }
  }

  public getCurrentTime(): number {
    if (this.isUsingYouTube && this.ytPlayer && typeof this.ytPlayer.getCurrentTime === 'function') {
      try {
        return this.ytPlayer.getCurrentTime() || 0;
      } catch {}
    }
    if (this.isUsingHtmlAudio && this.audioEl) {
      return this.audioEl.currentTime || 0;
    }
    return this.synthCurrentTime;
  }

  public getDuration(): number {
    if (this.isUsingYouTube && this.ytPlayer && typeof this.ytPlayer.getDuration === 'function') {
      try {
        const dur = this.ytPlayer.getDuration();
        if (dur && !isNaN(dur) && dur > 0) return dur;
      } catch {}
    }
    if (this.isUsingHtmlAudio && this.audioEl && this.audioEl.duration && !isNaN(this.audioEl.duration)) {
      return this.audioEl.duration;
    }
    return this.currentTrack?.durationSec || this.synthTotalDuration;
  }

  public getCurrentTrack(): Track | null {
    return this.currentTrack;
  }

  public getPlaybackState(): boolean {
    return this.isPlaying;
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.audioEl) {
      this.audioEl.volume = this.volume;
    }
    if (this.ytPlayer && typeof this.ytPlayer.setVolume === 'function') {
      try {
        this.ytPlayer.setVolume(this.volume * 100);
      } catch {}
    }
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.volume * 0.35, this.ctx.currentTime);
    }
  }

  // --- Generative Web Audio API Helpers ---

  private playGenerativeSynth() {
    this.initWebAudio();
    if (!this.ctx) return;

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    this.isPlaying = true;
    this.playChord(this.chords[this.currentChordIndex]);

    if (this.chordInterval) {
      window.clearInterval(this.chordInterval);
    }
    this.chordInterval = window.setInterval(() => {
      if (!this.isPlaying) return;
      this.currentChordIndex = (this.currentChordIndex + 1) % this.chords.length;
      this.playChord(this.chords[this.currentChordIndex]);
    }, 4500);
  }

  private stopGenerativeSynth() {
    if (this.chordInterval) {
      window.clearInterval(this.chordInterval);
      this.chordInterval = null;
    }
    if (this.oscillators.length > 0) {
      this.oscillators.forEach((osc) => {
        try {
          osc.stop();
          osc.disconnect();
        } catch {}
      });
      this.oscillators = [];
    }
  }

  private playChord(frequencies: number[]) {
    if (!this.ctx || !this.filter) return;
    const now = this.ctx.currentTime;

    this.oscillators.forEach((osc) => {
      try {
        osc.stop(now + 1.2);
      } catch {}
    });
    this.oscillators = [];

    frequencies.forEach((freq, idx) => {
      if (!this.ctx || !this.filter) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = idx === 0 ? 'sine' : idx % 2 === 0 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(freq, now);
      osc.detune.setValueAtTime((idx - 1.5) * 4, now);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(0.08, now + 1.5);
      gain.gain.exponentialRampToValueAtTime(0.05, now + 5.0);

      osc.connect(gain);
      gain.connect(this.filter);
      osc.start(now);
      this.oscillators.push(osc);
    });
  }

  public getFrequencyData(): Uint8Array {
    if (this.analyser && this.isPlaying) {
      const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
      this.analyser.getByteFrequencyData(dataArray);

      const sum = dataArray.reduce((acc, v) => acc + v, 0);
      if (sum > 10) {
        return dataArray;
      }
    }

    if (this.isPlaying) {
      const simulated = new Uint8Array(32);
      const time = Date.now() * 0.005;
      for (let i = 0; i < 32; i++) {
        const wave = Math.sin(time + i * 0.3) * 0.5 + 0.5;
        const wave2 = Math.cos(time * 0.8 + i * 0.5) * 0.5 + 0.5;
        simulated[i] = Math.floor((wave * 0.6 + wave2 * 0.4) * 180 + 40);
      }
      return simulated;
    }

    return new Uint8Array(32).fill(0);
  }
}

export const audioEngine = new AudioEngine();
