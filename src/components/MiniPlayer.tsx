import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Glass, PressableScale, T } from './ui';
import { Artwork } from './Artwork';
import { EqBars } from './Equalizer';
import { colors, radius, spacing } from '../theme/theme';
import { usePlayer } from '../store/player';
import { useChrome } from '../store/chrome';

export function MiniPlayer({ height = 62 }: { height?: number }) {
  const { current, isPlaying, position, togglePlay, next } = usePlayer();
  const { openNowPlaying } = useChrome();

  if (!current) return null;
  const progress = Math.min(1, position / current.track.duration);

  return (
    <View style={[styles.wrap, { height }]}>
      <Glass style={styles.card}>
        <PressableScale onPress={openNowPlaying} haptic="light" style={{ flex: 1 }}>
          <View style={styles.row}>
            <Artwork albumId={current.album.id} size={42} radiusPx={radius.xs} />
            <View style={styles.meta}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <T variant="subhead" color={colors.text} numberOfLines={1} style={{ flexShrink: 1 }}>
                  {current.track.name}
                </T>
                {isPlaying ? <EqBars size={13} /> : null}
              </View>
              <T variant="footnote" color={colors.textTertiary} numberOfLines={1}>
                {current.artist.name} · {current.album.name}
              </T>
            </View>
            <PressableScale onPress={togglePlay} haptic="medium" style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name={isPlaying ? 'pause' : 'play'} size={26} color={colors.text} />
            </PressableScale>
            <PressableScale onPress={next} haptic="selection" style={{ width: 40, height: 44, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="play-forward" size={24} color={colors.textSecondary} />
            </PressableScale>
          </View>
        </PressableScale>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>
      </Glass>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: 12,
    borderRadius: radius.xl,
  },
  card: {
    flex: 1,
    borderRadius: radius.xl,
  },
  row: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
  },
  meta: {
    flex: 1,
    marginLeft: spacing.md,
    justifyContent: 'center',
    minWidth: 0,
  },
  progressTrack: {
    height: 2,
    backgroundColor: colors.scrubberTrack,
    borderRadius: 1,
    overflow: 'hidden',
  },
  progressFill: {
    height: 2,
    backgroundColor: colors.accent,
    borderRadius: 1,
  },
});