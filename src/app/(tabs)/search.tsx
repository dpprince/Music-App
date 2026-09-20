import React, { useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { T } from '../../components/ui';
import { Artwork } from '../../components/Artwork';
import { useBottomPad, useChrome } from '../../store/chrome';
import { usePlayer } from '../../store/player';
import { allTracks, artists, albums, playlists, trackInfo, albumArtists } from '../../data/catalog';
import { colors, radius, spacing } from '../../theme/theme';
import { useRouter } from 'expo-router';

const FIELD_H = 44;

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const pad = useBottomPad();
  const { setHideMini } = useChrome();
  const player = usePlayer();
  const [q, setQ] = useState('');
  const input = useRef<TextInput>(null);

  const trimmed = q.trim();
  const typing = trimmed.length > 0;

  const results = useMemo(() => {
    if (!typing) {
      return {
        artists: artists.slice(0, 6),
        albums: albums.slice(0, 8),
        playlists: playlists.slice(0, 6),
        songs: [] as ReturnType<typeof trackInfo>[],
      };
    }
    const low = trimmed.toLowerCase();
    return {
      artists: artists.filter(a => a.name.toLowerCase().includes(low)),
      albums: albums.filter(a => a.name.toLowerCase().includes(low) || a.genre.toLowerCase().includes(low)),
      playlists: playlists.filter(p => p.name.toLowerCase().includes(low)),
      songs: allTracks().filter(t => t.track.name.toLowerCase().includes(low) || t.artist.name.toLowerCase().includes(low) || t.album.name.toLowerCase().includes(low)),
    };
  }, [typing, trimmed]);

  const onSubmit = () => {
    if (typing) player.pushSearch(trimmed);
  };

  const clear = () => {
    setQ('');
    input.current?.focus();
  };

  return (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: pad }}
      showsVerticalScrollIndicator={false}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.xl }}>
        <T style={styles.title} variant="largeTitle" color={colors.text}>
          Search
        </T>
      </View>

      <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.md, paddingBottom: spacing.sm }}>
        <View style={styles.field}>
          <Ionicons name="search" size={18} color={colors.textTertiary} />
          <TextInput
            ref={input}
            value={q}
            onChangeText={setQ}
            onFocus={() => setHideMini(true)}
            onBlur={() => setHideMini(false)}
            onSubmitEditing={onSubmit}
            returnKeyType="search"
            placeholder="Artists, songs, lyric…"
            placeholderTextColor={colors.textTertiary}
            style={styles.input}
            cursorColor={colors.accent}
          />
          {typing ? (
            <Pressable onPress={clear} style={{ padding: 4 }}>
              <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
            </Pressable>
          ) : null}
        </View>
      </View>

      {!typing ? (
        <>
          <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.lg }}>
            <T variant="microCaps" color={colors.textTertiary}>
              RECENT SEARCHES
            </T>
            {player.searchHistory.length === 0 ? (
              <T variant="callout" color={colors.textTertiary} style={{ marginTop: 10 }}>
                Nothing yet — search while you listen.
              </T>
            ) : (
              <View style={{ marginTop: 4 }}>
                {player.searchHistory.slice(0, 8).map(term => (
                  <Pressable
                    key={term}
                    onPress={() => {
                      setQ(term);
                      input.current?.focus();
                    }}
                    style={({ pressed }) => [{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12 }, pressed && { opacity: 0.5 }]}
                  >
                    <Ionicons name="time-outline" size={20} color={colors.textTertiary} />
                    <T variant="body" color={colors.text} style={{ marginLeft: spacing.md, flex: 1 }}>
                      {term}
                    </T>
                  </Pressable>
                ))}
                <Pressable onPress={player.clearHistory} style={{ paddingVertical: 8 }}>
                  <T variant="footnote" color="#D26A7E">
                    Clear recent searches
                  </T>
                </Pressable>
              </View>
            )}
          </View>

          <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.xxl }}>
            <T variant="microCaps" color={colors.textTertiary}>
              ALBUMS
            </T>
          </View>
          <AlbumRail albums={albums.slice(0, 8)} />
        </>
      ) : (
        <>
          {results.songs.length > 0 ? (
            <Group label="Songs">
              <View style={{ paddingHorizontal: spacing.xl }}>
                {results.songs.slice(0, 5).map(it => (
                  <Pressable
                    key={it.track.id}
                    onPress={() => player.playTrackList(results.songs, results.songs.findIndex(x => x.track.id === it.track.id))}
                    style={({ pressed }) => [{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8 }, pressed && { opacity: 0.5 }]}
                  >
                    <Artwork albumId={it.album.id} size={44} radiusPx={radius.xs} />
                    <View style={{ flex: 1, marginLeft: spacing.md }}>
                      <T variant="subhead" color={colors.text} numberOfLines={1}>
                        {it.track.name}
                      </T>
                      <T variant="footnote" color={colors.textTertiary} numberOfLines={1}>
                        {it.artist.name} · {it.album.name}
                      </T>
                    </View>
                  </Pressable>
                ))}
              </View>
            </Group>
          ) : null}

          {results.artists.length > 0 && (
            <Group label="Artists">
              <View style={{ paddingHorizontal: spacing.xl }}>
                {results.artists.slice(0, 6).map(a => (
                  <Pressable
                    key={a.id}
                    onPress={() => router.navigate(`/artist/${a.id}` as any)}
                    style={({ pressed }) => [{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8 }, pressed && { opacity: 0.5 }]}
                  >
                    <Artwork artistId={a.id} size={44} radiusPx={22} />
                    <View style={{ flex: 1, marginLeft: spacing.md }}>
                      <T variant="subhead" color={colors.text} numberOfLines={1}>
                        {a.name}
                      </T>
                      <T variant="footnote" color={colors.textTertiary} numberOfLines={1}>
                        Artist · {a.city}          
                      </T>
                    </View>
                  </Pressable>
                ))}
              </View>
            </Group>
          )}

          {results.albums.length > 0 && (
            <Group label="Albums">
              <AlbumRail albums={results.albums.slice(0, 8)} />
            </Group>
          )}

          {results.playlists.length > 0 && (
            <Group label="Playlists">
              <View style={{ paddingHorizontal: spacing.xl }}>
                {results.playlists.slice(0, 6).map(p => (
                  <Pressable
                    key={p.id}
                    onPress={() => router.navigate(`/playlist/${p.id}` as any)}
                    style={({ pressed }) => [{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8 }, pressed && { opacity: 0.5 }]}
                  >
                    <Artwork source={require('@/assets/generated/brand/icon.png')} size={44} radiusPx={radius.xs} />
                    <View style={{ flex: 1, marginLeft: spacing.md }}>
                      <T variant="subhead" color={colors.text} numberOfLines={1}>
                        {p.name}
                      </T>
                      <T variant="footnote" color={colors.textTertiary} numberOfLines={1}>
                        Playlist · {p.subtitle}
                      </T>
                    </View>
                  </Pressable>
                ))}
              </View>
            </Group>
          )}

          {!results.songs.length && !results.artists.length && !results.albums.length && !results.playlists.length ? (
            <View style={{ alignItems: 'center', paddingVertical: 40 }}>
              <Ionicons name="search-outline" size={38} color={colors.textDisabled} />
              <T variant="callout" color={colors.textTertiary} style={{ marginTop: 10 }}>
                No results for “{trimmed}”
              </T>
            </View>
          ) : null}
        </>
      )}
    </ScrollView>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ paddingTop: spacing.xl }}>
      <View style={{ paddingHorizontal: spacing.xl, paddingBottom: 6 }}>
        <T variant="microCaps" color={colors.textTertiary}>
          {label.toUpperCase()}
        </T>
      </View>
      {children}
    </View>
  );
}

