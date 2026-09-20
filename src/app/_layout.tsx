import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PlayerProvider } from '../store/player';
import { ChromeProvider } from '../store/chrome';
import { Chrome } from '../components/Chrome';
import { colors } from '../theme/theme';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <PlayerProvider>
          <ChromeProvider>
            <View style={styles.root}>
              <StatusBar style="light" />
              <Stack
                screenOptions={{
                  headerShown: false,
                  contentStyle: { backgroundColor: colors.bg },
                  animation: 'fade',
                  animationDuration: 180,
                }}
              >
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="album/[id]" options={{ animation: 'slide_from_right' }} />
                <Stack.Screen name="playlist/[id]" options={{ animation: 'slide_from_right' }} />
                <Stack.Screen name="artist/[id]" options={{ animation: 'slide_from_right' }} />
              </Stack>
              <Chrome />
            </View>
          </ChromeProvider>
        </PlayerProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
});