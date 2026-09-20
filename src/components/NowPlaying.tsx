import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePlayer } from '../store/player';
import { useChrome } from '../store/chrome';
import { Artwork } from './Artwork';
import { Scrubber } from './Scrubber';
import { PressableScale, T } from './ui';
import { colors, radius, spacing, springs } from '../theme/theme';
import { formatTime } from '../utils/format';
import { hapticMedium, hapticSelection } from '../utils/haptics';
import { useRouter } from 'expo-router';

export function NowPlaying() {
  const insets = useSafeAreaInsets();
  const { nowPlaying, closeNowPlaying, setQueueSheet, setLyricsSheet, setActionSheet } = useChrome();
  const player = usePlayer();
  const router = useRouter();
  const [, setControls] = useState(true);
  const controlsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const ty = useSharedValue(1000);
  const controlsO = useSharedValue(1);

  const { current } = player;
  const isPlaying = player.isPlaying;
  const position = player.position;
  const loved = current ? player.isLoved(current.track.id) : false;

  useEffect(() => {
    if (nowPlaying) {
      ty.value = withSpring(0, springs.heavy);
      setControls(true);
      controlsO.value = withSpring(1, springs.sheet);
    } else {
      ty.value = withSpring(1000, springs.heavy);
    }
  }, [nowPlaying, ty, controlsO]);

  const flashControls = useCallback(() => {
    setControls(true);
    controlsO.value = withSpring(1, springs.sheet);
    if (controlsTimer.current) clearTimeout(controlsTimer.current);
    controlsTimer.current = setTimeout(() => {
      setControls(false);
      controlsO.value = withTiming(0, { duration: 480 });
    }, 4000);
  }, [controlsO]);

  useEffect(() => {
    if (isPlaying && nowPlaying) flashControls();
  }, [nowPlaying, isPlaying, flashControls]);

  const overlayStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: ty.value }],
  }));
  const controlsStyle = useAnimatedStyle(() => ({ opacity: controlsO.value }));

  const pan = Gesture.Pan()
    .onUpdate(e => {
      if (e.translationY > 0) ty.value = e.translationY * 0.6;
      else ty.value = e.translationY * 0.25;
    })
    .onEnd(e => {
      if (e.translationY > 140) {
        ty.value = withSpring(1000, springs.heavy);
        runOnJS(closeNowPlaying)();
      } else {
        ty.value = withSpring(0, springs.heavy);
      }
    });

  if (!current && !nowPlaying) return null;

  const goArtist = () => {
    closeNowPlaying();
    router.navigate(`/artist/${current!.album.artistId}` as any);
  };
  const toggleLove = () => {
    player.toggleLove(current!.track.id);
    hapticSelection();
  };

  return (
    <GestureDetector gesture={pan}>
      <Animated.View pointerEvents={nowPlaying ? 'auto' : 'none'} style={[styles.fill, overlayStyle]}>
        <View style={{ paddingTop: insets.top, flex: 1 }}>
          {/* Top bar */}
          <View style={styles.topBar}>
            <PressableScale onPress={closeNowPlaying} haptic="selection" style={{ width: 44 }}>
              <Ionicons name="chevron-down" size={26} color={colors.textSecondary} />
            </PressableScale>
            <T variant="footnote" color={colors.textSecondary}>
              Playing from {current!.album.name}
            </T>
            <PressableScale
              onPress={() => setActionSheet({ kind: 'track', id: current!.track.id })}
              haptic="selection"
              style={{ width: 44, alignItems: 'flex-end' }}
            >
              <Ionicons name="ellipsis-horizontal" size={22} color={colors.textSecondary} />
            </PressableScale>
          </View>

          {/* Tap zone toggles controls / toggles love */}
          <View style={{ flex: 1 }}>
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 }}>
              <Artwork albumId={current!.album.id} size={340} radiusPx={radius.xl} />
              {/* small bounce on appearing */}
            </View>

            {/* Meta + controls (fade together) */}
            <Animated.View style={[controlsStyle, { paddingHorizontal: spacing.xl }]}>
              <View style={{ alignItems: 'center' }}>
                <T variant="title2" color={colors.text} numberOfLines={1} style={{ textAlign: 'center' }}>
                  {current!.track.name}
                </T>
                <PressableScale onPress={goArtist} haptic="selection">
                  <T variant="body" color="#D37AA0" style={{ marginTop: 4 }}>
                    {current!.artist.name}
                  </T>
                </PressableScale>
              </View>

              <ScrubberRow
                position={position}
                duration={current!.track.duration}
                onSeek={player.seekFraction}
                color={colors.scrubberFill}
              />

              <View style={styles.controlsRow}>
                <ControlsIcon name="shuffle" active={player.shuffle} onPress={() => { player.toggleShuffle(); hapticSelection(); }} />
                <ControlsIcon name="play-skip-back" size={30} onPress={() => { player.prev(); hapticMedium(); }} />
                <PressableScale onPress={player.togglePlay} haptic="medium" style={styles.bigPlay}>
                  <Ionicons name={isPlaying ? 'pause' : 'play'} size={34} color="#09090B" style={!isPlaying ? { marginLeft: 2 } : undefined} />
                </PressableScale>
                <ControlsIcon name="play-skip-forward" size={30} onPress={() => { player.next(); hapticMedium(); }} />
                <ControlsIcon name="repeat" active={player.repeat !== 'off'} onPress={() => { player.setRepeat(player.repeat === 'off' ? 'all' : player.repeat === 'all' ? 'one' : 'off'); hapticSelection(); }} />
              </View>
              {player.repeat === 'one' ? <View /> : null}

              <View style={styles.bottomRow}>
                <PressableScale onPress={toggleLove} haptic="selection" style={{ width: 40 }}>
                  <Ionicons name={loved ? 'heart' : 'heart-outline'} size={24} color={loved ? colors.love : colors.textSecondary} />
                </PressableScale>
                <View style={{ flex: 1, alignItems: 'center' }}>
                  <T variant="footnote" color={colors.textDisabled}>
                    {current!.album.year}
                  </T>
                </View>
                <PressableScale
                  onPress={() => {
                    setLyricsSheet(true);
                  }}
                  haptic="selection"
                  style={{ width: 40, alignItems: 'flex-end' }}
                >
                  <MaterialCommunityIcons name="text-box-search-outline" size={24} color={colors.textSecondary} />
                </PressableScale>
              </View>
            </Animated.View>
          </View>

          {/* Persistent bottom row (up next) outside fade */}
          <View style={{ paddingHorizontal: spacing.xl, paddingBottom: insets.bottom + 10 }}>
            <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.hairlineSoft, marginBottom: 14 }} />
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <PressableScale onPress={() => setQueueSheet(true)} haptic="selection" style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Ionicons name="list" size={24} color={colors.textSecondary} />
                  <T variant="subhead" color={colors.text}>
                    Up Next
                  </T>
                </View>
              </PressableScale>
              <PressableScale onPress={() => setActionSheet({ kind: 'track', id: current!.track.id })} haptic="selection">
                <Ionicons name="chevron-up" size={24} color={colors.textSecondary} />
              </PressableScale>
            </View>
          </View>
        </View>
      </Animated.View>
    </GestureDetector>
  );
}

