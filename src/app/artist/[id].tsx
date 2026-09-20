import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArtworkIn } from '../../components/Artwork';
import { EqBars } from '../../components/Equalizer';
import { AlbumCell } from '../../components/cards';
import { PressableScale, T } from '../../components/ui';
import { useBottomPad, useChrome } from '../../store/chrome';
import { usePlayer } from '../../store/player';
import { albumById, artistAlbums, artistById, albumArtists } from '../../data/catalog';
import { colors, radius, spacing } from '../../theme/theme';

export default function ArtistScreen() {
  const { id = '' } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const pad = useBottomPad();
  const { setActionSheet } = useChrome();
  const player = usePlayer();

  const artist = artistById.get(id);
  if (!artist) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <T variant="title3" color={colors.text}>
          Artist not found
        </T>
        <Pressable onPress={() => router.back()} style={{ marginTop: 12 }}>
          <T variant="footnote" color={colors.accentSoft}>
            Go back
          </T>
        </Pressable>
      </View>
    );
  }

  const albums = artistAlbums(id);
  const popular = albums.length ? albums[0] : null;
  const popularTracks = popular ? popular.tracks : [];
  const currentId = player.current?.track.id;

  const playPopular = () => {
    if (popular) {
      if (player.current?.album.artistId === id && player.isPlaying) player.togglePlay();
      else player.playAlbum(popular.id, 0);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={{ paddingTop: insets.top + 4 }}>
        <Pressable onPress={() => router.back()} style={{ position: 'absolute', left: spacing.xl, top: 0, height: 40, zIndex: 2, justifyContent: 'center', width: 40 }}>
          <Ionicons name="chevron-back" size={26} color={colors.textSecondary} />
        </Pressable>
        <Pressable onPress={() => setActionSheet({ kind: 'artist', id })} style={{ position: 'absolute', right: spacing.xl, top: 2, height: 40, zIndex: 2, justifyContent: 'center', width: 40, alignItems: 'flex-end' }}>
          <Ionicons name="ellipsis-horizontal" size={24} color={colors.textSecondary} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingTop: 8, paddingBottom: pad + 40 }} showsVerticalScrollIndicator={false}>
        <View style={{ alignItems: 'center', paddingHorizontal: spacing.xxl }}>
          <ArtworkIn artistId={id} size={300} radiusPx={radius.xl + 4} />
        </View>

        <View style={{ paddingHorizontal: spacing.xl, marginTop: spacing.xl, alignItems: 'flex-start' }}>
          <T variant="largeTitle" color={colors.text} style={{ letterSpacing: -0.5 }}>
            {artist.name}
          </T>
          <T variant="callout" color={colors.textTertiary} style={{ marginTop: 2 }}>
            Artist · {artist.city}
          </T>
          <T variant="body" color={colors.textSecondary} style={{ marginTop: spacing.md, lineHeight: 22 }}>
            {artist.bio}
          </T>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.xl, marginTop: spacing.lg }}>
          {popular ? (
            <PressableScale onPress={playPopular} haptic="medium" style={{ borderRadius: 26 }}>
              <View style={styles.playCircle}>
                <Ionicons name={player.current?.album.artistId === id && player.isPlaying ? 'pause' : 'play'} size={30} color="#09090B" style={player.current?.album.artistId === id && player.isPlaying ? undefined : { marginLeft: 3 }} />
              </View>
            </PressableScale>
          ) : null}
          <PressableScale onPress={() => setActionSheet({ kind: 'artist', id })} haptic="selection" style={{ marginLeft: spacing.md, width: 46, height: 46, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="add" size={28} color={colors.textSecondary} />
          </PressableScale>
        </View>

        {popular ? (
          <View style={{ marginTop: spacing.xl }}>
            <Pressable onPress={() => router.navigate(`/album/${popular.id}` as any)} style={{ paddingHorizontal: spacing.xl, paddingBottom: spacing.sm }}>
              <T variant="title3" color={colors.text}>
                Popular
              </T>
            </Pressable>
            {popularTracks.map((t, i) => {
              const isCurrent = currentId === t.id;
              return (
                <Pressable
                  key={t.id}
                  onPress={() => (isCurrent ? player.togglePlay() : player.playAlbum(popular.id, i))}
                  style={({ pressed }) => [styles.popRow, pressed && { opacity: 0.5 }]}
                >
                  {isCurrent ? <View style={{ width: 22, alignItems: 'center' }}><EqBars size={14} /></View> : <T variant="callout" color={colors.textTertiary} style={{ width: 22, textAlign: 'center' }}>{i + 1}</T>}
                  <T variant="body" color={isCurrent ? colors.accentSoft : colors.text} numberOfLines={1} style={{ marginLeft: spacing.md, flex: 1 }}>
                    {t.name}
                  </T>
                </Pressable>
              );
            })}
            <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.sm }}>
              <T variant="body" color="#D37AA0" numberOfLines={1}>
                {popular.name} → {albumArtists(popular.id).name}
              </T>
            </View>
          </View>
        ) : null}

        <View style={{ paddingHorizontal: spacing.xl, marginTop: spacing.xxl, marginBottom: spacing.md }}>
          <T variant="title3" color={colors.text}>
            Albums
          </T>
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingHorizontal: spacing.screen }}>
          {albums.map(a => {
            const album = albumById.get(a.id)!;
            return <AlbumCell key={a.id} album={album} width={152} />;
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  playCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.text,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FB5C74',
    shadowOpacity: 0.4,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 4 },
  },
  popRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: 10,
  },
});