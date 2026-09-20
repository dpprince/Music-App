import React, { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, springs } from '../theme/theme';

const CLOSED = 900;

export function Sheet({
  open,
  onClose,
  children,
  height,
  dismissible = true,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  height?: number;
  dismissible?: boolean;
}) {
  const insets = useSafeAreaInsets();
  const ty = useSharedValue(CLOSED);
  const dim = useSharedValue(0);

  useEffect(() => {
    if (open) {
      ty.value = withSpring(0, springs.sheet);
      dim.value = withSpring(1, springs.sheet);
    } else {
      ty.value = withSpring(CLOSED, springs.sheet);
      dim.value = withSpring(0, springs.sheet);
    }
  }, [open, ty, dim]);

  const panelStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: ty.value }],
  }));
  const dimStyle = useAnimatedStyle(() => ({
    opacity: dim.value,
  }));

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents={open ? 'auto' : 'box-none'}>
      <Animated.View pointerEvents={open ? 'auto' : 'none'} style={[styles.dim, dimStyle]}>
        <Pressable style={{ flex: 1 }} onPress={dismissible ? onClose : undefined} />
      </Animated.View>
      <Animated.View
        pointerEvents={open ? 'auto' : 'none'}
        style={[
          styles.panel,
          {
            height: height ?? 'auto',
            maxHeight: '82%',
            paddingBottom: insets.bottom + 20,
          },
          panelStyle,
        ]}
      >
        <View style={styles.handle} />
        {children}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  dim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  panel: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.bgElevated2,
    borderTopLeftRadius: radius.xl + 4,
    borderTopRightRadius: radius.xl + 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.hairline,
    paddingTop: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.6,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: -8 },
    elevation: 20,
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.18)',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 13,
    minHeight: 48,
  },
});