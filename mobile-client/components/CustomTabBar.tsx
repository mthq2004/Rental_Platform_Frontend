import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Dimensions,
  Animated,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { router } from 'expo-router';
import { COLORS, useThemeColors } from '@/utils/colors';
import { useColorScheme } from 'nativewind';
import { useAppSelector } from '@/store/hook';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Animated Post Button ────────────────────────────────────────────────────
const AnimatedPostButton = ({ colors }: { colors: any }) => {
  const scale = useRef(new Animated.Value(1)).current;
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue: 0.85, duration: 800, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1.1, duration: 800, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, [scale]);

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <View
        style={[
          styles.postButton,
          { borderColor: isDark ? '#19191A' : '#FFFFFF' },
        ]}
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </View>
    </Animated.View>
  );
};

// ─── Tab Config ──────────────────────────────────────────────────────────────
const TAB_CONFIG = [
  {
    name: 'index',
    label: 'Trang chủ',
    icon: (color: string) => <Ionicons name="home" size={24} color={color} />,
  },
  {
    name: '(protected)/my-post',
    label: 'Quản lý tin',
    icon: (color: string) => (
      <MaterialCommunityIcons name="bookmark-outline" size={24} color={color} />
    ),
  },
  {
    name: '(protected)/create-post',
    label: 'Đăng tin',
    isCenter: true,
  },
  {
    name: '(protected)/chat',
    label: 'Chat',
    icon: (color: string) => (
      <Ionicons name="chatbubble-ellipses-outline" size={24} color={color} />
    ),
  },
  {
    name: 'profile',
    label: 'Tài khoản',
    icon: (color: string) => (
      <Ionicons name="person-circle-outline" size={24} color={color} />
    ),
  },
];

// ─── CustomTabBar ────────────────────────────────────────────────────────────
export default function CustomTabBar({ state, descriptors, navigation, onAuthFail }: any) {
  const { colorScheme } = useColorScheme();
  const colors = useThemeColors();
  const isDark = colorScheme === 'dark';
  const { isAuth } = useAppSelector((s) => s.auth);

  // Map tab names to redirect paths
  const REDIRECT_MAP: Record<string, string> = {
    '(protected)/my-post': '/(tab)/(protected)/my-post',
    '(protected)/create-post': '/(post)/choose-property-type',
    '(protected)/chat': '/(tab)/(protected)/chat',
  };

  return (
    // wrapper cao hơn để chứa nút nổi lên
    <View style={styles.wrapper} pointerEvents="box-none">

      {/* ── Background blur ── */}
      <View style={styles.barBackground}>
        <BlurView
          tint={isDark ? 'dark' : 'light'}
          intensity={60} // Giảm nhẹ intensity để nhìn rõ phía sau hơn
          style={[StyleSheet.absoluteFillObject, { borderRadius: 30, overflow: 'hidden' }]}
        />
        <View
          style={[
            StyleSheet.absoluteFillObject,
            {
              // Giảm alpha xuống 0.4 - 0.6 để tạo hiệu ứng kính (glassmorphism)
              backgroundColor: isDark
                ? 'rgba(25, 25, 26, 0.5)'
                : 'rgba(255, 255, 255, 0.4)',
              borderRadius: 30,
              borderWidth: 1, // Thêm viền mảnh để định hình khối kính
              borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
            },
          ]}
        />
      </View>

      {/* ── Tab row (không overflow hidden → nút không bị clip) ── */}
      <View style={styles.tabRow}>
        {TAB_CONFIG.map((tab, index) => {
          const route = state.routes[index];
          const isFocused = state.index === index;

          const isProtected = tab.name.startsWith('(protected)');

          const onPress = () => {
            // Auth guard: check if the tab is protected and user is not logged in
            if (isProtected && !isAuth) {
              const redirectTo = REDIRECT_MAP[tab.name] || '';
              if (onAuthFail) onAuthFail(redirectTo);
              return;
            }

            if (tab.isCenter) {
              router.push('/(post)/choose-property-type');
              return;
            }
            const event = navigation.emit({
              type: 'tabPress',
              target: route?.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route?.name ?? tab.name);
            }
          };

          const iconColor = isFocused ? COLORS.primary : colors.current.textInactive;

          // Center "Đăng tin" button — nổi lên trên bar
          if (tab.isCenter) {
            return (
              <TouchableOpacity
                key={tab.name}
                onPress={onPress}
                style={styles.centerTabItem}
                activeOpacity={0.1}
              >
                {/* Nút tròn nổi lên */}
                <View style={styles.centerButtonWrapper}>
                  <AnimatedPostButton colors={colors} />
                </View>
                {/* Label nằm trong bar */}
                <Text style={[styles.label, { color: colors.current.textInactive, marginTop: 4 }]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          }

          return (
            <TouchableOpacity
              key={tab.name}
              onPress={onPress}
              style={styles.tabItem}
              activeOpacity={0.7}
            >
              {tab.icon?.(iconColor)}
              <Text style={[styles.label, { color: isFocused ? COLORS.primary : colors.current.textInactive }]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const MARGIN = 20;
const BAR_HEIGHT = 60;
const BTN_SIZE = 56;
// Nút nhô lên bao nhiêu so với top của bar
const BTN_OFFSET = 20;

const styles = StyleSheet.create({
  // Wrapper cao hơn bar để nút có chỗ nổi lên
  wrapper: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 24 : 16,
    left: MARGIN,
    right: MARGIN,
    height: BAR_HEIGHT + BTN_OFFSET,
    justifyContent: 'flex-end', // bar nằm dưới cùng
  },
  // Background blur — chỉ phần bar
  barBackground: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: BAR_HEIGHT,
    borderRadius: 30,
    // Đảm bảo không có backgroundColor ở đây, hoặc dùng transparent
    backgroundColor: 'transparent',

    // Đổ bóng nhẹ nhàng hơn để không làm bẩn hiệu ứng mờ
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  // Row chứa các tab — không overflow hidden
  tabRow: {
    flexDirection: 'row',
    height: BAR_HEIGHT,
    alignItems: 'flex-end', // align xuống dưới để label căn đều
    paddingBottom: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingBottom: 0,
  },
  centerTabItem: {
    flex: 1,
    alignItems: 'center',
    // Không justifyContent để tự sắp xếp theo centerButtonWrapper
  },
  // Wrapper giúp nút nổi lên trên bar
  centerButtonWrapper: {
    position: 'absolute',
    bottom: BAR_HEIGHT - BTN_SIZE / 2 - 8, // nổi lên trên mép bar
    alignSelf: 'center',
  },
  label: {
    fontSize: 11,
    fontWeight: '400',
  },
  postButton: {
    width: BTN_SIZE,
    height: BTN_SIZE,
    borderRadius: BTN_SIZE / 2,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
});
