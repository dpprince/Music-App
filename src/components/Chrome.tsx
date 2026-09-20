import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { MiniPlayer } from './MiniPlayer';
import { TabBar } from './TabBar';
import { NowPlaying } from './NowPlaying';
import { ActionSheet } from './ActionSheet';
import { QueueSheet, LyricsSheet, AccountSheet } from './Sheets';
import { Onboarding } from './Onboarding';
import { T } from './ui';
import { CHROME, useChrome } from '../store/chrome';
import { usePlayer } from '../store/player';
import { colors, spacing } from '../theme/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const ONBOARDED = 'aria.onboarded';

export function Chrome() {
  const insets = useSafeAreaInsets();
  const { hideMini, shareMode, setShareMode } = useChrome();
  const { current } = usePlayer();
  const [onboarded, setOnboarded] = useState<boolean | null>(null);

  useEffect(() => {
    const forceOnboard = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('onboarding');
    if (forceOnboard) {
      setOnboarded(false);
      return;
    }
    AsyncStorage.getItem(ONBOARDED).then(v => setOnboarded(v === '1')).catch(() => setOnboarded(true));
  }, []);

  const showMini = !hideMini && !!current;
  const tabBottom = insets.bottom + 10;
  const miniBottom = tabBottom + CHROME.tabH + CHROME.gap;

  return (
    <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
      {onboarded === false ? (
        <Onboarding
          onDone={() => {
            setOnboarded(true);
            AsyncStorage.setItem(ONBOARDED, '1').catch(() => {});
          }}
        />
      ) : null}

      {showMini ? (
        <View pointerEvents="box-none" style={{ position: 'absolute', left: 0, right: 0, bottom: miniBottom }}>
          <MiniPlayer />
        </View>
      ) : null}

      <View pointerEvents="box-none" style={{ position: 'absolute', left: 0, right: 0, bottom: tabBottom }}>
        <View style={{ marginHorizontal: CHROME.miniMargin }}>
          <TabBar />
        </View>
      </View>

      <NowPlaying />
      <ActionSheet />
      <QueueSheet />
      <LyricsSheet />
      <AccountSheet />

      {shareMode ? (
        <View pointerEvents="none" style={styles.toastWrap}>
          <Animated.View entering={FadeIn.duration(220)} exiting={FadeOut.duration(220)} style={styles.toast} onLayout={() => setTimeout(() => setShareMode(false), 1800)}>
            <T variant="footnote" color={colors.text}>
              Shared — link copied to clipboard
            </T>
          </Animated.View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  toastWrap: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  toast: {
    backgroundColor: colors.bgElevated2,
    borderRadius: 14,
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.hairline,
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },
});