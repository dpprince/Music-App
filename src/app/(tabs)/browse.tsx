import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Chip, SectionHeader, T } from '../../components/ui';
import { AlbumCell, ArtistCell, EditorialCard, PlaylistCell } from '../../components/cards';
import { useBottomPad } from '../../store/chrome';
import { albums, artists, playlists } from '../../data/catalog';
import { colors, spacing } from '../../theme/theme';

const GENRES = ['All', 'Ambient', 'Electronic', 'Synthwave', 'Downtempo', 'Neoclassical', 'Lo-Fi', 'Dream Pop', 'Folk'];

export default function BrowseScreen() {
  const insets = useSafeAreaInsets();
  const pad = useBottomPad();
  const [genre, setGenre] = useState('All');

  const shown = genre === 'All' ? albums : albums.filter(a => a.genre.toLowerCase().includes(genre.toLowerCase()));
  const featured = playlists.filter(p => p.kind === 'originals' || p.kind === 'currents');
  const rest = playlists.filter(p => p.kind !== 'originals');

  return (
    <ScrollView contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: pad }} showsVerticalScrollIndicator={false}>
      <View style={{ paddingHorizontal: spacing.xl }}>
        <T style={styles.title} variant="largeTitle" color={colors.text}>
          Browse
        </T>
        <T variant="callout" color={colors.textSecondary} style={{ letterSpacing: -0.2 }}>
          Independent music, curated daily.
        </T>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingLeft: spacing.xl, paddingTop: spacing.lg }}>
        {GENRES.map(g => (
          <Chip key={g} label={g} selected={genre === g} onPress={() => setGenre(g)} />
        ))}
      </ScrollView>

      <SectionHeader title={genre === 'All' ? 'Featured Playlists' : genre} style={styles.section} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingLeft: spacing.screen }}>
        {(genre === 'All' ? featured : playlists).map(p => (
          <EditorialCard key={p.id} playlist={p} width={240} />
        ))}
      </ScrollView>

      <SectionHeader title={`${genre === 'All' ? 'All' : genre} Albums`} style={styles.section} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingHorizontal: spacing.screen }}>
        {shown.map(a => {
          const w = Math.min((320 - spacing.screen * 2) / 2, 152);
          return <AlbumCell key={a.id} album={a} width={w} />;
        })}
      </View>

      <SectionHeader title="Playlists" style={styles.section} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingLeft: spacing.screen }}>
        {rest.map(p => (
          <PlaylistCell key={p.id} playlist={p} width={152} />
        ))}
      </ScrollView>

      <SectionHeader title="Artists" style={styles.section} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingLeft: spacing.screen, paddingBottom: 8 }}>
        {artists.map(a => (
          <View key={a.id} style={{ marginRight: spacing.xl }}>
            <ArtistCell artistId={a.id} width={96} />
          </View>
        ))}
      </ScrollView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  title: {
    letterSpacing: -0.5,
  },
  section: {
    paddingHorizontal: spacing.xl,
    marginTop: spacing.xxxl - 8,
  },
});