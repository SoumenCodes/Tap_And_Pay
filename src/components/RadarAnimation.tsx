import React, { useEffect, useRef } from 'react';
import { Animated, View, StyleSheet, Easing } from 'react-native';
import { colors } from '../constants/theme';

interface RadarAnimationProps {
  size?: number;
  color?: string;
  rings?: number;
}

interface Ring {
  scale: Animated.Value;
  opacity: Animated.Value;
}

export const RadarAnimation: React.FC<RadarAnimationProps> = ({
  size = 220,
  color = colors.primary,
  rings = 3,
}) => {
  const ringRefs = useRef<Ring[]>(
    Array.from({ length: rings }, () => ({
      scale: new Animated.Value(0.3),
      opacity: new Animated.Value(0.8),
    }))
  ).current;

  useEffect(() => {
    const delay = 600;

    const animations = ringRefs.map((ring, index) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(index * delay),
          Animated.parallel([
            Animated.timing(ring.scale, {
              toValue: 1,
              duration: 2000,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true,
            }),
            Animated.timing(ring.opacity, {
              toValue: 0,
              duration: 2000,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(ring.scale, { toValue: 0.3, duration: 0, useNativeDriver: true }),
            Animated.timing(ring.opacity, { toValue: 0.8, duration: 0, useNativeDriver: true }),
          ]),
        ])
      )
    );

    animations.forEach((anim) => anim.start());
    return () => animations.forEach((anim) => anim.stop());
  }, [ringRefs]);

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Expanding rings */}
      {ringRefs.map((ring, index) => (
        <Animated.View
          key={index}
          style={[
            styles.ring,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              borderColor: color,
              transform: [{ scale: ring.scale }],
              opacity: ring.opacity,
            },
          ]}
        />
      ))}

      {/* Inner progress ring */}
      <View
        style={[
          styles.innerRing,
          {
            width: size * 0.75,
            height: size * 0.75,
            borderRadius: (size * 0.75) / 2,
            borderColor: color,
          },
        ]}
      />

      {/* Core NFC pulse */}
      <View
        style={[
          styles.core,
          {
            width: size * 0.48,
            height: size * 0.48,
            borderRadius: (size * 0.48) / 2,
            backgroundColor: `${color}15`,
            borderColor: `${color}80`,
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    borderWidth: 1.5,
  },
  innerRing: {
    position: 'absolute',
    borderWidth: 2,
    borderStyle: 'dashed',
    opacity: 0.35,
  },
  core: {
    borderWidth: 2,
  },
});

export default RadarAnimation;
