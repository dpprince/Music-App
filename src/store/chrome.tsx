import React, { createContext, useContext, useState } from 'react';
import { usePlayer } from './player';

export const CHROME = {
  tabH: 54,
  miniH: 62,
  miniMargin: 12,
  gap: 8,
};

export function useBottomPad() {
  const { current } = usePlayer();
  const { hideMini } = useChrome();
  const showMini = !hideMini && !!current;
  return (showMini ? CHROME.miniH + CHROME.miniMargin + CHROME.gap : 0) + CHROME.tabH + CHROME.gap + 10;
}

export type ActionTarget = {
  kind: 'track' | 'album' | 'playlist' | 'artist';
  id: string;
};

type Ctx = {
  nowPlaying: boolean;
  openNowPlaying: () => void;
  closeNowPlaying: () => void;
  queueSheet: boolean;
  setQueueSheet: (v: boolean) => void;
  lyricsSheet: boolean;
  setLyricsSheet: (v: boolean) => void;
  actionSheet: ActionTarget | null;
  setActionSheet: (t: ActionTarget | null) => void;
  shareMode: boolean;
  setShareMode: (v: boolean) => void;
  hideMini: boolean;
  setHideMini: (v: boolean) => void;
  accountOpen: boolean;
  setAccountOpen: (v: boolean) => void;
};

const ChromeCtx = createContext<Ctx | null>(null);

export function ChromeProvider({ children }: { children: React.ReactNode }) {
  const [nowPlaying, setNowPlaying] = useState(false);
  const [queueSheet, setQueueSheet] = useState(false);
  const [lyricsSheet, setLyricsSheet] = useState(false);
  const [actionSheet, setActionSheet] = useState<ActionTarget | null>(null);
  const [shareMode, setShareMode] = useState(false);
  const [hideMini, setHideMini] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);

  const value: Ctx = {
    nowPlaying,
    openNowPlaying: () => setNowPlaying(true),
    closeNowPlaying: () => setNowPlaying(false),
    queueSheet,
    setQueueSheet,
    lyricsSheet,
    setLyricsSheet,
    actionSheet,
    setActionSheet,
    shareMode,
    setShareMode,
    hideMini,
    setHideMini,
    accountOpen,
    setAccountOpen,
  };
  return <ChromeCtx.Provider value={value}>{children}</ChromeCtx.Provider>;
}

export function useChrome() {
  const v = useContext(ChromeCtx);
  if (!v) throw new Error('useChrome must be used within ChromeProvider');
  return v;
}