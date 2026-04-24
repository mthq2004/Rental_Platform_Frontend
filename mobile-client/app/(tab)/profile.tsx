import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import {
  Heart,
  Bookmark,
  Clock,
  Star,
  ChevronRight,
  User,
  CreditCard,
  Bell,
  Lock,
  HelpCircle,
  LogOut,
  Settings
} from 'lucide-react-native';
import DarkModeToggle from '@/components/ThemeToggle';
import { useCustomAlert } from '@/hooks/useCustomAlert';
import ProfileAvatar from '@/components/profile/ProfileAvatar';
import SectionHeader from '@/components/SectionHeader';
import VerificationCard from '@/components/profile/VerificationCard';
import MenuItem from '@/components/profile/MenuItem';
import { useAppDispatch, useAppSelector } from '@/store/hook';
import { logout } from '@/store/slices/auth.slice';
import { router } from 'expo-router';

const ProfileScreen = () => {
  const [verificationStatus, setVerificationStatus] = useState<'verified' | 'pending' | 'unverified'>('verified');
  const { alert, showAlert, hideAlert } = useCustomAlert();
  const { isAuth, user } = useAppSelector(state => state.auth)
  const userName = user?.fullName || 'Người dùng';
  const dispatch = useAppDispatch()


  const handleEdit = async () => {
    router.push("/(profile)/edit")
  };

  const handleVerification = () => {
    if (verificationStatus === 'verified') {
      Alert.alert('Thông tin xác minh', `Họ tên: ${userName}\nTrạng thái: Đã xác minh`);
    } else if (verificationStatus === 'pending') {
      Alert.alert('Đang xử lý', 'CCCD của bạn đang được xem xét. Thời gian dự kiến: 1-2 ngày làm việc.');
    } else {
      Alert.alert('Xác minh CCCD', 'Bạn sẽ được chuyển đến màn hình xác minh danh tính');
    }
  };

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

  const ACTIVITY_MENU = [
    {
      icon: Heart,
      title: 'Tin đăng đã lưu',
      onPress: () => Alert.alert('Tin đăng đã lưu'),
      iconBgColor: 'bg-red-100',
      iconColor: '#ef4444',
    },
    {
      icon: Bookmark,
      title: 'Tìm kiếm đã lưu',
      onPress: () => Alert.alert('Tìm kiếm đã lưu'),
      iconBgColor: 'bg-purple-100',
      iconColor: '#a855f7',
    },
    {
      icon: Clock,
      title: 'Lịch sử xem tin',
      onPress: () => Alert.alert('Lịch sử xem tin'),
      iconBgColor: 'bg-indigo-100',
      iconColor: '#6366f1',
    },
    {
      icon: Star,
      title: 'Đánh giá từ tôi',
      onPress: () => Alert.alert('Đánh giá từ tôi'),
      iconBgColor: 'bg-amber-100',
      iconColor: '#f59e0b',
    },
  ];

  const SETTING_MENU = [
    {
      icon: Settings,
      title: 'Cài đặt tài khoản',
      subtitle: "Quyền riêng tư, bảo mật",
      onPress: () => Alert.alert('Cài đặt tài khoản'),
      iconBgColor: 'bg-red-100',
      iconColor: '#ef4444',
    },
    {
      icon: Bell,
      title: 'Thông báo',
      subtitle: "Quản lý thông báo",
      onPress: () => router.push('/(profile)/notification-settings'),
      iconBgColor: 'bg-purple-100',
      iconColor: '#a855f7',
      showBadge: true
    },
    {
      icon: Lock,
      title: 'Bảo mật',
      subtitle: "Mật khẩu, xác thực 2 lớp",
      onPress: handleLogout,
      iconBgColor: 'bg-green-100',
      iconColor: '#10b981',
    },
  ];

  const OTHER_MENU = [
    {
      icon: HelpCircle,
      title: 'Trợ giúp & Hỗ trợ',
      subtitle: "Câu hỏi thường gặp, liên hệ",
      onPress: () => Alert.alert('Trợ giúp'),
      iconBgColor: 'bg-cyan-100',
      iconColor: '#06b6d4'
    },
    {
      icon: LogOut,
      title: 'Đăng xuất',
      onPress: handleLogout,
      iconBgColor: 'bg-red-100',
      iconColor: '#ef4444',
      rightElement: null
    }
  ];

  return (
    <View className="flex-1 bg-background dark:bg-background-dark">
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {
          isAuth ? (
            <View className="bg-background dark:bg-background-dark pt-16 pb-8">
              <ProfileAvatar
                imageUrl={user?.avatarUrl ? user.avatarUrl : "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400"}
                onEdit={handleEdit}
                isVerified={verificationStatus === 'verified'}
              />
              <Text className="text-center text-2xl font-bold text-foreground dark:text-foreground-dark mb-1">
                {
                  user?.fullName
                }
              </Text>
              <Text className="text-center text-gray-500 text-sm mb-4">
                {user?.phone || user?.email || `ID: ${user?.id}`}
              </Text>

              <View className="flex-row justify-center gap-8 mb-6 px-4">
                <View className="items-center">
                  <Text className="text-foreground dark:text-foreground-dark text-xl font-bold">0</Text>
                  <Text className="text-foreground dark:text-foreground-dark text-xs mt-1">Tin đăng</Text>
                </View>
                <View className="items-center">
                  <Text className="text-foreground dark:text-foreground-dark text-xl font-bold">0</Text>
                  <Text className="text-foreground dark:text-foreground-dark text-xs mt-1">Người theo dõi</Text>
                </View>
                <View className="items-center">
                  <Text className="text-foreground dark:text-foreground-dark text-xl font-bold">0</Text>
                  <Text className="text-foreground dark:text-foreground-dark text-xs mt-1">Đang theo dõi</Text>
                </View>
              </View>
            </View>
          ) : (
            <View className="bg-background dark:bg-background-dark pt-16 pb-10 px-6 items-center">
              <ProfileAvatar
                imageUrl=""
                onEdit={handleEdit}
                isVerified={false}
              />

              <Text className="text-center text-2xl font-bold text-foreground dark:text-foreground-dark mt-4">
                Chào bạn 👋
              </Text>

              <Text className="text-center text-gray-500 text-sm mt-2 mb-1">
                Mua thì hời, bán thì lời
              </Text>

              <Text className="text-center text-gray-400 text-sm mb-6">
                Đăng nhập cái đã, rồi mình đi tiếp nha 😉
              </Text>

              <TouchableOpacity
                className="w-full bg-blue-500 py-4 rounded-2xl mb-3"
                activeOpacity={0.85}
                onPress={() => router.push('/(auth)/login')}
              >
                <Text className="text-white text-center font-semibold text-base">
                  Đăng nhập
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="w-full border border-blue-500 py-4 rounded-2xl"
                activeOpacity={0.85}
                onPress={() => router.push('/(auth)/register')}
              >
                <Text className="text-blue-500 text-center font-semibold text-base">
                  Tạo tài khoản
                </Text>
              </TouchableOpacity>
            </View>

          )
        }


        <View className="mt-4">
          <VerificationCard status={verificationStatus} onVerify={handleVerification} />
        </View>

        <SectionHeader title="Tài khoản" />
        <MenuItem
          icon={User}
          title="Thông tin cá nhân"
          subtitle="Cập nhật thông tin của bạn"
          onPress={() => router.push('/(profile)/edit')}
          iconBgColor="bg-blue-100"
          iconColor="#3b82f6"
        />

        <SectionHeader title="Hoạt động" />
        {ACTIVITY_MENU.map((item, index) => (
          <MenuItem
            key={index}
            {...item}
          />
        ))}

        <SectionHeader title="Cài đặt" />
        {SETTING_MENU.map((item, index) => (
          <MenuItem
            key={index}
            {...item}
          />
        ))}
        <DarkModeToggle />

        <SectionHeader title="Hỗ trợ" />
        {OTHER_MENU.map((item, index) => (
          <MenuItem
            key={index}
            {...item}
          />
        ))}

        <Text className="text-center text-gray-400 text-xs mb-4">
          Phiên bản 0.0.1
        </Text>
      </ScrollView>
    </View>
  );
};

export default ProfileScreen;