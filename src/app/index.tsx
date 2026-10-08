import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Text,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useEventListener } from 'expo';
import { useVideoPlayer, VideoView } from 'expo-video';
import * as SplashScreen from 'expo-splash-screen';

// Keep native splash screen until video is ready
SplashScreen.preventAutoHideAsync().catch(() => {});

const videoSource = require('../../assets/SE-pay-video.mp4');

export default function VideoSplashScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const hasNavigated = useRef(false);
  const [fadeAnim] = useState(() => new Animated.Value(1));

  // Initialize the hardware-accelerated video player with sound enabled
  const player = useVideoPlayer(videoSource, (p) => {
    p.loop = false;
    p.muted = false;
    p.volume = 1.0;
    p.play();
  });

  const navigateNext = useCallback(() => {
    if (hasNavigated.current) return;
    hasNavigated.current = true;

    // Smooth, professional cross-fade out before navigating
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 400,
      useNativeDriver: true,
    }).start(() => {
      router.replace('/login');
    });
  }, [fadeAnim, router]);

  // Hide the native OS splash screen once the video player starts playing or is ready
  useEventListener(player, 'statusChange', ({ status }) => {
    if (status === 'readyToPlay') {
      SplashScreen.hideAsync().catch(() => {});
    }
  });

  useEventListener(player, 'playingChange', ({ isPlaying }) => {
    if (isPlaying) {
      SplashScreen.hideAsync().catch(() => {});
    }
  });

  // Navigate when video finishes playing
  useEventListener(player, 'playToEnd', () => {
    navigateNext();
  });

  // Safety fallback timeout in case of unexpected audio/video interruption
  useEffect(() => {
    const fallbackTimer = setTimeout(() => {
      navigateNext();
    }, 7000);

    return () => clearTimeout(fallbackTimer);
  }, [navigateNext]);

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <StatusBar style="dark" />

      {/* Full screen video container */}
      <View style={styles.videoWrapper}>
        <VideoView
          player={player}
          style={StyleSheet.absoluteFill}
          contentFit="contain"
          nativeControls={false}
          showsTimecodes={false}
        />
      </View>

      {/* Subtle, elegant Skip button for quick entry */}
      <View style={[styles.topBar, { top: Math.max(insets.top, 24) + 8 }]}>
        <TouchableOpacity
          style={styles.skipButton}
          onPress={navigateNext}
          activeOpacity={0.7}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  videoWrapper: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBar: {
    position: 'absolute',
    right: 20,
    zIndex: 10,
  },
  skipButton: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(15, 23, 42, 0.06)',
  },
  skipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
    letterSpacing: 0.3,
  },
});