export function ScrubberRow({ position, duration, onSeek, color = colors.text }: { position: number; duration: number; onSeek: (f: number) => void; color?: string }) {
  const frac = Math.min(1, Math.max(0, position / duration));
  const remaining = Math.max(0, duration - position);
  return (
    <View style={{ marginTop: 18 }}>
      <Scrubber progress={frac} onSeek={onSeek} height={5} thumbScale={1} />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
        <T variant="caption" color={color}>
          {formatTime(position)}
        </T>
        <T variant="caption" color={color}>
          -{formatTime(remaining)}
        </T>
      </View>
    </View>
  );
}

function ControlsIcon({ name, active, onPress, size = 24 }: { name: React.ComponentProps<typeof Ionicons>['name']; active?: boolean; onPress: () => void; size?: number }) {
  return (
    <PressableScale onPress={onPress} haptic="selection" style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
      <Ionicons name={name} size={size} color={active ? colors.text : colors.textSecondary} />
      {name === 'repeat' && active ? <View style={{ position: 'absolute', bottom: 0, width: 4, height: 4, borderRadius: 2, backgroundColor: colors.accent }} /> : null}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  fill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#0B0B0F',
    zIndex: 50,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: 8,
    paddingBottom: 8,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 22,
    paddingHorizontal: 6,
  },
  bigPlay: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 20,
  },
});