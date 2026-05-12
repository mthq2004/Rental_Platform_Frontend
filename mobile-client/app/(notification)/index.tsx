import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StatusBar,
  Alert,
} from 'react-native';
import React, { useCallback, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useAppDispatch, useAppSelector } from '@/store/hook';
import {
  getNotification,
  markAsRead,
  selectUnreadCount,
  deleteReadNotifications,
  optimisticMarkAllRead,
} from '@/store/slices/notification.slice';
import AuthGuard from '@/components/AuthGuard';
import { useColorScheme } from 'nativewind';

// ----- Type config (mirrors web-client NotificationDropdown) -----
type TypeCfg = { iconName: string; color: string; label: string };

const TYPE_CONFIG: Record<string, TypeCfg> = {
  PROPERTY_UPDATE:       { iconName: 'home-outline',          color: '#1890ff', label: 'Bất động sản' },
  ADMIN_ACTION:          { iconName: 'settings-outline',      color: '#fa8c16', label: 'Admin' },
  RENTAL_REQUEST:        { iconName: 'document-attach-outline', color: '#52c41a', label: 'Yêu cầu thuê' },
  RENTAL_REQUEST_UPDATE: { iconName: 'sync-circle-outline',   color: '#13c2c2', label: 'Yêu cầu thuê' },
  CONTRACT_CREATED:      { iconName: 'document-lock-outline', color: '#722ed1', label: 'Hợp đồng' },
  CONTRACT_UPDATED:      { iconName: 'create-outline',        color: '#722ed1', label: 'Hợp đồng' },
  CONTRACT_SIGNED:       { iconName: 'shield-checkmark-outline', color: '#722ed1', label: 'Ký hợp đồng' },
  DEPOSIT_PAYMENT:       { iconName: 'wallet-outline',        color: '#eb2f96', label: 'Tiền cọc' },
  PAYMENT:               { iconName: 'card-outline',          color: '#faad14', label: 'Thanh toán' },
  PAYMENT_REMINDER:      { iconName: 'notifications-circle-outline', color: '#1890ff', label: 'Nhắc thanh toán' },
  PAYMENT_DUE:           { iconName: 'time-outline',          color: '#fa8c16', label: 'Đến hạn' },
  PAYMENT_WARNING:       { iconName: 'warning-outline',       color: '#f5222d', label: 'Cảnh báo' },
  PAYMENT_OVERDUE:       { iconName: 'alert-circle-outline',  color: '#f5222d', label: 'Trễ hạn' },
  CONTRACT_EXPIRING:     { iconName: 'timer-outline',         color: '#fa8c16', label: 'Sắp hết hạn' },
  CONTRACT_EXPIRED:      { iconName: 'close-circle-outline',  color: '#f5222d', label: 'Hết hạn' },
  RENEWAL_REQUEST:       { iconName: 'sync-outline',          color: '#13c2c2', label: 'Gia hạn' },
  SYSTEM:                { iconName: 'notifications-outline', color: '#8c8c8c', label: 'Hệ thống' },
};

const WARNING_TYPES = ['PAYMENT_WARNING', 'PAYMENT_OVERDUE'];

const getCfg = (type?: string): TypeCfg =>
  TYPE_CONFIG[type ?? 'SYSTEM'] ?? TYPE_CONFIG.SYSTEM;

const isWarning = (type?: string) => WARNING_TYPES.includes(type ?? '');

// ----- Tabs -----
type TabKey = 'all' | 'posts' | 'contracts' | 'payments';
const TABS: { key: TabKey; label: string }[] = [
  { key: 'all',       label: 'Tất cả' },
  { key: 'posts',     label: 'Tin đăng' },
  { key: 'contracts', label: 'Hợp đồng' },
  { key: 'payments',  label: 'Thanh toán' },
];

const filterByTab = (notifications: any[], tab: TabKey) => {
  if (tab === 'all') return notifications;
  if (tab === 'posts')
    return notifications.filter((n) =>
      ['PROPERTY_UPDATE', 'ADMIN_ACTION'].includes(n.type)
    );
  if (tab === 'contracts')
    return notifications.filter((n) =>
      [
        'CONTRACT_CREATED', 'CONTRACT_UPDATED', 'CONTRACT_SIGNED',
        'RENTAL_REQUEST', 'RENTAL_REQUEST_UPDATE', 'DEPOSIT_PAYMENT',
        'CONTRACT_EXPIRING', 'CONTRACT_EXPIRED', 'RENEWAL_REQUEST',
      ].includes(n.type)
    );
  if (tab === 'payments')
    return notifications.filter((n) =>
      [
        'PAYMENT', 'PAYMENT_REMINDER', 'PAYMENT_DUE',
        'PAYMENT_WARNING', 'PAYMENT_OVERDUE',
      ].includes(n.type)
    );
  return notifications;
};

