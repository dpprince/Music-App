import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { albumAudio } from '../data/assets';
import { albumById, artistAlbums, playlistTracks, trackInfo, type TrackInfo } from '../data/catalog';

export type RepeatMode = 'off' | 'all' | 'one';
export type PlayContext = { kind: 'album' | 'playlist'; id: string; startIndex: number };

type TrackItem = TrackInfo;

type Actions = {
  playAlbum: (albumId: string, startIndex?: number) => void;
  playPlaylist: (playlistId: string, startIndex?: number) => void;
  playTrackList: (items: TrackItem[], startIndex?: number) => void;
  playNext: (item: TrackItem) => void;
  playLater: (item: TrackItem) => void;
  togglePlay: () => void;
  next: () => void;
  prev: () => void;
  seekFraction: (f: number) => void;
  setRepeat: (r: RepeatMode) => void;
  toggleShuffle: () => void;
  toggleAutoplay: () => void;
  clearUpNext: () => void;
  toggleLove: (trackId: string) => void;
  isLoved: (trackId: string) => boolean;
  clearRecents: () => void;
  clearHistory: () => void;
  pushSearch: (term: string) => void;
};

type CtxType = {
  current: TrackItem | null;
  index: number;
  queue: TrackItem[];
  isPlaying: boolean;
  position: number;
  repeat: RepeatMode;
  shuffle: boolean;
  autoplay: boolean;
  loved: string[];
  recentAlbums: string[];
  searchHistory: string[];
  lastContext: PlayContext | null;
} & Actions;

const Ctx = createContext<CtxType | null>(null);

