import React, { useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useWindowDimensions,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  Blur,
  Canvas,
  Circle,
  ColorMatrix,
  Group,
  Paint,
  Rect,
  RoundedRect,
} from '@shopify/react-native-skia';

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
  color = '#2563EB',
}) => {
  const { width } = useWindowDimensions();
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!refreshing) {
      spin.stopAnimation();
      spin.setValue(0);
      return;
    }

    const loop = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 900,
        useNativeDriver: true,
      })
    );

    loop.start();
    return () => loop.stop();
  }, [refreshing, spin]);

  const clampedPull = Math.max(0, Math.min(pullDistance, 160));
  const progress = Math.min(clampedPull / threshold, 1.2);
  const visibleHeight = refreshing ? Math.max(clampedPull, 82) : clampedPull;

  const circleRadius = refreshing
    ? 26
    : Math.max(14, Math.min(30, 14 + clampedPull * 0.16));
  const topBandHeight = Math.max(12, Math.min(24, 12 + progress * 8));
  const circleY = refreshing
    ? Math.max(topBandHeight + circleRadius + 8, visibleHeight - 8)
    : Math.max(topBandHeight + circleRadius, topBandHeight + 18 + clampedPull * 0.6);
  const neckWidth = refreshing
    ? 18
    : Math.max(8, Math.min(20, 8 + progress * 8));
  const neckY = topBandHeight - 2;
  const neckHeight = Math.max(10, circleY - circleRadius * 0.75 - neckY);
  const bridgeRadius = refreshing
    ? 10
    : Math.max(4, Math.min(12, 4 + progress * 7));
  const bridgeY = neckY + neckHeight * 0.68;

  const ready = clampedPull >= threshold;

  const layerPaint = useMemo(
    () => (
      <Paint>
        <Blur blur={12} />
        <ColorMatrix
          matrix={[
            1, 0, 0, 0, 0,
            0, 1, 0, 0, 0,
            0, 0, 1, 0, 0,
            0, 0, 0, 30, -12,
          ]}
        />
      </Paint>
    ),
    []
  );

  if (visibleHeight <= 0.5 && !refreshing) {
    return null;
  }

  const rotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View pointerEvents="none" style={[styles.container, { height: visibleHeight + 6 }]}> 
      <Canvas style={StyleSheet.absoluteFill}>
        <Group layer={layerPaint}>
          <Rect x={0} y={-240} width={width} height={topBandHeight + 240} color={color} />
          <RoundedRect
            x={width / 2 - neckWidth / 2}
            y={neckY}
            width={neckWidth}
            height={neckHeight}
            r={neckWidth / 2}
            color={color}
          />
          <Circle cx={width / 2} cy={bridgeY} r={bridgeRadius} color={color} />
          <Circle cx={width / 2} cy={circleY} r={circleRadius} color={color} />
        </Group>
      </Canvas>

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
});

export default GooeyPullToRefresh;
