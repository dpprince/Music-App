import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Collage, Artwork } from '../../components/Artwork';
import { EqBars } from '../../components/Equalizer';
import { PressableScale, T } from '../../components/ui';
import { useBottomPad, useChrome } from '../../store/chrome';
import { usePlayer } from '../../store/player';
import { playlistById, playlistTracks, trackInfo } from '../../data/catalog';
import { colors, radius, spacing } from '../../theme/theme';
import { formatTime, plural } from '../../utils/format';

export default function PlaylistScreen() {
  const { id = '' } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const pad = useBottomPad();
  const { setActionSheet } = useChrome();
  const player = usePlayer();

  const isFavorites = id === 'favorites';
  const playlist = isFavorites ? null : playlistById.get(id);

  const tracks = useMemo(() => {
    if (isFavorites) return player.loved.map(tid => trackInfo(tid));
    if (!playlist) return [];
    return playlistTracks(id);
  }, [id, isFavorites, playlist, player.loved]);

  const name = isFavorites ? 'Favorites' : playlist?.name ?? 'Playlist';
  const subtitle = isFavorites ? 'Aria · loved by you' : playlist?.subtitle ?? '';
  const description = isFavorites
    ? `Every track you've loved, in order. ${tracks.length ? `Currently ${plural(tracks.length, 'song')}.` : ''}`
    : playlist?.description ?? '';

  // Virtual artwork for favorites = collage of loved album arts.
  const favoritedAlbumIds = useMemo(() => tracks.slice(0, 4).map(t => t.album.id), [tracks]);

  if (!playlist && !isFavorites) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <T variant="title3" color={colors.text}>
          Playlist not found
        </T>
        <Pressable onPress={() => router.back()} style={{ marginTop: 12 }}>
          <T variant="footnote" color={colors.accentSoft}>
            Go back
          </T>
        </Pressable>
      </View>
    );
  }

  const currentId = player.current?.track.id;
  const isPlayingCurrent = isFavorites ? false : player.lastContext?.kind === 'playlist' && player.lastContext.id === id && player.isPlaying;

  const playFrom = (i: number) => {
    if (isFavorites) player.playTrackList(tracks, i);
    else player.playPlaylist(id, i);
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={{ paddingTop: insets.top + 4 }}>
        <Pressable onPress={() => router.back()} style={{ paddingHorizontal: spacing.xl, height: 40, justifyContent: 'center', alignSelf: 'flex-start' }}>
          <Ionicons name="chevron-back" size={26} color={colors.textSecondary} />
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={{ paddingTop: 8, paddingBottom: pad + 40 }} showsVerticalScrollIndicator={false}>
        <View style={{ alignItems: 'center', paddingHorizontal: spacing.xxl }}>
          {isFavorites ? (
            favoritedAlbumIds.length > 0 ? (
              <Collage trackIds={tracks.slice(0, 4).map(t => t.track.id)} size={320} gap={3} radiusPx={radius.xl} />
            ) : (
              <View style={[styles.emptyArt, { width: 320, height: 320 }]}>
                <Ionicons name="heart" size={64} color={colors.segmentedActive} />
              </View>
            )
          ) : (
            <Collage trackIds={playlist!.trackIds} size={320} gap={3} radiusPx={radius.xl} />
          )}
        </View>

        <View style={{ paddingHorizontal: spacing.xl, marginTop: spacing.xl, alignItems: 'flex-start' }}>
          <T variant="title1" color={colors.text} numberOfLines={2} style={{ letterSpacing: -0.4 }}>
            {name}
          </T>
          <T variant="footnote" color={colors.textTertiary} style={{ marginTop: 4 }}>
            {subtitle}
          </T>
          {description ? (
            <T variant="callout" color={colors.textSecondary} style={{ marginTop: 10 }}>
              {description}
            </T>
          ) : null}
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.xl, marginTop: spacing.lg }}>
          <PressableScale
            onPress={() => (isPlayingCurrent ? player.togglePlay() : playFrom(0))}
            haptic="medium"
            style={{ borderRadius: 22 }}
          >
            <View style={styles.playBtn}>
              <Ionicons name={isPlayingCurrent ? 'pause' : 'play'} size={22} color="#09090B" style={isPlayingCurrent ? undefined : { marginLeft: 2 }} />
              <T variant="headline" color="#09090B" style={{ marginLeft: 8 }}>
                {isPlayingCurrent ? 'Pause' : 'Play'}
              </T>
            </View>
          </PressableScale>
          <PressableScale onPress={() => player.toggleShuffle()} haptic="selection" style={{ marginLeft: spacing.lg, width: 46, height: 46, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="shuffle" size={24} color={player.shuffle ? colors.text : colors.textSecondary} />
          </PressableScale>
          {!isFavorites ? (
            <PressableScale onPress={() => setActionSheet({ kind: 'playlist', id })} haptic="selection" style={{ marginLeft: 4, width: 46, height: 46, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="ellipsis-horizontal" size={24} color={colors.textSecondary} />
            </PressableScale>
          ) : null}
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.xl, marginTop: spacing.lg }}>
          <Artwork source={require('@/assets/generated/brand/icon.png')} size={22} radiusPx={11} />
          <T variant="footnote" color={colors.textSecondary} style={{ marginLeft: 8 }}>
            {isFavorites ? 'Updated just now' : 'Updated daily by Aria Curators'}
          </T>
        </View>

        <View style={{ marginTop: spacing.md }}>
          {tracks.map((it, i) => {
            const isCurrent = currentId === it.track.id;
            return (
              <Pressable
                key={it.track.id}
                onPress={() => (isCurrent ? player.togglePlay() : playFrom(i))}
                style={({ pressed }) => [styles.trackRow, pressed && { opacity: 0.5 }]}
              >
                <Artwork albumId={it.album.id} size={44} radiusPx={radius.xs} />
                <View style={{ flex: 1, marginLeft: spacing.md }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <T variant="body" color={isCurrent ? colors.accentSoft : colors.text} numberOfLines={1} style={{ flexShrink: 1 }}>
                      {it.track.name}
                    </T>
                    {isCurrent ? <EqBars size={13} /> : null}
                  </View>
                  <T variant="footnote" color={colors.textTertiary} numberOfLines={1}>
                    {it.artist.name} · {it.album.name}
                  </T>
                </View>
                <PressableScale onPress={() => setActionSheet({ kind: 'track', id: it.track.id })} haptic="selection" style={{ width: 36, alignItems: 'flex-end' }}>
                  <Ionicons name="ellipsis-horizontal" size={18} color={colors.textTertiary} />
                </PressableScale>
                <T variant="caption" color={colors.textTertiary} style={{ width: 36, textAlign: 'right', marginLeft: spacing.xs }}>
                  {formatTime(it.track.duration)}
                </T>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  playBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.text,
    paddingHorizontal: 22,
    height: 44,
    borderRadius: 22,
  },
  trackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: 8,
  },
  emptyArt: {
    borderRadius: radius.xl,
    backgroundColor: colors.bgElevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.hairlineSoft,
  },
});