const S = {
  liked: 'aria.liked',
  recents: 'aria.recentAlbums',
  history: 'aria.searchHistory',
  autoplay: 'aria.autoplay',
};

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const player = useRef<AudioPlayer | null>(null);
  const loadedAlbum = useRef<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [current, setCurrent] = useState<TrackItem | null>(null);
  const [index, setIndex] = useState(0);
  const [queue, setQueue] = useState<TrackItem[]>([]);
  const [position, setPosition] = useState(0);
  const [repeat, setRepeat] = useState<RepeatMode>('off');
  const [shuffle, setShuffle] = useState(false);
  const [autoplay, setAutoplay] = useState(false);
  const [loved, setLoved] = useState<string[]>([]);
  const [recentAlbums, setRecentAlbums] = useState<string[]>([]);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [lastContext, setLastContext] = useState<PlayContext | null>(null);

  const live = useRef({
    current,
    index,
    queue,
    isPlaying,
    repeat,
    autoplay,
    shuffle,
    position,
  });
  live.current.current = current;
  live.current.index = index;
  live.current.queue = queue;
  live.current.isPlaying = isPlaying;
  live.current.repeat = repeat;
  live.current.autoplay = autoplay;
  live.current.shuffle = shuffle;
  live.current.position = position;

  useEffect(() => {
    let gone = false;
    const boot = async () => {
      try {
        if (!gone) await setAudioModeAsync({ playsInSilentMode: true });
      } catch {}
      try {
        if (!gone) player.current = createAudioPlayer(null, { updateInterval: 500 });
      } catch {
        try {
          if (!gone) player.current = createAudioPlayer();
        } catch {}
      }
      const [l, r, h, a] = await Promise.all([
        AsyncStorage.getItem(S.liked),
        AsyncStorage.getItem(S.recents),
        AsyncStorage.getItem(S.history),
        AsyncStorage.getItem(S.autoplay),
      ]);
      if (gone) return;
      if (l) setLoved(JSON.parse(l));
      if (r) setRecentAlbums(JSON.parse(r));
      if (h) setSearchHistory(JSON.parse(h));
      if (a !== null) setAutoplay(a === 'true');
    };
    boot();
    return () => {
      gone = true;
      try {
        player.current?.release();
      } catch {}
    };
  }, []);

  const persist = useCallback((key: string, value: unknown) => {
    AsyncStorage.setItem(key, JSON.stringify(value)).catch(() => {});
  }, []);

  const rememberAlbum = useCallback(
    (albumId: string) => {
      setRecentAlbums(prev => {
        const next = [albumId, ...prev.filter(x => x !== albumId)].slice(0, 30);
        persist(S.recents, next);
        return next;
      });
    },
    [persist]
  );

  const playItem = useCallback(
    (item: TrackItem, isStart: boolean) => {
      const p = player.current;
      if (!p) return;
      const albumId = item.album.id;
      if (isStart) loadedAlbum.current = null;
      if (albumId !== loadedAlbum.current) {
        loadedAlbum.current = albumId;
        try {
          p.replace(albumAudio(albumId));
        } catch {}
        setTimeout(() => {
          try {
            p.seekTo(item.offset + 0.04);
            p.play();
          } catch {}
        }, Platform.OS === 'web' ? 140 : 60);
      } else {
        try {
          p.seekTo(item.offset + 0.04);
          p.play();
        } catch {}
      }
      setPosition(0);
      setIsPlaying(true);
      rememberAlbum(item.album.id);
    },
    [rememberAlbum]
  );

  const settle = useCallback(
    (items: TrackItem[], startIndex: number, ctx: PlayContext | null) => {
      const item = items[startIndex];
      setQueue(items);
      setIndex(-1);
      setCurrent(item);
      setLastContext(ctx);
      // Allow React + audio replace to settle before seeking.
      setTimeout(() => {
        setIndex(startIndex);
        setCurrent(item);
        playItem(item, true);
      }, 40);
    },
    [playItem]
  );

  function endRide(p: AudioPlayer) {
    const s = live.current;
    const it = s.queue[s.index];
    if (it) p.seekTo(it.offset);
    p.pause();
    setIsPlaying(false);
  }

  const advance = useCallback(() => {
    const s = live.current;
    const { queue: q, index: i, repeat: r, autoplay: a } = s;
    const p = player.current;
    if (!p || !q.length) return;
    if (r === 'one') {
      p.seekTo(q[i].offset);
      p.play();
      setIsPlaying(true);
      return;
    }
    const last = i >= q.length - 1;
    if (last) {
      if (r === 'all') {
        const it = q[0];
        setIndex(0);
        setCurrent(it);
        playItem(it, q[0].album.id !== q[i]?.album?.id);
      } else if (a) {
        const cur = q[i];
        const artist = cur?.album?.artistId;
        let nextAlbumId: string | null = null;
        if (artist) {
          const disc = artistAlbums(artist);
          const ci = disc.findIndex(al => al.id === cur?.album?.id);
          if (ci >= 0) nextAlbumId = disc[(ci + 1) % disc.length]?.id ?? null;
        }
        if (nextAlbumId) {
          const album = albumById.get(nextAlbumId);
          if (album) {
            const items = album.tracks.map(t => trackInfo(t.id));
            const it = items[0];
            setQueue([...q, ...items]);
            setIndex(q.length);
            setCurrent(it);
            setLastContext(null);
            playItem(it, true);
          } else {
            endRide(p);
          }
        } else {
          endRide(p);
        }
      } else {
        endRide(p);
      }
      return;
    }
    const it = q[i + 1];
    setIndex(i + 1);
    setCurrent(it);
    playItem(it, false);
  }, [playItem]);

  useEffect(() => {
    const t = setInterval(() => {
      const p = player.current;
      const s = live.current;
      if (!p || !s.isPlaying || !s.queue[s.index]) return;
      let tSec = 0;
      try {
        tSec = p.currentTime ?? 0;
      } catch {
        return;
      }
      const item = s.queue[s.index];
      setPosition(Math.max(0, tSec - item.offset));
      if (tSec >= item.offset + item.track.duration - 0.3) advance();
    }, 250);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startShuffled = useCallback((items: TrackItem[], startIndex: number, ctx: PlayContext | null) => {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    settle(copy, 0, ctx);
  }, [settle]);

  const playAlbum = useCallback(
    (albumId: string, startIndex = 0) => {
      const album = albumById.get(albumId);
      if (!album) return;
      const items = album.tracks.map(t => trackInfo(t.id));
      const shuffleNow = live.current.shuffle;
      if (shuffleNow) startShuffled(items, 0, { kind: 'album', id: albumId, startIndex });
      else settle(items, startIndex, { kind: 'album', id: albumId, startIndex });
    },
    [settle, startShuffled]
  );

  const playPlaylist = useCallback(
    (playlistId: string, startIndex = 0) => {
      const items = playlistTracks(playlistId);
      if (!items.length) return;
      if (live.current.shuffle) startShuffled(items, 0, { kind: 'playlist', id: playlistId, startIndex });
      else settle(items, startIndex, { kind: 'playlist', id: playlistId, startIndex });
    },
    [settle, startShuffled]
  );

  const playTrackList = useCallback(
    (items: TrackItem[], startIndex = 0) => {
      if (!items.length) return;
      settle(items, startIndex, null);
    },
    [settle]
  );

  const togglePlay = useCallback(() => {
    const p = player.current;
    if (!p || !live.current.current) return;
    if (live.current.isPlaying) {
      p.pause();
      setIsPlaying(false);
    } else {
      p.play();
      setIsPlaying(true);
    }
  }, []);

  const playNext = useCallback(
    (item: TrackItem) => {
      if (!live.current.queue.length) return;
      setQueue(prev => {
        const i = prev.findIndex(x => x.track.id === item.track.id);
        const clean = i >= 0 ? prev.filter(x => x.track.id !== item.track.id) : prev;
        const at = Math.min(live.current.index + 1, clean.length);
        return [...clean.slice(0, at), item, ...clean.slice(at)];
      });
    },
    []
  );

  const playLater = useCallback((item: TrackItem) => {
    setQueue(prev => (prev.some(x => x.track.id === item.track.id) ? prev : [...prev, item]));
  }, []);

  const next = useCallback(() => advance(), [advance]);

  const prev = useCallback(() => {
    const s = live.current;
    const p = player.current;
    if (!p) return;
    const item = s.queue[s.index];
    if (!item) return;
    if (s.position > 3) {
      p.seekTo(item.offset);
      setPosition(0);
      return;
    }
    if (s.index === 0) {
      p.seekTo(item.offset);
      setPosition(0);
      return;
    }
    const it = s.queue[s.index - 1];
    setIndex(s.index - 1);
    setCurrent(it);
    playItem(it, false);
  }, [playItem]);

  const seekFraction = useCallback((f: number) => {
    const p = player.current;
    const item = live.current.current;
    if (!p || !item) return;
    const t = Math.max(0, Math.min(1, f)) * item.track.duration;
    try {
      p.seekTo(item.offset + t);
    } catch {}
    setPosition(t);
  }, []);

  const toggleShuffle = useCallback(() => {
    setShuffle(prev => {
      const on = !prev;
      if (on) {
        const q = live.current.queue;
        if (q.length > 1) {
          const ci = live.current.index;
          const c = q[ci];
          const rest = q.filter((_, i) => i !== ci);
          for (let i = rest.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [rest[i], rest[j]] = [rest[j], rest[i]];
          }
          const nextQ = [c, ...rest];
          setQueue(nextQ);
          setIndex(0);
        }
      }
      return on;
    });
  }, []);

  const toggleAutoplay = useCallback(() => {
    setAutoplay(prev => {
      const next = !prev;
      persist(S.autoplay, next);
      return next;
    });
  }, [persist]);

  const clearUpNext = useCallback(() => {
    setQueue(prev => prev.slice(0, live.current.index + 1));
  }, []);

  const toggleLove = useCallback(
    (trackId: string) => {
      setLoved(prev => {
        const has = prev.includes(trackId);
        const next = has ? prev.filter(x => x !== trackId) : [trackId, ...prev];
        persist(S.liked, next);
        return next;
      });
    },
    [persist]
  );

  const isLoved = useCallback((trackId: string) => loved.includes(trackId), [loved]);

  const clearRecents = useCallback(() => {
    setRecentAlbums([]);
    persist(S.recents, []);
  }, [persist]);

  const clearHistory = useCallback(() => {
    setSearchHistory([]);
    persist(S.history, []);
  }, [persist]);

  const pushSearch = useCallback(
    (term: string) => {
      if (!term.trim()) return;
      setSearchHistory(prev => {
        const next = [term, ...prev.filter(x => x.toLowerCase() !== term.toLowerCase())].slice(0, 12);
        persist(S.history, next);
        return next;
      });
    },
    [persist]
  );

  const value: CtxType = {
    current,
    index,
    queue,
    isPlaying,
    position,
    repeat,
    shuffle,
    autoplay,
    loved,
    recentAlbums,
    searchHistory,
    lastContext,
    playAlbum,
    playPlaylist,
    playTrackList,
    playNext,
    playLater,
    togglePlay,
    next,
    prev,
    seekFraction,
    setRepeat,
    toggleShuffle,
    toggleAutoplay,
    clearUpNext,
    toggleLove,
    isLoved,
    clearRecents,
    clearHistory,
    pushSearch,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function usePlayer() {
  const v = useContext(Ctx);
  if (!v) throw new Error('usePlayer must be used within PlayerProvider');
  return v;
}