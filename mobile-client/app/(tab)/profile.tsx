import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Alert,
  TouchableOpacity,
  Image,
  StatusBar,
  Dimensions,
  StyleSheet,
} from 'react-native';
import {
  Heart,
  Bookmark,
  Clock,
  ChevronRight,
  User,
  Bell,
  LogOut,
  Settings,
  CheckCircle,
  Search,
  MessageCircle,
  FileText,
  Shield,
  Zap,
  Key,
  Fingerprint,
} from 'lucide-react-native';
import DarkModeToggle from '@/components/ThemeToggle';
import { useAppDispatch, useAppSelector } from '@/store/hook';
import { logout } from '@/store/slices/auth.slice';
import { router } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { COLORS } from '@/utils/colors';
import { SafeAreaView } from 'react-native-safe-area-context';


const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Guest Welcome Screen ────────────────────────────────────────────────────
const GuestProfile = () => {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const FEATURES = [
    {
      icon: Heart,
      title: 'Lưu tin yêu thích',
      desc: 'Theo dõi những ngôi nhà mơ ước của bạn và nhận thông báo khi có thay đổi giá.',
      bgColor: isDark ? '#1e293b' : '#fef2f2',
      iconBg: isDark ? '#991b1b' : '#fecaca',
      iconColor: '#ef4444',
    },
    {
      icon: FileText,
      title: 'Đăng tin miễn phí',
      desc: 'Tiếp cận hàng ngàn khách hàng tiềm năng mỗi ngày một cách nhanh chóng.',
      bgColor: isDark ? '#1e293b' : '#ecfdf5',
      iconBg: isDark ? '#065f46' : '#a7f3d0',
      iconColor: '#10b981',
    },
    {
      icon: MessageCircle,
      title: 'Kết nối trực tiếp',
      desc: 'Trò chuyện trực tiếp với chủ nhà hoặc môi giới để thương lượng giá tốt nhất.',
      bgColor: isDark ? '#1e293b' : '#eff6ff',
      iconBg: isDark ? '#1e3a5f' : '#bfdbfe',
      iconColor: '#3b82f6',
    },
  ];

  return (
    <ScrollView
      className="flex-1"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 120 }}
    >
      {/* Hero Section */}
      <View style={styles.guestHero}>
        <View style={[styles.guestHeroImageWrapper, { backgroundColor: isDark ? '#1e293b' : '#e0f2fe' }]}>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&q=80' }}
            style={styles.guestHeroImage}
            resizeMode="cover"
          />
          <View style={[styles.guestHeroOverlay, { backgroundColor: isDark ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.3)' }]} />
          {/* Icon house floating */}
          <View style={[styles.guestHeroIcon, { backgroundColor: isDark ? '#1e293b' : '#ffffff' }]}>
            <Zap size={32} color={COLORS.primary} />
          </View>
        </View>

        <Text className="text-center text-xl font-bold text-foreground dark:text-foreground-dark mt-5">
          Chào mừng bạn đến với EstatePro
        </Text>
        <Text className="text-center text-gray-500 dark:text-gray-400 text-sm mt-2 px-8 leading-5">
          Đăng nhập để quản lý tin đăng, lưu bất động sản yêu thích và kết nối với người cho thuê.
        </Text>

        {/* CTA Button */}
        <TouchableOpacity
          style={[styles.ctaButton, { backgroundColor: COLORS.primary }]}
          activeOpacity={0.85}
          onPress={() => router.push('/(auth)/login')}
        >
          <Text style={styles.ctaButtonText}>Đăng nhập / Đăng ký</Text>
        </TouchableOpacity>
      </View>

      {/* Feature Cards */}
      <View className="px-4 mt-2">
        {FEATURES.map((feature, index) => (
          <View
            key={index}
            style={[styles.featureCard, { backgroundColor: feature.bgColor }]}
          >
            <View style={[styles.featureIconWrap, { backgroundColor: feature.iconBg }]}>
              <feature.icon size={22} color={feature.iconColor} />
            </View>
            <View style={styles.featureTextWrap}>
              <Text className="text-foreground dark:text-foreground-dark font-bold text-base mb-1">
                {feature.title}
              </Text>
              <Text className="text-gray-500 dark:text-gray-400 text-sm leading-5">
                {feature.desc}
              </Text>
            </View>
          </View>
        ))}
      </View>

      {/* Trust Badge */}
      <View style={[styles.trustBadge, { backgroundColor: isDark ? '#0f172a' : '#f0fdfa' }]}>
        <Shield size={20} color="#0d9488" />
        <Text className="text-teal-700 dark:text-teal-300 font-semibold text-sm ml-3 flex-1 text-center">
          Hệ thống bảo mật thông tin chuẩn quốc tế
        </Text>
      </View>
    </ScrollView>
  );
};

