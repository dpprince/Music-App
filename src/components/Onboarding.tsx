import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { T, PressableScale } from './ui';
import { colors } from '../theme/theme';

export function Onboarding({ onDone }: { onDone: () => void }) {
  const insets = useSafeAreaInsets();
  return (
    <Animated.View entering={FadeIn.duration(400)} exiting={FadeOut.duration(300)} style={[styles.fill, { zIndex: 100 }]}>
      <View style={{ paddingTop: insets.top + 40, paddingHorizontal: 32, flex: 1 }}>
        <View style={{ alignItems: 'center' }}>
          <Image source={require('@/assets/generated/brand/icon.png')} style={{ width: 96, height: 96, borderRadius: 28 }} contentFit="cover" />
        </View>
        <View style={{ alignItems: 'center', marginTop: 28 }}>
          <T variant="giant" color={colors.text}>
            Aria
          </T>
          <T variant="body" color={colors.textSecondary} style={{ marginTop: 10, textAlign: 'center' }}>
            Independent ambient &amp; electronic music{'\n'}made for deep listening.
          </T>
        </View>

        <View style={{ flex: 1 }} />

        <PressableScale onPress={onDone} haptic="medium" style={{ borderRadius: 16 }}>
          <View style={styles.continueBtn}>
            <T variant="headline" color="#0A0A0C">
              Start Listening
            </T>
          </View>
        </PressableScale>
        <T variant="caption" color={colors.textTertiary} style={{ textAlign: 'center', marginTop: 12, paddingBottom: insets.bottom + 16 }}>
          Free forever. No accounts, no tracking.
        </T>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.bg,
  },
  continueBtn: {
    height: 54,
    borderRadius: 16,
    backgroundColor: colors.text,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FB5C74',
    shadowOpacity: 0.5,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
});