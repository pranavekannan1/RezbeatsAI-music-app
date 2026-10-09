import { useState, useEffect, useRef } from 'react';
import {
  TabType,
  Track,
  AppTheme,
  UserAuthProfile,
} from './types';
import { DEFAULT_NOW_PLAYING_TRACK } from './data/musicData';
import { audioEngine } from './services/audioEngine';
import {
  addToRecentlyPlayed,
  getAppTheme,
  getEndlessQueueTracks,
  getAuthUser,
  prefetchRelatedTracks,
} from './services/musicService';
import { subscribeToFirebaseAuthState } from './services/firebase';

import { Header } from './components/Header';
import { PWAInstallButton } from './components/PWAInstallButton';
import { BottomNav } from './components/BottomNav';
import { MiniPlayer } from './components/MiniPlayer';
import { NowPlayingModal } from './components/NowPlayingModal';
import { QueueModal } from './components/QueueModal';
import { AudioQualitySelector } from './components/AudioQualitySelector';

import { AuthScreen } from './screens/AuthScreen';
import { HomeScreen } from './screens/HomeScreen';
import { DiscoverScreen } from './screens/DiscoverScreen';
import { RadioScreen } from './screens/RadioScreen';
import { StudioScreen } from './screens/StudioScreen';
import { LibraryScreen } from './screens/LibraryScreen';
import { ProfileScreen } from './screens/ProfileScreen';

function getYouTubeWatchUrl(track: Track): string | null {
  const idFromTrack = track.id.match(/^(?:youtube[_-]|yt[_-])?([\w-]{11})$/)?.[1];
  const idFromUrl = [track.audioUrl, track.sourceUrl, track.previewUrl]
    .map((url) => url?.match(/(?:v=|youtu\.be\/|embed\/|[?&]id=)([\w-]{11})/)?.[1])
    .find(Boolean);
  const videoId = idFromTrack || idFromUrl;
  return videoId ? `https://www.youtube.com/watch?v=${videoId}` : null;
}

