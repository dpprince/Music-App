import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { PressableScale, SectionHeader, T } from '../../components/ui';
import { EditorialCard, NewMusicCard, RecentCard } from '../../components/cards';
import { useBottomPad, useChrome } from '../../store/chrome';
import { usePlayer } from '../../store/player';
import { albums, albumArtists, playlistById } from '../../data/catalog';
import { colors, spacing } from '../../theme/theme';

const MADE_FOR_YOU = ['morning-currents', 'sunday-light', 'deep-focus', 'night-drive'];
const NEW_MUSIC = ['tidal-motions', 'slow-canyons', 'borderlands', 'kite-season', 'pale-fire', 'circuitry'];
const TOP_ALBUMS = ['vestige', 'pale-blue-night', 'ferry-light', 'kaleidoscope'];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const pad = useBottomPad();
  const { setAccountOpen, openNowPlaying } = useChrome();
  const player = usePlayer();
  const { recentAlbums, current } = player;

  const recents = recentAlbums.map(id => albums.find(a => a.id === id)!).filter(Boolean);
  const nowPlayingDouble = !!current;
  const hero = veryRecent(recents);

  return (
    <ScrollView contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: pad }} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <T style={styles.title} variant="largeTitle" color={colors.text}>
          Listen Now
        </T>
        <PressableScale onPress={() => setAccountOpen(true)} haptic="light" style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
          <Image source={require('@/assets/generated/brand/icon.png')} style={{ width: 32, height: 32, borderRadius: 16 }} contentFit="cover" />
        </PressableScale>
      </View>

      {nowPlayingDouble && current ? (
        <View style={styles.heroWrap}>
          <PressableScale onPress={openNowPlaying} haptic="medium">
            <T variant="title3" color={colors.accentSoft} style={{ marginBottom: 10, marginLeft: 2 }}>
              Now Playing
            </T>
            <T variant="largeTitle" color={colors.text} numberOfLines={2}>
              {current.track.name}
            </T>
            <T variant="subhead" color={colors.textSecondary} style={{ marginTop: 6 }}>
              {current.artist.name} — {current.album.name}
            </T>
          </PressableScale>
        </View>
      ) : hero ? (
        <View style={styles.heroWrap}>
          <PressableScale onPress={() => player.playAlbum(hero.id, 0)} haptic="medium">
            <T variant="title3" color={colors.accentSoft} style={{ marginBottom: 10, marginLeft: 2 }}>
              New for You
            </T>
            <T variant="largeTitle" color={colors.text} numberOfLines={2}>
              {hero.name}
            </T>
            <T variant="subhead" color={colors.textSecondary} style={{ marginTop: 6 }}>
              {albumArtists(hero.id).name} — Album
            </T>
          </PressableScale>
        </View>
      ) : null}

      <SectionHeader title="Recently Played" style={styles.sectionTop} />
      {recents.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingLeft: spacing.screen }}>
          {recents.map(a => (
            <RecentCard key={a.id} album={a} />
          ))}
        </ScrollView>
      ) : (
        <View style={styles.emptyLine}>
          <T variant="callout" color={colors.textTertiary}>
            Nothing yet — start with the editor&apos;s picks below.
          </T>
        </View>
      )}

      <SectionHeader title="Made For You" style={styles.sectionTop} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingLeft: spacing.screen }}>
        {MADE_FOR_YOU.map(id => (
          <EditorialCard key={id} playlist={playlistById.get(id)!} width={240} />
        ))}
      </ScrollView>

      <SectionHeader title="New Music" style={styles.sectionTop} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingLeft: spacing.screen }}>
        {NEW_MUSIC.map(id => {
          const album = albums.find(a => a.id === id)!;
          return <NewMusicCard key={id} album={album} />;
        })}
      </ScrollView>

      <SectionHeader title="Top Albums" style={styles.sectionTop} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingLeft: spacing.screen }}>
        {TOP_ALBUMS.map(id => {
          const album = albums.find(a => a.id === id)!;
          return <NewMusicCard key={id} album={album} width={140} />;
        })}
      </ScrollView>
    </ScrollView>
  );
}

function veryRecent(recents: any[]) {
  if (!recents.length) return null;
  return recents[0];
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
  heroWrap: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
  },
  sectionTop: {
    marginTop: spacing.xxxl - 8,
    paddingHorizontal: spacing.xl,
  },
  emptyLine: {
    paddingHorizontal: spacing.xl,
  },
});