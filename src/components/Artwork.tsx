import React from 'react';
import { View } from 'react-native';
import { Image } from 'expo-image';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { albumArt, artistArtwork } from '../data/assets';
import { trackInfo } from '../data/catalog';
import { radius } from '../theme/theme';

type Props = {
  albumId?: string;
  artistId?: string;
  source?: any;
  size: number;
  radiusPx?: number;
  fade?: boolean;
  delay?: number;
};

export function Artwork({ albumId, artistId, source, size, radiusPx = radius.md, fade, delay = 0 }: Props) {
  const src = source ?? (albumId ? albumArt(albumId) : artistId ? artistArtwork(artistId) : undefined);
  return <Image source={src} style={{ width: size, height: size, borderRadius: radiusPx }} contentFit="cover" transition={fade ? { duration: 200, effect: 'cross-dissolve' } : undefined} accessibilityIgnoresInvertColors />;
}

// Artwork that eases in on mount (used in headers for detail screens).
export function ArtworkIn({ ...props }: Props) {
  const o = useSharedValue(0);
  const s = useSharedValue(0.92);
  React.useEffect(() => {
    o.value = withDelay(props.delay ?? 0, withTiming(1, { duration: 420 }));
    s.value = withDelay(props.delay ?? 0, withTiming(1, { duration: 520 }));
  }, [o, s, props.delay]);
  const as = useAnimatedStyle(() => ({ opacity: o.value, transform: [{ scale: s.value }] }));
  return (
    <Animated.View style={as}>
      <Artwork {...props} />
    </Animated.View>
  );
}

// 2x2 collage used for playlists & editorial cards.
export function Collage({ trackIds, size, gap = 3, radiusPx = radius.md, style }: { trackIds: string[]; size: number; gap?: number; radiusPx?: number; style?: any }) {
  const tiles = trackIds.slice(0, 4);
  const inner = (size - gap) / 2;
  const albumIds = tiles.map(id => trackInfo(id).album.id);
  return (
    <View style={[{ width: size, height: size, borderRadius: radiusPx, overflow: 'hidden' }, style]}>
      <View style={{ flexDirection: 'row' }}>
        {[0, 1].map(i =>
          albumIds[i] ? (
            <View key={i} style={{ width: inner, height: inner }}>
              <Image source={albumArt(albumIds[i]!)} style={{ width: inner, height: inner, borderRadius: 0 }} contentFit="cover" />
            </View>
          ) : (
            <View key={i} style={{ width: inner, height: inner }} />
          )
        )}
      </View>
      <View style={{ height: gap }} />
      <View style={{ flexDirection: 'row' }}>
        {[2, 3].map(i =>
          albumIds[i] ? (
            <View key={i} style={{ width: inner, height: inner }}>
              <Image source={albumArt(albumIds[i]!)} style={{ width: inner, height: inner, borderRadius: 0 }} contentFit="cover" />
            </View>
          ) : (
            <View key={i} style={{ width: inner, height: inner }} />
          )
        )}
      </View>
    </View>
  );
}