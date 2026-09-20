import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArtworkIn } from '../../components/Artwork';
import { EqBars } from '../../components/Equalizer';
import { NewMusicCard } from '../../components/cards';
import { PressableScale, T } from '../../components/ui';
import { useBottomPad, useChrome } from '../../store/chrome';
import { usePlayer } from '../../store/player';
import { albumArtists, albumById, albumTracks, artistById } from '../../data/catalog';
import { colors, radius, spacing } from '../../theme/theme';
import { formatTime, plural } from '../../utils/format';

export default function AlbumScreen() {
  const { id = '' } = useLocalSearchParams<{ id: string }>();
  const album = albumById.get(id);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const pad = useBottomPad();
  const { setActionSheet } = useChrome();
  const player = usePlayer();

  if (!album) {
    return <Missing label="Album not found" onBack={router.back} />;
  }

  const artist = albumArtists(id);
  const tracks = albumTracks(id);
  const currentId = player.current?.track.id;
  const isThisAlbumPlaying = player.lastContext?.kind === 'album' && player.lastContext.id === id && !!player.current;
  const isPlayingNow = isThisAlbumPlaying && player.isPlaying;

  const playAll = () => {
    if (isThisAlbumPlaying) player.togglePlay();
    else player.playAlbum(id, 0);
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
          <ArtworkIn albumId={id} size={320} radiusPx={radius.xl} />
        </View>

        <View style={{ paddingHorizontal: spacing.xl, marginTop: spacing.xl, alignItems: 'flex-start' }}>
          <T variant="title1" color={colors.text} numberOfLines={2} style={{ letterSpacing: -0.4 }}>
            {album.name}
          </T>
          <Pressable onPress={() => router.navigate(`/artist/${album.artistId}` as any)} style={{ marginTop: 4 }}>
            <T variant="body" color="#D37AA0" numberOfLines={1}>
              {artist.name}
            </T>
          </Pressable>
          <T variant="footnote" color={colors.textTertiary} style={{ marginTop: 4 }}>
            {album.year} · {album.genre} · {plural(album.tracks.length, 'song')}
          </T>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.xl, marginTop: spacing.lg }}>
          <PressableScale onPress={playAll} haptic="medium" style={{ borderRadius: 22 }}>
            <View style={styles.playBtn}>
              <Ionicons name={isPlayingNow ? 'pause' : 'play'} size={22} color="#09090B" style={isPlayingNow ? undefined : { marginLeft: 2 }} />
              <T variant="headline" color="#09090B" style={{ marginLeft: 8 }}>
                {isPlayingNow ? 'Pause' : 'Play'}
              </T>
            </View>
          </PressableScale>
          <PressableScale onPress={() => player.toggleShuffle()} haptic="selection" style={{ marginLeft: spacing.lg, width: 46, height: 46, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="shuffle" size={24} color={player.shuffle ? colors.text : colors.textSecondary} />
          </PressableScale>
          <PressableScale onPress={() => setActionSheet({ kind: 'album', id })} haptic="selection" style={{ marginLeft: 4, width: 46, height: 46, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="ellipsis-horizontal" size={24} color={colors.textSecondary} />
          </PressableScale>
        </View>

        <View style={{ marginTop: spacing.lg }}>
          {tracks.map((it, i) => {
            const isCurrent = currentId === it.track.id;
            return (
              <Pressable
                key={it.track.id}
                onPress={() => (isCurrent ? player.togglePlay() : player.playAlbum(id, i))}
                style={({ pressed }) => [styles.trackRow, pressed && { opacity: 0.5 }]}
              >
                <View style={{ width: 24, alignItems: 'center' }}>
                  {isCurrent ? <EqBars size={14} /> : <T variant="callout" color={colors.textTertiary}>{i + 1}</T>}
                </View>
                <View style={{ flex: 1, marginLeft: spacing.md }}>
                  <T variant="body" color={isCurrent ? colors.accentSoft : colors.text} numberOfLines={1}>
                    {it.track.name}
                  </T>
                </View>
                <PressableScale onPress={() => setActionSheet({ kind: 'track', id: it.track.id })} haptic="selection" style={{ width: 40, alignItems: 'flex-end' }}>
                  <Ionicons name="ellipsis-horizontal" size={20} color={colors.textTertiary} />
                </PressableScale>
                <T variant="caption" color={colors.textTertiary} style={{ width: 44, textAlign: 'right', marginLeft: spacing.sm }}>
                  {formatTime(it.track.duration)}
                </T>
              </Pressable>
            );
          })}
          {summary(album.id)}
        </View>

        <RelatedAlbums artistId={album.artistId} currentAlbumId={id} />
      </ScrollView>
    </View>
  );
}

function summary(albumId: string) {
  const album = albumById.get(albumId)!;
  return (
    <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.lg }}>
      <T variant="caption" color={colors.textTertiary}>
        {album.year} Aria Collective · {album.genre}. Mastered for the slow lane — drift welcome.
      </T>
    </View>
  );
}

function RelatedAlbums({ artistId, currentAlbumId }: { artistId: string; currentAlbumId: string }) {
  const router = useRouter();
  const others = artistById.get(artistId)!.albums.filter(a => a !== currentAlbumId);
  return (
    <View style={{ marginTop: spacing.xxl }}>
      <T variant="title3" color={colors.text} style={{ paddingHorizontal: spacing.xl }}>
        More to Explore
      </T>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingLeft: spacing.xl, paddingTop: spacing.md, paddingRight: spacing.screen }}>
        {others.map(a => {
          const album = albumById.get(a)!;
          return (
            <Pressable key={a} onPress={() => router.replace(`/album/${a}` as any)}>
              <NewMusicCard album={album} width={150} />
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

function Missing({ label, onBack }: { label: string; onBack: () => void }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <T variant="title3" color={colors.text}>
        {label}
      </T>
      <Pressable onPress={onBack} style={{ marginTop: 12 }}>
        <T variant="footnote" color={colors.accentSoft}>
          Go back
        </T>
      </Pressable>
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
    paddingVertical: 11,
  },
});