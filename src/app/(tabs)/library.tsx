import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { T } from '../../components/ui';
import { AlbumCell, ArtistCell, PlaylistCell } from '../../components/cards';
import { Artwork } from '../../components/Artwork';
import { EqBars } from '../../components/Equalizer';
import { useBottomPad, useChrome } from '../../store/chrome';
import { usePlayer } from '../../store/player';
import { artists, albums, playlists, trackInfo } from '../../data/catalog';
import { colors, radius, spacing } from '../../theme/theme';
import { formatTime } from '../../utils/format';

const SEGMENTS = ['Playlists', 'Artists', 'Albums', 'Songs'] as const;

export default function LibraryScreen() {
  const insets = useSafeAreaInsets();
  const pad = useBottomPad();
  const router = useRouter();
  const { setAccountOpen } = useChrome();
  const player = usePlayer();
  const [seg, setSeg] = useState<(typeof SEGMENTS)[number]>('Playlists');

  const lovedTracks = useMemo(() => player.loved.map(id => trackInfo(id)), [player.loved]);
  const currentTrackId = player.current?.track.id;

  return (
    <ScrollView contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: pad }} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <T style={styles.title} variant="largeTitle" color={colors.text}>
          Library
        </T>
        <Pressable onPress={() => setAccountOpen(true)} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="person-circle-outline" size={34} color={colors.textSecondary} />
        </Pressable>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: spacing.xl, paddingTop: spacing.md }}>
        {SEGMENTS.map(s => (
          <View key={s} style={[styles.seg, { backgroundColor: seg === s ? colors.segmentedActive : 'transparent' }]}>
            <Pressable style={{ paddingHorizontal: 14, paddingVertical: 7, borderRadius: 16 }} onPress={() => setSeg(s)}>
              <T variant="subhead" color={seg === s ? colors.text : colors.textSecondary}>
                {s}
              </T>
            </Pressable>
          </View>
        ))}
      </ScrollView>

      {seg === 'Playlists' && (
        <>
          <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.lg }}>
            <Pressable
              onPress={() => {
                router.navigate('/playlist/favorites' as any);
              }}
              style={({ pressed }) => [styles.newPlaylist, pressed && { opacity: 0.6 }]}
            >
              <Ionicons name="add" size={26} color={colors.accent} />
              <T variant="headline" color={colors.accent} style={{ marginLeft: spacing.md }}>
                New Playlist
              </T>
            </Pressable>
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingHorizontal: spacing.screen, paddingTop: spacing.lg }}>
            {playlists.map(p => (
              <PlaylistCell key={p.id} playlist={p} width={152} />
            ))}
          </View>
        </>
      )}

      {seg === 'Artists' && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingHorizontal: spacing.screen, paddingTop: spacing.lg }}>
          {artists.map(a => (
            <View key={a.id} style={{ width: 152, marginBottom: spacing.xl }}>
              <ArtistCell artistId={a.id} width={152} />
            </View>
          ))}
        </View>
      )}

      {seg === 'Albums' && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingHorizontal: spacing.screen, paddingTop: spacing.lg }}>
          {albums.map(a => (
            <AlbumCell key={a.id} album={a} width={152} />
          ))}
        </View>
      )}

      {seg === 'Songs' && (
        <View style={{ paddingTop: spacing.md }}>
          {lovedTracks.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 60, paddingHorizontal: spacing.xxl }}>
              <Ionicons name="heart-outline" size={40} color={colors.textDisabled} />
              <T variant="title3" color={colors.text} style={{ marginTop: 14, textAlign: 'center' }}>
                No Songs in Your Library
              </T>
              <T variant="callout" color={colors.textTertiary} style={{ marginTop: 6, textAlign: 'center' }}>
                Tap the heart on any track to add it here.
              </T>
            </View>
          ) : (
            lovedTracks.map(it => (
              <Pressable
                key={it.track.id}
                onPress={() => player.playTrackList(lovedTracks, lovedTracks.findIndex(x => x.track.id === it.track.id))}
                style={({ pressed }) => [styles.songRow, pressed && { opacity: 0.5 }]}
              >
                <Artwork albumId={it.album.id} size={48} radiusPx={radius.xs} />
                <View style={{ flex: 1, marginLeft: spacing.md }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <T variant="subhead" color={currentTrackId === it.track.id ? colors.accentSoft : colors.text} numberOfLines={1} style={{ flexShrink: 1 }}>
                      {it.track.name}
                    </T>
                    {currentTrackId === it.track.id ? <EqBars size={13} /> : null}
                  </View>
                  <T variant="footnote" color={colors.textTertiary} numberOfLines={1}>
                    {it.artist.name} · {it.album.name}
                  </T>
                </View>
                <T variant="caption" color={colors.textTertiary}>
                  {formatTime(it.track.duration)}
                </T>
              </Pressable>
            ))
          )}
        </View>
      )}

      <View style={{ paddingHorizontal: spacing.xl }}>
        <T variant="caption" color={colors.textDisabled} style={{ marginTop: spacing.xxl, textAlign: 'center' }}>
          Favorites live in your “Updated” playlist.
        </T>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    marginTop: 4,
  },
  title: {
    letterSpacing: -0.5,
    flex: 1,
  },
  seg: {
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.hairlineSoft,
  },
  newPlaylist: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  songRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: 9,
  },
});