import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { PressableScale, T } from './ui';
import { Artwork, Collage } from './Artwork';
import { EqBars } from './Equalizer';
import { albumArt } from '../data/assets';
import { albumArtists, artistById, type Album, type Playlist } from '../data/catalog';
import { colors, radius, spacing } from '../theme/theme';

// Big editorial card (playlists / made-for-you)
export function EditorialCard({ playlist, width, height = 150 }: { playlist: Playlist; width: number; height?: number }) {
  const router = useRouter();
  return (
    <PressableScale onPress={() => router.navigate(`/playlist/${playlist.id}` as any)} haptic="light" style={{ width, marginRight: spacing.md }}>
      <View style={{ width, height, borderRadius: radius.lg, overflow: 'hidden', backgroundColor: colors.playlistCell }}>
        <Collage trackIds={playlist.trackIds} size={width} gap={3} radiusPx={radius.lg} style={{ width, height, borderRadius: radius.lg }} />
        <LinearGradient
          colors={['rgba(0,0,0,0.55)', 'rgba(0,0,0,0.9)']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 0, y: 1 }}
          style={styles.cardOverlay}
        />
        <View style={styles.cardText}>
          <T variant="headline" color={colors.text} numberOfLines={1}>
            {playlist.name}
          </T>
          <T variant="footnote" color="rgba(255,255,255,0.75)" numberOfLines={1}>
            {playlist.subtitle}
          </T>
        </View>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  cardOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 84,
  },
  cardText: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 12,
  },
});

// Recently-played vertical card (Listen Now rail)
export function RecentCard({ album }: { album: Album }) {
  const router = useRouter();
  const artist = albumArtists(album.id);
  return (
    <PressableScale onPress={() => router.navigate(`/album/${album.id}` as any)} haptic="light" style={{ width: 152, marginRight: spacing.lg }}>
      <Artwork albumId={album.id} size={152} radiusPx={radius.lg} fade />
      <T variant="subhead" color={colors.text} numberOfLines={2} style={{ marginTop: 8, lineHeight: 20 }}>
        {album.name}
      </T>
      <T variant="footnote" color={colors.textTertiary} numberOfLines={1}>
        {artist.name}
      </T>
    </PressableScale>
  );
}

// New Music horizontal card
export function NewMusicCard({ album, width = 188 }: { album: Album; width?: number }) {
  const router = useRouter();
  const artist = albumArtists(album.id);
  return (
    <PressableScale onPress={() => router.navigate(`/album/${album.id}` as any)} haptic="light" style={{ width, marginRight: spacing.lg }}>
      <Image source={albumArt(album.id)} style={{ width, height: width, borderRadius: radius.md }} contentFit="cover" />
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginTop: 10 }}>
        <View style={{ flex: 1 }}>
          <T variant="subhead" color={colors.text} numberOfLines={2} style={{ lineHeight: 20 }}>
            {album.name}
          </T>
          <T variant="footnote" color={colors.textTertiary} numberOfLines={1} style={{ marginTop: 2 }}>
            {artist.name} · {album.year}
          </T>
        </View>
      </View>
    </PressableScale>
  );
}

// 2-col grid cell used in Browse & Library
export function AlbumCell({ album, width, showPlaying }: { album: Album; width: number; showPlaying?: boolean }) {
  const router = useRouter();
  const artist = albumArtists(album.id);
  return (
    <PressableScale onPress={() => router.navigate(`/album/${album.id}` as any)} haptic="light" style={{ width }}>
      <Artwork albumId={album.id} size={width} radiusPx={radius.md} fade />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 8 }}>
        {showPlaying ? <EqBars size={13} /> : null}
        <T variant="subhead" color={colors.text} numberOfLines={1} style={{ flexShrink: 1 }}>
          {album.name}
        </T>
      </View>
      <T variant="footnote" color={colors.textTertiary} numberOfLines={1} style={{ marginTop: 1 }}>
        {artist.name} · {album.year}
      </T>
    </PressableScale>
  );
}

// Playlist cell (square collage) for grids
export function PlaylistCell({ playlist, width }: { playlist: Playlist; width: number }) {
  const router = useRouter();
  return (
    <PressableScale onPress={() => router.navigate(`/playlist/${playlist.id}` as any)} haptic="light" style={{ width }}>
      <Collage trackIds={playlist.trackIds} size={width} gap={3} radiusPx={radius.md} />
      <T variant="subhead" color={colors.text} numberOfLines={1} style={{ marginTop: 8 }}>
        {playlist.name}
      </T>
      <T variant="footnote" color={colors.textTertiary} numberOfLines={1} style={{ marginTop: 1 }}>
        {playlist.subtitle}
      </T>
    </PressableScale>
  );
}

// Artist cell (circle avatar)
export function ArtistCell({ artistId, width }: { artistId: string; width: number }) {
  const router = useRouter();
  const artist = artistById.get(artistId)!;
  return (
    <PressableScale onPress={() => router.navigate(`/artist/${artist.id}` as any)} haptic="light" style={{ width }}>
      <Artwork artistId={artist.id} size={width} radiusPx={width / 2} fade />
      <T variant="subhead" color={colors.text} numberOfLines={1} style={{ marginTop: 8, textAlign: 'center' }}>
        {artist.name}
      </T>
      <T variant="footnote" color={colors.textTertiary} numberOfLines={1} style={{ textAlign: 'center' }}>
        {artist.genre}
      </T>
    </PressableScale>
  );
}