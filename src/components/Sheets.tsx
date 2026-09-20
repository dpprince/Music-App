import React from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Sheet } from './Sheet';
import { Artwork } from './Artwork';
import { EqBars } from './Equalizer';
import { T } from './ui';
import { colors, radius, spacing } from '../theme/theme';
import { usePlayer } from '../store/player';
import { useChrome } from '../store/chrome';
import { hapticSelection } from '../utils/haptics';

const LYRICS = [
  'warm channels, low tide',
  'the city hums below',
  'slow light through glass',
  'we drift between stations',
  'white noise like snowfall',
  'every window a signal',
  'kite season, open sky',
  'the far field remembers',
  'borders fade at dusk',
  'kaleidoscope of amber',
  'circuitry of the heart',
  'come in, the water is warm',
  'stay a little longer',
  'leave the sound on',
];

function Header({ title, subtitle, onClose }: { title: string; subtitle: string; onClose: () => void }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 6,
        paddingBottom: 10,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: colors.hairlineSoft,
      }}
    >
      <Pressable onPress={onClose} style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name="chevron-down" size={24} color={colors.textSecondary} />
      </Pressable>
      <View style={{ flex: 1, alignItems: 'center' }}>
        <T variant="footnote" color={colors.text}>
          {title}
        </T>
        <T variant="caption" color={colors.textTertiary}>
          {subtitle}
        </T>
      </View>
      <View style={{ width: 40 }} />
    </View>
  );
}

export function QueueSheet() {
  const { queueSheet, setQueueSheet } = useChrome();
  const player = usePlayer();
  const { queue, index, current } = player;

  const upNext = current ? queue.slice(index + 1) : queue.slice(1, 11);
  const currentInfo = current;

  return (
    <Sheet open={queueSheet} onClose={() => setQueueSheet(false)} height={520}>
      <Header title="Up Next" subtitle={currentInfo ? `${currentInfo.artist.name} · ${currentInfo.album.name}` : ''} onClose={() => setQueueSheet(false)} />
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <T variant="headline" color={colors.text}>
            Up Next
          </T>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 18 }}>
          {upNext.length > 0 ? (
            <Pressable
              onPress={() => {
                player.clearUpNext();
              }}
            >
              <T variant="footnote" color="#D26A7E">
                Clear
              </T>
            </Pressable>
          ) : null}
        </View>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingBottom: 8 }}>
        <T variant="footnote" color={colors.textSecondary}>
          Autoplay similar music when the list ends
        </T>
        <Switch
          value={player.autoplay}
          onValueChange={() => {
            player.toggleAutoplay();
            hapticSelection();
          }}
          trackColor={{ false: colors.segmentedActive, true: colors.accentDeep }}
          thumbColor="#FFFFFF"
        />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 16 }} bounces={false}>
        {currentInfo ? (
          <QueueRow item={currentInfo} current playing onPress={() => {}} />
        ) : null}
        {upNext.length === 0 ? (
          <View style={{ padding: spacing.xxl, alignItems: 'center' }}>
            <Ionicons name="musical-notes-outline" size={34} color={colors.textDisabled} />
            <T variant="callout" color={colors.textTertiary} style={{ marginTop: 10, textAlign: 'center' }}>
              Nothing up next.{'\n'}The album continues seamlessly after the last track.
            </T>
          </View>
        ) : (
          upNext.map(item => <QueueRow key={item.track.id} item={item} onPress={() => {}} />)
        )}
      </ScrollView>
    </Sheet>
  );
}

function QueueRow({ item, current = false, playing = false, onPress }: { item: any; current?: boolean; playing?: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: 8 }, pressed && { opacity: 0.5 }]}>
      <Artwork albumId={item.album.id} size={44} radiusPx={radius.xs} />
      <View style={{ flex: 1, marginLeft: spacing.md }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <T variant="subhead" color={current ? colors.accentSoft : colors.text} numberOfLines={1} style={{ flexShrink: 1 }}>
            {item.track.name}
          </T>
          {playing ? <EqBars size={13} /> : null}
        </View>
        <T variant="footnote" color={colors.textTertiary} numberOfLines={1}>
          {item.artist.name}
        </T>
      </View>
      <Ionicons name="play" size={16} color={colors.textDisabled} />
    </Pressable>
  );
}

