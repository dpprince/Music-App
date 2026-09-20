import React, { useCallback } from 'react';
import { ActivityIndicator, Pressable, StyleProp, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withSpring, withTiming } from 'react-native-reanimated';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, springs, type } from '../theme/theme';
import { hapticLight, hapticMedium, hapticSelection } from '../utils/haptics';

export function useScales() {
  const scale = useSharedValue(1);
  const shrink = useCallback(() => {
    scale.value = withSpring(motion_press, springs.tappy);
  }, [scale]);
  const grow = useCallback(() => {
    scale.value = withSpring(1.02, springs.tappy);
  }, [scale]);
  const reset = useCallback(() => {
    scale.value = withSpring(1, springs.springy);
  }, [scale]);
  return { scale, shrink, grow, reset };
}
const motion_press = 0.955;

type PressableScaleProps = {
  onPress?: () => void;
  onLongPress?: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
  haptic?: 'light' | 'selection' | 'medium' | 'none';
  delayPressIn?: number;
  testID?: string;
};

export function PressableScale({ onPress, onLongPress, disabled, style, children, haptic = 'light', delayPressIn = 40, testID }: PressableScaleProps) {
  const { scale, shrink, grow, reset } = useScales();
  const as = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Animated.View style={[as, style]}>
      <Pressable
        testID={testID}
        onPressIn={() => {
          if (haptic === 'light') hapticLight();
          if (haptic === 'selection') hapticSelection();
          if (haptic === 'medium') hapticMedium();
          shrink();
        }}
        onLongPress={onLongPress}
        delayLongPress={260}
        onPressOut={() => {
          grow();
          setTimeout(reset, 90);
        }}
        disabled={disabled}
        onPress={onPress}
        style={{ flex: 1 }}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}

export function PressableFade({ onPress, disabled, style, children, pressedOpacity = 0.55 }: { onPress?: () => void; disabled?: boolean; style?: StyleProp<ViewStyle>; children: React.ReactNode; pressedOpacity?: number }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [{ opacity: pressed ? pressedOpacity : 1 }, style]}
    >
      {children}
    </Pressable>
  );
}

// ---------- Text ----------
type TProps = { variant?: keyof typeof type; color?: string; style?: StyleProp<TextStyle>; numberOfLines?: number; children: React.ReactNode };
export function T({ variant = 'body', color = colors.text, style, numberOfLines, children }: TProps) {
  return (
    <Text style={[{ ...type[variant], color }, style]} numberOfLines={numberOfLines}>
      {children}
    </Text>
  );
}

// ---------- Glass panel ----------
export function Glass({ style, children, strong }: { style?: StyleProp<ViewStyle>; children?: React.ReactNode; strong?: boolean }) {
  return (
    <View style={[styles.glass, { backgroundColor: strong ? colors.glassStrong : colors.glass }, style]}>
      <View style={styles.glassShine} pointerEvents="none" />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  glass: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.hairline,
    overflow: 'hidden',
  },
  glassShine: {
    position: 'absolute',
    top: 0,
    left: 12,
    right: 12,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.28)',
  },
});

// ---------- Section header ----------
export function SectionHeader({ title, onSeeAll, accentTone, style }: { title: string; onSeeAll?: () => void; accentTone?: string; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md }, style]}>
      <Text style={[type.title3, { color: colors.text }]} numberOfLines={1}>
        {title}
      </Text>
      {onSeeAll ? (
        <Pressable onPress={onSeeAll} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 4, paddingLeft: 12 }}>
          <Text style={{ color: accentTone ?? '#C84A5B', fontSize: 13, fontWeight: '600' }}>See All</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

// ---------- Chips ----------
export function Chip({ label, selected, onPress }: { label: string; selected?: boolean; onPress?: () => void }) {
  return (
    <PressableScale onPress={onPress} haptic="selection" style={{ marginRight: 8 }}>
      <View
        style={{
          paddingHorizontal: 16,
          height: 32,
          borderRadius: 16,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: selected ? colors.segmentedActive : 'transparent',
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: selected ? colors.hairline : colors.hairlineSoft,
        }}
      >
        <Text style={{ color: selected ? colors.text : colors.textSecondary, fontSize: 14, fontWeight: '600' }}>{label}</Text>
      </View>
    </PressableScale>
  );
}

// ---------- Round icon button ----------
export function IconButton({ icon, size = 26, color = colors.text, onPress, style, active }: { icon: keyof typeof Ionicons.glyphMap; size?: number; color?: string; onPress?: () => void; style?: StyleProp<ViewStyle>; active?: boolean }) {
  return (
    <PressableScale onPress={onPress} haptic="selection" style={style}>
      <View style={{ width: size + 18, height: size + 18, alignItems: 'center', justifyContent: 'center', opacity: active === false ? 0.35 : 1 }}>
        <Ionicons name={icon} size={size} color={color} />
      </View>
    </PressableScale>
  );
}

export function MIconButton({ icon, size = 24, color = colors.text, onPress, style }: { icon: keyof typeof MaterialCommunityIcons.glyphMap; size?: number; color?: string; onPress?: () => void; style?: StyleProp<ViewStyle> }) {
  return (
    <PressableScale onPress={onPress} haptic="selection" style={style}>
      <View style={{ width: size + 18, height: size + 18, alignItems: 'center', justifyContent: 'center' }}>
        <MaterialCommunityIcons name={icon} size={size} color={color} />
      </View>
    </PressableScale>
  );
}

// ---------- Spinner on dark ----------
export function LoadingView({ label }: { label?: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 }}>
      <ActivityIndicator color={colors.textSecondary} size="large" />
      {label ? <Text style={{ color: colors.textSecondary, fontSize: 14 }}>{label}</Text> : null}
    </View>
  );
}

// ---------- Fade-in harness ----------
export function FadeIn({ children, delay = 0, style }: { children: React.ReactNode; delay?: number; style?: StyleProp<ViewStyle> }) {
  const op = useSharedValue(0);
  const ty = useSharedValue(6);
  React.useEffect(() => {
    op.value = withDelay(delay, withTiming(1, { duration: 320, easing: Easing.out(Easing.cubic) }));
    ty.value = withDelay(delay, withSpring(0, { damping: 20, stiffness: 200 }));
  }, [delay, op, ty]);
  const as = useAnimatedStyle(() => ({ opacity: op.value, transform: [{ translateY: ty.value }] }));
  return <Animated.View style={[as, style]}>{children}</Animated.View>;
}