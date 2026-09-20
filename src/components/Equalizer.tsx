import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { colors } from '../theme/theme';

const HEIGHTS = [1, 0.62, 0.84, 0.5, 0.72];

function Bar({ index, size, color, barW }: { index: number; size: number; color: string; barW: number }) {
  const amp = useSharedValue(1);
  useEffect(() => {
    amp.value = withRepeat(
      withSequence(
        withTiming(0.4, { duration: 300 + ((index * 83) % 120), easing: Easing.inOut(Easing.quad) }),
        withTiming(1, { duration: 320 + ((index * 59) % 130), easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      true
    );
    return () => {
      amp.value = 1;
    };
  }, [amp, index]);
  const h = size * HEIGHTS[index];
  const as = useAnimatedStyle(() => ({ height: Math.max(3, h * amp.value) }));
  return <Animated.View style={[{ width: barW, backgroundColor: color, height: h, borderRadius: 2 }, as]} />;
}

export function EqBars({ size = 15, color = colors.accent }: { size?: number; color?: string }) {
  const barW = Math.max(2, Math.round(size / 6));
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: size, gap: Math.max(1, Math.round(barW * 0.5)) }}>
      {HEIGHTS.map((_, i) => (
        <Bar key={i} index={i} size={size} color={color} barW={barW} />
      ))}
    </View>
  );
}