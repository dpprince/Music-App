import React, { useCallback } from 'react';
import { StyleSheet } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { colors, springs } from '../theme/theme';
import { hapticSelection } from '../utils/haptics';

type Props = {
  progress: number;
  onSeek?: (fraction: number) => void;
  height?: number;
  thumbScale?: number;
  width?: number;
};

export function Scrubber({ progress, onSeek, height = 6, thumbScale = 1, width }: Props) {
  const trackW = useSharedValue(0);
  const frac = useSharedValue(Math.min(1, Math.max(0, progress)));
  const wasDrag = useSharedValue(false);
  const thumb = useSharedValue(0);

  React.useEffect(() => {
    if (!wasDrag.value) frac.value = Math.min(1, Math.max(0, progress));
  }, [progress, frac, wasDrag]);

  const onMeasure = useCallback((w: number) => {
    trackW.value = w;
  }, [trackW]);

  const layout = React.useCallback(
    (e: any) => {
      onMeasure(e.nativeEvent.layout.width);
    },
    [onMeasure]
  );

  const setFrac = useCallback((f: number) => {
    'worklet';
    frac.value = Math.min(1, Math.max(0, f));
    thumb.value = withSpring(1, springs.tappy);
    if (wasDrag.value) runOnJS(hapticSelection)();
  }, [frac, thumb, wasDrag]);

  const pan = Gesture.Pan()
    .minDistance(0)
    .onBegin(() => {
      wasDrag.value = true;
      thumb.value = withSpring(1, springs.tappy);
    })
    .onUpdate(e => {
      if (trackW.value <= 0) return;
      const f = e.x / trackW.value;
      setFrac(f);
    })
    .onEnd(() => {
      wasDrag.value = false;
      thumb.value = withSpring(0, springs.tappy);
      if (onSeek && trackW.value > 0) runOnJS(onSeek)(frac.value);
    });

  const fillStyle = useAnimatedStyle(() => ({
    width: Math.max(height, trackW.value * frac.value),
  }));

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + thumb.value * 0.6 * thumbScale }],
    left: trackW.value * frac.value - height * 1.4,
  }));

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[styles.track, { height }, width ? { width } : { flex: 1 }]} onLayout={layout}>
        <Animated.View style={[styles.fill, fillStyle, { height }]} />
        <Animated.View style={[styles.thumb, { height: height * 2.2, width: height * 2.2, borderRadius: height * 1.1 }, thumbStyle]} />
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 6,
    borderRadius: 6,
    backgroundColor: colors.scrubberTrack,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
  },
  fill: {
    position: 'absolute',
    left: 0,
    top: 0,
    borderRadius: 6,
    backgroundColor: colors.scrubberFill,
  },
  thumb: {
    position: 'absolute',
    top: '50%',
    marginTop: -1,
    backgroundColor: colors.thumb,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
});