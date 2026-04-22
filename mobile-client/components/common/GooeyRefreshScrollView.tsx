import React, { useEffect, useRef, useState } from 'react';
import {
  ScrollView,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ScrollViewProps,
} from 'react-native';
import GooeyPullToRefresh from '@/components/home/GooeyPullToRefresh';

interface GooeyRefreshScrollViewProps extends Omit<ScrollViewProps, 'refreshControl'> {
  children: React.ReactNode;
  refreshing: boolean;
  onRefresh: () => void | Promise<void>;
  threshold?: number;
  maxPull?: number;
}

const GooeyRefreshScrollView: React.FC<GooeyRefreshScrollViewProps> = ({
  children,
  refreshing,
  onRefresh,
  threshold = 86,
  maxPull = 170,
  onScroll,
  onScrollEndDrag,
  onMomentumScrollEnd,
  scrollEventThrottle = 16,
  ...rest
}) => {
  const [pullDistance, setPullDistance] = useState(0);
  const refreshingRef = useRef(refreshing);
  const triggeredRef = useRef(false);

  useEffect(() => {
    refreshingRef.current = refreshing;

    if (refreshing) {
      setPullDistance((prev) => Math.max(prev, threshold + 10));
      return;
    }

    triggeredRef.current = false;
    setPullDistance(0);
  }, [refreshing, threshold]);

  const runRefresh = () => {
    if (refreshingRef.current || triggeredRef.current) return;

    triggeredRef.current = true;
    const result = onRefresh();

    if (result && typeof (result as Promise<void>).finally === 'function') {
      (result as Promise<void>).finally(() => {
        if (!refreshingRef.current) {
          triggeredRef.current = false;
          setPullDistance(0);
        }
      });
    }
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = event.nativeEvent.contentOffset.y;

    if (y < 0) {
      setPullDistance(Math.min(-y, maxPull));
    } else if (!refreshingRef.current) {
      setPullDistance(0);
    }

    onScroll?.(event);
  };

  const handleEndDrag = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = event.nativeEvent.contentOffset.y;

    if (y <= -threshold) {
      runRefresh();
    }

    if (!refreshingRef.current && y > -threshold) {
      setPullDistance(0);
    }

    onScrollEndDrag?.(event);
  };

  const handleMomentumEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!refreshingRef.current) {
      setPullDistance(0);
    }

    onMomentumScrollEnd?.(event);
  };

  return (
    <>
      <GooeyPullToRefresh
        pullDistance={pullDistance}
        refreshing={refreshing}
        threshold={threshold}
      />

      <ScrollView
        {...rest}
        bounces
        overScrollMode="always"
        scrollEventThrottle={scrollEventThrottle}
        onScroll={handleScroll}
        onScrollEndDrag={handleEndDrag}
        onMomentumScrollEnd={handleMomentumEnd}
      >
        {children}
      </ScrollView>
    </>
  );
};

export default GooeyRefreshScrollView;