export function LyricsSheet() {
  const { lyricsSheet, setLyricsSheet } = useChrome();
  const player = usePlayer();
  const { current, position } = player;

  const lineIndex = current ? Math.min(LYRICS.length - 1, Math.floor((position / Math.max(1, current.track.duration)) * LYRICS.length)) : 0;
  const shown = LYRICS.slice(0, Math.max(4, lineIndex + 1));

  return (
    <Sheet open={lyricsSheet} onClose={() => setLyricsSheet(false)} height={580}>
      <Header title="Lyrics" subtitle={current ? current.album.name : ''} onClose={() => setLyricsSheet(false)} />
      <View style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: spacing.xl, paddingBottom: 40 }} bounces={false}>
          {current ? (
            <View style={{ marginBottom: spacing.xxl }}>
              <Artwork albumId={current.album.id} size={54} radiusPx={radius.sm} />
            </View>
          ) : null}
          {shown.map((line, i) => {
            const isCurrent = i === lineIndex;
            return (
              <Animated.View key={line} entering={FadeIn.duration(300).delay(i * 40)}>
                <T
                  variant="title2"
                  color={isCurrent ? colors.text : colors.textDisabled}
                  style={{
                    marginBottom: 14,
                    lineHeight: 32,
                    fontWeight: isCurrent ? '800' : '600',
                    transform: [],
                  }}
                >
                  {line}
                </T>
              </Animated.View>
            );
          })}
          {shown.length < LYRICS.length ? (
            <T variant="callout" color={colors.textDisabled} style={{ marginTop: 4 }}>
              ⋯
            </T>
          ) : null}
        </ScrollView>
      </View>
    </Sheet>
  );
}

export function AccountSheet() {
  const { accountOpen, setAccountOpen } = useChrome();
  const player = usePlayer();
  const stats = `${player.loved.length} Favorites · ${player.recentAlbums.length} Played`;

  return (
    <Sheet open={accountOpen} onClose={() => setAccountOpen(false)} height={520}>
      <Header title="Account" subtitle="Aria for iPhone" onClose={() => setAccountOpen(false)} />
      <ScrollView contentContainerStyle={{ paddingBottom: 20 }} bounces={false}>
        <View style={{ flexDirection: 'row', alignItems: 'center', padding: spacing.lg }}>
          <Artwork source={require('@/assets/generated/brand/icon.png')} size={56} radiusPx={28} />
          <View style={{ flex: 1, marginLeft: spacing.lg }}>
            <T variant="headline" color={colors.text}>
              Aria
            </T>
            <T variant="footnote" color={colors.textTertiary} style={{ marginTop: 2 }}>
              {stats}
            </T>
          </View>
          <Pressable onPress={() => setAccountOpen(false)}>
            <Ionicons name="close" size={26} color={colors.textSecondary} />
          </Pressable>
        </View>

        <Section label="Settings" />
        <SwitchRow label="Autoplay Similar Music" value={player.autoplay} onChange={player.toggleAutoplay} />
        <SwitchRow label="High Quality Streaming" value={false} onChange={() => {}} />
        <SwitchRow label="Download Over Wi-Fi Only" value={true} onChange={() => {}} />

        <Section label="About" />
        <PressableRow label="Version" value="1.0 (Aria Build 2026.09)" onPress={() => {}} />
        <PressableRow label="Terms & Privacy" value="" onPress={() => {}} />
      </ScrollView>
    </Sheet>
  );
}

function Section({ label }: { label: string }) {
  return (
    <T variant="microCaps" color={colors.textTertiary} style={{ paddingHorizontal: spacing.lg + 4, paddingTop: spacing.lg, paddingBottom: 6 }}>
      {label.toUpperCase()}
    </T>
  );
}

function SwitchRow({ label, value, onChange }: { label: string; value: boolean; onChange: () => void }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: 12 }}>
      <T variant="body" color={colors.text}>
        {label}
      </T>
      <Switch
        value={value}
        onValueChange={() => {
          onChange();
          hapticSelection();
        }}
        trackColor={{ false: colors.segmentedActive, true: colors.accentDeep }}
        thumbColor="#FFFFFF"
      />
    </View>
  );
}

function PressableRow({ label, value, onPress }: { label: string; value: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: 12 }, pressed && { opacity: 0.5 }]}>
      <T variant="body" color={colors.text}>
        {label}
      </T>
      <T variant="footnote" color={colors.textTertiary}>
        {value || ''}
      </T>
    </Pressable>
  );
}