export default function App() {
  const [currentUser, setCurrentUser] =
    useState<UserAuthProfile>(() => getAuthUser());

  const [currentTab, setCurrentTab] =
    useState<TabType>('home');

  const [currentTrack, setCurrentTrack] =
    useState<Track>(DEFAULT_NOW_PLAYING_TRACK);

  const [isPlaying, setIsPlaying] =
    useState<boolean>(false);

  const [playbackError, setPlaybackError] =
    useState<string | null>(null);

  const [showNowPlayingModal, setShowNowPlayingModal] =
    useState<boolean>(false);

  const [showQueueModal, setShowQueueModal] =
    useState<boolean>(false);

  const [showQualityModal, setShowQualityModal] =
    useState<boolean>(false);


  const [progressPercent, setProgressPercent] =
    useState<number>(0);

  const [appTheme, setAppThemeState] =
    useState<AppTheme>(getAppTheme());

  const currentTrackYouTubeUrl = getYouTubeWatchUrl(currentTrack);

  /*
   * ------------------------------------------------------------
   * FIREBASE AUTHENTICATION
   * ------------------------------------------------------------
   */

  useEffect(() => {
    const unsubscribe =
      subscribeToFirebaseAuthState((profile) => {
        if (profile) {
          setCurrentUser(profile);
        }
      });

    const handleAuthChange = (
      event: Event
    ) => {
      const customEvent =
        event as CustomEvent<UserAuthProfile>;

      if (customEvent.detail) {
        if (!customEvent.detail.isLoggedIn) {
          audioEngine.stop();
          setIsPlaying(false);
          setProgressPercent(0);
        }
        setCurrentUser(customEvent.detail);
      }
    };

    window.addEventListener(
      'rezbeatsai_auth_change',
      handleAuthChange
    );

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }

      window.removeEventListener(
        'rezbeatsai_auth_change',
        handleAuthChange
      );
    };
  }, []);

  /*
   * ------------------------------------------------------------
   * ACTIVE PLAY QUEUE
   * ------------------------------------------------------------
   */

  const [queue, setQueue] = useState<Track[]>([
    DEFAULT_NOW_PLAYING_TRACK,
  ]);

  const [queueIndex, setQueueIndex] =
    useState<number>(0);

  const queueRef = useRef<Track[]>(queue);

  const queueIndexRef =
    useRef<number>(queueIndex);

  useEffect(() => {
    queueRef.current = queue;
    queueIndexRef.current = queueIndex;
  }, [queue, queueIndex]);

  /*
   * ------------------------------------------------------------
   * THEME SYNCHRONIZATION
   * ------------------------------------------------------------
   */

  useEffect(() => {
    const handleThemeChange = (
      event: Event
    ) => {
      const customEvent =
        event as CustomEvent<AppTheme>;

      if (customEvent.detail) {
        setAppThemeState(customEvent.detail);
      }
    };

    window.addEventListener(
      'rezbeatsai_theme_change',
      handleThemeChange
    );

    return () => {
      window.removeEventListener(
        'rezbeatsai_theme_change',
        handleThemeChange
      );
    };
  }, []);

  /*
   * ------------------------------------------------------------
   * AUDIO ENGINE
   * ------------------------------------------------------------
   */

  useEffect(() => {
    const unsubscribeTime =
      audioEngine.onTimeUpdate(
        (currentTime, duration) => {
          if (duration > 0) {
            setProgressPercent(
              (currentTime / duration) * 100
            );
          }
        }
      );

    const unsubscribePlaybackState =
      audioEngine.onPlaybackState((playing) => {
        setIsPlaying(playing);
        if (playing) setPlaybackError(null);
      });

    const unsubscribePlaybackError =
      audioEngine.onPlaybackError(setPlaybackError);

    const unsubscribeEnded =
      audioEngine.onEnded(() => {
        const currentQueue =
          queueRef.current;

        const currentIndex =
          queueIndexRef.current;

        if (
          currentIndex + 1 <
          currentQueue.length
        ) {
          const nextIndex =
            currentIndex + 1;

          const nextTrack =
            currentQueue[nextIndex];

          setQueueIndex(nextIndex);
          setCurrentTrack(nextTrack);
          setProgressPercent(0);

          addToRecentlyPlayed(nextTrack);

          audioEngine.playTrack(nextTrack);

          setIsPlaying(true);
        } else {
          const endlessTracks =
            getEndlessQueueTracks(
              currentQueue,
              6
            );

          if (endlessTracks.length === 0) {
            setIsPlaying(false);
            return;
          }

          const newQueue = [
            ...currentQueue,
            ...endlessTracks,
          ];

          const nextIndex =
            currentIndex + 1;

          const nextTrack =
            newQueue[nextIndex];

          if (!nextTrack) {
            setIsPlaying(false);
            return;
          }

          setQueue(newQueue);
          setQueueIndex(nextIndex);
          setCurrentTrack(nextTrack);
          setProgressPercent(0);

          addToRecentlyPlayed(nextTrack);

          audioEngine.playTrack(nextTrack);

          setIsPlaying(true);
        }
      });

    return () => {
      unsubscribeTime();
      unsubscribePlaybackState();
      unsubscribePlaybackError();
      unsubscribeEnded();
    };
  }, []);

  /*
   * Pre-resolve the full-length source for the next queued track, so
   * auto-advance starts instantly (matters most on mobile browsers that
   * are strict about audio starting long after a tap).
   */
  useEffect(() => {
    const nextTrack = queue[queueIndex + 1];
    if (nextTrack) {
      audioEngine.warmYouTubeMatch(nextTrack);
    }
  }, [queue, queueIndex]);

  /*
   * Prefetch related tracks whenever the playing track changes so the
   * endless queue serves songs related to what the user is listening to
   * (same artist / genre) rather than random recently played songs.
   */
  useEffect(() => {
    if (currentTrack && currentTrack.id !== 'default_now_playing') {
      prefetchRelatedTracks(currentTrack);
    }
  }, [currentTrack]);

  /*
   * ------------------------------------------------------------
   * MEDIA SESSION
   * ------------------------------------------------------------
   */

  useEffect(() => {
    if (!currentUser.isLoggedIn) {
      audioEngine.stop();
      return;
    }

    audioEngine.setMediaSessionHandlers(
      () => {
        audioEngine.play();
      },

      () => {
        audioEngine.pause();
        setIsPlaying(false);
      },

      () => {
        handleNextTrack();
      },

      () => {
        handlePrevTrack();
      }
    );
  }, [currentUser.isLoggedIn]);

  /*
   * ------------------------------------------------------------
   * PLAY / PAUSE
   * ------------------------------------------------------------
   */

  const togglePlay = () => {
    setPlaybackError(null);
    if (isPlaying) {
      audioEngine.pause();
      setIsPlaying(false);
      return;
    }

    audioEngine.playTrack(currentTrack);
    setIsPlaying(true);
  };

  /*
   * ------------------------------------------------------------
   * PLAY TRACK
   * ------------------------------------------------------------
   */

  const playTrack = (
    track: Track,
    newQueue?: Track[]
  ) => {
    setPlaybackError(null);
    setCurrentTrack(track);
    setProgressPercent(0);

    addToRecentlyPlayed(track);

    if (
      newQueue &&
      newQueue.length > 0
    ) {
      setQueue(newQueue);

      const foundIndex =
        newQueue.findIndex(
          (item) => item.id === track.id
        );

      setQueueIndex(
        foundIndex >= 0
          ? foundIndex
          : 0
      );
    } else {
      setQueue((previousQueue) => {
        const existingIndex =
          previousQueue.findIndex(
            (item) => item.id === track.id
          );

        if (existingIndex >= 0) {
          setQueueIndex(existingIndex);
          return previousQueue;
        }

        const updatedQueue = [
          ...previousQueue,
          track,
        ];

        setQueueIndex(
          updatedQueue.length - 1
        );

        return updatedQueue;
      });
    }

    audioEngine.playTrack(track);
    setIsPlaying(true);
  };

  /*
   * ------------------------------------------------------------
   * NEXT TRACK
   * ------------------------------------------------------------
   */

  const handleNextTrack = () => {
    const currentQueue =
      queueRef.current;

    const currentIndex =
      queueIndexRef.current;

    if (currentQueue.length === 0) {
      return;
    }

    if (
      currentIndex + 1 <
      currentQueue.length
    ) {
      const nextIndex =
        currentIndex + 1;

      const nextTrack =
        currentQueue[nextIndex];

      setQueueIndex(nextIndex);
      setCurrentTrack(nextTrack);
      setProgressPercent(0);

      addToRecentlyPlayed(nextTrack);

      audioEngine.playTrack(nextTrack);
      setIsPlaying(true);

      return;
    }

    const endlessTracks =
      getEndlessQueueTracks(
        currentQueue,
        6
      );

    if (endlessTracks.length === 0) {
      return;
    }

    const newQueue = [
      ...currentQueue,
      ...endlessTracks,
    ];

    const nextIndex =
      currentIndex + 1;

    const nextTrack =
      newQueue[nextIndex];

    if (!nextTrack) {
      return;
    }

    setQueue(newQueue);
    setQueueIndex(nextIndex);
    setCurrentTrack(nextTrack);
    setProgressPercent(0);

    addToRecentlyPlayed(nextTrack);

    audioEngine.playTrack(nextTrack);
    setIsPlaying(true);
  };

  /*
   * ------------------------------------------------------------
   * PREVIOUS TRACK
   * ------------------------------------------------------------
   */

  const handlePrevTrack = () => {
    const currentTime =
      audioEngine.getCurrentTime();

    if (currentTime > 3) {
      audioEngine.seek(0);
      setProgressPercent(0);
      return;
    }

    const currentQueue =
      queueRef.current;

    const currentIndex =
      queueIndexRef.current;

    if (currentQueue.length === 0) {
      return;
    }

    const previousIndex =
      currentIndex <= 0
        ? 0
        : currentIndex - 1;

    const previousTrack =
      currentQueue[previousIndex];

    setQueueIndex(previousIndex);
    setCurrentTrack(previousTrack);
    setProgressPercent(0);

    addToRecentlyPlayed(previousTrack);

    audioEngine.playTrack(previousTrack);
    setIsPlaying(true);
  };

  /*
   * ------------------------------------------------------------
   * QUEUE MANAGEMENT
   * ------------------------------------------------------------
   */

  const handleRemoveFromQueue = (
    targetIndex: number
  ) => {
    setQueue((previousQueue) => {
      const nextQueue =
        previousQueue.filter(
          (_, index) =>
            index !== targetIndex
        );

      if (
        targetIndex <
        queueIndexRef.current
      ) {
        setQueueIndex((currentIndex) =>
          Math.max(0, currentIndex - 1)
        );
      }

      return nextQueue;
    });
  };

  const handleMoveQueueItem = (
    fromIndex: number,
    toIndex: number
  ) => {
    setQueue((previousQueue) => {
      const copy = [
        ...previousQueue,
      ];

      const [item] =
        copy.splice(fromIndex, 1);

      if (item) {
        copy.splice(toIndex, 0, item);
      }

      return copy;
    });
  };

  const handleClearUpcoming = () => {
    setQueue((previousQueue) =>
      previousQueue.slice(
        0,
        queueIndexRef.current + 1
      )
    );
  };

  const handleAddToQueue = (track: Track) => {
    setQueue((prev) => {
      const alreadyInQueue = prev.some((t) => t.id === track.id);
      if (alreadyInQueue) return prev;
      return [...prev, track];
    });
  };

  const handlePlayNext = (track: Track) => {
    setQueue((prev) => {
      const currentIndex = queueIndexRef.current;
      // Remove existing occurrence of the track if present
      const filtered = prev.filter((t) => t.id !== track.id);
      const insertAt = currentIndex + 1;
      const next = [
        ...filtered.slice(0, insertAt),
        track,
        ...filtered.slice(insertAt),
      ];
      return next;
    });
  };

  /*
   * ------------------------------------------------------------
   * AI STUDIO SESSION
   * ------------------------------------------------------------
   */

  const handleStartSession = (
    tracks: Track[]
  ) => {
    if (tracks.length === 0) {
      return;
    }

    playTrack(tracks[0], tracks);
    setShowNowPlayingModal(true);
  };

  /*
   * ------------------------------------------------------------
   * AUTHENTICATION GATE
   * ------------------------------------------------------------
   */

  if (
    !currentUser ||
    !currentUser.isLoggedIn
  ) {
    return (
      <div
        data-theme={appTheme}
        className="transition-colors duration-300"
      >
        <AuthScreen
          onAuthSuccess={(user) => {
            setCurrentUser(user);
          }}
        />
      </div>
    );
  }

  /*
   * ------------------------------------------------------------
   * MAIN REZBEATSAI MUSIC APPLICATION
   * ------------------------------------------------------------
   */

  return (
    <div
      data-theme={appTheme}
      className="min-h-screen bg-[var(--bg-app)] text-[var(--text-primary)] flex flex-col font-sans selection:bg-[#7928ca] selection:text-white transition-colors duration-300"
    >
      <Header
        currentTab={currentTab}
        onNavigate={(tab) => {
          setCurrentTab(tab);
        }}
        onOpenQuality={() => {
          setShowQualityModal(true);
        }}
      />

      {/* PWA INSTALL BUTTON */}
      <div className="fixed top-[72px] right-4 z-40">
        <PWAInstallButton />
      </div>

      <main className="flex-1 w-full max-w-[1720px] mx-auto px-3 sm:px-6 md:px-8 lg:px-10 xl:px-12 pt-16 pb-28 transition-all duration-300">
        {currentTab === 'home' && (
          <HomeScreen
            onPlayTrack={playTrack}
            onNavigateTab={setCurrentTab}
            currentTrackId={currentTrack.id}
            isPlaying={isPlaying}
            onAddToQueue={handleAddToQueue}
            onPlayNext={handlePlayNext}
          />
        )}

        {currentTab === 'discover' && (
          <DiscoverScreen
            onPlayTrack={playTrack}
            currentTrackId={currentTrack.id}
            isPlaying={isPlaying}
            onAddToQueue={handleAddToQueue}
            onPlayNext={handlePlayNext}
          />
        )}

        {currentTab === 'radio' && (
          <RadioScreen
            onPlayTrack={playTrack}
            currentTrackId={currentTrack.id}
            isPlaying={isPlaying}
          />
        )}

        {currentTab === 'library' && (
          <LibraryScreen
            onPlayTrack={playTrack}
            currentTrackId={currentTrack.id}
            isPlaying={isPlaying}
          />
        )}

        {currentTab === 'studio' && (
          <StudioScreen
            onStartSession={
              handleStartSession
            }
            onPlaySingleTrack={playTrack}
          />
        )}

        {currentTab === 'profile' && (
          <ProfileScreen />
        )}
      </main>

      <MiniPlayer
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        onTogglePlay={togglePlay}
        onOpenNowPlaying={() =>
          setShowNowPlayingModal(true)
        }
        onOpenStudio={() =>
          setCurrentTab('studio')
        }
        progressPercent={
          progressPercent
        }
        hidden={showNowPlayingModal}
      />

      {playbackError && (
        <div
          role="alert"
          aria-live="assertive"
          className="fixed top-16 left-1/2 z-[60] flex w-[min(92vw,34rem)] -translate-x-1/2 items-center gap-3 rounded-xl border border-red-500/30 bg-white px-4 py-3 text-sm text-slate-900 shadow-xl"
        >
          <span className="material-symbols-outlined text-red-600" aria-hidden="true">
            error
          </span>
          <span className="min-w-0 flex-1">{playbackError}</span>
          {currentTrackYouTubeUrl ? (
            <a
              href={currentTrackYouTubeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg bg-violet-700 px-3 py-2 font-semibold text-white hover:bg-violet-800"
            >
              Open on YouTube
            </a>
          ) : (
            <button
              type="button"
              className="rounded-lg bg-violet-700 px-3 py-2 font-semibold text-white hover:bg-violet-800"
              onClick={() => {
                setPlaybackError(null);
                audioEngine.playTrack(currentTrack);
              }}
            >
              Retry
            </button>
          )}
          <button
            type="button"
            aria-label="Dismiss playback error"
            className="rounded-md p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            onClick={() => setPlaybackError(null)}
          >
            <span className="material-symbols-outlined" aria-hidden="true">close</span>
          </button>
        </div>
      )}

      {showNowPlayingModal && (
        <NowPlayingModal
          track={currentTrack}
          isPlaying={isPlaying}
          onTogglePlay={togglePlay}
          onClose={() =>
            setShowNowPlayingModal(false)
          }
          onNextTrack={handleNextTrack}
          onPrevTrack={handlePrevTrack}
          queue={queue}
          onOpenQueue={() =>
            setShowQueueModal(true)
          }
          currentTab={currentTab}
          onNavigate={(tab) => {
            setCurrentTab(tab);
            setShowNowPlayingModal(false);

            window.scrollTo({
              top: 0,
              behavior: 'smooth',
            });
          }}
        />
      )}

      {showQueueModal && (
        <QueueModal
          currentTrack={currentTrack}
          queue={queue}
          queueIndex={queueIndex}
          isPlaying={isPlaying}
          onClose={() =>
            setShowQueueModal(false)
          }
          onSelectTrack={(track, index) => {
            setQueueIndex(index);
            setCurrentTrack(track);

            addToRecentlyPlayed(track);

            audioEngine.playTrack(track);

            setIsPlaying(true);
          }}
          onRemoveFromQueue={
            handleRemoveFromQueue
          }
          onMoveQueueItem={
            handleMoveQueueItem
          }
          onClearUpcoming={
            handleClearUpcoming
          }
        />
      )}

      <AudioQualitySelector
        isOpen={showQualityModal}
        onClose={() =>
          setShowQualityModal(false)
        }
      />

      <BottomNav
        currentTab={currentTab}
        onTabChange={(tab) => {
          setCurrentTab(tab);
          setShowNowPlayingModal(false);

          window.scrollTo({
            top: 0,
            behavior: 'smooth',
          });
        }}
      />
    </div>
  );
}