function AlbumRail({ albums }: { albums: { id: string }[] }) {
  const router = useRouter();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingLeft: spacing.xl, paddingTop: spacing.sm }}>
      {albums.map(a => {
        const album = albumsById[a.id];
        if (!album) return null;
        const artist = albumArtists(album.id);
        return (
          <Pressable
            key={a.id}
            onPress={() => router.navigate(`/album/${a.id}` as any)}
            style={{ width: 108, marginRight: spacing.md }}
          >
            <Artwork albumId={a.id} size={108} radiusPx={radius.sm} />
            <T variant="footnote" color={colors.text} numberOfLines={2} style={{ marginTop: 8, flexShrink: 1, lineHeight: 17 }}>
              {album.name}
            </T>
            <T variant="caption" color={colors.textTertiary} numberOfLines={1} style={{ marginTop: 1 }}>
              {artist.name}
            </T>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const albumsById = Object.fromEntries(albums.map(a => [a.id, a])) as Record<string, any>;

const styles = StyleSheet.create({
  title: {
    letterSpacing: -0.5,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    height: FIELD_H,
    borderRadius: FIELD_H / 2,
    backgroundColor: colors.bgElevated2,
    paddingHorizontal: spacing.md,
    gap: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.hairlineSoft,
  },
  input: {
    flex: 1,
    color: colors.text,
    fontSize: 16,
    height: FIELD_H,
  },
});