// ─── Logged-in Profile ───────────────────────────────────────────────────────
const AuthenticatedProfile = () => {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { user } = useAppSelector(state => state.auth);
  const dispatch = useAppDispatch();
  const userName = user?.fullName || 'Người dùng';

  const memberSince = user?.createdAt
    ? `Thành viên từ ${new Date(user.createdAt).getFullYear()}`
    : '';

  const handleLogout = () => {
    Alert.alert(
      'Đăng xuất',
      'Bạn có chắc chắn muốn đăng xuất?',
      [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Đăng xuất', style: 'destructive', onPress: () => dispatch(logout()) }
      ]
    );
  };

  const isKycApproved = user?.kycStatus === 'approved' || user?.kycStatus === 'verified';

  const ACCOUNT_MENU = [
    {
      icon: User,
      title: 'Thông tin cá nhân',
      onPress: () => router.push('/(profile)/edit'),
      iconColor: '#3b82f6',
    },
    {
      icon: Key,
      title: 'Quên mật khẩu',
      onPress: () => router.push('/(auth)/forgot-password'),
      iconColor: '#f59e0b',
    },
    {
      icon: Settings,
      title: 'Cài đặt ứng dụng',
      onPress: () => router.push('/(profile)/notification-settings'),
      iconColor: '#6366f1',
    },
  ];

  const ACTIVITY_MENU = [
    {
      icon: Heart,
      title: 'Tin đăng đã lưu',
      onPress: () => router.push('/(profile)/favorites'),
      iconColor: '#ef4444',
    },
    {
      icon: Search,
      title: 'Tìm kiếm đã lưu',
      onPress: () => Alert.alert('Tìm kiếm đã lưu'),
      iconColor: '#a855f7',
    },
    {
      icon: Clock,
      title: 'Lịch sử đã xem',
      onPress: () => Alert.alert('Lịch sử xem tin'),
      iconColor: '#f59e0b',
    },
  ];

  return (
    <ScrollView
      className="flex-1"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 120 }}
    >
      {/* Profile Header */}
      <View className="items-center pt-6 pb-4">
        <View style={styles.avatarWrapper}>
          {user?.avatarUrl ? (
            <Image
              source={{ uri: user.avatarUrl }}
              style={styles.avatar}
            />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <User size={48} color="#9CA3AF" />
            </View>
          )}
          {/* Verified Badge */}
          <View style={[styles.verifiedBadge, { backgroundColor: COLORS.primary }]}>
            <CheckCircle size={14} color="#fff" />
          </View>
        </View>

        <Text className="text-foreground dark:text-foreground-dark text-xl font-bold mt-3">
          {userName}
        </Text>
        {memberSince ? (
          <Text className="text-gray-500 dark:text-gray-400 text-sm mt-1">{memberSince}</Text>
        ) : null}
      </View>

      {/* Stats Row */}
      <View style={[styles.statsCard, { backgroundColor: isDark ? '#1f2937' : '#ffffff', borderColor: isDark ? '#374151' : '#e5e7eb' }]}>
        <View style={styles.statItem}>
          <Text className="text-foreground dark:text-foreground-dark text-lg font-bold">0</Text>
          <Text className="text-gray-500 dark:text-gray-400 text-xs mt-1">Tin đăng</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: isDark ? '#374151' : '#e5e7eb' }]} />
        <View style={styles.statItem}>
          <Text className="text-foreground dark:text-foreground-dark text-lg font-bold">0</Text>
          <Text className="text-gray-500 dark:text-gray-400 text-xs mt-1">Người theo dõi</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: isDark ? '#374151' : '#e5e7eb' }]} />
        <View style={styles.statItem}>
          <Text className="text-foreground dark:text-foreground-dark text-lg font-bold">0</Text>
          <Text className="text-gray-500 dark:text-gray-400 text-xs mt-1">Đang theo dõi</Text>
        </View>
      </View>

      {/* Verification Card */}
      {isKycApproved ? (
        <View style={[styles.verifyCard, { backgroundColor: isDark ? '#042f2e' : '#f0fdfa' }]}>
          <View style={styles.verifyRow}>
            <View style={[styles.verifyIcon, { backgroundColor: isDark ? '#065f46' : '#ccfbf1' }]}>
              <CheckCircle size={20} color="#0d9488" />
            </View>
            <View style={{ flex: 1 }}>
              <Text className="text-foreground dark:text-foreground-dark font-bold text-sm">
                Tài khoản đã xác minh
              </Text>
              <Text className="text-gray-500 dark:text-gray-400 text-xs mt-1 leading-4">
                Độ tin cậy cao được đảm bảo bởi hệ thống của chúng tôi.
              </Text>
            </View>
            <ChevronRight size={18} color="#9CA3AF" />
          </View>
        </View>
      ) : (
        <TouchableOpacity
          onPress={() => router.push('/(profile)/ekyc' as any)}
          style={[styles.verifyCard, { backgroundColor: isDark ? '#1e1b4b' : '#eef2ff' }]}
          activeOpacity={0.7}
        >
          <View style={styles.verifyRow}>
            <View style={[styles.verifyIcon, { backgroundColor: isDark ? '#3730a3' : '#c7d2fe' }]}>
              <Fingerprint size={20} color="#6366f1" />
            </View>
            <View style={{ flex: 1 }}>
              <Text className="text-foreground dark:text-foreground-dark font-bold text-sm">
                Xác thực danh tính (eKYC)
              </Text>
              <Text className="text-gray-500 dark:text-gray-400 text-xs mt-1 leading-4">
                Xác minh để đăng tin và tăng độ tin cậy tài khoản.
              </Text>
            </View>
            <ChevronRight size={18} color="#6366f1" />
          </View>
        </TouchableOpacity>
      )}

      {/* Account Section */}
      <Text style={styles.sectionTitle} className="text-gray-500 dark:text-gray-400">
        TÀI KHOẢN
      </Text>
      <View style={[styles.menuGroup, { backgroundColor: isDark ? '#1f2937' : '#ffffff', borderColor: isDark ? '#374151' : '#f3f4f6' }]}>
        {ACCOUNT_MENU.map((item, idx) => (
          <TouchableOpacity
            key={idx}
            onPress={item.onPress}
            style={[styles.menuItem, idx < ACCOUNT_MENU.length - 1 && styles.menuItemBorder, { borderBottomColor: isDark ? '#374151' : '#f3f4f6' }]}
            activeOpacity={0.7}
          >
            <item.icon size={20} color={item.iconColor} />
            <Text className="text-foreground dark:text-foreground-dark text-base ml-3 flex-1">{item.title}</Text>
            <ChevronRight size={18} color="#9CA3AF" />
          </TouchableOpacity>
        ))}
      </View>

      {/* Activity Section */}
      <Text style={styles.sectionTitle} className="text-gray-500 dark:text-gray-400">
        HOẠT ĐỘNG
      </Text>
      <View style={[styles.menuGroup, { backgroundColor: isDark ? '#1f2937' : '#ffffff', borderColor: isDark ? '#374151' : '#f3f4f6' }]}>
        {ACTIVITY_MENU.map((item, idx) => (
          <TouchableOpacity
            key={idx}
            onPress={item.onPress}
            style={[styles.menuItem, idx < ACTIVITY_MENU.length - 1 && styles.menuItemBorder, { borderBottomColor: isDark ? '#374151' : '#f3f4f6' }]}
            activeOpacity={0.7}
          >
            <item.icon size={20} color={item.iconColor} />
            <Text className="text-foreground dark:text-foreground-dark text-base ml-3 flex-1">{item.title}</Text>
            <ChevronRight size={18} color="#9CA3AF" />
          </TouchableOpacity>
        ))}
      </View>

      {/* Dark Mode Toggle */}
      <DarkModeToggle />

      {/* Logout */}
      <TouchableOpacity
        onPress={handleLogout}
        style={styles.logoutButton}
        activeOpacity={0.7}
      >
        <LogOut size={18} color="#ef4444" />
        <Text style={styles.logoutText}>Đăng xuất</Text>
      </TouchableOpacity>

      <Text className="text-center text-gray-400 text-xs mt-4">
        Phiên bản 0.0.1
      </Text>
    </ScrollView>
  );
};