// ----- Helpers -----
const formatTime = (dateString: string) => {
  if (!dateString) return '';
  const d = new Date(dateString);
  const diff = Date.now() - d.getTime();
  const min  = Math.floor(diff / 60000);
  const hour = Math.floor(diff / 3600000);
  const day  = Math.floor(diff / 86400000);
  if (min < 1)  return 'Vừa xong';
  if (min < 60) return `${min} phút trước`;
  if (hour < 24) return `${hour} giờ trước`;
  if (day < 7)  return `${day} ngày trước`;
  return d.toLocaleDateString('vi-VN');
};

// ================================================================
const NotificationScreen = () => {
  const router    = useRouter();
  const dispatch  = useAppDispatch();
  const { colorScheme } = useColorScheme();
  const isDark    = colorScheme === 'dark';

  const unreadCount   = useAppSelector(selectUnreadCount);
  const { notifications = [], loading } = useAppSelector((s) => s.notification);

  const [activeTab,    setActiveTab]    = useState<TabKey>('all');
  const [showUnread,   setShowUnread]   = useState(false);

  useFocusEffect(
    useCallback(() => {
      dispatch(getNotification());
    }, [dispatch])
  );

  const visible = showUnread
    ? notifications.filter((n: any) => !n.isRead)
    : filterByTab(notifications, activeTab);

  const readCount = notifications.filter((n: any) => n.isRead).length;

  const handleTap = (item: any) => {
    if (!item.isRead) dispatch(markAsRead(item.id));
    
    if (item.metadata?.contractId) {
      router.push(`/(rental)/contract-detail?contractId=${item.metadata.contractId}` as any);
    } else if (item.metadata?.propertyId) {
      router.push(`/(post)/property-detail?id=${item.metadata.propertyId}` as any);
    }
  };

  const handleMarkAllRead = () => {
    dispatch(optimisticMarkAllRead());
    notifications
      .filter((n: any) => !n.isRead)
      .forEach((n: any) => dispatch(markAsRead(n.id)));
  };

  const handleDeleteRead = () => {
    Alert.alert(
      'Xóa thông báo đã đọc',
      `Xóa ${readCount} thông báo đã đọc?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: () => dispatch(deleteReadNotifications()),
        },
      ]
    );
  };

  // ----- Item -----
  const renderItem = ({ item }: { item: any }) => {
    const cfg  = getCfg(item.type);
    const warn = isWarning(item.type);

    return (
      <TouchableOpacity
        onPress={() => handleTap(item)}
        activeOpacity={0.85}
        className={`flex-row gap-3 px-4 py-4 border-b border-gray-100 dark:border-gray-800 ${
          warn
            ? 'bg-red-50 dark:bg-red-950/30 border-l-4 border-l-red-500'
            : !item.isRead
            ? 'bg-blue-50/60 dark:bg-blue-950/20'
            : ''
        }`}
      >
        {/* Icon */}
        <View className="relative flex-shrink-0 mt-0.5">
          <View
            className="w-10 h-10 rounded-full items-center justify-center"
            style={{ backgroundColor: cfg.color + '22', borderWidth: 1, borderColor: cfg.color + '55' }}
          >
            <Ionicons name={cfg.iconName as any} size={20} color={cfg.color} />
          </View>
          {!item.isRead && (
            <View className="absolute -top-0.5 -left-0.5 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-gray-900" />
          )}
        </View>

        {/* Content */}
        <View className="flex-1 min-w-0">
          <View className="flex-row items-center gap-2 mb-0.5 flex-wrap">
            <Text
              className={`text-sm font-semibold flex-shrink ${
                warn ? 'text-red-600' : 'text-gray-900 dark:text-foreground-dark'
              }`}
              numberOfLines={1}
            >
              {item.title}
            </Text>
            <View
              className="px-1.5 py-0.5 rounded-full"
              style={{ backgroundColor: cfg.color + '22', borderWidth: 1, borderColor: cfg.color + '55' }}
            >
              <Text className="text-[10px] font-medium" style={{ color: cfg.color }}>
                {cfg.label}
              </Text>
            </View>
          </View>

          <Text
            className={`text-sm leading-snug mb-1.5 ${
              warn ? 'text-red-500 font-medium' : 'text-gray-600 dark:text-gray-300'
            }`}
            numberOfLines={2}
          >
            {item.body}
          </Text>

          <View className="flex-row items-center gap-1">
            <Ionicons name="time-outline" size={12} color={isDark ? '#9CA3AF' : '#9CA3AF'} />
            <Text className="text-xs text-gray-400">{formatTime(item.createdAt)}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // ----- Empty state -----
  const EmptyState = () => (
    <View className="flex-1 items-center justify-center py-20 px-6">
      <View className="w-20 h-20 rounded-full bg-blue-100 dark:bg-blue-950/40 items-center justify-center mb-4">
        <Ionicons name="notifications-outline" size={36} color="#2563EB" />
      </View>
      <Text className="text-lg font-semibold text-gray-800 dark:text-foreground-dark mb-2">
        Chưa có thông báo
      </Text>
      <Text className="text-sm text-gray-500 dark:text-gray-300 text-center">
        Mọi cập nhật sẽ được hiển thị tại đây
      </Text>
    </View>
  );

  return (
    <AuthGuard>
      <View className="flex-1 bg-gray-50 dark:bg-background-dark">
        <StatusBar
          barStyle={isDark ? 'light-content' : 'dark-content'}
          backgroundColor={isDark ? '#19191a' : '#ffffff'}
        />

        {/* Header */}
        <View className="bg-white dark:bg-gray-900 px-4 pt-14 pb-3 border-b border-gray-100 dark:border-gray-800">
          <View className="flex-row items-center justify-between mb-3">
            <TouchableOpacity
              onPress={() => router.back()}
              className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 items-center justify-center"
            >
              <Ionicons name="arrow-back" size={20} color={isDark ? '#D1D5DB' : '#374151'} />
            </TouchableOpacity>

            <Text className="text-xl font-bold text-gray-900 dark:text-foreground-dark">
              Thông báo
            </Text>

            <View className="flex-row items-center gap-2">
              {unreadCount > 0 && (
                <TouchableOpacity
                  onPress={handleMarkAllRead}
                  className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-950/40 items-center justify-center"
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="checkmark-done-outline" size={18} color="#2563EB" />
                </TouchableOpacity>
              )}
              {readCount > 0 && (
                <TouchableOpacity
                  onPress={handleDeleteRead}
                  className="w-9 h-9 rounded-full bg-red-100 dark:bg-red-950/40 items-center justify-center"
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="trash-outline" size={18} color="#EF4444" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Unread toggle + count */}
          <View className="flex-row items-center justify-between">
            <TouchableOpacity
              onPress={() => setShowUnread((v) => !v)}
              className={`flex-row items-center gap-2 px-3 py-1.5 rounded-full border ${
                showUnread
                  ? 'bg-blue-500 border-blue-500'
                  : 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
              }`}
            >
              <Text
                className={`text-xs font-semibold ${
                  showUnread ? 'text-white' : 'text-gray-600 dark:text-gray-300'
                }`}
              >
                {showUnread ? 'Chưa đọc' : 'Tất cả'}
              </Text>
              {unreadCount > 0 && (
                <View className={`px-1.5 py-0.5 rounded-full ${showUnread ? 'bg-white/30' : 'bg-blue-500'}`}>
                  <Text className={`text-[10px] font-bold ${showUnread ? 'text-white' : 'text-white'}`}>
                    {unreadCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Tabs */}
        <View className="bg-white dark:bg-gray-900 flex-row border-b border-gray-100 dark:border-gray-800">
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              onPress={() => { setActiveTab(tab.key); setShowUnread(false); }}
              className={`flex-1 py-3 items-center border-b-2 ${
                activeTab === tab.key && !showUnread
                  ? 'border-blue-500'
                  : 'border-transparent'
              }`}
            >
              <Text
                className={`text-xs font-semibold ${
                  activeTab === tab.key && !showUnread
                    ? 'text-blue-600'
                    : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* List */}
        <FlatList
          data={visible}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<EmptyState />}
        />
      </View>
    </AuthGuard>
  );
};

export default NotificationScreen;
