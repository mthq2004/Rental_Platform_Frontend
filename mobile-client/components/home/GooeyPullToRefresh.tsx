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
  color = '#0052cc',
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

  if (clampedPull <= 0 && !refreshing) {
    return null;
  }

  const rotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View pointerEvents="none" style={styles.container}>
      <Canvas style={{ height: 200, width }}>
        <Group layer={layerPaint}>
          <Rect x={0} y={0} width={width} height={topBandHeight} color={color} />
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