// ─── Main Profile Screen ─────────────────────────────────────────────────────
const ProfileScreen = () => {
  const { isAuth } = useAppSelector(state => state.auth);
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      className="flex-1 bg-background dark:bg-background-dark"
    >
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={isDark ? '#19191a' : '#FFFFFF'}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.canGoBack() && router.back()} activeOpacity={0.7}>
          <Text className="text-primary text-base">{'‹'}</Text>
        </TouchableOpacity>
        <Text className="text-foreground dark:text-foreground-dark text-lg font-bold">
          Tài khoản
        </Text>
        <View style={{ width: 20 }} />
      </View>

      {isAuth ? <AuthenticatedProfile /> : <GuestProfile />}
    </SafeAreaView>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  // Guest
  guestHero: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  guestHeroImageWrapper: {
    width: SCREEN_WIDTH - 48,
    height: 180,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  guestHeroImage: {
    width: '100%',
    height: '100%',
  },
  guestHeroOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  guestHeroIcon: {
    position: 'absolute',
    bottom: -2,
    alignSelf: 'center',
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  ctaButton: {
    marginTop: 20,
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 16,
    width: SCREEN_WIDTH - 48,
    alignItems: 'center',
  },
  ctaButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  featureCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  featureIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  featureTextWrap: {
    flex: 1,
  },
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
  },
  // Authenticated
  avatarWrapper: {
    position: 'relative',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  statsCard: {
    flexDirection: 'row',
    marginHorizontal: 16,
    borderRadius: 16,
    paddingVertical: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 32,
  },
  verifyCard: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 16,
  },
  verifyRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  verifyIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
    marginLeft: 16,
    marginTop: 24,
    marginBottom: 8,
  },
  menuGroup: {
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    paddingVertical: 14,
    marginHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  logoutText: {
    color: '#ef4444',
    fontWeight: '600',
    fontSize: 15,
    marginLeft: 8,
  },
});

export default ProfileScreen;