import React, { useEffect, useRef } from 'react';
import {
  View,
  Animated,
  StyleSheet,
  Easing,
  Text,
  ViewStyle,
} from 'react-native';

interface NebulaLoaderProps {
  size?: number;
  color?: string;
  accentColor?: string;
  label?: string;
  style?: ViewStyle;
}

const NebulaLoader: React.FC<NebulaLoaderProps> = ({
  size = 80,
  color = '#7C3AED',
  accentColor = '#06B6D4',
  label = 'Loading...',
  style,
}) => {
  const ring1Rotate = useRef(new Animated.Value(0)).current;
  const ring2Rotate = useRef(new Animated.Value(0)).current;
  const ring3Rotate = useRef(new Animated.Value(0)).current;
  const coreScale = useRef(new Animated.Value(1)).current;
  const corePulse = useRef(new Animated.Value(0.4)).current;
  const dot1Orbit = useRef(new Animated.Value(0)).current;
  const dot2Orbit = useRef(new Animated.Value(0)).current;
  const labelOpacity = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    // Ring rotations at different speeds and directions
    Animated.loop(
      Animated.timing(ring1Rotate, {
        toValue: 1,
        duration: 2400,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    Animated.loop(
      Animated.timing(ring2Rotate, {
        toValue: 1,
        duration: 1600,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    Animated.loop(
      Animated.timing(ring3Rotate, {
        toValue: 1,
        duration: 3200,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Core pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(coreScale, {
          toValue: 1.25,
          duration: 800,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(coreScale, {
          toValue: 1,
          duration: 800,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Core glow opacity
    Animated.loop(
      Animated.sequence([
        Animated.timing(corePulse, {
          toValue: 1,
          duration: 800,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(corePulse, {
          toValue: 0.4,
          duration: 800,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Orbiting dots
    Animated.loop(
      Animated.timing(dot1Orbit, {
        toValue: 1,
        duration: 1800,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    Animated.loop(
      Animated.timing(dot2Orbit, {
        toValue: 1,
        duration: 2600,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Label pulsing
    Animated.loop(
      Animated.sequence([
        Animated.timing(labelOpacity, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(labelOpacity, {
          toValue: 0.4,
          duration: 900,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const r1 = ring1Rotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const r2 = ring2Rotate.interpolate({ inputRange: [0, 1], outputRange: ['360deg', '0deg'] });
  const r3 = ring3Rotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  const orbit1 = dot1Orbit.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const orbit2 = dot2Orbit.interpolate({ inputRange: [0, 1], outputRange: ['360deg', '0deg'] });

  const ringSize1 = size;
  const ringSize2 = size * 0.75;
  const ringSize3 = size * 0.55;
  const coreSize = size * 0.28;
  const dotSize = size * 0.1;
  const orbitRadius1 = size * 0.44;
  const orbitRadius2 = size * 0.33;

  return (
    <View style={[styles.container, style]}>
      {/* Fixed-size spinner canvas so label can sit below naturally */}
      <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {/* Outer glow backdrop */}
      <View
        style={[
          styles.glowBackdrop,
          {
            width: size * 1.6,
            height: size * 1.6,
            borderRadius: size * 0.8,
            backgroundColor: color,
          },
        ]}
      />

      {/* Ring 1 — outermost, slow */}
      <Animated.View
        style={[
          styles.ring,
          {
            width: ringSize1,
            height: ringSize1,
            borderRadius: ringSize1 / 2,
            borderColor: color,
            borderTopColor: 'transparent',
            borderLeftColor: 'transparent',
            transform: [{ rotate: r1 }],
          },
        ]}
      />

      {/* Ring 2 — mid, faster, opposite direction */}
      <Animated.View
        style={[
          styles.ring,
          {
            width: ringSize2,
            height: ringSize2,
            borderRadius: ringSize2 / 2,
            borderColor: accentColor,
            borderBottomColor: 'transparent',
            borderRightColor: 'transparent',
            borderWidth: 2.5,
            transform: [{ rotate: r2 }],
          },
        ]}
      />

      {/* Ring 3 — inner, slower, tilted via skew illusion */}
      <Animated.View
        style={[
          styles.ring,
          {
            width: ringSize3,
            height: ringSize3,
            borderRadius: ringSize3 / 2,
            borderColor: color,
            borderTopColor: accentColor,
            borderBottomColor: 'transparent',
            borderLeftColor: 'transparent',
            borderWidth: 2,
            transform: [{ rotate: r3 }],
            opacity: 0.85,
          },
        ]}
      />

      {/* Orbiting dot 1 on outer ring */}
      <Animated.View
        style={[
          styles.orbitContainer,
          {
            width: ringSize1,
            height: ringSize1,
            transform: [{ rotate: orbit1 }],
          },
        ]}
      >
        <View
          style={[
            styles.dot,
            {
              width: dotSize,
              height: dotSize,
              borderRadius: dotSize / 2,
              backgroundColor: accentColor,
              position: 'absolute',
              top: -dotSize / 2,
              left: ringSize1 / 2 - dotSize / 2,
              shadowColor: accentColor,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 1,
              shadowRadius: dotSize,
              elevation: 8,
            },
          ]}
        />
      </Animated.View>

      {/* Orbiting dot 2 on mid ring */}
      <Animated.View
        style={[
          styles.orbitContainer,
          {
            width: ringSize2,
            height: ringSize2,
            transform: [{ rotate: orbit2 }],
          },
        ]}
      >
        <View
          style={[
            styles.dot,
            {
              width: dotSize * 0.75,
              height: dotSize * 0.75,
              borderRadius: (dotSize * 0.75) / 2,
              backgroundColor: color,
              position: 'absolute',
              top: -(dotSize * 0.75) / 2,
              left: ringSize2 / 2 - (dotSize * 0.75) / 2,
              shadowColor: color,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 1,
              shadowRadius: dotSize,
              elevation: 8,
            },
          ]}
        />
      </Animated.View>

      {/* Core — pulsing orb */}
      <Animated.View
        style={[
          styles.coreGlow,
          {
            width: coreSize * 2,
            height: coreSize * 2,
            borderRadius: coreSize,
            backgroundColor: color,
            opacity: corePulse,
          },
        ]}
      />
      <Animated.View
        style={[
          styles.core,
          {
            width: coreSize,
            height: coreSize,
            borderRadius: coreSize / 2,
            backgroundColor: color,
            transform: [{ scale: coreScale }],
            shadowColor: color,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.9,
            shadowRadius: coreSize * 0.8,
            elevation: 12,
          },
        ]}
      >
        {/* Inner bright spot */}
        <View
          style={[
            styles.coreInner,
            {
              width: coreSize * 0.45,
              height: coreSize * 0.45,
              borderRadius: coreSize * 0.225,
              backgroundColor: '#fff',
              opacity: 0.6,
              top: coreSize * 0.12,
              left: coreSize * 0.14,
            },
          ]}
        />
      </Animated.View>

      </View>

      {/* Label sits below the spinner in normal flow */}
      {label ? (
        <Animated.Text
          style={[
            styles.label,
            {
              color: color,
              marginTop: 16,
              opacity: labelOpacity,
              letterSpacing: 3,
              fontSize: size * 0.165,
            },
          ]}
        >
          {label.toUpperCase()}
        </Animated.Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
  },
  glowBackdrop: {
    position: 'absolute',
    opacity: 0.06,
  },
  ring: {
    position: 'absolute',
    borderWidth: 3,
  },
  orbitContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {},
  coreGlow: {
    position: 'absolute',
    opacity: 0.25,
  },
  core: {
    position: 'absolute',
  },
  coreInner: {
    position: 'absolute',
  },
  label: {
    fontWeight: '700',
    textAlign: 'center',
  },
});

export default NebulaLoader;