import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useWindowDimensions,
  Animated,
  Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface GooeyPullToRefreshProps {
  pullDistance: number;
  refreshing: boolean;
  threshold?: number;
  color?: string;
}

const GooeyPullToRefresh: React.FC<GooeyPullToRefreshProps> = ({
  pullDistance,
  
  refreshing,
  threshold = 86,
  color = '#0052cc',
}) => {
  const { width } = useWindowDimensions();
  const spin = useRef(new Animated.Value(0)).current;
  const pullAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!refreshing) {
      spin.stopAnimation();
      spin.setValue(0);
      Animated.spring(pullAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 40,
        friction: 8,
      }).start();
      return;
    }

    Animated.timing(pullAnim, {
      toValue: 1,
      duration: 240,
      useNativeDriver: true,
    }).start();

    const loop = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 900,
        useNativeDriver: true,
        easing: Easing.linear,
      })
    );

    loop.start();
    return () => loop.stop();
  }, [refreshing, spin, pullAnim]);

  const clampedPull = Math.max(0, Math.min(pullDistance, 160));
  const progress = Math.min(clampedPull / threshold, 1);
  const topBandHeight = 60;

  const circleRadius = refreshing
    ? 22
    : Math.min(24, 12 + progress * 10);
  const circleY = refreshing
    ? topBandHeight + 25
    : topBandHeight + clampedPull * 0.4;
  const neckWidth = Math.max(0, 15 - progress * 15);
  const neckY = topBandHeight - 5;
  const neckHeight = Math.max(0, circleY - topBandHeight + 5);
  const bridgeRadius = Math.max(0, 18 - progress * 18);
  const bridgeY = topBandHeight + 4;

  const ready = clampedPull >= threshold;

  if (clampedPull <= 0 && !refreshing) {
    return null;
  }

  const rotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View pointerEvents="none" style={styles.container}>
      <Animated.View
        style={[
          styles.canvasFallback,
          {
            width,
            height: 200,
            opacity: refreshing || clampedPull > 0 ? 1 : 0,
            transform: [
              {
                translateY: pullAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 6],
                }),
              },
            ],
          },
        ]}
      >
        <View style={[styles.band, { backgroundColor: color, height: topBandHeight }]} />
        <View
          style={[
            styles.bridge,
            {
              backgroundColor: color,
              width: Math.max(0, bridgeRadius * 2),
              height: Math.max(0, bridgeRadius * 2),
              borderRadius: bridgeRadius,
              left: width / 2 - bridgeRadius,
              top: bridgeY - bridgeRadius,
              opacity: bridgeRadius > 0 ? 1 : 0,
            },
          ]}
        />
        <View
          style={[
            styles.bridge,
            {
              backgroundColor: color,
              width: Math.max(0, neckWidth),
              height: Math.max(0, neckHeight),
              borderRadius: Math.max(0, neckWidth / 2),
              left: width / 2 - neckWidth / 2,
              top: neckY,
              opacity: neckWidth > 0 && neckHeight > 0 ? 1 : 0,
            },
          ]}
        />
        <View
          style={[
            styles.circle,
            {
              backgroundColor: color,
              width: circleRadius * 2,
              height: circleRadius * 2,
              borderRadius: circleRadius,
              left: width / 2 - circleRadius,
              top: circleY - circleRadius,
            },
          ]}
        />
      </Animated.View>

      <View style={[styles.iconContainer, { top: Math.max(8, circleY - 11) }]}>
        <Animated.View style={refreshing ? { transform: [{ rotate }] } : undefined}>
          <Ionicons
            name={refreshing ? 'sync' : ready ? 'refresh' : 'arrow-down'}
            size={16}
            color="#FFFFFF"
          />
        </Animated.View>
      </View>

      <View style={styles.captionWrap}>
        <Text style={styles.captionText}>
          {refreshing ? 'Đang cập nhật dữ liệu...' : ready ? 'Thả tay để tải lại' : 'Kéo xuống để tải lại'}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    overflow: 'visible',
  },
  iconContainer: {
    position: 'absolute',
    left: '50%',
    marginLeft: -8,
    zIndex: 30,
  },
  captionWrap: {
    position: 'absolute',
    top: 8,
    width: '100%',
    alignItems: 'center',
  },
  captionText: {
    color: '#E5E7EB',
    fontSize: 12,
    fontWeight: '600',
  },
  canvasFallback: {
    position: 'relative',
    overflow: 'hidden',
  },
  band: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  bridge: {
    position: 'absolute',
  },
  circle: {
    position: 'absolute',
  },
});

export default GooeyPullToRefresh;
