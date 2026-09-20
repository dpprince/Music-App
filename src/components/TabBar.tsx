import React from 'react';
import { StyleSheet, View } from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Glass, PressableScale, T } from './ui';
import { colors, radius, spacing } from '../theme/theme';
import { useChrome } from '../store/chrome';

const TABS = [
  { key: 'home', route: '/home', icon: 'home' as const, label: 'Home' },
  { key: 'browse', route: '/browse', icon: 'compass' as const, label: 'Browse' },
  { key: 'library', route: '/library', icon: 'library' as const, label: 'Library' },
];

export function TabBar({ height = 54 }: { height?: number }) {
  const path = usePathname();
  const router = useRouter();
  const { setHideMini } = useChrome();
  const searchActive = path.startsWith('/search');

  const go = (route: string) => {
    setHideMini(false);
    router.navigate(route as any);
  };

  return (
    <Glass strong style={[styles.bar, { height }]}>
      {TABS.map(t => {
        const active = path.startsWith(t.route);
        const isHome = t.key === 'home';
        return (
          <PressableScale key={t.key} onPress={() => go(t.route)} haptic="selection" style={{ flex: 1 }}>
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3 }}>
              <Ionicons name={t.icon} size={25} color={active ? (isHome ? colors.accent : colors.text) : colors.textDisabled} />
              <T variant="micro" color={active ? (isHome ? colors.accent : colors.text) : colors.textDisabled}>
                {t.label}
              </T>
            </View>
          </PressableScale>
        );
      })}
      <PressableScale onPress={() => go('/search')} haptic="medium" style={{ flex: 1 }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <View
            style={[
              styles.searchCap,
              { backgroundColor: searchActive ? colors.accent : '#FFFFFF' },
            ]}
          >
            <Ionicons name="search" size={24} color={searchActive ? '#FFFFFF' : '#0A0A0C'} />
          </View>
        </View>
      </PressableScale>
    </Glass>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    borderRadius: radius.xxl,
    paddingHorizontal: spacing.md,
    alignItems: 'stretch',
  },
  searchCap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
});