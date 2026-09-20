import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Sheet } from './Sheet';
import { colors } from '../theme/theme';
import { useChrome } from '../store/chrome';
import { usePlayer } from '../store/player';
import { albumById, artistById, playlistById, trackInfo } from '../data/catalog';
import { hapticSuccess } from '../utils/haptics';

type G = React.ComponentProps<typeof Ionicons>['name'];

function IconCircle({ name, color = colors.text }: { name: G; color?: string }) {
  return (
    <View style={{ width: 32, alignItems: 'center' }}>
      <Ionicons name={name} size={22} color={color} />
    </View>
  );
}

function Row({ icon, label, onPress, color = colors.text, separator }: { icon: G; label: string; onPress: () => void; color?: string; separator?: boolean }) {
  return (
    <View>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          {
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 18,
            paddingVertical: 13,
            minHeight: 50,
          },
          pressed && { opacity: 0.5 },
        ]}
      >
        <IconCircle name={icon} color={color} />
        <Text style={{ flex: 1, marginLeft: 4, color: color ?? colors.text, fontSize: 17, fontWeight: '500' }}>{label}</Text>
      </Pressable>
      {separator ? <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.hairlineSoft, marginLeft: 58 }} /> : null}
    </View>
  );
}

export function ActionSheet() {
  const { actionSheet, setActionSheet, setShareMode } = useChrome();
  const player = usePlayer();
  const router = useRouter();

  const close = () => setActionSheet(null);

  const model = useMemo(() => {
    if (!actionSheet) return null;
    if (actionSheet.kind === 'track') {
      const it = trackInfo(actionSheet.id);
      return { title: it.track.name, subtitle: `${it.artist.name} · ${it.album.name}`, albumId: it.album.id, artistId: it.album.artistId, kind: 'track' as const };
    }
    if (actionSheet.kind === 'album') {
      const a = albumById.get(actionSheet.id);
      if (!a) return null;
      return { title: a.name, subtitle: artistById.get(a.artistId)!.name, albumId: a.id, artistId: a.artistId, kind: 'album' as const };
    }
    if (actionSheet.kind === 'playlist') {
      const p = playlistById.get(actionSheet.id);
      if (!p) return null;
      return { title: p.name, subtitle: p.subtitle, kind: 'playlist' as const };
    }
    const art = artistById.get(actionSheet.id);
    if (!art) return null;
    return { title: art.name, subtitle: art.genre, kind: 'artist' as const };
  }, [actionSheet]);

  const title = model?.title ?? '';
  const subtitle = model?.subtitle ?? '';
  const loved = actionSheet?.kind === 'track' && model?.kind === 'track' ? player.isLoved(actionSheet.id) : false;

  if (!model) {
    return <Sheet open={false} onClose={close}>{null}</Sheet>;
  }

  return (
    <Sheet open onClose={close}>
      <View style={{ paddingBottom: 8 }}>
        <View style={{ paddingHorizontal: 20, paddingBottom: 6 }}>
          <Text style={{ color: colors.text, fontSize: 17, fontWeight: '700' }} numberOfLines={1}>
            {title}
          </Text>
          <Text style={{ color: colors.textTertiary, fontSize: 13, marginTop: 2 }} numberOfLines={1}>
            {subtitle}
          </Text>
        </View>
        {model.kind === 'track' ? (
          <Row
            icon={loved ? 'heart' : 'heart-outline'}
            label={loved ? 'Added to Favorites' : 'Add to Favorites'}
            color={loved ? colors.love : colors.text}
            onPress={() => {
              player.toggleLove(actionSheet!.id);
              if (!loved) hapticSuccess();
              close();
            }}
            separator
          />
        ) : null}
        <Row
          icon="play-skip-forward"
          label="Play Next"
          onPress={() => {
            if (model.kind === 'track') player.playNext(trackInfo(actionSheet!.id));
            else if (model.kind === 'album') player.playAlbum(model.albumId!, 0);
            else if (model.kind === 'playlist') player.playPlaylist(actionSheet!.id, 0);
            close();
          }}
          separator
        />
        <Row
          icon="play-forward"
          label="Play Later"
          onPress={() => {
            if (model.kind === 'track') player.playLater(trackInfo(actionSheet!.id));
            else if (model.kind === 'album') player.playAlbum(model.albumId!, 0);
            else if (model.kind === 'playlist') player.playPlaylist(actionSheet!.id, 0);
            close();
          }}
          separator
        />
        {model.albumId ? (
          <Row
            icon="disc-outline"
            label="Go to Album"
            onPress={() => {
              close();
              router.navigate(`/album/${model.albumId}` as any);
            }}
            separator
          />
        ) : null}
        {model.artistId ? (
          <Row
            icon="person-outline"
            label="Go to Artist"
            onPress={() => {
              close();
              router.navigate(`/artist/${model.artistId}` as any);
            }}
            separator
          />
        ) : null}
        <Row
          icon="arrow-up-circle-outline"
          label="Share Aria…"
          onPress={() => {
            setShareMode(true);
            close();
          }}
          separator
        />
        <View style={{ height: 8 }} />
        <View style={{ marginHorizontal: 10 }}>
          <Pressable onPress={close} style={({ pressed }) => [styles.cancelBtn, pressed && { opacity: 0.6 }]}>
            <Text style={{ color: colors.text, fontSize: 17, fontWeight: '600' }}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  cancelBtn: {
    height: 50,
    borderRadius: 14,
    backgroundColor: colors.segmentedActive,
    alignItems: 'center',
    justifyContent: 'center',
  },
});